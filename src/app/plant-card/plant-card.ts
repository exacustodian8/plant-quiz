import { Component, input } from '@angular/core';
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

  watering = WATERING_LABEL;
  sunlight = SUNLIGHT_LABEL;
}
