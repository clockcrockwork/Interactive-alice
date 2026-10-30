import { expect, type Page, test } from '@playwright/test';
import { atCue, collectErrors } from '../demo-helpers.ts';

interface Probe {
  sources: string[];
  aliceFallback: number;
}
declare global {
  interface Window {
    __swimmingProbe: Probe;
  }
}

async function probe(page: Page, variant: string, style = 'engraved') {
  await page.addInitScript(
    ({ variant, style }) => {
      localStorage.setItem('alice-demos:alice', variant);
      localStorage.setItem('alice-demos:art', style);
      window.__swimmingProbe = { sources: [], aliceFallback: 0 };
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (
        source: CanvasImageSource,
        ...coordinates: number[]
      ) {
        if (
          this.canvas.classList.contains('pt__canvas') &&
          source instanceof HTMLImageElement &&
          !source.src.includes('pool-glass-table')
        ) {
          if (!window.__swimmingProbe.sources.includes(source.src))
            window.__swimmingProbe.sources.push(source.src);
        }
        return Reflect.apply(original, this, [source, ...coordinates]);
      };
      const ellipse = CanvasRenderingContext2D.prototype.ellipse;
      CanvasRenderingContext2D.prototype.ellipse = function (...args: Parameters<typeof ellipse>) {
        if (
          this.canvas.classList.contains('pt__canvas') &&
          args[0] === 0 &&
          args[1] === -24 &&
          args[2] === 20 &&
          args[3] === 20
        )
          window.__swimmingProbe.aliceFallback += 1;
        return Reflect.apply(ellipse, this, args);
      };
    },
    { variant, style },
  );
}

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    for (const variant of ['yellow', 'blue']) {
      test(`Canvas swimmers draw and reconstruct: ${locale || 'en-simple'}, ${motion}, ${variant}`, async ({
        page,
      }) => {
        test.slow();
        const errors = collectErrors(page);
        await probe(page, variant);
        await page.emulateMedia({ reducedMotion: motion });
        await page.goto(`/demos/${locale}pool-of-tears/`);
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
        await atCue(page, 'crowd', 0.95);
        await expect.poll(() => page.evaluate(() => window.__swimmingProbe.sources.length)).toBe(8);
        const sources = await page.evaluate(() => window.__swimmingProbe.sources);
        expect(
          sources.some((source) => source.includes(`alice--swimming.${variant}.generated`)),
        ).toBe(true);
        expect(
          sources.some((source) =>
            source.includes(`alice--swimming.${variant === 'blue' ? 'yellow' : 'blue'}.generated`),
          ),
        ).toBe(false);
        await atCue(page, 'french', 0.25);
        await page.setViewportSize({ width: 390, height: 844 });
        await atCue(page, 'crowd', 0.95);
        expect(await page.evaluate(() => window.__swimmingProbe.sources)).toEqual(sources);
        expect(errors).toEqual([]);
      });
    }
  }
}

test('a failed swimming image leaves Alice procedural and does not block the rest of the scene', async ({
  page,
}) => {
  await probe(page, 'yellow');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/alice--swimming.yellow.generated*', (route) => route.abort());
  await page.goto('/demos/pool-of-tears/');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await atCue(page, 'crowd', 0.95);
  await expect.poll(() => page.evaluate(() => window.__swimmingProbe.sources.length)).toBe(7);
  expect(await page.evaluate(() => window.__swimmingProbe.aliceFallback)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

for (const style of ['flat', 'paper']) {
  test(`${style} retains the original Canvas swimmers`, async ({ page }) => {
    await probe(page, 'yellow', style);
    await page.goto('/demos/pool-of-tears/');
    await atCue(page, 'crowd', 0.95);
    expect(await page.evaluate(() => window.__swimmingProbe.sources)).toEqual([]);
    expect(await page.evaluate(() => window.__swimmingProbe.aliceFallback)).toBeGreaterThan(0);
  });
}
