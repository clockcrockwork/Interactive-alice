import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as bill from '../bill-the-lizard/figures.ts';
import * as quadrille from '../lobster-quadrille/figures.ts';
import * as kitchen from '../pig-and-pepper/figures.ts';
import * as rabbit from '../rabbit-hole/figures.ts';
import * as trial from '../trial/figures.ts';
import type { ArtStyle } from './treatments.ts';

type Render = (style?: ArtStyle) => string;
const props = [
  ['marmalade-jar', rabbit, 'jarMarkup', rabbit.JAR_SVG, 60, 80],
  ['brandy-bottle', bill, 'bottleMarkup', bill.BOTTLE_SVG, 40, 90],
  ['jellyfish', quadrille, 'jellyMarkup', quadrille.JELLY_SVG, 80, 80],
  ['tarts-table', trial, 'tartsMarkup', trial.TARTS_SVG, 260, 140],
  ['witness-box', trial, 'witnessBoxMarkup', trial.WITNESS_BOX_SVG, 200, 180],
  ['cauldron-body', kitchen, 'cauldronMarkup', kitchen.CAULDRON_SVG, 240, 200],
] as const;

const renderFor = (module: object, name: string): Render => {
  const render = (module as Record<string, Render>)[name];
  expect(render).toBeTypeOf('function');
  if (!render) throw new Error(`missing ${name}`);
  return render;
};

const provenance = () =>
  JSON.parse(
    readFileSync(
      new URL('../../assets/images/generated-props/scene-props-provenance.json', import.meta.url),
      'utf8',
    ),
  ) as {
    assets: {
      id: string;
      file: string;
      width: number;
      height: number;
      bytes: number;
      sha256: string;
      alphaEncodingUnchanged: boolean;
      alphaAbove32Bounds: [number, number, number, number];
    }[];
  };

afterEach(() => vi.unstubAllGlobals());

describe('generated scene props retain the original scene coordinate systems', () => {
  for (const [id, module, name, fallback, width, height] of props) {
    it(`${id} selects one uniformly scaled image only for engraved`, () => {
      const render = renderFor(module, name);
      const markup = render('engraved');
      expect(markup).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(markup).toContain('focusable="false"');
      expect(markup).toContain(`data-generated-${id}=""`);
      expect(markup).toContain(`${id}.any.generated.webp`);
      expect(markup.match(/<image /g)).toHaveLength(1);
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).not.toMatch(/<text\b|<foreignObject\b|<filter\b/);
      expect(render('flat')).toBe(fallback);
      expect(render('paper')).toBe(fallback);
      expect(render()).toBe(fallback);

      const source = provenance().assets.find((asset) => asset.id === id);
      expect(source).toBeDefined();
      if (!source) return;
      const image = markup.match(
        /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
      );
      expect(image).not.toBeNull();
      if (!image) return;
      const [, x = 0, y = 0, w = 0, h = 0] = image.map(Number);
      expect(w / h).toBeCloseTo(source.width / source.height, 6);
      const [left, top, right, bottom] = source.alphaAbove32Bounds;
      expect(x + (left * w) / source.width).toBeGreaterThanOrEqual(0);
      expect(x + (right * w) / source.width).toBeLessThanOrEqual(width + 0.2);
      expect(y + (top * h) / source.height).toBeGreaterThanOrEqual(0);
      expect(y + ((bottom - 1) * h) / source.height).toBeLessThanOrEqual(height + 0.2);
    });

    it(`${id} follows the current style without depending on Alice colour or locale`, () => {
      const render = renderFor(module, name);
      for (const art of ['engraved', 'flat', 'paper'] as const) {
        for (const alice of ['blue', 'yellow']) {
          for (const lang of ['en', 'en-simple', 'ja']) {
            vi.stubGlobal('document', {
              documentElement: { dataset: { art, alice }, lang },
            });
            expect(render()).toBe(render(art));
          }
        }
      }
    });
  }

  it('uses the same jar drawing in her hand and on its original track', () => {
    const render = renderFor(rabbit, 'jarMarkup');
    for (const art of ['engraved', 'flat', 'paper'] as const) {
      vi.stubGlobal('document', { documentElement: { dataset: { art } } });
      expect(rabbit.heldSvg('jar')).toBe(render(art));
      expect(rabbit.heldSvg('jar')).toContain('viewBox="0 0 60 80"');
      expect(rabbit.heldSvg('book')).not.toContain('.generated.webp');
      expect(rabbit.heldSvg('map')).not.toContain('.generated.webp');
    }
    const markup = render('engraved');
    const scribble = 'd="M19 40 H41 M19 45 H37 M19 50 H33"';
    expect(markup).toContain(scribble);
    expect(markup.indexOf(scribble)).toBeGreaterThan(markup.indexOf('<image'));
  });

  it('keeps animated cauldron steam as the unchanged independent SVG overlay', () => {
    const markup = renderFor(kitchen, 'cauldronMarkup')('engraved');
    const steam = kitchen.CAULDRON_SVG.match(/<g class="pp__steam">[\s\S]*?<\/g>/)?.[0];
    expect(steam).toBeTruthy();
    expect(markup.match(/class="pp__steam"/g)).toHaveLength(1);
    expect(markup).toContain(steam);
    expect(markup.indexOf('class="pp__steam"')).toBeGreaterThan(markup.indexOf('<image'));
  });

  it('leaves witness rail openings transparent and the tarts fallback positions intact', () => {
    const witness = renderFor(trial, 'witnessBoxMarkup')('engraved');
    expect(witness).not.toMatch(/<rect\b|<path\b|<polygon\b/);
    const tarts = renderFor(trial, 'tartsMarkup')('engraved');
    const placement = tarts.match(/<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)"/);
    expect(Number(placement?.[2])).toBeGreaterThan(30);
    expect(Number(placement?.[3])).toBeCloseTo(251.14094, 4);
    expect(trial.TARTS_SVG.match(/<g transform="translate\(/g)).toHaveLength(8);
    for (const [x, y] of [
      [60, 66],
      [100, 66],
      [140, 66],
      [180, 66],
      [200, 66],
      [80, 54],
      [120, 54],
      [160, 54],
    ]) {
      expect(trial.TARTS_SVG).toContain(`translate(${x} ${y})`);
    }
  });

  it('records the exact delivered files and unchanged alpha without inventing prompt hashes', () => {
    const assets = provenance().assets;
    expect(assets.map(({ id }) => id).sort()).toEqual(props.map(([id]) => id).sort());
    for (const asset of assets) {
      const bytes = readFileSync(new URL(`../../../${asset.file}`, import.meta.url));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaEncodingUnchanged).toBe(true);
    }
  });
});
