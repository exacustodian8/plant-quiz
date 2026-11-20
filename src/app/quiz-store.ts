import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Traits } from './quiz-data';
import { rankPlants } from './matching';
import { PlantService } from './plant.service';

const KEY = 'plantquiz:traits';

function load(): Partial<Traits> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Traits>) : null;
  } catch {
    return null;
  }
}

/** Remembers the user's last quiz answers (persisted to localStorage). */
@Injectable({ providedIn: 'root' })
export class QuizStore {
  private plants = inject(PlantService);

  readonly traits = signal<Partial<Traits> | null>(load());

  readonly matches = computed(() => {
    const t = this.traits();
    return t ? rankPlants(this.plants.plants(), t) : [];
  });

  readonly topMatch = computed(() => this.matches()[0] ?? null);

  constructor() {
    effect(() => {
      const t = this.traits();
      try {
        if (t) localStorage.setItem(KEY, JSON.stringify(t));
        else localStorage.removeItem(KEY);
      } catch {
        /* storage unavailable (private mode) – app still works, just doesn't persist */
      }
    });
  }

  save(traits: Partial<Traits>) {
    this.traits.set(traits);
  }

  clear() {
    this.traits.set(null);
  }
}
