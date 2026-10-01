/**
 * The trial's optional play: dodging the pack. At the flight beat, a lean away
 * from a card's lane turns its hit into a miss, counted in `--dodged` on the
 * court; with no dodge at all the count stays at zero.
 */

import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const trial = demos.find((candidate) => candidate.demo === 'trial');

test('the trial: pressing Dodge left while the cards fly makes some of them miss', async ({
  page,
}) => {
  test.skip(!trial, 'no trial demo in this build');
  test.slow();
  await page.goto(trial?.url ?? '');
  await atCue(page, 'rise');
  await page.waitForTimeout(600);
  await atCue(page, 'attack');
  const left = page.locator('.tr__prop-dodge--left');
  await expect(left).toBeVisible();
  // The lean lasts about a second; keep pressing through the flight.
  for (let i = 0; i < 6; i += 1) {
    await left.click();
    await page.waitForTimeout(500);
  }
  await expect
    .poll(() => customProperty(page, '.tr__court', '--dodged'), { timeout: 8000 })
    .toBeGreaterThanOrEqual(1);
  // The ones that still hit are on the glass, and Beat them off still clears them.
  await expect
    .poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 })
    .toBeGreaterThan(0);
  await atCue(page, 'beat');
  await page.locator('.tr__prop-beat').click();
  await expect.poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 }).toBe(0);
});

test('the trial: without any dodge, no card misses', async ({ page }) => {
  test.skip(!trial, 'no trial demo in this build');
  test.slow();
  await page.goto(trial?.url ?? '');
  await atCue(page, 'rise');
  await page.waitForTimeout(600);
  await atCue(page, 'attack');
  await expect
    .poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 })
    .toBeGreaterThan(5);
  // Let the whole flight land before reading the count.
  await page.waitForTimeout(5000);
  expect(await customProperty(page, '.tr__court', '--dodged')).toBe(0);
});
