import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, concat, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { PERENUAL_KEY } from './config';
import { Plant, Sunlight, Watering } from './plant';
import { RawDetails, RawList, detailsToPartial, toPlant } from './perenual';

const BASE = 'https://perenual.com/api/v2';

/**
 * The free plan allows 100 requests/day for everybody, and Perenual's image links
 * expire after 24h, so responses are cached for 6h (memory + localStorage).
 */
const TTL_MS = 6 * 60 * 60 * 1000;
const PREFIX = 'pq:v1:';

export type ApiErrorKind =
  | 'quota' // daily limit reached
  | 'locked' // species details are premium-only on the free plan
  | 'notfound'
  | 'network';

export class ApiError extends Error {
  constructor(readonly kind: ApiErrorKind) {
    super(kind);
  }
}

export interface ListQuery {
  q?: string;
  page?: number;
  watering?: Watering;
  sunlight?: Sunlight;
  /** only plants Perenual marks as not poisonous */
  safe?: boolean;
  edible?: boolean;
}

export interface ListResult {
  plants: Plant[];
  page: number;
  lastPage: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PerenualService {
  private http = inject(HttpClient);
  private inflight = new Map<string, Observable<unknown>>();

  /** every plant seen so far, so a plant page can render instantly from a list click */
  private known = new Map<number, Plant>();

  /** true once any call was rejected for hitting the daily limit */
  readonly quotaExhausted = signal(false);

  /**
   * Indoor plants only; filters are applied by Perenual, not in the browser.
   * Normal results hide plants without a real photo and duplicate names; `raw` keeps everything.
   */
  list(query: ListQuery = {}, raw = false): Observable<ListResult> {
    const params: Record<string, string> = { indoor: '1', page: String(query.page ?? 1) };
    if (query.q?.trim()) params['q'] = query.q.trim();
    if (query.watering) params['watering'] = query.watering;
    if (query.sunlight) params['sunlight'] = query.sunlight;
    if (query.safe) params['poisonous'] = '0';
    if (query.edible) params['edible'] = '1';

    const key = `list?${new URLSearchParams(params)}${raw ? "&raw" : ""}`;
    return this.cached<ListResult>(key, () =>
      this.http.get<RawList>(`${BASE}/species-list`, { params: this.withKey(params) }).pipe(
        map((res) => ({
          plants: raw ? res.data.map((s) => toPlant(s)) : dedupe(res.data.map((s) => toPlant(s)).filter((p) => p.image)),
          page: res.current_page,
          lastPage: res.last_page,
          total: res.total,
        })),
      ),
    ).pipe(
      map((res) => ({ ...res, plants: res.plants.map((p) => this.remember(p)) })),
    );
  }

  /** Optional enrichment. Throws ApiError('locked') for premium-only species. */
  details(id: number): Observable<Plant> {
    return this.cached<Plant>(
      `details/${id}`,
      () =>
        this.http
          .get<RawDetails>(`${BASE}/species/details/${id}`, { params: this.withKey({}) })
          .pipe(map((d) => toPlant(d, stripUndefined(detailsToPartial(d))))),
      true,
    );
  }

  /**
   * Resolves one plant for the detail page. Emits what we already know straight away,
   * then the enriched version. `nameHint` rescues share links to premium-only plants:
   * those can't use the details endpoint, but a name search finds them.
   */
  resolve(id: number, nameHint?: string): Observable<Plant> {
    const known = this.known.get(id);
    const enriched$ = this.details(id).pipe(
      map((d) => this.remember({ ...this.known.get(id), ...stripUndefined(d) } as Plant)),
      catchError((err: ApiError) => {
        if (err.kind !== 'locked' && err.kind !== 'notfound') return throwError(() => err);
        if (known) return of(known);
        if (!nameHint) return throwError(() => new ApiError('locked'));
        // raw: premium-only plants have a placeholder photo and often share a name with a sibling cultivar
        return this.list({ q: nameHint }, true).pipe(
          map((r) => {
            const found = r.plants.find((p) => p.id === id);
            if (!found) throw new ApiError('notfound');
            return found;
          }),
        );
      }),
    );
    return known ? concat(of(known), enriched$) : enriched$;
  }

  // ---- internals ----

  private remember(p: Plant): Plant {
    const merged = { ...this.known.get(p.id), ...p };
    this.known.set(p.id, merged);
    return merged;
  }

  private withKey(params: Record<string, string>) {
    return new HttpParams({ fromObject: { ...params, key: PERENUAL_KEY } });
  }

  private cached<T>(key: string, fetch: () => Observable<T>, isDetails = false): Observable<T> {
    const hit = readCache<T>(key);
    if (hit !== undefined) return of(hit);

    let shared = this.inflight.get(key) as Observable<T> | undefined;
    if (!shared) {
      shared = fetch().pipe(
        tap((value) => writeCache(key, value)),
        catchError((err: HttpErrorResponse) => throwError(() => this.toApiError(err, isDetails))),
        tap({ finalize: () => this.inflight.delete(key) }),
        shareReplay(1),
      );
      this.inflight.set(key, shared);
    }
    return shared;
  }

  private toApiError(err: HttpErrorResponse, isDetails: boolean): ApiError {
    if (err.status === 429) {
      // On the free plan a premium species answers 429 too, so only list calls prove the daily limit.
      if (isDetails) return new ApiError('locked');
      this.quotaExhausted.set(true);
      return new ApiError('quota');
    }
    if (err.status === 404) return new ApiError('notfound');
    return new ApiError('network');
  }
}

function dedupe(plants: Plant[]): Plant[] {
  const seen = new Set<string>();
  return plants.filter((p) => !seen.has(p.name) && !!seen.add(p.name));
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function readCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const { t, v } = JSON.parse(raw) as { t: number; v: T };
    if (Date.now() - t < TTL_MS) return v;
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable or corrupt: just refetch */
  }
  return undefined;
}

function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* quota exceeded / private mode: the in-memory path still works */
  }
}
