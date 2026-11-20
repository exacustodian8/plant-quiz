import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BG_PATTERNS, BgService } from './motion/background';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected bg = inject(BgService);
  protected patterns = BG_PATTERNS;

  private bgfx = viewChild.required<ElementRef<HTMLElement>>('bgfx');
  private decor = viewChild.required<ElementRef<HTMLElement>>('decor');
  private bar = viewChild.required<ElementRef<HTMLElement>>('bar');

  constructor() {
    afterNextRender(() => {
      const layers = this.bgfx().nativeElement;
      const shapes = this.decor().nativeElement;
      const bar = this.bar().nativeElement;
      let frame = 0;

      // One cheap write per frame. `--sy` (scroll distance in px) drives every parallax effect in CSS;
      // it is set only on the two background containers, so the rest of the page is never restyled.
      const update = () => {
        frame = 0;
        const y = scrollY;
        const max = document.documentElement.scrollHeight - innerHeight;
        layers.style.setProperty('--sy', String(y));
        shapes.style.setProperty('--sy', String(y));
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      };
      const onScroll = () => (frame ||= requestAnimationFrame(update));

      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      update();
    });
  }
}
