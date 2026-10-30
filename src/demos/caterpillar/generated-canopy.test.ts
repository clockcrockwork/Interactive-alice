import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): string => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('Caterpillar canopy integration', () => {
  it('puts the replacement inside the existing moving leaf group only', () => {
    const source = read('./main.ts');
    expect(source).toContain('generatedCanopyLeaves(leaves)');
    expect(source).toContain('class="ct__leaves ct__leaves--0"');
    expect(source).toContain('viewBox="0 0 1000 1000"');
    expect(source).toContain('class="ct__nest" cx="240" cy="820"');
    expect(source).toContain('const neckPaths =');
    expect(source).toContain('leafGroup?.setAttribute(');
    const css = read('./caterpillar.css');
    expect(css).toContain('transform-origin: 50% 66%');
    expect(css).toContain('scale(calc(1 + var(--dip, 0) * 0.9))');
  });
});

describe('canopy replacement adapter', () => {
  it('keeps original leaves verbatim in flat/paper and as the engraved fallback', async () => {
    const { generatedCanopyLeaves } = await import('./generated-canopy.ts');
    const original = '<ellipse class="ct__leaf" cx="500" cy="620"/>';
    expect(generatedCanopyLeaves(original, 'flat')).toBe(original);
    expect(generatedCanopyLeaves(original, 'paper')).toBe(original);
    const markup = generatedCanopyLeaves(original, 'engraved');
    expect(markup).toContain(`<g data-rig-fallback="">${original}</g>`);
    expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(markup).toContain('data-generated-rig="scenery/caterpillar-canopy"');
    expect(markup).toContain('data-rig-image=""');
    expect(markup).toContain('viewBox="0 0 1000 1000"');
    expect(markup).toContain('overflow="visible"');
    expect(markup).toContain('x="-180" y="348" width="1360" height="777.142857"');
    expect(markup).not.toContain('ct__shoulders');
    expect(markup).not.toContain('ct__neck');
    expect(markup).not.toContain('ct__nest');
  });
});

describe('canopy source provenance', () => {
  it('records exact source and delivery hashes plus route payload', async () => {
    const { createHash } = await import('node:crypto');
    const record = JSON.parse(read('../../assets/images/caterpillar-canopy-provenance.json'));
    for (const item of [record.asset, record.source]) {
      const bytes = readFileSync(new URL(`../../../${item.file}`, import.meta.url));
      expect(bytes.length).toBe(item.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256);
      expect([item.width, item.height]).toEqual([1659, 948]);
    }
    expect(record.routeBytes.caterpillar).toBe(record.asset.bytes);
    expect(record.candidateToDeliveryAlphaExact).toBe(true);
  });
});
