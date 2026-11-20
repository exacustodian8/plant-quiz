import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlantService } from '../plant.service';
import { QuizStore } from '../quiz-store';
import { PlantCard } from '../plant-card/plant-card';
import { Reveal } from '../motion/reveal';
import { FlyIn } from '../motion/fly-in';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PlantCard, Reveal, FlyIn],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private service = inject(PlantService);
  protected store = inject(QuizStore);

  featured = computed(() => this.service.plants().slice(0, 3));
  count = computed(() => this.service.plants().length);

  facts = computed(() => [
    { value: this.count() || '12', label: 'plants to match' },
    { value: '4', label: 'quick questions' },
    { value: '20s', label: 'to your result' },
  ]);

  steps = [
    { n: '01', title: 'Answer four questions', text: 'How forgetful, how sunny, how many pets, what kind of weekend.' },
    { n: '02', title: 'We rank every plant', text: 'Each plant is scored against your answers, with pet safety as a hard filter.' },
    { n: '03', title: 'Meet your match', text: 'See your best fit, plus runners-up, with a link you can share.' },
  ];

  vibes = [
    { key: 'calm', title: 'Calm', text: 'Quiet, graceful, happy to be left alone.', image: 'plants/palm.jpg' },
    { key: 'bold', title: 'Bold', text: 'Big, loud and taking up all the space.', image: 'plants/monstera.jpg' },
    { key: 'quirky', title: 'Quirky', text: 'A little odd, completely lovable.', image: 'plants/haworthia.jpg' },
  ];
}
