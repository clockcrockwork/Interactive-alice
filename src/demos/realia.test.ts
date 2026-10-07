/**
 * The realia every locale gives the stages (text/locales/<locale>/realia.json) are
 * things those stages can draw and measure: a picture a locale names is one the
 * demo that reads it has drawn, and a height lands its notch where the story stands.
 * A locale whose realia name something no stage draws fails here, not on screen.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LocaleRealia } from '../types/schema.ts';
import { INCHES, notchInches, onNotch, reading, THREE } from './caterpillar/measure.ts';
import { MOON_PICTURES, moonPicture } from './cheshire-cat/figures.ts';
import { isMThing, M_PICTURES } from './dormouse/figures.ts';

const root = join(import.meta.dirname, '..', '..');
const locales = readdirSync(join(root, 'text', 'locales'));
const realiaOf = (locale: string): LocaleRealia['realia'] =>
  (
    JSON.parse(
      readFileSync(join(root, 'text', 'locales', locale, 'realia.json'), 'utf8'),
    ) as LocaleRealia
  ).realia;

describe('every locale’s realia are drawable and measurable', () => {
  it('has a realia file for every locale', () => {
    expect(locales.length).toBeGreaterThan(1);
  });

  for (const locale of locales) {
    const realia = realiaOf(locale);

    it(`${locale}: the thing the Cat hears instead of a pig is drawn in the moon`, () => {
      const heard = realia['cat-mishearing'].picture;
      expect(Object.keys(MOON_PICTURES)).toContain(heard);
      expect(moonPicture(heard, 'fig')).toBe(heard);
      expect(MOON_PICTURES[moonPicture(heard, 'fig')]).toContain('<svg');
      // Pictures only: nothing on the moon is lettering.
      expect(MOON_PICTURES[moonPicture(heard, 'fig')]).not.toContain('<text');
    });

    it(`${locale}: every thing the sisters drew is drawn, in the sentence's order`, () => {
      const things = realia['m-things'].map((thing) => thing.picture);
      expect(things.length).toBeGreaterThan(0);
      for (const thing of things) {
        expect(isMThing(thing), thing).toBe(true);
        if (isMThing(thing)) {
          expect(M_PICTURES[thing]).toContain('<svg');
          expect(M_PICTURES[thing]).not.toContain('<text');
        }
      }
    });

    it(`${locale}: the tape reads her height in the text's unit, and its notch is where she stands`, () => {
      const height = realia.height;
      // "Exactly three inches", in whatever the sentence measures it in.
      expect(notchInches(height)).toBeCloseTo(THREE, 1);
      expect(onNotch(THREE, height)).toBe(true);
      expect(reading(THREE, height)).toBeCloseTo(height.notch, 2);
      expect(onNotch(THREE + 0.1, height)).toBe(false);
    });
  }

  it('measures in inches where a page carries no measure', () => {
    expect(reading(5.1, INCHES)).toBe(5.1);
    expect(onNotch(3, INCHES)).toBe(true);
  });
});
