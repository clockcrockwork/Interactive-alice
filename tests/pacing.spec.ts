/**
 * How much of a Scene one ordinary gesture crosses.
 *
 * Issue #8's complaint about Rabbit Hole was perceptual — the scene read as a slide
 * deck rather than as travel — but it had an entirely measurable cause: a wheel notch
 * is a fixed 100 px however tall the track is, so the track's length decides how much
 * of a Scene one notch covers. At the original distance a notch crossed about one
 * whole Beat, and two Beats were shorter than a single notch, so one flick skipped
 * them.
 *
 * These assertions are the floor under *that* Scene's pacing, not pacing in general.
 * Physical distance is an art-directed decision per Scene, so a Scene of short
 * exchanges is entitled to a tempo Rabbit Hole would be wrong at, and nothing here
 * asks another Scene to clear Rabbit Hole's floor. What is pinned is that the defects
 * behind the issue #8 judgement cannot come back silently in the Scene they were
 * measured in — by shortening its track, by re-splitting its Beats, or by dropping the
 * input branch — and, in the other direction, that its distance stays its own rather
 * than becoming the runtime's policy for every Scene.
 *
 * Whether it *feels* like falling is still a judgement made by looking at the running
 * scene. Nothing below names a Beat, a Shot or a range. The notch is measured with a
 * real wheel event through the browser's own input pipeline, and the spans are read
 * from the markup the build wrote, so a mapping change moves these numbers rather than
 * breaking them.
 */

import { expect, type Page, test } from '@playwright/test';
import { pageGraph } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');

/** The one Scene issue #8 measured, and the only one these floors are about. */
const MEASURED = 'rabbit-hole';

/** Which class of pointer this project actually presents to the stylesheet. */
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

/** The shared default in src/styles/scene.css, in viewports. */
const BASE_VIEWPORTS = 5;

/**
 * The track length each Scene is supposed to get, in viewports, per pointer class.
 *
 * Only Rabbit Hole appears, because only Rabbit Hole art-directs a distance of its
 * own; every other Scene is expected on the shared base whatever the pointer is.
 * A Scene that later wants its own distance adds a line here, and having to do so
 * deliberately is the point: the row is what keeps one Scene's evidence from
 * quietly becoming every Scene's tempo.
 *
 * Asserted per project rather than by comparing two contexts, so each run proves
 * the branch it is actually exercising: the desktop project must be getting the
 * long track and the phone project the short one, and a stylesheet that lost the
 * pointer-keyed rule fails in the project that needed it.
 */
const EXPECTED_VIEWPORTS: Record<string, { fine: number; coarse: number }> = {
  [MEASURED]: { fine: 10, coarse: BASE_VIEWPORTS },
};

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;

  test(`${entry.url} gives each Scene the distance it art-directs`, async ({ page }) => {
    await page.goto(url);
    const pointer = await pointerOf(page);
    const scenes = await scenesOf(page);
    expect(scenes.length, 'the page stages at least one scene').toBeGreaterThan(0);

    for (const scene of scenes) {
      const expected = EXPECTED_VIEWPORTS[scene.id]?.[pointer] ?? BASE_VIEWPORTS;
      expect(scene.viewports, `${scene.id}: track length for a ${pointer} pointer`).toBeCloseTo(
        expected,
        1,
      );
    }
  });

  test(`${entry.url} outlasts one wheel gesture in every Beat that speaks`, async ({ page }) => {
    await page.goto(url);
    // A step-wise-input contract, so it is only meaningful where the pointer is one.
    // A flick is not a fixed step, and touch is deliberately given the shorter track.
    test.skip((await pointerOf(page)) !== 'fine', 'not a desktop-class pointer');

    const scenes = (await scenesOf(page)).filter((scene) => scene.id === MEASURED);
    test.skip(scenes.length === 0, `no ${MEASURED} on this page`);

    const notch = await notchPx(page);
    for (const scene of scenes) {
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
