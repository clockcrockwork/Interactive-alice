import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { generatedFallingCardSvg } from './generated-falling-card.ts';

describe('falling whole-card consumers only', () => {
  for (const variant of ['yellow', 'blue'] as const)
    for (const scene of ['drink-me', 'trial']) {
      it(`${scene} ${variant} keeps fixed box and decode fallback`, () => {
        const svg = generatedFallingCardSvg('alice/falling', 'engraved', scene, variant);
        expect(svg).toContain('viewBox="0 0 120 200"');
        expect(svg).toContain(`data-variant="${variant}"`);
        expect(svg?.match(/data-rig-image=""/g)).toHaveLength(1);
        expect(svg).toContain('data-rig-fallback=""');
        expect(svg).not.toContain('data-rig-ready');
        expect(figure('alice/falling', '', 'engraved', scene, variant)).toContain(
          'data-generated-rig="alice/falling-card"',
        );
      });
    }
  it('never flattens the live falling rig or unchecked Duchess contacts', () => {
    for (const scene of ['rabbit-hole', 'duchess', undefined])
      expect(generatedFallingCardSvg('alice/falling', 'engraved', scene, 'yellow')).toBeUndefined();
    for (const style of ['flat', 'paper'] as const)
      expect(generatedFallingCardSvg('alice/falling', style, 'trial', 'blue')).toBeUndefined();
    expect(
      generatedFallingCardSvg('alice/standing', 'engraved', 'trial', 'yellow'),
    ).toBeUndefined();
  });
});
