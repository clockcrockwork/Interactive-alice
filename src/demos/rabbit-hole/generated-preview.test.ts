import { describe, expect, it } from 'vitest';
import { previewEnabled, previewSource } from './generated-preview.ts';

describe('rabbit-hole generated master preview opt-in', () => {
  it('leaves ordinary pages and unknown query values alone', () => {
    expect(previewEnabled('')).toBe(false);
    expect(previewEnabled('?artPreview=other')).toBe(false);
  });
  it('opens only the explicit overhead comparison', () => {
    expect(previewEnabled('?artPreview=overhead')).toBe(true);
  });
});

describe('generated preview colour sources', () => {
  it.each([
    ['yellow', 1304],
    ['blue', 1305],
  ] as const)('keeps the %s candidate natural dimensions', (variant, height) => {
    const source = previewSource(variant);
    expect(source.src).toContain(`alice--falling-overhead.${variant}.candidate-v1.webp`);
    expect(source.width).toBe(1206);
    expect(source.height).toBe(height);
  });
});
