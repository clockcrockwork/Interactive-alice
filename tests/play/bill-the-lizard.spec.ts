/**
 * There Goes Bill: the regressions the review found (the camera falling back to
 * the roof after an early kick, a shaft that ran out mid-screen, a second kick
 * stop with no focus, a world box showing through the spin, Bill behind the
 * link to the next scene) and the new play: catch him with the crowd by the
 * hedge, and hold up his head for the brandy.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, demos, scrollTo } from '../demo-helpers.ts';

const bill = demos.find((candidate) => candidate.demo === 'bill-the-lizard');

const billState = (page: Page) =>
  page.evaluate(() => {
    const state = window.__aliceBill?.();
    if (!state) {
      throw new Error('no Bill seam');
    }
    return state;
  });

const cam = (page: Page) =>
  page.evaluate(() =>
    Number(document.querySelector<HTMLElement>('.bl__world')?.style.getPropertyValue('--cam')),
  );

const box = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom } : undefined;
  }, selector);

test.describe('There Goes Bill', () => {
  test.skip(!bill, 'no bill-the-lizard demo in this build');

  test('an early kick sends the camera up, and the launch keeps it up rather than back at the roof', async ({
    page,
  }) => {
    await page.goto(bill?.url ?? '');
    await atCue(page, 'kick', 0.3);
    await page.locator('.bl__prop--kick').click();
    // Straight on into the launch while the burst is still going.
    await atCue(page, 'launch', 0.3);
    for (let i = 0; i < 6; i += 1) {
      expect(await cam(page)).toBeGreaterThan(1000);
      await page.waitForTimeout(250);
    }
    await expect.poll(() => cam(page), { timeout: 8000 }).toBeGreaterThan(1800);
    // Back above the kick, everything is put back for another go.
    await atCue(page, 'foot', 0.9);
    await expect.poll(async () => (await billState(page)).kicked, { timeout: 8000 }).toBe(false);
    await expect.poll(() => cam(page), { timeout: 8000 }).toBeLessThan(-1000);
  });

  test('the shaft fills the frame at the foot and the kick, and the foot is seen above the frame bottom', async ({
    page,
  }) => {
    await page.goto(bill?.url ?? '');
    for (const [cue, within] of [
      ['foot', 0.9],
      ['kick', 0.5],
    ] as const) {
      await atCue(page, cue, within);
      const shaft = await box(page, '.bl__chimney');
      const height = await page.evaluate(() => innerHeight);
      expect(shaft && shaft.top <= 0 && shaft.bottom >= height).toBe(true);
      await expect(page.locator('.bl__chimney')).toHaveCSS('opacity', '1');
      const foot = await box(page, '.bl__foot');
      const captions = await box(page, `.demo-beat[data-cue="${cue}"]`);
      expect(foot && captions).toBeTruthy();
      if (foot && captions) {
        expect(foot.top).toBeLessThan(height * 0.7);
        expect(foot.top).toBeGreaterThan(captions.bottom);
      }
    }
  });

  test('the frame-wide kick target takes no focus: the button is the keyboard way', async ({
    page,
  }) => {
    await page.goto(bill?.url ?? '');
    await atCue(page, 'kick', 0.3);
    const target = page.locator('.bl__kick-target');
    await expect(target).toBeVisible();
    expect(await target.evaluate((el) => el.tagName)).not.toBe('BUTTON');
    await expect(target).not.toHaveAttribute('tabindex', /.*/);
    await expect(target).toHaveAttribute('aria-hidden', 'true');
  });

  test('the spin turns a box larger than the frame, so no corner of the world shows', async ({
    page,
  }) => {
    await page.goto(bill?.url ?? '');
    const sizes = await page.evaluate(() => {
      const spin = document.querySelector<HTMLElement>('.bl__spin');
      return {
        side: Number.parseFloat(getComputedStyle(spin as Element).width),
        diagonal: Math.hypot(innerWidth, innerHeight),
      };
    });
    expect(sizes.side).toBeGreaterThanOrEqual(sizes.diagonal - 2);
  });

  test('the crowd by the hedge catches him if the reader moves it under him, and misses if not', async ({
    page,
  }) => {
    await page.goto(bill?.url ?? '');
    // Nobody moves the crowd: he goes into the hedge.
    await atCue(page, 'land', 0.3);
    await expect.poll(async () => (await billState(page)).outcome, { timeout: 8000 }).toBe('miss');
    await expect(page.locator('.bl__garden')).toHaveAttribute('data-outcome', 'miss');
    // Back up into the fall, and the button steps the crowd under him.
    await atCue(page, 'launch', 0.6);
    await expect.poll(async () => (await billState(page)).outcome, { timeout: 8000 }).toBe('none');
    const step = page.locator('.bl__prop--catch');
    await expect(step).toBeVisible();
    for (let i = 0; i < 3; i += 1) {
      await step.click();
    }
    await expect
      .poll(async () => (await billState(page)).crowd, { timeout: 8000 })
      .toBeGreaterThan(0.55);
    await expect(page.locator('.demo__status')).toContainText(/.+/);
    await atCue(page, 'land', 0.3);
    await expect.poll(async () => (await billState(page)).outcome, { timeout: 8000 }).toBe('catch');
  });

  test('a drag moves the crowd sideways', async ({ page }) => {
    await page.goto(bill?.url ?? '');
    await atCue(page, 'launch', 0.6);
    const before = (await billState(page)).crowd;
    const size = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    await page.mouse.move(size.w * 0.34, size.h * 0.75);
    await page.mouse.down();
    await page.mouse.move(size.w * 0.5, size.h * 0.75, { steps: 4 });
    await page.mouse.move(size.w * 0.64, size.h * 0.75, { steps: 4 });
    await page.mouse.up();
    await expect
      .poll(async () => (await billState(page)).crowd, { timeout: 8000 })
      .toBeGreaterThan(before + 0.15);
  });

  test('holding up his head gives him the brandy, and the daze clears a step', async ({ page }) => {
    await page.goto(bill?.url ?? '');
    await atCue(page, 'land', 0.45);
    await expect.poll(async () => (await billState(page)).daze, { timeout: 8000 }).toBe(3);
    const hold = page.locator('.bl__prop--hold');
    await expect(hold).toBeVisible();
    // A dispatched click: Playwright's own may scroll the pinned stage on into the next beat.
    await hold.dispatchEvent('click');
    await expect.poll(async () => (await billState(page)).holds, { timeout: 15_000 }).toBe(1);
    expect((await billState(page)).daze).toBe(2);
    await expect(page.locator('.bl__garden')).toHaveAttribute('data-daze', '2');
    // The story's own brandy clears one more; scrolling back above the landing
    // takes the reader's back.
    await atCue(page, 'land', 0.75);
    await expect.poll(async () => (await billState(page)).daze, { timeout: 8000 }).toBe(1);
    await atCue(page, 'launch', 0.6);
    await expect.poll(async () => (await billState(page)).holds, { timeout: 8000 }).toBe(0);
  });

  test('at the end Bill sits clear of the link to the next scene', async ({ page }) => {
    await page.goto(bill?.url ?? '');
    await scrollTo(page, 1);
    await expect(page.locator('.demo__next')).toBeVisible();
    const lizard = await box(page, '.bl__body');
    const next = await box(page, '.demo__end');
    expect(lizard && next).toBeTruthy();
    if (lizard && next) {
      const links = await page.evaluate(() =>
        [...document.querySelectorAll('.demo__next, .demo__auto')].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }),
      );
      for (const link of links) {
        const apart =
          lizard.right < link.left ||
          lizard.left > link.right ||
          lizard.bottom < link.top ||
          lizard.top > link.bottom;
        expect(apart).toBe(true);
      }
    }
  });
});

test.describe('There Goes Bill, reduced motion', () => {
  test.skip(!bill, 'no bill-the-lizard demo in this build');
  test.use({ reducedMotion: 'reduce' });

  test('Bill is in the garden from the launch on, with no spin and no blur', async ({ page }) => {
    await page.goto(bill?.url ?? '');
    await atCue(page, 'launch', 0.5);
    await expect(page.locator('.bl__garden')).toHaveCSS('opacity', '1');
    const lizard = await box(page, '.bl__body');
    const height = await page.evaluate(() => innerHeight);
    expect(lizard && lizard.top > 0 && lizard.bottom < height).toBe(true);
    await atCue(page, 'land', 0);
    await expect(page.locator('.bl__garden')).toHaveAttribute('data-outcome', /catch|miss/);
    // The story's brandy is a still: the head held up, drops at his mouth.
    await expect(page.locator('.bl__garden')).toHaveAttribute('data-spill', '');
    await expect(page.locator('.bl__world')).toHaveCSS('filter', 'none');
    expect(
      await page.evaluate(() =>
        document.querySelector<HTMLElement>('.bl__world')?.style.getPropertyValue('--spin'),
      ),
    ).toBe('0.00');
  });
});
