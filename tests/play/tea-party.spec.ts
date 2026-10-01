/**
 * The tea-party's used places: the party leaves its mess at every seat it has
 * sat at, the Hatter's way round goes into a clean place, and a used place
 * tapped is sat at anyway, with a frown.
 */

import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((candidate) => candidate.demo === 'tea-party');

const label = (page: Parameters<typeof atCue>[0], key: string) =>
  page.evaluate(
    (k) =>
      (
        JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<
          string,
          string
        >
      )[k] ?? '',
    key,
  );

test('the tea-party: the places sat at stay used, and a used one tapped makes the Hatter frown', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  // The story's own round at tea-time: the party sits at seat 5, the far end used.
  await atCue(page, 'tea-time', 0.95);
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '5', { timeout: 8000 });
  await expect(page.locator('.tp__place[data-slot="5"]').first()).toHaveAttribute('data-used', '');
  await expect(page.locator('.tp__place[data-slot="4"]').first()).not.toHaveAttribute(
    'data-used',
    '',
  );
  // One *Move round*: into the clean place; the one left behind is used.
  await page.locator('.tp__prop-round').click();
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '4', { timeout: 8000 });
  await expect
    .poll(() => customProperty(page, '.tp__scene', '--round'), { timeout: 8000 })
    .toBeCloseTo(2, 1);
  await expect(page.locator('.tp__place[data-slot="5"]').first()).toHaveAttribute('data-used', '');
  await expect(page.locator('.tp__place[data-slot="4"]').first()).toHaveAttribute('data-used', '');
  // Tapping that used place: she sits there anyway, and the Hatter frowns.
  await page.locator('.tp__place[data-slot="5"]').first().dispatchEvent('click');
  await expect(page.locator('.demo__status')).toHaveText(await label(page, 'demoDirtySeat'));
  await expect(page.locator('.demo__status')).toHaveAttribute('data-shown', '');
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '5', { timeout: 8000 });
  await expect
    .poll(() => customProperty(page, '.tp__hatter', '--frown'), { timeout: 8000 })
    .toBeGreaterThan(0.5);
  // Seat 4 stays used once sat at; the Hatter's way skips it for the next clean one.
  await page.locator('.tp__prop-round').click();
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '3', { timeout: 8000 });
  await expect(page.locator('.demo__status')).toHaveText(await label(page, 'demoMoveRound'));
  // A clean place tapped is just a move: the status is the move's, not the frown's.
  await page.locator('.tp__place[data-slot="2"]').first().dispatchEvent('click');
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '2', { timeout: 8000 });
  await expect(page.locator('.demo__status')).toHaveText(await label(page, 'demoMoveRound'));
  // Scrolling back before the story's round undoes that one seat, and the
  // reader's places keep their mark: the party sits a seat further off.
  await atCue(page, 'tea-time', 0.2);
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '3', { timeout: 8000 });
  await expect(page.locator('.tp__place[data-slot="2"]').first()).toHaveAttribute('data-used', '');
  await expect(page.locator('.tp__place[data-slot="1"]').first()).not.toHaveAttribute(
    'data-used',
    '',
  );
});
