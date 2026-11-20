import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { PlantService } from '../plant.service';
import { PlantCard } from '../plant-card/plant-card';
import { Reveal } from '../motion/reveal';
import { Traits } from '../quiz-data';
import { SUNLIGHT_LABEL, VIBE_LABEL } from '../plant';

type Light = Traits['sunlight'] | 'all';
type Vibe = Traits['vibe'] | 'all';

@Component({
  selector: 'app-gallery',
  imports: [PlantCard, Reveal],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  protected service = inject(PlantService);

  /** bound from `?vibe=bold` (withComponentInputBinding) */
  vibeParam = input<string | undefined>(undefined, { alias: 'vibe' });

  protected query = signal('');
  protected light = signal<Light>('all');
  protected petSafeOnly = signal(false);
  /** starts from the URL, but the chips can still change it */
  protected vibe = linkedSignal<Vibe>(() => {
    const v = this.vibeParam();
    return v && v in VIBE_LABEL ? (v as Traits['vibe']) : 'all';
  });

  protected lights: { value: Light; label: string }[] = [
    { value: 'all', label: 'Any light' },
    ...(Object.keys(SUNLIGHT_LABEL) as Traits['sunlight'][]).map((k) => ({ value: k, label: SUNLIGHT_LABEL[k] })),
  ];

  protected vibes: { value: Vibe; label: string }[] = [
    { value: 'all', label: 'Any vibe' },
    ...(Object.keys(VIBE_LABEL) as Traits['vibe'][]).map((k) => ({ value: k, label: VIBE_LABEL[k] })),
  ];

  /** derived state: recomputes only when a filter or the data changes */
  protected visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const light = this.light();
    const vibe = this.vibe();
    return this.service.plants().filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.scientific.toLowerCase().includes(q)) &&
        (light === 'all' || p.sunlight.includes(light)) &&
        (vibe === 'all' || p.vibe === vibe) &&
        (!this.petSafeOnly() || p.petFriendly),
    );
  });

  protected onSearch(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
  }

  protected reset() {
    this.query.set('');
    this.light.set('all');
    this.vibe.set('all');
    this.petSafeOnly.set(false);
  }
}
