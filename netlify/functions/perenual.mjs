// Netlify Function: a small, cached, locked-down proxy in front of the Perenual API.
//
//  - The API key lives in the PERENUAL_KEY environment variable and never reaches the browser.
//  - Only the two endpoints the app uses are forwarded, with a whitelist of validated parameters,
//    so this can't be used as an open relay to spend the key's quota.
//  - Successful responses are cached on Netlify's CDN for 6 hours and shared by every visitor
//    (Perenual's image links expire after 24h, so the cache must stay well under that).

const ORIGIN = 'https://perenual.com/api/v2';
const SIX_HOURS = 6 * 60 * 60;

const int = (min, max) => (v) => /^\d{1,5}$/.test(v) && +v >= min && +v <= max;
const oneOf = (...allowed) => (v) => allowed.includes(v);

/** The only query parameters forwarded to species-list, and what each may contain. */
const LIST_PARAMS = {
  page: int(1, 2000),
  q: (v) => v.length > 0 && v.length <= 60,
  indoor: oneOf('0', '1'),
  poisonous: oneOf('0', '1'),
  edible: oneOf('0', '1'),
  watering: oneOf('frequent', 'average', 'minimum', 'none'),
  sunlight: oneOf('full_shade', 'part_shade', 'sun-part_shade', 'full_sun'),
  cycle: oneOf('perennial', 'annual', 'biennial', 'biannual'),
  hardiness: int(1, 13),
};

const json = (body, status, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });

/** Maps a request path to the upstream URL (without the key), or null if it isn't allowed. */
export function upstreamFor(pathname, searchParams) {
  // works whether the function is reached as /api/perenual/... or /.netlify/functions/perenual/...
  const rest = /\/perenual\/(.*?)\/?$/.exec(pathname)?.[1] ?? '';

  if (rest === 'species-list') {
    const params = new URLSearchParams();
    for (const [name, value] of searchParams) {
      if (LIST_PARAMS[name]?.(value)) params.set(name, value);
    }
    return { url: `${ORIGIN}/species-list`, params, kind: 'list' };
  }
  if (/^species\/details\/\d{1,6}$/.test(rest)) {
    return { url: `${ORIGIN}/${rest}`, params: new URLSearchParams(), kind: 'details' };
  }
  return null;
}

/** How long the CDN may keep a response, by outcome. */
function cacheHeaders(status, kind) {
  if (status === 200) {
    return {
      'cache-control': 'public, max-age=300',
      'netlify-cdn-cache-control': `public, s-maxage=${SIX_HOURS}, stale-while-revalidate=3600`,
    };
  }
  // premium-only species answer 429 on the details endpoint every time: remember that briefly
  if (status === 429 && kind === 'details') {
    return { 'cache-control': 'public, max-age=60', 'netlify-cdn-cache-control': 'public, s-maxage=600' };
  }
  return { 'cache-control': 'no-store' }; // quota errors and failures must recover immediately
}

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405, { allow: 'GET' });

  const target = upstreamFor(new URL(req.url).pathname, new URL(req.url).searchParams);
  if (!target) return json({ error: 'Not found' }, 404);

  const key = globalThis.Netlify?.env?.get('PERENUAL_KEY') ?? process.env.PERENUAL_KEY;
  if (!key) return json({ error: 'The server has no PERENUAL_KEY configured' }, 500);

  target.params.set('key', key);
  let upstream;
  try {
    upstream = await fetch(`${target.url}?${target.params}`, { headers: { accept: 'application/json' } });
  } catch {
    return json({ error: 'Could not reach Perenual' }, 502);
  }

  const headers = {
    'content-type': upstream.headers.get('content-type') ?? 'application/json',
    ...cacheHeaders(upstream.status, target.kind),
  };
  // lets the app tell "premium-only plant" from "daily limit reached" (same-origin, so readable)
  const remaining = upstream.headers.get('x-ratelimit-remaining');
  if (remaining !== null) headers['x-ratelimit-remaining'] = remaining;

  return new Response(await upstream.text(), { status: upstream.status, headers });
};

export const config = { path: '/api/perenual/*' };
