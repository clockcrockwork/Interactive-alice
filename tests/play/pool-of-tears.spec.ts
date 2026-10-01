import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'pool-of-tears');
const LEAN = '.pt__sea';

/** Presses a lean button without moving the mouse over it, which would lean the water itself. */
const press = async (page: Parameters<typeof atCue>[0], side: 'left' | 'right') => {
  const button = page.locator(`.pt__prop--${side}`);
  await expect(button).toHaveAttribute('data-shown', '');
  await button.dispatchEvent('click');
};

for (const reduced of ['no-preference', 'reduce'] as const) {
  test.describe(`lean (${reduced})`, () => {
    test.use({ reducedMotion: reduced });

    test('Lean left tips the water left, then it levels; Lean right tips it right', async ({
      page,
    }) => {
      test.skip(!demo, 'the pool-of-tears demo is not built');
      await page.goto(demo?.url ?? '');
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await atCue(page, 'mouse');
      // The mouse rests mid-stage so the pointer's own lean is nil.
      const stage = await page.locator('.demo__stage').boundingBox();
      await page.mouse.move((stage?.x ?? 0) + (stage?.width ?? 0) / 2, (stage?.y ?? 0) + 200);
      await expect.poll(() => customProperty(page, LEAN, '--lean'), { timeout: 3000 }).toBe(0);

      await press(page, 'left');
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 2000 })
        .toBeLessThan(-3);
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 5000 })
        .toBeGreaterThan(-1);

      await press(page, 'right');
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 2000 })
        .toBeGreaterThan(3);
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 5000 })
        .toBeLessThan(1);
      // The lean never exceeds its few degrees.
      expect(Math.abs(await customProperty(page, LEAN, '--lean'))).toBeLessThanOrEqual(8);
    });
  });
}

test('the lean buttons are not offered before she is in the pool', async ({ page }) => {
  test.skip(!demo, 'the pool-of-tears demo is not built');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await atCue(page, 'giant');
  await expect(page.locator('.pt__prop--left')).not.toHaveAttribute('data-shown', '');
  await expect.poll(() => customProperty(page, LEAN, '--lean')).toBe(0);
});
