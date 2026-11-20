# PlantQuiz

Answer eight questions, get a plant that fits your life. Built with **Angular 22** (standalone components, signals, lazy routes) and live data from the [Perenual plant API](https://perenual.com/docs/api), served through a small caching proxy.

## Run it locally

You need a free Perenual API key (https://perenual.com/user/api).

```bash
npm install
cp .env.example .env     # then paste your key into .env
npm start                # http://localhost:4200
npm test                 # Angular unit tests (no API calls, no quota used)
npm run test:functions   # tests for the proxy function
```

The browser never sees the key. It calls `/api/perenual/...` on its own origin; under `npm start` the dev server (`proxy.conf.js`) adds the key from `.env`, and in production a Netlify Function does (`netlify/functions/perenual.mjs`). `.env` is gitignored.

## Deploy (Netlify)

1. Push the repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo. `netlify.toml` already sets the build command, publish folder, Node version, function folder and the single-page-app redirect.
3. **Site configuration → Environment variables**: add `PERENUAL_KEY` (your key). Redeploy.

The proxy only forwards the two endpoints the app uses with a whitelist of validated parameters (so it can't be used as an open relay), and caches good responses on Netlify's CDN for 6 hours, shared by every visitor. Perenual's image links expire after 24 hours, which is why the cache must stay well below that. Quota errors are never cached, so the site recovers as soon as the daily limit resets.

## How it works

- **The quiz is a search.** `matching.ts` turns the answers into API filters (`watering`, `sunlight`, `poisonous=0`, `edible`, `cycle`, `hardiness` zone, and `indoor` on/off to open up the full 10,000-plant database). If the strictest search finds too little, preferences are relaxed one at a time (least important first); pet safety and "indoors only" are never relaxed. Perenual has no "look" field, so the style question ranks results by botanical family on the client. Results are shuffled with a seed derived from the answers, so the API's fixed order doesn't make the same plant win every time. The match percentage says how many of your answers a result honours.
- **Built for a 100-requests/day free plan.** Shared CDN cache in production, a 6-hour browser cache (memory + `localStorage`), identical in-flight requests are shared, and one request feeds the whole home page. When the limit is hit the UI says so instead of breaking.
- **Premium-only species** (the free plan blocks the details endpoint for many popular plants) are handled: results come from the list endpoint, and share links carry the plant name (`/plant/8387?n=ZZ%20plant`) so the page can still be rebuilt with a name search.
- **Pet safety is only as good as the data.** Perenual's "not poisonous" flag has errors, so the UI says to verify with the ASPCA list.

## Angular features on show

A scroll-reactive background (pattern layers that cross-fade per section via an `appBg` directive and drift at different speeds, driven by one CSS custom property written per animation frame), signals (`signal`, `computed`, `linkedSignal`, `input()`), RxJS interop (`toSignal`, `toObservable`), route params and query params bound straight to inputs, lazy-loaded routes, view transitions, custom directives for scroll animation (`Reveal`, `FlyIn`), `@if/@for` control flow, typed HTTP with caching and error mapping, and unit tests with `HttpTestingController`.

## Credits

Plant data and photos: [Perenual](https://perenual.com). Each photo's licence is shown on its plant page.
