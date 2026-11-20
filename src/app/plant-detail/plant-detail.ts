import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { ApiErrorKind, PerenualService } from '../perenual.service';
import { QuizStore } from '../quiz-store';
import { PlantCard } from '../plant-card/plant-card';
import { ApiNotice } from '../api-notice/api-notice';
import { BgSection } from '../motion/background';
import { Plant, SUNLIGHT_LABEL, Sunlight, WATERING_LABEL } from '../plant';

@Component({
  selector: 'app-plant-detail',
  imports: [RouterLink, PlantCard, ApiNotice, BgSection],
  templateUrl: './plant-detail.html',
  styleUrl: './plant-detail.css',
})
export class PlantDetail {
  /** both bound from the route (withComponentInputBinding): /plant/:id?n=Name */
  id = input.required<string>();
  n = input<string | undefined>(undefined);

  private api = inject(PerenualService);
  protected store = inject(QuizStore);

  private loaded = signal<Plant | null>(null);
  protected error = signal<ApiErrorKind | null>(null);

  /** present only if the visitor took the quiz and this plant was in their results */
  protected myMatch = computed(() => this.store.matches().find((m) => m.plant.id === Number(this.id())) ?? null);
  protected isTopMatch = computed(() => this.store.topMatch()?.plant.id === Number(this.id()));
  protected alsoGood = computed(() => this.store.matches().filter((m) => m.plant.id !== Number(this.id())).slice(0, 2));

  /** the fetched plant, plus whatever traits the quiz search already told us about it */
  protected plant = computed(() => {
    const p = this.loaded();
    if (!p) return null;
    const m = this.myMatch()?.plant;
    return {
      ...p,
      watering: p.watering ?? m?.watering,
      sunlight: p.sunlight ?? m?.sunlight,
      petFriendly: p.petFriendly ?? m?.petFriendly,
      edible: p.edible ?? m?.edible,
    };
  });

  protected showPetNote = computed(() => this.plant()?.petFriendly === true || this.store.traits()?.petFriendly === true);

  protected copied = signal(false);
  protected expanded = signal(false);
  protected watering = WATERING_LABEL;
  protected sunlight = SUNLIGHT_LABEL;

  constructor() {
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.expanded.set(false);
          this.loaded.set(null);
          this.error.set(null);
        }),
        switchMap((id) =>
          this.api.resolve(Number(id), this.n()).pipe(
            catchError((err: { kind?: ApiErrorKind }) => {
              this.error.set(err.kind ?? 'network');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((p) => this.loaded.set(p));
  }

  protected lightText(levels: Sunlight[]): string {
    return [...new Set(levels.map((s) => SUNLIGHT_LABEL[s]))].join(" / ");
  }

  protected retry() {
    this.error.set(null);
    this.loaded.set(null);
    this.api.resolve(Number(this.id()), this.n()).subscribe({
      next: (p) => this.loaded.set(p),
      error: (err: { kind?: ApiErrorKind }) => this.error.set(err.kind ?? 'network'),
    });
  }

  protected async share() {
    const p = this.plant();
    if (!p) return;
    // the name rides along so the link also works for premium-only plants
    const url = `${location.origin}/plant/${p.id}?n=${encodeURIComponent(p.name)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: `I'm a ${p.name}! Which plant are you?`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* user cancelled the share sheet / clipboard blocked */
    }
  }
}
