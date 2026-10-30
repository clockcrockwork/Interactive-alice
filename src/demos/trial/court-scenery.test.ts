import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scenery } from '../art/generated-scenery.ts';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('court floor scenery', () => {
  it('uses the shared decorative decoder only in engraved mode', () => {
    const markup = scenery('court-floor', 'engraved');
    expect(markup).toContain('data-generated-rig="scenery/court-floor"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('focusable="false"');
    expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(markup).toContain('court-floor.generated.webp');
    expect(scenery('court-floor', 'flat')).toBe('');
    expect(scenery('court-floor', 'paper')).toBe('');
  });
  it('keeps the floor inside the existing moving court', () => {
    expect(read('./court.ts')).toContain(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: assert the source template integration
      '<div class="tr__floor">${scenery(\'court-floor\')}</div>',
    );
    const css = read('./court.css');
    expect(css).toContain('inline-size: 360vw');
    expect(css).toContain('block-size: 24%');
    expect(css).toContain('translate3d(-50%, 0, -60px)');
    expect(css).toContain(
      '.tr__floor:has([data-generated-rig="scenery/court-floor"][data-rig-ready])::after',
    );
    expect(css).toContain('background-size: auto 100%');
    expect(css).toContain('background-repeat: repeat-x');
    expect(css).toContain('linear-gradient(to bottom, var(--tr-floor), var(--tr-floor-deep))');
  });
});

describe('court floor provenance', () => {
  it('records exact delivery and source hashes and both route increments', () => {
    const record = JSON.parse(read('../../assets/images/court-scenery-provenance.json'));
    for (const item of [record.asset, record.source]) {
      const bytes = readFileSync(new URL(`../../../${item.file}`, import.meta.url));
      expect(bytes.length).toBe(item.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256);
      expect([item.width, item.height]).toEqual([2172, 724]);
    }
    expect(record.routeBytes).toEqual({ trial: record.asset.bytes, witnesses: record.asset.bytes });
    expect(record.candidateToDeliveryAlphaExact).toBe(true);
  });
});
