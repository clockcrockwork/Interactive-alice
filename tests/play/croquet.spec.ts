/**
 * The flamingo's mood in the croquet demo: left alone it falls, a stroke
 * raises it, and the motion pause holds it.
 */

import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'croquet');
const FLAMINGO = '.cq__flamingo';

test.describe('croquet: the flamingo mood', () => {
  test.skip(!demo, 'no croquet demo page in the build');

  test('falls while the flamingo is left alone and rises when stroked', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'flamingo', 0.5);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-mood-live', '');
    const first = await customProperty(page, FLAMINGO, '--mood');
    expect(first).toBeGreaterThan(0.5);
    await page.waitForTimeout(4000);
    const later = await customProperty(page, FLAMINGO, '--mood');
    expect(later).toBeLessThan(first - 0.15);
    const stroke = page.getByRole('button', { name: 'Stroke the flamingo' });
    await expect(stroke).toBeVisible();
    await stroke.click();
    await expect
      .poll(() => customProperty(page, FLAMINGO, '--mood'), { timeout: 2000 })
      .toBeGreaterThan(later + 0.2);
  });

  test('stops falling while the motion is paused', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'flamingo', 0.5);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-mood-live', '');
    await page.locator('.demo__motion').click();
    await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
    const first = await customProperty(page, FLAMINGO, '--mood');
    await page.waitForTimeout(1500);
    const later = await customProperty(page, FLAMINGO, '--mood');
    expect(later).toBe(first);
  });

  test('is reset outside the game, and a sulk makes the strike miss', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'arches', 0.5);
    await expect(page.locator(FLAMINGO)).not.toHaveAttribute('data-mood-live', '');
    expect(await customProperty(page, FLAMINGO, '--mood')).toBe(1);
    await atCue(page, 'flamingo', 0.5);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-mood-live', '');
    // Thirteen seconds alone and it sulks; the status says so at the first miss.
    await expect
      .poll(() => page.locator(FLAMINGO).getAttribute('data-mood'), { timeout: 20_000 })
      .toBe('sulking');
    await page.getByRole('button', { name: 'Strike the hedgehog' }).first().click();
    await expect(page.locator('.demo__status')).toHaveText(/sulks/);
  });
});
