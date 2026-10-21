import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { RABBIT_SVG } from './vectors.ts';

describe('running rabbit outer-motion adapter', () => {
  for (const demo of ['riverbank', 'rabbit-hole', 'pool-of-tears', 'mouse-tale']) {
    it(`${demo} retains SVG, fixed motion box and atomic fallback`, () => {
      const html = figure('white-rabbit/running', '', 'engraved', demo);
      expect(html).toContain('data-generated-rig="white-rabbit/running"');
      expect(html).toContain('width="120" height="100" viewBox="0 0 120 100"');
      expect(html).toContain('data-rig-fallback=""');
      expect(html.match(/data-rig-image=""/g)).toHaveLength(1);
      expect(html).not.toContain('data-rig-ready');
      expect(html).not.toContain('rb__watch');
    });
  }
  it('keeps other styles and the court evidence original', () => {
    for (const style of ['flat', 'paper'] as const)
      expect(figure('white-rabbit/running', '', style, 'riverbank')).toContain(RABBIT_SVG);
    expect(figure('white-rabbit/running', '', 'engraved', 'trial')).not.toContain(
      'data-generated-rig',
    );
  });
});
