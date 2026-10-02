/**
 * The witnesses' optional play, and the join with the trial. The guinea-pig can
 * be suppressed by the reader before the officers do it; the Lizard can be put
 * the right way up before she does; the camera is a mile high at "a mile high";
 * and the last frame is the trial's first: the same high shot, Alice grown.
 */

import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

const witnesses = demos.find((candidate) => candidate.demo === 'witnesses');
const trial = demos.find((candidate) => candidate.demo === 'trial');

const hasAttribute = (page: Parameters<typeof atCue>[0], selector: string, name: string) =>
  page.evaluate(([sel, attr]) => document.querySelector(sel)?.hasAttribute(attr) ?? false, [
    selector,
    name,
  ] as const);

test('the witnesses: a cheering guinea-pig can be suppressed by hand, and the story does it anyway', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  // Just after the cheer, before the officers move: it cheers, and the button is there.
  await atCue(page, 'suppress', 0.25);
  await expect
    .poll(() => hasAttribute(page, '.wt__pig--1', 'data-cheering'), { timeout: 8000 })
    .toBe(true);
  expect(await hasAttribute(page, '.wt__pig--1', 'data-suppressed')).toBe(false);
  const hold = page.locator('.wt__prop-hold');
  await expect(hold).toBeVisible();
  await hold.click();
  await expect
    .poll(() => hasAttribute(page, '.wt__pig--1', 'data-suppressed'), { timeout: 8000 })
    .toBe(true);
  await expect(page.locator('.demo__status')).toContainText(/.+/);
  // Back before the cheer, the reader's suppression is undone; forward past the
  // beat, the story suppresses it with no help.
  await atCue(page, 'hatter', 0.5);
  await expect
    .poll(() => hasAttribute(page, '.wt__pig--1', 'data-suppressed'), { timeout: 8000 })
    .toBe(false);
  await atCue(page, 'down', 0.5);
  await expect
    .poll(() => hasAttribute(page, '.wt__pig--1', 'data-suppressed'), { timeout: 8000 })
    .toBe(true);
  await expect(hold).toBeHidden();
});

test('the witnesses: the Lizard goes in head downwards and can be put right by hand', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  await atCue(page, 'lizard', 0.2);
  await expect
    .poll(() => hasAttribute(page, '.wt__lizard', 'data-upside-down'), { timeout: 8000 })
    .toBe(true);
  const putBack = page.locator('.wt__prop-put-back');
  await expect(putBack).toBeVisible();
  await putBack.click();
  await expect
    .poll(() => hasAttribute(page, '.wt__lizard', 'data-right'), { timeout: 8000 })
    .toBe(true);
  await expect(putBack).toBeHidden();
  // The story rights him too, further into the beat, with no help.
  await page.reload();
  await atCue(page, 'lizard', 0.9);
  await expect
    .poll(() => hasAttribute(page, '.wt__lizard', 'data-right'), { timeout: 8000 })
    .toBe(true);
});

test('the witnesses: the camera is level in the court and a mile high at "a mile high"', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  await atCue(page, 'tarts', 0.9);
  await expect
    .poll(() => customProperty(page, '.tr__court', '--cam-rx'), { timeout: 8000 })
    .toBeGreaterThan(-1);
  expect(await hasAttribute(page, '.tr__court', 'data-high')).toBe(false);
  await atCue(page, 'mile', 0.95);
  await expect
    .poll(() => customProperty(page, '.tr__court', '--cam-rx'), { timeout: 8000 })
    .toBeLessThan(-20);
  expect(await customProperty(page, '.tr__court', '--cam-y')).toBeLessThan(-15);
  expect(await hasAttribute(page, '.tr__court', 'data-high')).toBe(true);
});

test('the witnesses → the trial: the last frame is the first, high over the court with Alice grown', async ({
  page,
}) => {
  test.skip(!witnesses || !trial, 'needs the witnesses and the trial');
  const aliceOpacity = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.tr__alice') as Element).opacity),
    );
  await page.goto(witnesses?.url ?? '');
  await scrollTo(page, 1);
  await expect
    .poll(() => hasAttribute(page, '.tr__court', 'data-high'), { timeout: 8000 })
    .toBe(true);
  await expect.poll(aliceOpacity, { timeout: 8000 }).toBeGreaterThan(0.9);
  const endRx = await customProperty(page, '.tr__court', '--cam-rx');
  const endY = await customProperty(page, '.tr__court', '--cam-y');
  // The letter has gone down, so nothing of the evidence is left in the frame.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.wt__sheet') as Element).opacity),
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(0.05);
  // The trial opens on the same numbers, and no doors.
  await page.goto(trial?.url ?? '');
  await expect(page.locator('.tr__court')).toHaveAttribute('data-high', '');
  await expect.poll(aliceOpacity, { timeout: 8000 }).toBeGreaterThan(0.9);
  expect(await customProperty(page, '.tr__court', '--cam-rx')).toBeCloseTo(endRx, 0);
  expect(await customProperty(page, '.tr__court', '--cam-y')).toBeCloseTo(endY, 0);
  await expect(page.locator('.tr__door-leaf')).toHaveCount(0);
});
