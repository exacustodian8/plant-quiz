import { Injectable, computed, signal } from '@angular/core';
import { Plant } from './plant';

/**
 * Plants the visitor has marked as interesting.
 * Held in memory only for now: nothing is persisted, so a page reload clears the list.
 */
@Injectable({ providedIn: 'root' })
export class FavouritesStore {
  readonly plants = signal<Plant[]>([]);
  readonly count = computed(() => this.plants().length);

  has(id: number): boolean {
    return this.plants().some((p) => p.id === id);
  }

  add(plant: Plant) {
    if (!this.has(plant.id)) this.plants.update((cur) => [...cur, plant]);
  }

  remove(id: number) {
    this.plants.update((cur) => cur.filter((p) => p.id !== id));
  }

  toggle(plant: Plant) {
    if (this.has(plant.id)) this.remove(plant.id);
    else this.add(plant);
  }
}
