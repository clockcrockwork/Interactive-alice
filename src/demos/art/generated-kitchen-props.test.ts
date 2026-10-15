import { describe, expect, it } from 'vitest';
import * as kitchen from '../pig-and-pepper/figures.ts';
import type { ArtStyle } from './treatments.ts';

type Renderer = (kind: string, style?: ArtStyle) => string;
const props = [
  ['saucepan', 120, 80],
  ['plate', 100, 100],
  ['dish', 120, 70],
  ['fire-iron', 140, 40],
] as const;
const renderer = () => {
  const render = (kitchen as unknown as { thingMarkup?: Renderer }).thingMarkup;
  expect(render).toBeTypeOf('function');
  return render as Renderer;
};

describe('generated kitchen crockery', () => {
  for (const [kind, width, height] of props) {
    it(`selects one ${kind} image in the existing logical box for engraved only`, () => {
      const render = renderer();
      const markup = render(kind, 'engraved');
      expect(markup).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(markup).toContain(`data-generated-${kind}=""`);
      expect(markup).toContain(`${kind}.any.generated.webp`);
      expect(markup.match(/<image /g)).toHaveLength(1);
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).toContain('focusable="false"');
      expect(markup).not.toContain('data-generated=""');
      expect(render(kind, 'flat')).toBe(kitchen.THINGS[kind]);
      expect(render(kind, 'paper')).toBe(kitchen.THINGS[kind]);
      expect(render(kind)).toBe(kitchen.THINGS[kind]);
    });
  }

  it('keeps frying-pan vector-only and unknown things empty in every style', () => {
    const render = renderer();
    for (const style of ['flat', 'paper', 'engraved'] as const) {
      expect(render('frying-pan', style)).toBe(kitchen.THINGS['frying-pan']);
      expect(render('frying-pan', style)).not.toContain('<image');
      expect(render('missing', style)).toBe('');
    }
  });

  it('frames whole assets without changing wrapper centres or distorting the iron', () => {
    const render = renderer();
    expect(render('plate', 'engraved')).toContain('x="0.65" y="0.65" width="98.7" height="98.7"');
    expect(render('dish', 'engraved')).toContain('x="0" y="4.8" width="120" height="70"');
    expect(render('saucepan', 'engraved')).toContain('x="0" y="0" width="120" height="80"');
    expect(render('fire-iron', 'engraved')).toContain(
      'x="0" y="-3.333333" width="140" height="46.666666"',
    );
  });
});
