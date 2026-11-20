import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, toArray } from 'rxjs';
import { ApiError, PerenualService } from './perenual.service';
import { detailsRequest, listRequest, page, raw, rawLocked } from './testing';

describe('PerenualService', () => {
  let api: PerenualService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(PerenualService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('turns filters into API params and tidies the response', async () => {
    const result = firstValueFrom(api.list({ watering: 'minimum', sunlight: 'full_sun', safe: true, edible: true, q: ' aloe ' }));
    const req = listRequest(http);
    const p = req.request.params;
    expect([p.get('indoor'), p.get('watering'), p.get('sunlight'), p.get('poisonous'), p.get('edible'), p.get('q')]).toEqual([
      '1', 'minimum', 'full_sun', '0', '1', 'aloe',
    ]);
    // the browser only talks to the same-origin proxy and never holds an API key
    expect(req.request.url).toBe('/api/perenual/species-list');
    expect(p.has('key')).toBe(false);

    // a plant without a photo and a duplicate name are dropped; names are prettified;
    // a plant with no common name falls back to its scientific name
    req.flush(page([raw(1, 'flowering-maple'), raw(2, 'no-photo', false), raw(3, 'flowering-maple'), raw(4, null)]));
    const { plants } = await result;
    expect(plants.map((x) => x.name)).toEqual(['Flowering Maple', 'Unknown Sp.']);
    expect(plants[0].credit).toEqual({ license: 'CC BY 2.0', url: 'https://cc.test' });
  });

  it('answers repeat searches from the cache, saving the 100-a-day quota', async () => {
    const first = firstValueFrom(api.list({ sunlight: 'full_shade' }));
    listRequest(http).flush(page([raw(1, 'fern')]));
    await first;

    const again = await firstValueFrom(api.list({ sunlight: 'full_shade' }));
    http.expectNone((r) => r.url.endsWith('/species-list'));
    expect(again.plants[0].name).toBe('Fern');
    expect(localStorage.getItem('pq:v1:list?page=1&indoor=1&sunlight=full_shade')).toBeTruthy();
  });

  it('shares one request between simultaneous identical searches', () => {
    api.list({ q: 'palm' }).subscribe();
    api.list({ q: 'palm' }).subscribe();
    listRequest(http).flush(page([raw(1, 'palm')])); // expectOne would throw if there were two
  });

  it('reports the daily limit as "quota" and remembers it', async () => {
    const result = firstValueFrom(api.list());
    listRequest(http).flush('', { status: 429, statusText: 'Too Many Requests' });
    await expect(result).rejects.toMatchObject({ kind: 'quota' });
    expect(api.quotaExhausted()).toBe(true);
  });

  it('reports a premium-only species as "locked", not as a quota problem', async () => {
    const result = firstValueFrom(api.details(8387));
    detailsRequest(http, 8387).flush('', { status: 429, statusText: 'Too Many Requests' });
    await expect(result).rejects.toMatchObject({ kind: 'locked' });
    expect(api.quotaExhausted()).toBe(false);
  });

  it('treats a details 429 as the daily limit when the proxy reports no requests left', async () => {
    const result = firstValueFrom(api.details(425));
    detailsRequest(http, 425).flush('', { status: 429, statusText: 'Too Many Requests', headers: { 'X-RateLimit-Remaining': '0' } });
    await expect(result).rejects.toMatchObject({ kind: 'quota' });
    expect(api.quotaExhausted()).toBe(true);
  });

  it('shows a known plant at once, then adds the details', async () => {
    const seen = firstValueFrom(api.list());
    listRequest(http).flush(page([raw(7, 'jade-plant')]));
    await seen;

    const emitted = firstValueFrom(api.resolve(7).pipe(toArray()));
    detailsRequest(http, 7).flush({ ...raw(7, 'jade-plant'), description: 'Sturdy.', care_level: 'Low', watering: 'Minimum', sunlight: ['full sun'], poisonous_to_pets: 1 });
    const [first, second] = await emitted;
    expect(first.description).toBeUndefined();
    expect(second).toMatchObject({ name: 'Jade Plant', description: 'Sturdy.', careLevel: 'Low', watering: 'minimum', sunlight: ['full_sun'], petFriendly: false });
  });

  it('still finds a premium-only plant from a share link by searching its name', async () => {
    const result = firstValueFrom(api.resolve(8387, 'ZZ Plant'));
    detailsRequest(http, 8387).flush('', { status: 429, statusText: 'Too Many Requests' });
    listRequest(http, (r) => r.params.get('q') === 'ZZ Plant').flush(page([raw(100, 'zz-other'), raw(8387, 'zz-plant')]));
    expect((await result).id).toBe(8387);
  });

  it('hides premium-only plants (placeholder photo) from normal listings', async () => {
    const result = firstValueFrom(api.list());
    listRequest(http).flush(page([raw(1, 'fern'), rawLocked(2, 'zz-plant')]));
    expect((await result).plants.map((p) => p.name)).toEqual(['Fern']);
  });

  it('keeps same-named cultivars apart in a share-link lookup, with no photo instead of the placeholder', async () => {
    const result = firstValueFrom(api.resolve(8387, 'ZZ Plant'));
    detailsRequest(http, 8387).flush('', { status: 429, statusText: 'Too Many Requests' });
    // two cultivars share the common name "ZZ plant"; id 8387 must not be lost to de-duplication
    listRequest(http).flush(page([rawLocked(8386, 'zz-plant'), rawLocked(8387, 'zz-plant')]));
    const plant = await result;
    expect(plant.id).toBe(8387);
    expect(plant.image).toBeNull();
    expect(plant.credit).toBeNull();
  });

  it('gives up on a premium-only plant when there is neither cache nor a name', async () => {
    const result = firstValueFrom(api.resolve(8387));
    detailsRequest(http, 8387).flush('', { status: 429, statusText: 'Too Many Requests' });
    await expect(result).rejects.toBeInstanceOf(ApiError);
  });
});
