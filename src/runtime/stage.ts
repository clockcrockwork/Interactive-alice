/**
 * Puts runtime state onto the document.
 *
 * The runtime writes custom properties and state attributes; CSS decides what they
 * look like. That keeps motion out of TypeScript and lets a reduced-motion design
 * live next to the full one.
 */

import type { RuntimeContext } from './context.ts';
import { type Span, spanState } from './progress.ts';

export interface StageUnit {
  element: HTMLElement;
  span: Span;
}

/** Three decimals is finer than a pixel at any viewport, and keeps writes down. */
const round = (value: number): string => value.toFixed(3);

export class Stage {
  readonly #scene: HTMLElement;
  readonly #units: readonly StageUnit[];
  readonly #last = new Map<string, string>();

  constructor(scene: HTMLElement, units: readonly StageUnit[]) {
    this.#scene = scene;
    this.#units = units;
  }

  apply(context: RuntimeContext): void {
    this.#scene.style.setProperty('--scene-progress', round(context.progress));
    this.#scene.dataset.direction = String(context.direction);
    this.#scene.dataset.quality = context.quality;

    for (const unit of this.#units) {
      const { state, local } = spanState(context.progress, unit.span);
      const key = `${state}:${round(local)}`;
      if (this.#last.get(unit.span.id) === key) {
        continue;
      }
      this.#last.set(unit.span.id, key);
      unit.element.dataset.state = state;
      unit.element.style.setProperty('--progress', round(local));
    }
  }
}

/** Reads the spans the build wrote into the markup. */
export function readUnits(scene: HTMLElement, selector: string): StageUnit[] {
  return [...scene.querySelectorAll<HTMLElement>(selector)].map((element) => {
    const id = element.dataset.shot ?? element.dataset.beat ?? '';
    const start = Number(element.dataset.start);
    const end = Number(element.dataset.end);
    if (!id || Number.isNaN(start) || Number.isNaN(end)) {
      throw new Error(`${selector} is missing its id or span`);
    }
    return { element, span: { id, start, end } };
  });
}
