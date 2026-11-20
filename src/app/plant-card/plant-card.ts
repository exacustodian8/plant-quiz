import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Plant, SUNLIGHT_LABEL, WATERING_LABEL } from '../plant';

@Component({
  selector: 'app-plant-card',
  imports: [RouterLink],
  templateUrl: './plant-card.html',
  styleUrl: './plant-card.css',
})
export class PlantCard {
  plant = input.required<Plant>();
  /** optional "87% match" badge */
  percent = input<number | null>(null);

  /** one line of whatever care info we actually know about this plant */
  protected meta = computed(() => {
    const p = this.plant();
    return [
      p.watering && WATERING_LABEL[p.watering],
      p.sunlight?.length && SUNLIGHT_LABEL[p.sunlight[0]],
      p.petFriendly && 'Not poisonous',
    ]
      .filter(Boolean)
      .join(' · ');
  });

  /** gives each plant a stable colour block behind its photo while it loads */
  protected tone = computed(() => this.plant().id % 3);
}
