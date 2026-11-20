import { Directive, ElementRef, OnDestroy, inject, input, afterNextRender } from '@angular/core';

export type RevealFrom = 'up' | 'left' | 'right' | 'pop';

/**
 * Adds an entrance animation the first time the element scrolls into view.
 *   <li appReveal="left" [revealDelay]="120">
 * The hidden start state only exists once this directive has run, so content is
 * never stuck invisible if JavaScript fails.
 */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnDestroy {
  from = input<RevealFrom | ''>('up', { alias: 'appReveal' });
  revealDelay = input(0);

  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private io?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      const el = this.el;
      el.classList.add('reveal', `reveal--${this.from() || 'up'}`);
      el.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);

      this.io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          el.classList.add('is-in');
          this.io?.disconnect(); // animate once
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      );
      this.io.observe(el);
    });
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }
}
