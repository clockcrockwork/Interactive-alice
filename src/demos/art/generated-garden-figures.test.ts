import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { ART } from './registry.ts';

for (const [id, w, h, scene] of [
  ['white-rabbit/garden', 60, 80, 'rabbit-house'],
  ['white-rabbit/garden', 60, 80, 'bill-the-lizard'],
  ['pat', 60, 70, 'rabbit-house'],
] as const) {
  describe(`${id} in ${scene}`, () => {
    it('keeps logical feet placement and atomic fallback for SVG and HTML consumers', () => {
      const svg = svgFigure(id, -w / 2, -h, w, h, 'fixture', 'engraved', scene);
      expect(svg).toContain(`transform="translate(${-w / 2} ${-h})"`);
      expect(svg).toContain(`viewBox="0 0 ${w} ${h}"`);
      expect(svg).toContain(`data-generated-rig="${id}"`);
      expect(svg).toContain(`rect width="${w}" height="${h}"`);
      expect(svg.match(/data-rig-image=""/g)).toHaveLength(1);
      expect(svg).toContain('data-rig-fallback=""');
      expect(svg).toContain('visibility="hidden" display="none"');
      expect(svg).not.toContain('data-rig-ready');
      expect(figure(id, '', 'engraved', scene)).toContain(`data-generated-rig="${id}"`);
    });
    it('retains originals for flat/paper and unsupported consumers', () => {
      const entry = ART[id];
      if (entry?.kind !== 'vector') throw Error('missing original');
      for (const style of ['flat', 'paper'] as const)
        expect(svgFigure(id, 0, 0, w, h, '', style, scene)).toContain(entry.fragment);
      expect(svgFigure(id, 0, 0, w, h, '', 'engraved', 'trial')).not.toContain(
        'data-generated-rig',
      );
    });
  });
}
