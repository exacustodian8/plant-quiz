import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Quiz } from './quiz';
import { QUESTIONS } from '../quiz-data';
import { Plant } from '../plant';

const PLANTS: Plant[] = [
  { id: 'snake', image: 'plants/snake.jpg', credit: { author: 'A', license: 'CC0', source: '' }, name: 'Snake Plant', scientific: 'D. t.', emoji: '🌿', blurb: '', watering: 'minimum',
    sunlight: ['full_shade', 'part_shade', 'full_sun'], petFriendly: true, vibe: 'calm' },
];

describe('Quiz', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Quiz],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('starts on the first question and goes back', async () => {
    const fixture = TestBed.createComponent(Quiz);
    TestBed.inject(HttpTestingController).expectOne('plants.json').flush(PLANTS);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('h2')?.textContent).toContain(QUESTIONS[0].text);
    expect(el.querySelector('.count')?.textContent).toContain('Question 1 of 4');

    el.querySelector<HTMLButtonElement>('.option')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.count')?.textContent).toContain('Question 2 of 4');

    el.querySelector<HTMLButtonElement>('.link')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.count')?.textContent).toContain('Question 1 of 4');
  });

  it('saves answers and redirects to the best plant when finished', async () => {
    const fixture = TestBed.createComponent(Quiz);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(HttpTestingController).expectOne('plants.json').flush(PLANTS);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    for (let i = 0; i < QUESTIONS.length; i++) {
      el.querySelector<HTMLButtonElement>('.option')!.click();
      await fixture.whenStable();
    }

    expect(navigate).toHaveBeenCalledWith(['/plant', 'snake']);
    expect(JSON.parse(localStorage.getItem('plantquiz:traits')!)).toMatchObject({ watering: 'minimum' });
  });
});
