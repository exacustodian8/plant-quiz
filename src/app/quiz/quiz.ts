import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Option, QUESTIONS, Traits } from '../quiz-data';
import { PlantService } from '../plant.service';
import { QuizStore } from '../quiz-store';
import { rankPlants } from '../matching';

@Component({
  selector: 'app-quiz',
  imports: [RouterLink],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  private router = inject(Router);
  private plants = inject(PlantService);
  private store = inject(QuizStore);

  protected questions = QUESTIONS;

  /** one entry per answered question, so "Back" can simply pop the last one */
  protected answers = signal<Option[]>([]);

  protected index = computed(() => this.answers().length);
  protected current = computed(() => this.questions[this.index()]);
  protected progress = computed(() => (this.index() / this.questions.length) * 100);
  protected traits = computed<Partial<Traits>>(() =>
    this.answers().reduce((acc, o) => ({ ...acc, ...o.traits }), {}),
  );

  protected failed = computed(() => this.plants.status() === 'error');
  protected waiting = signal(false);

  protected pick(option: Option) {
    this.answers.update((a) => [...a, option]);
    if (this.index() === this.questions.length) this.finish();
  }

  protected back() {
    this.answers.update((a) => a.slice(0, -1));
  }

  private finish() {
    this.waiting.set(true);
    this.store.save(this.traits());
    // plants.json may still be in flight; wait until we can rank, then redirect.
    const go = () => {
      const best = rankPlants(this.plants.plants(), this.traits())[0];
      this.router.navigate(best ? ['/plant', best.plant.id] : ['/plants']);
    };
    if (this.plants.status() === 'loading') {
      const t = setInterval(() => {
        if (this.plants.status() !== 'loading') { clearInterval(t); go(); }
      }, 50);
    } else {
      go();
    }
  }
}
