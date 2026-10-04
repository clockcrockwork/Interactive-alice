/**
 * The drawing trial (docs/art-trials.md): the style names, the filters every page
 * shares, and which figures the pictures style serves as images.
 */

import { describe, expect, it } from 'vitest';
import { bakedFor, figure, svgFigure } from './art.ts';
import { BAKED } from './baked.ts';
import { ART, LIVE_PARTS } from './registry.ts';
import { ART_STYLES, artFilterDefs, ENGRAVINGS, parseArtStyle } from './treatments.ts';

describe('the drawing styles', () => {
  it('reads a stored choice, and anything unknown as flat', () => {
    expect(ART_STYLES).toEqual(['flat', 'engraved', 'paper', 'baked']);
    for (const style of ART_STYLES) {
      expect(parseArtStyle(style)).toBe(style);
    }
    for (const junk of [null, undefined, '', 'Engraved', 'sepia']) {
      expect(parseArtStyle(junk)).toBe('flat');
    }
  });

  it('defines every filter art.css names, painting only token colours', () => {
    const defs = artFilterDefs();
    for (const id of ['art-engraved', 'art-engraved-alice', 'art-paper']) {
      expect(defs).toContain(`<filter id="${id}"`);
    }
    expect(ENGRAVINGS.map((e) => e.id)).toEqual(['art-engraved', 'art-engraved-alice']);
    // Every flood takes its colour from a class (a token in art.css), never an attribute.
    for (const flood of defs.match(/<feFlood[^>]*>/g) ?? []) {
      expect(flood).toMatch(/class="art-fx-(?:ink|paper|shadow)"/);
      expect(flood).not.toContain('flood-color');
    }
    const tiles = [...defs.matchAll(/href="data:image\/svg\+xml,([^"]+)"/g)].map((m) =>
      decodeURIComponent(m[1] ?? ''),
    );
    expect(tiles.length).toBeGreaterThan(0);
    for (const text of [defs, ...tiles]) {
      expect(text).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    }
  });

  it('keeps Alice more of her own colour than Wonderland under the engraving', () => {
    const [world, alice] = ENGRAVINGS;
    expect(alice?.tint).toBeGreaterThan(world?.tint ?? 1);
  });
});

describe('the baked pictures', () => {
  const ids = Object.keys(BAKED);

  it('bakes the figures the demos show most, at twice their box', () => {
    for (const id of [
      'alice/falling',
      'white-rabbit/herald',
      'queen-of-hearts',
      'card-soldier',
      'gryphon',
    ]) {
      expect(ids).toContain(id);
    }
    for (const id of ids) {
      const entry = ART[id];
      expect(entry?.kind, id).toBe('vector');
      const [w, h] = entry?.kind === 'vector' ? entry.box : [0, 0];
      const sources = Object.entries(BAKED[id] ?? {});
      const alice = id.startsWith('alice/');
      expect(sources.map(([variant]) => variant).sort(), id).toEqual(
        alice ? ['blue', 'yellow'] : ['any'],
      );
      for (const [, source] of sources) {
        expect([source.width, source.height], id).toEqual([w * 2, h * 2]);
        expect(source.src, id).toMatch(
          /\/assets\/images\/figures\/[a-z-]+\.(?:any|blue|yellow)\.webp$/,
        );
      }
    }
  });

  it('serves a picture only in the pictures style, and never where a demo moves its parts', () => {
    expect(bakedFor('queen-of-hearts', 'flat', 'croquet')).toBeUndefined();
    expect(bakedFor('queen-of-hearts', 'engraved', 'croquet')).toBeUndefined();
    expect(bakedFor('queen-of-hearts', 'baked', 'croquet')).toBe(BAKED['queen-of-hearts']);
    for (const [id, demos] of Object.entries(LIVE_PARTS)) {
      for (const demo of demos) {
        expect(bakedFor(id, 'baked', demo), `${id} in ${demo}`).toBeUndefined();
      }
    }
    expect(bakedFor('cheshire-cat/head', 'baked', 'croquet')).toBeUndefined();
  });

  it('puts the picture beside the vector, so the page can show either', () => {
    const flat = figure('king-of-hearts', '', 'flat');
    expect(flat).not.toContain('<img');
    const baked = figure('king-of-hearts', 'x', 'baked');
    expect(baked).toContain('class="art art--baked x"');
    expect(baked).toContain('<svg');
    expect(baked).toMatch(/<img class="art__image art__image--baked" data-variant="any"/);
    const alice = figure('alice/falling', '', 'baked');
    expect(alice).toContain('data-variant="yellow"');
    expect(alice).toContain('data-variant="blue"');
    // Outside a browser the page style is flat: an SVG context gets no image.
    expect(svgFigure('white-rabbit/garden', 0, 0, 60, 80)).not.toContain('<image');
  });
});
