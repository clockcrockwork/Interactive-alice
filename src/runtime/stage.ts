/**
 * Puts runtime state onto the document.
 *
 * The runtime writes custom properties and state attributes; CSS decides what they
 * look like. That keeps motion out of TypeScript and lets a reduced-motion design
 * live next to the full one.
 */

import type { RuntimeContext } from './context.ts';
import { type ShotSpan, type Span, shotStates, spanStates } from './progress.ts';

export interface StageUnit {
  element: HTMLElement;
  span: Span;
}

export interface ShotUnit {
  element: HTMLElement;
  span: ShotSpan;
}

/**
 * The units of one scene, kept apart by kind.
 *
 * Shots and beats are not interchangeable here: a shot may stay on screen after
 * the next one has taken over, and a beat never does. One flat list would have to
 * rediscover which is which on every frame.
 */
export interface SceneUnits {
  shots: readonly ShotUnit[];
  beats: readonly StageUnit[];
}

/** Three decimals is finer than a pixel at any viewport, and keeps writes down. */
const round = (value: number): string => value.toFixed(3);

export class Stage {
  readonly #scene: HTMLElement;
  readonly #shots: readonly ShotUnit[];
  readonly #beats: readonly StageUnit[];
  /** The spans on their own, so a frame does not rebuild the arrays to read them. */
  readonly #shotSpans: readonly ShotSpan[];
  readonly #beatSpans: readonly Span[];
  // Keyed by element: a shot and a beat may legally share an id, and keying by id
  // would let one of them swallow the other's updates.
  readonly #last = new WeakMap<HTMLElement, string>();

  constructor(scene: HTMLElement, units: SceneUnits) {
    this.#scene = scene;
    this.#shots = units.shots;
    this.#beats = units.beats;
    this.#shotSpans = units.shots.map((unit) => unit.span);
    this.#beatSpans = units.beats.map((unit) => unit.span);
  }

  apply(context: RuntimeContext): void {
    // The scene's own values go through the same guard as its units, so a frame
    // that changes nothing writes nothing anywhere.
    const sceneKey = `${round(context.progress)}:${context.direction}:${context.quality}`;
    if (this.#last.get(this.#scene) !== sceneKey) {
      this.#last.set(this.#scene, sceneKey);
      this.#scene.style.setProperty('--scene-progress', round(context.progress));
      this.#scene.dataset.direction = String(context.direction);
      this.#scene.dataset.quality = context.quality;
    }

    // One pass over the shots, deriving every state from this progress alone. No
    // shot is told that another is handing over to it: both read the same value.
    // `shotStates` rather than `composeShots`, because the stage wants each shot's
    // own state and never the summary the snapshot reports.
    const shots = shotStates(context.progress, this.#shotSpans);
    for (const [index, unit] of this.#shots.entries()) {
      const shot = shots[index];
      if (!shot) {
        continue;
      }
      this.#write(unit.element, shot.state, shot.core, shot.handoff);
    }

    // Beats go through the same track rule, so the last beat of a scene is still
    // the active one when a reader reaches the end rather than one the document
    // has finished with while its stage is still on screen.
    const beats = spanStates(context.progress, this.#beatSpans);
    for (const [index, unit] of this.#beats.entries()) {
      const beat = beats[index];
      if (!beat) {
        continue;
      }
      this.#write(unit.element, beat.state, beat.local);
    }
  }

  /** Writes one unit's state, skipping the work when nothing it shows has changed. */
  #write(element: HTMLElement, state: string, progress: number, handoff?: number): void {
    const key =
      handoff === undefined
        ? `${state}:${round(progress)}`
        : `${state}:${round(progress)}:${round(handoff)}`;
    if (this.#last.get(element) === key) {
      return;
    }
    this.#last.set(element, key);
    element.dataset.state = state;
    element.style.setProperty('--progress', round(progress));
    if (handoff !== undefined) {
      element.style.setProperty('--handoff', round(handoff));
    }
  }
}

/** Reads the beat spans the build wrote into the markup. */
export function readBeats(scene: HTMLElement): StageUnit[] {
  return [...scene.querySelectorAll<HTMLElement>('.beat')].map((element) => ({
    element,
    span: readSpan(element, element.dataset.beat, '.beat'),
  }));
}

/**
 * Reads the shot spans, and the overlap each shot carries into the next.
 *
 * The build writes `data-overlap` only where a shot declares one, so a scene of
 * hard cuts produces the same markup it always did and reads back as every
 * overlap being zero.
 */
export function readShots(scene: HTMLElement): ShotUnit[] {
  return [...scene.querySelectorAll<HTMLElement>('.shot')].map((element) => {
    const span = readSpan(element, element.dataset.shot, '.shot');
    const declared = element.dataset.overlap;
    // Parsed strictly rather than coerced. `Number('')` is 0, so an attribute that
    // is present but empty would otherwise read as a hard cut and the composition
    // would quietly differ from its mapping.
    const overlap = declared === undefined ? 0 : Number.parseFloat(declared);
    if (declared?.trim() === '' || !Number.isFinite(overlap) || overlap < 0 || overlap > 1) {
      throw new Error(`.shot ${span.id} has an unusable overlap: ${JSON.stringify(declared)}`);
    }
    return { element, span: { ...span, overlap } };
  });
}

function readSpan(element: HTMLElement, id: string | undefined, selector: string): Span {
  const start = Number(element.dataset.start);
  const end = Number(element.dataset.end);
  if (!id || Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error(`${selector} is missing its id or span`);
  }
  return { id, start, end };
}
