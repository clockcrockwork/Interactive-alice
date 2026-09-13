/**
 * The per-shot renderer seam.
 *
 * `docs/frontend-architecture.md` §7 named this seam and deliberately did not build
 * it: until a scene had a renderer that was not CSS, there was nothing to send shot
 * transitions to, and a hook with no caller is a guess. Rabbit Hole's Canvas FX layer
 * is that caller, so the seam exists now and is shaped by what that renderer needs
 * rather than by what a renderer might one day need.
 *
 * What it is: a way for one object to be told "your shot is on screen, here is the
 * state", and "it is not, stop". What it is **not**: a plugin registry, a render
 * graph, or a second place that knows which shots exist. A renderer names the one
 * shot it lives inside; the mapping still owns the list.
 *
 * ## The activation contract
 *
 * A renderer is driven from the scene's own update, so it inherits the scene's
 * suspension for free: a suspended scene is never ticked, so a renderer inside it is
 * never asked to draw. On top of that, per shot:
 *
 * - `activate` when its shot is **render-active** — `active` or `outgoing`, which is
 *   exactly the set that is painting, so an overlap that puts two shots on screen may
 *   legitimately have this renderer active while another shot owns the pacing;
 * - `update` once per published frame while active, and never otherwise;
 * - `suspend` the moment its shot leaves that set, the scene suspends, or the visitor
 *   turns optional effects off. A suspended renderer holds no frame request and
 *   leaves nothing of itself on screen;
 * - `destroy` with the scene.
 *
 * ## Failing closed
 *
 * An optional layer must never take the scene with it. Every call into a renderer is
 * guarded here: the first throw retires that renderer for the life of the page, marks
 * the scene `data-fx="failed"`, and the document carries on. That is the whole reason
 * the guard lives in the seam rather than in each renderer.
 */

import type { RuntimeContext, Viewport } from './context.ts';
import { Lifecycle, type LifecycleState } from './lifecycle.ts';
import type { ShotState } from './progress.ts';

export interface ShotRenderer {
  /** The mapping id of the one shot this renderer lives inside. */
  readonly shot: string;
  /** Build whatever is cheap to keep; draw nothing. `host` is the shot's element. */
  mount(host: HTMLElement): void;
  /**
   * Read layout, and size anything that follows from it.
   *
   * The one place a renderer is allowed to touch the layout, and the reason this is
   * a method rather than something `update` works out for itself: it is called from
   * the driver's own `measure`, which runs at mount, on a resize, on a restore and
   * when a font swap moves the page — never inside an animation frame. That is the
   * rule in docs/performance-budget.md §4, and the coordinator has always kept it;
   * a renderer that measured itself while drawing would be the first thing in the
   * project to break it.
   *
   * Called before the first `update` and before any `update` that follows a
   * geometry change, so a draw never has to ask how large it is.
   */
  measure(viewport: Viewport): void;
  activate(): void;
  /** Draw one frame. Called only while active. */
  update(context: RuntimeContext, shot: ShotState): void;
  /** Stop: release any frame request, and leave nothing painted. */
  suspend(): void;
  destroy(): void;
  /** Whatever a test needs to prove the above. Shape is the renderer's own. */
  report(): Record<string, unknown>;
}

/** One renderer's lifecycle as seen from outside, for the probe and the tests. */
export interface ShotRendererReport {
  shot: string;
  state: LifecycleState;
  /** True once a call threw and this renderer was retired. */
  failed: boolean;
  detail: Record<string, unknown>;
}

/**
 * The renderers of one scene, driven from that scene's own update.
 *
 * Given the shot states the stage has already derived, so nothing here recomputes
 * them: one `shotStates` call per frame, for the document and the renderers alike.
 */
export class ShotRenderers {
  readonly #scene: HTMLElement;
  readonly #renderers: readonly ShotRenderer[];
  readonly #lifecycles = new Map<ShotRenderer, Lifecycle>();
  readonly #failed = new Set<ShotRenderer>();
  #mounted = false;

  constructor(scene: HTMLElement, renderers: readonly ShotRenderer[]) {
    this.#scene = scene;
    this.#renderers = renderers;
    for (const renderer of renderers) {
      this.#lifecycles.set(renderer, new Lifecycle());
    }
  }

  get empty(): boolean {
    return this.#renderers.length === 0;
  }

  /**
   * Attaches each renderer to its shot's element.
   *
   * A renderer whose shot is not in this scene's markup is dropped rather than
   * failing the mount: the mapping is the list of shots, and a renderer naming one
   * that is not here is a bug in the scene's own code, not a reason for a reader to
   * lose the page.
   */
  mount(): void {
    if (this.#mounted) {
      return;
    }
    this.#mounted = true;
    for (const renderer of this.#renderers) {
      const host = this.#scene.querySelector<HTMLElement>(`.shot[data-shot="${renderer.shot}"]`);
      if (!host) {
        console.error(`Interactive Alice: no shot ${renderer.shot} to render into`);
        this.#retire(renderer);
        continue;
      }
      this.#guard(renderer, () => {
        renderer.mount(host);
        this.#lifecycles.get(renderer)?.to('mounted');
      });
    }
  }

  /**
   * One published frame: activate, draw, or suspend each renderer.
   *
   * `context.effects` is the switch a test and a failure both use, so turning FX off
   * takes exactly the same path as a shot going off screen — there is no second,
   * less-tested way for a renderer to be quiet.
   */
  apply(context: RuntimeContext, shots: readonly ShotState[]): void {
    for (const renderer of this.#renderers) {
      const lifecycle = this.#lifecycles.get(renderer);
      if (!lifecycle || this.#failed.has(renderer)) {
        continue;
      }
      const shot = shots.find((state) => state.id === renderer.shot);
      const painting = shot?.state === 'active' || shot?.state === 'outgoing';
      if (shot === undefined || !painting || !context.effects) {
        this.#suspend(renderer, lifecycle);
        continue;
      }
      this.#guard(renderer, () => {
        if (lifecycle.can('active')) {
          lifecycle.to('active');
          renderer.activate();
        }
        if (lifecycle.running) {
          renderer.update(context, shot);
        }
      });
    }
  }

  /**
   * Geometry moved: let every renderer re-read it, outside any animation frame.
   *
   * Every renderer, not only the running ones. A suspended renderer resuming onto a
   * buffer sized for the old viewport would draw one wrong frame before anything
   * corrected it, and measuring is cheap — the same reasoning that makes the driver
   * remeasure a suspended scene.
   */
  measure(viewport: Viewport): void {
    for (const renderer of this.#renderers) {
      if (this.#lifecycles.get(renderer)?.state === 'idle') {
        continue;
      }
      this.#guard(renderer, () => renderer.measure(viewport));
    }
  }

  /** The scene left the viewport, or the page went away. Everything stops. */
  suspend(): void {
    for (const renderer of this.#renderers) {
      const lifecycle = this.#lifecycles.get(renderer);
      if (lifecycle) {
        this.#suspend(renderer, lifecycle);
      }
    }
  }

  destroy(): void {
    for (const renderer of this.#renderers) {
      const lifecycle = this.#lifecycles.get(renderer);
      if (!lifecycle || lifecycle.state === 'destroyed') {
        continue;
      }
      this.#suspend(renderer, lifecycle);
      this.#guard(renderer, () => renderer.destroy());
      if (lifecycle.can('destroyed')) {
        lifecycle.to('destroyed');
      }
    }
  }

  report(): ShotRendererReport[] {
    return this.#renderers.map((renderer) => ({
      shot: renderer.shot,
      state: this.#lifecycles.get(renderer)?.state ?? 'destroyed',
      failed: this.#failed.has(renderer),
      // A retired renderer is not asked for anything, including its own report.
      detail: this.#failed.has(renderer) ? {} : renderer.report(),
    }));
  }

  /**
   * Only from `active`, so a renderer that has never drawn still reports `mounted`
   * rather than being marked as having stopped something it never started.
   */
  #suspend(renderer: ShotRenderer, lifecycle: Lifecycle): void {
    if (lifecycle.state !== 'active' || this.#failed.has(renderer)) {
      return;
    }
    lifecycle.to('suspended');
    this.#guard(renderer, () => renderer.suspend());
  }

  #guard(renderer: ShotRenderer, work: () => void): void {
    if (this.#failed.has(renderer)) {
      return;
    }
    try {
      work();
    } catch (error) {
      console.error(`Interactive Alice: the ${renderer.shot} renderer failed`, error);
      this.#retire(renderer);
      // One last attempt to leave nothing of itself behind, and never a second throw.
      try {
        renderer.destroy();
      } catch {
        // Nothing more can be done for it, and the scene is not the renderer's to end.
      }
    }
  }

  #retire(renderer: ShotRenderer): void {
    this.#failed.add(renderer);
    this.#scene.dataset.fx = 'failed';
  }
}
