import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlantService } from '../plant.service';
import { QuizStore } from '../quiz-store';
import { PlantCard } from '../plant-card/plant-card';
import { SUNLIGHT_LABEL, VIBE_LABEL, WATERING_LABEL } from '../plant';

@Component({
  selector: 'app-plant-detail',
  imports: [RouterLink, PlantCard],
  templateUrl: './plant-detail.html',
  styleUrl: './plant-detail.css',
})
export class PlantDetail {
  /** bound from the :id route param (withComponentInputBinding) */
  id = input.required<string>();

  protected service = inject(PlantService);
  private store = inject(QuizStore);

  protected plant = computed(() => this.service.byId(this.id()));

  /** present only if the visitor has taken the quiz */
  protected myMatch = computed(() => this.store.matches().find((m) => m.plant.id === this.id()) ?? null);
  protected isTopMatch = computed(() => this.store.topMatch()?.plant.id === this.id());
  protected alsoGood = computed(() =>
    this.store.matches().filter((m) => m.plant.id !== this.id()).slice(0, 2),
  );

  protected copied = signal(false);

  protected watering = WATERING_LABEL;
  protected sunlight = SUNLIGHT_LABEL;
  protected vibe = VIBE_LABEL;

  protected async share() {
    const url = location.href;
    const p = this.plant();
    try {
      if (navigator.share && p) {
        await navigator.share({ title: p.name, text: `I'm a ${p.name}! Which plant are you?`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* user cancelled the share sheet / clipboard blocked */
    }
  }
}
