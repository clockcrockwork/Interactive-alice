import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos, press, scrollTo } from '../demo-helpers.ts';

/**
 * Drink Me: peeking behind the low curtain before the story finds the little door.
 * The curtain carries `data-peek` while the reader holds it up, and `--curtain-lift`
 * (0..1) is the lift the story and the reader share: the story's wins.
 */
const demo = demos.find((d) => d.demo === 'drink-me');
const CURTAIN = '.dk__curtain';
const BUTTON = '.dk__prop--peek';

test.describe('Drink Me: the curtain', () => {
  test.skip(!demo, 'no drink-me page in this build');

  test('at the hall beat the button lifts the curtain, and it drops again by itself', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect.poll(() => customProperty(page, CURTAIN, '--curtain-lift')).toBe(0);

    await press(page, page.locator(BUTTON));
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    // The lift is a tween; on a slow renderer only its start may be seen before
    // the moment is over, so any lift at all is the check here.
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => customProperty(page, '.dk__keyhole-glow', '--peek-glow'), { timeout: 5000 })
      .toBeGreaterThan(0);

    // A moment later it has dropped back, glow and all.
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 6000 });
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeLessThan(0.05);
    await expect
      .poll(() => customProperty(page, '.dk__keyhole-glow', '--peek-glow'), { timeout: 5000 })
      .toBeLessThan(0.05);
  });

  test('pressing again keeps it up until it is pressed once more', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    await press(page, page.locator(BUTTON));
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await press(page, page.locator(BUTTON));
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 8000 })
      .toBeGreaterThan(0.5);
    await page.waitForTimeout(2500);
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 8000 })
      .toBeGreaterThan(0.5);
    await press(page, page.locator(BUTTON));
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 3000 });
  });

  test('a fine pointer resting on the curtain lifts it, and moving away lets it drop', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    // Hover is play for a mouse: a touch screen has no resting pointer, and its way
    // to the same peek is the button (above) and pressing the curtain (below).
    test.skip(
      !(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)),
      'no hovering pointer on this device; the button and the press are its way',
    );
    await atCue(page, 'hall', 0.5);
    const box = await page.locator(CURTAIN).boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
      return;
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3);
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await page.mouse.move(10, 10);
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 6000 });
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeLessThan(0.05);
  });

  test('pressing the curtain holds it up until let go, though she stoops under the finger', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    // Pressing and holding keeps it up though she stoops and the curtain moves on
    // screen; letting go drops it. The curtain listens for pointer events of any
    // kind, and a held mouse button is the hold every engine can drive here, on
    // the phone projects as well (no engine offers a held touch to a test).
    //
    // The hall leans toward a mouse, and a resting mouse lifts the curtain and she
    // stoops, so the curtain moves as the pointer comes to it: aim, let it settle,
    // and aim again until it holds still under the pointer, then press there.
    const curtainSpot = () =>
      page.evaluate((selector) => {
        const b = document.querySelector(selector)?.getBoundingClientRect();
        if (!b) {
          return undefined;
        }
        // A point of the curtain itself, nearest its upper middle: lifted, it is
        // shorter, and the little door and its glow show through below.
        for (const fy of [0.3, 0.2, 0.4, 0.1, 0.5]) {
          for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7]) {
            const x = b.x + b.width * fx;
            const y = b.y + b.height * fy;
            if (document.elementFromPoint(x, y)?.closest(selector)) {
              return { x, y };
            }
          }
        }
        return undefined;
      }, CURTAIN);
    let spot = await curtainSpot();
    for (let tries = 0; tries < 8 && spot; tries += 1) {
      await page.mouse.move(spot.x, spot.y, { steps: 4 });
      await page.waitForTimeout(400);
      const again = await curtainSpot();
      const still = again && Math.hypot(again.x - spot.x, again.y - spot.y) < 2;
      spot = again;
      if (still) {
        break;
      }
    }
    expect(spot, 'the curtain is there to press').toBeDefined();
    await page.mouse.move(spot?.x ?? 0, spot?.y ?? 0);
    await page.mouse.down();
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await page.waitForTimeout(2500);
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.5);
    await page.mouse.up();
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 6000 });
  });

  test('the curtain drops when the scroll moves on, and the story lifts it regardless', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    await press(page, page.locator(BUTTON));
    await press(page, page.locator(BUTTON));
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');

    // Moving on to the story's own beat: the peek lets go and the story has the curtain.
    await atCue(page, 'garden', 0.5);
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 5000 });
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.99);
    await expect(page.locator(BUTTON)).toBeHidden();

    // Back before the hall, nothing offers a peek and the curtain hangs down.
    await atCue(page, 'locked', 0.5);
    await expect(page.locator(BUTTON)).toBeHidden();
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeLessThan(0.05);
    await scrollTo(page, 1);
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.99);
  });

  test('without any interaction the story finds the door at its own beat', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'key', 0.6);
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.99);
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '');
  });
});

const cssNumber = (page: import('@playwright/test').Page, selector: string, prop: string) =>
  page.evaluate(
    ([sel, name]) =>
      Number(getComputedStyle(document.querySelector(sel) as Element).getPropertyValue(name)),
    [selector, prop] as const,
  );
const opacityOf = (page: import('@playwright/test').Page, selector: string) =>
  cssNumber(page, selector, 'opacity');

test.describe('Drink Me: the key, the bottle and the table leg', () => {
  test.skip(!demo, 'no drink-me page in this build');

  test('the key is on the table, in her hand while she has it, and on the table again when she has left it there', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'key', 0.6);
    await expect.poll(() => opacityOf(page, '.dk__key'), { timeout: 5000 }).toBeGreaterThan(0.95);
    // A tap on the key itself reaches it: nothing hidden lies over it. The hall
    // leans toward the pointer, so the key moves as the mouse comes to it: aim,
    // let the lean settle, and aim again until the key holds still under it, as a
    // reader's hand does. The point is well inside the key, not on its edge.
    const keySpot = () =>
      page.evaluate(() => {
        const b = document.querySelector('.dk__key')?.getBoundingClientRect();
        if (!b) {
          return undefined;
        }
        const onKey = (px: number, py: number) =>
          Boolean(document.elementFromPoint(px, py)?.closest('.dk__key'));
        for (let i = 3; i < 8; i += 1) {
          for (let j = 2; j < 5; j += 1) {
            const px = b.x + (b.width * i) / 10;
            const py = b.y + (b.height * j) / 6;
            const around = [
              [0, 0],
              [2, 0],
              [-2, 0],
              [0, 2],
              [0, -2],
            ];
            if (around.every(([dx = 0, dy = 0]) => onKey(px + dx, py + dy))) {
              return { x: px, y: py };
            }
          }
        }
        return undefined;
      });
    let spot = await keySpot();
    for (let tries = 0; tries < 6 && spot; tries += 1) {
      await page.mouse.move(spot.x, spot.y, { steps: 4 });
      await page.waitForTimeout(500);
      const again = await keySpot();
      const still = again && Math.hypot(again.x - spot.x, again.y - spot.y) < 2;
      spot = again;
      if (still) {
        break;
      }
    }
    expect(spot, 'nothing hidden lies over the key').toBeDefined();
    await page.mouse.click(spot?.x ?? 0, spot?.y ?? 0);
    await expect(page.locator('.dk__hands')).toHaveAttribute('data-key', '');
    await expect.poll(() => opacityOf(page, '.dk__key'), { timeout: 5000 }).toBeLessThan(0.05);
    await expect(page.locator('.dk__prop--key')).toBeHidden();

    // Back above the key beat: on the table again, and offered again on the way down.
    await atCue(page, 'hall', 0.5);
    await expect(page.locator('.dk__hands')).not.toHaveAttribute('data-key', '');
    await expect.poll(() => opacityOf(page, '.dk__key'), { timeout: 5000 }).toBeGreaterThan(0.95);
    await atCue(page, 'key', 0.3);
    await expect(page.locator('.dk__prop--key')).toBeVisible({ timeout: 8000 });

    // She leaves it on the table, where "she could see it through the glass top".
    await atCue(page, 'key-lost', 0.5);
    await expect(page.locator('.dk__hands')).not.toHaveAttribute('data-key', '');
    await expect.poll(() => opacityOf(page, '.dk__key'), { timeout: 5000 }).toBeGreaterThan(0.95);
    const seen = await page.locator('.dk__key').boundingBox();
    const view = page.viewportSize();
    expect(seen && view).toBeTruthy();
    if (seen && view) {
      expect(seen.y + seen.height / 2).toBeGreaterThan(0);
      expect(seen.y + seen.height / 2).toBeLessThan(view.height);
    }
  });

  test('a key taken and a fast scroll to the end never leave it in her hand', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'key', 0.3);
    await page.locator('.dk__prop--key').click();
    await expect(page.locator('.dk__hands')).toHaveAttribute('data-key', '');
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight - window.innerHeight),
    );
    await scrollTo(page, 1);
    await expect(page.locator('.dk__hands')).not.toHaveAttribute('data-key', '');
    await expect
      .poll(() => opacityOf(page, '.dk__hand--key'), { timeout: 5000 })
      .toBeLessThan(0.05);
  });

  test('Turn the bottle round turns it in her hand, and every side says the same and only that', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'bottle', 0.5);
    await expect(page.locator('.dk__prop--turn')).toBeHidden();
    await atCue(page, 'poison', 0.9);
    const button = page.locator('.dk__prop--turn');
    await expect(button).toBeVisible({ timeout: 8000 });
    const before = await cssNumber(page, '.dk__turn', '--turn');
    await button.click();
    await expect
      .poll(() => cssNumber(page, '.dk__turn', '--turn'), { timeout: 5000 })
      .toBeGreaterThan(before + 300);
    // Four sides, one label: the words the bottle's own sentence sets apart.
    const faces = await page.locator('.dk__label-face').allTextContents();
    expect(faces).toHaveLength(4);
    const words = faces[0]?.trim() ?? '';
    expect(words).not.toBe('');
    for (const face of faces) {
      expect(face.trim()).toBe(words);
    }
    const said = await page.locator('.demo-beat[data-cue="bottle"] .line').allTextContents();
    expect(said.some((line) => line.includes(words))).toBe(true);
    const poison = await page.locator('.demo-beat[data-cue="poison"] .line').allTextContents();
    expect(poison.some((line) => line.includes(words))).toBe(false);
    // The drink is still the taste's; the turn is gone when the beat is.
    await atCue(page, 'taste', 0.3);
    await expect(button).toBeHidden();
    await expect(page.locator('.dk__prop--drink')).toBeVisible();
  });

  test('Climb the table leg: up she goes and slides back down, and the story tries once itself', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const camY = () => cssNumber(page, '.dk__hall', '--cam-y');
    await atCue(page, 'key-lost', 0.2);
    const climb = page.locator('.dk__prop--climb');
    // Not until she is under the table, looking up at the key.
    await expect(climb).toBeHidden();
    await atCue(page, 'key-lost', 0.48);
    await expect(climb).toBeVisible({ timeout: 8000 });
    const rest = await camY();
    await climb.click();
    await expect.poll(camY, { timeout: 5000 }).toBeGreaterThan(rest + 100);
    await expect.poll(camY, { timeout: 8000 }).toBeLessThan(rest + 5);
    // The story's own try, scrolled through: up the leg, then down again.
    await atCue(page, 'key-lost', 0.68);
    await expect.poll(camY, { timeout: 8000 }).toBeGreaterThan(rest + 100);
    await atCue(page, 'cry', 0.5);
    await expect(climb).toBeHidden();
    await expect.poll(camY, { timeout: 8000 }).toBeLessThan(rest);
  });

  test('under reduced motion the bottle is a still between two sides and the climb is a still part way up', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(demo?.url ?? '');
    await atCue(page, 'poison', 0);
    await expect.poll(() => cssNumber(page, '.dk__turn', '--turn')).toBe(45);
    await page.locator('.dk__prop--turn').click();
    await expect.poll(() => cssNumber(page, '.dk__turn', '--turn')).toBe(135);
    await atCue(page, 'key-lost', 0);
    await expect.poll(() => cssNumber(page, '.dk__hall', '--cam-y')).toBeGreaterThan(100);
    await expect.poll(() => opacityOf(page, '.dk__key')).toBeGreaterThan(0.95);
  });
});
