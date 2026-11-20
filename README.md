# PlantQuiz

Answer four questions, get a houseplant that fits your life. Built with **Angular 22** (standalone components, signals, lazy routes) and live data from the [Perenual plant API](https://perenual.com/docs/api).

## Run it

You need a free Perenual API key (https://perenual.com/user/api).

```bash
npm install
cp src/app/config.example.ts src/app/config.ts   # then paste your key into config.ts
npm start                                         # http://localhost:4200
npm test                                          # unit tests (no API calls, no quota used)
```

`src/app/config.ts` is gitignored so the key never reaches the repo. Note that any key used by a browser app is visible in the shipped JavaScript; Perenual keys only grant read access to a rate-limited free API, but don't reuse a key that has billing attached.

## How it works

- **The quiz is a search.** `matching.ts` turns the answers into API filters (`watering`, `sunlight`, `poisonous=0`, `edible`). If the strictest search finds too little, preferences are relaxed one at a time (least important first); pet safety is never relaxed. The match percentage says how many of your answers a result honours.
- **Built for a 100-requests/day free plan.** Responses are cached for 6 hours (memory + `localStorage`; Perenual's image links expire after 24 h), identical in-flight requests are shared, and one request feeds the whole home page. When the limit is hit the UI says so instead of breaking.
- **Premium-only species** (the free plan blocks the details endpoint for many popular plants) are handled: results come from the list endpoint, and share links carry the plant name (`/plant/8387?n=ZZ%20plant`) so the page can still be rebuilt with a name search.
- **Pet safety is only as good as the data.** Perenual's "not poisonous" flag has errors, so the UI says to verify with the ASPCA list.

## Angular features on show

Signals (`signal`, `computed`, `linkedSignal`, `input()`), RxJS interop (`toSignal`, `toObservable`), route params and query params bound straight to inputs, lazy-loaded routes, view transitions, custom directives for scroll animation (`Reveal`, `FlyIn`), `@if/@for` control flow, typed HTTP with caching and error mapping, and unit tests with `HttpTestingController`.

## Credits

Plant data and photos: [Perenual](https://perenual.com). Each photo's licence is shown on its plant page.
