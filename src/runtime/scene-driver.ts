/**
 * Turns scrolling into one scene's progress.
 *
 * A tall track gives the scene its scroll distance and a sticky stage holds the
 * composition in the viewport, so pinning is CSS and this only has to read a scroll
 * offset. Layout is measured on resize, never per frame.
 *
 * A driver owns one scene and nothing beyond it. Listening to the document, and
 * deciding which scenes are worth a frame, belongs to `SceneCoordinator`: a page
 * may host several scenes, and one scroll listener and one frame loop for all of
 * them is the only version of that which stays within the frame budget. See
 * docs/frontend-architecture.md §7.
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
  clamp,
  composeShots,
  type Direction,
  directionOf,
  type ShotSpan,
  type Span,
  spanStates,
  VELOCITY_EPSILON,
  velocityOf,
} from './progress.ts';

export interface SceneSnapshot {
  scene: string;
  state: string;
  progress: number;
  direction: Direction;
  velocity: number;
  /** The shot that owns this progress. Exactly one, always. */
  shot: string | undefined;
  /**
   * Every render-active shot in **progression order**, so during a handover the
   * outgoing shot comes first and the primary second. One entry, or two.
   */
  shots: string[];
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
  shots: readonly ShotSpan[];
  beats: readonly Span[];
  onUpdate: (context: RuntimeContext) => void;
  /**
   * The scene stopped being ticked.
   *
   * `onUpdate` alone cannot say this: not being called is indistinguishable from a
   * frame in which nothing changed, and a renderer that holds a frame request of its
   * own has to be told to let it go. Off-screen scenes doing no work is a rule, and
   * a rule needs an edge to fire on.
   */
  onSuspend?: () => void;
  onDestroy?: () => void;
}

export class SceneDriver {
  readonly #options: SceneDriverOptions;
  readonly #lifecycle = new Lifecycle();
  /** How this scene asks the document's loop for a frame. */
  readonly #requestFrame: () => void;
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
  #lastTime = 0;
  #quality: QualityTier = 'full';
  #effects = true;
  #audio = false;

  constructor(options: SceneDriverOptions, requestFrame: () => void) {
    this.#options = options;
    this.#requestFrame = requestFrame;
  }

  get lifecycle(): Lifecycle {
    return this.#lifecycle;
  }

  get track(): HTMLElement {
    return this.#options.track;
  }

  /**
   * The sticky stage: the box the composition actually occupies.
   *
   * This is what the coordinator watches for visibility, and it is the same box
   * `measure` derives the scroll mapping from, so a scene's lifecycle and its
   * progress are answering to one piece of geometry rather than two.
   */
  get stage(): HTMLElement {
    return this.#options.stage;
  }

  /**
   * Prepares the scene, without attaching to anything and without starting it.
   *
   * The caller must have put the page into its staged mode already: the track's
   * height comes from CSS that only applies in that mode, so measuring before it is
   * applied reads the flow layout and gets the scroll distance wrong. `attachStory`
   * owns that ordering, and the coordinator owns every listener.
   *
   * It stops at `mounted` on purpose. Whether this scene is on screen is a fact
   * about the document, so the coordinator decides it and then resumes or suspends;
   * going straight to `active` here would make every scene on the page run for the
   * frame before the first intersection callback arrives, which is one frame of
   * work by a scene that is nowhere near the viewport.
   */
  mount(): void {
    this.#lifecycle.to('mounted');
    this.#quality = initialQuality();
    this.measure();
  }

  /** Asks for a frame that treats the position it reads as a jump, not as travel. */
  resync(): void {
    this.#resync = true;
    this.#requestFrame();
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
      this.#options.onSuspend?.();
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
    this.resync();
  }

  destroy(): void {
    this.suspend();
    this.#lifecycle.to('destroyed');
    this.#options.onDestroy?.();
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
    this.resync();
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
    const composition = composeShots(this.#progress, this.#options.shots);
    return {
      scene: this.#options.scene.dataset.scene ?? '',
      state: this.#lifecycle.state,
      progress: this.#progress,
      direction: this.#direction,
      velocity: this.#velocity,
      shot: composition.primary,
      shots: composition.active,
      // The beat the document is showing, which is the last one at the scene's end
      // rather than none: the same rule the stage writes into the markup, so the
      // snapshot and the page cannot disagree about what a reader is looking at.
      beat: spanStates(this.#progress, this.#options.beats).find((beat) => beat.state === 'active')
        ?.id,
      viewport: readViewport(),
      reducedMotion: prefersReducedMotion(),
      quality: this.#quality,
      overridden: this.#override !== undefined,
    };
  }

  /**
   * Advances this scene by one frame. Returns true while it still wants another.
   *
   * Only the coordinator calls this, and only while the scene is active, so a
   * suspended scene's progress cannot move: it is not that its updates are
   * discarded, it is that nothing reads the scroll position on its behalf.
   */
  tick(time: number): boolean {
    const progress = this.#override ?? clamp((scrollY - this.#top) / this.#distance);

    if (this.#resync) {
      // Close the gap without calling it movement, then start measuring from here.
      this.#resync = false;
      this.#neutral();
      this.#publish(progress, true);
      // `#neutral` cleared the clock, so the next sample measures from there: the
      // gap this frame closed must not become speed on the frame after it either.
      return false;
    }

    const seconds = this.#lastTime ? (time - this.#lastTime) / 1000 : 0;
    this.#lastTime = time;

    const delta = progress - this.#progress;
    // Only a frame in which the position actually moved says anything about which
    // way a reader is going. A frame that moved nothing is not evidence that they
    // stopped: frames now arrive while velocity decays and to give the clock an
    // interval to measure, and letting either of those reset `direction` would make
    // the value flicker to zero a frame after every scroll. `#neutral` is still what
    // clears it, and it is called for exactly the discontinuities that should.
    if (delta !== 0) {
      this.#direction = directionOf(delta);
    }
    this.#velocity = velocityOf(this.#velocity, delta, seconds);

    if (delta !== 0 || this.#velocity !== 0) {
      this.#publish(progress, false);
    }

    // Keep going while velocity is still decaying, so a scene that reads speed sees
    // it settle to zero rather than holding the last value after scrolling stops.
    if (Math.abs(this.#velocity) > VELOCITY_EPSILON) {
      return true;
    }

    // Movement, but no interval to measure it over yet: this frame had no previous
    // timestamp, so `seconds` was zero and `velocityOf` could only return what it
    // was given. Dropping the clock here as well would make that permanent —
    // every frame would rediscover that it has no previous one, and `velocity`
    // could never leave zero however fast a reader scrolled. So the clock is kept
    // and another frame is asked for, and the frame after this one is the first
    // that can say how fast this is going. One frame of latency before a speed
    // exists is inherent; never having one is a defect, and was one until the
    // Canvas layer became the first thing to actually read the value.
    if (delta !== 0) {
      return true;
    }

    // Genuinely still. Drop the clock, so that whenever the next frame comes — a
    // second later, or after a suspension — the pause does not read as travel.
    this.#lastTime = 0;
    return false;
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
