import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedCheshireCatSvg } from './generated-cheshire-cat.ts';
import { ART } from './registry.ts';
import { CAT_HEAD_SVG, CAT_HEARTH_SVG, CAT_SVG } from './vectors.ts';

const cases = [
  ['cheshire-cat/head', 'croquet', CAT_HEAD_SVG, '240 200', 5],
  ['cheshire-cat/on-hearth', 'pig-and-pepper', CAT_HEARTH_SVG, '240 160', 6],
  ['cheshire-cat/on-bough', 'cheshire-cat', CAT_SVG, '400 240', 7],
] as const;

const shapes = (markup: string): string[] =>
  [...markup.matchAll(/<(?:path|ellipse|circle|rect|stop)[^>]*\/>/g)]
    .map(([shape]) => shape)
    .sort();

describe('generated Cheshire Cat articulated layers', () => {
  it('routes only the actual engraved HTML consumers while preserving registry and SVG authority', () => {
    for (const [id, demo, original] of cases) {
      const markup = figure(id, 'fixture-cat', 'engraved', demo);
      expect(markup).toContain(`data-generated-layers="${id}"`);
      expect(markup).toContain(`data-generated-rig="${id}"`);
      const entry = ART[id];
      expect(entry?.kind).toBe('vector');
      if (entry?.kind !== 'vector') throw new Error('expected original cat vector');
      expect(entry.generated).toBeUndefined();
      expect(entry.markup).toBe(original);
      for (const style of ['flat', 'paper'] as const) {
        expect(figure(id, 'fixture-cat', style, demo)).toBe(
          `<span class="art fixture-cat" data-art="${id}">${original}</span>`,
        );
      }
      expect(svgFigure(id, 3, 4, 120, 100, '', 'engraved', demo)).not.toContain(
        'data-generated-rig',
      );
    }
  });

  it('ships eight verified unchanged-canvas encodings, not whole-image substitutions', () => {
    const dir = new URL('../../assets/images/generated-layers/', import.meta.url);
    const provenance = JSON.parse(
      readFileSync(new URL('cheshire-cat-provenance.json', dir), 'utf8'),
    ) as {
      fullPrompt: string;
      assets: {
        asset: string;
        bytes: number;
        sha256: string;
        alphaPreservedExactly: boolean;
        encoding: { quality: number; canvasUnchanged: boolean };
      }[];
      budget: { shippingBytes: number };
    };
    expect(provenance.fullPrompt).toContain('not available');
    expect(provenance.assets).toHaveLength(8);
    expect(new Set(provenance.assets.map((asset) => asset.asset)).size).toBe(8);
    let total = 0;
    for (const asset of provenance.assets) {
      const bytes = readFileSync(new URL(asset.asset, dir));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaPreservedExactly).toBe(true);
      expect(asset.encoding.canvasUnchanged).toBe(true);
      expect(asset.encoding.quality).toBe(92);
      total += bytes.length;
    }
    expect(total).toBe(provenance.budget.shippingBytes);
  });

  for (const [id, demo, original, box, count] of cases) {
    it(`keeps ${id}'s five ordered selectors unique and all original shapes recoverable`, () => {
      const markup = generatedCheshireCatSvg(id, 'engraved', demo) ?? '';
      expect(markup).toContain(`viewBox="0 0 ${box}"`);
      expect(markup).toContain(`data-generated-rig="${id}"`);
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(count);
      let last = -1;
      for (const part of ['ears', 'face', 'eyes', 'pupils', 'grin']) {
        expect(markup.match(new RegExp(`data-cat="${part}"`, 'g'))).toHaveLength(1);
        const index = markup.indexOf(`data-cat="${part}"`);
        expect(index).toBeGreaterThan(last);
        last = index;
      }
      for (const shape of shapes(original)) expect(shapes(markup)).toContain(shape);
      expect(markup).not.toContain('data-rig-ready');
      expect(
        markup.match(/data-rig-generated="" visibility="hidden" display="none"/g)?.length,
      ).toBeGreaterThanOrEqual(count);
      expect(markup).toContain('data-rig-fallback=""');
    });

    it(`does not opt ${id} into flat, paper, unverified scenes or build previews`, () => {
      expect(generatedCheshireCatSvg(id, 'flat', demo)).toBeUndefined();
      expect(generatedCheshireCatSvg(id, 'paper', demo)).toBeUndefined();
      expect(generatedCheshireCatSvg(id, 'engraved')).toBeUndefined();
      expect(generatedCheshireCatSvg(id, 'engraved', 'riverbank')).toBeUndefined();
    });
  }

  it('retains each scene-owned live hook once, including the mask and independent grin', () => {
    const bough =
      generatedCheshireCatSvg('cheshire-cat/on-bough', 'engraved', 'cheshire-cat') ?? '';
    for (const hook of ['cc__cat', 'cc__mask-slide', 'cc__tail', 'cc__pupils', 'cc__grin']) {
      expect(bough.match(new RegExp(`class="${hook}"`, 'g'))).toHaveLength(1);
    }
    expect(bough).toContain('<g class="cc__cat" mask="url(#cc-mask)">');
    expect(bough).toContain(
      '<!-- The grin: outside the mask, so it stays when the rest has gone -->',
    );
    expect(bough.indexOf('data-cat="grin"')).toBeGreaterThan(bough.indexOf('<!-- The grin:'));
    const head = generatedCheshireCatSvg('cheshire-cat/head', 'engraved', 'croquet') ?? '';
    for (const part of ['ears', 'face', 'eyes', 'pupils', 'grin'])
      expect(head.match(new RegExp(`class="cq__cat-${part}"`, 'g'))).toHaveLength(1);
  });

  it('keeps generated eyes pupil-free with live SVG pupils and mapped right-eye wink support', () => {
    const hearth =
      generatedCheshireCatSvg('cheshire-cat/on-hearth', 'engraved', 'pig-and-pepper') ?? '';
    expect(hearth).toContain('data-cat-eye="right"');
    expect(hearth).toContain('data-cat-live-pupils=""');
    expect(hearth).toContain('clipPathUnits="userSpaceOnUse"');
    expect(hearth).toMatch(/clip-path="url\(#cat-pupil-apertures-\d+\)"/);
    const next =
      generatedCheshireCatSvg('cheshire-cat/on-hearth', 'engraved', 'pig-and-pepper') ?? '';
    expect(next.match(/id="cat-pupil-apertures-\d+"/)?.[0]).not.toBe(
      hearth.match(/id="cat-pupil-apertures-\d+"/)?.[0],
    );
    expect(hearth).toContain('data-rig-part=""');
    const css = readFileSync(new URL('./generated-cheshire-cat.css', import.meta.url), 'utf8');
    expect(css).toContain('animation: pp-wink 0.8s ease-in-out 1');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('transform: scaleY(0.08)');
    expect(css).toContain('animation-play-state: paused');
    expect(css.replace(/\s+/g, ' ')).toContain(
      '.demo[data-paused] .pp__cat[data-wink] svg[data-rig-ready] [data-cat-live-pupils] ellipse:last-child',
    );
  });

  it('uses uniform image transforms and retains full source canvas dimensions', () => {
    for (const [id, demo] of cases) {
      const markup = generatedCheshireCatSvg(id, 'engraved', demo) ?? '';
      const images = [...markup.matchAll(/<image[^>]+width="([\d.]+)" height="([\d.]+)"[^>]*>/g)];
      expect(images.length).toBeGreaterThan(0);
      for (const [, w, h] of images) {
        const ratio = Number(w) / Number(h);
        expect(
          [1374 / 1145, 1619 / 971, 1620 / 971, 1536 / 1024].some(
            (source) => Math.abs(ratio - source) < 1e-9,
          ),
        ).toBe(true);
      }
    }
  });
});
