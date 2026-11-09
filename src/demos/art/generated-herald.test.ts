import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';

describe('generated herald candidate', () => {
  it('uses one any-colour illustration across both Alice variants and all three call sites', () => {
    const first = figure('white-rabbit/herald', '', 'engraved', 'witnesses', 'yellow');
    expect(first).toContain('data-generated=""');
    expect(first).toContain('data-variant="any"');
    expect(first).toContain('white-rabbit--herald.any.generated.webp');
    for (const scene of ['witnesses', 'trial', 'croquet']) {
      for (const variant of ['yellow', 'blue'] as const) {
        expect(figure('white-rabbit/herald', '', 'engraved', scene, variant)).toBe(first);
      }
    }
  });

  it('keeps the 140 by 220 box and grounds the unmodified source without stretching', () => {
    const markup = figure('white-rabbit/herald', '', 'engraved', 'witnesses');
    expect(markup).toContain('viewBox="0 0 140 220"');
    const image = markup.match(
      /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
    );
    expect(image).not.toBeNull();
    if (!image) return;
    const [, x, y, width, height] = image.map(Number);
    expect((width ?? 0) / (height ?? 1)).toBeCloseTo(1001 / 1572, 8);
    expect((x ?? 0) + (width ?? 0) / 2).toBeCloseTo(70, 8);
    expect((y ?? 0) + (height ?? 0) * (1515 / 1572)).toBeCloseTo(220, 8);
  });

  it('retains flat and paper vectors on every call site', () => {
    for (const scene of ['witnesses', 'trial', 'croquet']) {
      for (const style of ['flat', 'paper'] as const) {
        const markup = figure('white-rabbit/herald', '', style, scene);
        expect(markup).not.toContain('data-generated');
        expect(markup).toContain('viewBox="0 0 140 220"');
        expect(markup).toContain('var(--wonder-red)');
      }
    }
  });

  it('does not replace other rabbit poses', () => {
    for (const pose of ['running', 'diving', 'garden']) {
      expect(figure(`white-rabbit/${pose}`, '', 'engraved', 'croquet')).not.toContain(
        'data-generated',
      );
    }
  });
});
