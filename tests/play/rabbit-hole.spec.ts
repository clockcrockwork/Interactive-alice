import { expect, test } from '@playwright/test';
import { atCue, demos, scrollTo } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'rabbit-hole');

test.describe('the rabbit hole: looking at a map', () => {
  test.skip(!demo, 'no rabbit-hole page in the manifest');

  // The well is WebGL; on a software renderer under load its frames are slow.
  test.slow();

  const isOpen = (page: import('@playwright/test').Page) =>
    page.evaluate(() => document.querySelector('.rh__map')?.hasAttribute('data-open') ?? false);

  test('the button brings the map close, Look away puts it back, and the end never holds it', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await expect(page.locator('.rh__map')).toHaveCount(1);
    await expect(page.locator('.rh__map')).not.toHaveAttribute('data-open', '');

    // Before the map beats the buttons are not offered.
    await atCue(page, 'drop', 0.5);
    await expect(page.locator('.rh__prop-map')).not.toHaveAttribute('data-shown', '');

    await atCue(page, 'jar', 0.5);
    const look = page.locator('.rh__prop-map');
    await expect(look).toHaveAttribute('data-shown', '', { timeout: 20_000 });
    await look.click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    await expect(page.locator('.rh__prop-away')).toHaveAttribute('data-shown', '');
    await expect(look).not.toHaveAttribute('data-shown', '');
    await expect
      .poll(() => page.locator('.rh__map-sheet').evaluate((el) => getComputedStyle(el).opacity), {
        timeout: 20_000,
      })
      .toBe('1');

    await page.locator('.rh__prop-away').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
    await expect(look).toHaveAttribute('data-shown', '');

    // Opened again and scrolled past: the timeline closes it and the end never holds it.
    await look.click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    await atCue(page, 'flip', 0.5);
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
    await expect(page.locator('.rh__prop-away')).not.toHaveAttribute('data-shown', '');
    await scrollTo(page, 1);
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? -1), { timeout: 20_000 })
      .toBeGreaterThan(0.99);
    expect(await isOpen(page)).toBe(false);
    await expect(page.locator('.rh__prop-map')).not.toHaveAttribute('data-shown', '');
  });

  test('scrolling back above the map beats puts the map back on the wall', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'jar', 0.5);
    await expect(page.locator('.rh__prop-map')).toHaveAttribute('data-shown', '', {
      timeout: 20_000,
    });
    await page.locator('.rh__prop-map').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    await atCue(page, 'drop', 0.3);
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
  });

  test('under reduced motion the map fades in place and closes the same way', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'jar', 0.5);
    await expect(page.locator('.rh__prop-map')).toHaveAttribute('data-shown', '', {
      timeout: 20_000,
    });
    await page.locator('.rh__prop-map').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(true);
    expect(
      await page.locator('.rh__map-sheet').evaluate((el) => getComputedStyle(el).transform),
    ).toBe('none');
    await page.locator('.rh__map-sheet').click();
    await expect.poll(() => isOpen(page), { timeout: 20_000 }).toBe(false);
  });
});

/** Runs an action and says whether the element's attribute changed at any moment
 *  while it played out, however briefly: a slow machine may miss a short pose. */
const changedDuring = async (
  page: import('@playwright/test').Page,
  selector: string,
  attribute: string,
  action: () => Promise<void>,
) => {
  await page.evaluate(
    ([sel, name]) => {
      const el = document.querySelector(sel);
      const store = window as unknown as { __changed?: boolean };
      store.__changed = false;
      const before = el?.getAttribute(name);
      if (el) {
        new MutationObserver(() => {
          store.__changed ||= el.getAttribute(name) !== before;
        }).observe(el, { attributes: true, attributeFilter: [name] });
      }
    },
    [selector, attribute] as const,
  );
  await action();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __changed?: boolean }).__changed), {
      timeout: 5000,
    })
    .toBe(true);
};

const transformOf = (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate(
    (sel) => getComputedStyle(document.querySelector(sel) as Element).transform,
    selector,
  );
const opacityOf = (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate(
    (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
    selector,
  );

test.describe('the rabbit hole: above ground, the jar, the curtsey and the chase', () => {
  test.skip(!demo, 'no rabbit-hole page in the manifest');
  test.slow();

  test('it opens on the field: the Rabbit pops down, Alice runs on and ducks in after him; back, she is there again', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await expect.poll(() => opacityOf(page, '.rh__surface .field__runner')).toBeGreaterThan(0.95);
    await expect.poll(() => opacityOf(page, '.rh__surface .field__rabbit')).toBeGreaterThan(0.95);
    await atCue(page, 'tunnel', 0.9);
    await expect
      .poll(() => opacityOf(page, '.rh__surface .field__runner'), { timeout: 20_000 })
      .toBeLessThan(0.05);
    await scrollTo(page, 0);
    await expect
      .poll(() => opacityOf(page, '.rh__surface .field__runner'), { timeout: 20_000 })
      .toBeGreaterThan(0.95);
  });

  test('a tap on the passing jar takes it: nothing above it swallows the tap', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'jar', 0.35);
    const jar = page.locator('.rh__jar');
    const box = await jar.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
      return;
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const hit = await page.evaluate(
      ([px, py]) => Boolean(document.elementFromPoint(px, py)?.closest('.rh__jar')),
      [x, y] as const,
    );
    expect(hit).toBe(true);
    await page.mouse.click(x, y);
    await expect
      .poll(() => page.evaluate(() => Boolean(document.querySelector('.rh__hand .rh__jar'))), {
        timeout: 20_000,
      })
      .toBe(true);
    await expect(page.locator('.rh__prop-jar')).not.toHaveAttribute('data-shown', '');
    // Scrolled back above the shelf, it is on the shelf again to be taken.
    await atCue(page, 'drop', 0.5);
    await expect
      .poll(() => page.evaluate(() => Boolean(document.querySelector('.rh__jar-track .rh__jar'))), {
        timeout: 20_000,
      })
      .toBe(true);
  });

  test('on a phone, Take the jar and Look at the map sit apart', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'jar', 0.3);
    const jar = page.locator('.rh__prop-jar');
    const map = page.locator('.rh__prop-map');
    await expect(jar).toBeVisible({ timeout: 20_000 });
    await expect(map).toBeVisible({ timeout: 20_000 });
    const a = await jar.boundingBox();
    const b = await map.boundingBox();
    expect(a && b).toBeTruthy();
    if (a && b) {
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y;
      expect(apart).toBe(true);
    }
  });

  test('she curtseys in the air, and Bow makes her curtsey again, only in its beat', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    const alice = page.locator('.rh__alice');
    const bow = page.locator('.rh__prop-bow');
    await atCue(page, 'flip', 0.5);
    await expect(bow).not.toHaveAttribute('data-shown', '');
    await atCue(page, 'curtsey', 0.35);
    await expect(alice).toHaveAttribute('data-bow', '', { timeout: 20_000 });
    await atCue(page, 'curtsey', 0.8);
    await expect(alice).not.toHaveAttribute('data-bow', '', { timeout: 20_000 });
    await expect(bow).toHaveAttribute('data-shown', '');
    await changedDuring(page, '.rh__alice', 'data-bowing', () => bow.click());
    await expect(alice).not.toHaveAttribute('data-bowing', '', { timeout: 5000 });
    await atCue(page, 'bats', 0.5);
    await expect(bow).not.toHaveAttribute('data-shown', '');
  });

  test('a bat chases a ghost of Dinah round the well, then Dinah chases the bat; Call Dinah makes her pounce', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'cats', 0.25);
    await expect
      .poll(() => opacityOf(page, '.rh__chase'), { timeout: 20_000 })
      .toBeGreaterThan(0.9);
    const first = await transformOf(page, '.rh__chaser--cat');
    await atCue(page, 'cats', 0.7);
    const second = await transformOf(page, '.rh__chaser--cat');
    expect(second).not.toBe(first);
    const call = page.locator('.rh__prop-call');
    await expect(call).toHaveAttribute('data-shown', '');
    await changedDuring(page, '.rh__chaser--cat', 'style', () => call.click());
    await atCue(page, 'dream', 0.5);
    await expect.poll(() => opacityOf(page, '.rh__chase'), { timeout: 20_000 }).toBeLessThan(0.05);
    await expect(call).not.toHaveAttribute('data-shown', '');
  });

  test('under reduced motion the roll and the curtsey are stills: upside down, then curtseying', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    const upsideDown = (t: string) => t.startsWith('matrix(-1') || t.includes('-1, 0, 0, -1');
    await atCue(page, 'flip', 0);
    await expect.poll(() => transformOf(page, '.rh__alice').then(upsideDown)).toBe(true);
    await atCue(page, 'curtsey', 0);
    await expect(page.locator('.rh__alice')).toHaveAttribute('data-bow', '');
    await expect.poll(() => transformOf(page, '.rh__alice').then(upsideDown)).toBe(true);
    await atCue(page, 'bats', 0);
    await expect.poll(() => transformOf(page, '.rh__alice').then(upsideDown)).toBe(false);
    await expect(page.locator('.rh__alice')).not.toHaveAttribute('data-bow', '');
  });
});
