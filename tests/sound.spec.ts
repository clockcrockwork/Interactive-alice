/**
 * Sound off means off: a page played through without turning sound on makes no
 * AudioContext at all, and once it is on, its timers stop while the page is hidden
 * or put away and come back when it is shown (docs/concept-demos.md §3, Sound).
 */

import { expect, type Page, test } from '@playwright/test';
import { demos, scrollTo } from './demo-helpers.ts';

/** Counts every AudioContext the page constructs, before any of its script runs. */
const countContexts = (page: Page) =>
  page.addInitScript(() => {
    const host = window as unknown as {
      __contexts: number;
      AudioContext: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    host.__contexts = 0;
    for (const name of ['AudioContext', 'webkitAudioContext'] as const) {
      const Original = host[name];
      if (!Original) {
        continue;
      }
      host[name] = class extends Original {
        constructor(...args: ConstructorParameters<typeof AudioContext>) {
          super(...args);
          host.__contexts += 1;
        }
      };
    }
  });

const contexts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __contexts: number }).__contexts);
const soundState = (page: Page) => page.evaluate(() => window.__aliceDemo?.sound());

/** Presses whatever play the frame offers now: every shown prop, and a rose or two. */
const playHere = async (page: Page) => {
  for (const prop of await page.locator('.demo__prop[data-shown]').all()) {
    await prop.dispatchEvent('click');
  }
  for (const thing of await page.locator('.cq__rose, .cq__gardener').all()) {
    await thing.dispatchEvent('click');
  }
};

test('a page played through without turning sound on creates no AudioContext', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'croquet');
  test.skip(!demo, 'no croquet demo in this build');
  await countContexts(page);
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  for (const fraction of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    await scrollTo(page, fraction);
    await playHere(page);
  }
  await page.locator('.demo__motion').click();
  await page.locator('.demo__motion').click();
  expect(await contexts(page)).toBe(0);
  expect(await soundState(page)).toEqual({
    context: 'none',
    running: false,
    timers: 0,
    ticks: 0,
  });
  // Turned on, there is one.
  await page.locator('.demo__sound').click();
  expect(await contexts(page)).toBe(1);
});

test('the sound timers stop while the page is hidden or put away, and resume when it is shown', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'riverbank');
  test.skip(!demo, 'no riverbank demo in this build');
  await page.goto(demo?.url ?? '');
  await page.locator('.demo__sound').click();
  await expect.poll(async () => (await soundState(page))?.running).toBe(true);
  await expect.poll(async () => (await soundState(page))?.ticks ?? 0).toBeGreaterThan(3);

  const setHidden = (hidden: boolean) =>
    page.evaluate((value) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  const quiet = async () => {
    const before = (await soundState(page))?.ticks ?? 0;
    await page.waitForTimeout(600);
    const after = await soundState(page);
    expect(after?.running).toBe(false);
    expect(after?.timers).toBe(0);
    expect(after?.ticks).toBe(before);
    // The context's suspend is the browser's to finish, and a loaded machine takes
    // its time: wait for the state, not for a fixed while.
    await expect
      .poll(async () => (await soundState(page))?.context, { timeout: 10_000 })
      .not.toBe('running');
  };

  await setHidden(true);
  await quiet();
  await setHidden(false);
  await expect.poll(async () => (await soundState(page))?.running).toBe(true);

  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
  );
  await quiet();
  const ticks = (await soundState(page))?.ticks ?? 0;
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await expect.poll(async () => (await soundState(page))?.ticks ?? 0).toBeGreaterThan(ticks);

  // Off: nothing runs, and coming back does not turn it on.
  await page.locator('.demo__sound').click();
  await quiet();
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await quiet();
});
