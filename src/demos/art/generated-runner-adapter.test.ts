import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { ART, type ArtEntry } from './registry.ts';
import { RUNNERS } from './vectors.ts';

type VectorEntry = Extract<ArtEntry, { kind: 'vector' }>;

// A self-contained fixture, not an asset declaration. Restore the real registry
// after each assertion so this adapter test never registers a candidate image.
const SOURCE = {
  src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="480"/></svg>')}`,
  width: 500,
  height: 500,
  footY: 480,
};

function withGeneratedEntry(id: string, check: (original: VectorEntry) => void): void {
  const original = ART[id];
  if (original?.kind !== 'vector') {
    throw new Error(`expected vector fixture ${id}`);
  }
  ART[id] = { ...original, generated: { any: SOURCE } };
  try {
    check(original);
  } finally {
    ART[id] = original;
  }
}

describe('generated runner adapter', () => {
  for (const kind of RUNNERS) {
    it(`keeps ${kind}'s image inside the untransformed motion and overlay group`, () => {
      withGeneratedEntry(`runner/${kind}`, () => {
        for (const demo of ['caucus-race', 'mouse-tale']) {
          // Yellow Alice has a scene-specific two-pose adapter. The unchanged
          // blue route still exercises a generic generated registry entry.
          const markup = figure(`runner/${kind}`, '', 'engraved', demo, 'blue');
          expect(markup).toContain('data-generated=""');
          expect(markup).toContain('viewBox="0 0 100 116"');
          expect(markup.match(/class="cr__figure"/g)).toHaveLength(1);
          expect(markup).toMatch(/<g class="cr__figure"><image [^>]+\/><\/g><\/svg>/);
          expect(markup).toContain(`href="${SOURCE.src}"`);
          expect(markup.match(/<image /g)).toHaveLength(1);
          expect(markup).not.toContain('<path');
        }
      });
    });

    it(`leaves ${kind}'s flat and paper drawings unchanged`, () => {
      withGeneratedEntry(`runner/${kind}`, (original) => {
        for (const style of ['flat', 'paper'] as const) {
          expect(figure(`runner/${kind}`, '', style, 'caucus-race')).toBe(
            `<span class="art " data-art="runner/${kind}">${original.markup}</span>`,
          );
        }
      });
    });
  }

  it('keeps the generated runner centered with its visible feet on the logical floor', () => {
    withGeneratedEntry('runner/duck', () => {
      const markup = figure('runner/duck', 'fixture-runner', 'engraved', 'caucus-race');
      expect(markup).toContain('art--generated fixture-runner');
      expect(markup).toContain('x="0" y="20" width="100" height="100"');
      expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(markup).toContain('data-variant="any"');
    });
  });

  it('does not add the runner group to other generated figures', () => {
    withGeneratedEntry('alice/from-behind', () => {
      const markup = figure('alice/from-behind', '', 'engraved', 'trial');
      expect(markup).toContain('data-generated=""');
      expect(markup).toMatch(/<svg [^>]+><image [^>]+\/><\/svg>/);
      expect(markup).not.toContain('cr__figure');
    });
  });
});
