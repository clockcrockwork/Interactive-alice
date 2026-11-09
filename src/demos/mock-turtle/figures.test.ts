import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { schoolMarkup } from './figures.ts';

describe('Mock Turtle underwater school backdrop', () => {
  it('serves separate wide and phone engravings as noninteractive decoration', () => {
    const markup = schoolMarkup(true);
    expect(markup).toContain('<picture class="mt__engraving" aria-hidden="true">');
    expect(markup).toContain('media="(max-width: 700px)"');
    expect(markup).toContain('mock-turtle-school-phone.generated');
    expect(markup).toContain('mock-turtle-school-wide.generated');
    expect(markup).toContain('alt="" decoding="async" loading="lazy"');
  });

  it('matches both optimized files to their generation record', () => {
    const record = JSON.parse(
      readFileSync(
        new URL('../../assets/images/mock-turtle-school-provenance.json', import.meta.url),
        'utf8',
      ),
    );
    expect(record.assets).toHaveLength(2);
    for (const asset of record.assets) {
      const bytes = readFileSync(new URL(`../../assets/images/${asset.asset}`, import.meta.url));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    }
  });
});
