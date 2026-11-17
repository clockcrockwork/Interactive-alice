import { expect, test } from '@playwright/test';
import { atCue, demos } from '../demo-helpers.ts';

const scenes = [
  { demo: 'mock-turtle', cue: 'fun' },
  { demo: 'lobster-quadrille', cue: 'round' },
] as const;

for (const scene of scenes) {
  test.describe(`${scene.demo}: shared coastal sky`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('engraved clouds and gulls load in the distant sky without taking input', async ({
      page,
    }, testInfo) => {
      const demo = demos.find((entry) => entry.demo === scene.demo);
      test.skip(!demo, `the ${scene.demo} demo is not built`);
      await page.goto(demo?.url ?? '');
      await atCue(page, scene.cue, 0.5);

      for (const layer of ['.coast__clouds', '.coast__gulls']) {
        const picture = page.locator(layer);
        const image = picture.locator('img');
        await expect(image).toBeVisible();
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
          .toBeGreaterThan(0);
        await expect
          .poll(() => picture.evaluate((el) => getComputedStyle(el).opacity))
          .not.toBe('0');
        await expect
          .poll(() => picture.evaluate((el) => getComputedStyle(el).pointerEvents))
          .toBe('none');
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => getComputedStyle(img).filter))
          .toContain('grayscale(1)');
      }

      await expect(page.locator(`.demo__stage .demo-beat[data-cue="${scene.cue}"]`)).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('coastal-sky-after.png') });
    });
  });
}
