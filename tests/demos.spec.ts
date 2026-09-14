import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import type { DemoPageEntry } from '../build/demos.ts';

/** The demo pages the build generated; run `npm run build` first. */
function demoPages(): DemoPageEntry[] {
  const file = join(import.meta.dirname, '..', 'src', 'generated', 'demos-manifest.json');
  try {
    return (JSON.parse(readFileSync(file, 'utf8')) as { pages: DemoPageEntry[] }).pages;
  } catch {
    throw new Error(`no demo manifest at ${file}; run npm run build first`);
  }
}

const pages = demoPages();
const demos = pages.filter((page) => page.kind === 'demo');

const collectErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(`${request.method()} ${request.url()} failed`));
  return errors;
};

const scrollTo = (page: Page, fraction: number) =>
  page.evaluate((f) => {
    window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f);
  }, fraction);

test('the demo index links every demo, and the home page links the index', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./demos/');
  await expect(page.locator('h1')).not.toBeEmpty();
  for (const demo of demos) {
    await expect(page.locator(`.demos__card[data-demo="${demo.demo}"] a`)).toHaveAttribute(
      'href',
      `./${demo.demo}/`,
    );
  }
  await page.goto('./');
  await expect(page.locator('.home__demos a')).toHaveAttribute('href', './demos/');
  expect(errors).toEqual([]);
});

for (const demo of demos) {
  test(`${demo.url} carries its text in order and reaches its last beat`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(demo.url);
    await expect(page.locator('h1')).not.toBeEmpty();

    // Every sentence, in composition order, whether or not the runtime attached.
    const rendered = await page
      .locator('.line')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-segment')));
    expect(rendered).toEqual(demo.segments);

    // The shell attached: the beats moved into the pinned stage and the first is active.
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await expect(page.locator('.demo__stage .demo-beat').first()).toHaveAttribute(
      'data-active',
      '',
    );
    await expect(page.locator('.demo__motion')).toBeVisible();

    // Scroll is the guaranteed path: the end is reached by scrolling and nothing else.
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
      await scrollTo(page, fraction);
      await page.waitForTimeout(400);
    }
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? -1))
      .toBeGreaterThan(0.99);
    await expect(page.locator('.demo__stage .demo-beat').last()).toHaveAttribute(
      'data-reached',
      '',
    );
    await expect(page.locator('.demo__next')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${demo.url} pauses its own motion on request`, async ({ page }) => {
    await page.goto(demo.url);
    const button = page.locator('.demo__motion');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
    expect(await page.evaluate(() => window.__aliceDemo?.paused())).toBe(true);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test(`${demo.url} keeps every sentence readable under reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = collectErrors(page);
    await page.goto(demo.url);
    await expect(page.locator('.demo')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('.demo__note')).not.toBeEmpty();
    await scrollTo(page, 1);
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? -1))
      .toBeGreaterThan(0.99);
    await expect(page.locator('.demo__stage .demo-beat').last()).toHaveAttribute(
      'data-reached',
      '',
    );
    expect(errors).toEqual([]);
  });
}

test('the trial: the pack comes for the glass, and turns to leaves on the bank', async ({
  page,
}) => {
  const trial = demos.find((demo) => demo.demo === 'trial');
  test.skip(!trial, 'no trial demo in this build');
  await page.goto(trial?.url ?? '');
  const cues = trial?.cues ?? [];
  const beatCount = trial?.segments ? await page.locator('.demo__stage .demo-beat').count() : 0;
  const at = (cue: string) =>
    page.evaluate(
      ([name, count]) => {
        const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
        const index = beats.findIndex((beat) => beat.dataset.cue === name);
        const fraction = (index + 0.5) / Number(count);
        window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * fraction);
      },
      [cue, beatCount] as const,
    );
  expect(cues).toContain('attack');
  await at('rise');
  await page.waitForTimeout(600);
  await at('attack');
  await expect
    .poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 })
    .toBeGreaterThan(5);
  await at('beat');
  await expect(page.locator('.tr__prop-beat')).toBeVisible();
  // Beating them off is optional play: it is a real button, and it clears the glass.
  await page.locator('.tr__prop-beat').click();
  await expect.poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 }).toBe(0);
});

test('the dormouse: the tale is written on the spiral, one sentence per segment', async ({
  page,
}) => {
  const dormouse = demos.find((demo) => demo.demo === 'dormouse');
  test.skip(!dormouse, 'no dormouse demo in this build');
  await page.goto(dormouse?.url ?? '');
  const spoken = await page
    .locator('.line[data-speaker="dormouse"]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
  const onSpiral = await page
    .locator('.dm__text tspan')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
  expect(onSpiral).toEqual(spoken);
  // Shrinking as it turns.
  const sizes = await page
    .locator('.dm__text tspan')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('font-size'))));
  for (let i = 1; i < sizes.length; i += 1) {
    expect(sizes[i]).toBeLessThan(sizes[i - 1] ?? 0);
  }
});
