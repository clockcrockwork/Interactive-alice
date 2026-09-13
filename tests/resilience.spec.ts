/**
 * What the experience does when it is interrupted, broken, or read in a language
 * the site does not have yet.
 *
 * Every test here drives a real document: the seam only sets progress, it never
 * stands in for the browser's own behaviour.
 */

import { fileURLToPath } from 'node:url';
import type { Page, Route } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { generatePagesFrom } from '../build/pages.ts';
import { loadProject } from '../build/project.ts';
import { geometryOf, progressOf, sampleOf, stateOf } from './drive.ts';
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

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;
  const scene = entry.scenes?.[0] ?? '';

  test(`${entry.url} holds a seam value while suspended and draws nothing`, async ({ page }) => {
    await page.goto(url);
    // Wait for the scene to be running before suspending it. `pagehide` dispatched
    // into a page that is still mounting suspends a scene the intersection observer
    // then resumes a moment later, and the test measures the mount instead of the
    // suspension. It was flaky for exactly that reason before anything here changed.
    await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(await stateOf(page, scene)).toBe('suspended');

    const before = await page.locator(`.scene[data-scene="${scene}"]`).innerHTML();
    await page.evaluate((id) => window.__alice?.setProgress(id, 0.8), scene);
    expect(await page.locator(`.scene[data-scene="${scene}"]`).innerHTML()).toBe(before);

    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await expect.poll(() => progressOf(page, scene)).toBeCloseTo(0.8, 3);
  });

  test(`${entry.url} stays suspended while the page is hidden, whatever the geometry says`, async ({
    page,
  }) => {
    await page.goto(url);
    await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

    // A hidden page has no viewport to be on screen in, so nothing that speaks for
    // the geometry may put a scene back to work: not a queued intersection callback,
    // not a resize, not scrolling. Held for long enough that a late callback from
    // the frame before `pagehide` has certainly been delivered.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(400);
    expect(await stateOf(page, scene)).toBe('suspended');

    // ...and `pageshow` is what ends it, from the geometry as it is then.
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
  });

  test(`${entry.url} re-reads the real position when it comes back`, async ({ page }) => {
    await page.goto(url);
    await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
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
    await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
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

/**
 * `direction` means the way a reader is travelling. A value that arrives without
 * anyone scrolling is a jump, and a jump has no direction and no speed.
 */
for (const entry of parts) {
  const url = `${entry.url}?probe=1`;
  const scene = entry.scenes?.[0] ?? '';

  test(`${entry.url} calls a restore a jump, not a reverse`, async ({ page }) => {
    await page.goto(url);
    const { top, travel } = await geometryOf(page, scene);

    await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.8);
    await expect.poll(() => sampleOf(page, scene).then((s) => s.progress)).toBeCloseTo(0.8, 2);

    // Away, moved, and back: the reader never scrolled upwards.
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.1);
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));

    await expect.poll(() => sampleOf(page, scene).then((s) => s.progress)).toBeCloseTo(0.1, 2);
    const sample = await sampleOf(page, scene);
    expect(sample.direction).toBe(0);
    expect(sample.velocity).toBe(0);

    // Real scrolling afterwards reads as real scrolling again.
    await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.3);
    await expect.poll(() => sampleOf(page, scene).then((s) => s.direction)).toBe(1);
  });

  test(`${entry.url} calls a seam jump a jump too`, async ({ page }) => {
    await page.goto(url);
    const { top, travel } = await geometryOf(page, scene);
    await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.2);
    await expect.poll(() => sampleOf(page, scene).then((s) => s.progress)).toBeCloseTo(0.2, 2);

    await page.evaluate((id) => window.__alice?.setProgress(id, 0.7), scene);
    let sample = await sampleOf(page, scene);
    expect(sample.progress).toBeCloseTo(0.7, 6);
    expect(sample.direction).toBe(0);
    expect(sample.velocity).toBe(0);

    // Releasing the hold returns to the document's own position, also without motion.
    await page.evaluate((id) => window.__alice?.releaseProgress(id), scene);
    await expect.poll(() => sampleOf(page, scene).then((s) => s.progress)).toBeCloseTo(0.2, 2);
    sample = await sampleOf(page, scene);
    expect(sample.direction).toBe(0);
    expect(sample.velocity).toBe(0);
  });
}

test.describe('a document where only one scene is broken', () => {
  test('stays readable as a whole rather than staging half of it', async ({ page }) => {
    test.skip(!first, 'no part pages in the manifest');
    const target = first as NonNullable<typeof first>;

    // Staging is a decision about the document: the stylesheet keys off the story,
    // so a scene left out of staging would be laid out as if it were in it. One
    // scene that cannot be driven therefore leaves the whole document in flow.
    await serveRewritten(page, target.url, (html) =>
      html.replace(
        '</main>',
        '<div class="scene" data-scene="broken"><div class="shot" data-shot="s"></div></div></main>',
      ),
    );
    await page.goto(target.url);

    const story = page.locator('.story');
    await expect(story).toHaveAttribute('data-degraded', 'markup');
    await expect(story).not.toHaveAttribute('data-mode', 'scene');

    const lines = page.locator('.line');
    await expect(lines).toHaveCount(target.segments?.length ?? 0);
    await expect(lines.first()).toBeVisible();
    await expect(lines.last()).toBeVisible();
  });
});

test.describe('a language that is behind', () => {
  // No published page is in this state: both languages are complete today. Rather
  // than add a fake language to the site, the real generator is run over a project
  // with one chapter taken away, and its pages are served at their own addresses.
  const root = fileURLToPath(new URL('..', import.meta.url));
  const behind = () => {
    const project = loadProject(root);
    project.text.get('ja')?.delete(1);
    return project;
  };

  const serveGenerated = async (page: Page, path: string, url: string) => {
    const html = generatePagesFrom(behind()).pages.find((candidate) => candidate.path === path);
    if (!html) {
      throw new Error(`the generator produced no ${path}`);
    }
    // The generator writes the pre-build stylesheet path; the published page carries
    // the hashed one. Take it from the real response so this page is styled the way a
    // reader would see it, which is what makes a layout assertion mean anything.
    await serveRewritten(page, url, (published) => {
      const link = /<link rel="stylesheet"[^>]*>/.exec(published)?.[0];
      return link ? html.html.replace(/<link rel="stylesheet"[^>]*\/?>/, link) : html.html;
    });
  };

  test('says on its entry why a part cannot be read, and does not link it', async ({ page }) => {
    const strings = behind().ui.get('ja')?.partPending ?? '';
    await serveGenerated(page, 'ja/index.html', './ja/');
    await page.goto('./ja/');

    const item = page.locator('.entry__part[data-part="rabbit-hole"]');
    await expect(item).toHaveAttribute('data-available', 'false');
    await expect(item.locator('a')).toHaveCount(0);
    await expect(item.locator('.entry__part-status')).toHaveText(strings);

    // The title it cannot translate yet is shown in the base locale, and carries that
    // language's own direction rather than inheriting this page's.
    const title = item.locator('.entry__part-title');
    await expect(title).toHaveAttribute('lang', 'en-simple');
    await expect(title).toHaveAttribute('dir', 'ltr');

    // Laid out, not merely present: the note sits under the title rather than running
    // into it, and both have a box a reader can see.
    const titleBox = await title.boundingBox();
    const statusBox = await item.locator('.entry__part-status').boundingBox();
    expect(titleBox?.height ?? 0).toBeGreaterThan(0);
    expect(statusBox?.height ?? 0).toBeGreaterThan(0);
    expect(statusBox?.y ?? 0).toBeGreaterThanOrEqual((titleBox?.y ?? 0) + (titleBox?.height ?? 0));
  });

  test('says on the home page that it cannot be read yet, and still links it', async ({ page }) => {
    const strings = behind().ui.get('ja')?.localeNone ?? '';
    await serveGenerated(page, 'index.html', './');
    await page.goto('./');

    const item = page.locator('.home__locale[data-locale="ja"]');
    await expect(item).toHaveAttribute('data-availability', 'none');
    await expect(item.locator('.home__status')).toHaveText(strings);
    await expect(item.locator('.home__status')).toHaveAttribute('lang', 'ja');
    await expect(item.locator('a')).toHaveAttribute('href', './ja/');

    // The complete language says nothing, because there is nothing to warn about.
    const full = page.locator('.home__locale[data-locale="en-simple"]');
    await expect(full).toHaveAttribute('data-availability', 'full');
    await expect(full.locator('.home__status')).toHaveCount(0);

    const linkBox = await item.locator('a').boundingBox();
    const statusBox = await item.locator('.home__status').boundingBox();
    expect(statusBox?.height ?? 0).toBeGreaterThan(0);
    expect(statusBox?.y ?? 0).toBeGreaterThanOrEqual((linkBox?.y ?? 0) + (linkBox?.height ?? 0));
  });
});

test.describe('back and forward', () => {
  test('restores the scroll position and the progress that follows from it', async ({ page }) => {
    test.skip(!first, 'no part pages in the manifest');
    const target = first as NonNullable<typeof first>;
    const scene = target.scenes?.[0] ?? '';
    const back = entries.find((candidate) => candidate.locale === target.locale)?.url ?? './';

    await page.goto(`${target.url}?probe=1`);
    // Running before scrolling, and polled rather than read once afterwards. A
    // scene that has not been resumed yet is not ticked, so it truthfully reports
    // progress 0 from a document that has already scrolled; reading immediately
    // measures how quickly the intersection callback arrived rather than anything
    // about restoring a position.
    await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
    await page.evaluate(() => window.scrollTo(0, 1800));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800);
    await expect.poll(() => progressOf(page, scene), { timeout: 5000 }).toBeGreaterThan(0);
    const progress = await progressOf(page, scene);

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
