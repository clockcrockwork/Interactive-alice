import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { ART } from './registry.ts';

describe('generated quadrille Mock Turtle', () => {
  it('keeps two original animated tear paths outside the image', () => {
    const html = figure('mock-turtle', '', 'engraved', 'lobster-quadrille');
    expect(html).toContain('data-generated-rig="mock-turtle"');
    expect(html).toContain('viewBox="0 0 240 220"');
    expect(html.match(/class="lq__tear"/g)).toHaveLength(2);
    expect(html.match(/data-rig-map=""/g)).toHaveLength(2);
    expect(html).toContain('translate(-2px, -2px)');
    expect(html).toContain('translate(12px, 5px)');
    expect(html.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(html).toContain('data-rig-fallback=""');
    expect(html).toContain('visibility="hidden" display="none"');
    expect(html).not.toContain('data-rig-ready');
  });
  it('retains the original in the independent-flapper scene and outside its scope', () => {
    for (const scene of ['mock-turtle', 'trial', undefined]) {
      expect(figure('mock-turtle', '', 'engraved', scene)).not.toContain('data-generated-rig');
    }
  });
  it('preserves flat and paper originals', () => {
    const entry = ART['mock-turtle'];
    if (entry?.kind !== 'vector') throw Error('original missing');
    for (const style of ['flat', 'paper'] as const) {
      expect(figure('mock-turtle', '', style, 'lobster-quadrille')).toContain(entry.markup);
    }
  });
});
