import { describe, expect, it } from 'vitest';
import { previewEnabled, previewPlacement, previewSource } from './generated-preview.ts';

describe('mushroom comparison opt-in', () => {
  it.each(['', '?artPreview=overhead', '?artPreview=other', '?artPreview=Mushroom'])(
    'does not activate for %s',
    (search) => {
      expect(previewEnabled(search)).toBe(false);
    },
  );

  it('activates only the explicit mushroom comparison', () => {
    expect(previewEnabled('?artPreview=mushroom')).toBe(true);
  });
});

describe('mushroom comparison geometry', () => {
  it('retains the candidate natural canvas and measured stem baseline', () => {
    const source = previewSource();
    expect(source.src).toContain('mushroom.any.candidate-v1.webp');
    expect(source.width).toBe(1402);
    expect(source.height).toBe(1122);
    expect(source.footY).toBe(1107);
  });

  it('fits uniformly in the unchanged logical box with the visible stem at its floor', () => {
    const source = previewSource();
    const placement = previewPlacement();
    const scale = placement.width / source.width;
    expect(placement.box).toEqual([400, 320]);
    expect(placement.height / source.height).toBeCloseTo(scale, 10);
    expect(placement.width).toBeLessThanOrEqual(400);
    expect(placement.height).toBeLessThanOrEqual(320);
    expect(placement.x * 2 + placement.width).toBeCloseTo(400, 10);
    expect(placement.y + source.footY * scale).toBeCloseTo(320, 10);
    expect(placement.y).toBeCloseTo(4.2780748663, 8);
  });
});
