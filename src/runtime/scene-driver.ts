/**
 * Turns scrolling into scene progress, and owns the frame loop.
 *
 * A tall track gives the scene its scroll distance and a sticky stage holds the
 * composition in the viewport, so pinning is CSS and this only has to read a scroll
 * offset. Layout is measured on resize, never per frame.
 */

import {
  initialQuality,
  prefersReducedMotion,
  type QualityTier,
  type RuntimeContext,
  readViewport,
} from './context.ts';
import { Lifecycle } from './lifecycle.ts';
import {
  activeSpan,
  clamp,
  type Direction,
  directionOf,
  type Span,
  velocityOf,
} from './progress.ts';

export interface SceneSnapshot {
  scene: string;
  state: string;
  progress: number;
  direction: Direction;
  velocity: number;
  shot: string | undefined;
  beat: string | undefined;
  viewport: { width: number; height: number; dpr: number };
  reducedMotion: boolean;
  quality: QualityTier;
  overridden: boolean;
}

export interface SceneDriverOptions {
  scene: HTMLElement;
  track: HTMLElement;
  shots: readonly Span[];
  beats: readonly Span[];
  onUpdate: (context: RuntimeContext) => void;
}

export class SceneDriver {
  readonly #options: SceneDriverOptions;
  readonly #lifecycle = new Lifecycle();
  #top = 0;
  #distance = 1;
  #progress = 0;
  #direction: Direction = 0;
  #velocity = 0;
  #override: number | undefined;
  #frame = 0;
  #lastTime = 0;
  #quality: QualityTier = 'full';
  #effects = true;
  #audio = false;
  #observer: IntersectionObserver | undefined;
  readonly #onScroll = () => this.#request();
  readonly #onResize = () => {
    this.measure();
    this.#request(true);
  };
  readonly #onPageShow = () => {
    // Back from the back/forward cache: the viewport may differ and the scroll
    // position is restored, so remeasure before trusting anything.
    this.measure();
    this.resume();
  };
  readonly #onPageHide = () => this.suspend();

  constructor(options: SceneDriverOptions) {
    this.#options = options;
  }

  get lifecycle(): Lifecycle {
    return this.#lifecycle;
  }

  mount(): void {
    this.#lifecycle.to('mounted');
    this.#quality = initialQuality();
    this.measure();

    addEventListener('scroll', this.#onScroll, { passive: true });
    addEventListener('resize', this.#onResize, { passive: true });
    addEventListener('pageshow', this.#onPageShow);
    addEventListener('pagehide', this.#onPageHide);

    // Off-screen scenes do no work; this is the suspend rule, not an optimization.
    this.#observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.resume();
        } else {
          this.suspend();
        }
      }
    });
    this.#observer.observe(this.#options.scene);

    this.#lifecycle.to('active');
    this.#request(true);
  }

  /** Reads layout once, so the frame loop never has to. */
  measure(): void {
    const rect = this.#options.track.getBoundingClientRect();
    const viewport = readViewport();
    this.#top = rect.top + scrollY;
    this.#distance = Math.max(rect.height - viewport.height, 1);
  }

  suspend(): void {
    if (this.#lifecycle.can('suspended')) {
      this.#lifecycle.to('suspended');
    }
    if (this.#frame) {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    }
  }

  resume(): void {
    if (this.#lifecycle.can('active')) {
      this.#lifecycle.to('active');
      this.#request(true);
    }
  }

  destroy(): void {
    this.suspend();
    removeEventListener('scroll', this.#onScroll);
    removeEventListener('resize', this.#onResize);
    removeEventListener('pageshow', this.#onPageShow);
    removeEventListener('pagehide', this.#onPageHide);
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#lifecycle.to('destroyed');
  }

  /** Test and debug seam: hold progress at a value until released. */
  setProgress(progress: number): void {
    this.#override = clamp(progress);
    this.#publish(this.#override, true);
  }

  releaseProgress(): void {
    this.#override = undefined;
    this.#request(true);
  }

  setFlags(flags: { effects?: boolean; audio?: boolean; quality?: QualityTier }): void {
    this.#effects = flags.effects ?? this.#effects;
    this.#audio = flags.audio ?? this.#audio;
    this.#quality = flags.quality ?? this.#quality;
    this.#publish(this.#progress, true);
  }

  snapshot(): SceneSnapshot {
    return {
      scene: this.#options.scene.dataset.scene ?? '',
      state: this.#lifecycle.state,
      progress: this.#progress,
      direction: this.#direction,
      velocity: this.#velocity,
      shot: activeSpan(this.#progress, this.#options.shots)?.id,
      beat: activeSpan(this.#progress, this.#options.beats)?.id,
      viewport: readViewport(),
      reducedMotion: prefersReducedMotion(),
      quality: this.#quality,
      overridden: this.#override !== undefined,
    };
  }

  #request(force = false): void {
    if (!this.#lifecycle.running || this.#frame) {
      return;
    }
    this.#frame = requestAnimationFrame((time) => {
      this.#frame = 0;
      this.#tick(time, force);
    });
  }

  #tick(time: number, force: boolean): void {
    const progress = this.#override ?? clamp((scrollY - this.#top) / this.#distance);
    const seconds = this.#lastTime ? (time - this.#lastTime) / 1000 : 0;
    this.#lastTime = time;

    const delta = progress - this.#progress;
    this.#direction = directionOf(delta);
    this.#velocity = velocityOf(this.#velocity, delta, seconds);

    if (force || delta !== 0 || this.#velocity !== 0) {
      this.#publish(progress, force);
    }
  }

  #publish(progress: number, force: boolean): void {
    const changed = progress !== this.#progress;
    this.#progress = progress;
    if (!changed && !force) {
      return;
    }
    this.#options.onUpdate({
      progress,
      direction: this.#direction,
      velocity: this.#velocity,
      viewport: readViewport(),
      reducedMotion: prefersReducedMotion(),
      quality: this.#quality,
      effects: this.#effects,
      audio: this.#audio,
    });
  }
}
