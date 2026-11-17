import { describe, expect, it } from 'vitest';
import { TILT_RANGE, TILT_REST, tiltToPointer, validTilt } from './tilt.ts';

describe('a lean steers the same way on the screen however the screen is turned', () => {
  it('in portrait: gamma is right, beta past the reading rest is down', () => {
    expect(tiltToPointer(TILT_REST, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(tiltToPointer(TILT_REST, TILT_RANGE, 0).x).toBe(1);
    expect(tiltToPointer(TILT_REST + TILT_RANGE, 0, 0).y).toBe(1);
  });

  it('in landscape turned 90°: the right edge down is beta, the screen leaning back is -gamma', () => {
    expect(tiltToPointer(0, -TILT_REST, 90)).toEqual({ x: 0, y: 0 });
    expect(tiltToPointer(TILT_RANGE, -TILT_REST, 90).x).toBe(1);
    expect(tiltToPointer(-TILT_RANGE, -TILT_REST, 90).x).toBe(-1);
    expect(tiltToPointer(0, -(TILT_REST + TILT_RANGE), 90).y).toBe(1);
  });

  it('in landscape turned 270°: the other way round', () => {
    expect(tiltToPointer(0, TILT_REST, 270)).toEqual({ x: 0, y: 0 });
    expect(tiltToPointer(-TILT_RANGE, TILT_REST, 270).x).toBe(1);
    expect(tiltToPointer(0, TILT_REST + TILT_RANGE, 270).y).toBe(1);
    // A lean that steers right at 90° steers left at 270°.
    expect(tiltToPointer(10, 0, 90).x).toBeCloseTo(-tiltToPointer(10, 0, 270).x);
  });

  it('upside down: both axes reversed', () => {
    expect(tiltToPointer(-TILT_REST, 0, 180)).toEqual({ x: 0, y: 0 });
    expect(tiltToPointer(-TILT_REST, -TILT_RANGE, 180).x).toBe(1);
    expect(tiltToPointer(-(TILT_REST + TILT_RANGE), 0, 180).y).toBe(1);
  });

  it('takes an angle reported as -90 or 360 to its quarter, and stays inside the screen', () => {
    expect(tiltToPointer(5, 10, -90)).toEqual(tiltToPointer(5, 10, 270));
    expect(tiltToPointer(5, 10, 360)).toEqual(tiltToPointer(5, 10, 0));
    const far = tiltToPointer(170, 89, 0);
    expect(Math.abs(far.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(far.y)).toBeLessThanOrEqual(1);
  });
});

describe('a reading', () => {
  it('needs both angles as numbers: a device without a sensor sends nulls', () => {
    expect(validTilt({ beta: null, gamma: null })).toBe(false);
    expect(validTilt({ beta: 10, gamma: null })).toBe(false);
    expect(validTilt({ beta: Number.NaN, gamma: 0 })).toBe(false);
    expect(validTilt({ beta: 0, gamma: 0 })).toBe(true);
  });
});
