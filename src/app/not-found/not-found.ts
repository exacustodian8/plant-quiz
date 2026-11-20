import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BgSection } from '../motion/background';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, BgSection],
  template: `
    <div class="page missing" appBg="stripes">
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
