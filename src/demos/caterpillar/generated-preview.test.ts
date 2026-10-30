import { describe, expect, it } from 'vitest';
import {
  decodedMushroom,
  mushroomEnabled,
  previewEnabled,
  previewPlacement,
  previewSource,
} from './generated-preview.ts';

describe('scene-local mushroom introduction', () => {
  it('introduces the generated source on ordinary engraved pages', () => {
    expect(mushroomEnabled('', 'engraved')).toBe(true);
  });

  it.each(['flat', 'paper'] as const)('retains the ordinary %s drawing', (style) => {
    expect(mushroomEnabled('', style)).toBe(false);
    expect(mushroomEnabled('?artPreview=other', style)).toBe(false);
    expect(mushroomEnabled('?artPreview=mushroom', style)).toBe(true);
  });

  it('does not publish readiness until decoding finishes', async () => {
    let release = (): void => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const image = { decode: () => pending, naturalWidth: 1402, isConnected: true };
    let result: boolean | undefined;
    const completed = decodedMushroom(image).then((ready) => {
      result = ready;
    });
    await Promise.resolve();
    expect(result).toBeUndefined();
    release();
    await completed;
    expect(result).toBe(true);
  });

  it('retains fallback after a decode failure', async () => {
    const image = {
      decode: async () => {
        throw new Error('decode failed');
      },
      naturalWidth: 1402,
      isConnected: true,
    };
    expect(await decodedMushroom(image)).toBe(false);
  });

  it('does not reveal a disconnected or empty image', async () => {
    for (const [naturalWidth, isConnected] of [
      [1402, false],
      [0, true],
    ] as const) {
      expect(await decodedMushroom({ decode: async () => {}, naturalWidth, isConnected })).toBe(
        false,
      );
    }
  });
});

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
