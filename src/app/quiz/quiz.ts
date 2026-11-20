import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Option, QUESTIONS, Traits } from '../quiz-data';
import { ApiErrorKind } from '../perenual.service';
import { QuizStore } from '../quiz-store';
import { ApiNotice } from '../api-notice/api-notice';

@Component({
  selector: 'app-quiz',
  imports: [RouterLink, ApiNotice],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  private router = inject(Router);
  private store = inject(QuizStore);

  protected questions = QUESTIONS;

  /** one entry per answered question, so "Back" can simply pop the last one */
  protected answers = signal<Option[]>([]);

  protected index = computed(() => this.answers().length);
  protected current = computed(() => this.questions[this.index()]);
  protected progress = computed(() => (this.index() / this.questions.length) * 100);
  protected traits = computed<Partial<Traits>>(() => this.answers().reduce((acc, o) => ({ ...acc, ...o.traits }), {}));

  protected searching = signal(false);
  protected noMatch = signal(false);
  protected error = signal<ApiErrorKind | null>(null);

  protected pick(option: Option) {
    this.answers.update((a) => [...a, option]);
    if (this.index() === this.questions.length) this.search();
  }

  protected back() {
    this.answers.update((a) => a.slice(0, -1));
  }

  protected search() {
    this.searching.set(true);
    this.noMatch.set(false);
    this.error.set(null);
    this.store.start(this.traits()).subscribe({
      next: (matches) => {
        const best = matches[0];
        if (best) this.router.navigate(['/plant', best.plant.id], { queryParams: { n: best.plant.name } });
        else { this.searching.set(false); this.noMatch.set(true); }
      },
      error: (err: { kind?: ApiErrorKind }) => {
        this.searching.set(false);
        this.error.set(err.kind ?? 'network');
      },
    });
  }

  protected restart() {
    this.answers.set([]);
    this.noMatch.set(false);
    this.error.set(null);
  }
}
