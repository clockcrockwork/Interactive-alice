import { describe, expect, it } from 'vitest';
import * as soupArt from '../lobster-quadrille/figures.ts';
import * as fanArt from '../pool-of-tears/figures.ts';
import * as teaArt from '../tea-party/figures.ts';
import type { ArtStyle } from './treatments.ts';

type Renderer = (style: ArtStyle) => string;
const props = [
  ['raven', teaArt, 'ravenMarkup', teaArt.RAVEN_SVG, 240, 200],
  ['desk', teaArt, 'deskMarkup', teaArt.DESK_SVG, 240, 200],
  ['fan', fanArt, 'fanMarkup', fanArt.FAN_SVG, 200, 160],
  ['tureen', soupArt, 'tureenMarkup', soupArt.TUREEN_SVG, 200, 140],
] as const;

describe('generated raven, desk, fan and tureen', () => {
  for (const [id, module, name, fallback, width, height] of props) {
    it(`selects one ${id} image in the unchanged logical box for engraved only`, () => {
      const render = (module as unknown as Record<string, Renderer>)[name];
      expect(render).toBeTypeOf('function');
      if (!render) return;
      const markup = render('engraved');
      expect(markup).toContain(`data-generated-${id}=""`);
      expect(markup).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(markup).toContain(`${id}.any.generated.webp`);
      expect(markup.match(/<image /g)).toHaveLength(1);
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).not.toContain('data-generated=""');
      expect(render('flat')).toBe(fallback);
      expect(render('paper')).toBe(fallback);
    });
  }

  it('keeps the fan rivet correction and the raven centered without stretching', () => {
    const fan = (fanArt as unknown as { fanMarkup?: Renderer }).fanMarkup;
    const raven = (teaArt as unknown as { ravenMarkup?: Renderer }).ravenMarkup;
    expect(fan).toBeTypeOf('function');
    expect(raven).toBeTypeOf('function');
    if (!fan || !raven) return;
    expect(fan('engraved')).toContain('x="0" y="1.8" width="200" height="160"');
    expect(raven('engraved')).toContain('x="0" y="20" width="240" height="160"');
  });

  it('retains exactly the original tureen shadow and independent steam over its body', () => {
    const render = (soupArt as unknown as { tureenMarkup?: Renderer }).tureenMarkup;
    expect(render).toBeTypeOf('function');
    if (!render) return;
    const markup = render('engraved');
    const shadow = soupArt.TUREEN_SVG.match(/<ellipse[^>]+cy="120"[^>]+\/>/)?.[0];
    const steam = soupArt.TUREEN_SVG.match(/<g class="lq__steam">[\s\S]*?<\/g>/)?.[0];
    expect(shadow).toBeDefined();
    expect(steam).toBeDefined();
    expect(markup).toContain(shadow);
    expect(markup).toContain(steam);
    expect(markup.match(/class="lq__steam"/g)).toHaveLength(1);
    expect(markup.indexOf(shadow ?? '')).toBeLessThan(markup.indexOf('<image'));
    expect(markup.indexOf('<image')).toBeLessThan(markup.indexOf(steam ?? ''));
    expect(markup).toContain('M70 46 q-10 -16 0 -30 M100 42 q-10 -18 0 -34 M130 46 q-10 -16 0 -30');
  });

  it('keeps the fallback raven vector and the tureen out of automatic foot grounding', () => {
    expect(teaArt.RAVEN_SVG).toContain('viewBox="0 0 240 200"');
    expect(teaArt.RAVEN_SVG).not.toContain('<image');
    const render = (soupArt as unknown as { tureenMarkup?: Renderer }).tureenMarkup;
    expect(render).toBeTypeOf('function');
    if (!render) return;
    expect(render('engraved')).toContain('x="0" y="0" width="200" height="140"');
  });
});
