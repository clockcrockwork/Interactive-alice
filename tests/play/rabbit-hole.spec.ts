import { expect, test } from '@playwright/test';
import { atCue, demos, scrollTo } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'rabbit-hole');

test.describe('the rabbit hole: looking at a map', () => {
  test.skip(!demo, 'no rabbit-hole page in the manifest');

  // The well is WebGL; on a software renderer under load its frames are slow.
  test.slow();

  const isOpen = (page: import('@playwright/test').Page) =>
    page.evaluate(() => document.querySelector('.rh__map')?.hasAttribute('data-open') ?? false);

  test('the button brings the map close, Look away puts it back, and the end never holds it', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await expect(page.locator('.rh__map')).toHaveCount(1);
    await expect(page.locator('.rh__map')).not.toHaveAttribute('data-open', '');

    // Before the map beats the buttons are not offered.
    await atCue(page, 'drop', 0.5);
    await expect(page.locator('.rh__prop-map')).not.toHaveAttribute('data-shown', '');

    await atCue(page, 'jar', 0.5);
    const look = page.locator('.rh__prop-map');
    await expect(look).toHaveAttribute('data-shown', '', { timeout: 20_000 });
    await look.click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    await expect(page.locator('.rh__prop-away')).toHaveAttribute('data-shown', '');
    await expect(look).not.toHaveAttribute('data-shown', '');
    await expect
      .poll(() => page.locator('.rh__map-sheet').evaluate((el) => getComputedStyle(el).opacity), {
        timeout: 20_000,
      })
      .toBe('1');

    await page.locator('.rh__prop-away').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
    await expect(look).toHaveAttribute('data-shown', '');

    // Opened again and scrolled past: the timeline closes it and the end never holds it.
    await look.click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    await atCue(page, 'flip', 0.5);
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
    await expect(page.locator('.rh__prop-away')).not.toHaveAttribute('data-shown', '');
    await scrollTo(page, 1);
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? -1), { timeout: 20_000 })
      .toBeGreaterThan(0.99);
    expect(await isOpen(page)).toBe(false);
    await expect(page.locator('.rh__prop-map')).not.toHaveAttribute('data-shown', '');
  });

  test('scrolling back above the map beats puts the map back on the wall', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'jar', 0.5);
    await expect(page.locator('.rh__prop-map')).toHaveAttribute('data-shown', '', {
      timeout: 20_000,
    });
    await page.locator('.rh__prop-map').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    await atCue(page, 'drop', 0.3);
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
  });

  test('under reduced motion the map fades in place and closes the same way', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'jar', 0.5);
    await expect(page.locator('.rh__prop-map')).toHaveAttribute('data-shown', '', {
      timeout: 20_000,
    });
    await page.locator('.rh__prop-map').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    expect(
      await page.locator('.rh__map-sheet').evaluate((el) => getComputedStyle(el).transform),
    ).toBe('none');
    await page.locator('.rh__map-sheet').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
  });
});
