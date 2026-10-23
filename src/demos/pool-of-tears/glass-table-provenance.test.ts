import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  POOL_TABLE_ANCHOR,
  POOL_TABLE_SOURCE,
  poolTableComposition,
} from './generated-glass-table.ts';

const directory = new URL('../../assets/images/', import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL('pool-glass-table-provenance.json', directory), 'utf8'),
);

describe('glass-table source and measured composition', () => {
  it('binds the shipped full-canvas asset to exact byte count, hash and source dimensions', () => {
    const url = new URL(manifest.asset.path, directory);
    const bytes = readFileSync(url);
    expect(POOL_TABLE_SOURCE.src).toBe(url.href);
    expect(bytes.length).toBe(manifest.asset.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.asset.sha256);
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
    expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
    expect(manifest.asset.dimensions).toEqual([POOL_TABLE_SOURCE.width, POOL_TABLE_SOURCE.height]);
    expect(manifest.source.dimensions).toEqual(manifest.asset.dimensions);
    expect(manifest.source.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.encoding).toMatchObject({
      quality: 92,
      method: 6,
      exact: true,
      sourceCanvasUnchanged: true,
      alphaPreservedExactly: true,
      crop: false,
      resize: false,
      repaint: false,
    });
  });

  it('matches the measured top centre and width without stretching or moving the live key', () => {
    expect(manifest.measurements.topCentreSourcePx).toEqual([
      POOL_TABLE_ANCHOR.centreX,
      POOL_TABLE_ANCHOR.topCentreY,
    ]);
    expect(manifest.measurements.topWidthSourcePx).toBe(POOL_TABLE_ANCHOR.topWidth);
    const box = poolTableComposition(1000, 0, 0);
    expect(box.width / POOL_TABLE_SOURCE.width).toBe(box.height / POOL_TABLE_SOURCE.height);
    expect(box.x + POOL_TABLE_ANCHOR.centreX * box.scale).toBe(0);
    const [keyX, keyY] = manifest.measurements.keyContactSourcePx;
    expect(box.x + keyX * box.scale).toBeCloseTo(8.8, 10);
    expect(box.y + keyY * box.scale).toBe(-29);
    expect(POOL_TABLE_ANCHOR.topWidth * box.scale).toBe(110);
    expect(manifest.measurements.centreGapAlpha).toBe(0);
    expect(manifest.measurements.topContactAlpha).toBeGreaterThan(0);
  });
});
