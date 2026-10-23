import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { generatedGryphonSvg } from './generated-gryphon.ts';
import { GRYPHON_SVG } from './vectors.ts';

const original = GRYPHON_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function quadrille(): string {
  const markup = generatedGryphonSvg('gryphon', 'engraved', 'lobster-quadrille');
  expect(markup).toBeDefined();
  return markup ?? '';
}

describe('generated quadrille Gryphon', () => {
  it('keeps the complete palette-aware vector fallback until atomic decoding succeeds', () => {
    const markup = quadrille();
    expect(markup).toContain('viewBox="0 0 240 220"');
    expect(markup).toContain('focusable="false" data-generated-rig="gryphon"');
    expect(markup).toContain(`<g data-rig-fallback="">${original}</g>`);
    expect(markup).toContain('<g data-rig-generated="" visibility="hidden" display="none">');
    expect(markup.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(markup).not.toContain('data-rig-ready');
    expect(markup).not.toContain('mt__paw');
    expect(markup).not.toContain('<filter');
  });

  it('places the unchanged source canvas with visible feet on the logical ground', () => {
    const image = quadrille().match(/<image[^>]*>/)?.[0] ?? '';
    const number = (name: string): number =>
      Number(image.match(new RegExp(`${name}="([^"]+)"`))?.[1]);
    const scale = number('width') / 1306;
    expect(number('height') / 1205).toBeCloseTo(scale);
    expect(number('x') + (1306 * scale) / 2).toBeCloseTo(120);
    expect(number('y') + 1172 * scale).toBeCloseTo(220);
    expect(number('x')).toBeGreaterThanOrEqual(0);
    expect(number('y')).toBeGreaterThanOrEqual(0);
    expect(image).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(image).toContain('gryphon~whole.shore.generated.webp');
  });

  it('does not replace flat, paper, unrelated figures, or unknown consumers', () => {
    for (const style of ['flat', 'paper'] as const)
      expect(generatedGryphonSvg('gryphon', style, 'lobster-quadrille')).toBeUndefined();
    for (const scene of ['witnesses', 'croquet', undefined])
      expect(generatedGryphonSvg('gryphon', 'engraved', scene)).toBeUndefined();
    expect(generatedGryphonSvg('mock-turtle', 'engraved', 'lobster-quadrille')).toBeUndefined();
  });
});

describe('generated chapter Gryphon forelegs', () => {
  it('uses the identical neutral assembly at the Duchess-to-chapter join', () => {
    const landing = generatedGryphonSvg('gryphon', 'engraved', 'duchess') ?? '';
    const chapter = generatedGryphonSvg('gryphon', 'engraved', 'mock-turtle');
    expect(
      landing.replace('data-gryphon-scene="duchess"', 'data-gryphon-scene="mock-turtle"'),
    ).toBe(chapter);
    expect(landing.match(/data-rig-image=""/g)).toHaveLength(3);
    expect(landing).not.toContain('mt__paw');
  });
  it('keeps exactly three required images behind the atomic fallback', () => {
    const markup = generatedGryphonSvg('gryphon', 'engraved', 'mock-turtle') ?? '';
    expect(markup).toContain('data-gryphon-scene="mock-turtle"');
    expect(markup).toContain(`<g data-rig-fallback="">${original}</g>`);
    expect(markup.match(/data-rig-image=""/g)).toHaveLength(3);
    expect(markup).toContain('visibility="hidden" display="none"');
    expect(markup).not.toContain('data-rig-ready');
    expect(markup).not.toContain('mt__paw');
  });

  it('maps both independent forelegs with separate uniform canvas transforms', () => {
    const markup = generatedGryphonSvg('gryphon', 'engraved', 'mock-turtle') ?? '';
    expect(markup).toContain('data-gryphon-part="near"');
    expect(markup).toContain('data-gryphon-part="far"');
    const images = [...markup.matchAll(/<image[^>]*>/g)].map(([image]) => image);
    expect(images).toHaveLength(3);
    const dimensions = [
      [1305, 1205, 1],
      [1416, 1111, 0.91],
      [1305, 1205, 1],
    ];
    for (const [index, image] of images.entries()) {
      const [w, h, factor] = dimensions[index] ?? [];
      const number = (name: string): number =>
        Number(image.match(new RegExp(`${name}="([^"]+)"`))?.[1]);
      expect(number('width') / (w ?? 1)).toBeCloseTo((220 / 1205) * (factor ?? 1));
      expect(number('height') / (h ?? 1)).toBeCloseTo((220 / 1205) * (factor ?? 1));
    }
  });
});

it('keeps original chapter paws until all generated layers are ready', () => {
  const path = new URL('./generated-gryphon.css', import.meta.url);
  expect(existsSync(path)).toBe(true);
  const css = readFileSync(path, 'utf8');
  expect(css).toContain(
    '[data-generated-rig="gryphon"][data-gryphon-scene="mock-turtle"][data-rig-ready]',
  );
  expect(css).toMatch(/> svg\.mt__paws\s*\{\s*display: none;/);
  expect(css).toContain('rotate(calc(var(--hide) * -137deg))');
  expect(css).toContain('translateY(calc(var(--hide) * var(--gryphon-lift)))');
  expect(css).toContain('rotate(calc(var(--hide) * -158deg))');
  expect(css).not.toContain('animation:');
});

describe('Gryphon art routing', () => {
  for (const scene of ['mock-turtle', 'lobster-quadrille', 'duchess', 'trial']) {
    it(`routes only the engraved ${scene} consumer through the scoped renderer`, () => {
      const markup = figure('gryphon', '', 'engraved', scene);
      expect(markup).toContain('data-generated-rig="gryphon"');
      expect(markup).toContain(`data-gryphon-scene="${scene}"`);
      const articulated = scene === 'mock-turtle' || scene === 'duchess';
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(articulated ? 3 : 1);
      if (!articulated) {
        expect(markup).toContain('gryphon~whole.shore.generated.webp');
        expect(markup).not.toContain('data-gryphon-part');
        expect(markup).not.toContain('mt__paw');
      }
      for (const style of ['flat', 'paper'] as const) {
        const originalMarkup = figure('gryphon', '', style, scene);
        expect(originalMarkup).toContain(GRYPHON_SVG);
        expect(originalMarkup).not.toContain('data-generated-rig="gryphon"');
      }
    });
  }
  it('loads the chapter stylesheet only through the runtime loader', () => {
    const runtime = readFileSync(new URL('./generated-rig.ts', import.meta.url), 'utf8');
    const renderer = readFileSync(new URL('./generated-gryphon.ts', import.meta.url), 'utf8');
    expect(runtime).toContain("import './generated-gryphon.css'");
    expect(renderer).not.toMatch(/import .*\.css/);
  });
});
