/**
 * The Dormouse's tale: the camera keeps the sentence being told in the middle on
 * a phone, nothing hides the cup under reduced motion, and the reader's hands
 * reach it: the Dormouse, a stir, the bucket of treacle and the M.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, demos, tapAt } from '../demo-helpers.ts';

const demo = demos.find((candidate) => candidate.demo === 'dormouse');

const label = (page: Page, key: string) =>
  page.evaluate(
    (k) =>
      (
        JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<
          string,
          string
        >
      )[k] ?? '',
    key,
  );

/**
 * Where the sentence being told (the last bright one) sits, against the frame: its
 * middle character, through the SVG text interface. A `tspan` on a `textPath` has
 * no box every engine agrees on (Firefox's lies far off the page), while a
 * character's extent is defined the same everywhere.
 */
const toldOffset = (page: Page) =>
  page.evaluate(() => {
    const text = document.querySelector<SVGTextElement>('.dm__text');
    const spans = [...document.querySelectorAll<SVGTSpanElement>('.dm__text tspan')];
    const bright = spans.filter(
      (span) => Number(getComputedStyle(span).getPropertyValue('--tone')) > 0.95,
    );
    const told = bright[bright.length - 1];
    const stage = document.querySelector('.demo__stage')?.getBoundingClientRect();
    const matrix = text?.getScreenCTM();
    if (!text || !told || !stage || !matrix) {
      return { dx: 1, dy: 1 };
    }
    let first = 0;
    for (const span of spans.slice(0, spans.indexOf(told))) {
      first += span.getNumberOfChars();
    }
    const extent = text.getExtentOfChar(first + Math.floor(told.getNumberOfChars() / 2));
    const centre = new DOMPoint(
      extent.x + extent.width / 2,
      extent.y + extent.height / 2,
    ).matrixTransform(matrix);
    return {
      dx: Math.abs(centre.x - (stage.left + stage.width / 2)) / stage.width,
      dy: Math.abs(centre.y - (stage.top + stage.height / 2)) / stage.height,
    };
  });

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('the dormouse: the camera keeps the sentence being told in the middle of a phone', async ({
    page,
  }) => {
    test.skip(!demo, 'no dormouse demo in this build');
    await page.goto(demo?.url ?? '');
    for (const cue of ['spiral', 'draw', 'doze', 'muchness']) {
      await atCue(page, cue, 0.95);
      await expect
        .poll(async () => (await toldOffset(page)).dx, { timeout: 8000, message: cue })
        .toBeLessThan(0.2);
      await expect
        .poll(async () => (await toldOffset(page)).dy, { timeout: 8000, message: cue })
        .toBeLessThan(0.2);
    }
  });
});

test('the dormouse, reduced motion: nothing covers the cup while the tale is told', async ({
  browser,
}) => {
  test.skip(!demo, 'no dormouse demo in this build');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(demo?.url ?? '');
  // Every layer above the cup that is showing must be see-through: no solid
  // ground, no picture over the tale.
  const covering = () =>
    page.evaluate(() => {
      const layers = [...document.querySelectorAll<HTMLElement>('.demo__stage > .demo__layer')];
      const cupAt = layers.findIndex((layer) => layer.classList.contains('dm__stage'));
      return layers
        .slice(cupAt + 1)
        .filter((layer) => {
          const style = getComputedStyle(layer);
          const solid =
            style.backgroundImage !== 'none' ||
            !/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor);
          return solid && Number(style.opacity) > 0.05 && style.visibility !== 'hidden';
        })
        .map((layer) => layer.className);
    });
  for (const cue of ['asleep', 'spiral', 'draw', 'doze', 'muchness']) {
    await atCue(page, cue, 0);
    await expect.poll(covering, { timeout: 8000, message: cue }).toEqual([]);
  }
  await expect(page.locator('.dm__text')).toBeVisible();
  await context.close();
});

test("the dormouse: the reader's hands reach the cup and the Dormouse", async ({ page }) => {
  test.skip(!demo, 'no dormouse demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'spiral', 0.95);
  // Nothing drawn over the cup takes the pointer from it.
  const centre = await page.evaluate(() =>
    Boolean(document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.dm__stage')),
  );
  expect(centre).toBe(true);
  // The first touch says what a touch can do, and a drag across the cup stirs it.
  const turn = () =>
    page.evaluate(() =>
      document.querySelector<HTMLElement>('.dm__cup')?.style.getPropertyValue('--cup-transform'),
    );
  const before = await turn();
  await page.mouse.move(380, 420);
  await page.mouse.down();
  await page.mouse.move(760, 430, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.demo__status')).toHaveText(await label(page, 'demoStirTreacle'));
  await expect.poll(turn, { timeout: 5000 }).not.toBe(before);
  // Its keyboard twin is a real button.
  await expect(page.locator('.dm__prop-stir')).toBeVisible();
  // A press on the Dormouse itself wakes it with a shriek.
  await atCue(page, 'doze', 0.9);
  await page.locator('.dm__mouse').click();
  await expect(page.locator('.dm__mouse')).toHaveAttribute('data-shriek', '');
  await expect(page.locator('.dm__svg--text')).not.toHaveAttribute('data-dozing', '', {
    timeout: 5000,
  });
});

test('the dormouse: a bucket of treacle is drawn up the spiral, and the M becomes pictures', async ({
  page,
}) => {
  test.skip(!demo, 'no dormouse demo in this build');
  await page.goto(demo?.url ?? '');
  const draw = page.locator('.dm__prop-draw');
  await expect(draw).not.toHaveAttribute('data-shown', '');
  await atCue(page, 'draw', 0.5);
  await expect(draw).toHaveAttribute('data-shown', '');
  await expect(draw).toHaveText(await label(page, 'demoDrawTreacle'));
  // Drops are counted as they fall, not as many as are on screen at once: a drop
  // lives a second and a half by the clock and one falls each frame or so, so on a
  // machine whose frames are long only one or two are ever there together.
  await page.evaluate(() => {
    const host = window as unknown as { __drops?: number };
    host.__drops = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && node.classList.contains('dm__drop')) {
            host.__drops = (host.__drops ?? 0) + 1;
          }
        }
      }
    }).observe(document.querySelector('.dm__svg--bucket') as Node, {
      childList: true,
      subtree: true,
    });
  });
  await draw.click();
  await expect(page.locator('.dm__svg--bucket')).toHaveAttribute('data-on', '');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __drops?: number }).__drops ?? 0), {
      timeout: 5000,
    })
    .toBeGreaterThan(2);
  // The trip ends and the bucket goes.
  await expect(page.locator('.dm__svg--bucket')).not.toHaveAttribute('data-on', '', {
    timeout: 8000,
  });
  // The prop is gone before the doze.
  await atCue(page, 'doze', 0.5);
  await expect(draw).not.toHaveAttribute('data-shown', '');

  // The letter is the page's own: the capital standing alone in the doze beat.
  const letter = await page.locator('.dm__letters .dm__letter').first().textContent();
  const doze = await page.locator('.demo-beat[data-cue="doze"]').textContent();
  expect(letter).toMatch(/^\p{Lu}$/u);
  expect(doze).toContain(` ${letter}`);
  // At muchness a letter pressed becomes a picture, and so does one the prop picks.
  await atCue(page, 'muchness', 0.5);
  // The letters float up and out of the top, and a picture turns back into its
  // letter there; on a machine whose frames are slow, the seconds between the
  // prop, reading a letter's box and the tap landing let them float on by a
  // letter's height or more. So they are held still first, with the motion pause,
  // as a reader who wants to catch one may.
  await page.locator('.demo__motion').click();
  await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
  const m = page.locator('.dm__prop-m');
  await expect(m).toHaveAttribute('data-shown', '');
  await m.click();
  await expect(page.locator('.dm__letter[data-picture] svg')).toHaveCount(1);
  const pictures = page.locator('.dm__letter[data-picture]');
  const plain = page.locator('.dm__letters .dm__letter:not([data-picture])');
  const count = await plain.count();
  for (let i = 0; i < count; i += 1) {
    const box = await plain.nth(i).boundingBox();
    if (box && box.y > 120 && box.y < 600) {
      await tapAt(page, box.x + box.width / 2, box.y + box.height / 2);
      break;
    }
  }
  await expect.poll(() => pictures.count(), { timeout: 3000 }).toBeGreaterThanOrEqual(2);
  // No lettering in the pictures: they are drawings.
  await expect(page.locator('.dm__letter[data-picture] text')).toHaveCount(0);
});
