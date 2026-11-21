import { expect, test } from '@playwright/test';
import { atCue } from '../demo-helpers.ts';

test('ordinary yellow engraved fall uses the production overhead plate without preview markers', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('alice-demos:alice', 'yellow');
    localStorage.setItem('alice-demos:art', 'engraved');
  });
  await page.goto('/demos/rabbit-hole/');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  const alice = page.locator('.rh__alice');
  const figure = alice.locator(':scope > .art');
  await expect(page.locator('[data-generated-master]')).toHaveCount(0);
  await atCue(page, 'drop', 0.55);
  const image = figure.locator('img[data-production-master]');
  await expect(image).toBeVisible();
  await expect(alice).toHaveAttribute('data-falling-raster', '');
  await expect(figure.locator(':scope > svg')).toHaveCSS('visibility', 'hidden');
  await expect(image).toHaveAttribute('src', /alice--falling-overhead\.yellow\.generated/);
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1206);
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalHeight)).toBe(1304);
  const rotation = await alice.evaluate((el) => getComputedStyle(el).transform);
  expect(rotation).not.toBe('none');

  // The jar and upside-down curtsey keep their original moving vector figure.
  await atCue(page, 'jar', 0.1);
  await expect(alice).not.toHaveAttribute('data-falling-raster', '');
  await expect(figure.locator(':scope > svg')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('[data-jar]')).toBeAttached();
});

test('blue variant and reduced motion keep the articulated vector in production', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('alice-demos:alice', 'blue');
    localStorage.setItem('alice-demos:art', 'engraved');
  });
  await page.goto('/demos/rabbit-hole/');
  await atCue(page, 'drop', 0.55);
  await expect(page.locator('.rh__alice[data-falling-raster]')).toHaveCount(0);
  await expect(page.locator('.rh__alice [data-production-master]')).toHaveCount(0);

  await page.evaluate(() => localStorage.setItem('alice-demos:alice', 'yellow'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await atCue(page, 'drop', 0.55);
  await expect(page.locator('.rh__alice [data-production-master]')).toHaveCount(0);
});

test('a failed production plate keeps the ordinary falling vector visible', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
  await page.route(/alice--falling-overhead\.yellow\.generated/, (route) => route.abort());
  await page.goto('/demos/rabbit-hole/');
  await atCue(page, 'drop', 0.55);
  const alice = page.locator('.rh__alice');
  const figure = alice.locator(':scope > .art');
  await expect(alice).not.toHaveAttribute('data-falling-raster', '');
  await expect(figure.locator(':scope > svg')).toHaveCSS('visibility', 'visible');
});

test('the opt-in local comparison is separate from production fall selection', async ({ page }) => {
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
