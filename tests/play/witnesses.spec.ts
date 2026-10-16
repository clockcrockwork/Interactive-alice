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
  const endX = await customProperty(page, '.tr__court', '--cam-x');
  const aliceTransform = () =>
    page.evaluate(() =>
      new DOMMatrix(getComputedStyle(document.querySelector('.tr__alice') as Element).transform)
        .toFloat32Array()
        .slice(0, 16),
    );
  const endAlice = await aliceTransform();
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
  expect(await customProperty(page, '.tr__court', '--cam-x')).toBeCloseTo(endX, 0);
  // The same Alice, from behind, at the same size and place.
  const startAlice = await aliceTransform();
  for (const [i, value] of Object.entries(endAlice)) {
    expect(startAlice[Number(i)] ?? 0).toBeCloseTo(value, 0);
  }
  await expect(page.locator('.tr__alice [data-art="alice/from-behind"]')).toHaveCount(1);
  await expect(page.locator('.tr__door-leaf')).toHaveCount(0);
});

const opacityOf = (page: Parameters<typeof atCue>[0], selector: string) =>
  page.evaluate(
    (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
    selector,
  );

test('the witnesses: the accusation is read off the herald’s scroll, unrolled in its own beat', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  const scroll = page.locator('.demo-beat[data-cue="accusation"] .line[data-scroll]');
  await expect(scroll).toHaveCount(2);
  const unrolled = () =>
    scroll.evaluateAll((lines) =>
      lines.map((line) => Number(getComputedStyle(line).getPropertyValue('--unroll'))),
    );
  // Rolled up before it is read; open, and seen, once its beat has come in.
  await atCue(page, 'herald', 0.5);
  expect(Math.max(...(await unrolled()))).toBeLessThan(0.05);
  await atCue(page, 'accusation', 0.6);
  await expect
    .poll(async () => Math.min(...(await unrolled())), { timeout: 8000 })
    .toBeGreaterThan(0.95);
  await expect(scroll.first()).toBeVisible();
  // Only the accusation is a scroll: the Rabbit's other lines are plain slips.
  await expect(page.locator('.line[data-speaker="white-rabbit"][data-scroll]')).toHaveCount(2);
});

test('the witnesses: jurors take no focus out of their moment, and the in-scene taps none at all', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  const visibility = () =>
    page
      .locator('.tr__juror')
      .evaluateAll((buttons) => buttons.map((button) => getComputedStyle(button).visibility));
  await atCue(page, 'throne', 0.3);
  expect(new Set(await visibility())).toEqual(new Set(['hidden']));
  await atCue(page, 'jury', 0.5);
  await expect
    .poll(async () => new Set(await visibility()), { timeout: 8000 })
    .toEqual(new Set(['visible']));
  // The guinea-pig, the Lizard and the note-book are pointer play; their props
  // are the keyboard's way.
  for (const selector of ['.wt__pig-button', '.wt__lizard-button', '.wt__notebook-tap']) {
    await expect(page.locator(selector)).toHaveAttribute('tabindex', '-1');
  }
});

test('the witnesses: giant Alice is drawn from behind in her own colours, her head out of the frame a mile high', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  await expect(page.locator('.tr__alice [data-art="alice/from-behind"]')).toHaveCount(1);
  await expect(page.locator('.tr__alice svg [fill="var(--alice-dress)"]').first()).toBeAttached();
  await expect(page.locator('.tr__alice svg [fill="var(--alice-hair)"]').first()).toBeAttached();
  await atCue(page, 'mile', 0.95);
  await expect.poll(() => opacityOf(page, '.tr__alice'), { timeout: 8000 }).toBeGreaterThan(0.9);
  const box = await page.locator('.tr__alice').boundingBox();
  expect(box?.y ?? 0).toBeLessThan(0);
  // The clouds are between her and the court, and the throne is seen past her.
  await expect.poll(() => opacityOf(page, '.tr__height'), { timeout: 8000 }).toBeGreaterThan(0.9);
  const queen = await page.locator('.tr__throne--queen').boundingBox();
  expect((queen?.x ?? 0) + (queen?.width ?? 0)).toBeLessThan(box?.x ?? 0);
});

test('the witnesses: the letter is held up clear of the captions, never over them', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  for (const size of [
    { width: 1280, height: 720 },
    { width: 390, height: 780 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(witnesses?.url ?? '');
    for (const cue of ['handwriting', 'clever', 'read', 'verses']) {
      await atCue(page, cue, 0.6);
      await expect
        .poll(() => opacityOf(page, '.wt__sheet'), { timeout: 8000 })
        .toBeGreaterThan(0.9);
      const clash = await page.evaluate((name) => {
        const sheet = document.querySelector('.wt__sheet')?.getBoundingClientRect();
        const lines = [
          ...document.querySelectorAll(`.demo__stage .demo-beat[data-cue="${name}"] .line`),
        ].map((line) => line.getBoundingClientRect());
        return lines.filter(
          (line) =>
            sheet &&
            line.left < sheet.right &&
            sheet.left < line.right &&
            line.top < sheet.bottom &&
            sheet.top < line.bottom,
        ).length;
      }, cue);
      expect(clash, `${cue} at ${size.width}`).toBe(0);
    }
  }
});

test('the witnesses: Rule Forty-two is still wet, and looking in the note-book catches the King at it', async ({
  page,
}) => {
  test.skip(!witnesses, 'no witnesses demo in this build');
  await page.goto(witnesses?.url ?? '');
  const look = page.locator('.wt__prop-look');
  const shut = () => customProperty(page, '.wt__notebook', '--shut');
  // Not before the rule is being written.
  await atCue(page, 'important', 0.5);
  await expect(look).toBeHidden();
  await atCue(page, 'mile', 0.5);
  await expect(page.locator('.wt__notebook')).toHaveAttribute('data-wet', '', { timeout: 8000 });
  expect(await customProperty(page, '.wt__notebook', '--word-rule')).toBeGreaterThan(0.3);
  await expect(look).toBeVisible();
  const label = (await look.textContent()) ?? '';
  await look.click();
  await expect(page.locator('.demo__status')).toHaveText(label);
  await expect
    .poll(() => customProperty(page, '.wt__peek-book', '--peek'), { timeout: 5000 })
    .toBeGreaterThan(0.9);
  // Caught: the blot, then the book shut early, and the look is spent.
  await expect(page.locator('.wt__peek-book')).toHaveAttribute('data-caught', '', {
    timeout: 5000,
  });
  await expect.poll(shut, { timeout: 5000 }).toBeGreaterThan(0.95);
  await expect(look).toBeHidden();
  await expect
    .poll(() => customProperty(page, '.wt__peek-book', '--peek'), { timeout: 8000 })
    .toBeLessThan(0.05);
  // Scrolling back before the pen started undoes it; the story shuts it itself.
  await atCue(page, 'important', 0.5);
  await expect.poll(shut, { timeout: 8000 }).toBeLessThan(0.05);
  await atCue(page, 'mile', 0.5);
  await expect(look).toBeVisible({ timeout: 8000 });
  // Pointer play: a real tap on the book in the King's hand does the same.
  await page.locator('.wt__notebook-tap').click();
  await expect(page.locator('.wt__peek-book')).toHaveAttribute('data-caught', '', {
    timeout: 5000,
  });
  await atCue(page, 'paper', 0.05);
  await expect.poll(shut, { timeout: 8000 }).toBeGreaterThan(0.95);
  await expect(look).toBeHidden();
});

test.describe('the witnesses under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('at the head of "Here!" she is up and the jury-box is over; the book’s look is a still', async ({
    page,
  }) => {
    test.skip(!witnesses, 'no witnesses demo in this build');
    await page.goto(witnesses?.url ?? '');
    await atCue(page, 'here', 0);
    await expect.poll(() => opacityOf(page, '.tr__alice'), { timeout: 8000 }).toBeGreaterThan(0.9);
    expect(await customProperty(page, '.tr__jury', '--tip')).toBeGreaterThan(0.9);
    await atCue(page, 'accusation', 0);
    const unroll = await page
      .locator('.line[data-scroll]')
      .evaluateAll((lines) =>
        lines.map((line) => Number(getComputedStyle(line).getPropertyValue('--unroll'))),
      );
    expect(Math.min(...unroll)).toBeGreaterThan(0.95);
    await atCue(page, 'mile', 0);
    await page.locator('.wt__prop-look').click();
    await expect(page.locator('.wt__peek-book')).toHaveAttribute('data-caught', '', {
      timeout: 5000,
    });
    // No scratching quill and no glisten: the still is the wet rule, written.
    expect(
      await page
        .locator('.wt__peek-book .wt__glints')
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    expect(await customProperty(page, '.wt__peek-book', '--write')).toBeGreaterThan(0.95);
  });
});
