import { expect, test } from '@playwright/test';
import { atCue } from '../demo-helpers.ts';

for (const variant of ['yellow', 'blue'] as const) {
  test(`Rabbit-hole fall uses the ${variant} overhead Alice plate and keeps the tumble`, async ({
    page,
  }) => {
    await page.addInitScript((alice) => {
      localStorage.setItem('alice-demos:alice', alice);
      localStorage.setItem('alice-demos:art', 'engraved');
    }, variant);
    await page.goto('/demos/rabbit-hole/');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    const figure = page.locator('.rh__alice > .art');
    const image = figure.locator('img[data-generated-master]');
    await expect(image).toBeVisible();
    await expect(figure).toHaveAttribute('data-generated-preview', '');
    await expect(figure.locator(':scope > svg')).toHaveCSS('visibility', 'hidden');
    await expect(image).toHaveAttribute(
      'src',
      new RegExp(`alice--falling-overhead\\.${variant}\\.generated`),
    );
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1206);

    await atCue(page, 'drop', 0.55);
    const motion = await image.evaluate((el) => ({
      animation: getComputedStyle(el).animationName,
      figureRotation: getComputedStyle(el.parentElement ?? document.documentElement).rotate,
    }));
    expect(motion.animation).toBe('rh-sway');
    expect(motion.figureRotation).not.toBe('none');
  });
}

test('a failed overhead plate reveals the articulated vector fallback', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
  await page.route(/alice--falling-overhead\.yellow\.generated/, (route) => route.abort());
  await page.goto('/demos/rabbit-hole/');
  const figure = page.locator('.rh__alice > .art');
  await expect(figure.locator('img[data-generated-master]')).toBeHidden();
  await expect(figure).not.toHaveAttribute('data-generated-preview', '');
  await expect(figure.locator(':scope > svg')).toBeVisible();
});

test('the explicit comparison can restore the original articulated figure', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
  await page.goto('/demos/rabbit-hole/?artPreview=overhead');
  const figure = page.locator('.rh__alice > .art');
  await page.locator('.rh__preview-controls summary').click();
  const toggle = page.locator('[data-generated-toggle]');
  await expect(toggle).toBeVisible();
  await toggle.uncheck();
  await expect(figure.locator('img[data-generated-master]')).toBeHidden();
  await expect(figure.locator(':scope > svg')).toBeVisible();
});
