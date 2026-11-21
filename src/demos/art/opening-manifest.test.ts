import { describe, expect, it, vi } from 'vitest';
import {
  prepareOpeningFromManifest,
  selectCompleteManifestImages,
  shouldShowOpeningPoem,
} from './opening-manifest.ts';

const pageUrl = 'https://book.example/story/demos/riverbank/index.html';
const responseUrl = 'https://book.example/story/demo-image-usage.json';

interface FixtureAsset {
  sourcePath: string;
  fileName: string;
  url: string;
  uses: string[];
  conditions: string[];
}

interface FixtureRoute {
  path: string;
  demo: string;
  status: string;
  assets: FixtureAsset[] | null;
}

interface FixtureManifest {
  schemaVersion: number;
  scope: Record<string, string>;
  coverage: {
    status: string;
    publicSceneCount: number;
    auditedSceneCount: number;
    incompleteScenes: string[];
  };
  preloadEligible: boolean;
  routes: FixtureRoute[];
}

const source = (
  path: string,
  file: string,
  conditions: string[] = ['engraved selector'],
): FixtureAsset => ({
  sourcePath: `src/assets/images/${path}`,
  fileName: `assets/${file}`,
  url: `./assets/${file}`,
  uses: ['scene art'],
  conditions,
});

const picture = (): FixtureManifest => ({
  schemaVersion: 1,
  scope: { artStyle: 'engraved', variant: 'yellow', sceneRenderSelection: 'explicit' },
  coverage: {
    status: 'complete',
    publicSceneCount: 1,
    auditedSceneCount: 1,
    incompleteScenes: [],
  },
  preloadEligible: true,
  routes: [
    {
      path: 'demos/riverbank/index.html',
      demo: 'riverbank',
      status: 'source-audited',
      assets: [
        source('figures/alice.any.generated.webp', 'alice.any.generated-AbCdEf12.webp'),
        source('scenery/highlands-phone.webp', 'highlands-phone.generated-QwErTy12.webp', [
          'picture source media=(max-width:700px)',
        ]),
        source('scenery/highlands-wide.webp', 'highlands-wide.generated-ZxCvBn12.webp', [
          'picture img default above 700px',
        ]),
      ],
    },
    {
      path: 'demos/ja/riverbank/index.html',
      demo: 'riverbank',
      status: 'source-audited',
      assets: [
        source('figures/alice.any.generated.webp', 'alice.any.generated-AbCdEf12.webp'),
        source('scenery/highlands-phone.webp', 'highlands-phone.generated-QwErTy12.webp', [
          'picture source media=(max-width:700px)',
        ]),
        source('scenery/highlands-wide.webp', 'highlands-wide.generated-ZxCvBn12.webp', [
          'picture img default above 700px',
        ]),
      ],
    },
  ],
});

const routeAssets = (manifest: FixtureManifest, routeIndex: number): FixtureAsset[] => {
  const assets = manifest.routes[routeIndex]?.assets;
  if (!assets) throw new Error(`fixture route ${routeIndex} has no assets`);
  return assets;
};

function responseFor(body: unknown, response = responseUrl): Response {
  return {
    ok: true,
    redirected: response !== responseUrl,
    url: response,
    json: async () => body,
  } as Response;
}

describe('whole-book opening manifest gate', () => {
  it('deduplicates exact source URLs and selects only the current responsive candidate', () => {
    const phone = selectCompleteManifestImages(picture(), responseUrl, pageUrl, 390);
    const wide = selectCompleteManifestImages(picture(), responseUrl, pageUrl, 1280);
    expect(phone.kind).toBe('ready');
    expect(wide.kind).toBe('ready');
    if (phone.kind !== 'ready' || wide.kind !== 'ready') return;
    expect(phone.urls).toHaveLength(2);
    expect(phone.urls).toContain(
      'https://book.example/story/assets/highlands-phone.generated-QwErTy12.webp',
    );
    expect(phone.urls.some((url) => url.includes('highlands-wide'))).toBe(false);
    expect(wide.urls).toHaveLength(2);
    expect(wide.urls.some((url) => url.includes('highlands-wide'))).toBe(true);
    expect(wide.urls.some((url) => url.includes('highlands-phone'))).toBe(false);
  });

  it('never warms an incomplete build, even when its known scene entries are populated', () => {
    const partial = picture();
    partial.coverage.status = 'partial';
    partial.coverage.publicSceneCount = 2;
    partial.coverage.auditedSceneCount = 1;
    partial.coverage.incompleteScenes = ['other-scene'];
    partial.preloadEligible = false;
    partial.routes.push({
      path: 'demos/other-scene/index.html',
      demo: 'other-scene',
      status: 'not-audited',
      assets: null,
    });
    const selected = selectCompleteManifestImages(partial, responseUrl, pageUrl, 390);
    expect(selected).toEqual({ kind: 'skip', reason: 'partial-coverage' });
  });

  it('does not call the decoder for partial coverage', async () => {
    const partial = picture();
    partial.coverage.status = 'partial';
    partial.coverage.publicSceneCount = 2;
    partial.coverage.incompleteScenes = ['other-scene'];
    partial.preloadEligible = false;
    partial.routes.push({
      path: 'demos/other-scene/index.html',
      demo: 'other-scene',
      status: 'not-audited',
      assets: null,
    });
    const decode = vi.fn(async () => new Map<string, boolean>());
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      entryReady: Promise.resolve(true),
      fetcher: vi.fn(async () => responseFor(partial)) as unknown as typeof fetch,
      decode,
    });
    expect(result).toBe('partial');
    expect(decode).not.toHaveBeenCalled();
  });

  it('reports full-ready only after every exact URL and entry readiness succeed', async () => {
    const decode = vi.fn(async (urls: string[]) => new Map(urls.map((url) => [url, true])));
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      entryReady: Promise.resolve(true),
      fetcher: vi.fn(async () => responseFor(picture())) as unknown as typeof fetch,
      decode,
    });
    expect(result).toBe('full-ready');
    expect(decode).toHaveBeenCalledTimes(1);
    expect(decode.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('rejects malformed data, unsafe schemes, duplicate route assets, and mixed hashes', () => {
    expect(selectCompleteManifestImages({}, responseUrl, pageUrl, 390).kind).toBe('invalid');
    expect(
      selectCompleteManifestImages(
        picture(),
        'https://elsewhere.example/manifest.json',
        pageUrl,
        390,
      ).kind,
    ).toBe('invalid');
    const badScheme = picture();
    const badSchemeAsset = routeAssets(badScheme, 0)[0];
    if (!badSchemeAsset) throw new Error('fixture asset is missing');
    badSchemeAsset.url = 'https://evil.example/alice.webp';
    expect(selectCompleteManifestImages(badScheme, responseUrl, pageUrl, 390).kind).toBe('invalid');

    const duplicate = picture();
    const duplicateAsset = routeAssets(duplicate, 0)[0];
    if (!duplicateAsset) throw new Error('fixture asset is missing');
    routeAssets(duplicate, 0).push({ ...duplicateAsset });
    expect(selectCompleteManifestImages(duplicate, responseUrl, pageUrl, 390).kind).toBe('invalid');

    const mixed = picture();
    const mixedAsset = routeAssets(mixed, 1)[0];
    if (!mixedAsset) throw new Error('fixture asset is missing');
    mixedAsset.fileName = 'assets/alice.any.generated-ZzYyXx12.webp';
    mixedAsset.url = './assets/alice.any.generated-ZzYyXx12.webp';
    expect(selectCompleteManifestImages(mixed, responseUrl, pageUrl, 390).kind).toBe('invalid');
  });

  it('requires an exact non-redirected, same-origin manifest response', async () => {
    const fetcher = vi.fn(async () => responseFor(picture(), 'https://book.example/moved.json'));
    const decode = vi.fn(async (urls: string[]) => new Map(urls.map((url) => [url, true])));
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      entryReady: Promise.resolve(true),
      fetcher: fetcher as unknown as typeof fetch,
      decode,
    });
    expect(result).toBe('failed');
    expect(decode).not.toHaveBeenCalled();
  });

  it('reports a manifest network failure without attempting image decodes', async () => {
    const decode = vi.fn(async () => new Map<string, boolean>());
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      entryReady: Promise.resolve(true),
      fetcher: vi.fn(async () => {
        throw new Error('offline');
      }) as unknown as typeof fetch,
      decode,
    });
    expect(result).toBe('failed');
    expect(decode).not.toHaveBeenCalled();
  });

  it('reports one image failure as failed instead of full-ready', async () => {
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      entryReady: Promise.resolve(true),
      fetcher: vi.fn(async () => responseFor(picture())) as unknown as typeof fetch,
      decode: async (urls) => new Map(urls.map((url, index) => [url, index !== 0])),
    });
    expect(result).toBe('failed');
  });

  it('does not promote a hung request after the safety timeout', async () => {
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      timeoutMs: 5,
      entryReady: Promise.resolve(true),
      fetcher: vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch,
      decode: vi.fn(async () => new Map()),
    });
    expect(result).toBe('timed-out');
  });

  it('requires the entry module to be ready and gives the poem only to first Riverbank entry', async () => {
    const result = await prepareOpeningFromManifest({
      manifestHref: '../../demo-image-usage.json',
      pageUrl,
      viewportWidth: 390,
      entryReady: Promise.resolve(false),
      fetcher: vi.fn(async () => responseFor(picture())) as unknown as typeof fetch,
      decode: async (urls) => new Map(urls.map((url) => [url, true])),
    });
    expect(result).toBe('failed');
    expect(shouldShowOpeningPoem('riverbank', false)).toBe(true);
    expect(shouldShowOpeningPoem('riverbank', true)).toBe(false);
    expect(shouldShowOpeningPoem('rabbit-hole', false)).toBe(false);
  });
});
