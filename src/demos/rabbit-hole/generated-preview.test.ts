import { describe, expect, it } from 'vitest';
import { fallingMasterEligible } from './falling-master.ts';
import { previewEnabled, previewSource } from './generated-preview.ts';

describe('rabbit-hole generated fall artwork', () => {
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
    expect(source.src).toContain(`alice--falling-overhead.${variant}.generated.webp`);
    expect(source.width).toBe(1206);
    expect(source.height).toBe(height);
  });
});

describe('production overhead falling plate scope', () => {
  it('uses the engraved yellow whole-body plate only for ordinary non-reduced falling', () => {
    expect(fallingMasterEligible('engraved', 'yellow', false)).toBe(true);
    expect(fallingMasterEligible('engraved', 'blue', false)).toBe(false);
    expect(fallingMasterEligible('flat', 'yellow', false)).toBe(false);
    expect(fallingMasterEligible('paper', 'yellow', false)).toBe(false);
    expect(fallingMasterEligible('engraved', 'yellow', true)).toBe(false);
    expect(fallingMasterEligible('engraved', 'yellow', false, true)).toBe(false);
  });
});
