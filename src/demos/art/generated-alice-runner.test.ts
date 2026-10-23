import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dressRunner, HANDS, runnerAnchor } from '../caucus-race/figures.ts';
import { figure, svgFigure } from './art.ts';
import { generatedAliceRunnerSvg } from './generated-alice-runner.ts';
import { hydrateGeneratedRig } from './generated-rig.ts';
import { runnerSvg } from './vectors.ts';

const render = () =>
  generatedAliceRunnerSvg('runner/alice', 'engraved', 'caucus-race', 'yellow') ?? '';
const original = runnerSvg('alice')
  .replace(/^<svg[^>]*><g class="cr__figure">/, '')
  .replace(/<\/g><\/svg>$/, '');
afterEach(() => vi.unstubAllGlobals());

describe('yellow whole-pose runner', () => {
  it('routes both public renderers through the scoped adapter without changing blue', () => {
    for (const scene of ['caucus-race', 'pool-of-tears', 'mouse-tale']) {
      expect(figure('runner/alice', '', 'engraved', scene, 'yellow')).toContain(
        'data-generated-rig="runner/alice"',
      );
      expect(
        svgFigure('runner/alice', 12, 15, 100, 116, '', 'engraved', scene, 'yellow'),
      ).toContain('data-generated-rig="runner/alice"');
      expect(figure('runner/alice', '', 'engraved', scene, 'blue')).not.toContain('data-generated');
    }
  });
  it('keeps one untransformed motion group, both poses and the original drawing', () => {
    const svg = render();
    expect(svg).toContain('viewBox="0 0 100 116"');
    expect(svg).toContain('data-generated-rig="runner/alice"');
    expect(svg.match(/class="cr__figure"/g)).toHaveLength(1);
    expect(svg).toContain(`<g class="cr__figure"><g data-rig-fallback="">${original}</g>`);
    expect(svg.match(/data-rig-image=""/g)).toHaveLength(2);
    expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(svg).toContain('data-runner-pose="rest"');
    expect(svg).toContain('data-runner-pose="carry" display="none"');
    expect(svg).not.toContain('data-rig-ready');
    expect(svg).not.toMatch(/data-variant="blue"|cr__arm--hold|<animate|transform=/);
    let inserted = '';
    dressRunner(
      {
        querySelector: () => ({
          insertAdjacentHTML: (_where: string, markup: string) => {
            inserted = markup;
          },
        }),
      } as unknown as HTMLElement,
      'alice',
    );
    expect(inserted).toContain('class="cr__arm cr__arm--hold"');
  });

  it('is confined to yellow engraved race, pool, and tale consumers', () => {
    for (const scene of ['caucus-race', 'pool-of-tears', 'mouse-tale']) {
      expect(generatedAliceRunnerSvg('runner/alice', 'engraved', scene, 'yellow')).toBeTruthy();
      expect(generatedAliceRunnerSvg('runner/alice', 'engraved', scene, 'blue')).toBeUndefined();
      for (const style of ['flat', 'paper'] as const)
        expect(generatedAliceRunnerSvg('runner/alice', style, scene, 'yellow')).toBeUndefined();
    }
    for (const scene of [undefined, 'riverbank', 'rabbit-hole', 'trial'])
      expect(generatedAliceRunnerSvg('runner/alice', 'engraved', scene, 'yellow')).toBeUndefined();
    for (const id of ['runner/dodo', 'alice/falling', 'alice/sitting', 'constructor'])
      expect(generatedAliceRunnerSvg(id, 'engraved', 'caucus-race', 'yellow')).toBeUndefined();
  });

  it('selects complete poses without blending arms or adding independent motion', () => {
    const css = readFileSync(new URL('./generated-alice-runner.css', import.meta.url), 'utf8');
    expect(css).toContain('svg[data-generated-rig="runner/alice"][data-rig-ready] .cr__arm--hold');
    expect(css).toContain('.cr__runner[data-holding]');
    expect(css).toContain('[data-runner-pose="rest"]');
    expect(css).toContain('[data-runner-pose="carry"]');
    expect(css).not.toMatch(/opacity:|animation:|transition:|transform:|transform-origin:/);
    const module = readFileSync(new URL('./generated-alice-runner.ts', import.meta.url), 'utf8');
    expect(module).not.toMatch(/import\s+['"][^'"]+\.css/);
    for (const path of ['../caucus-race/caucus.css', '../mouse-tale/mouse-tale.css']) {
      const originalCss = readFileSync(new URL(path, import.meta.url), 'utf8');
      expect(originalCss).toContain('.cr__figure');
      expect(originalCss).toContain('prefers-reduced-motion: reduce');
      expect(originalCss).toContain('animation-play-state: paused');
    }
  });

  it('uniformly places both unchanged canvases and seats the thimble rim on the palm', () => {
    const svg = render();
    const scale = 112 / 1329;
    const x = (100 - 1164 * scale) / 2;
    const images = [
      ...svg.matchAll(/<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g),
    ];
    expect(images).toHaveLength(2);
    for (const image of images) {
      const [ix = 0, y = 0, w = 0, h = 0] = image.slice(1).map(Number);
      expect(ix).toBeCloseTo(x, 9);
      expect(y).toBe(0);
      expect(w / 1164).toBeCloseTo(scale, 9);
      expect(h / 1351).toBeCloseTo(scale, 9);
    }
    const metadata = (key: string) => Number(svg.match(new RegExp(`${key}="([^"]+)"`))?.[1]);
    expect(metadata('data-runner-hand-u')).toBeCloseTo(x + 907 * scale, 9);
    expect(metadata('data-runner-hand-v') + (84 - 45) * (24 / 80) * 0.8).toBeCloseTo(
      603 * scale,
      9,
    );
    expect(metadata('data-runner-pocket-u')).toBeCloseTo(x + 730 * scale, 9);
    expect(metadata('data-runner-pocket-v')).toBeCloseTo(730 * scale, 9);
  });
});

describe('runner atomic decode', () => {
  it('exposes anchors only after both poses decode, with no frame-clock dependency', async () => {
    const finish: (() => void)[] = [];
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 1164;
        decode() {
          return new Promise<void>((resolve) => finish.push(resolve));
        }
      },
    );
    const svg = render();
    const sources = [...svg.matchAll(/data-rig-image="" href="([^"]+)"/g)].map(
      (m) => `${m[1]}?runner-late`,
    );
    expect(sources).toHaveLength(2);
    const attributes = new Map(
      [...svg.matchAll(/(data-runner-[^=]+)="([^"]+)"/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
    );
    const rig = {
      querySelectorAll: () => sources.map((src) => ({ getAttribute: () => src })),
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      getAttribute: (name: string) => attributes.get(name) ?? null,
    } as unknown as SVGElement;
    const el = {
      querySelector: () => (attributes.has('data-rig-ready') ? rig : null),
    } as unknown as HTMLElement;
    let hand = runnerAnchor(el, 'hand', HANDS.aliceHand);
    const result = hydrateGeneratedRig(rig).then(() => {
      hand = runnerAnchor(el, 'hand', HANDS.aliceHand);
    });
    finish[0]?.();
    await Promise.resolve();
    expect(hand).toBe(HANDS.aliceHand);
    finish[1]?.();
    await result;
    expect(hand.u).toBeCloseTo(Number(attributes.get('data-runner-hand-u')), 9);
    expect(hand.v).toBeCloseTo(Number(attributes.get('data-runner-hand-v')), 9);
    expect(hand).not.toBe(HANDS.aliceHand);
  });

  for (const failed of ['rest', 'carry'])
    it(`retains the original when ${failed} fails`, async () => {
      vi.stubGlobal(
        'Image',
        class {
          src = '';
          naturalWidth = 1164;
          decode() {
            return this.src.includes(`~${failed}.`)
              ? Promise.reject(new Error('missing pose'))
              : Promise.resolve();
          }
        },
      );
      const sources = [...render().matchAll(/data-rig-image="" href="([^"]+)"/g)].map(
        (m) => `${m[1]}?runner-fail-${failed}`,
      );
      const attributes = new Map<string, string>();
      const rig = {
        querySelectorAll: () => sources.map((src) => ({ getAttribute: () => src })),
        setAttribute: (name: string, value: string) => attributes.set(name, value),
      } as unknown as SVGElement;
      expect(await hydrateGeneratedRig(rig)).toBe(false);
      expect(attributes.has('data-rig-ready')).toBe(false);
      expect(attributes.has('data-rig-failed')).toBe(true);
    });
});

describe('runner provenance', () => {
  it('matches both encoded files, dimensions, alpha records, hashes and budget', () => {
    const directory = new URL('../../assets/images/', import.meta.url);
    const record = JSON.parse(
      readFileSync(new URL('alice-runner-provenance.json', directory), 'utf8'),
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
    expect(record.assets).toHaveLength(2);
    let total = 0;
    for (const asset of record.assets) {
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.alphaPreservedExactly).toBe(true);
      expect([asset.width, asset.height]).toEqual([1164, 1351]);
      total += bytes.length;
    }
    expect(total).toBe(record.budget.shippingBytes);
  });
});
