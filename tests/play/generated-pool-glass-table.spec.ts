import { expect, type Page, test } from '@playwright/test';
import { atCue, collectErrors } from '../demo-helpers.ts';

interface TableDraw {
  frame: number;
  coordinates: number[];
  alpha: number;
  key?: number[];
  operations: string[];
}
interface TableProbe {
  frame: number;
  draws: number;
  keys: number;
  last?: TableDraw;
}
declare global {
  interface Window {
    __poolTableProbe: TableProbe;
    __resolvePoolTableDecode?: () => void;
  }
}

async function probe(page: Page, style = 'engraved') {
  await page.addInitScript((art) => {
    localStorage.setItem('alice-demos:art', art);
    window.__poolTableProbe = { frame: 0, draws: 0, keys: 0 };
    const transform = CanvasRenderingContext2D.prototype.setTransform;
    CanvasRenderingContext2D.prototype.setTransform = function (...args: unknown[]) {
      if (this.canvas.classList.contains('pt__canvas')) window.__poolTableProbe.frame += 1;
      return Reflect.apply(transform, this, args);
    };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (
      source: CanvasImageSource,
      ...coordinates: number[]
    ) {
      if (
        this.canvas.classList.contains('pt__canvas') &&
        source instanceof HTMLImageElement &&
        source.src.includes('pool-glass-table')
      ) {
        const current = window.__poolTableProbe;
        current.draws += 1;
        current.last = {
          frame: current.frame,
          coordinates,
          alpha: this.globalAlpha,
          operations: ['table'],
        };
      }
      return Reflect.apply(draw, this, [source, ...coordinates]);
    };
    const ellipse = CanvasRenderingContext2D.prototype.ellipse;
    CanvasRenderingContext2D.prototype.ellipse = function (...args: Parameters<typeof ellipse>) {
      if (this.canvas.classList.contains('pt__canvas') && args[4] === 0.3) {
        const current = window.__poolTableProbe;
        current.keys += 1;
        if (current.last?.frame === current.frame) {
          current.last.key = args.slice(0, 5) as number[];
          current.last.operations.push('key');
        }
      }
      return Reflect.apply(ellipse, this, args);
    };
    const clip = CanvasRenderingContext2D.prototype.clip;
    CanvasRenderingContext2D.prototype.clip = function (...args: unknown[]) {
      const current = window.__poolTableProbe;
      if (this.canvas.classList.contains('pt__canvas') && current.last?.frame === current.frame)
        current.last.operations.push('clip');
      return Reflect.apply(clip, this, args);
    };
  }, style);
}

async function ready(page: Page) {
  await expect.poll(() => page.evaluate(() => window.__poolTableProbe.draws)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__poolTableProbe.last?.key?.length)).toBe(5);
}

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`Pool table preserves the key and reconstructs after water and resize: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await probe(page);
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto(`/demos/${locale}pool-of-tears/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await atCue(page, 'giant', 0.2);
      await ready(page);
      const first = await page.evaluate(() => window.__poolTableProbe.last);
      expect(first?.coordinates).toHaveLength(4);
      expect(first?.operations).toEqual(['table', 'key']);
      expect(first?.alpha).toBe(1);
      await atCue(page, 'tears', 0.5);
      await expect
        .poll(() => page.evaluate(() => window.__poolTableProbe.last?.operations))
        .toEqual(['table', 'key', 'clip']);
      const fading = await page.evaluate(() => window.__poolTableProbe.last?.alpha ?? 1);
      expect(fading).toBeGreaterThan(0);
      expect(fading).toBeLessThan(1);
      await atCue(page, 'crowd', 0.9);
      const hidden = await page.evaluate(() => window.__poolTableProbe.draws);
      await page.waitForTimeout(150);
      expect(await page.evaluate(() => window.__poolTableProbe.draws)).toBe(hidden);
      await atCue(page, 'giant', 0.2);
      await expect
        .poll(() => page.evaluate(() => window.__poolTableProbe.draws))
        .toBeGreaterThan(hidden);
      const restored = await page.evaluate(() => window.__poolTableProbe.last);
      expect(restored?.coordinates).toEqual(first?.coordinates);
      expect(restored?.key).toEqual(first?.key);
      await page.setViewportSize({ width: 390, height: 780 });
      await atCue(page, 'giant', 0.2);
      await expect
        .poll(() => page.evaluate(() => window.__poolTableProbe.last?.coordinates[2]))
        .not.toBe(first?.coordinates[2]);
      const resized = await page.evaluate(() => window.__poolTableProbe.last);
      const box = await page.locator('.pt__canvas').boundingBox();
      if (!resized?.key || !box) throw new Error('missing resized Canvas measurements');
      const [x = 0, y = 0, width = 0, height = 0] = resized.coordinates;
      const unit = Math.min(box.width, box.height);
      expect(width).toBeCloseTo(height, 8);
      expect(width / 1254).toBeCloseTo((unit * 0.11) / 1192, 7);
      expect(x + (627 * width) / 1254).toBeCloseTo(box.width * 0.88, 5);
      expect(y + (366 * height) / 1254).toBeCloseTo(resized.key[1] ?? 0, 8);
      expect(x + (31 * width) / 1254).toBeGreaterThanOrEqual(0);
      expect(x + (1223 * width) / 1254).toBeLessThanOrEqual(box.width);
      expect(errors).toEqual([]);
    });
  }
}

for (const style of ['flat', 'paper']) {
  test(`${style} retains the live key without fetching generated table art`, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('pool-glass-table')) requests.push(request.url());
    });
    await probe(page, style);
    await page.goto('/demos/pool-of-tears/');
    await atCue(page, 'giant', 0.3);
    await expect.poll(() => page.evaluate(() => window.__poolTableProbe.keys)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__poolTableProbe.draws)).toBe(0);
    expect(requests).toEqual([]);
  });
}

for (const failure of ['request', 'decode']) {
  test(`a table ${failure} failure retains the procedural path and scene navigation`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await probe(page);
    if (failure === 'request') {
      await page.route('**/pool-glass-table.any.generated*', (route) => route.abort());
    } else {
      await page.addInitScript(() => {
        const decode = HTMLImageElement.prototype.decode;
        HTMLImageElement.prototype.decode = function () {
          return this.src.includes('pool-glass-table')
            ? Promise.reject(new Error('table decode test'))
            : decode.call(this);
        };
      });
    }
    await page.goto('/demos/pool-of-tears/');
    await atCue(page, 'giant', 0.2);
    await expect.poll(() => page.evaluate(() => window.__poolTableProbe.keys)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__poolTableProbe.draws)).toBe(0);
    await atCue(page, 'crowd', 0.9);
    await atCue(page, 'giant', 0.2);
    expect(await page.evaluate(() => window.__poolTableProbe.draws)).toBe(0);
    expect(errors).toEqual([]);
  });
}

test('the original table and key remain while image decode is pending', async ({ page }) => {
  await probe(page);
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function () {
      if (!this.src.includes('pool-glass-table')) return decode.call(this);
      return new Promise<void>((resolve, reject) => {
        window.__resolvePoolTableDecode = () => {
          void decode.call(this).then(resolve, reject);
        };
      });
    };
  });
  await page.goto('/demos/pool-of-tears/');
  await atCue(page, 'giant', 0.2);
  await expect
    .poll(() => page.evaluate(() => typeof window.__resolvePoolTableDecode))
    .toBe('function');
  await expect.poll(() => page.evaluate(() => window.__poolTableProbe.keys)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__poolTableProbe.draws)).toBe(0);
  await page.evaluate(() => window.__resolvePoolTableDecode?.());
  await ready(page);
});
