import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';

/**
 * Scroll-linked motion: the element starts off to one side and glides (spinning a
 * little) into its resting place as it scrolls up through the viewport.
 *   <img appFlyIn="left" [flyTilt]="-6" [flySpin]="40">
 * It uses the independent `translate` / `rotate` properties so it never fights
 * with the element's own CSS `transform`.
 */
@Directive({ selector: '[appFlyIn]' })
export class FlyIn implements OnDestroy {
  side = input<'left' | 'right'>('left', { alias: 'appFlyIn' });
  /** resting rotation in degrees */
  flyTilt = input(0);
  /** extra degrees of rotation at the start of the journey */
  flySpin = input(30);
  /** how far (in viewport widths) it starts from its resting place */
  flyDistance = input(60);

  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private frame = 0;
  private onScroll = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  };

  constructor() {
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.el.style.rotate = `${this.flyTilt()}deg`;
        return;
      }
      this.update();
      addEventListener('scroll', this.onScroll, { passive: true });
      addEventListener('resize', this.onScroll, { passive: true });
    });
  }

  private update() {
    const vh = innerHeight;
    const rect = this.el.getBoundingClientRect();
    // 0 when the element's top enters the bottom of the screen, 1 once it is ~40% up
    const t = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.6)));
    const eased = 1 - Math.pow(1 - t, 3);
    const remaining = 1 - eased;
    const dir = this.side() === 'left' ? -1 : 1;
    this.el.style.translate = `${dir * remaining * this.flyDistance()}vw 0`;
    this.el.style.rotate = `${this.flyTilt() + dir * remaining * this.flySpin()}deg`;
    this.el.style.opacity = String(Math.min(1, t * 2.5));
  }

  ngOnDestroy() {
    removeEventListener('scroll', this.onScroll);
    removeEventListener('resize', this.onScroll);
    cancelAnimationFrame(this.frame);
  }
}
