import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedAlicePoseSvg } from './generated-alice-poses.ts';
import { ART } from './registry.ts';

const poses = [
  ['alice/kneeling', 230, 230, ['rabbit-house']],
  ['alice/filling', 720, 330, ['rabbit-house']],
  ['alice/hand-left', 120, 200, ['caterpillar', 'pig-and-pepper', 'lobster-quadrille']],
  ['alice/hand-right', 120, 200, ['caterpillar', 'pig-and-pepper', 'lobster-quadrille']],
  ['alice/from-above', 120, 120, ['caterpillar']],
] as const;

function imageGeometry(markup: string): number[] {
  const match = markup.match(
    /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
  );
  expect(match).not.toBeNull();
  return match ? match.slice(1).map(Number) : [];
}

describe('scene-isolated static Alice poses', () => {
  for (const [id, w, h, scenes] of poses) {
    for (const variant of ['yellow', 'blue'] as const) {
      it(`${id} ${variant} is atomic, variant-specific and confined to its consumers`, () => {
        for (const scene of scenes) {
          const svg = generatedAlicePoseSvg(id, 'engraved', scene, variant) ?? '';
          expect(svg).toContain(`viewBox="0 0 ${w} ${h}"`);
          expect(svg).toContain(`data-generated-rig="${id}"`);
          expect(svg).toContain(`data-variant="${variant}"`);
          expect(svg).toContain(`${id.replace('/', '--')}.${variant}.generated.webp`);
          expect(svg.match(/data-rig-image=""/g)).toHaveLength(1);
          expect(svg).toContain('data-rig-fallback=""');
          expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
          expect(svg).not.toContain('data-rig-ready');
          expect(svg).not.toContain(`data-variant="${variant === 'yellow' ? 'blue' : 'yellow'}"`);
          // Both branches paint one identical rectangle. Source padding cannot
          // change the House fill-box growth pivot at the moment of decode.
          expect(
            svg.match(new RegExp(`<rect width="${w}" height="${h}" fill="url\\(#[^)]+\\)"/>`, 'g')),
          ).toHaveLength(2);
          expect(figure(id, '', 'engraved', scene, variant)).toContain(
            `data-generated-rig="${id}"`,
          );
          expect(svgFigure(id, -20, -30, w * 2, h, '', 'engraved', scene, variant)).toContain(
            'transform="translate(-20 -30)"',
          );
        }
        expect(generatedAlicePoseSvg(id, 'engraved', 'trial', variant)).toBeUndefined();
        expect(generatedAlicePoseSvg(id, 'engraved', undefined, variant)).toBeUndefined();
        for (const style of ['flat', 'paper'] as const) {
          expect(generatedAlicePoseSvg(id, style, scenes[0], variant)).toBeUndefined();
          expect(figure(id, '', style, scenes[0], variant)).not.toContain('data-generated-rig');
        }
        const entry = ART[id];
        if (entry?.kind !== 'vector') throw Error('original vector missing');
        expect(entry.generated).toBeUndefined();
      });
    }
  }

  it('does not intercept other protagonist IDs or intentional silhouettes', () => {
    for (const id of [
      'alice/falling',
      'alice/sitting',
      'alice/running-away',
      'alice/silhouette',
      'runner/alice',
      'toString',
      'constructor',
    ])
      expect(generatedAlicePoseSvg(id, 'engraved', 'rabbit-hole', 'yellow')).toBeUndefined();
  });

  it('uses unique pattern IDs across multiple copies of a pose', () => {
    const render = () =>
      generatedAlicePoseSvg('alice/kneeling', 'engraved', 'rabbit-house', 'yellow') ?? '';
    const first = [...render().matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
    const second = [...render().matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
    expect(first).toHaveLength(2);
    expect(new Set([...first, ...second]).size).toBe(4);
  });

  it('preserves the measured floor, contact and neck anchors without image distortion', () => {
    const checks = [
      ['alice/kneeling', 'yellow', 'rabbit-house', 1254, 1254, 627, 1229, 115, 230],
      ['alice/kneeling', 'blue', 'rabbit-house', 1254, 1254, 627, 1230, 115, 230],
      ['alice/filling', 'yellow', 'rabbit-house', 1851, 849, 440, 340, 110, 90],
      ['alice/filling', 'blue', 'rabbit-house', 1851, 850, 440, 340, 110, 90],
      ['alice/from-above', 'yellow', 'caterpillar', 1254, 1254, 628, 355, 60, 52],
      ['alice/from-above', 'blue', 'caterpillar', 1254, 1254, 628, 355, 60, 52],
    ] as const;
    for (const [id, variant, scene, sw, sh, px, py, targetX, targetY] of checks) {
      const [x = 0, y = 0, w = 0, h = 0] = imageGeometry(
        generatedAlicePoseSvg(id, 'engraved', scene, variant) ?? '',
      );
      expect(w / sw).toBeCloseTo(h / sh, 10);
      expect(x + (px * w) / sw).toBeCloseTo(targetX, 8);
      expect(y + (py * h) / sh).toBeCloseTo(targetY, 8);
      if (id === 'alice/filling')
        expect(y + ((variant === 'yellow' ? 834 : 837) * h) / sh).toBeCloseTo(330, 8);
    }
    for (const side of ['left', 'right'] as const) {
      for (const variant of ['yellow', 'blue'] as const) {
        const [x = 0, y = 0, w = 0, h = 0] = imageGeometry(
          generatedAlicePoseSvg(`alice/hand-${side}`, 'engraved', 'caterpillar', variant) ?? '',
        );
        expect(x + w / 2).toBeCloseTo(60, 8);
        expect(y + h).toBeCloseTo(200, 8);
        expect(w / h).toBeCloseTo((side === 'left' ? 972 : 971) / 1619, 8);
        expect(y).toBeLessThan(0.13);
      }
    }
  });
});

describe('Alice pose delivery provenance', () => {
  it('matches all ten encoded files, dimensions, hashes and placement records', () => {
    const directory = new URL('../../assets/images/', import.meta.url);
    const record = JSON.parse(
      readFileSync(new URL('alice-poses-provenance.json', directory), 'utf8'),
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
        alphaPreservedExactly: boolean;
        source: { sha256: string };
        placement: { scale: number; x: number; y: number };
        consumers: string[];
      }[];
    };
    expect(record.assets).toHaveLength(10);
    let total = 0;
    for (const asset of record.assets) {
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.alphaPreservedExactly).toBe(true);
      const [x, y, w, h] = imageGeometry(
        generatedAlicePoseSvg(asset.id, 'engraved', asset.consumers[0], asset.variant) ?? '',
      );
      expect(x).toBeCloseTo(asset.placement.x, 8);
      expect(y).toBeCloseTo(asset.placement.y, 8);
      expect(w).toBeCloseTo(asset.width * asset.placement.scale, 8);
      expect(h).toBeCloseTo(asset.height * asset.placement.scale, 8);
      total += bytes.length;
    }
    expect(total).toBe(record.budget.shippingBytes);
  });
});

describe('generated hand contact layout', () => {
  it('anchors only generated hands to the unchanged prop widths, not viewport percentages', () => {
    const css = readFileSync(new URL('./generated-alice-poses.css', import.meta.url), 'utf8');
    expect(css).toContain(
      '.pp__hand--left:has([data-generated-rig="alice/hand-left"][data-rig-ready])',
    );
    expect(css).toContain(
      '.pp__hand--right:has([data-generated-rig="alice/hand-right"][data-rig-ready])',
    );
    expect(css).toContain(
      '.lq__hand--left:has([data-generated-rig="alice/hand-left"][data-rig-ready])',
    );
    expect(css).toContain(
      '.lq__hand--right:has([data-generated-rig="alice/hand-right"][data-rig-ready])',
    );
    expect(css.match(/clamp\(4\.5rem, 14vmin, 7\.5rem\)/g)).toHaveLength(2);
    expect(css.match(/clamp\(3\.5rem, 11vmin, 6rem\)/g)).toHaveLength(2);
    expect(css.match(/clamp\(2\.5rem, 8vmin, 4\.5rem\)/g)).toHaveLength(4);
    expect(css).not.toMatch(/ct__bit|rotate:|transform:|inline-size:|block-size:|pointer-events:/);
    const pigCss = readFileSync(new URL('../pig-and-pepper/pig.css', import.meta.url), 'utf8');
    const lobsterCss = readFileSync(
      new URL('../lobster-quadrille/quadrille.css', import.meta.url),
      'utf8',
    );
    expect(pigCss).toContain('inline-size: clamp(9rem, 28vmin, 15rem)');
    expect(lobsterCss).toContain('inline-size: clamp(7rem, 22vmin, 12rem)');
    for (const original of [pigCss, lobsterCss])
      expect(original).toContain('inline-size: clamp(5rem, 16vmin, 9rem)');
  });
});
