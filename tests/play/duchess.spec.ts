/**
 * A Moral in Everything: the ribbons of morals pile up and can be flung, the
 * Duchess is gone at her choice, and the game empties until three are left.
 */

import { expect, test } from '@playwright/test';
import { atCue, collectErrors, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'duchess');
const MORALS = '.dc__morals';
const RIBBON = '.dc__ribbon[data-shown]';

test.describe('duchess: the morals', () => {
  test.skip(!demo, 'no duchess demo page in the build');

  test('ribbons pile up from sense to seem, and the count winds back', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'sense', 0.7);
    const atSense = await customProperty(page, MORALS, '--morals');
    expect(atSense).toBeGreaterThanOrEqual(1);
    await atCue(page, 'feather', 0.7);
    const atFeather = await customProperty(page, MORALS, '--morals');
    expect(atFeather).toBeGreaterThan(atSense);
    await atCue(page, 'seem', 0.7);
    const atSeem = await customProperty(page, MORALS, '--morals');
    expect(atSeem).toBeGreaterThan(atFeather);
    await expect(page.locator(MORALS)).toHaveAttribute('data-morals', String(atSeem));
    await expect(page.locator(RIBBON)).toHaveCount(atSeem);
    // Back before the first moral: none are shown.
    await atCue(page, 'pepper', 0.5);
    await expect.poll(() => customProperty(page, MORALS, '--morals'), { timeout: 5000 }).toBe(0);
  });

  test('a ribbon can be flung by the button or by a tap, and scrolling back takes it back', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'mine', 0.8);
    const shown = await page.locator(RIBBON).count();
    expect(shown).toBeGreaterThanOrEqual(2);
    const button = page.getByRole('button', { name: 'Blow this moral away' }).first();
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('.dc__ribbon[data-flung]')).toHaveCount(1);
    await expect
      .poll(() => customProperty(page, '.dc__ribbon[data-flung]', '--fling'), { timeout: 4000 })
      .toBeGreaterThan(0.9);
    // A tap on another ribbon flings it too.
    await page.locator(`${RIBBON}:not([data-flung])`).first().click({ force: true });
    await expect(page.locator('.dc__ribbon[data-flung]')).toHaveCount(2);
    // Back before the morals, and forward again: the flings are undone.
    await atCue(page, 'glad', 0.5);
    await atCue(page, 'mine', 0.8);
    await expect(page.locator('.dc__ribbon[data-flung]')).toHaveCount(0);
  });

  test('the Duchess is gone at her choice, and only three are left at the end of the game', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const errors = collectErrors(page);
    await atCue(page, 'thunder', 0.9);
    await expect(page.locator('.dc__queen')).toHaveAttribute('data-here', '');
    await expect(page.locator('.dc__duchess')).not.toHaveAttribute('data-gone', '');
    await atCue(page, 'choice', 0.7);
    await expect(page.locator('.dc__duchess')).toHaveAttribute('data-gone', '');
    await expect(page.locator('.dc__duchess > .art')).toBeHidden();
    await atCue(page, 'left', 0.7);
    await expect(page.locator('.demo')).toHaveAttribute('data-left', '3');
    await expect(page.locator('.dc__player:not([data-far]):not([data-gone])')).toHaveCount(0);
    await expect(page.locator('.dc__arch:not([data-far]):not([data-off])')).toHaveCount(0);
    await atCue(page, 'turtle', 0.95);
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? 0), { timeout: 5000 })
      .toBeGreaterThan(0.95);
    expect(errors).toEqual([]);
  });
});
