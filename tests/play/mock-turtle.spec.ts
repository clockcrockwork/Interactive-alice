/**
 * The Mock Turtle's Story: the pointer-only Mock Turtle takes no focus, the
 * silence passes in the sky and can be broken, "Hjckrrh!" is drawn as its line
 * appears, the Drawling-master is a button only while he is up, both creatures
 * hide their faces when the sentence says so, the descent shows no ground, and
 * the subjects on the sand keep clear of the figures and the captions.
 */

import { expect, type Locator, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'mock-turtle');

const opacity = (locator: Locator) =>
  locator.evaluate((element) => Number(getComputedStyle(element).opacity));

/** Whether two boxes overlap by more than a pixel or two. */
const overlaps = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x + 2 < b.x + b.width &&
  b.x + 2 < a.x + a.width &&
  a.y + 2 < b.y + b.height &&
  b.y + 2 < a.y + a.height;

/** The written subjects on the sand, each against the captions shown and the figures. */
const subjectCollisions = (page: Page) =>
  page.evaluate(() => {
    const box = (element: Element) => element.getBoundingClientRect();
    const words = [...document.querySelectorAll('.mt__subject')].filter(
      (word) => Number(getComputedStyle(word).opacity) > 0.5,
    );
    const lines = [...document.querySelectorAll('.demo-beat[data-active] .line')].filter(
      (line) => Number(getComputedStyle(line).opacity) > 0.5,
    );
    const figures = [
      ...document.querySelectorAll('.mt__gryphon .art, .mt__ledge > svg, .mt__turtle .art'),
    ];
    return {
      words: words.length,
      boxes: words.map(box).map(({ x, y, width, height }) => ({ x, y, width, height })),
      others: [...lines, ...figures]
        .map(box)
        .map(({ x, y, width, height }) => ({ x, y, width, height })),
    };
  });

const expectSubjectsClear = async (page: Page) => {
  const { words, boxes, others } = await subjectCollisions(page);
  expect(words).toBeGreaterThan(1);
  for (const word of boxes) {
    for (const other of others) {
      expect(overlaps(word, other), JSON.stringify({ word, other })).toBe(false);
    }
  }
};

test.describe('mock turtle: play', () => {
  test.skip(!demo, 'no mock-turtle demo page in the build');

  test.beforeEach(async ({ page }) => {
    await page.goto(demo?.url ?? '');
  });

  test('the Mock Turtle is pointer play: no focus, not announced, the button is the way', async ({
    page,
  }) => {
    const turtle = page.locator('.mt__turtle');
    await expect(turtle).toHaveAttribute('tabindex', '-1');
    await expect(turtle).toHaveAttribute('aria-hidden', 'true');
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.className ?? '');
      expect(focused).not.toContain('mt__turtle');
      expect(focused).not.toContain('mt__eel');
    }
    await expect(page.getByRole('button', { name: 'Comfort him' })).toHaveCount(0);
    await atCue(page, 'tears', 0.5);
    await expect(page.getByRole('button', { name: 'Comfort him' })).toHaveCount(1);
  });

  test('the first frame is untouched: no shadows yet, the sun where it was', async ({ page }) => {
    expect(await customProperty(page, '.mt__figures', '--shade')).toBe(0);
    expect(await customProperty(page, '.mt__shore', '--sun-x')).toBe(0);
    expect(await customProperty(page, '.mt__shore', '--sun-y')).toBe(0);
    expect(await opacity(page.locator('.mt__eel'))).toBe(0);
  });

  test('the sun slides and the shadows swing through the silence, and back', async ({ page }) => {
    await atCue(page, 'silence', 0.03);
    const before = await customProperty(page, '.mt__shore', '--sun-x');
    const angleBefore = await customProperty(page, '.mt__figures', '--shade-a');
    expect(before).toBeGreaterThan(-5);
    await atCue(page, 'silence', 0.9);
    await expect.poll(() => customProperty(page, '.mt__shore', '--sun-x')).toBeLessThan(-50);
    expect(await customProperty(page, '.mt__figures', '--shade-a')).toBeLessThan(angleBefore - 60);
    expect(await customProperty(page, '.mt__figures', '--shade')).toBeGreaterThan(0.9);
    await atCue(page, 'silence', 0.03);
    await expect.poll(() => customProperty(page, '.mt__shore', '--sun-x')).toBeGreaterThan(-5);
  });

  test('clearing your throat breaks the silence: he starts, and sobs louder', async ({ page }) => {
    const throat = page.getByRole('button', { name: 'Clear your throat' });
    await atCue(page, 'tears', 0.5);
    await expect(throat).toBeHidden();
    await atCue(page, 'silence', 0.5);
    await expect(throat).toBeVisible();
    await throat.click();
    await expect(page.locator('.mt__turtle')).toHaveAttribute('data-sobbing', '');
    await expect(page.locator('.demo__status')).toHaveText('Clear your throat');
    await expect
      .poll(() => customProperty(page, '.mt__shore', '--swell'), { timeout: 3000 })
      .toBeGreaterThan(0.3);
    // The moment passes with the beat.
    await atCue(page, 'once', 0.5);
    await expect(throat).toBeHidden();
    await expect(page.locator('.mt__turtle')).not.toHaveAttribute('data-sobbing', '');
  });

  test('"Hjckrrh!" is drawn as its line appears, while the Gryphon shakes', async ({ page }) => {
    const word = page.locator('.mt__cry-word');
    await atCue(page, 'once', 0.12);
    expect(await opacity(word)).toBeLessThan(0.05);
    await atCue(page, 'once', 0.45);
    await expect.poll(() => opacity(word)).toBeGreaterThan(0.95);
    await expect(page.locator('.mt__figures')).toHaveAttribute('data-crying-out', '');
    const drawn = await word
      .locator('.mt__letter')
      .evaluateAll((letters) =>
        letters.map((letter) => Number(getComputedStyle(letter).getPropertyValue('--drawn'))),
      );
    expect(drawn.length).toBeGreaterThan(4);
    for (const amount of drawn) {
      expect(amount).toBeGreaterThan(0.9);
    }
    await atCue(page, 'once', 0.75);
    expect(await opacity(word)).toBeGreaterThan(0.95);
    await expect(page.locator('.mt__figures')).not.toHaveAttribute('data-crying-out', '');
    await atCue(page, 'school', 0.5);
    await expect.poll(() => opacity(word)).toBeLessThan(0.05);
  });

  test('the descent shows no ground: the water comes up whole under the shore', async ({
    page,
  }) => {
    await atCue(page, 'school', 0.3);
    const depth = await customProperty(page, '.mt__school', '--depth');
    expect(depth).toBeGreaterThan(0.05);
    expect(depth).toBeLessThan(0.95);
    expect(await opacity(page.locator('.mt__school'))).toBeGreaterThan(0.99);
    const edges = await page.evaluate(() => ({
      water: document.querySelector('.mt__school')?.getBoundingClientRect().top ?? 0,
      shore: document.querySelector('.mt__shingle')?.getBoundingClientRect().bottom ?? 0,
    }));
    expect(edges.water).toBeLessThanOrEqual(edges.shore + 1);
  });

  test('the Drawling-master is a button only while he is up: he drawls, stretches and faints', async ({
    page,
  }) => {
    const eel = page.locator('.mt__eel');
    await atCue(page, 'more', 0.5);
    expect(await eel.evaluate((button) => (button as HTMLButtonElement).inert)).toBe(true);
    await atCue(page, 'drawling', 0.6);
    expect(await eel.evaluate((button) => (button as HTMLButtonElement).inert)).toBe(false);
    await expect(page.getByRole('button', { name: 'Wake the Drawling-master' })).toBeVisible();
    await eel.locator('.art').click();
    await expect(page.locator('.demo__status')).toHaveText('Wake the Drawling-master');
    await expect
      .poll(() => customProperty(page, '.mt__eel', '--stretch'), { timeout: 3000 })
      .toBeGreaterThan(0.5);
    await expect
      .poll(() => customProperty(page, '.mt__eel', '--faint'), { timeout: 3000 })
      .toBeGreaterThan(0.5);
    await expect
      .poll(() => customProperty(page, '.mt__eel', '--faint'), { timeout: 5000 })
      .toBeLessThan(0.05);
    await atCue(page, 'grief', 0.5);
    expect(await eel.evaluate((button) => (button as HTMLButtonElement).inert)).toBe(true);
  });

  test('both creatures hide their faces in their paws when the sentence says so', async ({
    page,
  }) => {
    await atCue(page, 'grief', 0.05);
    expect(await customProperty(page, '.mt__gryphon', '--hide')).toBeLessThan(0.05);
    await atCue(page, 'grief', 0.5);
    await expect.poll(() => customProperty(page, '.mt__gryphon', '--hide')).toBeGreaterThan(0.95);
    await expect.poll(() => customProperty(page, '.mt__turtle', '--hide')).toBeGreaterThan(0.95);
    for (const paw of await page.locator('.mt__paw').all()) {
      expect(await opacity(paw)).toBeGreaterThan(0.95);
    }
    await atCue(page, 'hours', 0.5);
    await expect.poll(() => customProperty(page, '.mt__gryphon', '--hide')).toBeLessThan(0.05);
  });

  test('the subjects on the sand keep clear of the figures and the captions', async ({ page }) => {
    for (const cue of ['reeling', 'uglify', 'drawling']) {
      await atCue(page, cue, 0.6);
      await expectSubjectsClear(page);
    }
  });
});

test.describe('mock turtle: phone', () => {
  test.skip(!demo, 'no mock-turtle demo page in the build');
  test.use({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });

  test('the subjects on the sand keep clear of the figures and the captions', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    for (const cue of ['reeling', 'uglify', 'drawling']) {
      await atCue(page, cue, 0.6);
      await expectSubjectsClear(page);
    }
  });
});
