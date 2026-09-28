/**
 * The registry's drawings keep to the palette of docs/visual-design.md: tokens,
 * never literals; Alice through her own tokens; Wonderland red only where the story
 * gives it a reason.
 */

import { describe, expect, it } from 'vitest';
import { ART } from './registry.ts';

const drawings = Object.entries(ART).flatMap(([id, entry]) =>
  entry.kind === 'vector' ? [[id, `${entry.markup}\n${entry.fragment ?? ''}`] as const] : [],
);

/** A colour written out rather than taken from a token. */
const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\((?!from )/i;

/** Figures the guide lets carry Wonderland red, and why. */
const RED_BEARERS = new Set([
  'white-rabbit/running', // waistcoat
  'white-rabbit/herald', // coat
  'white-rabbit/garden', // waistcoat
  'king-of-hearts',
  'queen-of-hearts',
  'knave-of-hearts', // the heart, the hat
  'card-soldier', // diamond pip and coat
  'card-arch', // the same soldier, doubled up
  'gardener/two', // the paint on the brush (the demo's --cq-red, red by default)
  'gardener/five',
  'gardener/seven',
  'jury', // the "no" on a slate
  'lobster', // the shore's red
  'duchess', // the Queen's cousin in temper
  'fish-footman', // livery facings
  'frog-footman',
]);

describe('the character art', () => {
  it('registers a drawing for every vector id', () => {
    expect(drawings.length).toBeGreaterThan(50);
    for (const [id, markup] of drawings) {
      if (!['alice/swimming', 'mouse/swimming'].includes(id)) {
        expect(markup.trim(), id).not.toBe('');
      }
    }
  });

  it('writes no literal colour: every fill and stroke is a token or derived from one', () => {
    for (const [id, markup] of drawings) {
      const withoutMaskStops = markup.replaceAll(/stop-color="(?:black|white)"/g, '');
      expect(withoutMaskStops, id).not.toMatch(LITERAL);
    }
  });

  it('draws Alice through her own tokens, with ink for her eyes and mouth', () => {
    const alice = drawings.filter(([id]) => id.startsWith('alice/') || id === 'runner/alice');
    expect(alice.length).toBeGreaterThan(5);
    for (const [id, markup] of alice) {
      const tokens = [...markup.matchAll(/var\((--[a-z-]+)/g)].map((m) => m[1] ?? '');
      for (const token of tokens) {
        expect(token, `${id} uses ${token}`).toMatch(/^--(?:alice|ink)-/);
      }
    }
  });

  it('keeps Wonderland red to the figures the story gives it', () => {
    for (const [id, markup] of drawings) {
      // A sepia-pink mixed from the faded red is a printed tint, not the symbolic red.
      const plain = markup.replaceAll(/color-mix\([^)]*--wonder-red-faded[^)]*\)/g, '');
      const carriesRed = /--wonder-red/.test(plain);
      expect(carriesRed, `${id} ${carriesRed ? 'carries' : 'lacks'} red`).toBe(RED_BEARERS.has(id));
    }
  });

  it('gives every demo-owned colour property a token fallback', () => {
    for (const [id, markup] of drawings) {
      for (const match of markup.matchAll(/var\((--(?:[a-z]{2})-[a-z-]+)(,)?/g)) {
        const name = match[1] ?? '';
        const comma = match[2];
        if (/^--(?:alice|ink|paper|sepia|wonder|world|ix)-/.test(name)) {
          continue;
        }
        expect(comma, `${id}: ${name} has no fallback`).toBe(',');
      }
    }
  });
});
