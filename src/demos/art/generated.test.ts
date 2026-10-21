import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';

describe('generated court Alice', () => {
  it('uses the yellow illustration in the original 120 by 220 court box', () => {
    const markup = figure('alice/from-behind', '', 'engraved', 'trial', 'yellow');
    expect(markup).toContain('data-generated=""');
    expect(markup).toContain('viewBox="0 0 120 220"');
    expect(markup).toContain('alice--from-behind.yellow.generated.webp');
    expect(markup).not.toContain('data-variant="blue"');
    const image = markup.match(
      /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
    );
    expect(image).not.toBeNull();
    if (!image) return;
    const [, x, y, width, height] = image.map(Number);
    expect((width ?? 0) / (height ?? 1)).toBeCloseTo(926 / 1698, 8);
    expect((x ?? 0) + (width ?? 0) / 2).toBeCloseTo(60, 8);
    expect((y ?? 0) + (height ?? 0) * (1602 / 1698)).toBeCloseTo(220, 8);
  });

  it('uses the same illustration and foot anchor on both sides of the court join', () => {
    expect(figure('alice/from-behind', '', 'engraved', 'witnesses', 'yellow')).toBe(
      figure('alice/from-behind', '', 'engraved', 'trial', 'yellow'),
    );
  });

  it('keeps the blue drawing and never labels the yellow illustration as blue', () => {
    const markup = figure('alice/from-behind', '', 'engraved', 'trial', 'blue');
    expect(markup).toContain('viewBox="0 0 120 220"');
    expect(markup).not.toContain('data-generated');
    expect(markup).not.toContain('.generated.webp');
  });

  it('leaves alternate styles, the live falling rig and unchecked contact consumer unchanged', () => {
    for (const style of ['flat', 'paper'] as const) {
      expect(figure('alice/from-behind', '', style, 'trial', 'yellow')).not.toContain(
        'data-generated',
      );
    }
    for (const scene of ['rabbit-hole', 'duchess']) {
      expect(figure('alice/falling', '', 'engraved', scene, 'yellow')).not.toContain(
        'data-generated',
      );
    }
  });
});
