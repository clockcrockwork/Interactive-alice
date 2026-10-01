import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

test('the caterpillar: a tap blows a small ring, a held press a strong one', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'puff', 0.5);
  const button = page.locator('.ct__prop--puff');
  await expect(button).toBeVisible();
  const strength = () => customProperty(page, '.ct__smoke', '--strength');

  // A quick click: the small ring.
  await button.click();
  await expect.poll(strength, { timeout: 5000 }).toBeLessThan(0.4);
  await expect(page.locator('.ct__ring').last()).toBeAttached();

  // A press held for most of the charge: a big one.
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await expect
    .poll(() => customProperty(page, '.ct__caterpillar', '--charge'))
    .toBeGreaterThan(0.5);
  await page.mouse.up();
  await expect.poll(strength, { timeout: 5000 }).toBeGreaterThan(0.7);
  await expect
    .poll(() => customProperty(page, '.ct__caterpillar', '--charge'), {
      timeout: 5000,
    })
    .toBeLessThan(0.1);

  // The keyboard charges the same way: a held Space, with its repeats, is one press.
  await button.focus();
  await page.keyboard.down(' ');
  await page.keyboard.down(' ');
  await page.waitForTimeout(300);
  await page.keyboard.up(' ');
  await expect.poll(strength, { timeout: 5000 }).toBeGreaterThan(0.1);
  await expect.poll(strength, { timeout: 5000 }).toBeLessThan(0.5);
});
