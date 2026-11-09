/**
 * The caption fit budget's arithmetic: the order of the steps, how far a stack is
 * moved inside its frame, and the lengths a demo writes in custom properties. The
 * measuring itself is browser work (tests/caption-fit.spec.ts).
 */

import { describe, expect, it } from 'vitest';
import { cssPixels, FIT_STEPS, fitShift } from './fit.ts';

describe('the caption fit budget', () => {
  it('steps the size down twice, then the leading, and moves the stack last', () => {
    expect(FIT_STEPS).toEqual(['small', 'smaller', 'tight', 'shift']);
  });

  it('moves a stack up off the foot, or down from under the bar, never past the other edge', () => {
    // Frame from 60 to 700.
    expect(fitShift(400, 760, 60, 700)).toBe(-60);
    // Only as far as the room above allows.
    expect(fitShift(80, 760, 60, 700)).toBe(-20);
    expect(fitShift(40, 300, 60, 700)).toBe(20);
    expect(fitShift(40, 690, 60, 700)).toBe(10);
    // A stack that fits stays where its demo put it.
    expect(fitShift(100, 600, 60, 700)).toBe(0);
    // Taller than the frame: no room either way, so it is not moved, and is reported.
    expect(Math.abs(fitShift(60, 760, 60, 700))).toBe(0);
  });

  it('reads the lengths a demo writes in its custom properties', () => {
    expect(cssPixels('4.25rem', 16, 20)).toBe(68);
    expect(cssPixels(' 1.5em', 16, 20)).toBe(30);
    expect(cssPixels('12px', 16, 20)).toBe(12);
    expect(cssPixels('0', 16, 20)).toBe(0);
    // A share of the frame, for a beat's own top or foot.
    expect(cssPixels('60%', 16, 20, 800)).toBe(480);
    // Anything else (a calc, nothing) counts as nothing, never as a wrong number.
    expect(cssPixels('calc(1rem + 2px)', 16, 20)).toBe(0);
    expect(cssPixels('', 16, 20)).toBe(0);
  });
});
