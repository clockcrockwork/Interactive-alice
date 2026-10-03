import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

const demo = demos.find((candidate) => candidate.demo === 'cheshire-cat');
const CAT = '.art[data-art="cheshire-cat/on-bough"]';

const slideX = (page: Parameters<typeof scrollTo>[0]) =>
  page.evaluate(() => Number(document.querySelector('.cc__mask-slide')?.getAttribute('x')));
const grinOpacity = (page: Parameters<typeof scrollTo>[0]) =>
  page.evaluate(() => Number(document.querySelector('.cc__grin')?.getAttribute('opacity') ?? 1));

test('the cheshire cat: at the slow vanishing the reader chooses the end, and head first leaves the grin', async ({
  page,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const tail = page.locator('.cc__prop--tail');
  const head = page.locator('.cc__prop--head');
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'tail');
  await expect(tail).not.toHaveAttribute('data-shown', '');

  await atCue(page, 'slowly', 0.1);
  await expect(tail).toHaveAttribute('data-shown', '');
  await expect(head).toHaveAttribute('data-shown', '');
  await expect(tail).not.toBeEmpty();
  await expect(head).not.toBeEmpty();
  // Whole, with the tail-first slide in place.
  await expect.poll(() => customProperty(page, CAT, '--cc-head'), { timeout: 8000 }).toBe(1);
  await expect.poll(() => customProperty(page, CAT, '--cc-tail'), { timeout: 8000 }).toBe(1);

  await head.click();
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'head');
  await expect(head).toHaveAttribute('aria-pressed', 'true');
  await expect(tail).toHaveAttribute('aria-pressed', 'false');

  // Halfway: the head has gone first and the tail is still there.
  await atCue(page, 'slowly', 0.6);
  await expect
    .poll(() => customProperty(page, CAT, '--cc-head'), { timeout: 8000 })
    .toBeLessThan(0.05);
  await expect
    .poll(() => customProperty(page, CAT, '--cc-tail'), { timeout: 8000 })
    .toBeGreaterThan(0.3);
  // Gone: the head-first slide has slid its whole way, and the grin stays.
  await atCue(page, 'grin', 0.2);
  await expect.poll(() => slideX(page), { timeout: 8000 }).toBeGreaterThan(-600);
  await expect.poll(() => slideX(page), { timeout: 8000 }).toBeLessThan(-560);
  await expect
    .poll(() => customProperty(page, CAT, '--cc-tail'), { timeout: 8000 })
    .toBeLessThan(0.05);
  await expect.poll(() => grinOpacity(page), { timeout: 8000 }).toBeGreaterThan(0.5);
  await expect(page.locator('.cc__prop--head')).not.toHaveAttribute('data-shown', '');

  // Back, and the Cat comes back the way it went; then tail first again.
  await atCue(page, 'slowly', 0.1);
  await expect.poll(() => customProperty(page, CAT, '--cc-head'), { timeout: 8000 }).toBe(1);
  await tail.click();
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'tail');
  await atCue(page, 'slowly', 0.6);
  await expect
    .poll(() => customProperty(page, CAT, '--cc-tail'), { timeout: 8000 })
    .toBeLessThan(0.05);
  await expect
    .poll(() => customProperty(page, CAT, '--cc-head'), { timeout: 8000 })
    .toBeGreaterThan(0.3);
  await atCue(page, 'grin', 0.2);
  await expect.poll(() => slideX(page), { timeout: 8000 }).toBeGreaterThan(-300);
  await expect.poll(() => grinOpacity(page), { timeout: 8000 }).toBeGreaterThan(0.5);
  await scrollTo(page, 1);
  await expect.poll(() => grinOpacity(page), { timeout: 8000 }).toBeLessThan(0.05);
});

test('the cheshire cat: a tap on the head or the tail chooses the end, and the choice is kept', async ({
  page,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'slowly', 0.1);
  const cat = page.locator(CAT);
  const box = await cat.boundingBox();
  if (!box) {
    throw new Error('no Cat');
  }
  await page.mouse.click(box.x + box.width * 0.78, box.y + box.height * 0.4);
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'head');
  // The Cat stays on its bough: a tap here is a choice, not a teleport.
  await expect(page.locator(`.cc__bough[data-bough="1"] ${CAT}`)).toBeAttached();
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'tail');
  await page.locator('.cc__prop--head').click();
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'head');
  // Remembered: the quick vanishing earlier on the page uses it too.
  await atCue(page, 'vanish-1', 0.5);
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'head');
  await expect.poll(() => slideX(page), { timeout: 8000 }).toBeGreaterThan(-600);
  await expect.poll(() => slideX(page), { timeout: 8000 }).toBeLessThan(-560);
});

test('the cheshire cat, reduced motion: head first is two cuts and the grin stays', async ({
  browser,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(demo?.url ?? '');
  await atCue(page, 'slowly', 0);
  await page.locator('.cc__prop--head').click();
  await expect(page.locator('.cc__wood')).toHaveAttribute('data-vanish', 'head');
  const partOpacity = (selector: string) =>
    page.evaluate(
      (sel) => Number(document.querySelector(sel)?.getAttribute('opacity') ?? 1),
      selector,
    );
  // Under reduced motion each beat is shown settled: whole at the choice, and by
  // the last beat the Cat is gone and only the grin is left, risen into the moon.
  await expect.poll(() => partOpacity('.cc__cat [data-cat="ears"]'), { timeout: 8000 }).toBe(1);
  await expect.poll(() => partOpacity('.cc__cat'), { timeout: 8000 }).toBe(1);
  await atCue(page, 'grin', 0);
  await expect.poll(() => partOpacity('.cc__cat [data-cat="ears"]'), { timeout: 8000 }).toBe(0);
  await expect.poll(() => partOpacity('.cc__cat'), { timeout: 8000 }).toBe(0);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.cc__moon-grin') as Element).opacity),
        ),
      { timeout: 8000 },
    )
    .toBeGreaterThan(0.5);
  await context.close();
});
