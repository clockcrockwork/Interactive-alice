import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, normalize, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { type FigureAssetContext, figureAssetSources } from '../src/demos/art/art.ts';
import { sceneryAssetSources } from '../src/demos/art/scenery-assets.ts';
import type { DemoPageEntry } from './demos.ts';
import { type DemoId, SCENE_IMAGE_USAGE, type SceneMediaCondition } from './scene-image-usage.ts';

export interface OutputAsset {
  type: string;
  fileName: string;
  name?: string;
  source?: string | Uint8Array;
  originalFileName?: string | null;
  originalFileNames?: string[] | null;
}

interface SelectedSource {
  sourcePath: string;
  uses: string[];
  conditions: string[];
  referenceKinds: string[];
  media?: SceneMediaCondition;
  unconditional: boolean;
}

const PUBLIC_CONTEXT: FigureAssetContext = {
  demo: '',
  style: 'engraved',
  variant: 'yellow',
  render: 'html',
};

const isRasterPath = (path: string): boolean => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(path);

const normalizeOriginal = (path: string, root: string): string => {
  const decoded = path.startsWith('file:') ? fileURLToPath(path) : path;
  const absolute = isAbsolute(decoded)
    ? normalize(decoded)
    : ([resolve(root, decoded), resolve(root, 'src/generated', decoded)].find(existsSync) ??
      resolve(root, 'src/generated', decoded));
  return relative(root, absolute).split(sep).join('/');
};

const sourcePathFromUrl = (url: string, root: string): string => {
  if (url.startsWith('file:')) return normalizeOriginal(url, root);
  if (url.startsWith('/')) return normalizeOriginal(url, root);
  throw new Error(`scene image selector returned a non-local source URL: ${url}`);
};

const addSource = (
  selected: Map<string, SelectedSource>,
  sourcePath: string,
  use: string,
  condition: string,
  referenceKind: string,
  media?: SceneMediaCondition,
): void => {
  const current = selected.get(sourcePath) ?? {
    sourcePath,
    uses: [],
    conditions: [],
    referenceKinds: [],
    ...(media ? { media } : {}),
    unconditional: !media,
  };
  if (!media) {
    current.media = undefined;
    current.unconditional = true;
  } else if (
    !current.unconditional &&
    current.media &&
    (current.media.minWidth !== media.minWidth || current.media.maxWidth !== media.maxWidth)
  ) {
    throw new Error(`scene image source has conflicting responsive conditions: ${sourcePath}`);
  } else if (!current.unconditional && !current.media) current.media = media;
  if (!current.uses.includes(use)) current.uses.push(use);
  if (!current.conditions.includes(condition)) current.conditions.push(condition);
  if (!current.referenceKinds.includes(referenceKind)) current.referenceKinds.push(referenceKind);
  selected.set(sourcePath, current);
};

function selectedSceneSources(id: string, root: string): SelectedSource[] {
  const declaration = SCENE_IMAGE_USAGE[id as DemoId];
  if (declaration?.status !== 'source-audited') return [];
  const context = { ...PUBLIC_CONTEXT, demo: id };
  const selected = new Map<string, SelectedSource>();
  for (const figure of declaration.figures) {
    for (const url of figureAssetSources(figure.id, { ...context, render: figure.render })) {
      addSource(
        selected,
        sourcePathFromUrl(url, root),
        `figure:${figure.id} (${figure.use})`,
        'explicit yellow engraved renderer selection',
        `figure-${figure.render}`,
        figure.media,
      );
    }
  }
  for (const scenery of declaration.scenery) {
    for (const url of sceneryAssetSources(scenery as never, 'engraved')) {
      addSource(
        selected,
        sourcePathFromUrl(url, root),
        `scenery:${scenery}`,
        scenery === 'wildflower-highlands'
          ? url.includes('-phone.')
            ? 'picture source media=(max-width:700px)'
            : 'picture img default above 700px'
          : 'engraved scenery selector',
        scenery === 'wildflower-highlands'
          ? 'responsive-picture-source'
          : scenery === 'riverbank-sun' || scenery === 'rabbit-mound'
            ? 'scenery-img'
            : 'scenery-svg-image',
        scenery === 'wildflower-highlands'
          ? url.includes('-phone.')
            ? { maxWidth: 700 }
            : { minWidth: 701 }
          : undefined,
      );
    }
  }
  for (const direct of declaration.cssImages ?? []) {
    addSource(
      selected,
      normalizeOriginal(direct.sourcePath, root),
      direct.use,
      direct.condition,
      'css-background',
      direct.media,
    );
  }
  for (const direct of declaration.directImages) {
    addSource(
      selected,
      normalizeOriginal(direct.sourcePath, root),
      direct.use,
      direct.condition,
      'direct-dom-image',
      direct.media,
    );
  }
  return [...selected.values()].sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
}

export function emittedSourceMap(
  bundle: Record<string, OutputAsset>,
  root: string,
): Map<string, OutputAsset[]> {
  const bySource = new Map<string, OutputAsset[]>();
  for (const output of Object.values(bundle)) {
    if (output.type !== 'asset' || !isRasterPath(output.fileName) || output.source === undefined)
      continue;
    const paths = new Set(
      output.originalFileNames ?? (output.originalFileName ? [output.originalFileName] : []),
    );
    for (const path of paths) {
      const sourcePath = normalizeOriginal(path, root);
      const outputs = bySource.get(sourcePath) ?? [];
      outputs.push(output);
      bySource.set(sourcePath, outputs);
    }
  }
  return bySource;
}

const outputBytes = (source: string | Uint8Array): number =>
  typeof source === 'string' ? Buffer.byteLength(source) : source.byteLength;

export const manifestUrlFromPage = (pagePath: string): string =>
  posix.relative(posix.dirname(pagePath), 'demo-image-usage.json') || 'demo-image-usage.json';

function sceneManifest(
  bundle: Record<string, OutputAsset>,
  routes: DemoPageEntry[],
  root: string,
): object {
  const sourceMap = emittedSourceMap(bundle, root);
  const publicRoutes = routes.filter(
    (route): route is DemoPageEntry & { demo: string } =>
      (route.kind === 'entry' || route.kind === 'demo') && Boolean(route.demo),
  );
  const missing = [...new Set(publicRoutes.map((route) => route.demo))].filter(
    (id) => !Object.hasOwn(SCENE_IMAGE_USAGE, id),
  );
  if (missing.length)
    throw new Error(`public scenes missing image-usage declaration: ${missing.join(', ')}`);

  const unrepresented = Object.keys(SCENE_IMAGE_USAGE).filter(
    (id) => !publicRoutes.some((route) => route.demo === id),
  );
  if (unrepresented.length) {
    throw new Error(
      `image-usage scenes are not present in public routes: ${unrepresented.join(', ')}`,
    );
  }
  const expectedScenes = new Set(Object.keys(SCENE_IMAGE_USAGE));
  const locales = new Set(publicRoutes.map((route) => route.locale));
  const localeGaps = [...locales].flatMap((locale) => {
    const actual = new Set(
      publicRoutes.filter((route) => route.locale === locale).map((route) => route.demo),
    );
    return [...expectedScenes].filter((id) => !actual.has(id)).map((id) => `${locale}:${id}`);
  });
  if (localeGaps.length) {
    throw new Error(`public locale is missing scene image routes: ${localeGaps.join(', ')}`);
  }

  const incompleteScenes = [...new Set(publicRoutes.map((route) => route.demo))]
    .filter((id) => SCENE_IMAGE_USAGE[id as DemoId]?.status !== 'source-audited')
    .sort();
  const unresolved: string[] = [];
  const sourcesByScene = new Map<string, SelectedSource[]>();
  const routesOutput = publicRoutes.map((route) => {
    const usage = SCENE_IMAGE_USAGE[route.demo as DemoId];
    if (!usage) throw new Error(`public scene has no image-usage declaration: ${route.demo}`);
    const sources = sourcesByScene.get(route.demo) ?? selectedSceneSources(route.demo, root);
    sourcesByScene.set(route.demo, sources);
    const assets =
      usage.status === 'source-audited'
        ? sources.flatMap((source) => {
            const emitted = sourceMap.get(source.sourcePath) ?? [];
            if (emitted.length !== 1) {
              unresolved.push(
                `${route.demo} (${route.locale}): ${source.sourcePath} matched ${emitted.length} emitted image outputs`,
              );
              return [];
            }
            const output = emitted[0];
            if (!output?.source) return [];
            return [
              {
                sourcePath: source.sourcePath,
                fileName: output.fileName,
                url: `./${output.fileName}`,
                sourceBytes: statSync(join(root, source.sourcePath)).size,
                emittedBytes: outputBytes(output.source),
                uses: source.uses,
                conditions: source.conditions,
                referenceKinds: source.referenceKinds,
                ...(source.media ? { media: source.media } : {}),
              },
            ];
          })
        : null;
    return {
      path: route.path,
      publicUrl: route.url,
      manifestUrlFromPage: manifestUrlFromPage(route.path),
      demo: route.demo,
      locale: route.locale,
      alias: route.kind === 'entry',
      status: usage.status,
      confidence:
        usage.status === 'source-audited' ? 'source-path-and-render-selector' : 'not-audited',
      stylesheets: usage.stylesheets,
      assets,
      notes: usage.notes,
    };
  });
  if (unresolved.length) {
    throw new Error(
      `selected scene images did not resolve exactly through emitted originalFileNames:\n${unresolved.join('\n')}`,
    );
  }

  const sourceBytes = new Map<string, number>();
  for (const route of routesOutput) {
    if (!Array.isArray(route.assets)) continue;
    for (const asset of route.assets) {
      const typed = asset as { sourcePath: string; sourceBytes: number };
      sourceBytes.set(typed.sourcePath, typed.sourceBytes);
    }
  }
  return {
    schemaVersion: 1,
    scope: { artStyle: 'engraved', variant: 'yellow', sceneRenderSelection: 'explicit' },
    coverage: {
      status: incompleteScenes.length ? 'partial' : 'complete',
      publicSceneCount: new Set(publicRoutes.map((route) => route.demo)).size,
      auditedSceneCount:
        new Set(publicRoutes.map((route) => route.demo)).size - incompleteScenes.length,
      incompleteScenes,
    },
    preloadEligible: incompleteScenes.length === 0,
    urlBasis:
      'Resolve each asset.url with new URL(asset.url, manifestResponse.url). Manifest file is at the output base; Vite base is relative (./).',
    sourceBytes: [...sourceBytes.values()].reduce((sum, bytes) => sum + bytes, 0),
    routes: routesOutput,
    limitations: [
      'Source-audited route image manifest; build coverage and emitted-source resolution are complete for the published demo scenes.',
      'Raster references are selected through explicit figure/scenery render selectors or declared direct source paths, then joined to exact emitted originalFileNames.',
      'CSS backgrounds are declared separately from DOM figures; responsive candidates carry structured media predicates.',
      'Inline SVG, CSS gradients, procedural Canvas/WebGL, fonts and sound files are not raster image assets in this manifest.',
      'Source audit and selector correspondence are build-verified, but scene timing, first visible paint, decode retention and deployed browser cache behavior are not measured by this build artifact.',
    ],
  };
}

export const sceneImageManifestPlugin = (root: string): Plugin => ({
  name: 'alice:scene-image-usage-manifest',
  generateBundle(_options, bundle) {
    const demoManifestPath = join(root, 'src', 'generated', 'demos-manifest.json');
    const demoManifest = JSON.parse(readFileSync(demoManifestPath, 'utf8')) as {
      pages: DemoPageEntry[];
    };
    const manifest = sceneManifest(bundle as Record<string, OutputAsset>, demoManifest.pages, root);
    this.emitFile({
      type: 'asset',
      fileName: 'demo-image-usage.json',
      source: `${JSON.stringify(manifest, null, 2)}\n`,
    });
  },
});

export const sceneImageSourcesForBuild = selectedSceneSources;
