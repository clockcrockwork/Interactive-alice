import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedFootmanSvg } from './generated-footmen.ts';
import { ART } from './registry.ts';
import { footmanSvg } from './vectors.ts';

const kinds = ['fish', 'frog'] as const;
const shapes = (markup: string): string[] =>
  [...markup.matchAll(/<(?:path|ellipse|circle)[^>]*\/>/g)]
    .map(([shape]) => shape.replace(/ class="[^"]*"/g, ''))
    .sort();

describe('generated household footmen', () => {
  for (const kind of kinds) {
    const id = `${kind}-footman`;
    it(`${id} opts in only to its engraved Pig and Pepper consumer`, () => {
      const markup = figure(id, 'fixture-footman', 'engraved', 'pig-and-pepper');
      expect(markup).toContain(`data-generated-layers="${id}"`);
      expect(markup).toContain(`data-generated-rig="${id}"`);
      expect(markup).toContain('viewBox="0 0 120 220"');
      for (const style of ['flat', 'paper'] as const) {
        expect(generatedFootmanSvg(id, style, 'pig-and-pepper')).toBeUndefined();
        expect(figure(id, '', style, 'pig-and-pepper')).toContain(footmanSvg(kind));
      }
      for (const scene of [undefined, 'trial', 'witnesses', 'riverbank']) {
        expect(generatedFootmanSvg(id, 'engraved', scene)).toBeUndefined();
      }
      const entry = ART[id];
      if (entry?.kind !== 'vector') throw new Error('expected vector footman');
      expect(svgFigure(id, 2, 3, 120, 220, '', 'engraved', 'pig-and-pepper')).toContain(
        entry.fragment ?? entry.markup,
      );
    });

    it(`${id} retains every fallback shape and hides all four layers until atomic decode`, () => {
      const markup = generatedFootmanSvg(id, 'engraved', 'pig-and-pepper') ?? '';
      expect(shapes(markup)).toEqual(shapes(footmanSvg(kind)));
      expect(markup.match(/<image /g)).toHaveLength(4);
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(4);
      expect(
        markup.match(/data-rig-generated="" visibility="hidden" display="none"/g),
      ).toHaveLength(4);
      expect(markup).not.toContain('data-rig-ready');
      for (const hook of ['pp__body', 'pp__curls', 'pp__tangle']) {
        expect(markup.match(new RegExp(`class="${hook}"`, 'g'))).toHaveLength(1);
      }
    });

    it(`${id} keeps fixed legs outside the unique bow group and both alternate wigs inside it`, () => {
      const markup = generatedFootmanSvg(id, 'engraved', 'pig-and-pepper') ?? '';
      const legs = markup.indexOf('data-footman-layer="legs"');
      const body = markup.indexOf('class="pp__body"');
      const curls = markup.indexOf('class="pp__curls"');
      const tangle = markup.indexOf('class="pp__tangle"');
      expect(legs).toBeLessThan(body);
      expect(body).toBeLessThan(curls);
      expect(curls).toBeLessThan(tangle);
      expect(markup).toContain('data-rig-part="" style="--rig-origin:');
      expect(markup.match(/data-rig-part=""/g)).toHaveLength(1);
      expect(markup.endsWith('</g></g></svg>')).toBe(true);
      const ancestors: string[] = [];
      for (const [, closing, attributes = ''] of markup.matchAll(/<(\/?)g\b([^>]*)>/g)) {
        if (closing) ancestors.pop();
        else {
          const part = attributes.match(/data-footman-layer="([^"]+)"/)?.[1];
          if (part) expect(ancestors.includes('pp__body')).toBe(part !== 'legs');
          const hook = attributes.match(/class="([^"]+)"/)?.[1] ?? '';
          if (hook === 'pp__curls' || hook === 'pp__tangle')
            expect(ancestors).toContain('pp__body');
          ancestors.push(hook);
        }
      }
      expect(ancestors).toHaveLength(0);
    });

    it(`${id} uniformly composes all sources without stretching, cropping or masking`, () => {
      const markup = generatedFootmanSvg(id, 'engraved', 'pig-and-pepper') ?? '';
      const images = [
        ...markup.matchAll(
          /<image[^>]+href="[^"]+~([^.]*)\.any\.generated\.webp"[^>]+width="([^"]+)" height="([^"]+)"/g,
        ),
      ];
      expect(images).toHaveLength(4);
      const provenance = JSON.parse(
        readFileSync(
          new URL(
            '../../assets/images/generated-layers/footmen-motion-provenance.json',
            import.meta.url,
          ),
          'utf8',
        ),
      ) as { assets: { id: string; part: string; width: number; height: number }[] };
      for (const [, part, width, height] of images) {
        const source = provenance.assets.find((asset) => asset.id === id && asset.part === part);
        expect(source).toBeDefined();
        expect(Number(width) / (source?.width ?? 1)).toBeCloseTo(
          Number(height) / (source?.height ?? 1),
          10,
        );
      }
      expect(markup.match(/preserveAspectRatio="xMidYMid meet"/g)).toHaveLength(4);
      expect(markup).not.toMatch(/clipPath|mask=|preserveAspectRatio="none"/);
    });

    it(`${id} keeps its measured waist and layer maps on the original logical canvas`, () => {
      const markup = generatedFootmanSvg(id, 'engraved', 'pig-and-pepper') ?? '';
      const provenance = JSON.parse(
        readFileSync(
          new URL(
            '../../assets/images/generated-layers/footmen-motion-provenance.json',
            import.meta.url,
          ),
          'utf8',
        ),
      ) as {
        geometry: Record<
          string,
          {
            stageWidth: number;
            sourceFootY: number;
            logicalFootY: number;
            sourceWaist: [number, number];
            layers: Record<string, [number, number, number]>;
          }
        >;
      };
      const geometry = provenance.geometry[id];
      if (!geometry) throw new Error('missing footman geometry');
      const scale = 120 / geometry.stageWidth;
      const top = geometry.logicalFootY - geometry.sourceFootY * scale;
      const pivot = markup.match(/--rig-origin: ([\d.]+)px ([\d.]+)px/);
      expect(Number(pivot?.[1])).toBeCloseTo(geometry.sourceWaist[0] * scale, 10);
      expect(Number(pivot?.[2])).toBeCloseTo(top + geometry.sourceWaist[1] * scale, 10);
      for (const [, part = '', x, y, width, height] of markup.matchAll(
        /data-footman-layer="([^"]+)"[^>]*><image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g,
      )) {
        const map = geometry.layers[part];
        if (!map) throw new Error('missing layer map');
        expect(Number(x)).toBeCloseTo(map[0] * scale, 10);
        expect(Number(y)).toBeCloseTo(top + map[1] * scale, 10);
        expect(Number(width)).toBeCloseTo(926 * map[2] * scale, 10);
        expect(Number(height)).toBeCloseTo(1699 * map[2] * scale, 10);
      }
    });
  }

  it('uses complete alternate wigs without changing vector fallback or motion timing', () => {
    const css = readFileSync(new URL('./generated-footmen.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\[data-tangled\].*\[data-rig-ready\] \.pp__curls\s*\{\s*opacity: 0;/);
    const scene = readFileSync(new URL('../pig-and-pepper/pig.css', import.meta.url), 'utf8');
    expect(scene).toContain('animation: pp-bow 0.9s ease-in-out;');
    expect(scene).toContain('transform: rotate(42deg);');
    expect(scene).toContain('prefers-reduced-motion');
    expect(css).toContain(
      '.demo[data-paused] .pp__footman[data-bow] svg[data-generated-rig$="-footman"] .pp__body',
    );
    expect(css).toContain('animation-play-state: paused;');
    expect(scene).toContain('.pp__footman[data-tangled] .pp__tangle');
    expect(scene).toContain('opacity: 0.3;');
    const main = readFileSync(new URL('../pig-and-pepper/main.ts', import.meta.url), 'utf8');
    expect(main).toContain("footman.setAttribute('data-tangled', '')");
    expect(main).toContain("footman.removeAttribute('data-tangled')");
  });

  it('ships eight encoded layers with measurable provenance and exact alpha preservation', () => {
    const dir = new URL('../../assets/images/generated-layers/', import.meta.url);
    const provenance = JSON.parse(
      readFileSync(new URL('footmen-motion-provenance.json', dir), 'utf8'),
    ) as {
      budget: { shippingBytes: number };
      assets: { asset: string; bytes: number; sha256: string; alphaPreservedExactly: boolean }[];
    };
    expect(provenance.assets).toHaveLength(8);
    let total = 0;
    for (const asset of provenance.assets) {
      const bytes = readFileSync(new URL(asset.asset, dir));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaPreservedExactly).toBe(true);
      total += bytes.length;
    }
    expect(total).toBe(provenance.budget.shippingBytes);
  });
});
