import { Directive, ElementRef, Injectable, OnDestroy, afterNextRender, inject, input, signal } from '@angular/core';

export type BgPattern = 'dots' | 'stripes' | 'checker' | 'grid' | 'waves' | 'rays';

export const BG_PATTERNS: readonly BgPattern[] = ['dots', 'stripes', 'checker', 'grid', 'waves', 'rays'];

/** Which pattern the page background is currently showing (see app.html / app.css). */
@Injectable({ providedIn: 'root' })
export class BgService {
  readonly pattern = signal<BgPattern>('dots');
}

/**
 * Put on a section to make the page background switch to `pattern` while that section
 * is under the middle of the screen:  <section appBg="stripes">
 */
@Directive({ selector: '[appBg]' })
export class BgSection implements OnDestroy {
  pattern = input<BgPattern>('dots', { alias: 'appBg' });

  private bg = inject(BgService);
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private io?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      // a zero-height band across the middle of the viewport: fires as a section crosses it
      this.io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) this.bg.pattern.set(this.pattern());
        },
        { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
      );
      this.io.observe(this.el);
    });
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }
}
