/**
 * Steering by tilting is on only once the phone sends a reading; a phone that
 * grants permission and then sends nothing (or only nulls) leaves steering with the
 * pointer and says so (docs/concept-demos.md §3, Tilt). The tilt control is offered
 * on a coarse pointer only, so this runs on the phone project.
 */

import { expect, type Page, test } from '@playwright/test';
import { demos } from './demo-helpers.ts';

const demo = demos.find((candidate) => candidate.demo === 'cheshire-cat');

const uiOf = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<string, string>,
  );
const pointerOf = (page: Page) => page.evaluate(() => window.__aliceDemo?.pointer());

test.describe('steering by tilting', () => {
  test.skip(!demo, 'no Cheshire Cat demo in this build');

  test.beforeEach(async ({ page }) => {
    // A browser that asks permission, and the reader grants it.
    await page.addInitScript(() => {
      (
        DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
      ).requestPermission = () => Promise.resolve('granted');
    });
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    test.skip(
      (await page.locator('.demo__tilt').count()) === 0,
      'tilt is offered on a coarse pointer only',
    );
  });

  test('granted, but no reading comes: steering stays with the pointer, and the reader is told', async ({
    page,
  }) => {
    const ui = await uiOf(page);
    await page.locator('.demo__tilt').click();
    // Only nulls, as a device without the sensor sends.
    await page.evaluate(() =>
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {})),
    );
    expect((await pointerOf(page))?.tilt).toBe(false);
    await expect(page.locator('.demo__status')).toHaveText(ui.demoTiltNone ?? '-', {
      timeout: 4000,
    });
    await expect(page.locator('.demo__tilt')).toHaveCount(0);
    expect((await pointerOf(page))?.tilt).toBe(false);
    // A reading that comes too late changes nothing: the listener is gone.
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 20 }),
      ),
    );
    expect((await pointerOf(page))?.tilt).toBe(false);
  });

  test('a first reading turns it on, mapped to the screen', async ({ page }) => {
    const ui = await uiOf(page);
    await page.locator('.demo__tilt').click();
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 12.5 }),
      ),
    );
    await expect(page.locator('.demo__status')).toHaveText(ui.demoTiltOn ?? '-');
    const steer = await pointerOf(page);
    expect(steer?.tilt).toBe(true);
    expect(steer?.x).toBeCloseTo(0.5);
    expect(steer?.y).toBeCloseTo(0);
    // It is not taken back after the wait.
    await page.waitForTimeout(1500);
    expect((await pointerOf(page))?.tilt).toBe(true);
    await expect(page.locator('.demo__status')).toHaveText(ui.demoTiltOn ?? '-');
  });
});
