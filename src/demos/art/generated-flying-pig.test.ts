import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { PIG_BABY_SVG } from './vectors.ts';

describe('Duchess flying pig only', () => {
  it('keeps fixed fly box, atomic fallback and separate original wings', () => {
    const html = figure('pig-baby', '', 'engraved', 'duchess');
    expect(html).toContain('data-generated-rig="pig-baby/flying"');
    expect(html).toContain('viewBox="0 0 200 200"');
    expect(html.match(/data-rig-image=""/g)).toHaveLength(1);
    expect(html).toContain('data-rig-fallback=""');
    expect(html).not.toContain('data-rig-ready');
    expect(html).not.toContain('dc__wing');
  });
  it('never replaces the Kitchen staged morph or original alternate styles', () => {
    expect(figure('pig-baby', '', 'engraved', 'pig-and-pepper')).toContain(PIG_BABY_SVG);
    for (const style of ['flat', 'paper'] as const)
      expect(figure('pig-baby', '', style, 'duchess')).toContain(PIG_BABY_SVG);
  });
});
