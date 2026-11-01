import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { ART } from './registry.ts';

describe('engraved Dinah', () => {
  it('uses the seated cutout in the pool memory and retains the original figure box', () => {
    const markup = figure('dinah-cat', '', 'engraved', 'pool-of-tears');
    expect(markup).toContain('dinah-cat.any.generated.webp');
    expect(markup).toContain('viewBox="0 0 120 100"');
    const entry = ART['dinah-cat'];
    expect(entry?.kind).toBe('vector');
    if (entry?.kind !== 'vector') return;
    expect(entry.box).toEqual([120, 100]);
    expect(entry.generated?.any).toMatchObject({ width: 480, height: 400, footY: 394 });
  });

  it('keeps the distinct pouncing moment as the existing right-facing figure', () => {
    const markup = figure('dinah-cat/pouncing', '', 'flat', 'mouse-tale');
    expect(markup).toContain('viewBox="0 0 160 80"');
    expect(markup).not.toContain('dinah-cat.any.generated.webp');
  });
});
