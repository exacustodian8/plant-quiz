import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Quiz } from './quiz';
import { QUESTIONS } from '../quiz-data';
import { listRequest, page, raw } from '../testing';

describe('Quiz', () => {
  let http: HttpTestingController;

  const setup = async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Quiz],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Quiz);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const answerAll = async () => {
      for (let i = 0; i < QUESTIONS.length; i++) {
        el.querySelector<HTMLButtonElement>('.option')!.click();
        await fixture.whenStable();
      }
    };
    return { fixture, el, answerAll };
  };

  afterEach(() => http.verify());

  it('starts on the first question and can go back', async () => {
    const { fixture, el } = await setup();
    expect(el.querySelector('h2')?.textContent).toContain(QUESTIONS[0].text);

    el.querySelector<HTMLButtonElement>('.option')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.count')?.textContent).toContain('Question 2 of 4');

    el.querySelector<HTMLButtonElement>('.link')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.count')?.textContent).toContain('Question 1 of 4');
  });

  it('turns the answers into one API search and opens the best plant', async () => {
    const { answerAll } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await answerAll();

    // first option of every question: rarely watered, low light, has pets, cooks
    const req = listRequest(http);
    const p = req.request.params;
    expect([p.get('watering'), p.get('sunlight'), p.get('poisonous'), p.get('edible')]).toEqual(['minimum', 'full_shade', '0', '1']);

    req.flush(page([raw(11, 'sweet-basil'), raw(12, 'mint'), raw(13, 'parsley'), raw(14, 'chives')]));
    expect(navigate).toHaveBeenCalledWith(['/plant', 11], { queryParams: { n: 'Sweet Basil' } });
    expect(JSON.parse(localStorage.getItem('plantquiz:traits')!)).toMatchObject({ watering: 'minimum', edible: true });
  });

  it('relaxes the search when the strict one finds too little', async () => {
    const { answerAll } = await setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await answerAll();

    listRequest(http, (r) => r.params.has('edible')).flush(page([raw(1, 'basil')])); // only 1 of the 4 wanted
    const relaxed = listRequest(http, (r) => !r.params.has('edible') && r.params.has('watering'));
    expect(relaxed.request.params.get('poisonous')).toBe('0'); // pet safety survives relaxing
    relaxed.flush(page([raw(1, 'basil'), raw(2, 'aloe'), raw(3, 'jade'), raw(4, 'cactus')]));
  });

  it('explains when the daily API limit is used up', async () => {
    const { fixture, el, answerAll } = await setup();
    await answerAll();
    listRequest(http).flush('', { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();
    expect(el.querySelector('.notice')?.textContent).toContain('resting');
  });

  it('says so when nothing matches', async () => {
    const { fixture, el, answerAll } = await setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await answerAll();
    // every relaxed search comes back empty
    for (let i = 0; i < 10; i++) {
      const open = http.match((r) => r.url.endsWith('/species-list'));
      if (!open.length) break;
      open.forEach((r) => r.flush(page([])));
      await fixture.whenStable();
    }
    expect(el.textContent).toContain('No plant fits that');
  });
});
