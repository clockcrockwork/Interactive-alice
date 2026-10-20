/**
 * Shared helpers for the demo browser tests: the pages the build generated, a
 * console-error collector, and scrolling that waits for the shell to settle.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';
import type { DemoPageEntry } from '../build/demos.ts';

/** The demo pages the build generated; run `npm run build` first. */
export function demoPages(): DemoPageEntry[] {
  const file = join(import.meta.dirname, '..', 'src', 'generated', 'demos-manifest.json');
  try {
    return (JSON.parse(readFileSync(file, 'utf8')) as { pages: DemoPageEntry[] }).pages;
  } catch {
    throw new Error(`no demo manifest at ${file}; run npm run build first`);
  }
}

export const pages = demoPages();
/** Every demo page, in every locale: the base locale's first, so `find` by id returns it. */
export const demos = pages.filter((page) => page.kind === 'demo');
/** The base locale's demo pages, at the plain `demos/<id>/` URLs. */
export const baseDemos = demos.filter((page) => page.locale === pages[0]?.locale);

export const collectErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(`${request.method()} ${request.url()} failed`));
  return errors;
};

/**
 * Waits until the scrubbed timeline has caught up with the scroll. The scrub eases
 * by GSAP's clock, which on a starved machine (frames longer than the second the
 * shell's lag smoothing allows) advances a quarter of a second a frame however
 * long the frame took, so the ease can crawl. It is given a few seconds to arrive by itself; then
 * it is landed where the scroll already is, through the seam (`seek` at the
 * current progress: the same scroll, the same timeline position, without the
 * crawl), and must then report settled like any other time. A timeline that never
 * settles still fails.
 */
export const settled = async (page: Page) => {
  // The scroll event reaches ScrollTrigger on the next frame; let it.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const done = () => page.evaluate(() => window.__aliceDemo?.settled() ?? true);
  // An ease that has not arrived in three seconds is crawling: on a machine with
  // fast frames it arrives in well under one.
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    if (await done()) {
      return;
    }
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => {
    const seam = window.__aliceDemo;
    seam?.seek(seam.progress());
  });
  await expect.poll(done, { timeout: 15_000 }).toBe(true);
};

/*
 * Scroll positions are whole pixels, and engines differ in how they get there:
 * Chromium and Firefox round a fractional position to the nearest pixel, WebKit
 * floors it. A position asked for at a beat's head could land a pixel before it,
 * in the beat before, in one engine only; so the helpers round up, and land at or
 * just after the point they were asked for in every engine.
 */
export const scrollTo = async (page: Page, fraction: number) => {
  await page.evaluate((f) => {
    window.scrollTo(0, Math.ceil((document.documentElement.scrollHeight - window.innerHeight) * f));
  }, fraction);
  await settled(page);
};

export const atCue = async (page: Page, cue: string, within = 0.5) => {
  await page.evaluate(
    ([name, fraction]) => {
      const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
      const index = beats.findIndex((beat) => beat.dataset.cue === name);
      window.scrollTo(
        0,
        Math.ceil(
          (document.documentElement.scrollHeight - window.innerHeight) *
            ((index + Number(fraction)) / beats.length),
        ),
      );
    },
    [cue, within] as const,
  );
  await settled(page);
};

/** Whether the page is on a touch screen, as the browser reports it to the page. */
export const touchScreen = (page: Page) => page.evaluate(() => navigator.maxTouchPoints > 0);

/**
 * A tap at a point of the viewport, the way the reader's device makes one: a touch
 * tap on a touch screen, a mouse click elsewhere, through the browser's own input
 * pipeline, so the pointer and click events are the engine's.
 */
export const tapAt = async (page: Page, x: number, y: number) => {
  if (await touchScreen(page)) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
};

/**
 * Presses a control on the pinned stage where it is, as a reader does. Playwright's
 * own `click` first scrolls the element "into view", and for an element inside a
 * sticky stage that scroll can carry the document on into another beat, where the
 * control is hidden; a dispatched click skips the pointer events the control may
 * listen for. This taps the centre of the control's box instead.
 */
export const press = async (page: Page, target: Locator) => {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('the control has no box to press');
  }
  await tapAt(page, box.x + box.width / 2, box.y + box.height / 2);
};

/**
 * Records a custom property of an element on every animation frame from now on,
 * from inside the page, and returns a reader for the values seen. A pose that lasts
 * a moment (a stretch, a roll) can come and go between two readings fetched across
 * the bridge, the more so on a loaded machine whose frames are long; a frame the
 * page painted is a frame this has seen.
 */
export const watchProperty = async (page: Page, selector: string, property: string) => {
  const key = `${selector}|${property}`;
  await page.evaluate(
    ([sel, prop, name]) => {
      const host = window as unknown as { __aliceWatch?: Record<string, number[]> };
      host.__aliceWatch ??= {};
      const seen: number[] = [];
      host.__aliceWatch[name] = seen;
      const sample = (): void => {
        const el = document.querySelector(sel);
        if (el) {
          seen.push(Number(getComputedStyle(el).getPropertyValue(prop)));
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    },
    [selector, property, key] as const,
  );
  return () =>
    page.evaluate(
      (name) =>
        (window as unknown as { __aliceWatch?: Record<string, number[]> }).__aliceWatch?.[name] ??
        [],
      key,
    );
};

/**
 * Starves the page's frames: from now on every animation frame blocks the main
 * thread for `ms` before it may paint, in any engine. Returns the release. This
 * is what a slow runner does to the timeline, made on purpose and the same
 * everywhere, where CPU throttling is a Chromium-only tool.
 */
export const starveFrames = async (page: Page, ms: number) => {
  await page.evaluate((block) => {
    const host = window as unknown as { __aliceStarve?: boolean };
    host.__aliceStarve = true;
    const spin = (): void => {
      if (!host.__aliceStarve) {
        return;
      }
      const until = performance.now() + block;
      while (performance.now() < until) {
        // Busy: a frame this long is the point.
      }
      requestAnimationFrame(spin);
    };
    requestAnimationFrame(spin);
  }, ms);
  return () =>
    page.evaluate(() => {
      (window as unknown as { __aliceStarve?: boolean }).__aliceStarve = false;
    });
};

export const customProperty = (page: Page, selector: string, property: string) =>
  page.evaluate(
    ([sel, prop]) =>
      Number(getComputedStyle(document.querySelector(sel) as Element).getPropertyValue(prop)),
    [selector, property] as const,
  );
