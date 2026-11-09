import { describe, expect, it } from 'vitest';
import { captionCeiling, safeGlassY } from './glass-placement.ts';

describe('kitchen crockery caption clearance', () => {
  it('uses the tallest upcoming caption container in stage coordinates', () => {
    expect(
      captionCeiling({ top: 100, height: 720 }, [
        { top: 630, width: 600, height: 120 },
        { top: 410, width: 600, height: 300 },
        { top: 560, width: 600, height: 200 },
      ]),
    ).toBe(310);
  });

  it('ignores absent or zero-size captions, not visibility-hidden layout boxes', () => {
    expect(
      captionCeiling({ top: 0, height: 720 }, [
        { top: 0, width: 0, height: 0 },
        { top: 0, width: 600, height: 0 },
        { top: 740, width: 600, height: 20 },
        { top: 350, width: 600, height: 280 },
      ]),
    ).toBe(350);
    expect(captionCeiling({ top: 0, height: 0 }, [])).toBeUndefined();
    expect(captionCeiling({ top: 0, height: 720 }, [])).toBeUndefined();
  });

  it('keeps the sampled position when the whole rotating wrapper is clear', () => {
    expect(safeGlassY(18, 720, 129.6, 129.6, 350)).toBe(18);
    expect(safeGlassY(42.8, 720, 129.6, 129.6)).toBe(42.8);
  });

  for (const [label, stageHeight, width, height, ceiling] of [
    ['tall Japanese caption', 720, 129.6, 129.6, 350],
    ['narrow viewport', 640, 96, 96, 190],
    ['short viewport', 240, 96, 96, 60],
    ['long fire-iron', 720, 192, (192 * 40) / 140, 350],
  ] as const) {
    it(`keeps every rotation above the caption in a ${label}`, () => {
      const y = safeGlassY(50, stageHeight, width, height, ceiling);
      expect(y).toBeLessThan(50);
      for (let angle = -180; angle <= 180; angle += 5) {
        const radians = (angle * Math.PI) / 180;
        const halfHeight =
          (Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians))) / 2;
        expect((stageHeight * y) / 100 + halfHeight).toBeLessThanOrEqual(ceiling - 8);
      }
    });
  }

  it('recomputes against new viewport geometry without consuming randomness', () => {
    const desired = 42.8;
    const first = safeGlassY(desired, 720, 129.6, 129.6, 350);
    const resized = safeGlassY(desired, 500, 96, 96, 200);
    expect(resized).toBeLessThan(first);
    expect(safeGlassY(desired, 720, 129.6, 129.6, 350)).toBe(first);
    expect(safeGlassY(desired, 0, 0, 0, 0)).toBe(desired);
  });
});
