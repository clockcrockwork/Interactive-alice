import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStride, strideFrameForPhase } from './field.ts';

afterEach(() => vi.unstubAllGlobals());

describe('two-frame rear-facing chase sprite', () => {
  it('selects a stable first frame at rest and alternates on the established stride phase', () => {
    expect(strideFrameForPhase(0)).toBe(0);
    expect(strideFrameForPhase(Math.PI / 2)).toBe(0);
    expect(strideFrameForPhase((3 * Math.PI) / 2)).toBe(1);
    expect(strideFrameForPhase(2 * Math.PI)).toBe(0);
  });
});

describe('chase sprite handoff', () => {
  it('keeps the existing inline Alice available before the chase atlas is ready', () => {
    const css = readFileSync(new URL('./field.css', import.meta.url), 'utf8').replace(/\s+/g, ' ');
    expect(css).toContain(
      '.field__runner:has(.field__chase-sprite):not([data-chase-ready]) > .art.art--baked > svg',
    );
    expect(css).toContain(
      '.field__runner:has(.field__chase-sprite):not([data-chase-ready]) > .art.art--baked > .art__image--baked',
    );
  });

  const mount = (spriteDecode: () => Promise<void>) => {
    const dataset: Record<string, string> = {};
    const sprite = {
      isConnected: true,
      naturalWidth: 864,
      naturalHeight: 576,
      decode: vi.fn(spriteDecode),
    };
    const runner = {
      dataset: {} as Record<string, string>,
      isConnected: true,
      querySelector: (selector: string) => (selector === '.field__chase-sprite' ? sprite : null),
    };
    const alice = {
      dataset,
      style: { setProperty: vi.fn() },
      querySelector: (selector: string) => (selector === '.field__runner' ? runner : null),
    };
    vi.stubGlobal('document', {
      documentElement: { dataset: { art: 'engraved', alice: 'yellow' } },
    });
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 864;
        src = '';
        decode() {
          return Promise.resolve();
        }
      },
    );
    createStride(alice as unknown as HTMLElement, false);
    return { alice, runner, sprite };
  };

  it('keeps the vector visible until decode, then marks the CSS-owned runner atomically', async () => {
    const { alice, runner } = mount(() => Promise.resolve());
    expect(alice.dataset.chaseReady).toBeUndefined();
    expect(runner.dataset.chaseReady).toBeUndefined();
    await vi.waitFor(() => expect(runner.dataset.chaseReady).toBe(''));

    const css = readFileSync(new URL('./field.css', import.meta.url), 'utf8');
    expect(css).toContain('.field__runner[data-chase-ready] > .art');
    expect(css).toContain('.field__runner[data-chase-ready] .field__chase-sprite');
  });

  it('leaves the complete vector in place when the displayed sprite fails to decode', async () => {
    const { runner, sprite } = mount(() => Promise.reject(new Error('decode failed')));
    await vi.waitFor(() => expect(sprite.decode).toHaveBeenCalledOnce());
    await Promise.resolve();
    expect(runner.dataset.chaseReady).toBeUndefined();
  });
});
