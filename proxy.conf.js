// Dev-server proxy: makes `ng serve` behave like the Netlify function in production.
// The browser calls /api/perenual/...; this adds the API key (from .env or the environment) on the way out.
const fs = require('fs');
const path = require('path');

function loadKey() {
  if (process.env.PERENUAL_KEY) return process.env.PERENUAL_KEY;
  try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const line = env.split(/\r?\n/).find((l) => /^\s*PERENUAL_KEY\s*=/.test(l));
    if (line) return line.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  } catch {
    /* no .env file */
  }
  return null;
}

const key = loadKey();
if (!key) {
  console.warn('\n[proxy] No PERENUAL_KEY found. Copy .env.example to .env and add your key, or the plant API calls will fail.\n');
}

module.exports = {
  '/api/perenual': {
    target: 'https://perenual.com',
    changeOrigin: true,
    secure: true,
    // `rewrite` (Vite's option): Angular's dev server only converts an object-style `pathRewrite`
    rewrite: (p) => {
      const rest = p.replace(/^\/api\/perenual\/?/, '');
      return `/api/v2/${rest}${rest.includes('?') ? '&' : '?'}key=${encodeURIComponent(key ?? '')}`;
    },
  },
};
