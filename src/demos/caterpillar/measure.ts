/**
 * Her height, and the measure the page's language gives it in. The demo thinks in
 * inches, the book's unit; the tape reads in the unit the locale's text uses (its
 * realia `height`: three inches in English, one finger in Japanese), so the reading
 * on the tape is the number the sentence says. Nothing here knows a language.
 */

import type { Realia } from '../shell/shell.ts';

/** Her height on the mushroom, in inches: the height the text calls exactly hers. */
export const THREE = 3;

export type HeightMeasure = Realia['height'];

/** The book's own measure, for a page that carries none. */
export const INCHES: HeightMeasure = { unit: 'inch', perInch: 1, notch: THREE };

/** A height in inches, read in the measure's unit. */
export const reading = (inches: number, measure: HeightMeasure): number => inches * measure.perInch;

/** Where the measure's notch sits, in inches. */
export const notchInches = (measure: HeightMeasure): number => measure.notch / measure.perInch;

/** Whether a height in inches stands on the measure's notch. */
export const onNotch = (inches: number, measure: HeightMeasure): boolean =>
  Math.abs(inches - notchInches(measure)) < 0.01;
