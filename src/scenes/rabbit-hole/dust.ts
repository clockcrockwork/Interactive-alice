/**
 * Rabbit Hole's Canvas 2D FX layer: the dust in the shaft.
 *
 * This is the project's first renderer that is not CSS, and it exists to make one
 * shot better rather than to be a particle engine. `primary-fall` is where the well
 * opens out and the world starts rushing upward past an anchored Alice
 * (docs/poc/rabbit-hole.md §5); CSS gives that shot three translating bands, which
 * reads as depth but not yet as *air*. A hundred small motes at three depths,
 * elongating into streaks with scroll speed, are what make the shaft feel like a
 * volume Alice is falling through. Nothing narrative is here: the words, Alice and
 * the scene's geometry are all still DOM, and the whole layer is `aria-hidden`.
 *
 * ## Why one shot
 *
 * The renderer lives inside `primary-fall`'s own element, so it inherits that shot's
 * opacity, stacking and `--handoff` fade for free, and the overlap contract applies
 * to it without a line of new compositing code. It is active through both of that
 * shot's handovers — threshold handing over to it, and it handing over to
 * `alice-focus` — which is exactly the case where two shots are render-active at
 * once. `alice-focus` is a close reaction shot where "the world quiets; almost
 * nothing passes", so dust thinning out into it is the composition, not a gap.
 *
 * ## What the composition is a function of
 *
 * The layout is fixed and seeded once (`mulberry32`, one constant seed), and every
 * mote's position is a pure function of that layout and the shot's own local
 * progress, wrapped. So the same progress reconstructs the same field, forwards or
 * backwards, and reversing is not a special case — there is nothing to reverse.
 *
 * Two things are not functions of progress, and both are bounded and decorative:
 * scroll velocity, which only stretches a mote into a streak while the reader is
 * actually moving and is zero at rest; and one pointer impulse, described at
 * `#stir`. At rest, with no impulse, the field is progress and nothing else.
 *
 * Wall-clock time drives no part of the layout. The renderer has no idle loop: it
 * draws once per runtime update, and asks for frames of its own only while an
 * impulse is decaying.
 */

import type { RuntimeContext } from '../../runtime/context.ts';
import type { ShotState } from '../../runtime/progress.ts';
import type { ShotRenderer } from '../../runtime/shot-renderer.ts';

/** The one shot this renderer lives inside. The mapping still owns the shot list. */
const SHOT = 'primary-fall';

/**
 * The motes' colour, read from the scene's palette exactly once.
 *
 * `--rh-dust` in `src/styles/tokens.css` stays the single place the value lives, per
 * docs/code-conventions.md §2, but resolving a custom property is a style read and
 * one per frame is the sort of hidden cost docs/performance-budget.md §4 exists to
 * prevent. So it is resolved at mount and kept. The literal is a fallback for a
 * stylesheet that has not applied, not a second copy of the decision.
 */
const DUST_FALLBACK = 'oklch(92% 0.05 84)';

function dustColour(host: HTMLElement): string {
  const value = host.ownerDocument.defaultView
    ?.getComputedStyle(host)
    .getPropertyValue('--rh-dust')
    .trim();
  return value || DUST_FALLBACK;
}

interface Band {
  /** Screen heights a mote of this band travels across the shot and its tail. */
  speed: number;
  /** Radius in CSS pixels. */
  size: number;
  alpha: number;
  /** How much velocity elongates this band, and how far it wanders laterally. */
  streak: number;
  /** Fraction of this band's motes to draw; 0 removes the band. */
  keep: number;
}

/** How many motes each band is seeded with. The bands run near to far. */
const COUNTS = [40, 56, 74] as const;

/**
 * The near band is fast, large and faint; the far band slow, small and sharper. That
 * is what makes three bands read as three distances rather than as three copies of
 * one field.
 */
const FULL: readonly Band[] = [
  { speed: 3.2, size: 3.4, alpha: 0.34, streak: 1, keep: 1 },
  { speed: 1.9, size: 2.1, alpha: 0.5, streak: 0.62, keep: 1 },
  { speed: 1.1, size: 1.3, alpha: 0.66, streak: 0.3, keep: 1 },
];

/**
 * The comfortable field: designed, not disabled.
 *
 * Reduced motion keeps dust in the shaft — the air is still there and the near/far
 * reading survives — and takes out what makes it vestibular. The fast near band goes
 * entirely, the remaining travel is cut to about a fifth so motes drift rather than
 * rush, nothing streaks or wanders, and the motes that stay are larger and steadier
 * so the layer still reads at a glance instead of thinning into nothing.
 */
const CALM: readonly Band[] = [
  { speed: 0, size: 0, alpha: 0, streak: 0, keep: 0 },
  { speed: 0.38, size: 2.8, alpha: 0.38, streak: 0, keep: 0.55 },
  { speed: 0.22, size: 2, alpha: 0.5, streak: 0, keep: 0.6 },
];

/** Pointer impulse: how far it reaches, how hard it pushes, how long it lives. */
const IMPULSE = {
  radius: 0.45,
  push: 0.22,
  swirl: 0.8,
  /** How much brighter and larger a stirred mote is at the centre of the impulse. */
  lift: 1.6,
  lifetime: 700,
  calmPush: 0.08,
  calmSwirl: 0,
  calmLift: 0.7,
  calmLifetime: 1100,
} as const;

const TAU = 6.283185307179586;

interface Mote {
  /** 0..1 across the canvas, before any travel. */
  x: number;
  y: number;
  band: number;
  /** Lateral wander phase, so a band is not a rigid sheet. */
  phase: number;
  /** 0..1. Which motes a thinned band keeps, and nothing else. */
  keep: number;
  /** 0..1. Per-mote size and brightness, so one band is not one repeated dot. */
  tone: number;
}

interface Impulse {
  /** 0..1 of the canvas, where the visitor touched. */
  x: number;
  y: number;
  born: number;
}

/**
 * Deterministic pseudo-randomness, one constant seed.
 *
 * docs/testing.md §3 requires randomness to be controllable. The strongest form of
 * controllable is a layout that is identical on every load and every device, so
 * there is no switch left to get wrong: the comfort mode and the quality tier change
 * how many motes are drawn, never where they are.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 0xa11ce;

const wrap = (value: number): number => value - Math.floor(value);

function seedField(): Mote[] {
  const random = mulberry32(SEED);
  const motes: Mote[] = [];
  for (const [band, count] of COUNTS.entries()) {
    for (let n = 0; n < count; n += 1) {
      motes.push({
        x: random(),
        y: random(),
        band,
        phase: random() * TAU,
        keep: random(),
        tone: random(),
      });
    }
  }
  return motes;
}

class DustRenderer implements ShotRenderer {
  readonly shot = SHOT;
  #host: HTMLElement | undefined;
  #canvas: HTMLCanvasElement | undefined;
  #paint: CanvasRenderingContext2D | undefined;
  /** Seeded once at mount; the comfort mode and the tier thin it, never reshape it. */
  #motes: Mote[] = [];
  #impulse: Impulse | undefined;
  /** The renderer's own frame request. Only an impulse ever creates one. */
  #frame = 0;
  #active = false;
  /** Backing-buffer and CSS sizes as last set, so a frame never re-measures. */
  #buffer = { width: 0, height: 0 };
  #css = { width: 0, height: 0 };
  #dpr = 0;
  /** The geometry those sizes were derived from, as the runtime reported it. */
  #geometry = '';
  /** What the last update said, so a decay frame redraws the same canonical state. */
  #held: { context: RuntimeContext; shot: ShotState } | undefined;
  #draws = 0;
  #drawn = 0;
  #streak = 0;
  #colour = DUST_FALLBACK;

  readonly #onPointerDown = (event: PointerEvent): void => this.#stir(event);

  mount(host: HTMLElement): void {
    const canvas = host.ownerDocument.createElement('canvas');
    // Decorative, and nothing in it duplicates anything the document says, so it is
    // kept out of the accessibility tree rather than described. See
    // docs/code-conventions.md §1.
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'scene-rabbit-hole__dust';
    const paint = canvas.getContext('2d', { alpha: true });
    if (!paint) {
      // A missing 2D context is a missing feature, not a broken page. Throwing here
      // retires this renderer through the seam's guard and leaves the scene whole.
      throw new Error('no 2d canvas context');
    }
    this.#host = host;
    this.#canvas = canvas;
    this.#paint = paint;
    this.#motes = seedField();
    this.#colour = dustColour(host);
    host.append(canvas);
    // Bound to the shot rather than to the canvas, because the canvas is
    // `pointer-events: none` and must stay that way: it covers the shot, and a layer
    // that swallowed pointer events would take text selection and tap targets with
    // it. Passive, never `preventDefault`, never `setPointerCapture` — so a touch
    // that begins a scroll both stirs the dust and scrolls.
    host.addEventListener('pointerdown', this.#onPointerDown, { passive: true });
  }

  activate(): void {
    // Nothing to start. There is no loop; the next update draws.
    this.#active = true;
  }

  update(context: RuntimeContext, shot: ShotState): void {
    this.#held = { context, shot };
    this.#resize(context);
    this.#draw(context, shot, performance.now());
  }

  suspend(): void {
    this.#active = false;
    this.#release();
    this.#clear();
  }

  destroy(): void {
    this.#active = false;
    this.#release();
    this.#host?.removeEventListener('pointerdown', this.#onPointerDown);
    this.#canvas?.remove();
    this.#host = undefined;
    this.#canvas = undefined;
    this.#paint = undefined;
    this.#held = undefined;
  }

  report(): Record<string, unknown> {
    return {
      /** Device pixels. */
      buffer: { ...this.#buffer },
      /** CSS pixels the buffer covers. */
      css: { ...this.#css },
      dpr: this.#dpr,
      /** Frames this renderer has painted since mount. Frozen while suspended. */
      draws: this.#draws,
      /** Motes in the last frame. Fewer under reduced motion or a reduced tier. */
      drawn: this.#drawn,
      /** Longest streak in the last frame, in CSS pixels. Zero at rest and calm. */
      streak: this.#streak,
      /** 1 the instant a pointer lands, falling to 0 as the impulse decays out. */
      impulse: this.#strength(performance.now()),
      /** True only while the renderer holds a frame request of its own. */
      looping: this.#frame !== 0,
    };
  }

  /** Drops the impulse and any frame it asked for. No interaction outlives a shot. */
  #release(): void {
    if (this.#frame) {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    }
    this.#impulse = undefined;
  }

  #clear(): void {
    if (this.#paint && this.#buffer.width > 0) {
      this.#paint.setTransform(1, 0, 0, 1, 0, 0);
      this.#paint.clearRect(0, 0, this.#buffer.width, this.#buffer.height);
    }
    this.#drawn = 0;
    this.#streak = 0;
  }

  /**
   * Sizes the backing buffer, once per geometry change rather than per frame.
   *
   * The CSS box and the buffer are separate on purpose: CSS says how large the layer
   * is, the buffer how many device pixels that is, and only the second follows DPR.
   * `readViewport` caps DPR at 2, so a 3× phone renders at 2× — that policy is
   * recorded in docs/performance-budget.md §4 rather than chosen here.
   *
   * Guarded rather than unconditional for two reasons. The measurement is a layout
   * read, and the frame loop must not contain one; viewport width, height and DPR
   * all arrive from the runtime and change only on a resize, a restore or a zoom,
   * each of which republishes, so the guard costs nothing real. And assigning
   * `width` or `height` clears the canvas even when the value is unchanged, so doing
   * it every frame would also be a correctness bug.
   */
  #resize(context: RuntimeContext): void {
    const canvas = this.#canvas;
    if (!canvas) {
      return;
    }
    const { width, height, dpr } = context.viewport;
    const geometry = `${width}x${height}@${dpr}`;
    if (geometry === this.#geometry) {
      return;
    }
    this.#geometry = geometry;
    // `clientWidth`, not `getBoundingClientRect`: the rect is the element's *visual*
    // box and includes transforms, and this shot is scaled while it hands over
    // (`scale: 1 + var(--handoff)` in ../../styles/scene.css). Sizing the buffer
    // from that would make the resolution depend on how far through a handover the
    // reader happened to be, and would draw the field into a coordinate space a few
    // per cent larger than the box it is painted into. The layout box is the one
    // that is stable, and it is the one CSS is scaling.
    const box = { width: canvas.clientWidth, height: canvas.clientHeight };
    const pixels = {
      width: Math.max(1, Math.round(box.width * dpr)),
      height: Math.max(1, Math.round(box.height * dpr)),
    };
    this.#css = box;
    this.#dpr = dpr;
    if (pixels.width === this.#buffer.width && pixels.height === this.#buffer.height) {
      return;
    }
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    this.#buffer = pixels;
  }

  /** 1 the instant an impulse lands, falling linearly to 0 at the end of its life. */
  #strength(now: number): number {
    const impulse = this.#impulse;
    if (!impulse) {
      return 0;
    }
    const calm = this.#held?.context.reducedMotion ?? false;
    const lifetime = calm ? IMPULSE.calmLifetime : IMPULSE.lifetime;
    const left = 1 - (now - impulse.born) / lifetime;
    return left > 0 ? left : 0;
  }

  /**
   * A pointer press stirs the dust where it landed.
   *
   * The recovery rule, in full. An impulse is a bounded displacement layered on top
   * of the progress-derived position: it has an origin, a birth time and a fixed
   * lifetime, and its strength falls linearly to zero, at which point it is dropped
   * and every mote is exactly where progress alone puts it. At most one exists, and
   * a second press replaces the first rather than accumulating. It is dropped
   * outright when the shot stops painting or the scene suspends, so no interaction
   * state crosses a boundary or survives going off screen. It never touches scroll,
   * progress, direction, or anything else the document reads, so ignoring it
   * entirely costs a visitor nothing.
   */
  #stir(event: PointerEvent): void {
    const canvas = this.#canvas;
    // Only while this renderer is actually painting: the shot element exists and
    // receives pointer events even at opacity 0, and an impulse born there would
    // start a decay loop for a composition nobody is looking at.
    if (!this.#active || !canvas || this.#css.width <= 0 || this.#css.height <= 0) {
      return;
    }
    // The visual box here, deliberately unlike `#resize` above: a pointer's
    // coordinates are in the transformed space a visitor is actually looking at, so
    // mapping them through anything else would put the stir where they did not tap.
    const box = canvas.getBoundingClientRect();
    this.#impulse = {
      x: (event.clientX - box.left) / Math.max(box.width, 1),
      y: (event.clientY - box.top) / Math.max(box.height, 1),
      born: performance.now(),
    };
    this.#decay();
  }

  /**
   * The renderer's only loop, and it runs only while an impulse is decaying.
   *
   * Scroll already redraws; what scrolling cannot do is animate the recovery while
   * the reader holds still, which is the part a visitor actually watches. It ends
   * itself at strength zero, having drawn one last canonical frame, and `#release`
   * ends it at any boundary — so there is no state in which this is running and the
   * shot is not.
   */
  #decay(): void {
    if (this.#frame) {
      return;
    }
    this.#frame = requestAnimationFrame((time) => {
      this.#frame = 0;
      const held = this.#held;
      if (!held || !this.#active) {
        this.#impulse = undefined;
        return;
      }
      if (this.#strength(time) > 0) {
        this.#draw(held.context, held.shot, time);
        this.#decay();
        return;
      }
      // Back to the canonical composition, and one frame that shows it.
      this.#impulse = undefined;
      this.#draw(held.context, held.shot, time);
    });
  }

  #draw(context: RuntimeContext, shot: ShotState, now: number): void {
    const paint = this.#paint;
    if (!paint || this.#buffer.width === 0 || this.#css.width === 0) {
      return;
    }
    const calm = context.reducedMotion;
    const bands = calm ? CALM : FULL;
    // The tier thins the field as well as the comfort mode: a four-core phone draws
    // the same composition with fewer motes, not a different composition.
    const density = context.quality === 'reduced' ? 0.65 : 1;
    const scale = this.#dpr || 1;
    const { width, height } = this.#css;

    paint.setTransform(scale, 0, 0, scale, 0, 0);
    paint.clearRect(0, 0, width, height);
    paint.lineCap = 'round';
    paint.fillStyle = this.#colour;
    paint.strokeStyle = this.#colour;

    // Streaks come from speed, so they are absent at rest: stop at a given progress
    // and the composition is the one that progress alone describes. Capped, so a
    // flung scroll smears rather than drawing the whole shaft as lines.
    const speed = calm ? 0 : Math.min(Math.abs(context.velocity), 1.6);
    const strength = this.#strength(now);
    const impulse = strength > 0 ? this.#impulse : undefined;
    const push = calm ? IMPULSE.calmPush : IMPULSE.push;
    const swirl = calm ? IMPULSE.calmSwirl : IMPULSE.swirl;
    const lift = calm ? IMPULSE.calmLift : IMPULSE.lift;
    // The shot's own progress, and its tail: `core` runs 0..1 across the shot and
    // `handoff` 0..1 across the overlap, so the field keeps travelling at one rate
    // through the handover instead of stalling while the shot is still painting.
    const travel = shot.core + shot.handoff;

    let drawn = 0;
    let longest = 0;

    for (const mote of this.#motes) {
      const band = bands[mote.band];
      if (!band || band.keep <= 0 || mote.keep > band.keep * density) {
        continue;
      }
      // Upward: the world rushes past an anchored Alice. Wrapped, so the field is
      // endless without anything being created or destroyed per frame.
      let x = mote.x + Math.sin(mote.phase + travel * TAU) * 0.012 * band.streak;
      let y = wrap(mote.y - travel * band.speed * (0.75 + mote.tone * 0.5));
      let caught = 0;

      if (impulse) {
        const dx = x - impulse.x;
        const dy = y - impulse.y;
        const distance = Math.hypot(dx, dy);
        if (distance < IMPULSE.radius) {
          // Squared falloff to nothing at the edge, so the push leaves no ring.
          const falloff = (1 - distance / IMPULSE.radius) ** 2 * strength;
          const unitX = distance > 1e-4 ? dx / distance : 0;
          const unitY = distance > 1e-4 ? dy / distance : 1;
          x += (unitX - unitY * swirl) * push * falloff;
          y += (unitY + unitX * swirl) * push * falloff;
          caught = falloff * lift;
        }
      }

      const px = wrap(x) * width;
      const py = wrap(y) * height;
      // Stirred dust catches the light: displacement alone is nearly invisible on a
      // field this fine, and brightening what the visitor disturbed is what makes
      // the reaction legible at a glance — which is the whole point of an optional
      // interaction nobody is told about.
      const radius = band.size * (0.75 + mote.tone * 0.5) * (1 + caught * 0.8);
      const tail = speed * band.streak * height * 0.05;
      paint.globalAlpha = Math.min(1, band.alpha * (0.6 + mote.tone * 0.4) * (1 + caught));

      if (tail > radius) {
        // A streak is the mote smeared along the way it is travelling, which is
        // downward on the canvas when the reader is scrolling backwards.
        const along = context.direction < 0 ? -tail : tail;
        paint.lineWidth = radius * 2;
        paint.beginPath();
        paint.moveTo(px, py);
        paint.lineTo(px, py + along);
        paint.stroke();
        if (tail > longest) {
          longest = tail;
        }
      } else {
        paint.beginPath();
        paint.arc(px, py, radius, 0, TAU);
        paint.fill();
      }
      drawn += 1;
    }

    paint.globalAlpha = 1;
    this.#draws += 1;
    this.#drawn = drawn;
    this.#streak = longest;
  }
}

export const createDustRenderer = (): ShotRenderer => new DustRenderer();
