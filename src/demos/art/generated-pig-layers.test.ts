import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { ART } from './registry.ts';

const scenes = ['pig-and-pepper', 'cheshire-cat'] as const;

// Removing the pig-only branch, dropping a leg hook, using canvas-centred pivots,
// or putting the body behind the leg joins must fail these behavior assertions.
describe('generated trotting pig layers', () => {
  it('ships exactly the three encoded and individually traceable layers', () => {
    const directory = new URL('../../assets/images/generated-layers/', import.meta.url);
    const provenance = JSON.parse(
      readFileSync(new URL('pig-trotting-provenance.json', directory), 'utf8'),
    ) as {
      logicalBox: number[];
      budget: { shippingBytes: number };
      assets: { asset: string; bytes: number; sha256: string; alphaPreservedExactly: boolean }[];
    };
    expect(provenance.logicalBox).toEqual([200, 140]);
    expect(provenance.assets).toHaveLength(3);
    let total = 0;
    for (const asset of provenance.assets) {
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaPreservedExactly).toBe(true);
      total += bytes.length;
    }
    expect(total).toBe(provenance.budget.shippingBytes);
  });

  for (const scene of scenes) {
    it(`uses three ordered images in the original ${scene} figure box`, () => {
      const markup = figure('pig/trotting', 'fixture-pig', 'engraved', scene);
      expect(markup).toContain('art--generated fixture-pig');
      expect(markup).toContain('data-generated-layers="pig/trotting"');
      expect(markup).toContain('viewBox="0 0 200 140"');
      expect(markup.match(/<image /g)).toHaveLength(3);
      expect(markup).toContain('pig--trotting~legs-fore.any.generated.webp');
      expect(markup).toContain('pig--trotting~legs-hind.any.generated.webp');
      expect(markup).toContain('pig--trotting~body.any.generated.webp');
      expect(markup.indexOf('data-part="legs-hind"')).toBeLessThan(
        markup.indexOf('data-part="legs-fore"'),
      );
      expect(markup.indexOf('data-part="legs-fore"')).toBeLessThan(
        markup.indexOf('data-part="body"'),
      );
      expect(markup).toContain('<path');
      expect(markup.match(/data-rig-fallback=/g)).toHaveLength(3);
      expect(
        markup.match(/data-rig-generated="" visibility="hidden" display="none"/g),
      ).toHaveLength(3);
      expect(markup.match(/data-part="legs-fore"/g)).toHaveLength(1);
      expect(markup.match(/data-part="legs-hind"/g)).toHaveLength(1);
      expect(markup).toBe(figure('pig/trotting', 'fixture-pig', 'engraved', scene, 'blue'));
    });

    it(`keeps ${scene}'s original flat and paper vectors`, () => {
      const original = ART['pig/trotting'];
      expect(original?.kind).toBe('vector');
      if (original?.kind !== 'vector') return;
      for (const style of ['flat', 'paper'] as const) {
        expect(figure('pig/trotting', 'fixture-pig', style, scene)).toBe(
          `<span class="art fixture-pig" data-art="pig/trotting">${original.markup}</span>`,
        );
      }
    });
  }

  it('pins rotations to visible shoulder bounds, not transparent canvas corners', () => {
    const markup = figure('pig/trotting', '', 'engraved', 'pig-and-pepper');
    const pivots = [
      ...markup.matchAll(
        /<g data-part="(legs-[a-z]+)" data-rig-part="" style="--rig-origin: ([\d.]+)px ([\d.]+)px"/g,
      ),
    ];
    expect(pivots).toHaveLength(2);
    const scale = 200 / 1500;
    const y = 140 - 957 * scale;
    for (const [, part, x = '', top = ''] of pivots) {
      const [sourceX, sourceY] = part === 'legs-fore' ? [532, 533] : [1162.5, 447];
      expect(Number(x)).toBeCloseTo(sourceX * scale, 8);
      expect(Number(top)).toBeCloseTo(y + sourceY * scale, 8);
    }
    // Every image keeps the same source-to-logical scale, including the body's
    // one-pixel narrower generated canvas; no raster crop or stretch is needed.
    const images = [
      ...markup.matchAll(/<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g),
    ];
    expect(images).toHaveLength(3);
    for (const [index, image] of images.entries()) {
      const [, x = '', top = '', width = '', height = ''] = image;
      expect(Number(top)).toBeCloseTo(y, 8);
      expect(Number(width) / (index === 2 ? 1499 : 1500)).toBeCloseTo(scale, 8);
      expect(Number(height) / 1049).toBeCloseTo(scale, 8);
      expect(Number(x) + Number(width) / 2).toBeCloseTo(100, 8);
    }
    expect(y + 957 * scale).toBeCloseTo(140, 8);
  });

  it('does not register the rig on unrelated stages or non-pig figures', () => {
    expect(figure('pig/trotting', '', 'engraved', 'trial')).not.toContain('data-generated-layers');
    expect(figure('pig/trotting', '', 'engraved')).not.toContain('data-generated-layers');
    expect(figure('pig-baby', '', 'engraved', 'pig-and-pepper')).not.toContain(
      'data-generated-layers',
    );
  });

  it('retains both scene motion phases, outer bounce, pause and reduced-motion paths', () => {
    for (const [file, prefix, leg, bounce] of [
      ['../pig-and-pepper/pig.css', 'pp__pig-run', 'pp-leg', 'pp-step'],
      ['../cheshire-cat/cheshire.css', 'cc__pig', 'cc-trot', 'cc-bob'],
    ]) {
      const css = readFileSync(new URL(file ?? '', import.meta.url), 'utf8');
      expect(css).toContain(`.${prefix}[data-trotting] [data-part="legs-fore"]`);
      expect(css).toContain(`.${prefix}[data-trotting] [data-part="legs-hind"]`);
      expect(css).toMatch(new RegExp(`animation: ${leg} [^;]+ infinite alternate;`));
      expect(css).toMatch(new RegExp(`animation: ${leg} [^;]+ infinite alternate-reverse;`));
      expect(css).toContain(`.${prefix}[data-trotting] .art`);
      expect(css).toContain(`animation: ${bounce}`);
      expect(css).toContain('[data-paused]');
      expect(css).toContain('prefers-reduced-motion');
    }
  });
});
