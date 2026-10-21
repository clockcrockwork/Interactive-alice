import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedSeatedDuchessSvg } from './generated-seated-duchess.ts';
import { DUCHESS_SVG } from './vectors.ts';

const original = DUCHESS_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

describe('seated Duchess scene compositions', () => {
  it('routes kitchen and arrival through both public renderers', () => {
    for (const scene of ['pig-and-pepper', 'croquet']) {
      for (const svg of [
        figure('duchess', '', 'engraved', scene),
        svgFigure('duchess', 20, 30, 120, 130, '', 'engraved', scene),
      ]) {
        expect(svg).toContain('data-generated-rig="duchess/seated"');
        expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
      }
    }
  });

  it('retains the full original drawing until its one image decodes atomically', () => {
    const svg = generatedSeatedDuchessSvg('duchess', 'engraved', 'pig-and-pepper');
    expect(svg).toContain('viewBox="0 0 240 260"');
    expect(svg).toContain('data-generated-rig="duchess/seated"');
    expect(svg).toContain(`<g data-rig-fallback="">${original}</g>`);
    expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(svg?.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(svg).not.toContain('data-rig-ready');
    expect(svg).not.toContain('pp__baby');
  });

  it('preserves the outer animation box and uniformly fits the intact canvas', () => {
    const svg = generatedSeatedDuchessSvg('duchess', 'engraved', 'pig-and-pepper');
    const scale = 180 / 1205;
    expect(svg).toContain('width="240" height="260"');
    expect(svg).toContain(`x="30" y="${260 - 1306 * scale}"`);
    expect(svg).toContain(`width="180" height="${1306 * scale}"`);
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toContain('<rect width="240" height="260"');
  });

  it('uses an independent full-height fit for the contact-free Croquet arrival', () => {
    const svg = generatedSeatedDuchessSvg('duchess', 'engraved', 'croquet');
    const width = 1205 * (260 / 1306);
    expect(svg).toContain('viewBox="0 0 240 260"');
    expect(svg).toContain(`x="${(240 - width) / 2}" y="0"`);
    expect(svg).toContain(`width="${width}" height="260"`);
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toContain('<rect width="240" height="260"');
    expect(svg).toContain(`<g data-rig-fallback="">${original}</g>`);
    expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(svg?.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(svg).not.toContain('data-rig-ready');
  });

  it('leaves walking/chin-contact, unrelated scenes and flat/paper untouched', () => {
    for (const scene of ['duchess', 'trial', 'caterpillar', undefined]) {
      expect(generatedSeatedDuchessSvg('duchess', 'engraved', scene)).toBeUndefined();
    }
    for (const scene of ['pig-and-pepper', 'croquet']) {
      for (const style of ['flat', 'paper'] as const) {
        expect(generatedSeatedDuchessSvg('duchess', style, scene)).toBeUndefined();
      }
      expect(generatedSeatedDuchessSvg('pig-baby', 'engraved', scene)).toBeUndefined();
    }
  });

  it('uses distinct paint references when the same cutout is repeated', () => {
    const first = generatedSeatedDuchessSvg('duchess', 'engraved', 'pig-and-pepper');
    const second = generatedSeatedDuchessSvg('duchess', 'engraved', 'croquet');
    const id = (value: string | undefined) => value?.match(/<pattern id="([^"]+)"/)?.[1];
    expect(id(first)).toBeTruthy();
    expect(id(second)).not.toBe(id(first));
    expect(first).toContain(`fill="url(#${id(first)})"`);
    expect(second).toContain(`fill="url(#${id(second)})"`);
  });

  it('records the unchanged source canvas and exact-alpha encoding', () => {
    const provenance = JSON.parse(
      readFileSync(
        new URL('../../assets/images/seated-duchess-provenance.json', import.meta.url),
        'utf8',
      ),
    );
    expect(provenance.asset.width).toBe(1205);
    expect(provenance.asset.height).toBe(1306);
    expect(provenance.asset.alphaPreservedExactly).toBe(true);
    expect(provenance.acceptedScenes).toEqual(['pig-and-pepper', 'croquet']);
    expect(provenance.pendingScenes).toEqual([]);
    expect(provenance.excludedScenes).toEqual(['duchess']);
    expect(provenance.walkingRecord).toBe('walking-duchess-provenance.json');
    expect(provenance.asset.arrivalComposition.logicalBox).toEqual([240, 260]);
    expect(provenance.asset.arrivalComposition.height).toBe(260);
    expect(provenance.asset.arrivalComposition.width).toBe(1205 * (260 / 1306));
    expect(provenance.asset.arrivalComposition.y).toBe(0);
  });
});
