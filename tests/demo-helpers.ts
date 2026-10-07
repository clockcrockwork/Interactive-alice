/**
 * Shared helpers for the demo browser tests: the pages the build generated, a
 * console-error collector, and scrolling that waits for the shell to settle.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';
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
 * by GSAP's clock, which on a loaded machine (frames longer than its lag smoothing
 * allows) advances a few hundredths of a second a frame however long the frame
 * took, so the ease can crawl. It is given a few seconds to arrive by itself; then
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
  const deadline = Date.now() + 6_000;
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

export const scrollTo = async (page: Page, fraction: number) => {
  await page.evaluate((f) => {
    window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f);
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
        (document.documentElement.scrollHeight - window.innerHeight) *
          ((index + Number(fraction)) / beats.length),
      );
    },
    [cue, within] as const,
  );
  await settled(page);
};

export const customProperty = (page: Page, selector: string, property: string) =>
  page.evaluate(
    ([sel, prop]) =>
      Number(getComputedStyle(document.querySelector(sel) as Element).getPropertyValue(prop)),
    [selector, property] as const,
  );
