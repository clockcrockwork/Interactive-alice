/**
 * What a document does for the scenes it hosts.
 *
 * One document may hold several scenes, and the cost of that must not scale with
 * how many. So the listeners, the observers and the frame loop are here, once, and
 * a scene driver keeps only what is genuinely its own: its geometry, its progress,
 * its lifecycle. Two scenes cost two measurements per resize, not two scroll
 * listeners and two competing frame loops.
 *
 * What this is **not** is a story timeline. There is no document-wide progress
 * value, and no scene is told where another one is. Each scene still derives its
 * own normalized 0..1 from its own track, and a handoff between two of them is a
 * consequence of their geometry meeting, not of anything coordinated here. What
 * this coordinates is lifecycle: who is on screen, and therefore who is worth a
 * frame. See docs/frontend-architecture.md §7.
 */

import { SceneDriver, type SceneDriverOptions } from './scene-driver.ts';

/**
 * Whether an element is in the viewport, on the same terms as a threshold-0
 * `IntersectionObserver`: any part of it overlapping, and a box to overlap with.
 */
function onScreen(element: HTMLElement): boolean {
  const box = element.getBoundingClientRect();
  return box.bottom > 0 && box.top < innerHeight && box.width > 0 && box.height > 0;
}

export class SceneCoordinator {
  readonly #drivers: SceneDriver[];
  /** Which scenes are on screen, as last decided by geometry or by the observer. */
  readonly #visible = new WeakMap<SceneDriver, boolean>();
  readonly #byStage = new Map<HTMLElement, SceneDriver>();
  #observer: IntersectionObserver | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #frame = 0;
  #mounted = false;

  readonly #onScroll = () => this.#request();
  readonly #onResize = () => this.#resettle();
  // Back from the back/forward cache: the viewport may differ and the scroll
  // position is restored, so nothing about where a scene sits can be assumed.
  // Which is the same situation as a resize, and gets the same answer.
  readonly #onPageShow = () => this.#resettle();
  readonly #onPageHide = () => {
    for (const driver of this.#drivers) {
      driver.suspend();
    }
  };

  constructor(scenes: readonly SceneDriverOptions[]) {
    const request = () => this.#request();
    this.#drivers = scenes.map((options) => new SceneDriver(options, request));
    for (const driver of this.#drivers) {
      this.#byStage.set(driver.stage, driver);
    }
  }

  /** The scenes of this document, in document order. */
  get drivers(): readonly SceneDriver[] {
    return this.#drivers;
  }

  mount(): void {
    for (const driver of this.#drivers) {
      driver.mount();
    }

    // Decide who is on screen before anyone runs a frame.
    this.#syncVisibility();
    this.#mounted = true;

    // Layout can still move under us: a late font swap shifts what sits above a
    // track, and a container query or an orientation change resizes it.
    this.#resizeObserver = new ResizeObserver(() => this.#resettle());
    for (const driver of this.#drivers) {
      this.#resizeObserver.observe(driver.track);
    }
    void document.fonts?.ready.then(() => this.#resettle());

    addEventListener('scroll', this.#onScroll, { passive: true });
    addEventListener('resize', this.#onResize, { passive: true });
    addEventListener('pageshow', this.#onPageShow);
    addEventListener('pagehide', this.#onPageHide);

    // Off-screen scenes do no work; this is the suspend rule, not an optimization.
    //
    // The stage is the target, not the scene element. The scene is the whole
    // track, most of which is scroll distance rather than anything drawn, while
    // the stage is the box the composition occupies and the box the driver
    // measures. Today's sticky geometry makes the two windows the same, so this
    // is about tying lifecycle to the measured box rather than about correcting
    // a difference that exists yet: give a scene anything outside its track, or
    // a track any padding, and only the stage still means "on screen".
    this.#observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const driver = this.#byStage.get(entry.target as HTMLElement);
        if (!driver) {
          continue;
        }
        this.#visible.set(driver, entry.isIntersecting);
        if (entry.isIntersecting) {
          driver.resume();
        } else {
          driver.suspend();
        }
      }
    });
    for (const driver of this.#drivers) {
      this.#observer.observe(driver.stage);
    }
  }

  destroy(): void {
    if (this.#mounted) {
      removeEventListener('scroll', this.#onScroll);
      removeEventListener('resize', this.#onResize);
      removeEventListener('pageshow', this.#onPageShow);
      removeEventListener('pagehide', this.#onPageHide);
    }
    this.#mounted = false;
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    if (this.#frame) {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    }
    for (const driver of this.#drivers) {
      driver.destroy();
    }
  }

  /**
   * Which scenes are on screen, read from the stages themselves.
   *
   * An intersection callback is delivered after the animation callbacks of the
   * frame that provoked it, so anything that relies on the observer alone leaves
   * a frame in which a scene's lifecycle disagrees with where it actually is: an
   * off-screen scene still ticking, or a scene now in view still suspended and
   * drawing nothing. Every path that can move a scene relative to the viewport
   * therefore reads the geometry itself and lets the observer maintain the answer
   * afterwards rather than establish it.
   *
   * The layout read is affordable because none of those paths is a frame: mount,
   * a resize, and a restore. The frame loop still never reads layout.
   */
  #syncVisibility(): void {
    for (const driver of this.#drivers) {
      const visible = onScreen(driver.stage);
      this.#visible.set(driver, visible);
      if (visible) {
        driver.resume();
      } else {
        driver.suspend();
      }
    }
  }

  /**
   * Geometry moved under the scenes: remeasure, work out who is on screen now,
   * and treat whatever each one reads next as a jump rather than as travel.
   *
   * A suspended scene remeasures too: it is cheap, and it is what lets the scene
   * resume onto correct geometry rather than onto what was true before.
   */
  #resettle(): void {
    for (const driver of this.#drivers) {
      driver.measure();
    }
    this.#syncVisibility();
    for (const driver of this.#drivers) {
      driver.resync();
    }
  }

  /**
   * One frame for the whole document.
   *
   * One loop, and at most one runtime callback in any animation frame, however
   * many scenes the page hosts. Not one frame per scroll event: a scene whose
   * velocity is still decaying asks for the next frame itself, so frames continue
   * after scrolling stops and end when no scene still wants one.
   */
  #request(): void {
    if (this.#frame) {
      return;
    }
    this.#frame = requestAnimationFrame((time) => {
      this.#frame = 0;
      let again = false;
      for (const driver of this.#drivers) {
        // A suspended scene is not ticked at all, so its progress cannot advance
        // while it is off screen. That is the whole of the suspension rule.
        if (driver.lifecycle.running && driver.tick(time)) {
          again = true;
        }
      }
      if (again) {
        this.#request();
      }
    });
  }
}
