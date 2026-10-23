import { describe, expect, it } from 'vitest';
import { CLUMP_SVG, clumpMarkup } from '../bill-the-lizard/figures.ts';
import { LEFT_BIT_SVG, mushroomPieceMarkup, RIGHT_BIT_SVG } from '../caterpillar/figures.ts';
import { CUSHION_SVG, cushionMarkup } from '../croquet/figures.ts';
import { generatedSceneProp } from './generated-scene-prop.ts';

describe('bounded generated scene props', () => {
  for (const style of ['flat', 'paper'] as const) {
    it(`preserves every original source in ${style}`, () => {
      expect(clumpMarkup(style)).toBe(CLUMP_SVG);
      expect(cushionMarkup(style)).toBe(CUSHION_SVG);
      expect(mushroomPieceMarkup(false, style)).toBe(LEFT_BIT_SVG);
      expect(mushroomPieceMarkup(true, style)).toBe(RIGHT_BIT_SVG);
    });
  }
  for (const [name, markup, box] of [
    ['hedge', () => clumpMarkup('engraved'), '200 140'],
    ['cushion', () => cushionMarkup('engraved'), '100 60'],
    ['mushroom', () => mushroomPieceMarkup(false, 'engraved'), '200 160'],
  ] as const) {
    it(`${name} retains original fallback and one atomic-decode image`, () => {
      const result = markup();
      expect(result).toContain(`viewBox="0 0 ${box}"`);
      expect(result).toContain('data-rig-fallback');
      expect(result).toContain('data-rig-generated="" visibility="hidden" display="none"');
      expect(result.match(/data-rig-image=/g)).toHaveLength(1);
      expect(result).toContain('<pattern');
      expect(result).toContain('preserveAspectRatio="xMidYMid meet"');
    });
  }
  it('mirrors the same mushroom source once only on the right', () => {
    const left = mushroomPieceMarkup(false, 'engraved');
    const right = mushroomPieceMarkup(true, 'engraved');
    expect(left).not.toContain('scaleX(-1)');
    expect(right.match(/scaleX\(-1\)/g)).toHaveLength(1);
    expect(left.match(/href="([^"]+)"/)?.[1]).toBe(right.match(/href="([^"]+)"/)?.[1]);
  });
  it('does not fabricate a drawing when original is not an SVG', () => {
    expect(generatedSceneProp('hedge-clump', '', [200, 140], [0, 0, 200, 140], 'engraved')).toBe(
      '',
    );
  });
  it('uses unique paint IDs for independently inserted props', () => {
    expect(clumpMarkup('engraved').match(/id="([^"]+)"/)?.[1]).not.toBe(
      clumpMarkup('engraved').match(/id="([^"]+)"/)?.[1],
    );
  });
});
