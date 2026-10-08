/**
 * The caption fit budget's arithmetic, apart from the DOM so it can be tested
 * alone: the steps the shell takes for a stack of slips that does not fit its
 * frame, and how far a stack may be moved inside it. The shell (shell.ts,
 * fitCaptions) measures and applies; docs/text-experience-binding.md §9 states the
 * rule.
 */

/**
 * The caption fit budget: what the shell does, in order, to a beat whose stack of
 * slips does not fit between the bar and the frame's foot (or the band the beat
 * declares). Each step is tried only where the one before was not enough. The size
 * steps help a stack that grows towards the edge it crosses; one placed from that
 * edge is moved first and set smaller only if the move alone cannot fit it. A stack
 * that still overflows after the last is reported (`data-fit="over"`, a console
 * warning and the seam), never clipped silently.
 */
export const FIT_STEPS = ['small', 'smaller', 'tight', 'shift'] as const;
export type FitStep = (typeof FIT_STEPS)[number] | 'over';

/** Room kept between a stack and the frame it must fit, in CSS pixels. */
export const FIT_MARGIN = 10;

/**
 * How far to move a stack that a smaller size and tighter leading could not fit:
 * up when it runs past the foot, down when it starts under the bar, never so far
 * that it crosses the other edge. Negative is up.
 */
export function fitShift(top: number, bottom: number, min: number, max: number): number {
  if (bottom > max) {
    return -Math.max(0, Math.min(bottom - max, top - min));
  }
  if (top < min) {
    return Math.max(0, Math.min(min - top, max - bottom));
  }
  return 0;
}

/**
 * A length written in a custom property (`4.25rem`, `0px`, `0`, `60%`), in pixels;
 * a percentage is of `whole` (the frame's height). Anything else is nothing.
 */
export function cssPixels(value: string, rem: number, em: number, whole = 0): number {
  const match = /^\s*(-?[\d.]+)(px|rem|em|%)?\s*$/.exec(value);
  if (!match) {
    return 0;
  }
  const n = Number(match[1]);
  switch (match[2]) {
    case 'rem':
      return n * rem;
    case 'em':
      return n * em;
    case '%':
      return (n / 100) * whole;
    default:
      return n;
  }
}
