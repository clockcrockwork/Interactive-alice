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
  timeout = 5000,
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
      timeout,
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
    const pounces = () => page.evaluate(() => window.__aliceDinahPounces?.() ?? 0);
    const taken = await pounces();
    // The press is taken in its window at once; the lunge it starts is drawn on the
    // next frames, which a software WebGL renderer under load may space seconds
    // apart, so the drawing gets the same budget as this page's other frames.
    await changedDuring(
      page,
      '.rh__chaser--cat',
      'style',
      async () => {
        await call.click();
        expect(await pounces()).toBe(taken + 1);
      },
      20_000,
    );
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

test.describe('the rabbit hole: the WebGL well lives with the page', () => {
  test.skip(!demo, 'no rabbit-hole page in the manifest');
  test.slow();

  type Page = import('@playwright/test').Page;
  const wellOf = (page: Page) => page.evaluate(() => window.__aliceWell?.());
  const rendersOf = async (page: Page) => (await wellOf(page))?.renders ?? 0;
  /** It draws, once a frame: renders go up and never twice in one frame. */
  const drawsOnce = async (page: Page) => {
    await page.evaluate(() => window.__aliceWellReset?.());
    const before = await rendersOf(page);
    await expect.poll(() => rendersOf(page), { timeout: 15_000 }).toBeGreaterThan(before + 2);
    const well = await wellOf(page);
    expect(well?.state).toBe('drawing');
    expect(well?.loops).toBe(1);
    expect(well?.mostInFrame).toBe(1);
  };
  /** It does not draw: the count holds still. */
  const stillFor = async (page: Page, state: string) => {
    const before = await rendersOf(page);
    await page.waitForTimeout(600);
    const well = await wellOf(page);
    expect(well?.renders).toBe(before);
    expect(well?.loops).toBe(0);
    expect(well?.state).toBe(state);
  };
  const lose = (page: Page) =>
    page.evaluate(() => {
      const gl = document.querySelector<HTMLCanvasElement>('.rh__canvas')?.getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_lose_context');
      (window as unknown as { __lose?: WEBGL_lose_context | null }).__lose = ext;
      ext?.loseContext();
    });
  const restore = (page: Page) =>
    page.evaluate(() =>
      (window as unknown as { __lose?: WEBGL_lose_context | null }).__lose?.restoreContext(),
    );

  test('stops on pagehide, draws again on a pageshow from the cache, one loop either way', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    test.skip(
      (await page.evaluate(() => window.__aliceDemo?.mode())) !== 'webgl',
      'this browser draws the flat well',
    );
    await atCue(page, 'bats', 0.5);
    await drawsOnce(page);
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
    );
    await stillFor(page, 'stopped');
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
    );
    await drawsOnce(page);
    // A second pageshow does not start a second loop.
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
    );
    await drawsOnce(page);
    expect(errors).toEqual([]);
  });

  test('a lost context stops the loop, a restored one draws again, and one lost for good is the flat well', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    test.skip(
      (await page.evaluate(() => window.__aliceDemo?.mode())) !== 'webgl',
      'this browser draws the flat well',
    );
    await atCue(page, 'bats', 0.5);
    await drawsOnce(page);
    await lose(page);
    await expect.poll(async () => (await wellOf(page))?.state).toBe('lost');
    await stillFor(page, 'lost');
    await restore(page);
    await drawsOnce(page);
    // Lost and never given back: the flat well, said so, and nothing more drawn.
    await lose(page);
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.mode()), { timeout: 10_000 })
      .toBe('flat');
    await stillFor(page, 'flat');
    await expect(page.locator('.rh__flat')).toBeVisible();
    await expect(page.locator('.rh__well')).toBeHidden();
    await expect(page.locator('.demo__note')).toBeVisible();
    expect(await page.evaluate(() => window.__aliceShelves?.() ?? [])).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe('the rabbit hole: a drag the browser takes back', () => {
  test.skip(!demo, 'no rabbit-hole page in the manifest');
  test.slow();

  test('a pointercancel lets go of the drag: later moves do not tumble her, and a fresh drag does', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
    await atCue(page, 'bats', 0.5);
    const tumble = () =>
      page.evaluate(() =>
        Math.abs(
          Number(
            document.querySelector<HTMLElement>('.rh__alice')?.style.getPropertyValue('--tumble'),
          ) || 0,
        ),
      );
    /** Pointer events as a touch makes them, dispatched where the browser would. */
    const pointer = (type: string, x: number, target: 'stage' | 'window') =>
      page.evaluate(
        ([kind, clientX, where]) => {
          const init = {
            bubbles: true,
            pointerType: 'touch',
            pointerId: 7,
            isPrimary: true,
            clientX: Number(clientX),
            clientY: 400,
          };
          const el =
            where === 'stage' ? document.querySelector('.demo__stage') : (window as EventTarget);
          el?.dispatchEvent(new PointerEvent(String(kind), init));
        },
        [type, x, target] as const,
      );
    // A horizontal start, then the browser hands the gesture to scrolling.
    await pointer('pointerdown', 100, 'stage');
    await pointer('pointermove', 140, 'window');
    await pointer('pointercancel', 140, 'window');
    // Whatever spin the start gave settles.
    await expect.poll(tumble, { timeout: 15_000 }).toBeLessThan(0.5);
    // Moves with no press behind them do not tumble her.
    for (let x = 160; x <= 460; x += 30) {
      await pointer('pointermove', x, 'window');
    }
    await page.waitForTimeout(400);
    expect(await tumble()).toBeLessThan(0.5);
    // A fresh drag does.
    await pointer('pointerdown', 100, 'stage');
    for (let x = 130; x <= 430; x += 30) {
      await pointer('pointermove', x, 'window');
    }
    await pointer('pointerup', 430, 'window');
    await expect.poll(tumble, { timeout: 5_000 }).toBeGreaterThan(1);
  });
});
