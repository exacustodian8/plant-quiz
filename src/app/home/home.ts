import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PerenualService } from '../perenual.service';
import { QuizStore } from '../quiz-store';
import { PlantCard } from '../plant-card/plant-card';
import { Reveal } from '../motion/reveal';
import { FlyIn } from '../motion/fly-in';
import { Plant } from '../plant';

/** Indoor-plant list is 13 pages; show a different page each day so the site feels alive, but cacheably. */
function pageOfTheDay(): number {
  const day = Math.floor(Date.now() / 86_400_000);
  return (day % 13) + 1;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, PlantCard, Reveal, FlyIn],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private api = inject(PerenualService);
  protected store = inject(QuizStore);

  /** ONE request feeds the whole page: hero photos, flying photos, featured plants, plant count */
  private feed = toSignal(
    this.api.list({ page: pageOfTheDay() }).pipe(
      map((r) => ({ plants: r.plants, total: r.total })),
      catchError(() => of({ plants: [] as Plant[], total: 0 })),
    ),
    { initialValue: null },
  );

  private plants = computed(() => this.feed()?.plants ?? []);
  protected heroSlots = computed(() => [0, 1, 2].map((i) => this.plants()[i] ?? null));
  protected flyer = (i: number) => this.plants()[3 + i] ?? null;
  protected featured = computed(() => this.plants().slice(7, 10));
  protected quotaHit = this.api.quotaExhausted;

  protected facts = computed(() => [
    { value: this.feed()?.total ? String(this.feed()!.total) : '380+', label: 'indoor plants' },
    { value: '4', label: 'quick questions' },
    { value: '20s', label: 'to your result' },
  ]);

  steps = [
    { n: '01', title: 'Answer four questions', text: 'How forgetful, how sunny, how many pets, and whether you cook.' },
    { n: '02', title: 'We search the database', text: 'Your answers become live filters on a real plant database, relaxed step by step until something fits.' },
    { n: '03', title: 'Meet your match', text: 'See your best fit, plus runners-up, with a link you can share.' },
  ];

  lights = [
    { key: 'full_shade', title: 'Low light', text: 'Dim corners, north windows, curtains drawn.', icon: '🌑' },
    { key: 'part_shade', title: 'Bright, indirect', text: 'Soft daylight, no harsh midday sun.', icon: '🌤️' },
    { key: 'full_sun', title: 'Full sun', text: 'A big south-facing window all day.', icon: '☀️' },
  ];
}
