/**
 * The trial's optional play and its regressions. Dodging the pack: at the flight
 * beat, a lean away from a card's lane turns its hit into a miss, counted in
 * `--dodged` on the court; with no dodge at all the count stays at zero. Giving
 * the keepsakes to the children in the after-time. The eyes toggle that says
 * what it will do. And what the review found: the burst replaying over the
 * summer after a jump, the Queen behind Alice, a ghost on the sister's face.
 */

import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

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

const ui = (page: Parameters<typeof atCue>[0]) =>
  page.evaluate(
    () =>
      JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<string, string>,
  );

const overlaps = (
  a: { x: number; y: number; width: number; height: number } | null,
  b: { x: number; y: number; width: number; height: number } | null,
) =>
  !!a &&
  !!b &&
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

test('the trial: jumping to the end does not replay the pack over the summer', async ({ page }) => {
  test.skip(!trial, 'no trial demo in this build');
  await page.goto(trial?.url ?? '');
  // Straight from the court to the last frame, as End or the scrollbar would.
  await scrollTo(page, 1);
  await page.waitForTimeout(1200);
  expect(await page.locator('.tr__glass .tr__card').count()).toBe(0);
  // From the middle of the flight to the end: what was on the glass is gone.
  await page.goto(trial?.url ?? '');
  await atCue(page, 'rise');
  await page.waitForTimeout(600);
  await atCue(page, 'attack');
  await expect
    .poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 })
    .toBeGreaterThan(5);
  await scrollTo(page, 1);
  await expect.poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 4000 }).toBe(0);
  // And back into the flight, the pack comes at her again.
  await atCue(page, 'attack', 0.5);
  await expect
    .poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 })
    .toBeGreaterThan(5);
});

test('the trial: she is drawn from behind, and the push into the Queen goes past her', async ({
  page,
}) => {
  test.skip(!trial, 'no trial demo in this build');
  await page.goto(trial?.url ?? '');
  await expect(page.locator('.tr__alice [data-art="alice/from-behind"]')).toHaveCount(1);
  for (const cue of ['verdict', 'queen', 'head']) {
    await atCue(page, cue, 0.9);
    const queen = await page.locator('.tr__throne--queen').boundingBox();
    const alice = await page.locator('.tr__alice').boundingBox();
    expect(overlaps(queen, alice), cue).toBe(false);
  }
});

test("the trial: the dream's creatures stand clear of her sister's face", async ({ page }) => {
  test.skip(!trial, 'no trial demo in this build');
  for (const size of [
    { width: 1280, height: 760 },
    { width: 390, height: 780 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(trial?.url ?? '');
    await atCue(page, 'sounds-three', 0.95);
    await expect(page.locator('.tr__ghost[data-shown]')).toHaveCount(7, { timeout: 8000 });
    // The sister's head, in the figure's own box (300 by 200, head at 128..172, 54..98).
    const sister = await page.locator('.tr__sister').boundingBox();
    const face = sister && {
      x: sister.x + (sister.width * 128) / 300,
      y: sister.y + (sister.height * 54) / 200,
      width: (sister.width * 44) / 300,
      height: (sister.height * 44) / 200,
    };
    for (const ghost of await page.locator('.tr__ghost').all()) {
      expect(overlaps(await ghost.boundingBox(), face), `${size.width}`).toBe(false);
    }
  }
});

test('the trial: the eyes button says what a press will do, and the status what was done', async ({
  page,
}) => {
  test.skip(!trial, 'no trial demo in this build');
  await page.goto(trial?.url ?? '');
  const labels = await ui(page);
  await atCue(page, 'sounds-three', 0.95);
  const eyes = page.locator('.tr__prop-eyes');
  await expect(eyes).toHaveText(labels.demoOpenEyes ?? '');
  await expect(eyes).not.toHaveAttribute('aria-pressed', /.*/);
  await eyes.click();
  await expect(eyes).toHaveText(labels.demoCloseEyes ?? '');
  await expect(page.locator('.demo__status')).toHaveText(labels.demoOpenEyes ?? '');
  await eyes.click();
  await expect(eyes).toHaveText(labels.demoOpenEyes ?? '');
  await expect(page.locator('.demo__status')).toHaveText(labels.demoCloseEyes ?? '');
});

test('the trial: the keepsakes can be given to the children, who carry them off', async ({
  page,
}) => {
  test.skip(!trial, 'no trial demo in this build');
  await page.addInitScript(() =>
    localStorage.setItem('alice-demos:kept', JSON.stringify(['key', 'rose'])),
  );
  await page.goto(trial?.url ?? '');
  const labels = await ui(page);
  const give = page.locator('.tr__prop-give');
  const given = page.locator('.tr__keepsake[data-given]');
  await atCue(page, 'tea', 0.5);
  await expect(give).toBeHidden();
  await atCue(page, 'after', 0.8);
  await expect(page.locator('.tr__keepsake')).toHaveCount(2);
  await expect(give).toBeVisible({ timeout: 8000 });
  await give.click();
  await expect(page.locator('.demo__status')).toHaveText(labels.demoGiveChildren ?? '');
  await expect(page.locator('.tr__child[data-running]')).toHaveCount(1);
  await expect(given).toHaveCount(1, { timeout: 8000 });
  // The other by a tap on it, as pointer play.
  await page.locator('.tr__keepsake:not([data-given])').click();
  await expect(given).toHaveCount(2, { timeout: 8000 });
  await expect(give).toBeHidden();
  // Scrolling back before they came down undoes the giving.
  await atCue(page, 'tea', 0.5);
  await expect(given).toHaveCount(0, { timeout: 8000 });
  await atCue(page, 'after', 0.8);
  await expect(give).toBeVisible({ timeout: 8000 });
});

test('the trial: with nothing kept there is nothing to give', async ({ page }) => {
  test.skip(!trial, 'no trial demo in this build');
  await page.addInitScript(() => localStorage.removeItem('alice-demos:kept'));
  await page.goto(trial?.url ?? '');
  await atCue(page, 'after', 0.8);
  await expect(page.locator('.tr__prop-give')).toHaveCount(0);
  await expect(page.locator('.tr__keepsake')).toHaveCount(0);
});

test.describe('the trial under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the head of the bank is the bank, with nothing of the court on the glass', async ({
    page,
  }) => {
    test.skip(!trial, 'no trial demo in this build');
    await page.goto(trial?.url ?? '');
    const opacity = (selector: string) =>
      page.evaluate(
        (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
        selector,
      );
    await atCue(page, 'attack', 0);
    await atCue(page, 'leaves', 0);
    await expect.poll(() => opacity('.tr__bank'), { timeout: 8000 }).toBeGreaterThan(0.95);
    expect(await opacity('.tr__world')).toBeLessThan(0.05);
    // Whatever was on the glass has fallen out of the frame.
    const onScreen = () =>
      page.locator('.tr__glass .tr__card').evaluateAll(
        (cards) =>
          cards.filter((card) => {
            const box = card.getBoundingClientRect();
            return (
              box.bottom > 0 &&
              box.top < innerHeight &&
              Number(getComputedStyle(card).opacity) > 0.05
            );
          }).length,
      );
    await expect.poll(onScreen, { timeout: 4000 }).toBe(0);
  });
});
