import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, debounceTime, switchMap, tap } from 'rxjs';
import { ApiErrorKind, ListQuery, PerenualService } from '../perenual.service';
import { PlantCard } from '../plant-card/plant-card';
import { ApiNotice } from '../api-notice/api-notice';
import { Reveal } from '../motion/reveal';
import { Plant, SUNLIGHT_LABEL, Sunlight, WATERING_LABEL, Watering } from '../plant';

type Light = Sunlight | 'all';
type Water = Exclude<Watering, 'none'> | 'all';

@Component({
  selector: 'app-gallery',
  imports: [PlantCard, ApiNotice, Reveal],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  private api = inject(PerenualService);

  /** bound from `?sun=full_shade` (withComponentInputBinding) */
  sunParam = input<string | undefined>(undefined, { alias: 'sun' });

  protected query = signal('');
  protected watering = signal<Water>('all');
  protected safeOnly = signal(false);
  /** starts from the URL, but the chips can still change it */
  protected light = linkedSignal<Light>(() => {
    const v = this.sunParam();
    return v && v in SUNLIGHT_LABEL ? (v as Sunlight) : 'all';
  });

  protected lights: { value: Light; label: string }[] = [
    { value: 'all', label: 'Any light' },
    ...(Object.keys(SUNLIGHT_LABEL) as Sunlight[]).map((k) => ({ value: k, label: SUNLIGHT_LABEL[k] })),
  ];
  protected waters: { value: Water; label: string }[] = [
    { value: 'all', label: 'Any watering' },
    { value: 'minimum', label: WATERING_LABEL.minimum },
    { value: 'average', label: WATERING_LABEL.average },
    { value: 'frequent', label: WATERING_LABEL.frequent },
  ];

  protected plants = signal<Plant[]>([]);
  protected total = signal(0);
  protected status = signal<'loading' | 'ready' | 'error'>('loading');
  protected error = signal<ApiErrorKind>('network');
  protected loadingMore = signal(false);

  private page = signal(1);
  private lastPage = signal(1);
  protected canLoadMore = computed(() => this.page() < this.lastPage());

  /** every filter change becomes a new server-side search (debounced for typing) */
  private filters = computed<ListQuery>(() => ({
    q: this.query(),
    sunlight: this.light() === 'all' ? undefined : (this.light() as Sunlight),
    watering: this.watering() === 'all' ? undefined : (this.watering() as Watering),
    safe: this.safeOnly(),
  }));

  constructor() {
    toObservable(this.filters)
      .pipe(
        debounceTime(300),
        tap(() => this.status.set('loading')),
        switchMap((f) =>
          this.api.list({ ...f, page: 1 }).pipe(
            catchError((err: { kind?: ApiErrorKind }) => {
              this.error.set(err.kind ?? 'network');
              this.status.set('error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.plants.set(res.plants);
        this.total.set(res.total);
        this.page.set(res.page);
        this.lastPage.set(res.lastPage);
        this.status.set('ready');
      });
  }

  protected onSearch(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
  }

  protected loadMore() {
    if (this.loadingMore() || !this.canLoadMore()) return;
    this.loadingMore.set(true);
    this.api.list({ ...this.filters(), page: this.page() + 1 }).subscribe({
      next: (res) => {
        // the same plant can appear on two pages once duplicates are removed
        const seen = new Set(this.plants().map((p) => p.id));
        this.plants.update((cur) => [...cur, ...res.plants.filter((p) => !seen.has(p.id))]);
        this.page.set(res.page);
        this.loadingMore.set(false);
      },
      error: (err: { kind?: ApiErrorKind }) => {
        this.loadingMore.set(false);
        this.error.set(err.kind ?? 'network');
        this.status.set('error');
      },
    });
  }

  protected reset() {
    this.query.set('');
    this.light.set('all');
    this.watering.set('all');
    this.safeOnly.set(false);
  }

  protected retry() {
    this.status.set('loading');
    this.api.list({ ...this.filters(), page: 1 }).subscribe({
      next: (res) => {
        this.plants.set(res.plants);
        this.total.set(res.total);
        this.page.set(res.page);
        this.lastPage.set(res.lastPage);
        this.status.set('ready');
      },
      error: (err: { kind?: ApiErrorKind }) => {
        this.error.set(err.kind ?? 'network');
        this.status.set('error');
      },
    });
  }
}
