/**
 * How much of a Scene one ordinary gesture crosses.
 *
 * Issue #8's complaint was perceptual — the scene read as a slide deck rather than
 * as travel — but it had an entirely measurable cause: a wheel notch is a fixed
 * 100 px however tall the track is, so the track's length decides how much of a
 * Scene one notch covers. At the original distance a notch crossed about one whole
 * Beat, and two Beats were shorter than a single notch, so one flick skipped them.
 *
 * These assertions are the floor under the pacing, not the pacing itself. Whether
 * it *feels* like falling is a judgement made by looking at the running scene; what
 * is pinned here is that the defects behind that judgement cannot come back
 * silently — by shortening the track, by re-splitting the Beats, or by dropping the
 * input branch.
 *
 * Nothing below names a Beat, a Shot or a range. The notch is measured with a real
 * wheel event through the browser's own input pipeline, and the spans are read from
 * the markup the build wrote, so a mapping change moves these numbers rather than
 * breaking them.
 */

import { expect, type Page, test } from '@playwright/test';
import { pageGraph } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');

/** Which kind of pointer this project actually presents to the stylesheet. */
const pointerOf = (page: Page) =>
  page.evaluate(() => (matchMedia('(pointer: fine)').matches ? 'fine' : 'coarse'));

/**
 * One wheel notch, in pixels, as this browser actually scrolls it.
 *
 * Measured rather than assumed: `deltaY: 100` is the conventional notch, but what
 * the page moves in response is the browser's decision, and asserting against a
 * constant would be asserting against that decision instead of against the scene.
 */
async function notchPx(page: Page): Promise<number> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(60, 60);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(600);
  const moved = (await page.evaluate(() => window.scrollY)) - before;
  expect(moved, 'a wheel notch scrolls the page').toBeGreaterThan(0);
  return moved;
}

/** Every scene's geometry, and the span of each Beat that carries text. */
const scenesOf = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.scene')].map((scene) => {
      const track = scene.querySelector<HTMLElement>('[data-scene-track]');
      const stage = scene.querySelector<HTMLElement>('[data-scene-stage]');
      const height = track?.getBoundingClientRect().height ?? 0;
      const travel = height - (stage?.getBoundingClientRect().height ?? 0);
      return {
        id: scene.dataset.scene ?? '',
        travel,
        /** Track height in viewports, which is what `--scene-length` states. */
        viewports: height / window.innerHeight,
        // Textless Beats are staging and are allowed to be brief; what a reader
        // can be robbed of is a Beat that says something.
        text: [...scene.querySelectorAll<HTMLElement>('.beat')]
          .filter((beat) => beat.querySelectorAll('.line').length > 0)
          .map((beat) => (Number(beat.dataset.end) - Number(beat.dataset.start)) * travel),
      };
    }),
  );

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

/**
 * The track length each class of input is supposed to get, in viewports.
 *
 * Asserted per project rather than by comparing two contexts, so each run proves
 * the branch it is actually exercising: the desktop project must be getting the
 * long track and the phone project the short one, and a stylesheet that lost the
 * `@media (pointer: fine)` rule fails in the project that needed it.
 */
const EXPECTED_VIEWPORTS = { fine: 10, coarse: 5 } as const;

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;

  test(`${entry.url} gives each class of input its own track length`, async ({ page }) => {
    await page.goto(url);
    const pointer = await pointerOf(page);
    const scenes = await scenesOf(page);
    expect(scenes.length, 'the page stages at least one scene').toBeGreaterThan(0);

    for (const scene of scenes) {
      expect(scene.viewports, `${scene.id}: track length for a ${pointer} pointer`).toBeCloseTo(
        EXPECTED_VIEWPORTS[pointer],
        1,
      );
    }
  });

  test(`${entry.url} outlasts one wheel gesture in every Beat that speaks`, async ({ page }) => {
    await page.goto(url);
    // A wheel contract, so it is only meaningful where the pointer is a wheel. A
    // flick is not a fixed step, and touch is deliberately given the shorter track.
    test.skip((await pointerOf(page)) !== 'fine', 'not a wheel-driven pointer');

    const notch = await notchPx(page);
    for (const scene of await scenesOf(page)) {
      const notches = scene.text.map((px) => px / notch);

      // No Beat shorter than a gesture. Below this a reader who flicks once never
      // sees that sentence at all, which the baseline found twice over. Measured
      // across the desktop viewports in the matrix, the shortest Beat runs 1.89
      // notches at 1280x720 and 2.68 at 1280x1024; the floor sits under the worst
      // of those and far above the 0.7 the defect produced.
      expect(Math.min(...notches), `${scene.id}: shortest Beat, in wheel notches`).toBeGreaterThan(
        1.5,
      );

      // ...and the typical Beat has to outlast an ordinary three-to-five notch
      // gesture, or the scene still advances a slide per gesture however long its
      // shortest Beat is. 4.38 at the shortest desktop viewport today; halving the
      // track would put it at 2.2 and fail here.
      expect(median(notches), `${scene.id}: median Beat, in wheel notches`).toBeGreaterThan(3.5);
    }
  });
}
