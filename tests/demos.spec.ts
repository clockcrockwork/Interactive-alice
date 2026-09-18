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

test('drink me: the hall grows around her when she drinks, and shrinks back when she eats', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'drink-me');
  test.skip(!demo, 'no drink-me demo in this build');
  await page.goto(demo?.url ?? '');
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  const room = () =>
    page.evaluate(() =>
      Number(
        getComputedStyle(document.querySelector('.dk__hall') as Element).getPropertyValue('--room'),
      ),
    );
  const at = (cue: string, within = 0.95) =>
    page.evaluate(
      ([name, count, fraction]) => {
        const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
        const index = beats.findIndex((beat) => beat.dataset.cue === name);
        window.scrollTo(
          0,
          (document.documentElement.scrollHeight - window.innerHeight) *
            ((index + Number(fraction)) / Number(count)),
        );
      },
      [cue, beatCount, within] as const,
    );
  await expect.poll(room).toBeCloseTo(1, 1);
  // The drink is optional play: a real button, offered while the bottle is in hand
  // and before the story drinks it herself.
  await at('taste', 0.3);
  await expect(page.locator('.dk__prop').first()).toBeVisible();
  await at('small');
  await expect.poll(room, { timeout: 8000 }).toBeGreaterThan(4);
  await at('grow');
  await expect.poll(room, { timeout: 8000 }).toBeLessThan(0.6);
});

test('the caucus-race: every runner is a button that rests or runs', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caucus-race');
  test.skip(!demo, 'no caucus-race demo in this build');
  await page.goto(demo?.url ?? '');
  const runners = page.locator('.cr__runner');
  await expect(runners).toHaveCount(8);
  for (const runner of await runners.all()) {
    await expect(runner).toHaveAttribute('aria-pressed', 'false');
    await expect(runner).toHaveAttribute('aria-label', /.+/);
  }
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  await page.evaluate((count) => {
    const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
    const index = beats.findIndex((beat) => beat.dataset.cue === 'running');
    window.scrollTo(
      0,
      (document.documentElement.scrollHeight - window.innerHeight) * ((index + 0.5) / count),
    );
  }, beatCount);
  await expect(runners.first()).toHaveAttribute('aria-pressed', 'true', { timeout: 8000 });
  // A running figure is never still and sits in a 3D ring where another may cover
  // it, so the press is delivered to the button itself rather than aimed at a pixel.
  await runners.first().dispatchEvent('click');
  await expect(runners.first()).toHaveAttribute('aria-pressed', 'false');
  await runners.first().dispatchEvent('click');
  await expect(runners.first()).toHaveAttribute('aria-pressed', 'true');
});

test('the pool of tears: the sentences ride the swell once she is in the water', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'pool-of-tears');
  test.skip(!demo, 'no pool-of-tears demo in this build');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.pt__canvas')).toBeVisible();
  await scrollTo(page, 0.6);
  await page.waitForTimeout(800);
  const samples: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    samples.push(
      await page.evaluate(() =>
        Number(
          document.querySelector<HTMLElement>('.demo__captions')?.style.getPropertyValue('--bob') ??
            0,
        ),
      ),
    );
    await page.waitForTimeout(120);
  }
  expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.5);
  await expect(page.locator('.pt__prop')).toBeVisible();
});

test('the index: the visitor chooses an Alice, and the demos remember her', async ({ page }) => {
  await page.goto('./demos/');
  const blue = page.locator('.demos__alice-choice[data-alice="blue"]');
  const yellow = page.locator('.demos__alice-choice[data-alice="yellow"]');
  await expect(blue).toHaveAttribute('aria-pressed', 'true');
  await expect(yellow).toHaveAttribute('aria-pressed', 'false');
  await yellow.click();
  await expect(yellow).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-alice', 'yellow');
  // Every demo page applies the choice before its own script runs.
  const first = demos[0];
  await page.goto(first?.url ?? './demos/');
  await expect(page.locator('html')).toHaveAttribute('data-alice', 'yellow');
  const dress = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--alice-dress').trim(),
  );
  expect(dress).toBe('#f2c94c');
  await page.goto('./demos/');
  await blue.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-alice', 'yellow');
});

test("the rabbit's house: the camera pulls out as Alice fills the room", async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-house');
  test.skip(!demo, 'no rabbit-house demo in this build');
  await page.goto(demo?.url ?? '');
  const scale = () =>
    page.evaluate(() => {
      const transform = document.querySelector('.hs__camera')?.getAttribute('transform') ?? '';
      return Number(/scale\(([^)]+)\)/.exec(transform)?.[1] ?? 0);
    });
  await expect.poll(scale).toBeGreaterThan(2);
  await scrollTo(page, 0.62);
  await expect.poll(scale, { timeout: 8000 }).toBeLessThan(1);
  await expect(page.locator('.hs__pose--filling')).toHaveCSS('opacity', '1');
});

test('bill the lizard: down the chimney, then up like a sky-rocket', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'bill-the-lizard');
  test.skip(!demo, 'no bill-the-lizard demo in this build');
  await page.goto(demo?.url ?? '');
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  const cam = () =>
    page.evaluate(() =>
      Number(
        document.querySelector<HTMLElement>('.bl__world')?.style.getPropertyValue('--cam') ?? 0,
      ),
    );
  const at = (cue: string, within: number) =>
    page.evaluate(
      ([name, count, fraction]) => {
        const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
        const index = beats.findIndex((beat) => beat.dataset.cue === name);
        window.scrollTo(
          0,
          (document.documentElement.scrollHeight - window.innerHeight) *
            ((index + Number(fraction)) / Number(count)),
        );
      },
      [cue, beatCount, within] as const,
    );
  await at('foot', 0.9);
  await expect.poll(cam, { timeout: 8000 }).toBeLessThan(-1000);
  // The kick is the reader's to give: a real button, and the world goes up.
  await at('kick', 0.3);
  await expect(page.locator('.bl__prop')).toBeVisible();
  await page.locator('.bl__prop').click();
  await expect.poll(cam, { timeout: 8000 }).toBeGreaterThan(500);
});

test('the cheshire cat: it goes tail first, and the grin stays a while', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'cheshire-cat');
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  const state = () =>
    page.evaluate(() => ({
      slide: Number(document.querySelector('.cc__mask-slide')?.getAttribute('x') ?? 0),
      grin: Number(document.querySelector('.cc__grin')?.getAttribute('opacity') ?? 1),
    }));
  expect((await state()).slide).toBeLessThan(-700);
  await page.evaluate((count) => {
    const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
    const index = beats.findIndex((beat) => beat.dataset.cue === 'grin');
    window.scrollTo(
      0,
      (document.documentElement.scrollHeight - window.innerHeight) * ((index + 0.2) / count),
    );
  }, beatCount);
  await expect.poll(async () => (await state()).slide, { timeout: 8000 }).toBeGreaterThan(-300);
  expect((await state()).grin).toBeGreaterThan(0.5);
  await scrollTo(page, 1);
  await expect.poll(async () => (await state()).grin, { timeout: 8000 }).toBeLessThan(0.05);
});

test('the cheshire cat: a tap in the wood sends the Cat to the nearest bough', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'cheshire-cat');
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const bough = () =>
    page.evaluate(
      () =>
        document.querySelector('.art[data-art="cheshire-cat/on-bough"]')?.parentElement?.dataset
          .bough,
    );
  expect(await bough()).toBe('1');
  await page.mouse.click(1100, 200);
  await expect.poll(bough, { timeout: 5000 }).toBe('2');
  // The button does it too, for a keyboard.
  await page.locator('.cc__prop--call').click();
  await expect.poll(bough, { timeout: 5000 }).not.toBe('2');
});

test("the rabbit's house: it opens inside the room, and the room shrinks as she drinks", async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-house');
  test.skip(!demo, 'no rabbit-house demo in this build');
  await page.goto(demo?.url ?? '');
  const grow = () =>
    page.evaluate(() =>
      Number(document.querySelector<HTMLElement>('.hs__box')?.style.getPropertyValue('--grow')),
    );
  await expect.poll(grow).toBeCloseTo(1, 1);
  await expect(page.locator('.hs__room')).toHaveCSS('opacity', '1');
  await scrollTo(page, 0.29);
  await expect.poll(grow, { timeout: 8000 }).toBeLessThan(0.6);
  await scrollTo(page, 0.4);
  await expect(page.locator('.hs__room')).toHaveCSS('opacity', '0', { timeout: 8000 });
});

test('drink me: every door is a button, and trying one jiggles its knob', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'drink-me');
  test.skip(!demo, 'no drink-me demo in this build');
  await page.goto(demo?.url ?? '');
  const doors = page.locator('button.dk__door');
  await expect(doors).toHaveCount(11);
  await expect(doors.first()).toHaveAttribute('aria-label', /.+/);
  await doors.nth(3).dispatchEvent('click');
  await expect(doors.nth(3)).toHaveAttribute('data-tried', '');
});

test('the rabbit hole: a drag across the well tumbles her', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-hole');
  test.skip(!demo, 'no rabbit-hole demo in this build');
  await page.goto(demo?.url ?? '');
  await scrollTo(page, 0.3);
  await page.waitForTimeout(500);
  await page.mouse.move(300, 400);
  await page.mouse.down();
  await page.mouse.move(700, 400, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.abs(
            Number(
              document
                .querySelector<HTMLElement>('.rh__alice')
                ?.style.getPropertyValue('--tumble') ?? 0,
            ),
          ),
        ),
      { timeout: 4000 },
    )
    .toBeGreaterThan(5);
});
