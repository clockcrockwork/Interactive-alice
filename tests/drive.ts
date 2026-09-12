/**
 * Driving a real document from a browser test.
 *
 * These read and move the page the way a visitor does, and use the probe only to
 * ask the runtime what it thinks. They live here because a document now hosts more
 * than one scene, and every spec that touches a scene has to put the reader in
 * front of it first.
 */

import { expect, type Page } from '@playwright/test';

/**
 * Where a scene starts scrolling and how far it travels, read from the document.
 *
 * The runtime measures the same way, so a scroll target computed from this lands on
 * the progress it names; a page-relative guess would be off by whatever sits above
 * the track.
 */
export const geometryOf = (page: Page, scene: string) =>
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

export const progressOf = (page: Page, scene: string) =>
  page.evaluate((id) => window.__alice?.snapshot(id)[0]?.progress ?? -1, scene);

export const stateOf = (page: Page, scene: string) =>
  page.evaluate((id) => window.__alice?.snapshot(id)[0]?.state ?? '', scene);

/** Progress, and whether the runtime thinks a reader put it there. */
export const sampleOf = (page: Page, scene: string) =>
  page.evaluate((id) => {
    const snapshot = window.__alice?.snapshot(id)[0];
    return {
      progress: snapshot?.progress ?? -1,
      direction: snapshot?.direction ?? 9,
      velocity: snapshot?.velocity ?? 9,
    };
  }, scene);

/** Every render-active shot of a scene, in progression order. */
export const shotsOf = (page: Page, scene: string) =>
  page.evaluate((id) => window.__alice?.snapshot(id)[0]?.shots ?? [], scene);

/** Scrolls a scene to a normalized progress, as a reader would reach it. */
export async function scrollToProgress(page: Page, scene: string, progress: number): Promise<void> {
  const { top, travel } = await geometryOf(page, scene);
  await page.evaluate((to) => window.scrollTo(0, to), top + travel * progress);
}

/**
 * Scrolls until a scene is on screen, and waits for it to be running.
 *
 * The seam cannot drive a suspended scene: that is the suspension rule rather than
 * a limitation of the seam, so a test that wants to hold one scene at a progress
 * value has to put the reader in front of it first, exactly as a visitor would.
 */
export async function focusScene(page: Page, scene: string): Promise<void> {
  await scrollToProgress(page, scene, 0);
  await expect.poll(() => stateOf(page, scene), { timeout: 5000 }).toBe('active');
}

/** Holds a scene at a progress value, having first made sure it can be driven. */
export async function holdAt(page: Page, scene: string, progress: number): Promise<void> {
  await focusScene(page, scene);
  await page.evaluate(([id, value]) => window.__alice?.setProgress(id as string, value as number), [
    scene,
    progress,
  ] as const);
}

/**
 * Waits for a scene to settle near a progress value.
 *
 * Near, not past: a scene that is coming back from suspension still reports where
 * it was until the observer wakes it, and "greater than" would be satisfied by that
 * stale value before the resynchronisation ever happened.
 */
export async function expectProgress(
  page: Page,
  scene: string,
  target: number,
  digits = 1,
): Promise<void> {
  await expect.poll(() => progressOf(page, scene), { timeout: 5000 }).toBeCloseTo(target, digits);
}

/**
 * Scrolls a scene by a small amount in several steps, the way a reader does.
 *
 * `direction` is recomputed every frame from the change since the last one, so a
 * single jump is travelling for one frame and still afterwards. Several steps give
 * the runtime real movement to read rather than one discontinuity.
 */
export async function scrollBy(
  page: Page,
  scene: string,
  from: number,
  to: number,
  steps = 6,
): Promise<void> {
  const { top, travel } = await geometryOf(page, scene);
  for (let step = 1; step <= steps; step += 1) {
    const at = from + ((to - from) * step) / steps;
    await page.evaluate((offset) => window.scrollTo(0, offset), top + travel * at);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  }
}
