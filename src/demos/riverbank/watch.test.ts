import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { prepareWatchImage, WATCH_BODY_SRC, WATCH_HTML } from './figures.ts';

describe('Riverbank watch image fallback', () => {
  it('keeps the old case and dial until the displayed image has decoded', async () => {
    let finishDecode!: () => void;
    const decoded = new Promise<void>((resolve) => {
      finishDecode = resolve;
    });
    const image = {
      decode: vi.fn(() => decoded),
      isConnected: true,
      naturalWidth: 1104,
      naturalHeight: 1213,
    };
    const button = {
      dataset: {} as Record<string, string>,
      querySelector: vi.fn(() => image),
    };

    expect(WATCH_HTML).toMatch(
      /<g class="rb__watch-fallback">[\s\S]*r="88"[\s\S]*r="74"[\s\S]*<\/g>/,
    );
    expect(WATCH_HTML).toContain(`src="${WATCH_BODY_SRC}"`);
    prepareWatchImage(button as unknown as HTMLButtonElement);
    expect(button.dataset.watchImageReady).toBeUndefined();
    finishDecode();
    await vi.waitFor(() => expect(button.dataset.watchImageReady).toBe(''));
  });

  it('retains the fallback after decode failure or incorrect natural dimensions', async () => {
    const failedImage = {
      decode: vi.fn(() => Promise.reject(new Error('watch image unavailable'))),
      isConnected: true,
      naturalWidth: 0,
      naturalHeight: 0,
    };
    const failedButton = {
      dataset: {} as Record<string, string>,
      querySelector: vi.fn(() => failedImage),
    };
    prepareWatchImage(failedButton as unknown as HTMLButtonElement);
    await vi.waitFor(() => expect(failedImage.decode).toHaveBeenCalledOnce());
    await Promise.resolve();
    expect(failedButton.dataset.watchImageReady).toBeUndefined();

    const wrongSizeImage = {
      decode: vi.fn(() => Promise.resolve()),
      isConnected: true,
      naturalWidth: 1103,
      naturalHeight: 1213,
    };
    const wrongSizeButton = {
      dataset: {} as Record<string, string>,
      querySelector: vi.fn(() => wrongSizeImage),
    };
    prepareWatchImage(wrongSizeButton as unknown as HTMLButtonElement);
    await Promise.resolve();
    await Promise.resolve();
    expect(wrongSizeButton.dataset.watchImageReady).toBeUndefined();
  });

  it('shows the raster and hides both fallback circles together after readiness', () => {
    const css = readFileSync(new URL('./riverbank.css', import.meta.url), 'utf8');
    expect(css).toContain('.rb__watch-body');
    expect(css).toContain('.rb__watch[data-watch-image-ready] .rb__watch-body');
    expect(css).toContain('.rb__watch[data-watch-image-ready] .rb__watch-fallback');
    expect(css).not.toMatch(/\.rb__watch-body\s*\{[^}]*display:\s*none/);
  });
});
