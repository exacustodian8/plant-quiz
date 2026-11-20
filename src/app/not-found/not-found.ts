import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="page missing">
      <p class="eyebrow">404</p>
      <h1>This page wilted.</h1>
      <p>We couldn't find what you were looking for.</p>
      <a class="btn" routerLink="/">Back home</a>
    </div>
  `,
  styles: `
    .missing { text-align: center; padding-top: 180px; }
    p:not(.eyebrow) { margin: 1rem 0 2rem; }
  `,
})
export class NotFound {}
