import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decodeImageSources,
  decodeVerifiedImageSources,
  hydrateGeneratedRig,
  watchGeneratedRigs,
} from './generated-rig.ts';

function rigWith(sources: string[]) {
  const attributes = new Map<string, string>();
  const rig = {
    nodeType: 1,
    matches: (selector: string) => selector === 'svg[data-generated-rig]',
    querySelectorAll: () => sources.map((src) => ({ getAttribute: () => src })),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  } as unknown as SVGElement;
  return { rig, attributes };
}

afterEach(() => vi.unstubAllGlobals());

describe('generated rig atomic loading', () => {
  it('keeps the complete fallback until every layer is decoded', async () => {
    const finish: (() => void)[] = [];
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        decode() {
          return new Promise<void>((resolve) => finish.push(resolve));
        }
      },
    );
    const { rig, attributes } = rigWith(['slow-body', 'slow-arm']);
    const result = hydrateGeneratedRig(rig);
    expect(attributes.has('data-rig-ready')).toBe(false);
    finish[0]?.();
    await Promise.resolve();
    expect(attributes.has('data-rig-ready')).toBe(false);
    finish[1]?.();
    expect(await result).toBe(true);
    expect(attributes.has('data-rig-ready')).toBe(true);
    expect(attributes.has('data-rig-failed')).toBe(false);
  });

  it('leaves every generated layer hidden when one layer fails', async () => {
    vi.stubGlobal(
      'Image',
      class {
        src = '';
        naturalWidth = 100;
        decode() {
          return this.src === 'missing-hat'
            ? Promise.reject(new Error('load failed'))
            : Promise.resolve();
        }
      },
    );
    const { rig, attributes } = rigWith(['good-body', 'missing-hat']);
    expect(await hydrateGeneratedRig(rig)).toBe(false);
    expect(attributes.has('data-rig-ready')).toBe(false);
    expect(attributes.has('data-rig-failed')).toBe(true);
  });

  it('caps concurrent generated image fetches and decodes at four', async () => {
    const active: string[] = [];
    const releases: Array<() => void> = [];
    let maximum = 0;
    let completed = 0;
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        src = '';
        decode() {
          active.push(this.src);
          maximum = Math.max(maximum, active.length);
          return new Promise<void>((resolve) => {
            releases.push(() => {
              active.splice(active.indexOf(this.src), 1);
              completed += 1;
              resolve();
            });
          });
        }
      },
    );
    const { rig } = rigWith(Array.from({ length: 9 }, (_, i) => `bounded-${i}`));
    const result = hydrateGeneratedRig(rig);
    expect(active).toHaveLength(4);
    while (completed < 9) {
      if (releases.length > 0) {
        releases.splice(0).forEach((release) => {
          release();
        });
      }
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(await result).toBe(true);
    expect(maximum).toBe(4);
  });

  it('uses the same four-source queue for DOM and manifest image lists', async () => {
    const active: string[] = [];
    const releases: Array<() => void> = [];
    let maximum = 0;
    let completed = 0;
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        src = '';
        decode() {
          active.push(this.src);
          maximum = Math.max(maximum, active.length);
          return new Promise<void>((resolve) => {
            releases.push(() => {
              active.splice(active.indexOf(this.src), 1);
              completed += 1;
              resolve();
            });
          });
        }
      },
    );
    const result = decodeImageSources([
      ...Array.from({ length: 8 }, (_, i) => `scene-or-manifest-${i}`),
      'scene-or-manifest-0',
      '',
    ]);
    expect(active).toHaveLength(4);
    while (completed < 8) {
      for (const release of releases.splice(0)) {
        release();
      }
      await Promise.resolve();
      await Promise.resolve();
    }
    const decoded = await result;
    expect(decoded.size).toBe(8);
    expect(decoded.get('scene-or-manifest-0')).toBe(true);
    expect(maximum).toBe(4);
  });

  it('verifies immutable same-origin response metadata in the shared four-image queue', async () => {
    vi.stubGlobal('location', new URL('https://book.example/story/'));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        return {
          ok: true,
          redirected: false,
          url,
          headers: new Headers({
            'cache-control': 'public, max-age=31536000, immutable',
            'content-type': 'image/webp',
          }),
          blob: async () => new Blob(['image']),
        } as Response;
      }),
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:verified-image');
    const active: string[] = [];
    const releases: Array<() => void> = [];
    let maximum = 0;
    let completed = 0;
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        src = '';
        decode() {
          active.push(this.src);
          maximum = Math.max(maximum, active.length);
          return new Promise<void>((resolve) => {
            releases.push(() => {
              active.splice(active.indexOf(this.src), 1);
              completed += 1;
              resolve();
            });
          });
        }
      },
    );
    const sources = Array.from(
      { length: 9 },
      (_, index) => `https://book.example/story/assets/figure-${index}-AbCdEf12.webp`,
    );
    const controller = new AbortController();
    const result = decodeVerifiedImageSources(sources, controller.signal);
    await vi.waitFor(() => expect(active).toHaveLength(4));
    while (completed < sources.length) {
      for (const release of releases.splice(0)) release();
      await Promise.resolve();
      await Promise.resolve();
    }
    const decoded = await result;
    expect(decoded.size).toBe(9);
    expect([...decoded.values()].every(Boolean)).toBe(true);
    expect(maximum).toBe(4);
  });

  it('rejects a redirect or a response without immutable raster headers', async () => {
    vi.stubGlobal('location', new URL('https://book.example/story/'));
    let redirected = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        return {
          ok: true,
          redirected,
          url: redirected ? `${url}/redirected` : url,
          headers: new Headers({ 'content-type': 'image/webp' }),
          blob: async () => new Blob(['image']),
        } as Response;
      }),
    );
    vi.stubGlobal(
      'Image',
      class {
        decode() {
          return Promise.resolve();
        }
      },
    );
    const controller = new AbortController();
    const decoded = await decodeVerifiedImageSources(
      ['https://book.example/story/assets/figure-AbCdEf12.webp'],
      controller.signal,
    );
    expect([...decoded.values()]).toEqual([false]);
    redirected = false;
    const noImmutableHeader = await decodeVerifiedImageSources(
      ['https://book.example/story/assets/figure-no-cache-AbCdEf12.webp'],
      controller.signal,
    );
    expect([...noImmutableHeader.values()]).toEqual([false]);
  });

  it('does not reveal an empty or malformed rig', async () => {
    for (const sources of [[], ['']]) {
      const { rig, attributes } = rigWith(sources);
      expect(await hydrateGeneratedRig(rig)).toBe(false);
      expect(attributes.has('data-rig-ready')).toBe(false);
    }
  });

  it('excludes hidden raster canvases from fallback fill-box calculations', () => {
    const css = readFileSync(new URL('./generated-rig.css', import.meta.url), 'utf8');
    expect(css).toMatch(/svg\[data-generated-rig\] \[data-rig-generated\]\s*\{[^}]*display: none;/);
    expect(css).toMatch(
      /svg\[data-generated-rig\]\[data-rig-ready\] \[data-rig-generated\]\s*\{[^}]*display: inline;/,
    );
    expect(css).toMatch(
      /svg\[data-generated-rig\]\[data-rig-ready\] \[data-rig-fallback\]\s*\{[^}]*display: none;/,
    );
  });

  it('observes scene figures inserted after shell initialization and disconnects', async () => {
    const { rig, attributes } = rigWith(['late-inserted-dormouse']);
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        decode() {
          return Promise.resolve();
        }
      },
    );
    let onChange: (records: MutationRecord[]) => void = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: (records: MutationRecord[]) => void) {
          onChange = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const children: SVGElement[] = [];
    const querySelectorAll = vi.fn(() => children);
    const root = { nodeType: 1, matches: () => false, querySelectorAll } as unknown as Element;
    const stop = watchGeneratedRigs(root);
    expect(attributes.has('data-rig-ready')).toBe(false);
    onChange([{ addedNodes: [rig] } as unknown as MutationRecord]);
    await hydrateGeneratedRig(rig);
    expect(attributes.has('data-rig-ready')).toBe(true);
    expect(querySelectorAll).toHaveBeenCalledOnce();
    stop();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
