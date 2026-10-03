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

/** The near trunks' spans in px, from the layer's own computed backgrounds. */
const nearTrunks = (page: Parameters<typeof scrollTo>[0]) =>
  page.evaluate(() => {
    const near = document.querySelector('.cc__trees--near') as HTMLElement;
    const style = getComputedStyle(near);
    const left = near.getBoundingClientRect().left;
    const width = Number.parseFloat(style.backgroundSize);
    return style.backgroundPosition
      .split(',')
      .map((position) => left + Number.parseFloat(position))
      .map((x) => ({ from: x, to: x + width }));
  });

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('the cheshire cat: no near trunk stands in front of the Cat on its bough', async ({
    page,
  }) => {
    test.skip(!demo, 'no cheshire-cat demo in this build');
    await page.goto(demo?.url ?? '');
    await atCue(page, 'puss', 0.5);
    const cat = await page.locator('.cc__cat').boundingBox();
    if (!cat) {
      throw new Error('no Cat');
    }
    for (const trunk of await nearTrunks(page)) {
      expect(trunk.to <= cat.x + 4 || trunk.from >= cat.x + cat.width - 4).toBe(true);
    }
  });
});

test('the cheshire cat: both signposts carry their arrows, and the sentences keep below the Cat', async ({
  page,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'signs', 0.5);
  for (const side of ['left', 'right']) {
    const sign = await page.locator(`.cc__sign--${side}`).boundingBox();
    const arrow = await page.locator(`.cc__sign--${side} .cc__sign-arrow`).boundingBox();
    if (!sign || !arrow) {
      throw new Error(`no ${side} sign`);
    }
    // The arrow is on its post, inside the sign, not a viewBox away from it.
    expect(arrow.x, side).toBeGreaterThanOrEqual(sign.x - 2);
    expect(arrow.x + arrow.width, side).toBeLessThanOrEqual(sign.x + sign.width + 2);
  }
  await expect(page.locator('.cc__sign--left .cc__sign-arrow')).toHaveCSS('scale', '-1 1');
  // The long beats keep their sentences clear of the Cat's body.
  for (const cue of ['ways', 'croquet']) {
    await atCue(page, cue, 0.5);
    const cat = await page.locator('.cc__cat').boundingBox();
    const top = await page.evaluate(() =>
      Math.min(
        ...[...document.querySelectorAll('.demo-beat[data-active] .line')].map(
          (line) => line.getBoundingClientRect().top,
        ),
      ),
    );
    expect(top, cue).toBeGreaterThan((cat?.y ?? 0) + (cat?.height ?? 0) - 8);
  }
});

test('the cheshire cat: the pig trots across the wood behind her, and comes back when called', async ({
  page,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const pigX = async () => {
    const box = await page.locator('.cc__pig').boundingBox();
    return (box?.x ?? 0) + (box?.width ?? 0) / 2;
  };
  await atCue(page, 'baby', 0.4);
  await expect(page.locator('.cc__pig')).toHaveAttribute('data-trotting', '');
  const across = await pigX();
  expect(across).toBeGreaterThan(0);
  expect(across).toBeLessThan(1280);
  await atCue(page, 'baby', 0.6);
  await expect.poll(pigX, { timeout: 8000 }).toBeLessThan(across - 100);
  // Gone into the wood; *Call the pig* brings it back into the frame for a while.
  await atCue(page, 'baby', 0.95);
  await expect.poll(pigX, { timeout: 8000 }).toBeLessThan(0);
  const call = page.locator('.cc__prop--pig-call');
  await expect(call).toHaveAttribute('data-shown', '');
  await call.click();
  await expect.poll(pigX, { timeout: 5000 }).toBeGreaterThan(200);
  await expect(page.locator('.cc__pig')).toHaveAttribute('data-facing', 'right');
  // And it goes on its way again: the story's place for it is the wood.
  await expect.poll(pigX, { timeout: 8000 }).toBeLessThan(0);
});

test('the cheshire cat: pig or fig, the answer shows in the moon and the grin widens', async ({
  page,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const pig = page.locator('.cc__prop--pig');
  const fig = page.locator('.cc__prop--fig');
  await atCue(page, 'baby', 0.5);
  await expect(fig).not.toHaveAttribute('data-shown', '');
  await atCue(page, 'again', 0.6);
  await expect(pig).toHaveAttribute('data-shown', '');
  await expect(fig).toHaveAttribute('data-shown', '');
  await fig.click();
  const moon = page.locator('.cc__moon-picture');
  await expect(moon).toHaveAttribute('data-picture', 'fig');
  await expect(moon).toHaveAttribute('data-shown', '');
  await expect(moon.locator('svg')).toHaveCount(1);
  await expect(moon.locator('text')).toHaveCount(0);
  await expect
    .poll(() => customProperty(page, '.cc__grin', '--more'), { timeout: 3000 })
    .toBeGreaterThan(0.3);
  // Briefly: the moon is its own again, and so is the grin.
  await expect(moon).not.toHaveAttribute('data-shown', '', { timeout: 5000 });
  await expect
    .poll(() => customProperty(page, '.cc__grin', '--more'), { timeout: 5000 })
    .toBeLessThan(0.05);
  await pig.click();
  await expect(moon).toHaveAttribute('data-picture', 'pig');
  // The answers belong to their beat.
  await atCue(page, 'slowly', 0.5);
  await expect(pig).not.toHaveAttribute('data-shown', '');
});

test('the cheshire cat, reduced motion: the pig stands still on the wood floor at its sentence', async ({
  browser,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(demo?.url ?? '');
  const inFrame = async () => {
    const box = await page.locator('.cc__pig').boundingBox();
    return Boolean(box && box.x > 0 && box.x + box.width < 1280);
  };
  await atCue(page, 'baby', 0);
  await expect.poll(inFrame, { timeout: 8000 }).toBe(true);
  await expect(page.locator('.cc__pig')).not.toHaveAttribute('data-trotting', '');
  await atCue(page, 'again', 0);
  await expect.poll(inFrame, { timeout: 8000 }).toBe(false);
  await context.close();
});

test('the cheshire cat, reduced motion: Call the Cat is back when the reader returns to the start', async ({
  browser,
}) => {
  test.skip(!demo, 'no cheshire-cat demo in this build');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(demo?.url ?? '');
  const call = page.locator('.cc__prop--call');
  await expect(call).toHaveAttribute('data-shown', '');
  await atCue(page, 'baby', 0);
  await expect(call).not.toHaveAttribute('data-shown', '');
  await scrollTo(page, 0);
  await expect(call).toHaveAttribute('data-shown', '');
  await context.close();
});
