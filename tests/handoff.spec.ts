/**
 * Two scenes in one document, and what a scene does when it leaves the screen.
 *
 * Everything here moves the real page. The suspension under test is the one a real
 * `IntersectionObserver` decides on, not a lifecycle call standing in for it: a
 * fake observer would prove that `suspend` suspends, which was never in doubt, and
 * would say nothing about whether the geometry ever takes a scene off screen. That
 * is the part a single-scene document could not show at all, because its document
 * ended before its only scene did.
 */

import { expect, type Page, test } from '@playwright/test';
import {
  expectProgress,
  geometryOf,
  progressOf,
  sampleOf,
  scrollBy,
  scrollToProgress,
  stateOf,
} from './drive.ts';
import { pageGraph } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');
/** Documents that host more than one scene: the only ones with a handoff to prove. */
const shared = parts.filter((entry) => (entry.scenes ?? []).length > 1);

/**
 * The scroll position at which a scene has left the top of the viewport entirely.
 *
 * A scene's sticky stage travels with the end of its track, so the scene is off
 * screen once the document has scrolled past the whole of it. A few pixels of slack
 * past the exact edge, because a boundary that lands on zero is a coin toss between
 * intersecting and not, and the question here is what happens well clear of it.
 */
const pastScene = async (page: Page, scene: string): Promise<number> => {
  const { top } = await geometryOf(page, scene);
  const height = await page
    .locator(`.scene[data-scene="${scene}"]`)
    .evaluate((node) => node.getBoundingClientRect().height);
  const limit = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const target = top + height + 16;
  if (target > limit) {
    // The document cannot scroll far enough, which is the normal case for the
    // last scene on a page. Clamping would return a position where the scene is
    // still visible, and the caller's wait for `suspended` would then time out
    // blaming the runtime for a question this helper could not ask.
    throw new Error(`${scene} is the last scene on this page; it never leaves the viewport`);
  }
  return target;
};

test('the story declares a document with two scenes in it', () => {
  // If this ever stops being true the suite below silently proves nothing, so it
  // fails here instead of quietly skipping.
  expect(shared.length, 'no part page hosts two scenes').toBeGreaterThan(0);
});

for (const entry of shared) {
  const url = `${entry.url}?probe=1`;
  const scenes = entry.scenes ?? [];
  const first = scenes[0] as string;
  const second = scenes[1] as string;

  test(`${entry.url} reaches the second scene by scrolling alone`, async ({ page }) => {
    await page.goto(url);

    // The first scene is where a reader starts, and the second has not begun.
    expect(await progressOf(page, first)).toBeLessThan(0.01);
    expect(await progressOf(page, second)).toBeLessThan(0.01);

    await scrollToProgress(page, first, 1);
    await expect.poll(() => progressOf(page, first), { timeout: 5000 }).toBeGreaterThan(0.99);

    await scrollToProgress(page, second, 0.5);
    await expectProgress(page, second, 0.5);

    // Back again, by scrolling, to the middle of the first.
    await scrollToProgress(page, first, 0.5);
    await expectProgress(page, first, 0.5);
  });

  test(`${entry.url} gives each scene its own progress, with nothing shared`, async ({ page }) => {
    await page.goto(url);

    // Halfway through the first scene, the second has not started: there is no
    // document-wide progress value for them to divide between them.
    await scrollToProgress(page, first, 0.5);
    await expectProgress(page, first, 0.5);
    expect(await progressOf(page, second)).toBe(0);

    // Halfway through the second, the first is spent rather than halfway too.
    await scrollToProgress(page, second, 0.5);
    await expectProgress(page, second, 0.5);
    expect(await progressOf(page, first)).toBeCloseTo(1, 2);
  });

  test(`${entry.url} addresses each scene separately through the probe`, async ({ page }) => {
    await page.goto(url);
    expect(await page.evaluate(() => window.__alice?.scenes())).toEqual(scenes);

    // One scene named, one scene answered. Driving every scene on a page to one
    // value is a state real scrolling never produces, so the seam does not do it
    // by accident.
    const snapshots = await page.evaluate((id) => window.__alice?.snapshot(id), first);
    expect(snapshots).toHaveLength(1);
    expect(snapshots?.[0]?.scene).toBe(first);
    expect(await page.evaluate(() => window.__alice?.snapshot())).toHaveLength(scenes.length);
    await expect(page.evaluate(() => window.__alice?.snapshot('no-such-scene'))).rejects.toThrow(
      /no scene no-such-scene/,
    );
  });

  test(`${entry.url} starts with only the scene on screen running`, async ({ page }) => {
    // Read on the first frame, before any intersection callback can have arrived:
    // the initial observation is delivered after this frame's animation callbacks,
    // so a scene that waited for it would have run a frame from off screen.
    await page.addInitScript(() => {
      // Watch every frame from before the page's script runs, and record the very
      // first one on which the runtime exists. Animation callbacks run before
      // intersection observations are delivered, so this is the state the runtime
      // reached on its own, without the observer having said anything yet.
      const look = () => {
        const probe = window.__alice;
        if (!probe) {
          requestAnimationFrame(look);
          return;
        }
        (window as unknown as { __first?: unknown }).__first = probe
          .snapshot()
          .map((snapshot) => `${snapshot.scene}=${snapshot.state}`);
      };
      requestAnimationFrame(look);
    });
    await page.goto(url);
    await expect
      .poll(() => page.evaluate(() => (window as { __first?: unknown }).__first))
      .toEqual([`${first}=active`, `${second}=suspended`]);

    // And it stays that way, rather than being corrected a frame later.
    expect(await stateOf(page, first)).toBe('active');
    expect(await stateOf(page, second)).toBe('suspended');
    expect(await progressOf(page, second)).toBe(0);
  });

  /**
   * The same contract on the paths that move a scene relative to the viewport
   * without anyone scrolling.
   *
   * The observer is silenced for these, so nothing can pass by being corrected a
   * frame later: whatever the lifecycle says has to have come from the runtime
   * reading the geometry itself. That is the whole claim, and an observer left
   * running would hide a failure to make it.
   */
  test.describe('with the intersection observer silenced', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        const Real = window.IntersectionObserver;
        window.IntersectionObserver = class extends Real {
          constructor() {
            // Observes nothing and reports nothing. `disconnect` and `observe`
            // still exist, so the runtime attaches and tears down as usual.
            super(() => {});
          }
        } as typeof IntersectionObserver;
      });
    });

    test(`${entry.url} places every scene at mount`, async ({ page }) => {
      await page.goto(url);
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');
      expect(await stateOf(page, second)).toBe('suspended');
    });

    test(`${entry.url} replaces them when a resize moves the viewport past one`, async ({
      page,
    }) => {
      await page.goto(url);
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');

      // Put the second scene on screen and the first off it. Nothing has told the
      // runtime yet: scrolling is the observer's job, and it has been silenced.
      await page.evaluate((to) => window.scrollTo(0, to), await pastScene(page, first));
      expect(await stateOf(page, first), 'before the resize').toBe('active');
      expect(await stateOf(page, second), 'before the resize').toBe('suspended');

      // A resize is a path that reads the geometry, so it settles both.
      await page.setViewportSize({ width: 900, height: 600 });
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('suspended');
      expect(await stateOf(page, second)).toBe('active');
    });

    test(`${entry.url} replaces them again when the page is restored`, async ({ page }) => {
      await page.goto(url);
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');

      await page.evaluate((to) => window.scrollTo(0, to), await pastScene(page, first));
      await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      expect(await stateOf(page, first)).toBe('suspended');
      expect(await stateOf(page, second)).toBe('suspended');

      // Coming back reads where the scenes now are, rather than trusting what was
      // true when the page was put away.
      await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
      await expect.poll(() => stateOf(page, second), { timeout: 5000 }).toBe('active');
      expect(await stateOf(page, first)).toBe('suspended');
      await expectProgress(page, second, 0);
    });
  });

  test(`${entry.url} suspends a scene once it is off screen, and stops advancing it`, async ({
    page,
  }) => {
    await page.goto(url);
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');

    // Scroll clear of the first scene. Nothing of it is in the viewport now.
    await page.evaluate((to) => window.scrollTo(0, to), await pastScene(page, first));
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('suspended');
    // The scene that is now on screen is running.
    await expect.poll(() => stateOf(page, second), { timeout: 5000 }).toBe('active');

    // A suspended scene does not advance. Keep scrolling, inside the second
    // scene's own travel, and read the first one again.
    const held = await progressOf(page, first);
    await scrollToProgress(page, second, 0.4);
    await expectProgress(page, second, 0.4);
    await scrollToProgress(page, second, 0.8);
    await expectProgress(page, second, 0.8);

    expect(await stateOf(page, first)).toBe('suspended');
    expect(await progressOf(page, first)).toBe(held);
  });

  test(`${entry.url} resumes a scene from geometry, as a jump rather than travel`, async ({
    page,
  }) => {
    await page.goto(url);
    await page.evaluate((to) => window.scrollTo(0, to), await pastScene(page, first));
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('suspended');

    // Come back to the middle of the first scene in one movement.
    await scrollToProgress(page, first, 0.5);
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');

    // It resynchronises onto where the document actually is.
    await expectProgress(page, first, 0.5);
    const resumed = await sampleOf(page, first);
    // And that value did not arrive by anybody travelling: a restore is not motion.
    expect(resumed.direction).toBe(0);
    expect(resumed.velocity).toBe(0);
  });

  test(`${entry.url} reads real scrolling as movement again after a resume`, async ({ page }) => {
    await page.goto(url);
    await page.evaluate((to) => window.scrollTo(0, to), await pastScene(page, first));
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('suspended');

    await scrollToProgress(page, first, 0.5);
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');
    await expectProgress(page, first, 0.5);
    expect((await sampleOf(page, first)).direction).toBe(0);

    // Scrolled, rather than jumped: several frames of real movement in each
    // direction, which is what `direction` is a statement about.
    await scrollBy(page, first, 0.5, 0.62);
    await expect
      .poll(async () => (await sampleOf(page, first)).direction, { timeout: 2000 })
      .toBe(1);

    await scrollBy(page, first, 0.62, 0.5);
    await expect
      .poll(async () => (await sampleOf(page, first)).direction, { timeout: 2000 })
      .toBe(-1);
  });

  test(`${entry.url} keeps one scroll listener and one frame loop for the document`, async ({
    page,
  }) => {
    // Instrumented before the page's script runs, so this measures the runtime
    // rather than a guess about it. Two scenes must not cost two listeners or two
    // frame loops; see docs/performance-budget.md §4.
    await page.addInitScript(() => {
      const counts = { scroll: 0, resize: 0, callbacks: 0, frames: new Set<number>() };
      (window as unknown as { __counts: typeof counts }).__counts = counts;

      const addListener = window.addEventListener.bind(window);
      window.addEventListener = ((type: string, ...rest: unknown[]) => {
        if (type === 'scroll' || type === 'resize') {
          counts[type] += 1;
        }
        return (addListener as unknown as (...args: unknown[]) => void)(type, ...rest);
      }) as typeof window.addEventListener;

      // Every callback is counted, and so is the animation frame it ran in. One
      // loop puts one callback in each frame; a loop per scene puts one per scene
      // in the same frame, which is the thing being ruled out. Counting callbacks
      // alone would only measure the display's refresh rate.
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
        raf((time) => {
          counts.callbacks += 1;
          counts.frames.add(time);
          callback(time);
        })) as typeof window.requestAnimationFrame;
    });

    await page.goto(url);
    await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');

    const listeners = await page.evaluate(
      () => (window as unknown as { __counts: { scroll: number; resize: number } }).__counts,
    );
    // One each, for however many scenes the document turns out to host.
    expect(listeners.scroll).toBe(1);
    expect(listeners.resize).toBe(1);

    // Scroll the whole document, through the window where both scenes are on
    // screen at once, without using a frame callback to wait: every frame counted
    // below is one the runtime asked for.
    await page.evaluate(() => {
      const counts = (window as unknown as { __counts: { callbacks: number; frames: Set<number> } })
        .__counts;
      counts.callbacks = 0;
      counts.frames.clear();
    });
    await page.evaluate(async () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (let step = 0; step <= 40; step += 1) {
        window.scrollTo(0, (max * step) / 40);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    const work = await page.evaluate(() => {
      const counts = (window as unknown as { __counts: { callbacks: number; frames: Set<number> } })
        .__counts;
      return { callbacks: counts.callbacks, frames: counts.frames.size };
    });

    expect(work.frames, 'the runtime never ran a frame').toBeGreaterThan(10);
    // One callback per frame. A loop per scene would put one callback per scene in
    // each frame, so this ratio would be the number of scenes rather than one.
    expect(work.callbacks / work.frames).toBeLessThan(1.2);
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  for (const entry of shared) {
    const scenes = entry.scenes ?? [];
    const first = scenes[0] as string;

    test(`${entry.url} suspends and resumes at phone width too`, async ({ page }) => {
      await page.goto(`${entry.url}?probe=1`);
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');

      await page.evaluate((to) => window.scrollTo(0, to), await pastScene(page, first));
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('suspended');

      await scrollToProgress(page, first, 0.5);
      await expect.poll(() => stateOf(page, first), { timeout: 5000 }).toBe('active');
      await expectProgress(page, first, 0.5);
      expect((await sampleOf(page, first)).direction).toBe(0);
    });
  }
});
