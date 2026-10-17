import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as kitchen from '../pig-and-pepper/figures.ts';
import * as tea from '../tea-party/figures.ts';
import type { ArtStyle } from './treatments.ts';

type Renderer = (style?: ArtStyle) => string;
type WatchRenderer = (format?: (n: number) => string, style?: ArtStyle) => string;
const renderer = (name: string): Renderer => {
  const render = (tea as unknown as Record<string, Renderer>)[name];
  expect(render).toBeTypeOf('function');
  return render as Renderer;
};
const watchRenderer = (): WatchRenderer => {
  const render = (tea as unknown as { watchMarkup?: WatchRenderer }).watchMarkup;
  expect(render).toBeTypeOf('function');
  return render as WatchRenderer;
};
const group = (markup: string, name: string) =>
  markup.match(new RegExp(`<g class="${name}">[\\s\\S]*?</g>`))?.[0];

describe('generated layered tea props', () => {
  const props = [
    ['place-setting-clean', 'settingSymbolMarkup', tea.SETTING_SYMBOL, '160 120', 1],
    ['teapot-body', 'teapotMarkup', tea.TEAPOT_SVG, '200 150', 2],
    ['cup-back', 'cupBackMarkup', tea.CUP_BACK_SVG, '300 220', 1],
    ['cup-front', 'cupFrontMarkup', tea.CUP_FRONT_SVG, '300 220', 1],
  ] as const;

  for (const [id, name, fallback, box, count] of props) {
    it(`selects ${id} only in engraved and retains its original canvas`, () => {
      const render = renderer(name);
      const markup = render('engraved');
      expect(markup).toContain(`viewBox="0 0 ${box}"`);
      expect(markup).toContain(`${id}.any.generated.webp`);
      expect(markup.match(/<image /g)).toHaveLength(count);
      expect(markup.match(/preserveAspectRatio="xMidYMid meet"/g)).toHaveLength(count);
      expect(markup).not.toContain('data-generated=""');
      for (const style of ['flat', 'paper', undefined] as const) {
        expect(render(style)).toBe(fallback);
        expect(render(style)).not.toContain('<image');
      }
    });
  }

  it('retains the exact pre-integration vector output in every fallback', () => {
    const samples = [
      [tea.SETTING_SYMBOL, '7ac2b8ad45e75041c7b1c2ada576f3575768d0d3b357ef382e04e5f7cdbf4242'],
      [tea.TEAPOT_SVG, '84e8d0c8034ea66a4425824fa634a09b9195218c671cae465e09d915b0307fe4'],
      [tea.CUP_BACK_SVG, '3b54bcdee71f368e97f71194b8592aa9b9dec60237f9b3744201efb564cef98f'],
      [tea.CUP_FRONT_SVG, '8843a6f3023c285c3d523ff0c618817685f05326944e80f9c8459219070bd58b'],
      [tea.watchSvg(), '36cc4c28518c6e0f85dc64cc5168043e7e507234047435e7fd492762c5b0c976'],
    ] as const;
    for (const [markup, hash] of samples) {
      expect(createHash('sha256').update(markup).digest('hex')).toBe(hash);
    }
  });

  it('keeps one shared setting symbol and its exact independent dirt layer', () => {
    const markup = renderer('settingSymbolMarkup')('engraved');
    const dirt = tea.SETTING_SYMBOL.match(
      /<g style="opacity: var\(--dirt, 0\)">[\s\S]*?<\/g>/,
    )?.[0];
    expect(dirt).toBeDefined();
    expect(markup).toContain(dirt);
    expect(markup.match(/<symbol id="tp-setting"/g)).toHaveLength(1);
    expect(markup.indexOf('<image ')).toBeLessThan(markup.indexOf(dirt ?? ''));
    expect(tea.SETTING_USE).toContain('<use href="#tp-setting"/>');
  });

  it('keeps the pot shadow, separate lid and steam in the original draw order', () => {
    const markup = renderer('teapotMarkup')('engraved');
    const shadow = tea.TEAPOT_SVG.match(/<ellipse[^>]+cy="140"[^>]+\/>/)?.[0];
    const steam = group(tea.TEAPOT_SVG, 'tp__steam');
    expect(shadow).toBeDefined();
    expect(steam).toBeDefined();
    expect(markup).toContain(shadow);
    expect(markup).toContain(steam);
    expect(markup.match(/class="tp__lid"/g)).toHaveLength(1);
    expect(markup.indexOf(shadow ?? '')).toBeLessThan(markup.indexOf('teapot-body.any'));
    expect(markup.indexOf('teapot-body.any')).toBeLessThan(markup.indexOf('class="tp__lid"'));
    expect(markup.indexOf('teapot-lid.any')).toBeLessThan(markup.indexOf(steam ?? ''));
  });

  it('preserves the lid fill-box and original (73.6,60) hinge without CSS overrides', () => {
    const markup = renderer('teapotMarkup')('engraved');
    const lid = group(markup, 'tp__lid');
    expect(lid).toContain('teapot-lid.any.generated.webp');
    expect(lid).toContain('x="56" y="23" width="88" height="37"');
    expect(lid).not.toMatch(/style=|transform=/);
  });

  it('retains all 31 localized watch dates and exact moving overlay groups', () => {
    const format = (n: number) => `day-${n}`;
    const fallback = tea.watchSvg(format);
    const render = watchRenderer();
    const markup = render(format, 'engraved');
    expect(markup).toContain('viewBox="0 0 400 440"');
    expect(markup).toContain('watch-body.any.generated.webp');
    expect(markup.match(/<image /g)).toHaveLength(1);
    expect(markup.match(/<text /g)).toHaveLength(31);
    expect(markup).toContain('>day-31</text>');
    expect(markup.slice(markup.indexOf('<g class="tp__dates"'))).toBe(
      fallback.slice(fallback.indexOf('<g class="tp__dates"')),
    );
    for (const style of ['flat', 'paper', undefined] as const) {
      expect(render(format, style)).toBe(fallback);
    }
  });

  it('keeps all three tea rings independently above the generated back surface', () => {
    const markup = renderer('cupBackMarkup')('engraved');
    const rings = group(tea.CUP_BACK_SVG, 'tp__rings');
    expect(rings).toBeDefined();
    expect(markup).toContain(rings);
    expect(markup.match(/<ellipse class="tp__ring/g)).toHaveLength(3);
    expect(markup.indexOf('<image ')).toBeLessThan(markup.indexOf(rings ?? ''));
    expect(renderer('cupFrontMarkup')('engraved')).not.toContain('tp__rings');
  });

  it('uses one frying-pan image while keeping its flying wrapper and fallback', () => {
    const markup = kitchen.thingMarkup('frying-pan', 'engraved');
    expect(markup).toContain('viewBox="0 0 140 80"');
    expect(markup).toContain('data-generated-frying-pan=""');
    expect(markup).toContain('frying-pan.any.generated.webp');
    expect(markup.match(/<image /g)).toHaveLength(1);
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
    for (const style of ['flat', 'paper', undefined] as const) {
      expect(kitchen.thingMarkup('frying-pan', style)).toBe(kitchen.THINGS['frying-pan']);
    }
  });

  it('preserves the accepted whole-source framing and shared cup opening geometry', () => {
    const placements = [
      [
        kitchen.thingMarkup('frying-pan', 'engraved'),
        '0.079538',
        '8.041052',
        '138.338679',
        '79.050674',
      ],
      [renderer('settingSymbolMarkup')('engraved'), '0', '0', '160', '120'],
      [renderer('teapotMarkup')('engraved'), '-0.423077', '4.615385', '194.923077', '146.192308'],
      [renderer('teapotMarkup')('engraved'), '56', '23', '88', '37'],
      [watchRenderer()(String, 'engraved'), '-0.735219', '-10.853217', '402.742320', '442.444570'],
      [renderer('cupBackMarkup')('engraved'), '1.181430', '-1.563742', '294.865747', '125.778670'],
      [
        renderer('cupFrontMarkup')('engraved'),
        '-3.035811',
        '12.483784',
        '302.485135',
        '222.263514',
      ],
    ] as const;
    for (const [markup, x, y, width, height] of placements) {
      expect(markup).toContain(`x="${x}" y="${y}" width="${width}" height="${height}"`);
    }
  });
});
