/**
 * Growing in the House: the Rabbit on his way round (the review found him off the
 * frame for the door, the snatch and the crash), the snatch the reader can make,
 * her foot out of the chimney's top and its wiggle, presses that reach the
 * bottle and the house through the layers over them, captions that step aside
 * for the door, and the join with Bill: the house's last frame is Bill's first.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, demos, scrollTo } from '../demo-helpers.ts';

const house = demos.find((candidate) => candidate.demo === 'rabbit-house');
const bill = demos.find((candidate) => candidate.demo === 'bill-the-lizard');

const houseState = (page: Page) =>
  page.evaluate(() => {
    const state = window.__aliceHouse?.();
    if (!state) {
      throw new Error('no house seam');
    }
    return state;
  });

/** Whether an element's box overlaps the viewport. */
const onScreen = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const box = document.querySelector(sel)?.getBoundingClientRect();
    if (!box || box.width === 0) {
      return false;
    }
    return box.right > 0 && box.left < innerWidth && box.bottom > 0 && box.top < innerHeight;
  }, selector);

const box = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom } : undefined;
  }, selector);

test.describe('Growing in the House', () => {
  test.skip(!house, 'no rabbit-house demo in this build');

  test('the Rabbit is on screen at the door, under the window, and in the cucumber-frame', async ({
    page,
  }) => {
    await page.goto(house?.url ?? '');
    await atCue(page, 'door', 0.6);
    await expect.poll(async () => (await houseState(page)).rabbit.x, { timeout: 8000 }).toBe(712);
    expect((await houseState(page)).rabbit.opacity).toBeGreaterThan(0.9);
    expect(await onScreen(page, '.hs__rabbit')).toBe(true);
    // He is at the door: his box and the door's overlap across.
    const door = await box(page, '.hs__door');
    const rabbitAtDoor = await box(page, '.hs__rabbit');
    expect(rabbitAtDoor && door && rabbitAtDoor.right > door.left).toBe(true);
    expect(rabbitAtDoor && door && rabbitAtDoor.left < door.right).toBe(true);

    await atCue(page, 'snatch', 0.6);
    await expect.poll(async () => (await houseState(page)).rabbit.x, { timeout: 8000 }).toBe(300);
    expect(await onScreen(page, '.hs__rabbit')).toBe(true);

    // The story makes the snatch by itself; at the crash he is in the frame.
    await atCue(page, 'crash', 0.6);
    await expect.poll(async () => (await houseState(page)).fall, { timeout: 15_000 }).toBe(1);
    expect(await onScreen(page, '.hs__rabbit')).toBe(true);
    const frame = await box(page, '.hs__frame > rect');
    const rabbitInFrame = await box(page, '.hs__rabbit');
    expect(frame && rabbitInFrame).toBeTruthy();
    if (frame && rabbitInFrame) {
      const middle = (rabbitInFrame.left + rabbitInFrame.right) / 2;
      expect(middle).toBeGreaterThan(frame.left);
      expect(middle).toBeLessThan(frame.right);
    }
    await expect(page.locator('.hs__svg')).toHaveAttribute('data-crash', '');
  });

  test('the reader can make the snatch, and scrolling back puts the Rabbit under the window again', async ({
    page,
  }) => {
    await page.goto(house?.url ?? '');
    await atCue(page, 'snatch', 0.5);
    const snatch = page.locator('.hs__prop--snatch');
    await expect(snatch).toBeVisible();
    await snatch.click();
    await expect.poll(async () => (await houseState(page)).snatched).toBe(true);
    await expect.poll(async () => (await houseState(page)).fall, { timeout: 15_000 }).toBe(1);
    await expect(page.locator('.demo__status')).toContainText(/.+/);
    await atCue(page, 'door', 0.5);
    await expect.poll(async () => (await houseState(page)).snatched, { timeout: 8000 }).toBe(false);
    expect((await houseState(page)).fall).toBe(0);
    await expect(page.locator('.hs__svg')).not.toHaveAttribute('data-crash', '');
  });

  test('her foot comes out of the top of the chimney, and a wiggle kicks it out in a puff of soot', async ({
    page,
  }) => {
    await page.goto(house?.url ?? '');
    await atCue(page, 'outside', 0.5);
    await expect.poll(async () => (await houseState(page)).leg, { timeout: 8000 }).toBe(1);
    // The shoe is over the chimney's top, not out of the wall.
    const shoe = await box(page, '.hs__shoe');
    const cap = await box(page, '.hs__roof > rect:nth-of-type(2)');
    expect(shoe && cap).toBeTruthy();
    if (shoe && cap) {
      expect(shoe.bottom).toBeLessThanOrEqual(cap.top + 8);
      const middle = (shoe.left + shoe.right) / 2;
      expect(middle).toBeGreaterThan(cap.left);
      expect(middle).toBeLessThan(cap.right);
    }
    const wiggle = page.locator('.hs__prop--wiggle');
    await expect(wiggle).toBeVisible();
    await wiggle.click();
    await expect(page.locator('.hs__flue')).toHaveAttribute('data-puff', /\d/);
    expect((await houseState(page)).wiggles).toBe(1);
    await expect(page.locator('.demo__status')).toContainText(/.+/);
    // Not offered once the Rabbit has come round to the window.
    await atCue(page, 'crash', 0.5);
    await expect(wiggle).toBeHidden();
  });

  test('a press reaches the bottle and the house through the layers over them', async ({
    page,
  }) => {
    await page.goto(house?.url ?? '');
    await atCue(page, 'sip', 0.5);
    const bottle = await box(page, '.hs__hand-bottle');
    expect(bottle).toBeTruthy();
    if (bottle) {
      await page.mouse.click((bottle.left + bottle.right) / 2, (bottle.top + bottle.bottom) / 2);
    }
    await expect(page.locator('.hs__hand-bottle')).toHaveAttribute('data-held', '');
    // Outside, a press on the house pushes the wall.
    await atCue(page, 'kneel', 0.5);
    const wall = await box(page, '.hs__wall > rect');
    expect(wall).toBeTruthy();
    if (wall) {
      await page.mouse.click((wall.left + wall.right) / 2, (wall.top + wall.bottom) / 2);
    }
    await expect(page.locator('.hs__stage')).toHaveAttribute('data-shake', '');
  });

  test('on a wide frame the captions stand clear of the door while the Rabbit tries it', async ({
    page,
  }) => {
    const size = page.viewportSize();
    test.skip(!size || size.width < 700 || size.width < size.height, 'a wide frame only');
    await page.goto(house?.url ?? '');
    await atCue(page, 'door', 0.6);
    const captions = await box(page, '.demo-beat[data-cue="door"]');
    const door = await box(page, '.hs__door');
    expect(captions && door).toBeTruthy();
    if (captions && door) {
      expect(captions.right).toBeLessThan(door.left);
    }
  });

  test('the house ends on the garden from the rim of the chimney, the picture Bill opens on', async ({
    page,
  }) => {
    test.skip(!bill, 'both demos are needed for the join');
    await page.goto(house?.url ?? '');
    await expect(page.locator('.hs__rim')).toHaveCSS('opacity', '0');
    await scrollTo(page, 1);
    await expect(page.locator('.hs__rim')).toHaveCSS('opacity', '1', { timeout: 8000 });
    const last = await page.locator('.hs__rim svg').evaluate((svg) => svg.outerHTML);
    await page.goto(bill?.url ?? '');
    await expect(page.locator('.bl__rooftop')).toHaveCSS('opacity', '1');
    const first = await page.locator('.bl__rooftop svg').evaluate((svg) => svg.outerHTML);
    expect(first).toBe(last);
  });
});

test.describe('Growing in the House, reduced motion', () => {
  test.skip(!house, 'no rabbit-house demo in this build');
  test.use({ reducedMotion: 'reduce' });

  test('the first beat rests on the house front, the join with the tale; the room comes with the next', async ({
    page,
  }) => {
    const arrival = () =>
      page.evaluate(() =>
        Number(getComputedStyle(document.querySelector('.hs__arrival') as Element).opacity),
      );
    await page.goto(house?.url ?? '');
    await expect.poll(arrival).toBeGreaterThan(0.9);
    // Anywhere in the first beat shows its settled frame: still the front.
    for (const within of [0, 0.5, 0.95]) {
      await atCue(page, 'room', within);
      await expect.poll(arrival, { timeout: 8000 }).toBeGreaterThan(0.9);
    }
    await atCue(page, 'sip', 0);
    await expect.poll(arrival, { timeout: 8000 }).toBeLessThan(0.05);
    // And back: the front again.
    await atCue(page, 'room', 0.5);
    await expect.poll(arrival, { timeout: 8000 }).toBeGreaterThan(0.9);
  });
});
