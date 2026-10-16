import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'pool-of-tears');
const LEAN = '.pt__sea';

/** Presses a lean button without moving the mouse over it, which would lean the water itself. */
const press = async (page: Parameters<typeof atCue>[0], side: 'left' | 'right') => {
  const button = page.locator(`.pt__prop--${side}`);
  await expect(button).toHaveAttribute('data-shown', '');
  await button.dispatchEvent('click');
};

for (const reduced of ['no-preference', 'reduce'] as const) {
  test.describe(`lean (${reduced})`, () => {
    test.use({ reducedMotion: reduced });

    test('Lean left tips the water left, then it levels; Lean right tips it right', async ({
      page,
    }) => {
      test.skip(!demo, 'the pool-of-tears demo is not built');
      await page.goto(demo?.url ?? '');
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await atCue(page, 'mouse');
      // The mouse rests mid-stage so the pointer's own lean is nil.
      const stage = await page.locator('.demo__stage').boundingBox();
      await page.mouse.move((stage?.x ?? 0) + (stage?.width ?? 0) / 2, (stage?.y ?? 0) + 200);
      await expect.poll(() => customProperty(page, LEAN, '--lean'), { timeout: 3000 }).toBe(0);

      await press(page, 'left');
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 2000 })
        .toBeLessThan(-3);
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 5000 })
        .toBeGreaterThan(-1);

      await press(page, 'right');
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 2000 })
        .toBeGreaterThan(3);
      await expect
        .poll(() => customProperty(page, LEAN, '--lean'), { timeout: 5000 })
        .toBeLessThan(1);
      // The lean never exceeds its few degrees.
      expect(Math.abs(await customProperty(page, LEAN, '--lean'))).toBeLessThanOrEqual(8);
    });
  });
}

test('the lean buttons are not offered before she is in the pool', async ({ page }) => {
  test.skip(!demo, 'the pool-of-tears demo is not built');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await atCue(page, 'giant');
  await expect(page.locator('.pt__prop--left')).not.toHaveAttribute('data-shown', '');
  await expect.poll(() => customProperty(page, LEAN, '--lean')).toBe(0);
});

/** The stage-relative centre of an element's box, for aiming a real pointer. */
const centreOf = async (page: Parameters<typeof atCue>[0], selector: string) => {
  const box = await page.locator(selector).boundingBox();
  return { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 };
};

test('a tap on the water reaches the sea: no layer over it takes the pointer', async ({ page }) => {
  test.skip(!demo, 'the pool-of-tears demo is not built');
  await page.goto(demo?.url ?? '');
  for (const cue of ['tears', 'fan', 'mouse', 'crowd']) {
    await atCue(page, cue, 0.6);
    const hit = await page.evaluate(() => {
      const stage = document.querySelector('.demo__stage')?.getBoundingClientRect();
      const x = (stage?.left ?? 0) + (stage?.width ?? 0) * 0.12;
      const y = (stage?.top ?? 0) + (stage?.height ?? 0) * 0.62;
      return document.elementFromPoint(x, y)?.className ?? '';
    });
    expect(hit, `at ${cue}`).toBe('pt__canvas');
  }
});

for (const reduced of ['no-preference', 'reduce'] as const) {
  test.describe(`cry a tear and fan yourself (${reduced})`, () => {
    test.use({ reducedMotion: reduced });

    test('Cry a tear is offered while she cries, and each tear raises the pool a notch', async ({
      page,
    }) => {
      test.skip(!demo, 'the pool-of-tears demo is not built');
      await page.goto(demo?.url ?? '');
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      const cry = page.locator('.pt__prop--cry');
      await atCue(page, 'giant', 0.5);
      await expect(cry).not.toHaveAttribute('data-shown', '');
      await atCue(page, 'tears', 0.5);
      await expect(cry).toHaveAttribute('data-shown', '');
      await cry.click();
      await expect.poll(() => customProperty(page, LEAN, '--cried'), { timeout: 4000 }).toBe(1);
      // A tap on the floor sheds one too, where the finger is.
      const at = await centreOf(page, '.pt__canvas');
      await page.mouse.click(at.x * 0.2, at.y * 1.5);
      await expect.poll(() => customProperty(page, LEAN, '--cried'), { timeout: 4000 }).toBe(2);
      // Not once the fan is in her hand.
      await atCue(page, 'fan', 0.5);
      await expect(cry).not.toHaveAttribute('data-shown', '');
    });

    test('Fan yourself is offered in the fan beat; each wave counts, and is forgotten before it', async ({
      page,
    }) => {
      test.skip(!demo, 'the pool-of-tears demo is not built');
      await page.goto(demo?.url ?? '');
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      const fan = page.locator('.pt__prop--fan');
      await atCue(page, 'rabbit', 0.5);
      await expect(fan).not.toHaveAttribute('data-shown', '');
      await atCue(page, 'fan', 0.4);
      await expect(fan).toHaveAttribute('data-shown', '');
      await fan.click();
      await fan.click();
      await expect.poll(() => customProperty(page, LEAN, '--fanned'), { timeout: 4000 }).toBe(2);
      // The fan itself takes a tap too.
      await page.locator('.pt__fan').dispatchEvent('click');
      await expect.poll(() => customProperty(page, LEAN, '--fanned'), { timeout: 4000 }).toBe(3);
      await atCue(page, 'rabbit', 0.5);
      await expect.poll(() => customProperty(page, LEAN, '--fanned'), { timeout: 8000 }).toBe(0);
    });
  });
}

test.describe('reduced motion: drowned in her own tears', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the settled beat is under the water, and the sentences are clear', async ({ page }) => {
    test.skip(!demo, 'the pool-of-tears demo is not built');
    await page.goto(demo?.url ?? '');
    await atCue(page, 'swim', 0);
    const look = () =>
      page.evaluate(() => ({
        under: Number(getComputedStyle(document.querySelector('.pt__under') as Element).opacity),
        filter: getComputedStyle(
          document.querySelector('.demo__stage .demo-beat[data-cue="swim"]') as Element,
        ).filter,
      }));
    await expect.poll(async () => (await look()).under, { timeout: 8000 }).toBeGreaterThan(0.9);
    expect((await look()).filter).toBe('none');
    // And up again by the next beat.
    await atCue(page, 'mouse', 0);
    await expect.poll(async () => (await look()).under, { timeout: 8000 }).toBeLessThan(0.05);
  });
});

test.describe('a phone', () => {
  test.use({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });

  test('the six sentences about cats are all on screen, and no button sits on them', async ({
    page,
  }) => {
    test.skip(!demo, 'the pool-of-tears demo is not built');
    await page.goto(demo?.url ?? '');
    await atCue(page, 'cats', 0.6);
    const lines = page.locator('.demo__stage .demo-beat[data-cue="cats"] .line');
    await expect(lines).toHaveCount(6);
    const last = await lines.last().boundingBox();
    expect((last?.y ?? 0) + (last?.height ?? 0)).toBeLessThanOrEqual(780);
    const beat = await page.locator('.demo__stage .demo-beat[data-cue="cats"]').boundingBox();
    for (const selector of ['.pt__prop--stir', '.pt__prop--left', '.pt__prop--right']) {
      await expect(page.locator(selector)).toHaveAttribute('data-shown', '');
      const button = await page.locator(selector).boundingBox();
      const apart =
        !beat ||
        !button ||
        button.y + button.height <= beat.y ||
        button.y >= beat.y + beat.height ||
        button.x + button.width <= beat.x ||
        button.x >= beat.x + beat.width;
      expect(apart, `${selector} clear of the sentences`).toBe(true);
    }
  });
});
