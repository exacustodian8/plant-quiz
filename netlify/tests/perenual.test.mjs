// Run with: npm run test:functions   (node's built-in test runner, no dependencies)
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import handler, { upstreamFor } from '../functions/perenual.mjs';

const get = (path) => handler(new Request(`https://site.test${path}`));

describe('upstreamFor', () => {
  it('forwards only whitelisted, valid list parameters', () => {
    const t = upstreamFor('/api/perenual/species-list', new URLSearchParams(
      'indoor=1&page=2&q=aloe&watering=minimum&sunlight=full_sun&poisonous=0&edible=1&cycle=perennial&hardiness=5' +
      '&key=STOLEN&evil=1&watering=lava&page=abc&hardiness=99&q=',
    ));
    assert.equal(t.kind, 'list');
    // last valid wins per name; unknown names, bad values and a client-supplied key are all dropped
    assert.deepEqual(Object.fromEntries(t.params), {
      indoor: '1', page: '2', q: 'aloe', watering: 'minimum', sunlight: 'full_sun',
      poisonous: '0', edible: '1', cycle: 'perennial', hardiness: '5',
    });
    assert.equal(t.params.has('key'), false);
  });

  it('understands both URL shapes the function can be reached by', () => {
    assert.equal(upstreamFor('/.netlify/functions/perenual/species-list', new URLSearchParams()).kind, 'list');
    assert.equal(upstreamFor('/api/perenual/species-list/', new URLSearchParams()).kind, 'list');
  });

  it('allows details only for numeric ids', () => {
    assert.equal(upstreamFor('/api/perenual/species/details/425', new URLSearchParams()).url, 'https://perenual.com/api/v2/species/details/425');
    assert.equal(upstreamFor('/api/perenual/species/details/abc', new URLSearchParams()), null);
    assert.equal(upstreamFor('/api/perenual/species/details/1/../../x', new URLSearchParams()), null);
  });

  it('refuses every other endpoint', () => {
    for (const p of ['/api/perenual/user/api', '/api/perenual/pest-disease-list', '/api/perenual/', '/api/perenual']) {
      assert.equal(upstreamFor(p, new URLSearchParams()), null, p);
    }
  });
});

describe('handler', () => {
  const realFetch = globalThis.fetch;
  let calls;
  let reply;

  beforeEach(() => {
    process.env.PERENUAL_KEY = 'secret-key';
    calls = [];
    reply = () => new Response('{"data":[]}', { status: 200, headers: { 'content-type': 'application/json', 'x-ratelimit-remaining': '57' } });
    globalThis.fetch = async (url, init) => { calls.push(String(url)); return reply(); };
  });
  afterEach(() => { globalThis.fetch = realFetch; delete process.env.PERENUAL_KEY; });

  it('adds the secret key server-side and never echoes it back', async () => {
    const res = await get('/api/perenual/species-list?indoor=1&key=client-key');
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /key=secret-key/);
    assert.doesNotMatch(calls[0], /client-key/);
    assert.doesNotMatch(await res.text() + JSON.stringify([...res.headers]), /secret-key/);
  });

  it('caches good responses on the CDN for six hours and exposes the remaining quota', async () => {
    const res = await get('/api/perenual/species-list?page=1');
    assert.match(res.headers.get('netlify-cdn-cache-control'), /s-maxage=21600/);
    assert.equal(res.headers.get('x-ratelimit-remaining'), '57');
  });

  it('never caches quota errors, so the site recovers as soon as the limit resets', async () => {
    reply = () => new Response('', { status: 429 });
    const res = await get('/api/perenual/species-list');
    assert.equal(res.status, 429);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('netlify-cdn-cache-control'), null);
  });

  it('remembers premium-only (429) details briefly to save requests', async () => {
    reply = () => new Response('', { status: 429 });
    const res = await get('/api/perenual/species/details/8387');
    assert.match(res.headers.get('netlify-cdn-cache-control'), /s-maxage=600/);
  });

  it('rejects other methods and unknown paths without calling Perenual', async () => {
    assert.equal((await handler(new Request('https://site.test/api/perenual/species-list', { method: 'POST' }))).status, 405);
    assert.equal((await get('/api/perenual/user/api')).status, 404);
    assert.equal(calls.length, 0);
  });

  it('fails clearly when the key is not configured', async () => {
    delete process.env.PERENUAL_KEY;
    assert.equal((await get('/api/perenual/species-list')).status, 500);
    assert.equal(calls.length, 0);
  });

  it('turns a network failure into a 502', async () => {
    globalThis.fetch = async () => { throw new Error('boom'); };
    assert.equal((await get('/api/perenual/species-list')).status, 502);
  });
});
