import { Component, computed, inject, signal } from '@angular/core';
import { PlantService } from '../plant.service';
import { PlantCard } from '../plant-card/plant-card';
import { Traits } from '../quiz-data';
import { SUNLIGHT_LABEL } from '../plant';

type Light = Traits['sunlight'] | 'all';

@Component({
  selector: 'app-gallery',
  imports: [PlantCard],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  protected service = inject(PlantService);

  protected query = signal('');
  protected light = signal<Light>('all');
  protected petSafeOnly = signal(false);

  protected lights: { value: Light; label: string }[] = [
    { value: 'all', label: 'Any light' },
    ...(Object.keys(SUNLIGHT_LABEL) as Traits['sunlight'][]).map((k) => ({ value: k, label: SUNLIGHT_LABEL[k] })),
  ];

  /** derived state: recomputes only when a filter or the data changes */
  protected visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const light = this.light();
    return this.service.plants().filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.scientific.toLowerCase().includes(q)) &&
        (light === 'all' || p.sunlight.includes(light)) &&
        (!this.petSafeOnly() || p.petFriendly),
    );
  });

  protected onSearch(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
  }

  protected reset() {
    this.query.set('');
    this.light.set('all');
    this.petSafeOnly.set(false);
  }
}
