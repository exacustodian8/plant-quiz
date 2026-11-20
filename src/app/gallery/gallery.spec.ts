import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Gallery } from './gallery';
import { listRequest, page, raw } from '../testing';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Gallery', () => {
  let http: HttpTestingController;

  const setup = () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Gallery],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Gallery);
    const el: HTMLElement = fixture.nativeElement;
    const names = () => Array.from(el.querySelectorAll('app-plant-card h3')).map((h) => h.textContent!.trim());
    return { fixture, el, names };
  };

  afterEach(() => http.verify());

  it('searches the API and lists the results with a count', async () => {
    const { fixture, el, names } = setup();
    await fixture.whenStable();
    await wait(350); // the filter pipeline is debounced

    listRequest(http).flush(page([raw(1, 'aloe'), raw(2, 'fern')], { total: 381, last_page: 13 }));
    await fixture.whenStable();
    expect(names()).toEqual(['Aloe', 'Fern']);
    expect(el.querySelector('.result-count')?.textContent).toContain('2 of 381');
  });

  it('starts filtered by the ?sun= route input and sends it as a server-side filter', async () => {
    const { fixture } = setup();
    fixture.componentRef.setInput('sun', 'full_shade');
    await fixture.whenStable();
    await wait(350);

    const req = listRequest(http);
    expect(req.request.params.get('sunlight')).toBe('full_shade');
    req.flush(page([raw(1, 'fern')]));
  });

  it('ignores an unknown ?sun= value', async () => {
    const { fixture } = setup();
    fixture.componentRef.setInput('sun', 'nonsense');
    await fixture.whenStable();
    await wait(350);
    expect(listRequest(http).request.params.has('sunlight')).toBe(false);
  });

  it('debounces typing into a single search', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    await wait(350);
    listRequest(http).flush(page([raw(1, 'aloe')]));
    await fixture.whenStable();

    const input = el.querySelector<HTMLInputElement>('input[type=search]')!;
    for (const text of ['m', 'mo', 'mon']) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await wait(50);
    }
    await wait(350);
    const req = listRequest(http); // exactly one request for "mon"
    expect(req.request.params.get('q')).toBe('mon');
    req.flush(page([raw(5, 'monstera')]));
  });

  it('loads the next page and appends it', async () => {
    const { fixture, el, names } = setup();
    await fixture.whenStable();
    await wait(350);
    listRequest(http).flush(page([raw(1, 'aloe')], { last_page: 2, total: 2 }));
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('.more .btn')!.click();
    const next = listRequest(http, (r) => r.params.get('page') === '2');
    next.flush(page([raw(2, 'fern')], { last_page: 2, current_page: 2, total: 2 }));
    await fixture.whenStable();
    expect(names()).toEqual(['Aloe', 'Fern']);
    expect(el.querySelector('.more')).toBeNull(); // no more pages
  });

  it('shows the friendly notice when the daily limit is hit', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    await wait(350);
    listRequest(http).flush('', { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();
    expect(el.querySelector('.notice')?.textContent).toContain('resting');
  });
});
