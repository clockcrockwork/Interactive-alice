/**
 * Pig and Pepper: the invitation is an object the reader can open, the cat on the
 * hearth answers a look, the clearing's trees never take a tap, the crockery keeps
 * off the sentences and out of the tab order until it sticks, the baby has its
 * prop, and the pig trots off along the ground into the wood.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

const demo = demos.find((candidate) => candidate.demo === 'pig-and-pepper');

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

const centreOf = async (page: Page, selector: string) => {
  const box = await page.locator(selector).boundingBox();
  if (!box) {
    throw new Error(`no box for ${selector}`);
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test('pig and pepper: the footmen take a tap, and the invitation opens on scribbles', async ({
  page,
}) => {
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  await page.goto(demo?.url ?? '');
  // The trees of the clearing are drawn over it but never take a tap.
  await atCue(page, 'footman', 0.9);
  const fish = await centreOf(page, '.pp__footman--fish');
  await page.mouse.click(fish.x, fish.y);
  await expect(page.locator('.pp__footman--fish')).toHaveAttribute('data-bow', '');

  const open = page.locator('.pp__prop--letter');
  await expect(open).not.toHaveAttribute('data-shown', '');
  // Late in the beat, when the letter has come to rest between them.
  await atCue(page, 'invitation', 0.7);
  await expect(open).toHaveAttribute('data-shown', '');
  await expect(open).toHaveText(await label(page, 'demoOpenLetter'));
  // Nearly as large as the Fish-Footman himself, and folded.
  const letter = await page.locator('.pp__letter').boundingBox();
  const footman = await page.locator('.pp__footman--fish').boundingBox();
  expect(letter?.width ?? 0).toBeGreaterThan((footman?.width ?? 0) * 0.9);
  expect(await customProperty(page, '.pp__letter', '--unfold')).toBe(0);
  // A tap on it unfolds it, and the Frog-Footman leans in to read it back.
  const at = await centreOf(page, '.pp__letter');
  await page.mouse.click(at.x, at.y);
  await expect
    .poll(() => customProperty(page, '.pp__letter', '--unfold'), { timeout: 5000 })
    .toBeGreaterThan(0.95);
  await expect(page.locator('.pp__footman--frog')).toHaveAttribute('data-reading', '');
  // Writing as scribbles: no lettering anywhere on it.
  await expect(page.locator('.pp__letter text')).toHaveCount(0);
  // It folds itself up again.
  await expect
    .poll(() => customProperty(page, '.pp__letter', '--unfold'), { timeout: 9000 })
    .toBeLessThan(0.05);
  // And the prop does the same for a keyboard.
  await open.click();
  await expect
    .poll(() => customProperty(page, '.pp__letter', '--unfold'), { timeout: 5000 })
    .toBeGreaterThan(0.95);
  // Gone with the Frog when she laughs her way back into the wood.
  await atCue(page, 'laugh', 0.7);
  await expect(open).not.toHaveAttribute('data-shown', '');
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.pp__letter') as Element).opacity),
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(0.05);
});

test('pig and pepper: the cat on the hearth grins wider and winks when looked at', async ({
  page,
}) => {
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'cat', 0.6);
  const look = page.locator('.pp__prop--look');
  await expect(look).toHaveAttribute('data-shown', '');
  await expect(look).toHaveText(await label(page, 'demoLookCat'));
  const cat = await centreOf(page, '.pp__cat');
  await page.mouse.click(cat.x, cat.y);
  await expect(page.locator('.pp__cat')).toHaveAttribute('data-wink', '');
  await expect
    .poll(() => customProperty(page, '.pp__cat-grin', '--more'), { timeout: 3000 })
    .toBeGreaterThan(0.3);
  // The wink is over and the grin is the story's again.
  await expect(page.locator('.pp__cat')).not.toHaveAttribute('data-wink', '', { timeout: 4000 });
  await expect
    .poll(() => customProperty(page, '.pp__cat-grin', '--more'), { timeout: 5000 })
    .toBeLessThan(0.05);
  await look.click();
  await expect(page.locator('.pp__cat')).toHaveAttribute('data-wink', '');
});

test('pig and pepper: the crockery is out of the tab order until it sticks, and off the sentences', async ({
  page,
}) => {
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  await page.goto(demo?.url ?? '');
  const reachable = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLButtonElement>('.pp__thing')].filter((el) => !el.inert)
          .length,
    );
  expect(await reachable()).toBe(0);
  // The cauldron and the baby are pointer play: their props are the buttons.
  await expect(page.locator('.pp__kitchen button, .pp__hands button')).toHaveCount(0);
  await atCue(page, 'throw', 0.9);
  const stuck = page.locator('.pp__glass .pp__thing');
  await expect.poll(() => stuck.count(), { timeout: 10000 }).toBeGreaterThan(2);
  // Every piece on the glass is reachable, read in one go so pieces still landing
  // cannot come between the two counts.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const onGlass = [...document.querySelectorAll<HTMLElement>('.pp__glass .pp__thing')];
          return onGlass.length > 0 && onGlass.every((el) => !el.inert);
        }),
      { timeout: 5000 },
    )
    .toBe(true);
  // Nothing on the glass sits over the sentences of the beats it stays for.
  for (const cue of ['throw', 'mind', 'axes']) {
    await atCue(page, cue, 0.6);
    const overlaps = await page.evaluate(() => {
      const lines = [...document.querySelectorAll('.demo-beat[data-active] .line')].map((line) =>
        line.getBoundingClientRect(),
      );
      return [...document.querySelectorAll('.pp__glass .pp__thing')].filter((thing) => {
        const t = thing.getBoundingClientRect();
        return lines.some(
          (l) => t.left < l.right && t.right > l.left && t.top < l.bottom && t.bottom > l.top,
        );
      }).length;
    });
    expect(overlaps, cue).toBe(0);
  }
});

test('pig and pepper: the baby has its own prop, and the pig trots off along the ground into the wood', async ({
  page,
}) => {
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'grunt', 0.5);
  const poke = page.locator('.pp__prop--poke');
  await expect(poke).toHaveAttribute('data-shown', '');
  await expect(poke).toHaveText(await label(page, 'demoPokeBaby'));
  await poke.click();
  await expect(page.locator('.pp__baby')).toHaveAttribute('data-stage', '2');

  const pig = async () => {
    const box = await page.locator('.pp__pig-run').boundingBox();
    const stage = await page.locator('.demo__stage').boundingBox();
    return {
      x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
      feet: ((box?.y ?? 0) + (box?.height ?? 0)) / (stage?.height ?? 1),
      width: box?.width ?? 0,
    };
  };
  await atCue(page, 'trot', 0.45);
  await expect
    .poll(() => customProperty(page, '.pp__pig-run', '--trot'), { timeout: 8000 })
    .toBeGreaterThan(0.05);
  const early = await pig();
  await expect(page.locator('.pp__pig-run')).toHaveAttribute('data-trotting', '');
  await atCue(page, 'trot', 0.8);
  await expect
    .poll(() => customProperty(page, '.pp__pig-run', '--trot'), { timeout: 8000 })
    .toBeGreaterThan(0.6);
  const late = await pig();
  // To the left, into the wood, smaller as it goes, and on the ground all the way:
  // its feet stay in the lower part of the frame, never up in the canopy.
  expect(late.x).toBeLessThan(early.x - 100);
  expect(late.width).toBeLessThan(early.width);
  expect(early.feet).toBeGreaterThan(0.55);
  expect(late.feet).toBeGreaterThan(0.55);
  // And it is gone by the time she looks up.
  await atCue(page, 'look-up', 0.9);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.pp__pig-run') as Element).opacity),
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(0.05);
});

test('pig and pepper, reduced motion: no blink is caught on a settled beat, and the pig stands on the way into the wood', async ({
  browser,
}) => {
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(demo?.url ?? '');
  const opacity = (selector: string) =>
    page.evaluate(
      (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
      selector,
    );
  for (const cue of ['in', 'smoke', 'catch', 'knot', 'trot', 'look-up']) {
    await atCue(page, cue, 0);
    await expect
      .poll(() => opacity('.pp__blink'), { timeout: 8000, message: cue })
      .toBeLessThan(0.05);
  }
  await atCue(page, 'trot', 0);
  await expect.poll(() => opacity('.pp__pig-run'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await expect
    .poll(() => customProperty(page, '.pp__pig-run', '--trot'), { timeout: 8000 })
    .toBeCloseTo(0.45, 1);
  // The look up keeps the join: the bough and its grin, as the Cat opens.
  await atCue(page, 'look-up', 0);
  await expect.poll(() => opacity('.pp__close-grin'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await expect.poll(() => opacity('.pp__pig-run'), { timeout: 8000 }).toBeLessThan(0.05);
  await context.close();
});
