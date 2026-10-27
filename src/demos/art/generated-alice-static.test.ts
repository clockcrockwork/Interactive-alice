import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { ART } from './registry.ts';

const foreground = [
  {
    id: 'alice/looking-down',
    slug: 'looking-down',
    box: [400, 220],
    pixels: [1691, 930],
    demos: ['drink-me', 'pool-of-tears', 'caterpillar'],
  },
  {
    id: 'alice/foot',
    slug: 'foot',
    box: [200, 260],
    pixels: [1100, 1430],
    demos: ['bill-the-lizard', 'caterpillar'],
  },
] as const;

function imageGeometry(markup: string): number[] {
  const match = markup.match(
    /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
  );
  expect(match).not.toBeNull();
  return match ? match.slice(1).map(Number) : [];
}

// Dropping either variant, aligning these first-person views to their shoes, or
// switching the flat/paper vectors to rasters must fail these behavior assertions.
describe('generated first-person Alice views', () => {
  for (const { id, slug, box, pixels, demos } of foreground) {
    for (const variant of ['yellow', 'blue'] as const) {
      it(`uses ${variant} ${slug} at the same bottom crop in every consumer`, () => {
        const entry = ART[id];
        expect(entry?.kind).toBe('vector');
        if (entry?.kind !== 'vector') return;
        const source = entry.generated?.[variant];
        expect(source).toBeDefined();
        expect(source?.footY).toBe(pixels[1]);
        expect(entry.generated?.any).toBeUndefined();
        for (const demo of demos) {
          const markup = figure(id, 'fixture', 'engraved', demo, variant);
          expect(markup).toContain('data-generated=""');
          expect(markup).toContain(`viewBox="0 0 ${box.join(' ')}"`);
          expect(markup).toContain(`alice--${slug}.${variant}.generated.webp`);
          expect(markup.match(/<image /g)).toHaveLength(1);
          expect(markup).not.toContain(
            `data-variant="${variant === 'yellow' ? 'blue' : 'yellow'}"`,
          );
          const [x = 0, y = 0, width = 0, height = 0] = imageGeometry(markup);
          expect(x + width / 2).toBeCloseTo(box[0] / 2, 8);
          expect(y + height).toBeCloseTo(box[1], 8);
          expect(width / height).toBeCloseTo(pixels[0] / pixels[1], 8);
          expect(y).toBeLessThan(0.02);
        }
      });
    }

    it(`keeps ${slug}'s flat and paper drawings`, () => {
      const entry = ART[id];
      if (entry?.kind !== 'vector') throw new Error(`expected vector ${id}`);
      for (const style of ['flat', 'paper'] as const) {
        expect(figure(id, '', style, demos[0], 'yellow')).toBe(
          `<span class="art " data-art="${id}">${entry.markup}</span>`,
        );
      }
    });
  }
});

// Removing the SVG adapter, measuring a padded <image> as the House fill-box,
// leaking yellow into blue, or losing the scene's translate must fail these tests.
describe('generated standing Alice in SVG scenes', () => {
  it('places the yellow candidate on the existing ground with a fixed paint box', () => {
    const markup = svgFigure(
      'alice/standing',
      -40,
      -110,
      80,
      110,
      'fixture',
      'engraved',
      'rabbit-house',
      'yellow',
    );
    expect(markup).toContain('art--generated fixture');
    expect(markup).toContain('data-art="alice/standing" transform="translate(-40 -110)"');
    expect(markup).toContain('alice--standing.yellow.generated.webp');
    expect(markup.match(/<image /g)).toHaveLength(1);
    expect(markup).toContain('patternUnits="userSpaceOnUse"');
    expect(markup).toContain('patternContentUnits="userSpaceOnUse"');
    expect(markup).toMatch(/<rect width="80" height="110" fill="url\(#[^)]+\)"\/>/);
    const [x = 0, y = 0, width = 0, height = 0] = imageGeometry(markup);
    expect(x + width / 2).toBeCloseTo(40, 8);
    expect(y + height * (1511 / 1536)).toBeCloseTo(110, 8);
    expect(width / height).toBeCloseTo(1024 / 1536, 8);
    expect(markup).not.toContain('<path');
  });

  it('preserves the ground under non-uniform scene box scaling', () => {
    const markup = svgFigure(
      'alice/standing',
      20,
      30,
      160,
      110,
      '',
      'engraved',
      'riverbank',
      'yellow',
    );
    expect(markup).toContain('transform="translate(20 30)"');
    expect(markup).toContain('patternTransform="scale(2 1)"');
    expect(markup).toMatch(/<rect width="160" height="110" fill="url\(#[^)]+\)"\/>/);
    const [, y = 0, , height = 0] = imageGeometry(markup);
    expect(30 + y + height * (1511 / 1536)).toBeCloseTo(140, 8);
  });

  it('creates unique paint server IDs when the same figure appears twice', () => {
    const render = () =>
      svgFigure('alice/standing', 0, 0, 80, 110, '', 'engraved', 'riverbank', 'yellow');
    const first = render();
    const second = render();
    const id = (markup: string) => markup.match(/<pattern id="([^"]+)"/)?.[1];
    expect(id(first)).toBeDefined();
    expect(id(second)).toBeDefined();
    expect(id(first)).not.toBe(id(second));
    for (const markup of [first, second]) expect(markup).toContain(`fill="url(#${id(markup)})"`);
  });

  it('retains the blue original and never relabels yellow as blue', () => {
    const markup = svgFigure(
      'alice/standing',
      -40,
      -110,
      80,
      110,
      '',
      'engraved',
      'rabbit-house',
      'blue',
    );
    expect(markup).not.toContain('data-generated');
    expect(markup).not.toContain('.generated.webp');
    expect(markup).toContain('alice--standing.blue.webp');
    expect(markup).not.toContain('alice--standing.yellow.webp');
  });

  it('retains flat and paper fragments and the non-browser flat default', () => {
    const entry = ART['alice/standing'];
    if (entry?.kind !== 'vector') throw new Error('expected standing vector');
    const original = `<g class="art fixture" data-art="alice/standing" transform="translate(-40 -110)"><g transform="scale(1 1)">${entry.fragment}</g></g>`;
    for (const style of ['flat', 'paper'] as const) {
      expect(
        svgFigure('alice/standing', -40, -110, 80, 110, 'fixture', style, 'rabbit-house', 'yellow'),
      ).toBe(original);
    }
    expect(svgFigure('alice/standing', -40, -110, 80, 110, 'fixture')).toBe(original);
  });

  it('uses browser defaults to select only the page variant without changed callers', async () => {
    vi.resetModules();
    const root = { dataset: { alice: 'yellow', art: 'engraved' } };
    vi.stubGlobal('document', { documentElement: root, body: { dataset: { demo: 'riverbank' } } });
    try {
      const browserArt = await import('./art.ts');
      expect(browserArt.svgFigure('alice/standing', 0, 0, 80, 110)).toContain(
        'alice--standing.yellow.generated.webp',
      );
      root.dataset.alice = 'blue';
      const blue = browserArt.svgFigure('alice/standing', 0, 0, 80, 110);
      expect(blue).toContain('alice--standing.blue.webp');
      expect(blue).not.toContain('alice--standing.yellow');
      expect(blue).not.toContain('data-generated');
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});

// Replacing an encoded file without its provenance, or changing a registered
// anchor independently of the recorded source measurements, must fail here.
describe('static Alice delivery provenance', () => {
  it('matches all five encoded assets, sizes, hashes and registry anchors', () => {
    const directory = new URL('../../assets/images/', import.meta.url);
    const record = JSON.parse(
      readFileSync(new URL('alice-static-provenance.json', directory), 'utf8'),
    ) as {
      budget: { shippingBytes: number };
      assets: {
        id: string;
        variant: 'yellow' | 'blue';
        asset: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
        footY: number;
        alphaPreservedExactly: boolean;
        source: { sha256: string };
      }[];
    };
    expect(record.assets).toHaveLength(5);
    let total = 0;
    for (const asset of record.assets) {
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.alphaPreservedExactly).toBe(true);
      const entry = ART[asset.id];
      if (entry?.kind !== 'vector') throw new Error(`expected vector ${asset.id}`);
      expect(entry.generated?.[asset.variant]).toMatchObject({
        width: asset.width,
        height: asset.height,
        footY: asset.footY,
      });
      total += bytes.length;
    }
    expect(total).toBe(record.budget.shippingBytes);
    expect(total).toBe(1436002);
  });
});
