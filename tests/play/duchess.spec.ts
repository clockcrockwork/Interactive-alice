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

test.describe('duchess: the review fixes', () => {
  test.skip(!demo, 'no duchess demo page in the build');

  test('each ribbon carries its moral, from her own sentence, and they pile above her cap', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'seem', 0.9);
    await expect(page.locator(RIBBON)).toHaveCount(5);
    // What the page says after "the moral of that is:" (or her moral sentence), per beat.
    const expected = await page.evaluate(() =>
      ['chin', 'sense', 'feather', 'mine', 'seem'].map((cue) => {
        const lines = [
          ...document.querySelectorAll<HTMLElement>(`.demo-beat[data-cue="${cue}"] .line`),
        ].filter((line) => line.dataset.speaker === 'duchess');
        const withColon = lines.find((line) => /[:：]/.test(line.textContent ?? ''));
        const text = withColon
          ? (withColon.textContent ?? '').split(/[:：]/).slice(1).join(':')
          : (lines.at(-1)?.textContent ?? '');
        return text.trim();
      }),
    );
    const words = await page.locator('.dc__ribbon-words').allTextContents();
    expect(words.map((w) => w.trim())).toEqual(expected);
    for (const word of words) {
      expect(word.length).toBeGreaterThan(10);
    }
    // The words are the caption's: hidden from assistive technology on the ribbon.
    await expect(page.locator('.dc__ribbon-words').first()).toHaveAttribute('aria-hidden', 'true');
    // Above her cap, and clear of Alice's face.
    const clear = await page.evaluate(() => {
      const duchess = document.querySelector('.dc__duchess')?.getBoundingClientRect();
      const alice = document.querySelector('.dc__alice')?.getBoundingClientRect();
      if (!duchess || !alice) {
        return false;
      }
      const face = { top: alice.top, bottom: alice.top + alice.height * 0.35 };
      return [...document.querySelectorAll('.dc__ribbon[data-shown]')].every((ribbon) => {
        const r = ribbon.getBoundingClientRect();
        return r.bottom <= duchess.top + duchess.height * 0.12 && r.bottom <= face.top + 2;
      });
    });
    expect(clear).toBe(true);
  });

  test('"He might bite": at mid-beat the flamingo is lunging, beak out', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'bite', 0.5);
    await expect
      .poll(() => customProperty(page, '.dc__flamingo', '--bite'), { timeout: 8000 })
      .toBeGreaterThan(0.9);
    await atCue(page, 'feather', 0.5);
    await expect
      .poll(() => customProperty(page, '.dc__flamingo', '--bite'), { timeout: 8000 })
      .toBeLessThan(0.05);
  });

  test('the Queen’s shadow does not walk with the ground: no seam when they walk back', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.dc__near .dc__long-shadow')).toHaveCount(0);
    await atCue(page, 'left', 0.5);
    const box = await page.locator('.dc__long-shadow').boundingBox();
    const width = page.viewportSize()?.width ?? 1280;
    expect(box?.x ?? 1).toBeLessThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThanOrEqual(width);
  });

  test('the mustard-mine is a pithead, a heap and a cart', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'mine', 0.6);
    await expect(page.locator('.dc__mine')).toHaveAttribute('data-shown', '');
    await expect(page.locator('.dc__mine .dc__mine-wheel')).toBeAttached();
  });
});

test.describe('duchess: the new play', () => {
  test.skip(!demo, 'no duchess demo page in the build');

  test('a shrug knocks the chin off, and it creeps back with the next moral', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    const shrug = page.locator('.dc__prop--shrug');
    await atCue(page, 'moral', 0.5);
    await expect(shrug).toBeHidden();
    await atCue(page, 'sense', 0.05);
    await expect(shrug).toBeVisible();
    await shrug.click();
    await expect
      .poll(() => customProperty(page, '.dc__duchess', '--shrugged'), { timeout: 8000 })
      .toBeGreaterThan(0.6);
    // The next moral is said: the chin comes back.
    await atCue(page, 'sense', 0.6);
    await expect
      .poll(() => customProperty(page, '.dc__duchess', '--shrugged'), { timeout: 15_000 })
      .toBeLessThan(0.05);
    // A tap on Alice shrugs too.
    await page.locator('.dc__alice').click({ force: true });
    await expect
      .poll(() => customProperty(page, '.dc__duchess', '--shrugged'), { timeout: 8000 })
      .toBeGreaterThan(0.6);
    await atCue(page, 'thunder', 0.5);
    await expect(shrug).toBeHidden();
  });

  test('pigs have to fly: one does, and is cut off with her word', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    const pigs = page.locator('.dc__pig-layer');
    await atCue(page, 'seem', 0.5);
    await expect(pigs).toHaveAttribute('data-off', '');
    await atCue(page, 'think', 0.6);
    await expect(pigs).not.toHaveAttribute('data-off', '');
    await expect(pigs).not.toHaveAttribute('data-cut', '');
    await expect(page.locator('.dc__pig .art')).toBeVisible();
    await atCue(page, 'thunder', 0.1);
    await expect(pigs).toHaveAttribute('data-cut', '');
    await expect(page.locator('.dc__pig')).toBeHidden();
  });

  test('the last frame is the Mock Turtle’s first: the Gryphon, the grass and the Queen in place', async ({
    page,
  }) => {
    const turtle = demos.find((d) => d.demo === 'mock-turtle');
    test.skip(!turtle, 'both demos are needed for the join');
    await page.goto(demo?.url ?? '');
    await atCue(page, 'turtle', 0.99);
    await expect
      .poll(() => customProperty(page, '.dc__landing', '--land'), { timeout: 8000 })
      .toBeCloseTo(1, 2);
    await expect
      .poll(() => customProperty(page, '.dc__queen', '--recede'), { timeout: 8000 })
      .toBeCloseTo(1, 2);
    // Alice has stepped past the camera: from here it is her eyes.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.dc__alice') as Element).opacity),
        ),
      )
      .toBeLessThan(0.05);
    const boxes = (queen: string) =>
      page.evaluate(
        ([q]) =>
          [q, '.mt__gryphon .art', '.mt__grass', '.mt__sun'].map((sel) => {
            const r = document.querySelector(sel)?.getBoundingClientRect();
            return r ? [r.x, r.y, r.width, r.height] : [];
          }),
        [queen] as const,
      );
    await page.waitForTimeout(800);
    const here = await boxes('.dc__queen > .art');
    await page.goto(turtle?.url ?? '');
    await page.waitForTimeout(800);
    const there = await boxes('.mt__queen > .art');
    expect(here.flat().length).toBe(16);
    here.flat().forEach((value, i) => {
      expect(Math.abs(value - (there.flat()[i] ?? Number.NaN)), `value ${i}`).toBeLessThan(3);
    });
  });
});

test.describe('duchess under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test.skip(!demo, 'no duchess demo page in the build');

  test('she is gone with her sentence, and the bite and the pig are seen in theirs', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'choice', 0);
    await expect(page.locator('.dc__duchess')).toHaveAttribute('data-gone', '');
    await atCue(page, 'bite', 0);
    expect(await customProperty(page, '.dc__flamingo', '--bite')).toBeCloseTo(1, 2);
    await atCue(page, 'think', 0);
    await expect(page.locator('.dc__pig-layer')).not.toHaveAttribute('data-off', '');
    await expect(page.locator('.dc__pig-layer')).not.toHaveAttribute('data-cut', '');
  });
});
