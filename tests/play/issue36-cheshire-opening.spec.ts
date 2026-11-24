import { expect, test } from '@playwright/test';
import { tapAt } from '../demo-helpers.ts';

test('the Cat call waits until the opening close-up has cleared, including on reverse', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ja-JP',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  try {
    await page.goto('/demos/ja/cheshire-cat/', { waitUntil: 'load' });
    await page.waitForFunction(
      () =>
        Boolean(window.__aliceDemo) &&
        document.querySelector('.demo')?.hasAttribute('data-attached'),
    );
    const state = () =>
      page.evaluate(() => ({
        cue: document.querySelector<HTMLElement>('.demo-beat[data-active]')?.dataset.cue,
        scrollY,
        joinOpacity: Number(
          getComputedStyle(document.querySelector('.cc__join') as Element).opacity,
        ),
        callShown: document.querySelector('.cc__prop--call')?.hasAttribute('data-shown') ?? false,
        hintShown: document.querySelector('.cc__hint')?.hasAttribute('data-shown') ?? false,
        catBough: document
          .querySelector('.art[data-art="cheshire-cat/on-bough"]')
          ?.closest<HTMLElement>('.cc__bough')?.dataset.bough,
        settled: window.__aliceDemo?.settled(),
      }));
    await expect.poll(async () => (await state()).settled).toBe(true);
    await expect.poll(async () => (await state()).cue).toBe('bough');
    await expect.poll(async () => (await state()).joinOpacity).toBeGreaterThan(0.95);
    await expect.poll(async () => (await state()).callShown).toBe(false);
    await expect.poll(async () => (await state()).hintShown).toBe(false);

    // Use real wheel input to reach the end of the opening art, stopping inside bough.
    for (let step = 0; step < 40; step += 1) {
      const current = await state();
      if (current.joinOpacity < 0.05 || current.cue !== 'bough') break;
      await page.mouse.wheel(0, 30);
      await page.waitForTimeout(50);
    }
    await expect.poll(async () => (await state()).joinOpacity).toBeLessThan(0.05);
    await expect.poll(async () => (await state()).cue).toBe('bough');
    await expect.poll(async () => (await state()).callShown).toBe(true);
    await expect.poll(async () => (await state()).hintShown).toBe(true);
    const firstBough = (await state()).catBough;
    const call = page.locator('.cc__prop--call');
    const box = await call.boundingBox();
    if (!box) throw new Error('call control has no box');
    await tapAt(page, box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(async () => (await state()).catBough, { timeout: 3000 }).not.toBe(firstBough);
    await expect.poll(async () => (await state()).joinOpacity).toBeLessThan(0.05);

    // A real Home key returns to the opaque opening; the prompt must close with it.
    await page.keyboard.press('Home');
    await expect.poll(async () => (await state()).joinOpacity).toBeGreaterThan(0.95);
    await expect.poll(async () => (await state()).callShown).toBe(false);
    await expect.poll(async () => (await state()).hintShown).toBe(false);

    // Re-enter the revealed state, focus the control, and activate it from the keyboard.
    for (let step = 0; step < 40; step += 1) {
      const current = await state();
      if (current.joinOpacity < 0.05 || current.cue !== 'bough') break;
      await page.mouse.wheel(0, 30);
      await page.waitForTimeout(50);
    }
    await expect.poll(async () => (await state()).callShown).toBe(true);
    const keyboardStart = (await state()).catBough;
    await call.focus();
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => (await state()).catBough, { timeout: 3000 })
      .not.toBe(keyboardStart);
  } finally {
    await context.close();
  }
});
