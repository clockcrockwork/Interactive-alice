import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { figureAssetSources } from '../src/demos/art/art.ts';
import { DEMO_ORDER } from './demos.ts';
import {
  emittedSourceMap,
  manifestUrlFromPage,
  sceneImageSourcesForBuild,
} from './scene-image-manifest.ts';
import { SCENE_IMAGE_USAGE } from './scene-image-usage.ts';

describe('complete scene image manifest contract', () => {
  it('declares and source-audits every published scene before preload eligibility', () => {
    expect(Object.keys(SCENE_IMAGE_USAGE).sort()).toEqual([...DEMO_ORDER].sort());
    const audited = Object.entries(SCENE_IMAGE_USAGE)
      .filter(([, usage]) => usage.status === 'source-audited')
      .map(([id]) => id)
      .sort();
    expect(audited).toEqual([...DEMO_ORDER].sort());
    expect(
      Object.values(SCENE_IMAGE_USAGE).some((usage) => usage.status !== 'source-audited'),
    ).toBe(false);
    for (const id of DEMO_ORDER) {
      expect(
        sceneImageSourcesForBuild(id, process.cwd()).length,
        `${id} needs declared raster coverage`,
      ).toBeGreaterThan(0);
    }
  });

  it('resolves all scene selectors to existing exact source files', () => {
    const root = process.cwd();
    for (const id of DEMO_ORDER) {
      for (const selected of sceneImageSourcesForBuild(id, root)) {
        expect(existsSync(join(root, selected.sourcePath)), `${id}: ${selected.sourcePath}`).toBe(
          true,
        );
        expect(selected.referenceKinds.length, `${id}: ${selected.sourcePath}`).toBeGreaterThan(0);
      }
    }
  });

  it('selects explicit yellow sources through the same HTML and SVG renderers', () => {
    for (const render of ['html', 'svg'] as const) {
      const sources = figureAssetSources('alice/standing', {
        demo: 'riverbank',
        style: 'engraved',
        variant: 'yellow',
        render,
      });
      expect(sources).toHaveLength(1);
      expect(sources[0]).toContain('alice--standing.yellow');
    }
  });

  it('joins emitted images by exact original path rather than basename', () => {
    const mapped = emittedSourceMap(
      {
        first: {
          type: 'asset',
          fileName: 'assets/first-hash.webp',
          name: 'texture.webp',
          originalFileNames: ['/repo/src/a/texture.webp'],
          source: new Uint8Array([1]),
        },
        second: {
          type: 'asset',
          fileName: 'assets/second-hash.webp',
          name: 'texture.webp',
          originalFileNames: ['/repo/src/b/texture.webp'],
          source: new Uint8Array([2]),
        },
      },
      '/repo',
    );
    expect(mapped.get('src/a/texture.webp')?.map((asset) => asset.fileName)).toEqual([
      'assets/first-hash.webp',
    ]);
    expect(mapped.get('src/b/texture.webp')?.map((asset) => asset.fileName)).toEqual([
      'assets/second-hash.webp',
    ]);
    expect(mapped.has('src/c/texture.webp')).toBe(false);
  });

  it('keeps shared-field CSS and direct dynamic plates scoped to scenes that render them', () => {
    const root = process.cwd();
    const riverbank = sceneImageSourcesForBuild('riverbank', root);
    const rabbitHole = sceneImageSourcesForBuild('rabbit-hole', root);
    const cheshire = sceneImageSourcesForBuild('cheshire-cat', root);
    const paths = (sources: typeof riverbank) => sources.map((source) => source.sourcePath);
    const riverbankPaths = paths(riverbank);
    const rabbitHolePaths = paths(rabbitHole);
    const cheshirePaths = paths(cheshire);
    expect(riverbankPaths).toContain(
      'src/assets/images/figures/alice--chase-stride.yellow.generated.webp',
    );
    expect(rabbitHolePaths).toContain(
      'src/assets/images/figures/alice--chase-stride.yellow.generated.webp',
    );
    expect(rabbitHolePaths).toContain(
      'src/assets/images/generated-preview/alice--falling-overhead.yellow.generated.webp',
    );
    expect(
      riverbank.find((source) => source.sourcePath.endsWith('/field-hedge.generated.webp'))
        ?.referenceKinds,
    ).toEqual(expect.arrayContaining(['scenery-svg-image', 'css-background']));
    expect(cheshirePaths).not.toContain('src/assets/images/scenery/field-hedge.generated.webp');
    expect(cheshirePaths).toContain('src/assets/images/scenery/night-wood.generated.webp');
    expect(rabbitHolePaths.some((path) => path.includes('.blue.'))).toBe(false);
    expect(
      rabbitHolePaths.some(
        (path) =>
          path.includes('generated-preview/') &&
          !path.endsWith('alice--falling-overhead.yellow.generated.webp'),
      ),
    ).toBe(false);
  });

  it('records the width predicates for responsive scene images and optional figures', () => {
    const root = process.cwd();
    const caucus = sceneImageSourcesForBuild('caucus-race', root).find((source) =>
      source.sourcePath.includes('wildflower-highlands-phone'),
    );
    const poolPhone = sceneImageSourcesForBuild('pool-of-tears', root).find((source) =>
      source.sourcePath.includes('pool-underwater-phone'),
    );
    const mockTurtle = sceneImageSourcesForBuild('mock-turtle', root).find((source) =>
      source.sourcePath.endsWith('dancer--whiting.any.generated.webp'),
    );
    expect(caucus?.media).toEqual({ maxWidth: 700 });
    expect(poolPhone?.media).toEqual({ maxWidth: 700 });
    expect(mockTurtle?.media).toEqual({ minWidth: 701 });
  });

  it('resolves manifest and hashed asset URLs from response URLs under subdirectory hosting', () => {
    const pageUrl = new URL('https://example.test/alice/demos/ja/rabbit-hole/index.html');
    const manifestUrl = new URL(manifestUrlFromPage('demos/ja/rabbit-hole/index.html'), pageUrl);
    expect(manifestUrl.href).toBe('https://example.test/alice/demo-image-usage.json');
    const assetUrl = new URL('./assets/rabbit-hole-a1b2.webp', manifestUrl);
    expect(assetUrl.href).toBe('https://example.test/alice/assets/rabbit-hole-a1b2.webp');
  });
});
