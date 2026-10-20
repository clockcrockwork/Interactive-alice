/**
 * How the figures are drawn (docs/art-trials.md): the style names, the filters every
 * page shares, and which figures the engraved style serves as pictures or cut-outs.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { bakedFor, cutOutsFor, figure, svgFigure } from './art.ts';
import { BAKED, BAKED_PARTS } from './baked.ts';
import { ART, CUT_OUTS, LIVE_PARTS, OWN_COLOURS } from './registry.ts';
import { ART_STYLES, artFilterDefs, ENGRAVINGS, parseArtStyle } from './treatments.ts';

const DEMOS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every `var(--name, fallback)` in a drawing, the fallback read to its closing bracket. */
function fallbacks(markup: string): [string, string][] {
  const found: [string, string][] = [];
  for (const match of markup.matchAll(/var\((--[a-z-]+), /g)) {
    let depth = 1;
    let end = (match.index ?? 0) + match[0].length;
    const start = end;
    for (; end < markup.length && depth > 0; end++) {
      depth += markup[end] === '(' ? 1 : markup[end] === ')' ? -1 : 0;
    }
    found.push([match[1] ?? '', markup.slice(start, end - 1)]);
  }
  return found;
}

describe('the drawing styles', () => {
  it("reads a stored choice, and anything else, the trial's `baked` too, as engraved", () => {
    expect(ART_STYLES).toEqual(['engraved', 'flat', 'paper']);
    for (const style of ART_STYLES) {
      expect(parseArtStyle(style)).toBe(style);
    }
    for (const other of [null, undefined, '', 'baked', 'Engraved', 'sepia']) {
      expect(parseArtStyle(other)).toBe('engraved');
    }
  });

  it('defines every filter art.css names, painting only token colours', () => {
    const defs = artFilterDefs();
    for (const id of ['art-engraved', 'art-engraved-alice', 'art-rim', 'art-paper']) {
      expect(defs).toContain(`<filter id="${id}"`);
    }
    expect(ENGRAVINGS.map((e) => e.id)).toEqual(['art-engraved', 'art-engraved-alice']);
    // Every flood takes its colour from a class (a token in art.css), never an attribute.
    for (const flood of defs.match(/<feFlood[^>]*>/g) ?? []) {
      expect(flood).toMatch(/class="art-fx-(?:ink|paper|rim|shadow)"/);
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
  const usesAliceColours = (id: string): boolean => {
    const entry = ART[id];
    return entry?.kind === 'vector' && /--alice-/.test(entry.markup + (entry.fragment ?? ''));
  };

  it('bakes the figures the demos show most, at twice their box', () => {
    for (const id of [
      'alice/falling',
      'white-rabbit/herald',
      'queen-of-hearts',
      'card-soldier',
      'gryphon',
      'hedgehog',
      'crab',
    ]) {
      expect(ids).toContain(id);
    }
    for (const id of ids) {
      const entry = ART[id];
      expect(entry?.kind, id).toBe('vector');
      const [w, h] = entry?.kind === 'vector' ? entry.box : [0, 0];
      const sources = Object.entries(BAKED[id] ?? {});
      const alice = id.startsWith('alice/') || usesAliceColours(id);
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

  it('serves a picture only in the engraved style, and never where a demo moves its parts', () => {
    expect(bakedFor('queen-of-hearts', 'flat', 'croquet')).toBeUndefined();
    expect(bakedFor('queen-of-hearts', 'paper', 'croquet')).toBeUndefined();
    expect(bakedFor('queen-of-hearts', 'engraved', 'croquet')).toBe(BAKED['queen-of-hearts']);
    for (const [id, demos] of Object.entries(LIVE_PARTS)) {
      for (const demo of demos) {
        expect(bakedFor(id, 'engraved', demo), `${id} in ${demo}`).toBeUndefined();
      }
    }
    for (const [id, demos] of Object.entries(OWN_COLOURS)) {
      for (const demo of demos) {
        expect(bakedFor(id, 'engraved', demo), `${id} in ${demo}`).toBeUndefined();
      }
    }
    expect(bakedFor('cheshire-cat/head', 'engraved', 'croquet')).toBeUndefined();
  });

  it('keeps the vector where a demo gives a baked figure colours of its own', () => {
    // A demo stylesheet that sets a property a baked drawing reads, to anything but
    // the drawing's own default, must be listed in OWN_COLOURS for that figure.
    const sheets = readdirSync(DEMOS, { withFileTypes: true })
      .filter((dir) => dir.isDirectory() && dir.name !== 'art')
      .map((dir) => {
        const files = readdirSync(join(DEMOS, dir.name));
        const read = (ext: string) =>
          files
            .filter((file) => file.endsWith(ext))
            .map((file) => readFileSync(join(DEMOS, dir.name, file), 'utf8'))
            .join('\n');
        return { demo: dir.name, css: read('.css'), ts: read('.ts') };
      });
    const needed: Record<string, string[]> = {};
    for (const id of [...ids, ...Object.keys(BAKED_PARTS)]) {
      const entry = ART[id];
      const markup = entry?.kind === 'vector' ? entry.markup + (entry.fragment ?? '') : '';
      for (const [prop, fallback] of fallbacks(markup)) {
        for (const { demo, css, ts } of sheets) {
          const set = css.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1]?.trim();
          if (set && set !== fallback?.trim() && ts.includes(`'${id}'`)) {
            needed[id] = [...new Set([...(needed[id] ?? []), demo])];
          }
        }
      }
    }
    for (const [id, demos] of Object.entries(needed)) {
      for (const demo of demos) {
        const kept = OWN_COLOURS[id]?.includes(demo) || LIVE_PARTS[id]?.includes(demo);
        expect(kept, `${id} in ${demo}`).toBe(true);
      }
    }
  });

  it('puts the picture beside the vector, so the page can show either', () => {
    const flat = figure('king-of-hearts', '', 'flat');
    expect(flat).not.toContain('<img');
    const baked = figure('king-of-hearts', 'x', 'engraved');
    expect(baked).toContain('class="art art--baked x"');
    expect(baked).toContain('<svg');
    expect(baked).toMatch(/<img class="art__image art__image--baked" data-variant="any"/);
    const alice = figure('alice/falling', '', 'engraved');
    expect(alice).toContain('data-variant="yellow"');
    expect(alice).toContain('data-variant="blue"');
    // Outside a browser the page style is flat: an SVG context gets no image.
    expect(svgFigure('white-rabbit/garden', 0, 0, 60, 80)).not.toContain('<image');
  });
});

describe('the cut-outs', () => {
  it('bakes every cut-out figure as its drawing without the parts, and each part', () => {
    expect(Object.keys(BAKED_PARTS).sort()).toEqual(Object.keys(CUT_OUTS).sort());
    for (const [id, { parts, demos }] of Object.entries(CUT_OUTS)) {
      const entry = ART[id];
      const [w, h] = entry?.kind === 'vector' ? entry.box : [0, 0];
      const baked = BAKED_PARTS[id];
      expect(Object.keys(baked?.parts ?? {}), id).toEqual([...parts]);
      for (const sources of [baked?.base, ...Object.values(baked?.parts ?? {})]) {
        for (const source of Object.values(sources ?? {})) {
          expect([source.width, source.height], id).toEqual([w * 2, h * 2]);
        }
      }
      // A cut-out figure is one whose parts that demo moves.
      for (const demo of demos) {
        expect(LIVE_PARTS[id], `${id} in ${demo}`).toContain(demo);
      }
      // Every part is in the drawing, under its class.
      for (const part of parts) {
        expect(entry?.kind === 'vector' && entry.markup, `${id} .${part}`).toContain(part);
      }
    }
  });

  it('serves cut-outs only in the engraved style, and only to the demos listed', () => {
    expect(cutOutsFor('flamingo', 'engraved', 'croquet')).toBeDefined();
    expect(cutOutsFor('flamingo', 'flat', 'croquet')).toBeUndefined();
    expect(cutOutsFor('hatter', 'engraved', 'tea-party')).toBeUndefined();
    expect(cutOutsFor('guinea-pig', 'engraved', 'bill-the-lizard')).toBeUndefined();
  });

  it("stacks the pictures in the drawing's own root, each part in its own group", () => {
    // Off its stage the flamingo is its vector; in croquet, its cut-outs.
    expect(figure('flamingo', 'y', 'engraved', 'duchess')).not.toContain('art--cut');
    const html = figure('flamingo', 'y', 'engraved', 'croquet');
    expect(html).toMatch(
      /^<span class="art art--cut y" data-art="flamingo"><svg viewBox="0 0 300 420"/,
    );
    expect(html).not.toContain('<path');
    expect(html).toMatch(
      /<g class="cq__flamingo-body"><image class="art__image" data-variant="any"/,
    );
    expect(html).toMatch(/<g class="cq__flamingo-head"><image [^>]*width="300" height="420"/);
    const cut = cutOutsFor('flamingo', 'engraved', 'croquet');
    expect(cut?.parts.map(([part]) => part)).toEqual(['cq__flamingo-body', 'cq__flamingo-head']);
    // The base shows Alice's arm and sleeve: one picture per Alice.
    expect(Object.keys(cut?.base ?? {}).sort()).toEqual(['blue', 'yellow']);
    for (const [, sources] of cut?.parts ?? []) {
      expect(Object.keys(sources)).toEqual(['any']);
    }
  });
});
