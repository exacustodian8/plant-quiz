import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { Plant } from './plant';

type State = { status: 'loading' | 'ready' | 'error'; plants: Plant[] };

@Injectable({ providedIn: 'root' })
export class PlantService {
  private http = inject(HttpClient);

  private state = toSignal(
    this.http.get<Plant[]>('plants.json').pipe(
      map((plants): State => ({ status: 'ready', plants })),
      catchError(() => of<State>({ status: 'error', plants: [] })),
    ),
    { initialValue: { status: 'loading', plants: [] } as State },
  );

  readonly status = computed(() => this.state().status);
  readonly plants = computed(() => this.state().plants);

  byId(id: string) {
    return this.plants().find((p) => p.id === id);
  }
}
