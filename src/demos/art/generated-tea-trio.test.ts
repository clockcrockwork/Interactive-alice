import { describe, expect, it } from 'vitest';
import * as tea from '../tea-party/figures.ts';
import type { ArtStyle } from './treatments.ts';

type Renderer = (style?: ArtStyle) => string;
const props = [
  ['knife', 'knifeMarkup', tea.KNIFE_SVG, 300, 60],
  ['butter', 'butterMarkup', tea.BUTTER_SVG, 160, 90],
  ['tray', 'trayMarkup', tea.TRAY_SVG, 160, 50],
] as const;

const renderer = (name: string): Renderer => {
  const render = (tea as unknown as Record<string, Renderer>)[name];
  expect(render).toBeTypeOf('function');
  return render as Renderer;
};

describe('generated tea-party knife, butter and tray', () => {
  for (const [id, name, fallback, width, height] of props) {
    it(`selects one ${id} cutout inside its original logical canvas for engraved only`, () => {
      const render = renderer(name);
      const markup = render('engraved');
      expect(markup).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(markup).toContain(`data-generated-${id}=""`);
      expect(markup).toContain(`${id}.any.generated.webp`);
      expect(markup.match(/<image /g)).toHaveLength(1);
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).toContain('focusable="false"');
      expect(markup).not.toContain('data-generated=""');
      for (const style of ['flat', 'paper', undefined] as const) {
        expect(render(style)).toBe(fallback);
        expect(render(style)).not.toContain('<image');
      }
    });
  }

  it('reframes the whole knife source without stretching its three-to-one canvas', () => {
    expect(renderer('knifeMarkup')('engraved')).toContain(
      'x="-2.902486" y="-23.543977" width="305.24283" height="101.74761"',
    );
  });

  it('lowers the complete butter dish to its original saucer base near y88', () => {
    expect(renderer('butterMarkup')('engraved')).toContain(
      'x="-1.557409" y="7.076331" width="163.017319" height="91.745991"',
    );
  });

  it('centres the whole tray in its original 160 by 50 canvas', () => {
    expect(renderer('trayMarkup')('engraved')).toContain(
      'x="-0.063297" y="-2.338687" width="160.052905" height="53.350968"',
    );
  });
});
