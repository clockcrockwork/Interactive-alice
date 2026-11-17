import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { JURY_SVG } from './vectors.ts';

describe('generated jury with original interactive slates', () => {
  for (const scene of ['trial', 'witnesses']) {
    it(`${scene}: preserves twelve exact slate groups and atomic fallback`, () => {
      const markup = figure('jury', '', 'engraved', scene);
      expect(markup).toContain('data-generated-rig="jury"');
      expect(markup.match(/class="tr__slate"/g)).toHaveLength(12);
      for (const [group] of JURY_SVG.matchAll(/<g class="tr__slate"[\s\S]*?<\/g>/g))
        expect(markup).toContain(group);
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(1);
      expect(markup.match(/translateY\(24px\)/g)).toHaveLength(6);
      expect(markup.match(/translateY\(10px\)/g)).toHaveLength(6);
      expect(markup).toContain('visibility="hidden" display="none"');
      expect(markup).not.toContain('data-rig-ready');
    });
  }
  it('retains original style and unrelated scene rendering', () => {
    for (const style of ['flat', 'paper'] as const)
      expect(figure('jury', '', style, 'trial')).toContain(JURY_SVG);
    expect(figure('jury', '', 'engraved', 'croquet')).not.toContain('data-generated-rig="jury"');
  });
});
