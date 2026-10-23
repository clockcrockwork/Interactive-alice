import { describe, expect, it } from 'vitest';
import * as witnesses from '../witnesses/figures.ts';
import type { ArtStyle } from './treatments.ts';

type Renderer = (style?: ArtStyle) => string;
const props = [
  ['witness-teacup', 'teacupMarkup', witnesses.TEACUP_SVG, 60, 44],
  ['bread-and-butter', 'breadMarkup', witnesses.BREAD_SVG, 60, 40],
  ['hatter-shoe', 'shoeMarkup', witnesses.SHOE_SVG, 44, 22],
  ['pepper-box', 'pepperBoxMarkup', witnesses.PEPPER_BOX_SVG, 30, 50],
] as const;

const renderer = (name: string): Renderer => {
  const render = (witnesses as unknown as Record<string, Renderer>)[name];
  expect(render).toBeTypeOf('function');
  return render as Renderer;
};

describe('generated witnesses props', () => {
  for (const [id, name, fallback, width, height] of props) {
    it(`selects one whole ${id} cutout only inside its original engraved canvas`, () => {
      const markup = renderer(name)('engraved');
      expect(markup).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(markup).toContain(`data-generated-${id}=""`);
      expect(markup).toContain(`${id}.any.generated.webp`);
      expect(markup.match(/<image /g)).toHaveLength(1);
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).toContain('focusable="false"');
      // An .art wrapper would activate previously inactive shoe-shaking CSS
      // or send these scene props through character treatment/grounding.
      expect(markup).not.toMatch(/\b(?:class|style|filter|transform)=/);
      expect(markup).not.toContain('data-generated=""');
    });

    it(`preserves the exact original ${id} SVG for flat, paper and SSR`, () => {
      const render = renderer(name);
      for (const style of ['flat', 'paper', undefined] as const) {
        expect(render(style)).toBe(fallback);
        expect(render(style)).not.toContain('<image');
      }
    });
  }

  it('preserves whole-source placements without changing the four logical pivots', () => {
    const placements = [
      ['teacupMarkup', '-2.151351', '1.486486', '63.308108', '46.443243', 480 / 352],
      ['breadMarkup', '-0.808023', '0.699140', '61.616046', '41.077364', 480 / 320],
      ['shoeMarkup', '-2.937238', '-1.394700', '49.483961', '24.741980', 480 / 240],
      ['pepperBoxMarkup', '-2.172849', '-2.737174', '33.720600', '56.224152', 288 / 480],
    ] as const;
    for (const [name, x, y, width, height, encodedAspect] of placements) {
      const markup = renderer(name)('engraved');
      expect(markup).toContain(`x="${x}" y="${y}" width="${width}" height="${height}"`);
      // Integer encoding dimensions can round the aspect by less than 0.1%.
      // meet preserves the encoded pixels rather than stretching to this rect.
      expect(Math.abs(Number(width) / Number(height) / encodedAspect - 1)).toBeLessThan(0.001);
    }
  });

  it('reuses the same unchanged shoe cutout for both feet', () => {
    const render = renderer('shoeMarkup');
    expect(render('engraved')).toBe(render('engraved'));
    expect(render('engraved')).not.toContain('scale(-1');
  });
});
