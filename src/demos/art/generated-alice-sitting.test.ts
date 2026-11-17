import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generatedAliceSittingSvg } from './generated-alice-sitting.ts';
import { hydrateGeneratedRig } from './generated-rig.ts';
import { ALICE_SITTING_SVG } from './vectors.ts';

const render = (variant: 'yellow' | 'blue' = 'yellow') =>
  generatedAliceSittingSvg('alice/sitting', 'engraved', 'riverbank', variant) ?? '';
const original = ALICE_SITTING_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

afterEach(() => vi.unstubAllGlobals());

describe('riverbank sitting Alice layers', () => {
  for (const variant of ['yellow', 'blue'] as const) {
    it(`${variant} has four atomic sources and the untouched original fallback`, () => {
      const svg = render(variant);
      expect(svg).toContain('viewBox="0 0 160 150"');
      expect(svg).toContain(`data-rig-fallback="">${original}</g>`);
      expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
      expect(svg.match(/data-rig-image=""/g)).toHaveLength(4);
      expect(svg).toContain(`alice--sitting~body.${variant}.generated.webp`);
      expect(svg).toContain(`alice--sitting~head.${variant}.generated.webp`);
      expect(svg).toContain(`alice--sitting~arm-right.${variant}.generated.webp`);
      expect(svg).toContain('alice--sitting~lids.any.generated.webp');
      expect(svg).not.toContain('data-rig-ready');
      expect(svg).not.toContain(`data-variant="${variant === 'blue' ? 'yellow' : 'blue'}"`);
      expect(svg).toMatch(/class="rb__head" data-rig-part=""[^>]*>[\s\S]*class="rb__lids"/);
      expect(svg).toContain('class="rb__arm" data-rig-part=""');
      expect(svg).toContain('--rig-origin: 80.8px 64.7px');
      expect(svg).toContain('--rig-origin: 104.475px 60.5px');
    });
  }

  it('preserves the original body then arm then head paint order', () => {
    const svg = render();
    const generated = svg.slice(svg.indexOf('data-rig-generated=""'));
    expect(generated.indexOf('data-sitting-layer="body"')).toBeLessThan(
      generated.indexOf('class="rb__arm"'),
    );
    expect(generated.indexOf('class="rb__arm"')).toBeLessThan(
      generated.indexOf('class="rb__head"'),
    );
  });

  it('does not replace other scenes, styles or poses', () => {
    for (const scene of [undefined, 'rabbit-hole', 'caucus-race', 'trial'])
      expect(
        generatedAliceSittingSvg('alice/sitting', 'engraved', scene, 'yellow'),
      ).toBeUndefined();
    for (const style of ['flat', 'paper'] as const)
      expect(
        generatedAliceSittingSvg('alice/sitting', style, 'riverbank', 'yellow'),
      ).toBeUndefined();
    for (const id of ['alice/falling', 'alice/running-away', 'runner/alice', 'constructor'])
      expect(generatedAliceSittingSvg(id, 'engraved', 'riverbank', 'yellow')).toBeUndefined();
  });

  it('uses independent uniform placements and a rotated lid map', () => {
    const svg = render();
    for (const [part, x, y, scale] of [
      ['body', 4, 10.496, 0.116],
      ['head', 36, 7.7, 0.064],
      ['arm-right', 73.4, 45.1, 0.055],
    ] as const) {
      const match = svg.match(
        new RegExp(
          `<image[^>]*data-sitting-layer="${part}"[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"`,
        ),
      );
      expect(match).not.toBeNull();
      const [mx = 0, my = 0, w = 0, h = 0] = match?.slice(1).map(Number) ?? [];
      expect(mx).toBeCloseTo(x, 10);
      expect(my).toBeCloseTo(y, 10);
      expect(w / 1295).toBeCloseTo(scale, 10);
      expect(h / 1215).toBeCloseTo(scale, 10);
    }
    expect(svg).toContain('matrix(0.979 -0.254 0.254 0.979 -119.35 351.9)');
    expect(svg).toContain('class="rb__generated-lid-reveal"');
    expect(svg).not.toMatch(/opacity=|preserveAspectRatio="none"/);
    expect(73.4 + 1225 * 0.055).toBeCloseTo(140.775, 10);
    expect(45.1 + 1053 * 0.055).toBeCloseTo(103.015, 10);
  });

  it('gives the eyelid aperture a unique ID for every instance', () => {
    const one = render().match(/<clipPath id="([^"]+)"/)?.[1];
    const two = render().match(/<clipPath id="([^"]+)"/)?.[1];
    expect(one).toBeTruthy();
    expect(two).toBeTruthy();
    expect(one).not.toBe(two);
  });

  it('leaves original motion unchanged until ready and introduces no unpausable animation', () => {
    const css = readFileSync(new URL('./generated-alice-sitting.css', import.meta.url), 'utf8');
    expect(css).toContain('svg[data-generated-rig="alice/sitting"][data-rig-ready] .rb__lids');
    expect(css).toContain(
      'svg[data-generated-rig="alice/sitting"][data-rig-ready] .rb__generated-lid-reveal',
    );
    expect(css).toContain('scaleY(clamp(0, var(--droop, 0), 1))');
    expect(css).not.toMatch(/opacity:|animation:|rb__chain|rb__standing/);
    const module = readFileSync(new URL('./generated-alice-sitting.ts', import.meta.url), 'utf8');
    expect(module).not.toMatch(/import\s+['"][^'"]+\.css/);
    const originalCss = readFileSync(
      new URL('../riverbank/riverbank.css', import.meta.url),
      'utf8',
    );
    expect(originalCss).toContain('rotate(calc(var(--reach) * -28deg))');
    expect(originalCss).toContain('rotate(calc(var(--droop) * 7deg))');
    expect(originalCss).toContain('inset-inline-start: 78%');
    expect(originalCss).toContain('inset-block-start: 58%');
  });
});

describe('sitting Alice atomic decode', () => {
  it('reveals nothing until all four actual layer URLs decode', async () => {
    const finish: (() => void)[] = [];
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 1295;
        decode() {
          return new Promise<void>((resolve) => finish.push(resolve));
        }
      },
    );
    const sources = [...render().matchAll(/data-rig-image="" href="([^"]+)"/g)].map(
      (match) => `${match[1]}?sitting-pending`,
    );
    expect(sources).toHaveLength(4);
    const attributes = new Map<string, string>();
    const rig = {
      querySelectorAll: () => sources.map((src) => ({ getAttribute: () => src })),
      setAttribute: (key: string, value: string) => attributes.set(key, value),
    } as unknown as SVGElement;
    const pending = hydrateGeneratedRig(rig);
    for (const resolve of finish.slice(0, 3)) resolve();
    await Promise.resolve();
    expect(attributes.has('data-rig-ready')).toBe(false);
    finish[3]?.();
    expect(await pending).toBe(true);
    expect(attributes.has('data-rig-ready')).toBe(true);
  });

  it('retains the complete original when even the shared lids fail', async () => {
    vi.stubGlobal(
      'Image',
      class {
        src = '';
        naturalWidth = 1295;
        decode() {
          return this.src.includes('~lids.')
            ? Promise.reject(new Error('failed lids'))
            : Promise.resolve();
        }
      },
    );
    const sources = [...render('blue').matchAll(/data-rig-image="" href="([^"]+)"/g)].map(
      (match) => `${match[1]}?sitting-failure`,
    );
    expect(sources).toHaveLength(4);
    const attributes = new Map<string, string>();
    const rig = {
      querySelectorAll: () => sources.map((src) => ({ getAttribute: () => src })),
      setAttribute: (key: string, value: string) => attributes.set(key, value),
    } as unknown as SVGElement;
    expect(await hydrateGeneratedRig(rig)).toBe(false);
    expect(attributes.has('data-rig-ready')).toBe(false);
    expect(attributes.has('data-rig-failed')).toBe(true);
  });
});

describe('sitting Alice source provenance', () => {
  it('matches all seven encoded assets, exact alpha records and total bytes', () => {
    const directory = new URL('../../assets/images/', import.meta.url);
    const provenance = JSON.parse(
      readFileSync(new URL('alice-sitting-provenance.json', directory), 'utf8'),
    ) as {
      assets: {
        asset: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
        alphaPreservedExactly: boolean;
        source: { sha256: string };
      }[];
      budget: { shippingBytes: number };
    };
    expect(provenance.assets).toHaveLength(7);
    let total = 0;
    for (const asset of provenance.assets) {
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.alphaPreservedExactly).toBe(true);
      expect([asset.width, asset.height]).toEqual([1295, 1215]);
      total += bytes.length;
    }
    expect(provenance.budget.shippingBytes).toBe(total);
  });
});
