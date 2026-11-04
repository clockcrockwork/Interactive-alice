import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { generatedDinahSvg } from './generated-dinah.ts';
import { ART } from './registry.ts';
import { DINAH_POUNCING_SVG, DINAH_SVG } from './vectors.ts';

describe('engraved Dinah', () => {
  it('uses the seated cutout in the pool memory and retains the original figure box', () => {
    const markup = figure('dinah-cat', '', 'engraved', 'pool-of-tears');
    expect(markup).toContain('dinah-cat.any.generated.webp');
    expect(markup).toContain('data-generated-rig="dinah-cat"');
    expect(markup).toContain('data-rig-fallback=""');
    expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(markup).toContain('viewBox="0 0 120 100"');
    const entry = ART['dinah-cat'];
    expect(entry?.kind).toBe('vector');
    if (entry?.kind !== 'vector') return;
    expect(entry.box).toEqual([120, 100]);
    expect(entry.generated?.any).toMatchObject({ width: 480, height: 400, footY: 394 });
  });

  it('keeps the distinct pouncing moment as the existing right-facing figure', () => {
    const markup = figure('dinah-cat/pouncing', '', 'flat', 'mouse-tale');
    expect(markup).toContain('viewBox="0 0 160 80"');
    expect(markup).not.toContain('dinah-cat.any.generated.webp');
  });

  it('uses the exact seated vector while the image loads and outside engraved consumers', () => {
    const markup = generatedDinahSvg('dinah-cat', 'engraved', 'pool-of-tears') ?? '';
    const fallback = DINAH_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    expect(markup).toContain(`<g data-rig-fallback="">${fallback}</g>`);
    expect(generatedDinahSvg('dinah-cat', 'paper', 'pool-of-tears')).toBeUndefined();
    expect(generatedDinahSvg('dinah-cat', 'engraved', 'trial')).toBeUndefined();
    expect(generatedDinahSvg('dinah-cat/pouncing', 'engraved', 'trial')).toBeUndefined();
  });

  it('uses a generated leap for the Mouse Tale ghost and Rabbit-hole chase with vector fallback', () => {
    for (const demo of ['mouse-tale', 'rabbit-hole']) {
      const markup = figure('dinah-cat/pouncing', '', 'engraved', demo);
      const vector = DINAH_POUNCING_SVG.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      expect(markup).toContain('dinah-cat--pouncing.any.generated.webp');
      expect(markup).toContain('data-generated-rig="dinah-cat/pouncing"');
      expect(markup).toContain(`<g data-rig-fallback="">${vector}</g>`);
    }
  });
});
