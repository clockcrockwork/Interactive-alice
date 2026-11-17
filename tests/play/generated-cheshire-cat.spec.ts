/** Browser contracts prepared for this checkpoint; execution is recorded separately. */
import { expect, test } from '@playwright/test';
import { collectErrors } from '../demo-helpers.ts';

const stages = [
  ['croquet', 'cheshire-cat/head', 5],
  ['cheshire-cat', 'cheshire-cat/on-bough', 7],
  ['pig-and-pepper', 'cheshire-cat/on-hearth', 6],
] as const;

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`generated cat layers retain gaze, wink and pause contracts: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: motion });
      await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
      for (const [scene, id, count] of stages) {
        await page.goto(`/demos/${locale}${scene}/`);
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
        const rig = page.locator(`svg[data-generated-rig="${id}"]`);
        await expect(rig).toHaveAttribute('data-rig-ready', '');
        await expect(rig.locator('[data-rig-image]')).toHaveCount(count);
        for (const part of ['ears', 'face', 'eyes', 'pupils', 'grin']) {
          await expect(rig.locator(`[data-cat="${part}"]`)).toHaveCount(1);
        }
        for (const fallback of await rig.locator('[data-rig-fallback]').all()) {
          await expect(fallback).toHaveCSS('display', 'none');
        }
        await expect(rig.locator('[data-cat-live-pupils]').locator('..')).not.toHaveCSS(
          'clip-path',
          'none',
        );

        if (scene === 'croquet') {
          await rig.locator('.cq__cat-pupils').evaluate((node) => {
            (node as SVGElement).style.setProperty('--px', '10');
            (node as SVGElement).style.setProperty('--py', '6');
          });
          await expect(rig.locator('.cq__cat-pupils')).toHaveCSS('transform', 'none');
          const translation = await rig.locator('[data-cat-live-pupils]').evaluate((node) => {
            const matrix = new DOMMatrix(getComputedStyle(node).transform);
            return [matrix.e, matrix.f];
          });
          expect(translation[0]).toBeCloseTo(5, 4);
          expect(translation[1]).toBeCloseTo(1.5, 4);
        }
        if (scene === 'cheshire-cat') {
          await expect(rig.locator('.cc__cat [data-cat="grin"]')).toHaveCount(0);
          await expect(rig.locator('.cc__cat')).toHaveAttribute('mask', 'url(#cc-mask)');
          await page.locator('.demo').evaluate((node) => node.setAttribute('data-paused', ''));
          const tail = rig.locator('.cc__tail');
          await expect(tail).toHaveCSS('transform-box', 'view-box');
          await expect(tail).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'cc-tail');
          if (motion !== 'reduce') await expect(tail).toHaveCSS('animation-play-state', 'paused');
        }
        if (scene === 'pig-and-pepper') {
          await page.locator('.demo').evaluate((node) => node.setAttribute('data-paused', ''));
          await page.locator('.pp__cat').evaluate((node) => node.setAttribute('data-wink', ''));
          const eye = rig.locator('[data-cat-eye="right"]');
          const pupil = rig.locator('[data-cat-live-pupils] ellipse').last();
          for (const target of [eye, pupil]) {
            await expect(target).toHaveCSS(
              'animation-name',
              motion === 'reduce' ? 'none' : 'pp-wink',
            );
            if (motion === 'reduce') {
              expect(
                await target.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).d),
              ).toBeCloseTo(0.08, 4);
            } else await expect(target).toHaveCSS('animation-play-state', 'paused');
          }
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const [scene, id, failedPart] of [
  ['croquet', 'cheshire-cat/head', 'head-eye-right'],
  ['cheshire-cat', 'cheshire-cat/on-bough', 'bough-tail'],
  ['pig-and-pepper', 'cheshire-cat/on-hearth', 'hearth-body'],
] as const) {
  test(`a failed cat ${failedPart} preserves every original vector part`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
    await page.route(new RegExp(`cheshire-cat~${failedPart}\\.any\\.generated.*\\.webp`), (route) =>
      route.abort(),
    );
    await page.goto(`/demos/${scene}/`);
    const rig = page.locator(`svg[data-generated-rig="${id}"]`);
    await expect(rig).toHaveAttribute('data-rig-failed', '');
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    for (const generated of await rig.locator('[data-rig-generated]').all()) {
      await expect(generated).toHaveCSS('display', 'none');
    }
    for (const fallback of await rig.locator('[data-rig-fallback]').all()) {
      await expect(fallback).not.toHaveCSS('display', 'none');
    }
  });
}

test('a late cat grin never exposes the neutral faceplate or generated pupils', async ({
  page,
}) => {
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
  await page.route(/cheshire-cat~head-grin\.any\.generated.*\.webp/, async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto('/demos/croquet/', { waitUntil: 'domcontentloaded' });
    const rig = page.locator('svg[data-generated-rig="cheshire-cat/head"]');
    await expect(rig).toHaveCount(1);
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    for (const generated of await rig.locator('[data-rig-generated]').all()) {
      await expect(generated).toHaveCSS('display', 'none');
    }
    release();
    await expect(rig).toHaveAttribute('data-rig-ready', '');
    await expect(rig.locator('[data-cat-live-pupils]').locator('../..')).toHaveCSS(
      'display',
      'inline',
    );
  } finally {
    release();
  }
});
