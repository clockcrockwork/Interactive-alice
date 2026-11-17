import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { ART } from './registry.ts';

const cases = [
  ['tortoise-master', 'mock-turtle', [200, 240], ['art__cane'], 2],
  ['guinea-pig', 'witnesses', [120, 104], ['guinea-pig__paw'], 2],
  ['guinea-pig', 'bill-the-lizard', [120, 104], ['guinea-pig__paw'], 2],
  ['pigeon', 'caterpillar', [260, 200], ['ct__wing--left', 'ct__wing--right'], 3],
] as const;

// A missing route, duplicated motion target, stretched layer, or partial-rig
// reveal must fail. The original registry is still the fallback authority.
describe('generated animal motion layers', () => {
  for (const [id, scene, box, hooks, count] of cases) {
    it(`uses ${id}'s original logical box and unique motion hooks in ${scene}`, () => {
      const markup = figure(id, 'fixture-animal', 'engraved', scene);
      expect(markup).toContain(`data-generated-layers="${id}"`);
      expect(markup).toContain(`data-generated-rig="${id}"`);
      expect(markup).toContain(`viewBox="0 0 ${box.join(' ')}"`);
      expect(markup.match(/<image /g)).toHaveLength(count);
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(count);
      for (const hook of hooks) {
        expect(markup.match(new RegExp(`class="[^"]*\\b${hook}\\b[^"]*"`, 'g'))).toHaveLength(1);
      }
      expect(markup).not.toContain('data-rig-ready');
      expect(markup).toContain('data-rig-fallback=""');
      expect(
        markup.match(/data-rig-generated="" visibility="hidden" display="none"/g),
      ).toHaveLength(count);
    });

    it(`retains untouched flat and paper vectors for ${id} in ${scene}`, () => {
      const entry = ART[id];
      expect(entry?.kind).toBe('vector');
      if (entry?.kind !== 'vector') return;
      for (const style of ['flat', 'paper'] as const) {
        expect(figure(id, 'fixture-animal', style, scene)).toBe(
          `<span class="art fixture-animal" data-art="${id}">${entry.markup}</span>`,
        );
      }
    });
  }

  it('keeps unsupported scenes and guinea-pig SVG fragments on the original route', () => {
    for (const id of ['tortoise-master', 'guinea-pig', 'pigeon']) {
      for (const scene of [undefined, 'trial', 'riverbank']) {
        expect(figure(id, '', 'engraved', scene)).not.toContain('data-generated-rig');
      }
    }
    const entry = ART['guinea-pig'];
    expect(entry?.kind).toBe('vector');
    if (entry?.kind !== 'vector') return;
    const markup = svgFigure('guinea-pig', 3, 4, 60, 52, '', 'engraved', 'bill-the-lizard');
    expect(markup).toContain(entry.fragment);
    expect(markup).not.toContain('data-generated-rig');
  });

  it('uses one uniform source scale and measured joint origins instead of transparent canvas corners', () => {
    const geometry = [
      ['tortoise-master', 'mock-turtle', [200, 240], [1145, 1374], 1330, 1145, [[830, 550]]],
      ['guinea-pig', 'witnesses', [120, 104], [1347, 1168], 1089, 1346, [[380, 735]]],
      [
        'pigeon',
        'caterpillar',
        [260, 200],
        [1430, 1100],
        1049,
        1430,
        [
          [625, 500],
          [825, 500],
        ],
      ],
    ] as const;
    for (const [id, scene, box, stage, footY, sourceWidth, pivots] of geometry) {
      const markup = figure(id, '', 'engraved', scene);
      const scale = Math.min(box[0] / stage[0], box[1] / stage[1]);
      const x = (box[0] - sourceWidth * scale) / 2;
      const y = box[1] - footY * scale;
      const images = [
        ...markup.matchAll(/<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g),
      ];
      expect(images).toHaveLength(pivots.length + 1);
      for (const [, left = '', top = '', width = '', height = ''] of images) {
        expect(Number(left)).toBeCloseTo(x, 9);
        expect(Number(top)).toBeCloseTo(y, 9);
        expect(Number(width) / sourceWidth).toBeCloseTo(scale, 9);
        expect(Number(height) / stage[1]).toBeCloseTo(scale, 9);
        expect(Number(left) + Number(width) / 2).toBeCloseTo(box[0] / 2, 9);
      }
      expect(y + footY * scale).toBeCloseTo(box[1], 9);
      const origins = [
        ...markup.matchAll(/data-rig-part="" style="--rig-origin: ([\d.]+)px ([\d.]+)px"/g),
      ];
      expect(origins).toHaveLength(pivots.length);
      pivots.forEach(([px, py], index) => {
        expect(Number(origins[index]?.[1])).toBeCloseTo(x + px * scale, 9);
        expect(Number(origins[index]?.[2])).toBeCloseTo(y + py * scale, 9);
      });
    }
  });

  it('retains every original vector shape while giving each joint just one animation target', () => {
    for (const [id, scene] of cases) {
      const entry = ART[id];
      if (entry?.kind !== 'vector') throw new Error('expected original vector');
      const shapes = (markup: string): string[] =>
        [...markup.matchAll(/<(?:path|ellipse|circle)[^>]*\/>/g)]
          .map(([shape]) => shape.replace(/ class="[^"]*"/g, ''))
          .sort();
      expect(shapes(figure(id, '', 'engraved', scene))).toEqual(shapes(entry.markup));
    }
  });

  it("places wings and cane behind the body but keeps Bill's lifted paw in front", () => {
    for (const [id, scene, , hooks] of cases) {
      const markup = figure(id, '', 'engraved', scene);
      const body = markup.indexOf('data-animal-layer="body"');
      for (const hook of hooks) {
        const joint = markup.indexOf(hook);
        if (id === 'guinea-pig') expect(body).toBeLessThan(joint);
        else expect(body).toBeGreaterThan(joint);
      }
    }
  });

  it('keeps scene motion, pause and reduced-motion rules unchanged', () => {
    const turtle = readFileSync(new URL('../mock-turtle/mock-turtle.css', import.meta.url), 'utf8');
    expect(turtle).toContain('rotate(calc(var(--rap) * -22deg))');
    const witnesses = readFileSync(new URL('../witnesses/witnesses.css', import.meta.url), 'utf8');
    expect(witnesses).toContain('transform: rotate(-70deg)');
    const bill = readFileSync(new URL('../bill-the-lizard/bill.css', import.meta.url), 'utf8');
    expect(bill).toContain('rotate(calc(var(--lift) * 45deg))');
    const pigeon = readFileSync(new URL('../caterpillar/caterpillar.css', import.meta.url), 'utf8');
    expect(pigeon).toContain('animation: ct-flap-left');
    expect(pigeon).toContain('animation: ct-flap-right');
    expect(pigeon).toContain('.demo[data-paused] .ct__wing');
    for (const css of [turtle, witnesses, bill, pigeon])
      expect(css).toContain('prefers-reduced-motion');
  });

  it('ships exactly seven encoded layers with verified provenance and unchanged alpha', () => {
    const dir = new URL('../../assets/images/generated-layers/', import.meta.url);
    const provenance = JSON.parse(
      readFileSync(new URL('animal-motion-provenance.json', dir), 'utf8'),
    ) as {
      budget: { shippingBytes: number };
      rigs: {
        assets: { asset: string; bytes: number; sha256: string; alphaPreservedExactly: boolean }[];
      }[];
    };
    const assets = provenance.rigs.flatMap((rig) => rig.assets);
    expect(assets).toHaveLength(7);
    let total = 0;
    for (const asset of assets) {
      const bytes = readFileSync(new URL(asset.asset, dir));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaPreservedExactly).toBe(true);
      total += bytes.length;
    }
    expect(total).toBe(provenance.budget.shippingBytes);
  });
});
