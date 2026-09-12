import { expect, test } from '@playwright/test';
import { pageGraph } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');

/** Progression-critical state. Velocity is deliberately absent: it is a function of
 * timing, not of progress, and nothing narrative may depend on it. */
interface Progression {
  progress: number;
  shot: string | undefined;
  beat: string | undefined;
  beats: Record<string, string>;
}

const progression = async (page: import('@playwright/test').Page): Promise<Progression> =>
  page.evaluate(() => {
    const snapshot = window.__alice?.snapshot()[0];
    const beats: Record<string, string> = {};
    for (const element of document.querySelectorAll<HTMLElement>('.beat')) {
      const id = element.dataset.beat ?? '';
      beats[id] = `${element.dataset.state}:${element.style.getPropertyValue('--progress')}`;
    }
    return {
      progress: snapshot?.progress ?? -1,
      shot: snapshot?.shot,
      beat: snapshot?.beat,
      beats,
    };
  });

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;

  test(`${entry.url} reconstructs the same state when scrolled back`, async ({ page }) => {
    await page.goto(url);

    const boundaries = await page
      .locator('.shot')
      .evaluateAll((nodes) => nodes.flatMap((node) => [Number(node.dataset.start)]));
    // Every shot boundary, plus a point inside the last shot and both ends.
    const points = [...new Set([0, ...boundaries, 0.93, 1])].sort((a, b) => a - b);

    for (const point of points) {
      await page.evaluate((value) => window.__alice?.setProgress(value), point);
      const before = await progression(page);

      // Go forward, then come back to the same progress.
      await page.evaluate((value) => window.__alice?.setProgress(Math.min(value + 0.2, 1)), point);
      await page.evaluate((value) => window.__alice?.setProgress(value), point);
      const after = await progression(page);

      expect(after, `progress ${point} did not reconstruct`).toEqual(before);
    }
  });

  test(`${entry.url} agrees with the markup about the active shot and beat`, async ({ page }) => {
    await page.goto(url);

    for (const point of [0.05, 0.2, 0.45, 0.7, 0.95]) {
      await page.evaluate((value) => window.__alice?.setProgress(value), point);
      const state = await progression(page);

      const activeShot = await page.locator('.shot[data-state="active"]').getAttribute('data-shot');
      expect(activeShot).toBe(state.shot);

      const activeBeats = await page
        .locator('.beat[data-state="active"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-beat')));
      expect(activeBeats).toEqual([state.beat]);
    }
  });

  test(`${entry.url} reaches both ends by scrolling alone`, async ({ page }) => {
    await page.goto(url);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => (await progression(page)).progress, { timeout: 5000 })
      .toBeGreaterThan(0.99);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(async () => (await progression(page)).progress, { timeout: 5000 })
      .toBeLessThan(0.01);
  });

  test(`${entry.url} survives a resize without losing its composition`, async ({ page }) => {
    await page.goto(url);
    await page.evaluate(() => window.__alice?.setProgress(0.5));
    const before = await progression(page);

    await page.setViewportSize({ width: 420, height: 820 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    const after = await progression(page);

    expect(after.progress).toBeCloseTo(before.progress, 6);
    expect(after.shot).toBe(before.shot);
    expect(after.beat).toBe(before.beat);
  });
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const entry of parts) {
    test(`${entry.url} drops the drift and lowers the tier`, async ({ page }) => {
      await page.goto(`${entry.url}?probe=1`);
      await page.evaluate(() => window.__alice?.setProgress(0.5));

      const snapshot = await page.evaluate(() => window.__alice?.snapshot()[0]);
      expect(snapshot?.reducedMotion).toBe(true);
      expect(snapshot?.quality).toBe('reduced');

      const translate = await page
        .locator('.beat[data-state="active"]')
        .evaluate((node) => getComputedStyle(node).translate);
      expect(translate).toBe('none');
    });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const entry of parts) {
    test(`${entry.url} stays a readable document`, async ({ page }) => {
      await page.goto(entry.url);

      await expect(page.locator('.story')).not.toHaveAttribute('data-mode', 'scene');
      const lines = page.locator('.line');
      await expect(lines).toHaveCount(entry.segments?.length ?? 0);
      await expect(lines.first()).toBeVisible();
      await expect(lines.last()).toBeVisible();
    });
  }
});
