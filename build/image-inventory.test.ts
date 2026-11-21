import { describe, expect, it } from 'vitest';
import { emittedImageInventory } from './image-inventory.ts';

describe('production image inventory', () => {
  it('records hashed raster files and byte sizes without treating them as an allowlist', () => {
    const inventory = emittedImageInventory({
      'assets/riverbank-sun-a1b2.webp': {
        type: 'asset',
        fileName: 'assets/riverbank-sun-a1b2.webp',
        name: 'riverbank-sun.generated.webp',
        originalFileNames: ['src/assets/images/scenery/riverbank-sun.generated.webp'],
        source: new Uint8Array([1, 2, 3]),
      },
      'assets/scene-main-abcd.js': {
        type: 'chunk',
        fileName: 'assets/scene-main-abcd.js',
      },
      'assets/ornament-1234.svg': {
        type: 'asset',
        fileName: 'assets/ornament-1234.svg',
        name: 'ornament.svg',
        source: '<svg/>',
      },
    });

    expect(inventory.count).toBe(1);
    expect(inventory.bytes).toBe(3);
    expect(inventory.assets).toEqual([
      {
        url: './assets/riverbank-sun-a1b2.webp',
        fileName: 'assets/riverbank-sun-a1b2.webp',
        sourceName: 'riverbank-sun.generated.webp',
        sourcePaths: ['src/assets/images/scenery/riverbank-sun.generated.webp'],
        bytes: 3,
      },
    ]);
    expect(inventory.suitableAsPreloadManifest).toBe(false);
  });
});
