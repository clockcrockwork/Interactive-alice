/**
 * The bottle's label in any script: a short label is one line fitted to the
 * label, and words of full-width glyphs too long for one line are set on two,
 * broken at the space nearest the middle, rather than squeezed thin.
 */

import { describe, expect, it } from 'vitest';
import { labelText } from './figures.ts';

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
