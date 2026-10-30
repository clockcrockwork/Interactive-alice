import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { swimmingComposition } from './generated-swimmers.ts';
import type { Swimmer } from './sea.ts';

describe('swimming illustration provenance', () => {
  it('binds all nine unmodified cutouts to measured waterline placements and exact file hashes', () => {
    const directory = new URL('../../assets/images/', import.meta.url);
    const manifest = JSON.parse(
      readFileSync(new URL('swimming-provenance.json', directory), 'utf8'),
    ) as {
      assets: {
        id: Swimmer['kind'];
        variant: 'yellow' | 'blue' | 'any';
        asset: string;
        width: number;
        height: number;
        bytes: number;
        sha256: string;
        placement: { centreX: number; waterlineY: number; scale: number };
        alphaPreservedExactly?: boolean;
      }[];
    };
    expect(manifest.assets).toHaveLength(9);
    for (const asset of manifest.assets) {
      const composition = swimmingComposition(
        asset.id,
        'engraved',
        asset.variant === 'blue' ? 'blue' : 'yellow',
      );
      expect(composition?.source.width).toBe(asset.width);
      expect(composition?.source.height).toBe(asset.height);
      expect(composition?.source.src).toBe(new URL(asset.asset, directory).href);
      expect(composition).toMatchObject(asset.placement);
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
      if (asset.id === 'alice') expect(asset.alphaPreservedExactly).toBe(true);
    }
  });
});
