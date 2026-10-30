import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import provenance from '../../assets/images/generated-layers/gryphon-provenance.json';

describe('Gryphon source-canvas provenance', () => {
  for (const asset of provenance.assets) {
    it(`preserves the recorded ${asset.part} dimensions, alpha container and digest`, () => {
      const bytes = readFileSync(new URL(`../../../${asset.file}`, import.meta.url));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
      expect(bytes.toString('ascii', 12, 16)).toBe('VP8X');
      expect((bytes[20] ?? 0) & 0x10).toBe(0x10);
      expect(bytes.readUIntLE(24, 3) + 1).toBe(asset.width);
      expect(bytes.readUIntLE(27, 3) + 1).toBe(asset.height);
    });
  }
});
