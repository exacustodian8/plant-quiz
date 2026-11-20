import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlantService } from '../plant.service';
import { QuizStore } from '../quiz-store';
import { PlantCard } from '../plant-card/plant-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PlantCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private service = inject(PlantService);
  protected store = inject(QuizStore);

  featured = computed(() => this.service.plants().slice(0, 3));
  count = computed(() => this.service.plants().length);

  steps = [
    { n: '01', title: 'Answer four questions', text: 'How forgetful, how sunny, how many pets, what kind of weekend.' },
    { n: '02', title: 'We rank every plant', text: 'Each plant is scored against your answers, with pet safety as a hard filter.' },
    { n: '03', title: 'Meet your match', text: 'See your best fit, plus runners-up, with a link you can share.' },
  ];
}
