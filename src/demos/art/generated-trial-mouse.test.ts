import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedTrialMouseSvg } from './generated-trial-mouse.ts';
import { ART } from './registry.ts';

const mouse = (): string => generatedTrialMouseSvg('mouse/swimming', 'engraved', 'trial') ?? '';

afterEach(() => vi.unstubAllGlobals());

describe('Trial mouse dream reuse', () => {
  it('opts into only the engraved Trial dream, never the pool or other mouse consumers', () => {
    expect(mouse()).toContain('data-generated-rig="mouse/trial-dream"');
    for (const demo of [undefined, 'pool-of-tears', 'caucus-race', 'mouse-tale', 'unknown']) {
      expect(generatedTrialMouseSvg('mouse/swimming', 'engraved', demo)).toBeUndefined();
    }
    for (const style of ['flat', 'paper'] as const) {
      expect(generatedTrialMouseSvg('mouse/swimming', style, 'trial')).toBeUndefined();
    }
    for (const id of ['mouse', 'runner/mouse', 'alice/swimming', 'white-rabbit/running']) {
      expect(generatedTrialMouseSvg(id, 'engraved', 'trial')).toBeUndefined();
    }
  });

  it('keeps the original 120 by 60 box and centers visible bounds without reshaping the asset', () => {
    const markup = mouse();
    expect(markup).toContain('width="120" height="60" viewBox="0 0 120 60"');
    expect(markup).toContain('<rect width="120" height="60"');
    expect(markup).toContain('patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"');
    expect(markup).toContain('overflow="hidden"');
    const node = markup.match(/<image\b[^>]+>/)?.[0] ?? '';
    const number = (name: string) => Number(node.match(new RegExp(` ${name}="([^"]+)"`))?.[1]);
    const scale = number('width') / 1164;
    expect(number('height') / 1351).toBeCloseTo(scale, 12);
    expect(number('x') + ((36 + 1154) / 2) * scale).toBeCloseTo(60, 12);
    expect(number('y') + 434 * scale).toBeCloseTo(2, 12);
    expect(number('y') + 1118 * scale).toBeCloseTo(58, 12);
    expect(node).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('preserves the genuinely empty fallback and uses only the existing atomic-loader hooks', () => {
    expect(ART['mouse/swimming']).toMatchObject({ kind: 'vector', markup: '', box: [120, 60] });
    expect(ART['mouse/swimming']).not.toHaveProperty('generated');
    const markup = mouse();
    expect(markup).toContain('<g data-rig-fallback=""></g>');
    expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(markup.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(markup).not.toContain('data-rig-ready');
    expect(markup).not.toContain('cr__figure');
    expect(markup).not.toMatch(/<(?:path|ellipse|circle)\b/);
  });

  it('gives repeated dream instances unique paint references', () => {
    const first = mouse();
    const second = mouse();
    const id = (markup: string) => markup.match(/<pattern id="([^"]+)"/)?.[1];
    expect(id(first)).toBeTruthy();
    expect(id(second)).not.toBe(id(first));
    expect(first).toContain(`fill="url(#${id(first)})"`);
    expect(second).toContain(`fill="url(#${id(second)})"`);
  });

  it('reaches both public renderers without changing the pool or Canvas registry path', () => {
    expect(figure('mouse/swimming', '', 'engraved', 'trial')).toContain(
      'data-generated-rig="mouse/trial-dream"',
    );
    const fragment = svgFigure('mouse/swimming', 3, 4, 240, 120, '', 'engraved', 'trial');
    expect(fragment).toContain('transform="translate(3 4)"');
    expect(fragment).toContain('transform="scale(2 2)"');
    expect(fragment).toContain('width="120" height="60" viewBox="0 0 120 60"');
    expect(fragment).toContain('data-generated-rig="mouse/trial-dream"');
    expect(figure('mouse/swimming', '', 'engraved', 'pool-of-tears')).not.toContain(
      'data-generated-rig',
    );
    expect(
      svgFigure('mouse/swimming', 0, 0, 120, 60, '', 'engraved', 'pool-of-tears'),
    ).not.toContain('data-generated-rig');
    expect(ART['mouse/swimming']).not.toHaveProperty('generated');
  });

  it.each(['loaded', 'failed', 'empty'] as const)(
    'resolves the actual dream source through the shared loader when %s',
    async (outcome) => {
      vi.resetModules();
      const { hydrateGeneratedRig: hydrate } = await import('./generated-rig.ts');
      let finish: (() => void) | undefined;
      vi.stubGlobal(
        'Image',
        class {
          naturalWidth = outcome === 'empty' ? 0 : 1164;
          decode() {
            return new Promise<void>((resolve, reject) => {
              finish = () =>
                outcome === 'failed' ? reject(new Error('decode failed')) : resolve();
            });
          }
        },
      );
      const src = mouse().match(/<image\b[^>]* href="([^"]+)"/)?.[1];
      expect(src).toContain('runner--mouse.any.generated.webp');
      const attributes = new Map<string, string>();
      const rig = {
        querySelectorAll: () => [{ getAttribute: () => src }],
        setAttribute: (name: string, value: string) => attributes.set(name, value),
      } as unknown as SVGElement;
      const pending = hydrate(rig);
      expect(attributes.has('data-rig-ready')).toBe(false);
      finish?.();
      expect(await pending).toBe(outcome === 'loaded');
      expect(attributes.has('data-rig-ready')).toBe(outcome === 'loaded');
      expect(attributes.has('data-rig-failed')).toBe(outcome !== 'loaded');
    },
  );

  it('records reuse of the exact existing asset, not a new swimming generation', () => {
    const record = JSON.parse(
      readFileSync(
        new URL(
          '../../../docs/generated-assets-review/trial-mouse-reuse-20261021.json',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    const bytes = readFileSync(new URL(`../../../${record.asset}`, import.meta.url));
    expect(bytes.length).toBe(record.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
    expect([bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1]).toEqual(record.dimensions);
    expect(record.dimensions).toEqual([1164, 1351]);
    expect(record.alphaBoundsAbove32).toEqual([36, 434, 1154, 1118]);
    expect(record.acceptedScenes).toEqual(['trial']);
    expect(record.newGeneration).toBe(false);
    expect(record.assetBytesChanged).toBe(false);
    expect(record.browserVerified).toBe(false);
  });

  it('leaves the dream wrapper, reeds crossfade, interaction and reduced-motion ownership in Trial', () => {
    const main = readFileSync(new URL('../trial/main.ts', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../trial/trial.css', import.meta.url), 'utf8');
    expect(main).toContain("['mouse', figure('mouse/swimming'), REAL_SVG.reeds ?? '', 'splash']");
    expect(main).toContain(
      `<div class="tr__ghost-dream">\${dreamMarkup}</div><div class="tr__ghost-real">\${realMarkup}</div>`,
    );
    expect(main).toContain("turnReal(iRealOne + 0.5, ['mouse'])");
    expect(main).toContain("dream.toggleAttribute('data-real', eyesOpen)");
    expect(css).toContain('.tr__ghost[data-real] .tr__ghost-dream');
    expect(css).toContain('.tr__ghost[data-real] .tr__ghost-real');
    expect(css).toContain('.demo[data-paused] .tr__ghost-dream');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
