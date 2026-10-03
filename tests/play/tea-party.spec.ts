/**
 * The tea-party's play: the used places (the party leaves its mess at every
 * seat it has sat at, the Hatter's way round goes into a clean place, a used
 * place tapped is sat at anyway, with a frown, and *Move round* with nothing
 * clean left comes to the beginning again); the status says what happened in
 * the page's own words; the riddle can be answered and never matches; the song
 * can be sung along to; and the fixes the review asked for.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

const demo = demos.find((candidate) => candidate.demo === 'tea-party');

const label = (page: Page, key: string) =>
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

/** A speaker's sentence in a beat, as the page carries it. */
const lineOf = (page: Page, cue: string, speaker: string, last = false) =>
  page.evaluate(
    ([c, s, l]) => {
      const beat = document.querySelector(`.demo-beat[data-cue="${c}"]`);
      const lines = [...(beat?.querySelectorAll<HTMLElement>('.line') ?? [])].filter(
        (line) => line.dataset.speaker === s,
      );
      return ((l ? lines.at(-1) : lines[0])?.textContent ?? '').trim();
    },
    [cue, speaker, last] as const,
  );

const status = (page: Page) => page.locator('.demo__status');

test('the tea-party: the places sat at stay used, and a used one tapped makes the Hatter frown', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  const moved = await lineOf(page, 'tea-time', 'hatter', true);
  expect(moved).not.toBe('');
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
  await expect(status(page)).toHaveText(await label(page, 'demoDirtySeat'));
  await expect(status(page)).toHaveAttribute('data-shown', '');
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '5', { timeout: 8000 });
  await expect
    .poll(() => customProperty(page, '.tp__hatter', '--frown'), { timeout: 8000 })
    .toBeGreaterThan(0.5);
  // Seat 4 stays used once sat at; the Hatter's way skips it for the next clean
  // one, and the status says so in his own words, not the button's.
  await page.locator('.tp__prop-round').click();
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '3', { timeout: 8000 });
  await expect(status(page)).toHaveText(moved);
  // A clean place tapped is just a move: the status is the move's, not the frown's.
  await page.locator('.tp__place[data-slot="2"]').first().dispatchEvent('click');
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '2', { timeout: 8000 });
  await expect(status(page)).toHaveText(moved);
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

test('the tea-party: with nothing clean left, Move round comes to the beginning again, from the keyboard too', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'tea-time', 0.95);
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '5', { timeout: 8000 });
  const round = page.locator('.tp__prop-round');
  // Four presses take the party down the clean places to the last before Alice.
  for (const seat of ['4', '3', '2', '1']) {
    await round.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', seat, {
      timeout: 8000,
    });
  }
  // The next: back to the beginning, a used place, and the Hatter frowns.
  await round.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.tp__world')).toHaveAttribute('data-seat', '6', { timeout: 8000 });
  await expect(status(page)).toHaveText(await label(page, 'demoDirtySeat'));
  await expect
    .poll(() => customProperty(page, '.tp__hatter', '--frown'), { timeout: 8000 })
    .toBeGreaterThan(0.5);
});

test('the tea-party: the status says what was found, in the page’s own words', async ({ page }) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'wine', 0.5);
  await page.locator('.tp__prop-wine').click();
  const found = await lineOf(page, 'wine', 'march-hare', true);
  expect(found).not.toBe(await label(page, 'demoLookForWine'));
  await expect(status(page)).toHaveText(found);
  await atCue(page, 'watch', 0.8);
  await page.locator('.tp__prop-butter').click();
  await expect(status(page)).toHaveText(await lineOf(page, 'butter', 'march-hare'));
});

test('the tea-party: the riddle can be answered, and the raven and the desk only change places', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  const answer = page.locator('.tp__prop-riddle');
  await atCue(page, 'hair', 0.5);
  await expect(answer).toBeHidden();
  await atCue(page, 'see', 0.3);
  await expect(answer).toBeVisible();
  const play = () => customProperty(page, '.tp__riddle', '--play');
  expect(await play()).toBe(0);
  await answer.click();
  await expect.poll(play, { timeout: 8000 }).toBeCloseTo(1, 1);
  await expect
    .poll(() => customProperty(page, '.tp__hatter', '--shrug'), { timeout: 8000 })
    .toBeGreaterThan(0.5);
  await expect(status(page)).toHaveText(await lineOf(page, 'give-up', 'hatter', true));
  // Dragging the raven onto the desk does the same: they change places back.
  await page.waitForTimeout(1500);
  const raven = await page.locator('.tp__raven').boundingBox();
  const desk = await page.locator('.tp__desk').boundingBox();
  if (!raven || !desk) {
    throw new Error('the riddle is not on the stage');
  }
  await page.mouse.move(raven.x + raven.width / 2, raven.y + raven.height / 2);
  await page.mouse.down();
  await page.mouse.move(desk.x + desk.width / 2, desk.y + desk.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(play, { timeout: 8000 }).toBeCloseTo(0, 1);
  // Out of the riddle the play is gone.
  await atCue(page, 'watch', 0.5);
  await expect(answer).toBeHidden();
});

test('the tea-party: singing along sends up a bat a time, and at the fourth the Dormouse sings', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  const sing = page.locator('.tp__prop-sing');
  await atCue(page, 'quarrel', 0.5);
  await expect(sing).toBeHidden();
  await atCue(page, 'twinkle', 0.3);
  await expect(sing).toBeVisible();
  const song = await lineOf(page, 'twinkle', 'hatter');
  await sing.click();
  await expect(status(page)).toHaveText(song);
  await expect(page.locator('.tp__sing-bat').first()).toBeAttached();
  await sing.click();
  await sing.click();
  await expect(page.locator('.tp__dormouse')).not.toHaveAttribute('data-singing', '');
  await sing.click();
  await expect(page.locator('.tp__dormouse')).toHaveAttribute('data-singing', '');
  await expect(status(page)).toHaveText(await lineOf(page, 'twinkle', 'dormouse'));
  // Past the song, the bats and the singing are gone with it.
  await atCue(page, 'tea-time', 0.5);
  await expect(sing).toBeHidden();
  await expect(page.locator('.tp__sing-bat')).toHaveCount(0);
  await expect(page.locator('.tp__dormouse')).not.toHaveAttribute('data-singing', '');
});

test('the tea-party: at tea-time the sentences stand beside the table, clear of the party', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  test.skip((page.viewportSize()?.width ?? 0) <= 700, 'a wide frame only');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'tea-time', 0.6);
  const overlaps = await page.evaluate(() => {
    const party = ['.tp__hatter', '.tp__dormouse', '.tp__hare'].map((sel) =>
      document.querySelector(sel)?.getBoundingClientRect(),
    );
    const lines = [...document.querySelectorAll('.demo-beat[data-cue="tea-time"] .line')].map(
      (line) => line.getBoundingClientRect(),
    );
    let count = 0;
    for (const a of party) {
      for (const b of lines) {
        if (a && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          count += 1;
        }
      }
    }
    return count;
  });
  expect(overlaps).toBe(0);
});

test('the tea-party: leaning the pointer to the edge never shows the edge of the world', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'table', 0.5);
  const width = page.viewportSize()?.width ?? 1280;
  await page.mouse.move(width - 1, 380);
  await expect
    .poll(() => customProperty(page, '.tp__sky', '--px'), { timeout: 8000 })
    .toBeGreaterThan(0.9);
  const grass = await page.locator('.tp__grass').boundingBox();
  expect((grass?.x ?? 0) + (grass?.width ?? 0)).toBeGreaterThanOrEqual(width);
  await page.mouse.move(1, 380);
  await expect
    .poll(() => customProperty(page, '.tp__sky', '--px'), { timeout: 8000 })
    .toBeLessThan(-0.9);
  expect((await page.locator('.tp__grass').boundingBox())?.x ?? 1).toBeLessThanOrEqual(0);
});

test('the tea-party: the last cup is drawn as the Dormouse draws it, rim and saucer included', async ({
  page,
}) => {
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  await scrollTo(page, 1);
  // The rings are sized to the cup's own radius, not to its corner.
  const background = await page.evaluate(
    () => getComputedStyle(document.querySelector('.tp__join-cup') as Element).backgroundImage,
  );
  expect(background).toContain('closest-side');
  await expect(page.locator('.tp__join-mouse .art')).toBeVisible();
  // Its box is the Dormouse's saucer box: 0.768 of the longer side, centred 3% of it high.
  const box = await page.locator('.tp__join-cup').boundingBox();
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  const longer = Math.max(size.width, size.height);
  expect(box?.width ?? 0).toBeCloseTo(longer * 0.768, -1);
  expect((box?.y ?? 0) + (box?.height ?? 0) / 2).toBeCloseTo(size.height / 2 - longer * 0.03, -1);
});

test.describe('the tea-party under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('No room! stands over the table for its settled beat', async ({ page }) => {
    test.skip(!demo, 'no tea-party demo in this build');
    await page.goto(demo?.url ?? '');
    await atCue(page, 'no-room', 0);
    await expect(page.locator('.tp__words')).not.toHaveAttribute('data-off', '');
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.tp__big') as Element).opacity),
        ),
      )
      .toBeGreaterThan(0.9);
    await atCue(page, 'wine', 0);
    await expect(page.locator('.tp__words')).toHaveAttribute('data-off', '');
  });
});
