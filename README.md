# PlantQuiz

Answer eight questions, get a plant that fits your life. Built with **Angular 22** (standalone components, signals, lazy routes) and live data from the [Perenual plant API](https://perenual.com/docs/api), served through a small caching proxy that keeps the API key out of the browser. The free plan gives access to a few hundred plants.

## How it works

- **The quiz is a search.** `matching.ts` turns the answers into API filters (`watering`, `sunlight`, `poisonous=0`, `edible`, `cycle`, `hardiness` zone, and `indoor` on/off to widen the pool of plants). If the strictest search finds too little, preferences are relaxed one at a time (least important first); pet safety and "indoors only" are never relaxed. Perenual has no "look" field, so the style question ranks results by botanical family on the client. Results are shuffled with a seed derived from the answers, so the API's fixed order doesn't make the same plant win every time. The match percentage says how many of your answers a result honours.
- **Built for a 100-requests/day free plan.** Shared CDN cache in production, a 6-hour browser cache (memory + `localStorage`), identical in-flight requests are shared, and one request feeds the whole home page. When the limit is hit the UI says so instead of breaking.
- **Premium-only species** (the free plan blocks the details endpoint for many popular plants) are handled: results come from the list endpoint, and share links carry the plant name (`/plant/8387?n=ZZ%20plant`) so the page can still be rebuilt with a name search.
- **Pet safety is only as good as the data.** Perenual's "not poisonous" flag has errors, so the UI says to verify with the ASPCA list.

## Angular features on show

A scroll-reactive background (pattern layers that cross-fade per section via an `appBg` directive and drift at different speeds, driven by one CSS custom property written per animation frame), signals (`signal`, `computed`, `linkedSignal`, `input()`), RxJS interop (`toSignal`, `toObservable`), route params and query params bound straight to inputs, lazy-loaded routes, view transitions, custom directives for scroll animation (`Reveal`, `FlyIn`), `@if/@for` control flow, typed HTTP with caching and error mapping, and unit tests with `HttpTestingController`.

## Credits

Plant data and photos: [Perenual](https://perenual.com). Each photo's licence is shown on its plant page.
