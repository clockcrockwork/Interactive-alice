/**
 * The Lobster Quadrille: controls act only in their moment and only the reader's
 * own actions are announced; the dance is two facing lines that advance and
 * change lobsters; the song lights its words one at a time and keeps the verse
 * up; the run streams the shingle; and nothing on the stage widens a phone's page.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'lobster-quadrille');

/** The opacity of each line in the beat that carries a cue. */
const lineOpacities = (page: Page, cue: string) =>
  page
    .locator(`.demo__stage .demo-beat[data-cue="${cue}"] .line`)
    .evaluateAll((lines) => lines.map((line) => Number(getComputedStyle(line).opacity)));

/** How far each sung word of a beat is lit, 0 to 1. */
const litValues = (page: Page, cue: string) =>
  page
    .locator(`.demo__stage .demo-beat[data-cue="${cue}"] .lq__word`)
    .evaluateAll((words) =>
      words.map((word) => Number(getComputedStyle(word).getPropertyValue('--lit'))),
    );

/** Each dancer's depth on the floor, in ring radii, and its lobster's. */
const depths = (page: Page) =>
  page
    .locator('.lq__dancer:not(.lq__gryphon, .lq__turtle)')
    .evaluateAll((dancers) =>
      dancers.map((dancer) => Number(getComputedStyle(dancer).getPropertyValue('--z'))),
    );
const partnerDepth = (page: Page, index: number) =>
  page
    .locator('.lq__partner')
    .nth(index)
    .evaluate((partner) => Number(getComputedStyle(partner).getPropertyValue('--z')));

test.describe('lobster quadrille: play', () => {
  test.skip(!demo, 'no lobster-quadrille demo page in the build');

  test.beforeEach(async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await page.evaluate(() => localStorage.removeItem('alice-demos:kept'));
  });

  test('the open sea throws nothing before the lobsters are thrown, and takes no focus', async ({
    page,
  }) => {
    const sea = page.locator('.lq__sea-tap');
    await expect(sea).toHaveAttribute('tabindex', '-1');
    await expect(sea).toHaveAttribute('aria-hidden', 'true');
    // Tab through everything on the first beat: neither the sea nor the snail is reached.
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.className ?? '');
      expect(focused).not.toContain('lq__sea-tap');
      expect(focused).not.toContain('lq__swimmer');
    }
    // Even a click delivered to it straight is refused outside its moment.
    await sea.evaluate((button) => (button as HTMLButtonElement).click());
    await page.waitForTimeout(300);
    await expect(page.locator('.lq__ring')).not.toHaveAttribute('data-thrown', '');
    expect(await page.evaluate(() => localStorage.getItem('alice-demos:kept'))).toBeNull();
    await expect(page.locator('.lq__swimmer--snail')).toHaveCSS('visibility', 'hidden');
  });

  test('the story throws, somersaults and joins by itself without announcing the reader', async ({
    page,
  }) => {
    for (const [cue, within] of [
      ['throw', 0.9],
      ['swim', 0.9],
      ['round', 0.6],
    ] as const) {
      await atCue(page, cue, within);
    }
    await expect(page.locator('.lq__ring')).toHaveAttribute('data-dancing', '');
    const status = page.locator('.demo__status');
    expect((await status.count()) === 0 || (await status.textContent()) === '').toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('alice-demos:kept'))).toBeNull();
  });

  test("the reader's throw is kept and announced", async ({ page }) => {
    await atCue(page, 'throw', 0.3);
    await page.locator('.lq__prop--throw').click();
    await expect(page.locator('.lq__ring')).toHaveAttribute('data-thrown', '');
    await expect(page.locator('.demo__status')).toHaveText('Throw the lobster');
    expect(await page.evaluate(() => localStorage.getItem('alice-demos:kept'))).toContain(
      'lobster',
    );
  });

  test('two facing lines advance, and the lobsters change sides across the gap', async ({
    page,
  }) => {
    await atCue(page, 'lines', 0.95);
    // Two lines: every dancer stands at one of two depths, half at each.
    await expect
      .poll(async () => new Set((await depths(page)).map((z) => z.toFixed(2))).size)
      .toBe(2);
    const rest = await depths(page);
    const gap = Math.max(...rest) - Math.min(...rest);
    expect(gap).toBeGreaterThan(1);
    // Advanced: the lines are closer.
    await atCue(page, 'advance', 0.3);
    await expect
      .poll(async () => {
        const z = await depths(page);
        return Math.max(...z) - Math.min(...z);
      })
      .toBeLessThan(gap - 0.4);
    // Changed: the first dancer's lobster stands in the other line.
    await atCue(page, 'advance', 0.97);
    const own = (await depths(page))[0] ?? 0;
    const opposite = (await depths(page))[1] ?? 0;
    await expect
      .poll(async () => Math.abs((await partnerDepth(page, 0)) - opposite), { timeout: 8000 })
      .toBeLessThan(0.1);
    // And back: the change is a function of the scroll.
    await atCue(page, 'lines', 0.95);
    await expect
      .poll(async () => Math.abs((await partnerDepth(page, 0)) - own), { timeout: 8000 })
      .toBeLessThan(0.6);
    expect(await customProperty(page, '.lq__ring', '--partners')).toBeLessThan(0.05);
  });

  test('scrolling back reconstructs: the dancers, their lobsters and the one in her hands', async ({
    page,
  }) => {
    const opacityOf = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((element) => Number(getComputedStyle(element).opacity));
    await atCue(page, 'faint', 0.6);
    await atCue(page, 'land', 0.6);
    await expect.poll(() => opacityOf('.lq__dancer[data-kind]')).toBeGreaterThan(0.95);
    await expect.poll(() => opacityOf('.lq__partner')).toBeGreaterThan(0.95);
    await expect.poll(() => opacityOf('.lq__lobster-held')).toBeGreaterThan(0.95);
    // Back into the throw: the story's throw is taken back, and it is the reader's turn.
    await atCue(page, 'throw', 0.3);
    await expect(page.locator('.lq__ring')).not.toHaveAttribute('data-thrown', '');
    await expect(page.locator('.lq__prop--throw')).toBeVisible();
    // Back before the lines: nobody but the two hosts.
    await atCue(page, 'what', 0.5);
    await expect.poll(() => opacityOf('.lq__dancer[data-kind]')).toBeLessThan(0.05);
    expect(await opacityOf('.lq__gryphon')).toBeGreaterThan(0.95);
    expect(await opacityOf('.lq__turtle')).toBeGreaterThan(0.95);
  });

  test('the sung words light one at a time, and the whole verse stays up through the beat', async ({
    page,
  }) => {
    await atCue(page, 'verse-one', 0.42);
    const early = await litValues(page, 'verse-one');
    expect(early.length).toBeGreaterThan(20);
    expect(early.some((lit) => lit > 0.95)).toBe(true);
    expect(early.some((lit) => lit < 0.05)).toBe(true);
    // Every line of the verse is up, lit or not yet.
    for (const opacity of await lineOpacities(page, 'verse-one')) {
      expect(opacity).toBeGreaterThan(0.95);
    }
    await atCue(page, 'verse-one', 0.85);
    for (const lit of await litValues(page, 'verse-one')) {
      expect(lit).toBeGreaterThan(0.95);
    }
    for (const opacity of await lineOpacities(page, 'verse-one')) {
      expect(opacity).toBeGreaterThan(0.95);
    }
    // The last, faint words are readable: the line is whole at the end.
    await atCue(page, 'faint', 0.99);
    for (const opacity of await lineOpacities(page, 'faint')) {
      expect(opacity).toBeGreaterThan(0.95);
    }
  });

  test('the shingle streams under the run, and is still again on arrival', async ({ page }) => {
    await atCue(page, 'run', 0.5);
    await expect(page.locator('.lq__shore')).toHaveAttribute('data-running', '');
    await expect.poll(() => customProperty(page, '.lq__shore', '--stream')).toBeGreaterThan(0.9);
    const running = () =>
      page
        .locator('.lq__stream-plane')
        .evaluate((plane) => plane.getAnimations().some((a) => a.playState === 'running'));
    expect(await running()).toBe(true);
    // The dancers fall behind as they go: they slide past toward the camera.
    const running0 = (await depths(page))[0] ?? 0;
    await atCue(page, 'cry', 0.5);
    const standing0 = (await depths(page))[0] ?? 0;
    expect(running0).toBeGreaterThan(standing0 + 0.3);
    await atCue(page, 'faint', 0.99);
    await expect(page.locator('.lq__shore')).not.toHaveAttribute('data-running', '');
    await expect.poll(() => customProperty(page, '.lq__shore', '--stream')).toBeLessThan(0.05);
  });

  test('under reduced motion the run is a cut: no stream, no dancers showing through', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await atCue(page, 'run', 0.5);
    await expect(page.locator('.lq__shore')).not.toHaveAttribute('data-running', '');
    await expect(page.locator('.lq__stream')).toHaveCSS('display', 'none');
    const visible = await page
      .locator('.lq__dancer[data-kind], .lq__turtle')
      .evaluateAll((items) =>
        items.filter((item) => Number(getComputedStyle(item).opacity) > 0.02),
      );
    expect(visible).toHaveLength(0);
    // The settled advance shows the lines advanced and the lobsters changed over.
    await atCue(page, 'advance', 0.5);
    await expect.poll(() => customProperty(page, '.lq__ring', '--partners')).toBeGreaterThan(0.95);
    const opposite = (await depths(page))[1] ?? 0;
    expect(Math.abs((await partnerDepth(page, 0)) - opposite)).toBeLessThan(0.1);
  });
});

test.describe('lobster quadrille: the last frame', () => {
  test.skip(!demo, 'no lobster-quadrille demo page in the build');

  test('is the same however long the dance went round: the ring turns back to its places', async ({
    page,
  }) => {
    const gryphonSpot = () =>
      page.locator('.lq__gryphon').evaluate((gryphon) => {
        const style = getComputedStyle(gryphon);
        return ['--xr', '--z', '--k'].map((name) => Number(style.getPropertyValue(name)));
      });
    await page.goto(demo?.url ?? '');
    await atCue(page, 'faint', 0.99);
    const straight = await gryphonSpot();
    await page.reload();
    await atCue(page, 'round', 0.9);
    await expect(page.locator('.lq__ring')).toHaveAttribute('data-dancing', '');
    const turned = () => customProperty(page, '.lq__dancer[data-kind]', '--xr');
    const before = await turned();
    // The ring goes round meanwhile (by the clock, so a slow machine waits longer).
    await expect
      .poll(async () => Math.abs((await turned()) - before), { timeout: 15_000 })
      .toBeGreaterThan(0.05);
    await atCue(page, 'faint', 0.99);
    const danced = await gryphonSpot();
    danced.forEach((value, index) => {
      expect(Math.abs(value - (straight[index] ?? 0))).toBeLessThan(0.01);
    });
  });
});

test.describe('lobster quadrille: phone', () => {
  test.skip(!demo, 'no lobster-quadrille demo page in the build');
  test.use({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });

  test('the somersault turns the frame without widening the page', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'swim', 0.5);
    await expect(page.locator('.lq__prop--somersault')).toBeVisible();
    // A dispatched click, as a tap is: Playwright's own click first scrolls the
    // pinned stage's button "into view", which can carry the page past the sea.
    await page.locator('.lq__prop--somersault').dispatchEvent('click');
    // Watch the roll until it has turned (under load, GSAP's lag smoothing
    // stretches the 1.1 s roll over many seconds),
    // checking the page's width on every sample.
    let turned = false;
    const until = Date.now() + 12_000;
    while (!turned && Date.now() < until) {
      await page.waitForTimeout(60);
      const sample = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        roll: Number(
          getComputedStyle(document.querySelector('.demo__stage') as Element).getPropertyValue(
            '--roll',
          ),
        ),
      }));
      turned ||= sample.roll > 30 && sample.roll < 330;
      expect(sample.width).toBeLessThanOrEqual(sample.client + 1);
    }
    expect(turned).toBe(true);
    // The bar's buttons stay inside the frame.
    const box = await page.locator('.demo__sound').boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(391);
  });
});
