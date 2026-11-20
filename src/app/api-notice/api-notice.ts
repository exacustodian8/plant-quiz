import { Component, input, output } from '@angular/core';
import { ApiErrorKind } from '../perenual.service';

/** Friendly explanation for each way the plant API can fail. */
@Component({
  selector: 'app-api-notice',
  template: `
    <div class="notice" role="alert">
      @switch (kind()) {
        @case ('quota') {
          <h2>The plant API is resting 😴</h2>
          <p>This site uses a free plant database that allows 100 requests a day, and today's are used up. It resets daily, so please try again tomorrow.</p>
        }
        @case ('notfound') {
          <h2>No such plant 🥀</h2>
          <p>We couldn't find that plant.</p>
        }
        @case ('locked') {
          <h2>That plant is premium-only 🔒</h2>
          <p>Its details aren't available on the free plan. Try another plant from the list.</p>
        }
        @default {
          <h2>Couldn't reach the plant API 😕</h2>
          <p>Check your connection and try again.</p>
        }
      }
      @if (retryable()) {
        <button class="btn" type="button" (click)="retry.emit()">Try again</button>
      }
    </div>
  `,
})
export class ApiNotice {
  kind = input<ApiErrorKind>('network');
  retry = output<void>();

  protected retryable = () => this.kind() === 'network';
}
