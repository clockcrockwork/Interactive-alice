import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { ART } from './registry.ts';

for (const [id, pips] of [
  ['gardener/two', 2],
  ['gardener/five', 5],
  ['gardener/seven', 7],
] as const) {
  describe(id, () => {
    it('retains its exact pip count, a single painting hook and atomic fallback', () => {
      const html = figure(id, '', 'engraved', 'croquet');
      expect(html).toContain(`data-generated-rig="${id}"`);
      expect(html).toContain('viewBox="0 0 120 220"');
      expect(html.match(/class="cq__brush"/g)).toHaveLength(1);
      expect(html.match(/data-rig-image=""/g)).toHaveLength(2);
      expect(html).not.toContain('data-rig-ready');
      const spots = html.match(
        new RegExp(`<g data-gardener-pips="${pips}"[^>]*>([\\s\\S]*?)</g>`),
      )?.[1];
      expect(spots?.match(/<path /g)).toHaveLength(pips);
      expect(html).toContain('matrix(.9 0 0 .8 0 -10)');
      expect(html).toContain('data-rig-part=""');
      expect(html).toContain('visibility="hidden" display="none"');
    });
    it('keeps the original styles and other scene consumers', () => {
      const entry = ART[id];
      if (entry?.kind !== 'vector') throw Error('original missing');
      for (const style of ['flat', 'paper'] as const)
        expect(figure(id, '', style, 'croquet')).toContain(entry.markup);
      expect(figure(id, '', 'engraved', 'trial')).not.toContain('data-generated-rig');
    });
  });
}
