import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, of, switchMap, map, tap, catchError, throwError, shareReplay } from 'rxjs';
import { Traits } from './quiz-data';
import { Plant } from './plant';
import { buildTiers } from './matching';
import { ApiError, ApiErrorKind, PerenualService } from './perenual.service';

const KEY = 'plantquiz:traits';
const WANT = 4; // best match + three runners-up

export interface Match {
  plant: Plant;
  percent: number;
}

export type MatchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; matches: Match[] }
  | { status: 'error'; kind: ApiErrorKind };

function load(): Partial<Traits> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Traits>) : null;
  } catch {
    return null;
  }
}

/** Remembers the visitor's answers and finds matching plants through the API. */
@Injectable({ providedIn: 'root' })
export class QuizStore {
  private api = inject(PerenualService);

  readonly traits = signal<Partial<Traits> | null>(load());
  readonly state = signal<MatchState>({ status: 'idle' });

  readonly matches = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.matches : [];
  });
  readonly topMatch = computed(() => this.matches()[0] ?? null);

  constructor() {
    effect(() => {
      const t = this.traits();
      try {
        if (t) localStorage.setItem(KEY, JSON.stringify(t));
        else localStorage.removeItem(KEY);
      } catch {
        /* storage unavailable: still works, just doesn't persist */
      }
    });

    // returning visitor: restore their result (cheap, because list responses are cached)
    const saved = this.traits();
    if (saved) this.run(saved).subscribe({ error: () => undefined });
  }

  /** Saves the answers and searches. Emits the matches (best first). */
  start(traits: Partial<Traits>): Observable<Match[]> {
    this.traits.set(traits);
    return this.run(traits);
  }

  clear() {
    this.traits.set(null);
    this.state.set({ status: 'idle' });
  }

  private run(traits: Partial<Traits>): Observable<Match[]> {
    this.state.set({ status: 'loading' });
    const tiers = buildTiers(traits);

    // strictest search first; relax only while we still have too few results
    const collect = (i: number, acc: Match[]): Observable<Match[]> => {
      if (i >= tiers.length || acc.length >= WANT) return of(acc);
      const { query, percent } = tiers[i];
      return this.api.list(query).pipe(
        map((res) =>
          res.plants
            .filter((p) => !acc.some((m) => m.plant.id === p.id))
            .slice(0, WANT - acc.length)
            .map((p): Match => ({
              percent,
              plant: {
                ...p,
                ...(query.watering && { watering: query.watering }),
                ...(query.sunlight && { sunlight: [query.sunlight] }),
                ...(query.safe && { petFriendly: true }),
                ...(query.edible && { edible: true }),
              },
            })),
        ),
        switchMap((more) => collect(i + 1, [...acc, ...more])),
      );
    };

    return collect(0, []).pipe(
      tap((matches) => this.state.set({ status: 'ready', matches })),
      catchError((err: unknown) => {
        this.state.set({ status: 'error', kind: err instanceof ApiError ? err.kind : 'network' });
        return throwError(() => err);
      }),
      shareReplay(1),
    );
  }
}
