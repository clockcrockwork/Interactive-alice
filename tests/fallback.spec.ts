/**
 * The demo pages arrive as readable documents, and stay readable when the script
 * does not run: switched off, failed to load, or a staging that throws, which the
 * shell rolls back (docs/concept-demos.md §3). A handful of demos in every locale
 * that publishes them, not all of them: the rule is the shell's, not a demo's.
 */

import { expect, type Page, test } from '@playwright/test';
import { collectErrors, demos } from './demo-helpers.ts';

const SAMPLE = ['riverbank', 'rabbit-hole', 'trial'];
const sample = demos.filter((page) => SAMPLE.includes(page.demo ?? ''));

/**
 * Every staged sentence is on the page, shown, in the flow in reading order (no
 * two of them on top of each other), and inside the width of the viewport; and the
 * links on to the next scene and back to the index are there to follow.
 */
async function expectReadable(page: Page, segments: readonly string[]): Promise<void> {
  await expect(page.locator('.demo')).not.toHaveAttribute('data-attached', '');
  await expect(page.locator('.demo__stage')).toHaveCount(0);
  const lines = await page.locator('.line').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return {
        id: node.getAttribute('data-segment'),
        shown: node.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        top: box.top + window.scrollY,
        bottom: box.bottom + window.scrollY,
        left: box.left,
        right: box.right,
        width: box.width,
        height: box.height,
        text: node.textContent?.trim() ?? '',
        viewport: document.documentElement.clientWidth,
      };
    }),
  );
  expect(lines.map((line) => line.id)).toEqual(segments);
  for (const [i, line] of lines.entries()) {
    expect(line.shown, `${line.id} is shown`).toBe(true);
    expect(line.text.length, `${line.id} has its words`).toBeGreaterThan(0);
    expect(line.width * line.height, `${line.id} has a box`).toBeGreaterThan(0);
    expect(line.left, `${line.id} starts inside the page`).toBeGreaterThanOrEqual(-1);
    expect(line.right, `${line.id} ends inside the page`).toBeLessThanOrEqual(line.viewport + 1);
    const before = lines[i - 1];
    if (before) {
      expect(line.top, `${line.id} follows ${before.id}`).toBeGreaterThanOrEqual(before.bottom - 1);
    }
  }
  // No control is offered for motion or going on by itself that is not there.
  await expect(page.locator('.demo__motion')).toBeHidden();
  await expect(page.locator('.demo__auto')).toBeHidden();
  await expect(page.locator('.demo__end')).not.toHaveAttribute('inert', '');
  await expect(page.locator('.demo__next')).toBeVisible();
  await expect(page.locator('.demo__back')).toBeVisible();
}

/** The next link and the back link go where they say. */
async function expectLinksWork(page: Page): Promise<void> {
  const here = page.url();
  const next = new URL((await page.locator('.demo__next').getAttribute('href')) ?? '', here);
  await page.locator('.demo__next').click();
  await page.waitForURL(next.href);
  await page.goto(here);
  const back = new URL((await page.locator('.demo__back').getAttribute('href')) ?? '', here);
  await page.locator('.demo__back').click();
  await page.waitForURL(back.href);
  await expect(page.locator('h1')).not.toBeEmpty();
}

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false });
  for (const demo of sample) {
    test(`${demo.url} is a readable document whose links work`, async ({ page }) => {
      await page.goto(demo.url);
      await expectReadable(page, demo.segments ?? []);
      await expectLinksWork(page);
    });
  }
});

test.describe('when the demo script fails to load', () => {
  for (const demo of sample) {
    test(`${demo.url} is a readable document whose links work`, async ({ page }) => {
      // The styles arrive; no script does.
      await page.route(/\/assets\/[^/]+\.js(\?.*)?$/, (route) => route.abort());
      await page.goto(demo.url);
      await page.waitForLoadState('load');
      await expectReadable(page, demo.segments ?? []);
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await expectLinksWork(page);
    });
  }
});

test.describe('when a demo staging throws', () => {
  for (const demo of sample) {
    test(`${demo.url} goes back to the readable document and says why in the console`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      // Every staging puts its first layer in front of the captions (`shell.layer`),
      // and the shell itself never does: failing there fails the demo's own mount,
      // after the shell has attached.
      await page.addInitScript(() => {
        const before = Element.prototype.before;
        Element.prototype.before = function (this: Element, ...nodes: (Node | string)[]) {
          if (this.classList.contains('demo__captions')) {
            (window as unknown as { __stagingFailed?: boolean }).__stagingFailed = true;
            throw new Error('test: the staging fails');
          }
          before.apply(this, nodes);
        };
      });
      await page.goto(demo.url);
      // The staging did throw, and the shell said so in the console. (Engines word a
      // logged Error differently, so the console is asked only that there is one.)
      expect(
        await page.evaluate(
          () => (window as unknown as { __stagingFailed?: boolean }).__stagingFailed,
        ),
      ).toBe(true);
      await expect.poll(() => errors.length).toBeGreaterThan(0);
      await expectReadable(page, demo.segments ?? []);
      expect(await page.evaluate(() => window.__aliceDemo === undefined)).toBe(true);
      // Pinned chrome is gone too: no pause control for motion that is not there.
      await expect(page.locator('.demo__motion')).toBeHidden();
      await expect(page.locator('.demo__auto')).toBeHidden();
      await expectLinksWork(page);
    });
  }
});
