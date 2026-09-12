/**
 * What the experience does when it is interrupted, broken, or read in a language
 * the site does not have yet.
 *
 * Every test here drives a real document: the seam only sets progress, it never
 * stands in for the browser's own behaviour.
 */

import type { Page, Route } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { pageGraph } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');
const entries = pageGraph().filter((page) => page.kind === 'locale');
const first = parts[0];

/** The path a manifest url points at, e.g. "./ja/rabbit-hole/" -> "/ja/rabbit-hole/". */
const pathOf = (url: string): string => new URL(url, 'http://localhost/').pathname;

/** Serve one page with its HTML rewritten, to stage a document we never publish. */
async function serveRewritten(page: Page, url: string, rewrite: (html: string) => string) {
  const path = pathOf(url);
  await page.route(
    (candidate) => candidate.pathname === path,
    async (route: Route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: rewrite(await response.text()) });
    },
  );
}

const progressOf = (page: Page, scene: string) =>
  page.evaluate((id) => window.__alice?.snapshot(id)[0]?.progress ?? -1, scene);

const stateOf = (page: Page, scene: string) =>
  page.evaluate((id) => window.__alice?.snapshot(id)[0]?.state ?? '', scene);

/**
 * Where this scene starts scrolling and how far it travels, read from the document.
 *
 * The runtime measures the same way, so a scroll target computed from this lands on
 * the progress it names; a page-relative guess would be off by whatever sits above
 * the track.
 */
const geometryOf = (page: Page, scene: string) =>
  page.evaluate((id) => {
    const track = document.querySelector<HTMLElement>(
      `.scene[data-scene="${id}"] [data-scene-track]`,
    );
    const stage = document.querySelector<HTMLElement>(
      `.scene[data-scene="${id}"] [data-scene-stage]`,
    );
    if (!track || !stage) {
      return { top: 0, travel: 1 };
    }
    return {
      top: track.getBoundingClientRect().top + window.scrollY,
      travel: track.getBoundingClientRect().height - stage.getBoundingClientRect().height,
    };
  }, scene);

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;
  const scene = entry.scenes?.[0] ?? '';

  test(`${entry.url} holds a seam value while suspended and draws nothing`, async ({ page }) => {
    await page.goto(url);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(await stateOf(page, scene)).toBe('suspended');

    const before = await page.locator(`.scene[data-scene="${scene}"]`).innerHTML();
    await page.evaluate((id) => window.__alice?.setProgress(id, 0.8), scene);
    expect(await page.locator(`.scene[data-scene="${scene}"]`).innerHTML()).toBe(before);

    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await expect.poll(() => progressOf(page, scene)).toBeCloseTo(0.8, 3);
  });

  test(`${entry.url} re-reads the real position when it comes back`, async ({ page }) => {
    await page.goto(url);
    const { top, travel } = await geometryOf(page, scene);

    // Suspend, hold a value, drop the hold, and move the document while it is away.
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.evaluate((id) => window.__alice?.setProgress(id, 0.9), scene);
    await page.evaluate((id) => window.__alice?.releaseProgress(id), scene);
    await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.25);

    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));

    // The held value was the seam's; where the page now is, is the document's.
    await expect.poll(() => progressOf(page, scene)).toBeCloseTo(0.25, 2);
  });

  test(`${entry.url} applies flags set while suspended, then the real position`, async ({
    page,
  }) => {
    await page.goto(url);
    const { top, travel } = await geometryOf(page, scene);

    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.evaluate((id) => window.__alice?.setFlags({ quality: 'reduced' }, id), scene);
    await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.4);
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));

    await expect.poll(() => progressOf(page, scene)).toBeCloseTo(0.4, 2);
    expect(await page.evaluate((id) => window.__alice?.snapshot(id)[0]?.quality, scene)).toBe(
      'reduced',
    );
  });
}

test.describe('a document the runtime cannot stage', () => {
  test('says so on the page and stays readable', async ({ page }) => {
    test.skip(!first, 'no part pages in the manifest');
    const target = first as NonNullable<typeof first>;

    // A scene without a track cannot be driven. The words must still be there.
    await serveRewritten(page, target.url, (html) =>
      html.replaceAll('data-scene-track', 'data-scene-track-broken'),
    );
    await page.goto(target.url);

    const story = page.locator('.story');
    await expect(story).toHaveAttribute('data-degraded', 'markup');
    await expect(story).not.toHaveAttribute('data-mode', 'scene');
    await expect(story).not.toHaveAttribute('data-ready', 'true');

    const lines = page.locator('.line');
    await expect(lines).toHaveCount(target.segments?.length ?? 0);
    await expect(lines.first()).toBeVisible();
    await expect(lines.last()).toBeVisible();
  });
});

test.describe('back and forward', () => {
  test('restores the scroll position and the progress that follows from it', async ({ page }) => {
    test.skip(!first, 'no part pages in the manifest');
    const target = first as NonNullable<typeof first>;
    const scene = target.scenes?.[0] ?? '';
    const back = entries.find((candidate) => candidate.locale === target.locale)?.url ?? './';

    await page.goto(`${target.url}?probe=1`);
    await page.evaluate(() => window.scrollTo(0, 1800));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800);
    const progress = await progressOf(page, scene);
    expect(progress).toBeGreaterThan(0);

    await page.goto(back);
    await page.goBack();

    // Whether the document came from the back/forward cache or was rebuilt, the
    // reader must land where they left. `pageshow.persisted` is a browser decision
    // and is deliberately not asserted here; see docs/performance-budget.md.
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(1800);
    await expect.poll(() => progressOf(page, scene)).toBeCloseTo(progress, 2);
  });
});

test.describe('a right-to-left language', () => {
  test('lays the same document out without breaking or overflowing', async ({ page }) => {
    test.skip(!first, 'no part pages in the manifest');
    const target = first as NonNullable<typeof first>;
    const scene = target.scenes?.[0] ?? '';

    // No right-to-left language is registered yet. Rather than publish a fake one,
    // the same document is served with its direction flipped: that is enough to
    // prove the layout is logical rather than left-to-right with the sides named.
    await serveRewritten(page, target.url, (html) => html.replaceAll('dir="ltr"', 'dir="rtl"'));
    await page.goto(`${target.url}?probe=1`);

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(
      await page
        .locator('.line')
        .first()
        .evaluate((node) => getComputedStyle(node).direction),
    ).toBe('rtl');

    await page.evaluate((id) => window.__alice?.setProgress(id, 0.5), scene);
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

    const beat = page.locator(`.scene[data-scene="${scene}"] .beat[data-state="active"]`).first();
    await expect(beat).toBeVisible();
  });
});
