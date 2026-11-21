/** Strict, route-independent validation for the whole-book image warmup. */

export interface ManifestImage {
  sourcePath: string;
  fileName: string;
  url: string;
  uses: string[];
  conditions: string[];
  media?: { minWidth?: number; maxWidth?: number };
}

export interface CompleteManifestSelection {
  kind: 'ready';
  urls: string[];
}

export type ManifestSelection =
  | CompleteManifestSelection
  | { kind: 'skip'; reason: 'partial-coverage' }
  | { kind: 'invalid'; reason: string };

const HASHED_RASTER = /^assets\/[A-Za-z0-9._~%+-]+-[A-Za-z0-9_-]{8}\.(?:avif|gif|jpe?g|png|webp)$/i;
const ASSET_ROOT = 'src/assets/images/';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

/**
 * Validate all public routes before accepting any image list. Repeated identical
 * assets across routes/locales collapse to one exact URL; duplicate entries in a
 * single route and conflicting hashes for the same source are rejected.
 */
export function selectCompleteManifestImages(
  input: unknown,
  responseUrl: string,
  pageUrl: string,
  viewportWidth: number,
): ManifestSelection {
  if (!record(input) || input.schemaVersion !== 1 || !record(input.scope))
    return { kind: 'invalid', reason: 'unsupported manifest shape' };
  if (
    input.scope.artStyle !== 'engraved' ||
    input.scope.variant !== 'yellow' ||
    input.scope.sceneRenderSelection !== 'explicit'
  ) {
    return { kind: 'invalid', reason: 'manifest art selection does not match production defaults' };
  }

  let response: URL;
  let page: URL;
  try {
    response = new URL(responseUrl);
    page = new URL(pageUrl);
  } catch {
    return { kind: 'invalid', reason: 'invalid response or page URL' };
  }
  if (
    !['http:', 'https:'].includes(page.protocol) ||
    response.origin !== page.origin ||
    response.href !== responseUrl
  ) {
    return { kind: 'invalid', reason: 'manifest response must be an exact same-origin URL' };
  }

  if (!record(input.coverage) || !Array.isArray(input.routes))
    return { kind: 'invalid', reason: 'manifest routes or coverage are missing' };
  if (
    typeof input.coverage.publicSceneCount !== 'number' ||
    typeof input.coverage.auditedSceneCount !== 'number' ||
    !Number.isInteger(input.coverage.publicSceneCount) ||
    !Number.isInteger(input.coverage.auditedSceneCount)
  ) {
    return { kind: 'invalid', reason: 'coverage counts must be integers' };
  }
  if (!stringArray(input.coverage.incompleteScenes))
    return { kind: 'invalid', reason: 'coverage incomplete scene list is missing' };
  const publicSceneCount = input.coverage.publicSceneCount;
  const auditedSceneCount = input.coverage.auditedSceneCount;
  const incompleteScenes = input.coverage.incompleteScenes;
  const complete =
    input.coverage.status === 'complete' &&
    input.preloadEligible === true &&
    publicSceneCount > 0 &&
    publicSceneCount === auditedSceneCount &&
    incompleteScenes.length === 0;
  if (input.coverage.status === 'complete' && !complete)
    return { kind: 'invalid', reason: 'complete coverage metadata is inconsistent' };
  if (input.coverage.status === 'partial' && input.preloadEligible !== false)
    return { kind: 'invalid', reason: 'partial coverage must disable preloading' };
  if (
    input.coverage.status === 'partial' &&
    (incompleteScenes.length === 0 || publicSceneCount === auditedSceneCount)
  ) {
    return { kind: 'invalid', reason: 'partial coverage metadata has no missing scenes' };
  }
  if (!['complete', 'partial'].includes(String(input.coverage.status)))
    return { kind: 'invalid', reason: 'unknown coverage status' };
  const routes = input.routes;
  const routePaths = new Set<string>();
  const sceneIds = new Set<string>();
  const auditedSceneIds = new Set<string>();
  const sourceToFile = new Map<string, string>();
  const fileToSource = new Map<string, string>();
  const allAssets: Array<{ route: string; asset: ManifestImage }> = [];
  for (const routeValue of routes) {
    if (
      !record(routeValue) ||
      typeof routeValue.path !== 'string' ||
      typeof routeValue.demo !== 'string'
    )
      return { kind: 'invalid', reason: 'invalid route entry' };
    if (routePaths.has(routeValue.path)) return { kind: 'invalid', reason: 'duplicate route path' };
    routePaths.add(routeValue.path);
    sceneIds.add(routeValue.demo);
    if (routeValue.status === 'source-audited') auditedSceneIds.add(routeValue.demo);
    else if (routeValue.status !== 'not-audited' || routeValue.assets !== null || complete)
      return { kind: 'invalid', reason: 'coverage status does not match route image list' };
    if (routeValue.status === 'source-audited' && !Array.isArray(routeValue.assets))
      return { kind: 'invalid', reason: 'audited route is missing its image list' };
    if (routeValue.status === 'not-audited' && !Array.isArray(input.coverage.incompleteScenes))
      return { kind: 'invalid', reason: 'partial route is not listed as incomplete' };

    const routeSources = new Set<string>();
    const routeUrls = new Set<string>();
    for (const assetValue of Array.isArray(routeValue.assets) ? routeValue.assets : []) {
      if (
        !record(assetValue) ||
        typeof assetValue.sourcePath !== 'string' ||
        typeof assetValue.fileName !== 'string' ||
        typeof assetValue.url !== 'string' ||
        !stringArray(assetValue.uses) ||
        !stringArray(assetValue.conditions)
      ) {
        return { kind: 'invalid', reason: 'invalid raster asset entry' };
      }
      if (assetValue.media !== undefined) {
        const minWidth = record(assetValue.media) ? assetValue.media.minWidth : undefined;
        const maxWidth = record(assetValue.media) ? assetValue.media.maxWidth : undefined;
        if (
          !record(assetValue.media) ||
          Object.keys(assetValue.media).some((key) => key !== 'minWidth' && key !== 'maxWidth') ||
          (minWidth !== undefined &&
            (typeof minWidth !== 'number' || !Number.isInteger(minWidth) || minWidth < 0)) ||
          (maxWidth !== undefined &&
            (typeof maxWidth !== 'number' || !Number.isInteger(maxWidth) || maxWidth < 0)) ||
          (typeof minWidth === 'number' && typeof maxWidth === 'number' && minWidth > maxWidth)
        ) {
          return { kind: 'invalid', reason: 'invalid responsive raster media condition' };
        }
      }
      if (
        !assetValue.sourcePath.startsWith(ASSET_ROOT) ||
        assetValue.sourcePath.includes('..') ||
        !HASHED_RASTER.test(assetValue.fileName) ||
        assetValue.url !== `./${assetValue.fileName}`
      ) {
        return { kind: 'invalid', reason: 'asset is not a hashed production raster' };
      }
      if (routeSources.has(assetValue.sourcePath) || routeUrls.has(assetValue.url))
        return { kind: 'invalid', reason: 'duplicate asset within route' };
      routeSources.add(assetValue.sourcePath);
      routeUrls.add(assetValue.url);

      const sourceFile = sourceToFile.get(assetValue.sourcePath);
      if (sourceFile && sourceFile !== assetValue.fileName)
        return { kind: 'invalid', reason: 'same source has mixed output hashes' };
      sourceToFile.set(assetValue.sourcePath, assetValue.fileName);
      const fileSource = fileToSource.get(assetValue.fileName);
      if (fileSource && fileSource !== assetValue.sourcePath)
        return { kind: 'invalid', reason: 'output hash maps to multiple source paths' };
      fileToSource.set(assetValue.fileName, assetValue.sourcePath);
      allAssets.push({ route: routeValue.path, asset: assetValue as unknown as ManifestImage });
    }
  }
  if (
    routes.length === 0 ||
    sceneIds.size !== publicSceneCount ||
    auditedSceneCount !== auditedSceneIds.size ||
    (complete && auditedSceneIds.size !== sceneIds.size)
  ) {
    return { kind: 'invalid', reason: 'route set does not match complete coverage counts' };
  }
  const declaredIncomplete = new Set(incompleteScenes);
  const actualIncomplete = new Set([...sceneIds].filter((id) => !auditedSceneIds.has(id)));
  if (
    declaredIncomplete.size !== actualIncomplete.size ||
    [...actualIncomplete].some((id) => !declaredIncomplete.has(id))
  ) {
    return {
      kind: 'invalid',
      reason: 'coverage incomplete routes do not match route declarations',
    };
  }
  if (!complete) return { kind: 'skip', reason: 'partial-coverage' };

  const urls = new Set<string>();
  const urlSources = new Map<string, string>();
  for (const { asset } of allAssets) {
    let resolved: URL;
    try {
      resolved = new URL(asset.url, response.href);
    } catch {
      return { kind: 'invalid', reason: 'asset URL could not be resolved' };
    }
    if (resolved.origin !== page.origin || resolved.search || resolved.hash)
      return { kind: 'invalid', reason: 'asset URL must stay on the page origin' };
    const existingSource = urlSources.get(resolved.href);
    if (existingSource && existingSource !== asset.sourcePath)
      return { kind: 'invalid', reason: 'one asset URL refers to multiple source paths' };
    urlSources.set(resolved.href, asset.sourcePath);
    if (!asset.media) {
      urls.add(resolved.href);
      continue;
    }
    if (
      (asset.media.minWidth === undefined || viewportWidth >= asset.media.minWidth) &&
      (asset.media.maxWidth === undefined || viewportWidth <= asset.media.maxWidth)
    )
      urls.add(resolved.href);
  }
  return { kind: 'ready', urls: [...urls].sort() };
}

export type OpeningPreparation = 'full-ready' | 'partial' | 'failed' | 'timed-out';

export interface PrepareOpeningOptions {
  manifestHref: string;
  pageUrl: string;
  viewportWidth: number;
  entryReady: Promise<boolean>;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  decode: (urls: string[], signal: AbortSignal) => Promise<ReadonlyMap<string, boolean>>;
}

/**
 * Fetch, validate and decode a complete book manifest. Timeout is only a safety
 * exit; a race-late result can never change the returned state to full-ready.
 */
export async function prepareOpeningFromManifest(
  options: PrepareOpeningOptions,
): Promise<OpeningPreparation> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const controller = new AbortController();
  const fetcher = options.fetcher ?? fetch;
  let timer = 0;
  const work = (async (): Promise<OpeningPreparation> => {
    try {
      const requestUrl = new URL(options.manifestHref, options.pageUrl);
      const page = new URL(options.pageUrl);
      if (requestUrl.origin !== page.origin || !['http:', 'https:'].includes(page.protocol))
        return 'failed';
      const response = await fetcher(requestUrl.href, {
        credentials: 'same-origin',
        cache: 'no-cache',
        redirect: 'error',
        signal: controller.signal,
      });
      if (!response.ok || response.redirected || response.url !== requestUrl.href) return 'failed';
      const selection = selectCompleteManifestImages(
        await response.json(),
        response.url,
        options.pageUrl,
        options.viewportWidth,
      );
      if (selection.kind === 'invalid') return 'failed';
      if (selection.kind === 'skip') return 'partial';

      const [decoded, entryReady] = await Promise.all([
        options.decode(selection.urls, controller.signal),
        options.entryReady,
      ]);
      return entryReady && [...decoded.values()].every(Boolean) ? 'full-ready' : 'failed';
    } catch {
      return controller.signal.aborted ? 'timed-out' : 'failed';
    }
  })();

  const timedOut = new Promise<OpeningPreparation>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve('timed-out');
    }, timeoutMs) as unknown as number;
  });
  try {
    return await Promise.race([work, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

/** The poem belongs to Riverbank, and appears once per tab only on that entry. */
export function shouldShowOpeningPoem(demo: string, alreadySeen: boolean): boolean {
  return demo === 'riverbank' && !alreadySeen;
}
