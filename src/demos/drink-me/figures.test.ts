/**
 * The bottle's label in any script: a short label is one line fitted to the
 * label, and words of full-width glyphs too long for one line are set on two,
 * broken at the space nearest the middle, rather than squeezed thin.
 */

import { describe, expect, it } from 'vitest';
import { bottleSvg, KEY_SVG, keyMarkup, labelFaceSvg, labelText } from './figures.ts';

describe("the words on the bottle's label", () => {
  it('fits a short label on one line', () => {
    const text = labelText('AB CD', 24, 17.5, 11, 38);
    expect(text).toContain('textLength="38"');
    expect(text).not.toContain('<tspan');
    expect(text).toContain('>AB CD</text>');
  });

  it('sets wide words on two lines at the middle space, smaller, never squeezed', () => {
    const wide = 'ＡＡＡＡ ＢＢＢ';
    const text = labelText(wide, 24, 17.5, 11, 38);
    expect(text).not.toContain('textLength');
    const lines = [...text.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((match) => match[1]);
    expect(lines).toEqual(['ＡＡＡＡ', 'ＢＢＢ']);
    const size = Number(/font-size="([\d.]+)"/.exec(text)?.[1]);
    expect(size).toBeLessThanOrEqual(38 / 4);
    expect(size).toBeGreaterThan(6);
  });

  it('leaves a wide label without a space on one line', () => {
    expect(labelText('ＡＡＡＡＡＡ', 24, 17.5, 11, 38)).not.toContain('<tspan');
  });
});

describe('the room key', () => {
  it('uses the engraved cutout on the original movement box and keeps its vector fallback', () => {
    const markup = keyMarkup('engraved');
    expect(markup).toContain('data-generated-rig="drink-me/key"');
    expect(markup).toContain('antique-key.any.generated.webp');
    expect(markup).toContain('data-rig-fallback=""');
    expect(markup).toContain('data-rig-image=""');
    expect(markup).toContain('viewBox="0 0 60 24"');
    expect(keyMarkup('flat')).toBe(KEY_SVG);
  });
});

describe('the paper follows the rounded bottle', () => {
  it('bows the label edges around the bottle while keeping the text legible in the centre', () => {
    const face = labelFaceSvg('DRINK ME');
    const bottle = bottleSvg('DRINK ME');
    expect(face).toContain('class="dk__label-paper" d="M2 2 Q24 5 46 2');
    expect(face).toContain('>DRINK ME</text>');
    expect(face).not.toContain('<rect x="1" y="1" width="46" height="24"');
    expect(bottle).toContain('class="dk__label-paper" d="M6 53 Q30 57 54 53');
    expect(bottle).toContain('>DRINK ME</text>');
    expect(bottle).not.toContain('<rect x="6" y="52" width="48" height="26"');
  });
});

describe('a label in a language written without spaces', () => {
  it('breaks between the words its segmenter finds, nearest the middle', () => {
    // Thai, no spaces: "hello Alice in wonderland".
    const label = 'สวัสดีอลิซในแดนมหัศจรรย์';
    const layout = { wordUnit: 'segmenter', tag: 'th', glyphWidth: 'half' } as const;
    const text = labelText(label, 24, 17.5, 11, 38, layout);
    const lines = [...text.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((match) => match[1]);
    expect(lines).toHaveLength(2);
    expect(lines.join('')).toBe(label);
    // By spaces alone there is nowhere to break, so it stays one line.
    expect(labelText(label, 24, 17.5, 11, 38)).not.toContain('<tspan');
  });
});
