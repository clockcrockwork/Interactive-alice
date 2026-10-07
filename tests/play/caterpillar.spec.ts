import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

test('the caterpillar: a tap blows a small ring, a held press a strong one', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'puff', 0.5);
  const button = page.locator('.ct__prop--puff');
  await expect(button).toBeVisible();
  const strength = () => customProperty(page, '.ct__smoke', '--strength');

  // A quick click: the small ring.
  await button.click();
  await expect.poll(strength, { timeout: 5000 }).toBeLessThan(0.4);
  await expect(page.locator('.ct__ring').last()).toBeAttached();

  // A press held for most of the charge: a big one.
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await expect
    .poll(() => customProperty(page, '.ct__caterpillar', '--charge'))
    .toBeGreaterThan(0.5);
  await page.mouse.up();
  await expect.poll(strength, { timeout: 5000 }).toBeGreaterThan(0.7);
  await expect
    .poll(() => customProperty(page, '.ct__caterpillar', '--charge'), {
      timeout: 5000,
    })
    .toBeLessThan(0.1);

  // The keyboard charges the same way: a held Space, with its repeats, is one press
  // that blows one ring. (How strong depends on how long the keys were apart, which
  // a loaded machine stretches, so only "charged, and not a tap" is asserted.)
  // Earlier rings expire on their own time, so mark them and count only new ones.
  await page.evaluate(() => {
    for (const ring of document.querySelectorAll('.ct__ring')) {
      ring.setAttribute('data-earlier', '');
    }
  });
  const fresh = page.locator('.ct__ring:not([data-earlier])');
  await button.focus();
  await page.keyboard.down(' ');
  await page.keyboard.down(' ');
  await page.waitForTimeout(300);
  await page.keyboard.up(' ');
  await expect.poll(() => fresh.count(), { timeout: 5000 }).toBe(1);
  await expect.poll(strength, { timeout: 5000 }).toBeGreaterThan(0.1);
});

const caterpillarState = (page: Parameters<typeof atCue>[0]) =>
  page.evaluate(() => {
    const state = window.__aliceCaterpillar?.();
    if (!state) {
      throw new Error('no Caterpillar seam');
    }
    return state;
  });

const rect = (page: Parameters<typeof atCue>[0], selector: string) =>
  page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom } : undefined;
  }, selector);

test('the caterpillar: a tape-measure reads her height, and landing on three makes it nod', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  const tape = page.getByRole('meter');
  await expect(tape).toHaveAccessibleName(/.+/);
  await expect(tape).toHaveAttribute('aria-valuenow', '3.0');
  await atCue(page, 'sides', 0.9);
  await page.locator('.ct__bit--left').click();
  await expect(tape).toHaveAttribute('aria-valuenow', '5.1', { timeout: 15_000 });
  await page.locator('.ct__bit--right').click();
  await expect(tape).toHaveAttribute('aria-valuenow', '3.0', { timeout: 15_000 });
  await expect(page.locator('.ct__tape')).toHaveAttribute('data-notch', '');
  await expect(page.locator('.ct__peek')).toHaveAttribute('data-nod', '');
  // The story takes the nibbles back at its next change of size.
  await atCue(page, 'shrink', 0.5);
  await expect
    .poll(
      async () => {
        const state = await caterpillarState(page);
        return Math.abs(state.height - state.story);
      },
      { timeout: 15_000 },
    )
    .toBeLessThan(0.01);
});

test('the caterpillar: "Explain yourself!" puffs a question, not a ring', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'explain', 0.5);
  await page.locator('.ct__prop--puff').click();
  await expect(page.locator('.ct__ring--ask .ct__ask').last()).toBeAttached();
});

test('the caterpillar: above the trees her shoulders are clear of the captions, and her hands are far below', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'neck', 0.6);
  await expect.poll(async () => (await caterpillarState(page)).bitsShown).toBe(false);
  await expect(page.locator('.ct__bit--left')).toBeHidden();
  const shoulders = await rect(page, '.ct__shoulders');
  const captions = await rect(page, '.demo-beat[data-cue="neck"]');
  expect(shoulders && captions).toBeTruthy();
  if (shoulders && captions) {
    expect(shoulders.top).toBeGreaterThan(captions.bottom);
  }
  // She remembers the pieces in her hands, and they come back.
  await atCue(page, 'off', 0.8);
  await expect.poll(async () => (await caterpillarState(page)).bitsShown).toBe(true);
  await expect(page.locator('.ct__bit--left')).toBeVisible();
});

test('the caterpillar: dipping into the leaves sends the Pigeon up out of them', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  // Not there to press or tab to before its moment.
  await expect(page.locator('.ct__pigeon')).toBeHidden();
  await atCue(page, 'bend', 0.5);
  const dip = page.locator('.ct__prop--dip');
  await expect(dip).toBeVisible();
  await dip.click();
  await expect.poll(async () => (await caterpillarState(page)).dips).toBe(1);
  await expect(page.locator('.ct__pigeon')).toHaveAttribute('data-here', '', { timeout: 8000 });
  await expect(page.locator('.demo__status')).toContainText(/.+/);
  // A drag down from where her neck leaves the frame does it too.
  await page.waitForTimeout(2500);
  const target = await rect(page, '.ct__dip-target');
  expect(target).toBeTruthy();
  if (target) {
    const x = (target.left + target.right) / 2;
    await page.mouse.move(x, target.top + 10);
    await page.mouse.down();
    await page.mouse.move(x, target.top + 120, { steps: 6 });
    await page.mouse.move(x, target.top + 200, { steps: 6 });
    await page.mouse.up();
  }
  await expect.poll(async () => (await caterpillarState(page)).dips, { timeout: 8000 }).toBe(2);
  // Only above the trees, before the Pigeon comes by itself.
  await atCue(page, 'tried', 0.5);
  await expect(dip).toBeHidden();
});

test('the caterpillar: at the end the mushroom is a toy by her feet', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await scrollTo(page, 1);
  await expect.poll(async () => (await caterpillarState(page)).toy, { timeout: 8000 }).toBe(1);
  const mushroom = await rect(page, '.ct__mushroom');
  const feet = await rect(page, '.ct__feet-self');
  const height = await page.evaluate(() => innerHeight);
  expect(mushroom && feet).toBeTruthy();
  if (mushroom && feet) {
    expect(mushroom.right - mushroom.left).toBeGreaterThan(40);
    expect(mushroom.bottom).toBeGreaterThan(height / 2);
    expect(feet.top).toBeLessThan(height);
  }
});

test('the caterpillar: a nibble scales the meadow as one layer, with no live filter in it', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'nibble', 0.3);
  // Nothing in the meadow or the hands draws through a filter: a blur or a drop
  // shadow there was redrawn under every frame of a nibble.
  const filtered = await page.evaluate(
    () =>
      [...document.querySelectorAll('.ct__meadow .ct__blade, .ct__bit, .ct__bit-piece')].filter(
        (element) => getComputedStyle(element).filter !== 'none',
      ).length,
  );
  expect(filtered).toBe(0);
  const meadow = page.locator('.ct__meadow');
  await expect(meadow).not.toHaveAttribute('data-scaling', '');
  await page.locator('.ct__bit--right').click();
  // While her size changes the meadow is promoted and scaled whole. The flag and the
  // style are read together: on a loaded machine the flag can clear between two reads.
  await expect
    .poll(
      () =>
        meadow.evaluate((element) =>
          element.hasAttribute('data-scaling') ? getComputedStyle(element).willChange : 'resting',
        ),
      { timeout: 2000, intervals: [16] },
    )
    .toBe('transform');
  // ...and once it rests it is drawn crisp again at its new size.
  await expect(meadow).not.toHaveAttribute('data-scaling', '', { timeout: 4000 });
});

test.describe('the caterpillar, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the rear, the Pigeon and the dip are seen with their own sentences', async ({ page }) => {
    const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
    test.skip(!demo, 'no caterpillar demo in this build');
    await page.goto(demo?.url ?? '');
    await atCue(page, 'rear', 0);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const transform = getComputedStyle(
            document.querySelector('.ct__caterpillar') as Element,
          ).transform;
          return transform === 'none' ? 0 : new DOMMatrix(transform).b;
        }),
      )
      .toBeLessThan(-0.1);
    await atCue(page, 'pigeon', 0);
    await expect(page.locator('.ct__pigeon')).toHaveAttribute('data-here', '');
    await atCue(page, 'bend', 0);
    await page.locator('.ct__prop--dip').click();
    await expect.poll(async () => (await caterpillarState(page)).dip).toBe(1);
  });
});
