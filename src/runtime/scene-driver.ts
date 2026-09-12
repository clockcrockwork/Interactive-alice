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
  VELOCITY_EPSILON,
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
  /** The sticky element. Its height is the part of the track that does not travel. */
  stage: HTMLElement;
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
  #deferredPublish = false;
  /**
   * The next sample is a resynchronisation, not reader movement.
   *
   * `direction` means the way a reader is travelling, so a progress value that
   * arrives without anyone scrolling — the first sync after mounting, a return from
   * suspension or the back/forward cache, a seam jump, a release back to the real
   * position, a geometry change — publishes a direction and velocity of zero rather
   * than the direction of the gap it closed. Private on purpose: no scene has yet
   * needed to know *why* progress jumped, and `RuntimeContext` stays as it is until
   * one does. See docs/frontend-architecture.md §7.
   */
  #resync = true;
  #frame = 0;
  #lastTime = 0;
  #quality: QualityTier = 'full';
  #effects = true;
  #audio = false;
  #observer: IntersectionObserver | undefined;
  #resizeObserver: ResizeObserver | undefined;
  readonly #onScroll = () => this.#request();
  readonly #onResize = () => {
    this.measure();
    this.#resyncNext();
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

  /**
   * Attaches to the document.
   *
   * The caller must have put the page into its staged mode already: the track's
   * height comes from CSS that only applies in that mode, so measuring before it is
   * applied reads the flow layout and gets the scroll distance wrong. `attachStory`
   * owns that ordering.
   */
  mount(): void {
    this.#lifecycle.to('mounted');
    this.#quality = initialQuality();
    this.measure();

    // Layout can still move under us: a late font swap shifts what sits above the
    // track, and a container query or an orientation change resizes it.
    this.#resizeObserver = new ResizeObserver(() => {
      this.measure();
      this.#resyncNext();
    });
    this.#resizeObserver.observe(this.#options.track);
    void document.fonts?.ready.then(() => {
      this.measure();
      this.#resyncNext();
    });

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
    this.#resyncNext();
  }

  /** Asks for a frame that treats the position it reads as a jump, not as travel. */
  #resyncNext(): void {
    this.#resync = true;
    this.#request(true);
  }

  /**
   * Reads layout once, so the frame loop never has to.
   *
   * The travel is the track's height minus the sticky stage's height, both measured
   * from the elements themselves. Subtracting `innerHeight` instead would mix units:
   * the stage is sized in CSS, and on a phone with a retracting toolbar the window's
   * height is the large viewport while the stage may be the small one.
   */
  measure(): void {
    const track = this.#options.track.getBoundingClientRect();
    const stage = this.#options.stage.getBoundingClientRect();
    this.#top = track.top + scrollY;
    this.#distance = Math.max(track.height - stage.height, 1);
  }

  suspend(): void {
    if (this.#lifecycle.can('suspended')) {
      this.#lifecycle.to('suspended');
    }
    if (this.#frame) {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    }
    // Nothing is moving while suspended, and the clock must not carry the pause into
    // the first sample after resuming.
    this.#lastTime = 0;
    this.#velocity = 0;
  }

  resume(): void {
    if (!this.#lifecycle.can('active')) {
      return;
    }
    this.#lifecycle.to('active');
    if (this.#deferredPublish) {
      // Whatever the seam set while we were suspended reaches the document once, now.
      this.#deferredPublish = false;
      this.#neutral();
      this.#publish(this.#override ?? this.#progress, true);
    }
    // Always read the real position afterwards. The page may have scrolled while this
    // scene was off-screen or in the back/forward cache, so the held value is what the
    // seam asked for, never evidence of where the document now is.
    this.#resyncNext();
  }

  destroy(): void {
    this.suspend();
    removeEventListener('scroll', this.#onScroll);
    removeEventListener('resize', this.#onResize);
    removeEventListener('pageshow', this.#onPageShow);
    removeEventListener('pagehide', this.#onPageHide);
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    this.#lifecycle.to('destroyed');
  }

  /**
   * Test and debug seam: hold progress at a value until released.
   *
   * A suspended scene keeps the value but draws nothing, so the seam cannot make an
   * off-screen scene render; the held value is published once on resume.
   */
  setProgress(progress: number): void {
    this.#override = clamp(progress);
    if (this.#lifecycle.running) {
      // A jump is not travel, however far it went.
      this.#neutral();
      this.#publish(this.#override, true);
    } else {
      this.#deferredPublish = true;
    }
  }

  releaseProgress(): void {
    this.#override = undefined;
    this.#resyncNext();
  }

  setFlags(flags: { effects?: boolean; audio?: boolean; quality?: QualityTier }): void {
    this.#effects = flags.effects ?? this.#effects;
    this.#audio = flags.audio ?? this.#audio;
    this.#quality = flags.quality ?? this.#quality;
    if (this.#lifecycle.running) {
      this.#publish(this.#progress, true);
    } else {
      this.#deferredPublish = true;
    }
  }

  /** Nothing is moving: this value did not come from a reader. */
  #neutral(): void {
    this.#direction = 0;
    this.#velocity = 0;
    this.#lastTime = 0;
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

    if (this.#resync) {
      // Close the gap without calling it movement, then start measuring from here.
      this.#resync = false;
      this.#neutral();
      this.#publish(progress, true);
      // `#neutral` cleared the clock, so the next sample measures from there: the
      // gap this frame closed must not become speed on the frame after it either.
      return;
    }

    const seconds = this.#lastTime ? (time - this.#lastTime) / 1000 : 0;
    this.#lastTime = time;

    const delta = progress - this.#progress;
    this.#direction = directionOf(delta);
    this.#velocity = velocityOf(this.#velocity, delta, seconds);

    if (force || delta !== 0 || this.#velocity !== 0) {
      this.#publish(progress, force);
    }

    // Keep going while velocity is still decaying, so a scene that reads speed sees
    // it settle to zero rather than holding the last value after scrolling stops.
    if (Math.abs(this.#velocity) > VELOCITY_EPSILON) {
      this.#request();
    } else {
      this.#lastTime = 0;
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
