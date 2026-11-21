import type { Plugin } from 'vite';

interface BundleItem {
  type: string;
  fileName: string;
  name?: string;
  source?: string | Uint8Array;
  originalFileName?: string | null;
  originalFileNames?: string[] | null;
}

export interface EmittedImageAsset {
  url: string;
  fileName: string;
  sourceName: string | null;
  sourcePaths: string[];
  bytes: number;
}

export interface EmittedImageInventory {
  schemaVersion: 1;
  scope: 'production-bundle-raster-assets';
  suitableAsPreloadManifest: false;
  note: string;
  count: number;
  bytes: number;
  assets: EmittedImageAsset[];
}

/**
 * This inventory reports exact hashed raster outputs. It intentionally makes no
 * scene-usage claim: shared registries and local previews currently emit assets
 * that do not all belong in an opening preload.
 */
export function emittedImageInventory(bundle: Record<string, BundleItem>): EmittedImageInventory {
  const assets = Object.values(bundle)
    .filter(
      (output) =>
        output.type === 'asset' &&
        output.source !== undefined &&
        /\.(?:avif|gif|jpe?g|png|webp)$/i.test(output.fileName),
    )
    .map((output) => ({
      url: `./${output.fileName}`,
      fileName: output.fileName,
      sourceName: output.name ?? null,
      sourcePaths:
        output.originalFileNames ?? (output.originalFileName ? [output.originalFileName] : []),
      bytes:
        typeof output.source === 'string'
          ? Buffer.byteLength(output.source)
          : (output.source?.byteLength ?? 0),
    }))
    .sort((a, b) => a.fileName.localeCompare(b.fileName));

  return {
    schemaVersion: 1,
    scope: 'production-bundle-raster-assets',
    suitableAsPreloadManifest: false,
    note: 'Exact emitted hashed files, not a scene-use allowlist. Includes alternate and preview assets; do not preload this inventory.',
    count: assets.length,
    bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
    assets,
  };
}

export const imageInventoryPlugin: Plugin = {
  name: 'alice:emitted-image-inventory',
  generateBundle(_options, bundle) {
    const inventory = emittedImageInventory(bundle);
    this.emitFile({
      type: 'asset',
      fileName: 'demo-image-inventory.json',
      source: `${JSON.stringify(inventory, null, 2)}\n`,
    });
  },
};
