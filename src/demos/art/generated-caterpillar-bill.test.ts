import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { ART } from './registry.ts';

// Missing routes, partial rigs, lost motion hooks or global raster overrides fail.
describe('Caterpillar and Bill articulated intake contract', () => {
  for (const [id, scene, box, hooks, images] of [
    ['caterpillar', 'caterpillar', [240, 200], ['ct__head', 'ct__body'], 3],
    ['bill', 'bill-the-lizard', [120, 100], ['bill__head'], 2],
  ] as const) {
    it(`routes ${id} to a complete load-gated rig without duplicating selectors`, () => {
      const markup = figure(id, 'fixture', 'engraved', scene);
      expect(markup).toContain(`data-generated-rig="${id}"`);
      expect(markup).toContain(`viewBox="0 0 ${box.join(' ')}"`);
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(images);
      expect(markup).not.toContain('data-rig-ready');
      expect(markup).toContain('data-rig-fallback=""');
      for (const hook of hooks)
        expect(markup.match(new RegExp(`class="${hook}"`, 'g'))).toHaveLength(1);
    });
    it(`keeps ${id}'s exact flat/paper originals and unknown-scene fallback`, () => {
      const entry = ART[id];
      if (entry?.kind !== 'vector') throw new Error('expected original vector');
      for (const style of ['flat', 'paper'] as const)
        expect(figure(id, 'fixture', style, scene)).toBe(
          `<span class="art fixture" data-art="${id}">${entry.markup}</span>`,
        );
      for (const scene of [undefined, 'unreviewed-scene'])
        expect(figure(id, '', 'engraved', scene)).not.toContain('data-generated-rig');
      expect(entry.generated).toBeUndefined();
    });
  }
  it('keeps Bill as a rig inside the Rabbit House fragment placement', () => {
    const markup = svgFigure('bill', -22, -36, 44, 36, 'fixture', 'engraved', 'rabbit-house');
    expect(markup).toContain('transform="translate(-22 -36)"');
    expect(markup).toContain('data-generated-rig="bill"');
    expect(markup.match(/class="bill__head"/g)).toHaveLength(1);
    expect(markup.match(/data-rig-image=""/g)).toHaveLength(2);
    expect(markup).toContain('var(--bl-lizard');
  });
  it('does not opt arbitrary Caterpillar SVG consumers into a whole image', () => {
    expect(svgFigure('caterpillar', 0, 0, 240, 200, '', 'engraved', 'unknown')).not.toContain(
      'data-generated-rig',
    );
  });
  it('keeps body breathing, nodding and designed reduced-motion states in the scene', () => {
    const css = readFileSync(new URL('../caterpillar/caterpillar.css', import.meta.url), 'utf8');
    expect(css).toContain('animation: ct-breathe');
    expect(css).toContain('transform: rotate(14deg)');
    expect(css).toContain('.demo[data-paused] .ct__body');
  });
});

it('ships exactly five reviewed layers with matching hashes and exact-alpha provenance', () => {
  const dir = new URL('../../assets/images/generated-layers/', import.meta.url);
  const provenance = JSON.parse(
    readFileSync(new URL('caterpillar-bill-provenance.json', dir), 'utf8'),
  ) as {
    budget: { shippingBytes: number };
    assets: {
      asset: string;
      bytes: number;
      sha256: string;
      alphaPreservedExactly: boolean;
      width: number;
      height: number;
    }[];
  };
  expect(provenance.assets).toHaveLength(5);
  let total = 0;
  for (const asset of provenance.assets) {
    const bytes = readFileSync(new URL(asset.asset, dir));
    expect(bytes.length).toBe(asset.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    expect(asset.alphaPreservedExactly).toBe(true);
    expect([asset.width, asset.height]).toEqual([1374, 1145]);
    total += bytes.length;
  }
  expect(total).toBe(638840);
  expect(total).toBe(provenance.budget.shippingBytes);
});
