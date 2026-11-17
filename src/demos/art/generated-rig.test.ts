import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hydrateGeneratedRig, watchGeneratedRigs } from './generated-rig.ts';

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
