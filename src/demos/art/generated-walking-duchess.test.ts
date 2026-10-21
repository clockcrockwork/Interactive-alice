import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedWalkingDuchessSvg } from './generated-walking-duchess.ts';
import { DUCHESS_SVG } from './vectors.ts';

const original = DUCHESS_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

describe('standing Duchess in the walking chapter', () => {
  it('routes both public renderers without replacing Alice or the live flamingo', () => {
    const markup = [
      figure('duchess', '', 'engraved', 'duchess'),
      svgFigure('duchess', 20, 30, 120, 130, '', 'engraved', 'duchess'),
    ];
    for (const svg of markup) {
      expect(svg).toContain('data-generated-rig="duchess/walking"');
      expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
    }
    expect(markup[1]).toContain('transform="translate(20 30)"');
    expect(markup[1]).toContain('transform="scale(0.5 0.5)"');
    for (const id of ['alice/falling', 'flamingo/tucked']) {
      expect(figure(id, '', 'engraved', 'duchess')).not.toContain('data-generated');
    }
  });

  it('retains the complete fallback until the reused whole source decodes atomically', () => {
    const svg = generatedWalkingDuchessSvg('duchess', 'engraved', 'duchess');
    expect(svg).toBeTypeOf('string');
    expect(svg).toContain('data-generated-rig="duchess/walking"');
    expect(svg).toContain(`<g data-rig-fallback="">${original}</g>`);
    expect(svg).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(svg?.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(svg).toContain('duchess.any.generated.webp');
    expect(svg).not.toContain('duchess--seated');
    expect(svg).not.toContain('data-rig-ready');
  });

  it('uniformly maps the approximate old chin and floor in the fixed animation box', () => {
    const svg = generatedWalkingDuchessSvg('duchess', 'engraved', 'duchess');
    const scale = 140 / (1299 - 310);
    expect(svg).toContain('width="240" height="260" viewBox="0 0 240 260"');
    expect(svg).toContain(`x="${120 - 640 * scale}" y="${260 - 1299 * scale}"`);
    expect(svg).toContain(`width="${1205 * scale}" height="${1305 * scale}"`);
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toContain('<rect width="240" height="260"');
    expect(svg).not.toContain('dc__alice');
    expect(svg).not.toContain('dc__flamingo');
    expect(svg).not.toContain('--lean');
  });

  it('does not change seated, unscoped or other art treatments', () => {
    for (const demo of ['pig-and-pepper', 'croquet', 'trial', undefined]) {
      expect(generatedWalkingDuchessSvg('duchess', 'engraved', demo)).toBeUndefined();
    }
    for (const style of ['flat', 'paper'] as const) {
      expect(generatedWalkingDuchessSvg('duchess', style, 'duchess')).toBeUndefined();
    }
    expect(generatedWalkingDuchessSvg('alice/falling', 'engraved', 'duchess')).toBeUndefined();
    expect(generatedWalkingDuchessSvg('flamingo/tucked', 'engraved', 'duchess')).toBeUndefined();
  });

  it('gives repeated instances independent paint references', () => {
    const first = generatedWalkingDuchessSvg('duchess', 'engraved', 'duchess');
    const second = generatedWalkingDuchessSvg('duchess', 'engraved', 'duchess');
    const id = (svg: string | undefined) => svg?.match(/<pattern id="([^"]+)"/)?.[1];
    expect(id(first)).toBeTruthy();
    expect(id(second)).toBeTruthy();
    expect(id(second)).not.toBe(id(first));
    expect(first).toContain(`fill="url(#${id(first)})"`);
    expect(second).toContain(`fill="url(#${id(second)})"`);
  });

  it('records the exact existing asset and the provisional contact limitation', () => {
    const provenance = JSON.parse(
      readFileSync(
        new URL('../../assets/images/walking-duchess-provenance.json', import.meta.url),
        'utf8',
      ),
    );
    const bytes = readFileSync(
      new URL('../../assets/images/figures/duchess.any.generated.webp', import.meta.url),
    );
    expect(provenance.acceptedScenes).toEqual(['duchess']);
    expect(provenance.asset.bytes).toBe(bytes.length);
    expect(provenance.asset.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(provenance.asset.reusedWithoutReencoding).toBe(true);
    expect(provenance.runtimeImageBytesAdded).toBe(0);
    expect(provenance.composition.logicalBox).toEqual([240, 260]);
    expect(provenance.composition.uniformScale).toBe(140 / (1299 - 310));
    expect(provenance.validation.literalChinContactVerified).toBe(false);
    expect(provenance.validation.generatedAliceEnabled).toBe(false);
  });
});
