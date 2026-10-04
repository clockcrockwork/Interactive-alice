import { expect, test } from '@playwright/test';
import { atCue, collectErrors, customProperty, demos, scrollTo, settled } from './demo-helpers.ts';

test('the demo index links every demo, and the home page links the index', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./demos/');
  await expect(page.locator('h1')).not.toBeEmpty();
  for (const demo of demos) {
    await expect(page.locator(`.demos__card[data-demo="${demo.demo}"] a`)).toHaveAttribute(
      'href',
      `./${demo.demo}/`,
    );
  }
  await page.goto('./');
  await expect(page.locator('.home__demos a')).toHaveAttribute('href', './demos/');
  expect(errors).toEqual([]);
});

for (const demo of demos) {
  test(`${demo.url} carries its text in order and reaches its last beat`, async ({ page }) => {
    if (demo.demo === 'rabbit-hole') {
      // The well is WebGL; on a software renderer under load its frames are slow.
      test.slow();
    }
    const errors = collectErrors(page);
    await page.goto(demo.url);
    await expect(page.locator('h1')).not.toBeEmpty();

    // Every sentence, in composition order, whether or not the runtime attached.
    const rendered = await page
      .locator('.line')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-segment')));
    expect(rendered).toEqual(demo.segments);

    // The shell attached: the beats moved into the pinned stage and the first is active.
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await expect(page.locator('.demo__stage .demo-beat').first()).toHaveAttribute(
      'data-active',
      '',
    );
    await expect(page.locator('.demo__motion')).toBeVisible();

    // Scroll is the guaranteed path: the end is reached by scrolling and nothing else.
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
      await scrollTo(page, fraction);
      await page.waitForTimeout(400);
    }
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? -1), { timeout: 10_000 })
      .toBeGreaterThan(0.99);
    await expect(page.locator('.demo__stage .demo-beat').last()).toHaveAttribute(
      'data-reached',
      '',
    );
    await expect(page.locator('.demo__next')).toBeVisible();
    // The link to the next demo and the last caption do not overlap.
    await expect(page.locator('.demo')).toHaveAttribute('data-ending', '');
    const next = await page.locator('.demo__next').boundingBox();
    const caption = await page.locator('.demo__stage .demo-beat').last().boundingBox();
    expect(
      next &&
        caption &&
        (caption.y + caption.height <= next.y || caption.y >= next.y + next.height),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${demo.url} pauses its own motion on request`, async ({ page }) => {
    await page.goto(demo.url);
    const button = page.locator('.demo__motion');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
    expect(await page.evaluate(() => window.__aliceDemo?.paused())).toBe(true);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test(`${demo.url} keeps every sentence readable under reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = collectErrors(page);
    await page.goto(demo.url);
    await expect(page.locator('.demo')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('.demo__note')).not.toBeEmpty();
    // A snapped beat shows its sentences: the first beat's are there at the head.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const active = document.querySelector('.demo__stage .demo-beat[data-active] .line');
            return active ? Number(getComputedStyle(active).opacity) : -1;
          }),
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0.9);
    await scrollTo(page, 1);
    await expect
      .poll(() => page.evaluate(() => window.__aliceDemo?.progress() ?? -1), { timeout: 10_000 })
      .toBeGreaterThan(0.99);
    await expect(page.locator('.demo__stage .demo-beat').last()).toHaveAttribute(
      'data-reached',
      '',
    );
    expect(errors).toEqual([]);
  });
}

test('the trial: the pack comes for the glass, and turns to leaves on the bank', async ({
  page,
}) => {
  const trial = demos.find((demo) => demo.demo === 'trial');
  test.skip(!trial, 'no trial demo in this build');
  await page.goto(trial?.url ?? '');
  const cues = trial?.cues ?? [];
  const beatCount = trial?.segments ? await page.locator('.demo__stage .demo-beat').count() : 0;
  const scrollAt = (cue: string) =>
    page.evaluate(
      ([name, count]) => {
        const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
        const index = beats.findIndex((beat) => beat.dataset.cue === name);
        const fraction = (index + 0.5) / Number(count);
        window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * fraction);
      },
      [cue, beatCount] as const,
    );
  const at = async (...args: Parameters<typeof scrollAt>) => {
    await scrollAt(...args);
    await settled(page);
  };
  expect(cues).toContain('attack');
  await at('rise');
  await page.waitForTimeout(600);
  await at('attack');
  await expect
    .poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 })
    .toBeGreaterThan(5);
  await at('beat');
  await expect(page.locator('.tr__prop-beat')).toBeVisible();
  // Beating them off is optional play: it is a real button, and it clears the glass.
  await page.locator('.tr__prop-beat').click();
  await expect.poll(() => page.locator('.tr__glass .tr__card').count(), { timeout: 8000 }).toBe(0);
});

test('the dormouse: the tale is written on the spiral, one sentence per segment', async ({
  page,
}) => {
  const dormouse = demos.find((demo) => demo.demo === 'dormouse');
  test.skip(!dormouse, 'no dormouse demo in this build');
  await page.goto(dormouse?.url ?? '');
  const spoken = await page
    .locator('.line[data-speaker="dormouse"]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
  const onSpiral = await page
    .locator('.dm__text tspan')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
  expect(onSpiral).toEqual(spoken);
  // Shrinking as it turns.
  const sizes = await page
    .locator('.dm__text tspan')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('font-size'))));
  for (let i = 1; i < sizes.length; i += 1) {
    expect(sizes[i]).toBeLessThan(sizes[i - 1] ?? 0);
  }
});

test('drink me: the hall grows around her when she drinks, and shrinks back when she eats', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'drink-me');
  test.skip(!demo, 'no drink-me demo in this build');
  await page.goto(demo?.url ?? '');
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  const room = () =>
    page.evaluate(() =>
      Number(
        getComputedStyle(document.querySelector('.dk__hall') as Element).getPropertyValue('--room'),
      ),
    );
  const scrollAt = (cue: string, within = 0.95) =>
    page.evaluate(
      ([name, count, fraction]) => {
        const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
        const index = beats.findIndex((beat) => beat.dataset.cue === name);
        window.scrollTo(
          0,
          (document.documentElement.scrollHeight - window.innerHeight) *
            ((index + Number(fraction)) / Number(count)),
        );
      },
      [cue, beatCount, within] as const,
    );
  const at = async (...args: Parameters<typeof scrollAt>) => {
    await scrollAt(...args);
    await settled(page);
  };
  await expect.poll(room).toBeCloseTo(1, 1);
  // The drink is optional play: a real button, offered while the bottle is in hand
  // and before the story drinks it herself.
  await at('taste', 0.3);
  await expect(page.locator('.dk__prop').first()).toBeVisible();
  await at('small');
  await expect.poll(room, { timeout: 8000 }).toBeGreaterThan(4);
  await at('grow');
  await expect.poll(room, { timeout: 8000 }).toBeGreaterThan(4);
  await at('roof');
  await expect.poll(room, { timeout: 8000 }).toBeLessThan(0.6);
  // And once she has grown, the lens widens, she looks down at her own skirt and
  // shoes, and the roof folds in at the top of the frame.
  await at('roof', 1);
  const world = (property: string) =>
    page.evaluate(
      (name) =>
        Number(
          getComputedStyle(document.querySelector('.dk__world') as Element).getPropertyValue(name),
        ),
      property,
    );
  await expect.poll(() => world('--persp'), { timeout: 8000 }).toBeLessThan(600);
  await expect(page.locator('.dk__self')).toHaveCSS('opacity', '1');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number(
          getComputedStyle(document.querySelector('.dk__iris--top') as Element).getPropertyValue(
            '--fold',
          ),
        ),
      ),
    )
    .toBeGreaterThan(0.4);
});

test('the caucus-race: every runner is a button that rests or runs', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caucus-race');
  test.skip(!demo, 'no caucus-race demo in this build');
  await page.goto(demo?.url ?? '');
  const runners = page.locator('.cr__runner');
  await expect(runners).toHaveCount(8);
  for (const runner of await runners.all()) {
    await expect(runner).toHaveAttribute('aria-pressed', 'false');
    await expect(runner).toHaveAttribute('aria-label', /.+/);
  }
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  await page.evaluate((count) => {
    const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
    const index = beats.findIndex((beat) => beat.dataset.cue === 'running');
    window.scrollTo(
      0,
      (document.documentElement.scrollHeight - window.innerHeight) * ((index + 0.5) / count),
    );
  }, beatCount);
  await expect(runners.first()).toHaveAttribute('aria-pressed', 'true', { timeout: 8000 });
  // A running figure is never still and sits in a 3D ring where another may cover
  // it, so the press is delivered to the button itself rather than aimed at a pixel.
  // The first press during the race makes that runner yours; it keeps running and
  // every press is a spurt. Before the race, a press rests or runs any runner.
  await runners.first().dispatchEvent('click');
  await expect(runners.first()).toHaveAttribute('data-mine', '');
  await expect(runners.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(runners.first()).toHaveAttribute('aria-label', /\(.+\)/);
  await scrollTo(page, 0);
  await page.waitForTimeout(600);
  await runners.nth(2).dispatchEvent('click');
  await expect(runners.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await runners.nth(2).dispatchEvent('click');
  await expect(runners.nth(2)).toHaveAttribute('aria-pressed', 'false');
});

test('the pool of tears: the sentences ride the swell once she is in the water', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'pool-of-tears');
  test.skip(!demo, 'no pool-of-tears demo in this build');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.pt__canvas')).toBeVisible();
  await scrollTo(page, 0.6);
  await page.waitForTimeout(800);
  const samples: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    samples.push(
      await page.evaluate(() =>
        Number(
          document.querySelector<HTMLElement>('.demo__captions')?.style.getPropertyValue('--bob') ??
            0,
        ),
      ),
    );
    await page.waitForTimeout(120);
  }
  expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.5);
  await expect(page.locator('.pt__prop--stir')).toBeVisible();
});

test('the index: the visitor chooses an Alice, and the demos remember her', async ({ page }) => {
  await page.goto('./demos/');
  const blue = page.locator('.demos__alice-choice[data-alice="blue"]');
  const yellow = page.locator('.demos__alice-choice[data-alice="yellow"]');
  await expect(yellow).toHaveAttribute('aria-pressed', 'true');
  await expect(blue).toHaveAttribute('aria-pressed', 'false');
  await blue.click();
  await expect(blue).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-alice', 'blue');
  // Every demo page applies the choice before its own script runs.
  const first = demos[0];
  await page.goto(first?.url ?? './demos/');
  await expect(page.locator('html')).toHaveAttribute('data-alice', 'blue');
  const dress = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--alice-dress').trim(),
  );
  expect(dress).toBe('#5a76b8');
  await page.goto('./demos/');
  await yellow.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-alice', 'blue');
  // The yellow Alice and the book's palette are the design guide's.
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return ['--alice-dress', '--paper-base', '--wonder-red', '--ix-gold'].map((name) =>
      style.getPropertyValue(name).trim(),
    );
  });
  expect(tokens).toEqual(['#d8b348', '#f2e8d8', '#a74838', '#d6b557']);
});

test('the index: nineteen cards that read, each at a small tilt, joined runs dealt over one another', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 760 });
  await page.goto('./demos/');
  const cards = page.locator('.demos__card');
  await expect(cards).toHaveCount(demos.length);
  const tilts = await cards.evaluateAll((items) =>
    items.map((item) => Number.parseFloat(getComputedStyle(item).getPropertyValue('--tilt'))),
  );
  // Small, and alternating rather than growing with position.
  for (const tilt of tilts) {
    expect(Math.abs(tilt)).toBeLessThanOrEqual(4);
  }
  for (let i = 1; i < 4; i += 1) {
    expect(Math.sign(tilts[i] ?? 0)).not.toBe(Math.sign(tilts[i - 1] ?? 0));
  }
  // A card that joins the one before it overlaps it a little, on the same row.
  const boxes = await cards.evaluateAll((items) =>
    items.map((item) => {
      const box = item.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        joined: item.hasAttribute('data-joined'),
      };
    }),
  );
  let runs = 0;
  for (let i = 1; i < boxes.length; i += 1) {
    const card = boxes[i];
    const before = boxes[i - 1];
    if (card?.joined && before && Math.abs(card.top - before.top) < 40) {
      runs += 1;
      const overlap = before.right - card.left;
      expect(overlap).toBeGreaterThan(0);
      expect(overlap).toBeLessThan((card.right - card.left) * 0.25);
    }
  }
  expect(runs).toBeGreaterThan(3);
  // On a phone: two columns of smaller cards, and a page far shorter than one.
  await page.setViewportSize({ width: 390, height: 780 });
  await page.reload();
  const sides = await cards.evaluateAll((items) =>
    items.map((item) => {
      const box = item.getBoundingClientRect();
      return {
        left: box.left + box.width / 2 < innerWidth / 2,
        narrow: box.width < innerWidth * 0.55,
      };
    }),
  );
  expect(new Set(sides.map((side) => side.left)).size).toBe(2);
  expect(sides.every((side) => side.narrow)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(4200);
});

test("the rabbit's house: the camera pulls out as Alice fills the room", async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-house');
  test.skip(!demo, 'no rabbit-house demo in this build');
  await page.goto(demo?.url ?? '');
  const scale = () =>
    page.evaluate(() => {
      const transform = document.querySelector('.hs__camera')?.getAttribute('transform') ?? '';
      return Number(/scale\(([^)]+)\)/.exec(transform)?.[1] ?? 0);
    });
  await expect.poll(scale).toBeGreaterThan(2);
  await scrollTo(page, 0.62);
  await expect.poll(scale, { timeout: 8000 }).toBeLessThan(1);
  await expect(page.locator('.hs__pose--filling')).toHaveCSS('opacity', '1');
});

test('bill the lizard: down the chimney, then up like a sky-rocket', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'bill-the-lizard');
  test.skip(!demo, 'no bill-the-lizard demo in this build');
  await page.goto(demo?.url ?? '');
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  const cam = () =>
    page.evaluate(() =>
      Number(
        document.querySelector<HTMLElement>('.bl__world')?.style.getPropertyValue('--cam') ?? 0,
      ),
    );
  const scrollAt = (cue: string, within: number) =>
    page.evaluate(
      ([name, count, fraction]) => {
        const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
        const index = beats.findIndex((beat) => beat.dataset.cue === name);
        window.scrollTo(
          0,
          (document.documentElement.scrollHeight - window.innerHeight) *
            ((index + Number(fraction)) / Number(count)),
        );
      },
      [cue, beatCount, within] as const,
    );
  const at = async (...args: Parameters<typeof scrollAt>) => {
    await scrollAt(...args);
    await settled(page);
  };
  await at('foot', 0.9);
  await expect.poll(cam, { timeout: 8000 }).toBeLessThan(-1000);
  // The kick is the reader's to give: a real button, and the world goes up.
  await at('kick', 0.3);
  await expect(page.locator('.bl__prop--kick')).toBeVisible();
  await page.locator('.bl__prop--kick').click();
  await expect.poll(cam, { timeout: 8000 }).toBeGreaterThan(500);
});

test('the cheshire cat: it goes tail first, and the grin stays a while', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'cheshire-cat');
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const beatCount = await page.locator('.demo__stage .demo-beat').count();
  const state = () =>
    page.evaluate(() => ({
      slide: Number(document.querySelector('.cc__mask-slide')?.getAttribute('x') ?? 0),
      grin: Number(document.querySelector('.cc__grin')?.getAttribute('opacity') ?? 1),
    }));
  expect(beatCount).toBeGreaterThan(0);
  expect((await state()).slide).toBeLessThan(-700);
  await atCue(page, 'grin', 0.2);
  await expect.poll(async () => (await state()).slide, { timeout: 8000 }).toBeGreaterThan(-300);
  await expect.poll(async () => (await state()).grin, { timeout: 8000 }).toBeGreaterThan(0.5);
  await scrollTo(page, 1);
  await expect.poll(async () => (await state()).grin, { timeout: 8000 }).toBeLessThan(0.05);
});

test('the cheshire cat: a tap in the wood sends the Cat to the nearest bough', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'cheshire-cat');
  test.skip(!demo, 'no cheshire-cat demo in this build');
  await page.goto(demo?.url ?? '');
  const bough = () =>
    page.evaluate(
      () =>
        document.querySelector('.art[data-art="cheshire-cat/on-bough"]')?.parentElement?.dataset
          .bough,
    );
  expect(await bough()).toBe('1');
  await page.mouse.click(1100, 200);
  await expect.poll(bough, { timeout: 5000 }).toBe('2');
  // The button does it too, for a keyboard.
  await page.locator('.cc__prop--call').click();
  await expect.poll(bough, { timeout: 5000 }).not.toBe('2');
});

test("the rabbit's house: it opens inside the room, and the room shrinks as she drinks", async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-house');
  test.skip(!demo, 'no rabbit-house demo in this build');
  await page.goto(demo?.url ?? '');
  const grow = () =>
    page.evaluate(() =>
      Number(document.querySelector<HTMLElement>('.hs__box')?.style.getPropertyValue('--grow')),
    );
  await expect.poll(grow).toBeCloseTo(1, 1);
  await expect(page.locator('.hs__room')).toHaveCSS('opacity', '1');
  await scrollTo(page, 0.29);
  await expect.poll(grow, { timeout: 8000 }).toBeLessThan(0.6);
  await scrollTo(page, 0.4);
  await expect(page.locator('.hs__room')).toHaveCSS('opacity', '0', { timeout: 8000 });
});

test('drink me: every door is a button, and trying one jiggles its knob', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'drink-me');
  test.skip(!demo, 'no drink-me demo in this build');
  await page.goto(demo?.url ?? '');
  const doors = page.locator('button.dk__door');
  await expect(doors).toHaveCount(11);
  await expect(doors.first()).toHaveAttribute('aria-label', /.+/);
  await doors.nth(3).dispatchEvent('click');
  await expect(doors.nth(3)).toHaveAttribute('data-tried', '');
});

test('the rabbit hole: a drag across the well tumbles her', async ({ page }) => {
  // The well is WebGL; on a software renderer under load its frames are slow.
  test.slow();
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-hole');
  test.skip(!demo, 'no rabbit-hole demo in this build');
  await page.goto(demo?.url ?? '');
  await scrollTo(page, 0.3);
  await page.waitForTimeout(500);
  await page.mouse.move(300, 400);
  await page.mouse.down();
  await page.mouse.move(700, 400, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.abs(
            Number(
              document
                .querySelector<HTMLElement>('.rh__alice')
                ?.style.getPropertyValue('--tumble') ?? 0,
            ),
          ),
        ),
      { timeout: 4000 },
    )
    .toBeGreaterThan(5);
});

test('every demo offers sound, off until asked, and the toggle turns it on', async ({ page }) => {
  const demo = demos[0];
  test.skip(!demo, 'no demos in this build');
  await page.goto(demo?.url ?? '');
  const sound = page.locator('.demo__sound');
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
});

test('the witnesses: every juror is a button, and pressing one changes its slate', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'witnesses');
  test.skip(!demo, 'no witnesses demo in this build');
  await page.goto(demo?.url ?? '');
  const jurors = page.locator('.tr__juror');
  await expect(jurors).toHaveCount(12);
  await atCue(page, 'jury', 0.5);
  const verdict = () =>
    page.evaluate(() => document.querySelector<HTMLElement>('.tr__slate')?.dataset.verdict);
  await expect.poll(verdict, { timeout: 8000 }).toMatch(/^(yes|no)$/);
  const before = await verdict();
  await jurors.first().dispatchEvent('click');
  await expect.poll(verdict).not.toBe(before);
});

test('drink me: the key can be taken off the table into her hand', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'drink-me');
  test.skip(!demo, 'no drink-me demo in this build');
  await page.goto(demo?.url ?? '');
  await scrollTo(page, 0.24);
  await expect(page.locator('.dk__prop--key')).toBeVisible({ timeout: 8000 });
  await page.locator('.dk__prop--key').click();
  await expect(page.locator('.dk__hand--key')).toHaveCSS('opacity', '1', { timeout: 4000 });
});

test('the rabbit hole: a tap on a passing shelf takes something into her hand', async ({
  page,
}) => {
  test.slow();
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-hole');
  test.skip(!demo, 'no rabbit-hole demo in this build');
  await page.goto(demo?.url ?? '');
  test.skip((await page.evaluate(() => window.__aliceDemo?.mode())) !== 'webgl', 'no WebGL here');
  await scrollTo(page, 0.35);
  await page.waitForTimeout(1200);
  let held = 0;
  for (let i = 0; i < 40 && !held; i += 1) {
    await page.mouse.click(100 + ((i * 197) % 1080), 80 + ((i * 131) % 600));
    await page.waitForTimeout(120);
    held = await page.evaluate(() => document.querySelector('.rh__held')?.innerHTML.length ?? 0);
  }
  expect(held).toBeGreaterThan(0);
  await expect(page.locator('.rh__prop-back')).toBeVisible();
  await page.locator('.rh__prop-back').click();
  await expect(page.locator('.demo__status')).not.toBeEmpty();
});

/** Scrolls a demo page to a fraction of the way through the beat carrying a cue. */
test('the caterpillar: the meadow scales with her height, and the tree tops take over above it', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await expect.poll(() => customProperty(page, '.ct__meadow', '--s')).toBeCloseTo(1, 1);
  await atCue(page, 'shrink', 0.95);
  await expect
    .poll(() => customProperty(page, '.ct__meadow', '--s'), { timeout: 8000 })
    .toBeGreaterThan(2);
  await atCue(page, 'neck', 0.6);
  await expect
    .poll(() => customProperty(page, '.ct__treetops', '--fade'), { timeout: 8000 })
    .toBeGreaterThan(0.9);
  await expect(page.locator('.ct__neck').first()).toHaveAttribute('d', /M.+L.+Z/);
  // Back to her usual height, looking down at her feet: the meadow is small
  // under her, and the mushroom by her shoe is a toy rather than a speck.
  await scrollTo(page, 1);
  await expect
    .poll(() => customProperty(page, '.demo', '--ct-height'), { timeout: 8000 })
    .toBeCloseTo(36, 0);
  await expect
    .poll(() => customProperty(page, '.ct__meadow', '--s'), { timeout: 8000 })
    .toBeLessThan(0.4);
  await expect
    .poll(() => customProperty(page, '.ct__meadow', '--toy'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
});

test('the caterpillar: each bit of mushroom is a button, and nibbling changes her height', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'sides', 0.9);
  const height = () => customProperty(page, '.demo', '--ct-height');
  await expect.poll(height, { timeout: 8000 }).toBeCloseTo(3, 0);
  await expect(page.locator('.ct__bit--left')).toHaveAttribute('aria-label', /.+/);
  await page.locator('.ct__bit--left').click();
  await expect.poll(height, { timeout: 5000 }).toBeGreaterThan(4);
  await page.locator('.ct__bit--right').click();
  await page.locator('.ct__bit--right').click();
  await expect.poll(height, { timeout: 5000 }).toBeLessThan(3);
  // The Pigeon is a button too: shooing it is announced.
  await atCue(page, 'pigeon', 0.95);
  await expect(page.locator('.ct__pigeon')).toHaveAttribute('aria-label', /.+/);
  await page.waitForTimeout(1200);
  await page.locator('.ct__pigeon').click();
  await expect(page.locator('.demo__status')).not.toBeEmpty();
});

test('the croquet-ground: every rose is a button that paints red, and the gardeners can be hidden', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'croquet');
  test.skip(!demo, 'no croquet demo in this build');
  await page.goto(demo?.url ?? '');
  const rose = page.locator('.cq__rose').last();
  await expect(rose).toHaveAttribute('aria-pressed', 'false');
  await rose.click();
  await expect(rose).toHaveAttribute('aria-pressed', 'true');
  await atCue(page, 'gardeners', 0.4);
  await expect(page.locator('.cq__prop--hide')).toBeVisible();
  await page.locator('.cq__prop--hide').click();
  await expect
    .poll(() => customProperty(page, '.cq__gardener', '--sink'), { timeout: 5000 })
    .toBeCloseTo(1, 1);
});

test('the croquet-ground: the flamingo is the mallet, and a strike sends the hedgehog off', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'croquet');
  test.skip(!demo, 'no croquet demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'flamingo', 0.8);
  await expect(page.locator('.cq__prop--strike')).toBeVisible();
  const hedgehogX = () => customProperty(page, '.cq__hedgehog', '--x');
  const before = await hedgehogX();
  // It only strikes while the flamingo is not looking up; try until it lands.
  await expect
    .poll(
      async () => {
        await page.locator('.cq__prop--strike').click();
        await page.waitForTimeout(400);
        return Math.abs((await hedgehogX()) - before);
      },
      { timeout: 12000 },
    )
    .toBeGreaterThan(20);
  // Then the head in the air: the grin comes first and goes last.
  await atCue(page, 'eyes', 0.95);
  await expect(page.locator('.cq__cat')).toHaveAttribute('aria-label', /.+/);
  const grin = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.cq__cat-grin') as Element).opacity),
    );
  await expect.poll(grin, { timeout: 8000 }).toBeGreaterThan(0.9);
  await scrollTo(page, 1);
  await expect.poll(grin, { timeout: 8000 }).toBeLessThan(0.05);
});

test('the lobster quadrille: the lobster can be thrown, the sea somersaulted in, and the dance joined', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'lobster-quadrille');
  test.skip(!demo, 'no lobster-quadrille demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'throw', 0.3);
  await expect(page.locator('.lq__prop--throw')).toBeVisible();
  await page.locator('.lq__prop--throw').click();
  await expect(page.locator('.lq__ring')).toHaveAttribute('data-thrown', '');
  await atCue(page, 'swim', 0.7);
  await expect
    .poll(() => customProperty(page, '.lq__water', '--depth'), { timeout: 8000 })
    .toBeGreaterThan(0.9);
  await expect(page.locator('.lq__prop--somersault')).toBeVisible();
  await page.locator('.lq__prop--somersault').click();
  await expect
    .poll(() => customProperty(page, '.demo__stage', '--roll'), { timeout: 5000 })
    .toBeGreaterThan(30);
  await atCue(page, 'try', 0.5);
  await expect(page.locator('.lq__prop--join')).toBeVisible();
  await page.locator('.lq__prop--join').click();
  await expect
    .poll(() => customProperty(page, '.lq__ring', '--inside'), { timeout: 5000 })
    .toBeCloseTo(1, 1);
  // The dance turns on its own once she is in it, and the pause button stops it.
  await atCue(page, 'round', 0.9);
  await expect(page.locator('.lq__ring')).toHaveAttribute('data-dancing', '');
});

test("the trial: her sister's dream fills the bank, and opening her eyes turns it into the farm", async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'trial');
  test.skip(!demo, 'no trial demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'sounds-three', 0.95);
  await expect(page.locator('.tr__ghost[data-shown]')).toHaveCount(7, { timeout: 8000 });
  const realOpacity = () =>
    page.evaluate(() =>
      Number(
        getComputedStyle(
          document.querySelector('.tr__ghost[data-kind="teacups"] .tr__ghost-real') as Element,
        ).opacity,
      ),
    );
  expect(await realOpacity()).toBeLessThan(0.1);
  // The button opens her eyes: every dream thing becomes its real one, and back.
  // Its label says what a press will do (tests/play/trial.spec.ts checks the words).
  const eyes = page.locator('.tr__prop-eyes');
  await expect(eyes).toBeVisible();
  const closed = await eyes.textContent();
  await eyes.click();
  await expect(eyes).not.toHaveText(closed ?? '');
  await expect(eyes).toHaveAttribute('data-open', '');
  await expect.poll(realOpacity, { timeout: 5000 }).toBeGreaterThan(0.9);
  await eyes.click();
  await expect.poll(realOpacity, { timeout: 5000 }).toBeLessThan(0.1);
  // The story does it too, one creature at a time.
  await atCue(page, 'real-two', 0.9);
  await expect.poll(realOpacity, { timeout: 8000 }).toBeGreaterThan(0.9);
  await scrollTo(page, 1);
  await expect(page.locator('.demo__stage .demo-beat').last()).toHaveAttribute('data-active', '');
});

test('the rabbit hole: the fall ends through a door in the floor, and a door beyond it', async ({
  page,
}) => {
  test.slow();
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-hole');
  test.skip(!demo, 'no rabbit-hole demo in this build');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.rh__door')).toHaveCount(6);
  await atCue(page, 'end', 0.55);
  await expect(page.locator('.rh__doors')).toHaveAttribute('data-shown', '', { timeout: 8000 });
  await expect(page.locator('.rh__door').first()).toHaveAttribute('data-open', '');
  await scrollTo(page, 1);
  await expect
    .poll(() => customProperty(page, '.rh__doors', '--fall'), { timeout: 8000 })
    .toBeGreaterThan(3000);
  // She is through every door but the last, which opens on the hall far below.
  await expect(page.locator('.rh__door[data-passed]')).toHaveCount(5);
  await expect(page.locator('.rh__door').last()).toHaveAttribute('data-open', '');
  await expect(page.locator('.rh__door .trapdoor__floor')).toBeVisible();
});

test('the rabbit hole → drink me: the last door, open on the hall, is the frame Drink Me opens on and falls through', async ({
  page,
}) => {
  test.slow();
  const hole = demos.find((candidate) => candidate.demo === 'rabbit-hole');
  const drinkMe = demos.find((candidate) => candidate.demo === 'drink-me');
  test.skip(!hole || !drinkMe, 'both demos are needed for the join');
  const doorBox = () =>
    page.evaluate(() => {
      const doors = [...document.querySelectorAll<HTMLElement>('.trapdoor')];
      const box = doors[doors.length - 1]?.getBoundingClientRect();
      return box ? [box.x, box.y, box.width, box.height].map(Math.round) : [];
    });
  await page.goto(hole?.url ?? '');
  await scrollTo(page, 1);
  await expect(page.locator('.rh__door').last()).toHaveAttribute('data-open', '');
  await expect
    .poll(() => customProperty(page, '.rh__doors', '--fall'), { timeout: 8000 })
    .toBeGreaterThan(3400);
  const last = await doorBox();

  // Drink Me's first frame is that door, open, in the same place and the same size.
  await page.goto(drinkMe?.url ?? '');
  await expect(page.locator('.dk__arrival .trapdoor')).toHaveAttribute('data-open', '');
  await expect(page.locator('.dk__arrival .trapdoor__floor')).toBeVisible();
  const first = await doorBox();
  expect(first.length).toBe(4);
  first.forEach((value, i) => {
    expect(Math.abs(value - (last[i] ?? 0)), `door box ${i}`).toBeLessThanOrEqual(2);
  });
  // Then the page falls through it, and from below the strange door is open as she
  // tumbles out of it; back, the first frame again.
  const opacity = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.dk__arrival') as Element).opacity),
    );
  await atCue(page, 'fall', 0.5);
  await expect.poll(opacity, { timeout: 8000 }).toBeLessThan(0.05);
  expect(await customProperty(page, '.dk__trapdoor-leaf', '--open')).toBeGreaterThan(0.9);
  await scrollTo(page, 0);
  await expect.poll(opacity, { timeout: 8000 }).toBeGreaterThan(0.95);
});

test('the dormouse: the camera is a transform on the cup, and the doze is a filter only while it lasts', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'dormouse');
  test.skip(!demo, 'no dormouse demo in this build');
  await page.goto(demo?.url ?? '');
  const cupTransform = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.dm__cup') as Element).transform);
  const before = await cupTransform();
  expect(before).not.toBe('none');
  // The SVG itself carries no camera: the compositor moves the whole cup.
  await expect(page.locator('.dm__camera')).not.toHaveAttribute('transform', /.+/);
  await atCue(page, 'spiral', 0.95);
  await expect.poll(cupTransform, { timeout: 8000 }).not.toBe(before);
  await expect(page.locator('.dm__svg--text')).not.toHaveAttribute('data-dozing', '');
  await atCue(page, 'doze', 0.9);
  await expect(page.locator('.dm__svg--text')).toHaveAttribute('data-dozing', '', {
    timeout: 8000,
  });
  await atCue(page, 'shriek', 0.6);
  await expect(page.locator('.dm__svg--text')).not.toHaveAttribute('data-dozing', '', {
    timeout: 8000,
  });
});

test('the lobster quadrille: the run along the shore arrives at the court doors, just opening', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'lobster-quadrille');
  test.skip(!demo, 'no lobster-quadrille demo in this build');
  await page.goto(demo?.url ?? '');
  // Nothing of the court shows before the run.
  await atCue(page, 'cry', 0.5);
  await expect
    .poll(() => customProperty(page, '.lq__doors', '--near'), { timeout: 8000 })
    .toBeLessThan(0.05);
  // The doors grow along the run, and at the last words they are up close and
  // beginning to open; the layer never takes the pointer.
  await atCue(page, 'faint', 0.95);
  await expect
    .poll(() => customProperty(page, '.lq__doors', '--near'), { timeout: 8000 })
    .toBeGreaterThanOrEqual(0.9);
  await expect
    .poll(() => customProperty(page, '.lq__doors', '--open'), { timeout: 8000 })
    .toBeGreaterThan(0);
  await expect(page.locator('.lq__doors')).toHaveCSS('pointer-events', 'none');
  // Scrolling back closes them and takes them away again.
  await atCue(page, 'cry', 0.5);
  await expect
    .poll(() => customProperty(page, '.lq__doors', '--near'), { timeout: 8000 })
    .toBeLessThan(0.05);
});

test('the witnesses: it opens inside the court doors the run arrived at, and they are gone by the Knave', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'witnesses');
  test.skip(!demo, 'no witnesses demo in this build');
  await page.goto(demo?.url ?? '');
  const doorsOpacity = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.tr__doors') as Element).opacity),
    );
  // The first frame is the court through a slit between the leaves.
  await expect(page.locator('.tr__door-leaf')).toHaveCount(2);
  await expect.poll(doorsOpacity, { timeout: 8000 }).toBeGreaterThan(0.9);
  await expect
    .poll(() => customProperty(page, '.tr__doors', '--open'), { timeout: 8000 })
    .toBeLessThan(0.5);
  await expect(page.locator('.tr__doors')).toHaveCSS('pointer-events', 'none');
  await atCue(page, 'knave', 0.5);
  await expect.poll(doorsOpacity, { timeout: 8000 }).toBeLessThan(0.05);
  // And they are shut again on the way back.
  await scrollTo(page, 0);
  await expect.poll(doorsOpacity, { timeout: 8000 }).toBeGreaterThan(0.9);
});

test('the dormouse ends at the door in the tree, open on the hall and the garden', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'dormouse');
  test.skip(!demo, 'no dormouse demo in this build');
  await page.goto(demo?.url ?? '');
  const woodOpacity = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.dm__wood') as Element).opacity),
    );
  // Before the door beat the wood is not there and the door is shut.
  await atCue(page, 'teapot', 0.2);
  await expect.poll(woodOpacity, { timeout: 8000 }).toBeLessThan(0.05);
  await expect.poll(() => customProperty(page, '.dm__tree-door', '--open')).toBeLessThan(0.1);
  // At the end the tree stands, its door is open, and the garden shows through the
  // little door at the centre.
  await scrollTo(page, 1);
  await expect.poll(woodOpacity, { timeout: 8000 }).toBeGreaterThan(0.95);
  await expect
    .poll(() => customProperty(page, '.dm__tree-door', '--open'), { timeout: 8000 })
    .toBeGreaterThan(0.9);
  await expect
    .poll(() => customProperty(page, '.dm__tree', '--zoom'), { timeout: 8000 })
    .toBeGreaterThan(0.9);
  await expect(page.locator('.dm__garden')).toBeVisible();
  // Scrolling back shuts it again.
  await atCue(page, 'teapot', 0.2);
  await expect.poll(woodOpacity, { timeout: 8000 }).toBeLessThan(0.05);
});

test('the croquet-ground opens through the little door, which is gone by the splash', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'croquet');
  test.skip(!demo, 'no croquet demo in this build');
  await page.goto(demo?.url ?? '');
  const doorwayOpacity = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.cq__doorway') as Element).opacity),
    );
  await expect.poll(doorwayOpacity).toBeGreaterThan(0.95);
  // The frame never takes the roses' clicks.
  await expect(page.locator('.cq__doorway')).toHaveCSS('pointer-events', 'none');
  const rose = page.locator('.cq__rose').first();
  await rose.click();
  await expect(rose).toHaveAttribute('aria-pressed', 'true');
  await atCue(page, 'splash', 0.5);
  await expect.poll(doorwayOpacity, { timeout: 8000 }).toBeLessThan(0.05);
});

test("the rabbit's house: it ends above the roof, Bill at the chimney's rim", async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'rabbit-house');
  test.skip(!demo, 'no rabbit-house demo in this build');
  await page.goto(demo?.url ?? '');
  const scale = () =>
    page.evaluate(() => {
      const transform = document.querySelector('.hs__camera')?.getAttribute('transform') ?? '';
      return Number(/scale\(([^)]+)\)/.exec(transform)?.[1] ?? 0);
    });
  // The crash is still the cutaway: the house from above is not yet shown.
  await atCue(page, 'crash', 0.5);
  await expect(page.locator('.hs__above')).toHaveCSS('opacity', '0', { timeout: 8000 });
  await expect(page.locator('.hs__stage')).not.toHaveAttribute('data-at-chimney', '');
  // The last beat pulls back to the house from above, Bill on the way up.
  await atCue(page, 'chimney', 0.6);
  await expect(page.locator('.hs__above')).toHaveCSS('opacity', '1', { timeout: 8000 });
  await expect(page.locator('.hs__wall')).toHaveCSS('opacity', '0');
  await expect(page.locator('.hs__bill .art[data-art="bill"]')).toHaveCount(1);
  // Then closes in on the chimney top, where the next demo picks up.
  await scrollTo(page, 1);
  await expect(page.locator('.hs__stage')).toHaveAttribute('data-at-chimney', '', {
    timeout: 8000,
  });
  await expect.poll(scale, { timeout: 8000 }).toBeGreaterThan(3);
  // Back to the crash, and the cutaway is there again.
  await atCue(page, 'crash', 0.5);
  await expect(page.locator('.hs__above')).toHaveCSS('opacity', '0', { timeout: 8000 });
  await expect(page.locator('.hs__wall')).toHaveCSS('opacity', '1');
});

test('bill the lizard: it opens on the rooftop the house left, which drops away into the chimney', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'bill-the-lizard');
  test.skip(!demo, 'no bill-the-lizard demo in this build');
  await page.goto(demo?.url ?? '');
  const rooftop = page.locator('.bl__rooftop');
  await expect(rooftop).toHaveCSS('opacity', '1');
  await expect(rooftop.locator('.art[data-art="white-rabbit/garden"]')).toHaveCount(1);
  await expect(rooftop.locator('.art[data-art="pat"]')).toHaveCount(1);
  await expect.poll(() => customProperty(page, '.bl__rooftop', '--dive')).toBe(0);
  await atCue(page, 'foot', 0.5);
  await expect(rooftop).toHaveCSS('opacity', '0', { timeout: 8000 });
  await expect.poll(() => customProperty(page, '.bl__rooftop', '--dive')).toBe(1);
  await expect(page.locator('.bl__chimney')).toHaveCSS('opacity', '1');
  await atCue(page, 'roof', 0.2);
  await expect(rooftop).toHaveCSS('opacity', '1', { timeout: 8000 });
});

test('drink me → the pool of tears: she cries at the roof, and the pool opens on that view', async ({
  page,
}) => {
  const drinkMe = demos.find((candidate) => candidate.demo === 'drink-me');
  const pool = demos.find((candidate) => candidate.demo === 'pool-of-tears');
  test.skip(!drinkMe || !pool, 'both demos are needed for the join');
  await page.goto(drinkMe?.url ?? '');
  const opacity = (selector: string) =>
    page.evaluate(
      (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
      selector,
    );
  // Before the cake, the room is its own colour and the giant tears are not falling.
  await expect.poll(() => opacity('.dk__dim')).toBeLessThan(0.05);
  await expect.poll(() => opacity('.dk__tears--giant')).toBeLessThan(0.05);
  // At the very end, head against the roof: the hall dims toward the pool's hall,
  // her first tears fall past her skirt, and the skirt is in the frame.
  await scrollTo(page, 1);
  await expect.poll(() => opacity('.dk__dim'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await expect.poll(() => opacity('.dk__tears--giant'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await expect(page.locator('.dk__self')).toHaveCSS('opacity', '1');
  await expect(page.locator('.dk__tears--giant .dk__tear').first()).toBeAttached();

  // The pool opens on the same view: her skirt at the bottom, the roof folded in at
  // the top, and lets both go as the tears come and the pool rises.
  await page.goto(pool?.url ?? '');
  await expect(page.locator('.pt__self .art')).toBeAttached();
  await expect.poll(() => opacity('.pt__self')).toBeGreaterThan(0.9);
  await expect.poll(() => customProperty(page, '.pt__roof', '--fold')).toBeGreaterThan(0.4);
  await atCue(page, 'rabbit', 0.5);
  await expect.poll(() => opacity('.pt__self'), { timeout: 8000 }).toBeLessThan(0.1);
  await expect
    .poll(() => customProperty(page, '.pt__roof', '--fold'), { timeout: 8000 })
    .toBeLessThan(0.05);
  // And back again: the join is a function of the scroll.
  await scrollTo(page, 0);
  await expect.poll(() => opacity('.pt__self'), { timeout: 8000 }).toBeGreaterThan(0.9);
});

test("the pool of tears → the caucus-race: the pool ends on the race's first frame, figure for figure", async ({
  page,
}) => {
  const pool = demos.find((candidate) => candidate.demo === 'pool-of-tears');
  const race = demos.find((candidate) => candidate.demo === 'caucus-race');
  test.skip(!pool || !race, 'both demos are needed for the join');
  const opacity = (selector: string) =>
    page.evaluate(
      (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
      selector,
    );
  /** The picture both pages draw: the ring's camera, each runner's place, the water. */
  const frame = (scope: string) =>
    page.evaluate((root) => {
      const ring = document.querySelector(`${root} .cr__ring`) as HTMLElement;
      const camera = ['--spin', '--tilt', '--dolly', '--lift'].map((name) =>
        Number(ring.style.getPropertyValue(name)),
      );
      const runners = [...document.querySelectorAll<HTMLElement>(`${root} .cr__runner`)].map(
        (el) => ({
          kind: el.dataset.kind,
          a: Number(el.style.getPropertyValue('--a')),
          r: Number(el.style.getPropertyValue('--r')),
          y: Number(el.style.getPropertyValue('--y')),
        }),
      );
      const water = document.querySelector(`.cr__water${root === '.pt__race' ? '.pt__race' : ''}`);
      return { camera, runners, water: water ? getComputedStyle(water).blockSize : '' };
    }, scope);
  await page.goto(pool?.url ?? '');
  await atCue(page, 'crowd', 0.9);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-ashore', '');
  await expect.poll(() => opacity('.cr__sky.pt__race')).toBeLessThan(0.05);
  // At the end the hall has given way to the race's own sky, water and party.
  await scrollTo(page, 1);
  await expect(page.locator('.demo')).toHaveAttribute('data-ashore', '', { timeout: 8000 });
  for (const layer of ['.cr__sky.pt__race', '.cr__world.pt__race', '.cr__water.pt__race']) {
    await expect.poll(() => opacity(layer), { timeout: 8000 }).toBeGreaterThan(0.95);
  }
  await expect(page.locator('.pt__race .cr__runner')).toHaveCount(8);
  const ending = await frame('.pt__race');
  // No shore drawn across the water, and nothing to stir once ashore.
  await expect(page.locator('.pt__prop--stir')).not.toHaveAttribute('data-shown', '');
  await atCue(page, 'crowd', 0.9);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-ashore', '', { timeout: 8000 });

  // The race opens on the same picture: camera, every runner's place, the water.
  await page.goto(race?.url ?? '');
  await expect(page.locator('.cr__runner').first()).toHaveAttribute('data-drip', '');
  await expect.poll(() => opacity('.cr__water')).toBeGreaterThan(0.9);
  const opening = await frame('.demo__stage');
  expect(opening.camera).toEqual(ending.camera);
  expect(opening.water).toBe(ending.water);
  for (const runner of ending.runners) {
    const twin = opening.runners.find((candidate) => candidate.kind === runner.kind);
    expect(twin, runner.kind).toBeDefined();
    expect(twin?.a).toBeCloseTo(runner.a, 1);
    expect(twin?.r).toBeCloseTo(runner.r, 2);
    expect(twin?.y).toBeCloseTo(runner.y, 0);
  }
  // By the end of the first beat the water has gone and the party is a ring on the bank.
  await atCue(page, 'bank', 0.98);
  await expect.poll(() => opacity('.cr__water'), { timeout: 8000 }).toBeLessThan(0.05);
  await expect
    .poll(() => customProperty(page, '.cr__runner', '--y'), { timeout: 8000 })
    .toBeLessThan(0.5);
  await expect.poll(() => customProperty(page, '.cr__runner', '--r')).toBeCloseTo(1, 1);
  await expect.poll(() => customProperty(page, '.cr__ring', '--lift')).toBeCloseTo(0, 0);
});

test('pig and pepper: the baby turns into a pig by beats, and a poke brings the next stage early', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'pig-and-pepper');
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  await page.goto(demo?.url ?? '');
  const stage = () => page.locator('.pp__baby').getAttribute('data-stage');
  await atCue(page, 'catch', 0.5);
  await expect.poll(stage, { timeout: 8000 }).toBe('0');
  await expect(page.locator('.demo')).toHaveAttribute('data-holding', '');
  await atCue(page, 'grunt', 0.5);
  await expect.poll(stage, { timeout: 8000 }).toBe('1');
  await expect.poll(() => customProperty(page, '.pp__baby', '--stage')).toBe(1);
  // A poke is one stage early; the next beat's own stage takes over from there.
  await page.locator('.pp__baby').click();
  await expect.poll(stage, { timeout: 5000 }).toBe('2');
  await atCue(page, 'snout', 0.5);
  await expect.poll(stage, { timeout: 8000 }).toBe('2');
  await atCue(page, 'pig', 0.5);
  await expect.poll(stage, { timeout: 8000 }).toBe('3');
  // And back: the stages are a function of the scroll.
  await atCue(page, 'knot', 0.3);
  await expect.poll(stage, { timeout: 8000 }).toBe('0');
});

test('pig and pepper: the pots and pans reach the glass, and the reader can duck', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'pig-and-pepper');
  test.skip(!demo, 'no pig-and-pepper demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'grin', 0.5);
  await page.waitForTimeout(400);
  await expect(page.locator('.pp__glass .pp__thing')).toHaveCount(0);
  await atCue(page, 'throw', 0.9);
  const stuck = () => page.locator('.pp__glass .pp__thing').count();
  await expect.poll(stuck, { timeout: 10000 }).toBeGreaterThan(2);
  await expect(page.locator('.pp__prop--duck')).toBeVisible();
  await page.locator('.pp__prop--duck').click();
  await expect.poll(stuck, { timeout: 8000 }).toBe(0);
});

test('pig and pepper → the cheshire cat: she looks up at a bough with a grin on it, and the Cat opens from that look', async ({
  page,
}) => {
  const pig = demos.find((candidate) => candidate.demo === 'pig-and-pepper');
  const cat = demos.find((candidate) => candidate.demo === 'cheshire-cat');
  test.skip(!pig || !cat, 'both demos are needed for the join');
  const opacity = (selector: string) =>
    page.evaluate(
      (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
      selector,
    );
  await page.goto(pig?.url ?? '');
  await atCue(page, 'trot', 0.5);
  await expect.poll(() => opacity('.pp__bough'), { timeout: 8000 }).toBeLessThan(0.05);
  await scrollTo(page, 1);
  await expect.poll(() => opacity('.pp__bough'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await expect.poll(() => opacity('.pp__close-grin'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await atCue(page, 'trot', 0.5);
  await expect.poll(() => opacity('.pp__bough'), { timeout: 8000 }).toBeLessThan(0.05);

  // The Cat's wood opens on the same bough, close, with the grin already there,
  // and it has settled into the wood's own framing by the next beat.
  await page.goto(cat?.url ?? '');
  await expect(page.locator('.cc__join .cc__close-grin')).toBeAttached();
  await expect.poll(() => opacity('.cc__join')).toBeGreaterThan(0.9);
  await atCue(page, 'puss', 0.3);
  await expect.poll(() => opacity('.cc__join'), { timeout: 8000 }).toBeLessThan(0.05);
  await scrollTo(page, 0);
  await expect.poll(() => opacity('.cc__join'), { timeout: 8000 }).toBeGreaterThan(0.9);
});

test('the mock turtle: the subjects on the sand are the words of his own sentences, and the wave takes them', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'mock-turtle');
  test.skip(!demo, 'no mock-turtle demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'reeling', 0.6);
  const group = page.locator('.mt__group[data-cue="reeling"]');
  await expect
    .poll(() => customProperty(page, '.mt__group[data-cue="reeling"]', '--show'), {
      timeout: 8000,
    })
    .toBeCloseTo(1, 1);
  // Every word written on the sand is in the beat's own caption text, and there
  // is more than one of them.
  const words = await group
    .locator('.mt__subject')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.word ?? ''));
  const caption = await page.locator('.demo-beat[data-cue="reeling"]').innerText();
  expect(words.length).toBeGreaterThan(1);
  for (const word of words) {
    expect(word.length).toBeGreaterThan(0);
    expect(caption).toContain(word);
  }
  // Wash sends the wave over them; scrolling back before they were written undoes it.
  await expect(page.locator('.mt__prop--wash')).toBeVisible();
  await page.locator('.mt__prop--wash').click();
  await expect
    .poll(() => customProperty(page, '.mt__group[data-cue="reeling"]', '--wash'), {
      timeout: 5000,
    })
    .toBeGreaterThan(0.9);
  await atCue(page, 'reeling', 0.02);
  await expect
    .poll(() => customProperty(page, '.mt__group[data-cue="reeling"]', '--wash'), {
      timeout: 8000,
    })
    .toBeLessThan(0.05);
  // Uglify makes a word writhe, and the story uglifies the word it argues about.
  await atCue(page, 'reeling', 0.6);
  await expect(page.locator('.mt__prop--uglify')).toBeVisible({ timeout: 8000 });
  await page.locator('.mt__prop--uglify').click();
  await expect(page.locator('.mt__subject[data-uglified]')).toHaveCount(1);
});

test('the mock turtle: comforting him makes him sigh harder, and the sea heaves', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'mock-turtle');
  test.skip(!demo, 'no mock-turtle demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'tears', 0.5);
  await expect(page.locator('.mt__prop--comfort')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.mt__turtle')).toHaveAttribute('data-tappable', '');
  await expect
    .poll(() => customProperty(page, '.mt__shore', '--swell'), { timeout: 8000 })
    .toBeLessThan(0.1);
  await page.locator('.mt__turtle').click();
  await expect
    .poll(() => customProperty(page, '.mt__shore', '--swell'), { timeout: 3000 })
    .toBeGreaterThan(0.3);
  // The button does the same for a keyboard.
  await page.waitForTimeout(1500);
  await page.locator('.mt__prop--comfort').click();
  await expect
    .poll(() => customProperty(page, '.mt__shore', '--swell'), { timeout: 3000 })
    .toBeGreaterThan(0.3);
  await expect(page.locator('.demo__status')).not.toBeEmpty();
});

test('the mock turtle → the lobster quadrille: the shore settles on the quadrille, and the sigh is the breath let go', async ({
  page,
}) => {
  const story = demos.find((candidate) => candidate.demo === 'mock-turtle');
  const quadrille = demos.find((candidate) => candidate.demo === 'lobster-quadrille');
  test.skip(!story || !quadrille, 'both demos are needed for the join');
  await page.goto(story?.url ?? '');
  // Before the last beat the two stand where the story put them: the Turtle on
  // his ledge, nothing settled.
  await atCue(page, 'holiday', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-settled', '');
  await expect
    .poll(() => customProperty(page, '.mt__shore', '--settle'), { timeout: 8000 })
    .toBeLessThan(0.05);
  // At the end the camera has settled on the quadrille's opening and he draws breath.
  await scrollTo(page, 1);
  await expect(page.locator('.demo')).toHaveAttribute('data-settled', '', { timeout: 8000 });
  await expect
    .poll(() => customProperty(page, '.mt__shore', '--settle'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
  await expect
    .poll(() => customProperty(page, '.mt__turtle', '--breath'), { timeout: 8000 })
    .toBeGreaterThan(0.5);
  await expect.poll(() => customProperty(page, '.mt__school', '--depth')).toBeLessThan(0.05);
  // And back again: the join is a function of the scroll.
  await atCue(page, 'holiday', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-settled', '', { timeout: 8000 });

  // The quadrille opens on that frame: the breath is drawn, and the first sigh lets it go.
  await page.goto(quadrille?.url ?? '');
  await expect(page.locator('.lq__turtle .art')).toBeAttached();
  await expect.poll(() => customProperty(page, '.lq__turtle', '--breath')).toBeGreaterThan(0.9);
  await atCue(page, 'sigh', 0.6);
  await expect
    .poll(() => customProperty(page, '.lq__turtle', '--breath'), { timeout: 8000 })
    .toBeLessThan(0.05);
  await expect
    .poll(() => customProperty(page, '.lq__turtle', '--sob'), { timeout: 8000 })
    .toBeGreaterThan(0);
});

test('the tea-party: moving round shifts the seats, and the watch can be buttered', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'tea-party');
  test.skip(!demo, 'no tea-party demo in this build');
  await page.goto(demo?.url ?? '');
  // The watch: the story butters it at its beat; the reader may do it earlier.
  await atCue(page, 'watch', 0.8);
  await expect(page.locator('.tp__watch-layer')).not.toHaveAttribute('data-buttered', '');
  await page.locator('.tp__prop-butter').click();
  await expect(page.locator('.tp__watch-layer')).toHaveAttribute('data-buttered', '', {
    timeout: 8000,
  });
  // Moving round: the story's own round at tea-time, then one more for the reader.
  await atCue(page, 'tea-time', 0.2);
  await expect
    .poll(() => customProperty(page, '.tp__scene', '--round'), { timeout: 8000 })
    .toBeLessThan(0.05);
  await atCue(page, 'tea-time', 0.95);
  await expect
    .poll(() => customProperty(page, '.tp__scene', '--round'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
  await page.locator('.tp__prop-round').click();
  await expect
    .poll(() => customProperty(page, '.tp__scene', '--round'), { timeout: 8000 })
    .toBeCloseTo(2, 1);
  // The used places behind the party carry their mess; the ones ahead are clean.
  await expect.poll(() => customProperty(page, '.tp__place', '--dirt')).toBeLessThan(0.05);
});

test('the tea-party → the dormouse: it ends looking down into the cup the tale is told in', async ({
  page,
}) => {
  const party = demos.find((candidate) => candidate.demo === 'tea-party');
  const dormouse = demos.find((candidate) => candidate.demo === 'dormouse');
  test.skip(!party || !dormouse, 'both demos are needed for the join');
  await page.goto(party?.url ?? '');
  await atCue(page, 'story', 0.2);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-join', '');
  await expect(page.locator('.tp__join')).toHaveAttribute('data-off', '');
  await scrollTo(page, 1);
  await expect(page.locator('.demo')).toHaveAttribute('data-join', '', { timeout: 8000 });
  await expect(page.locator('.tp__join')).not.toHaveAttribute('data-off', '');
  await expect
    .poll(() => customProperty(page, '.tp__join', '--join'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
  // And back: the join is a function of the scroll.
  await atCue(page, 'story', 0.2);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-join', '', { timeout: 8000 });

  // The Dormouse opens on that cup, a little further out, under the party's sepia,
  // and has settled in by the time the tale begins.
  await page.goto(dormouse?.url ?? '');
  await expect(page.locator('.demo')).toHaveAttribute('data-join', '');
  await expect(page.locator('.dm__arrive')).toBeAttached();
  await atCue(page, 'spiral', 0.1);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-join', '', { timeout: 8000 });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector('.dm__arrive') as Element).opacity),
        ),
      { timeout: 8000 },
    )
    .toBeLessThan(0.05);
});

test('the riverbank: a page turns and finds nothing, picked daisies chain in her hand, and the chain falls at "too much work"', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'riverbank');
  test.skip(!demo, 'no riverbank demo in this build');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.rb__prop--turn')).toBeVisible({ timeout: 8000 });
  await expect.poll(() => customProperty(page, '.rb__book', '--page')).toBe(0);
  await page.locator('.rb__prop--turn').click();
  await expect(page.locator('.rb__book')).toHaveAttribute('data-page', '1');
  await expect.poll(() => customProperty(page, '.rb__book', '--page')).toBe(1);
  // The pages are paper and lines of ghost text-shapes: no picture in any of them.
  await expect(page.locator('.rb__book img, .rb__book svg')).toHaveCount(0);
  // A daisy by the button, and one by a tap on the flower itself.
  await page.locator('.rb__prop--pick').click();
  await expect(page.locator('.rb__chain')).toHaveAttribute('data-chain', '1');
  await page.locator('.rb__daisy:not([data-picked])').first().click();
  await expect.poll(() => customProperty(page, '.rb__chain', '--chain')).toBe(2);
  await expect(page.locator('.rb__daisy[data-picked]')).toHaveCount(2);
  await expect(page.locator('.rb__link[data-shown]')).toHaveCount(2);
  // Too much work: the chain falls and the play is over; scrolling back lifts it.
  await atCue(page, 'sleepy', 0.9);
  await expect(page.locator('.rb__chain')).toHaveAttribute('data-dropped', '', { timeout: 8000 });
  await expect(page.locator('.rb__prop--pick')).toBeHidden();
  await atCue(page, 'book', 0.5);
  await expect(page.locator('.rb__chain')).not.toHaveAttribute('data-dropped', '', {
    timeout: 8000,
  });
  await expect(page.locator('.rb__prop--pick')).toBeVisible();
});

test('the riverbank → the rabbit hole: the Rabbit stops for his watch, she jumps up, and the field ends on the hole the next demo opens on', async ({
  page,
}) => {
  const bank = demos.find((candidate) => candidate.demo === 'riverbank');
  const hole = demos.find((candidate) => candidate.demo === 'rabbit-hole');
  test.skip(!bank || !hole, 'both demos are needed for the join');
  await page.goto(bank?.url ?? '');
  // The watch comes out of his pocket, and the reader may look at it.
  await atCue(page, 'watch', 0.5);
  await expect
    .poll(() => customProperty(page, '.rb__rabbit', '--watch'), { timeout: 8000 })
    .toBeGreaterThan(0.9);
  await expect(page.locator('.rb__prop--watch')).toBeVisible({ timeout: 8000 });
  await page.locator('.rb__prop--watch').click();
  await expect(page.locator('.rb__watch')).toHaveAttribute('data-spinning', '');
  // She jumps to her feet: a cut from sitting to standing.
  await atCue(page, 'up', 0.5);
  await expect(page.locator('.rb__alice')).toHaveAttribute('data-standing', '', { timeout: 8000 });
  await expect.poll(() => customProperty(page, '.rb__rabbit', '--watch')).toBeLessThan(0.05);
  // The run across the field ends at the hedge, on the rabbit hole demo's frame.
  await scrollTo(page, 1);
  await expect(page.locator('.demo')).toHaveAttribute('data-at-hedge', '', { timeout: 8000 });
  await expect(page.locator('.rb__field')).toHaveAttribute('data-shown', '');
  await expect
    .poll(() => customProperty(page, '.demo', '--pan'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
  await expect(page.locator('.rb__field')).toHaveAttribute('data-diving', '');
  // The picture at the hedge, measured: the hole, the Rabbit in it and Alice.
  const parts = ['.field__hole', '.field__burrow', '.field__runner'];
  const boxes = () =>
    page.evaluate(
      (selectors) =>
        selectors.map((sel) => {
          const box = document.querySelector(sel)?.getBoundingClientRect();
          return box ? [box.x, box.y, box.width, box.height].map(Math.round) : [];
        }),
      parts,
    );
  await expect.poll(() => page.evaluate(() => window.__aliceDemo?.settled() ?? false)).toBe(true);
  const atHedge = await boxes();
  // And back: the join is a function of the scroll.
  await atCue(page, 'book', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-at-hedge', '', { timeout: 8000 });
  await expect(page.locator('.rb__alice')).not.toHaveAttribute('data-standing', '');
  await expect(page.locator('.rb__field')).not.toHaveAttribute('data-shown', '');
  await expect
    .poll(() => customProperty(page, '.demo', '--pan'), { timeout: 8000 })
    .toBeLessThan(0.05);

  // The rabbit hole opens on that frame: the same hole, the same Rabbit nose-down
  // in it with his tail out, the same Alice, to the pixel.
  await page.goto(hole?.url ?? '');
  await expect(page.locator('.rh__surface .field__rabbit .art')).toBeAttached();
  const opening = await boxes();
  opening.forEach((box, i) => {
    expect(box.length, parts[i]).toBe(4);
    box.forEach((value, j) => {
      expect(Math.abs(value - (atHedge[i]?.[j] ?? 0)), `${parts[i]} ${j}`).toBeLessThanOrEqual(2);
    });
  });
});

test("the mouse's tale: the verses are written along the tail in order, shrinking, and the tail can be pulled", async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'mouse-tale');
  test.skip(!demo, 'no mouse-tale demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'fury-four', 0.9);
  // The verse beats' own sentences, in order, are what the tail carries: the
  // chunks of each sentence, joined, read the sentence back.
  const spoken = await page
    .locator('.demo-beat[data-cue^="fury-"] .line')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
  const onTail = await page.locator('.mt__tail text').evaluateAll((nodes) => {
    const out: string[] = [];
    let segment = '';
    for (const node of nodes) {
      const own = (node as SVGElement).dataset.segment ?? '';
      const words = node.textContent?.trim() ?? '';
      if (own === segment) {
        out[out.length - 1] = `${out[out.length - 1]} ${words}`;
      } else {
        out.push(words);
        segment = own;
      }
    }
    return out;
  });
  expect(spoken.length).toBeGreaterThan(4);
  expect(onTail).toEqual(spoken);
  // Shrinking as it goes, and all of it shown by the last verse.
  const sizes = await page
    .locator('.mt__tail text')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('font-size'))));
  for (let i = 1; i < sizes.length; i += 1) {
    expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1] ?? 0);
  }
  const lastOpacity = () =>
    page.evaluate(() => {
      const texts = document.querySelectorAll('.mt__tail text');
      return Number(getComputedStyle(texts[texts.length - 1] as Element).opacity);
    });
  await expect.poll(lastOpacity, { timeout: 8000 }).toBeGreaterThan(0.9);
  // Pull the tail: the words slide along the curve, and spring back.
  const firstTransform = () =>
    page
      .locator('.mt__tail text')
      .first()
      .evaluate((node) => node.getAttribute('transform'));
  const before = await firstTransform();
  await expect(page.locator('.mt__prop--pull')).toBeVisible();
  await page.locator('.mt__prop--pull').click();
  await expect.poll(firstTransform, { timeout: 3000 }).not.toBe(before);
  await expect.poll(firstTransform, { timeout: 5000 }).toBe(before);
});

test("the mouse's tale: the tail ties a knot that will not undo, and a tapped bird leaves at once", async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'mouse-tale');
  test.skip(!demo, 'no mouse-tale demo in this build');
  await page.goto(demo?.url ?? '');
  await atCue(page, 'attending', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-knot', '');
  await atCue(page, 'knot', 0.6);
  await expect(page.locator('.demo')).toHaveAttribute('data-knot', '', { timeout: 8000 });
  // Undoing it is tried, and fails: the Mouse is offended, and says so.
  await expect(page.locator('.mt__prop--undo')).toBeVisible({ timeout: 8000 });
  await page.locator('.mt__prop--undo').click();
  await expect(page.locator('.mt__member[data-kind="mouse"]')).toHaveAttribute('data-offended', '');
  await expect(page.locator('.demo__status')).not.toBeEmpty();
  await atCue(page, 'attending', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-knot', '', { timeout: 8000 });
  // The sensation: every bird is a button, and a tap sends it off the ring.
  await atCue(page, 'sensation', 0.04);
  const dodo = page.locator('.mt__member[data-kind="dodo"]');
  await expect(dodo).toBeEnabled({ timeout: 8000 });
  await expect(dodo).toHaveAttribute('aria-label', /.+/);
  await expect(dodo).not.toHaveAttribute('data-gone', '');
  await dodo.dispatchEvent('click');
  await expect(dodo).toHaveAttribute('data-gone', '', { timeout: 5000 });
  // Scrolling back before the sensation brings it back.
  await atCue(page, 'dinah', 0.5);
  await expect(dodo).not.toHaveAttribute('data-gone', '', { timeout: 8000 });
});

test("the caucus-race → the mouse's tale: the tale opens on the race's huddle, thimble in her hand, and sits down in a ring", async ({
  page,
}) => {
  const race = demos.find((candidate) => candidate.demo === 'caucus-race');
  const tale = demos.find((candidate) => candidate.demo === 'mouse-tale');
  test.skip(!race || !tale, 'both demos are needed for the join');
  /** The huddle as drawn: the camera, each one's place, and the thimble's. */
  const huddle = () =>
    page.evaluate(() => {
      const ring = document.querySelector('.cr__ring') as HTMLElement;
      const read = (el: Element | null, names: string[]) =>
        names.map((name) => Number((el as HTMLElement | null)?.style.getPropertyValue(name)));
      return {
        camera: read(ring, ['--spin', '--tilt', '--dolly', '--lift']),
        places: [...document.querySelectorAll<HTMLElement>('.cr__runner')]
          .filter((el) => el.dataset.kind !== 'canary')
          .map((el) => [el.dataset.kind, ...read(el, ['--a', '--r'])]),
        thimble: read(document.querySelector('.cr__carry'), ['--a', '--r', '--u', '--v', '--s']),
        holding: document
          .querySelector('.cr__runner[data-kind="alice"]')
          ?.hasAttribute('data-holding'),
      };
    });
  // The race ends crowded round Alice, the thimble in her hand, the course still chalked.
  await page.goto(race?.url ?? '');
  await scrollTo(page, 1);
  await expect
    .poll(() => customProperty(page, '.cr__runner', '--r'), { timeout: 8000 })
    .toBeCloseTo(0.5, 1);
  await expect.poll(() => customProperty(page, '.cr__course circle', '--drawn')).toBeCloseTo(1, 1);
  await expect(page.locator('.cr__runner[data-kind="alice"]')).toHaveAttribute('data-holding', '', {
    timeout: 8000,
  });
  await expect
    .poll(async () => (await huddle()).thimble[4], { timeout: 8000 })
    .toBeGreaterThan(0.7);
  const ending = await huddle();
  /** The Rabbit's house small in the distance: drawn, and where on the stage. */
  const distantHouse = () =>
    page.evaluate(() => {
      const layer = document.querySelector('.hs__arrival') as HTMLElement | null;
      const front = layer?.querySelector('.hs__front');
      const r = front?.getBoundingClientRect();
      return {
        opacity: layer ? Number(getComputedStyle(layer).opacity) : 0,
        box: r ? [r.left, r.top, r.width, r.height].map((n) => Math.round(n)) : [],
      };
    });
  // The race's last frame already has the house the tale walks to.
  await expect
    .poll(async () => (await distantHouse()).opacity, { timeout: 8000 })
    .toBeGreaterThan(0.95);
  const houseAtEnd = await distantHouse();
  expect(houseAtEnd.box.length).toBe(4);
  // The tale opens on that huddle, course, thimble and all, and opens into the ring.
  await page.goto(tale?.url ?? '');
  await expect(page.locator('.cr__runner.mt__member:not([data-kind="canary"])')).toHaveCount(8);
  await expect.poll(() => customProperty(page, '.cr__runner', '--r')).toBeCloseTo(0.5, 1);
  const opening = await huddle();
  expect(opening.holding).toBe(true);
  // The same house, drawn by the same markup, in the same place.
  const houseAtOpening = await distantHouse();
  expect(houseAtOpening.opacity).toBeGreaterThan(0.95);
  houseAtOpening.box.forEach((value, index) => {
    expect(Math.abs(value - (houseAtEnd.box[index] ?? Number.NaN))).toBeLessThanOrEqual(1);
  });
  // The race keeps its own angles, the tale starts its ring from others: the
  // picture is the same when every place is taken relative to the camera.
  const facing = (frame: typeof ending) =>
    frame.places.map(([kind, a, r]) => [
      kind,
      Math.round((((Number(a) + (frame.camera[0] ?? 0)) % 360) + 360) % 360),
      Number(r).toFixed(2),
    ]);
  expect(facing(opening)).toEqual(facing(ending));
  expect(opening.camera.slice(1)).toEqual(ending.camera.slice(1));
  expect(opening.thimble.slice(1)).toEqual(ending.thimble.slice(1));
  const courseOpacity = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('.cr__course') as Element).opacity),
    );
  await expect.poll(courseOpacity).toBeGreaterThan(0.9);
  await atCue(page, 'sad', 0.5);
  await expect
    .poll(() => customProperty(page, '.cr__runner', '--r'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
  await expect.poll(courseOpacity, { timeout: 8000 }).toBeLessThan(0.05);
  await expect(page.locator('.cr__runner[data-kind="alice"]')).not.toHaveAttribute(
    'data-holding',
    '',
  );
});

test("the mouse's tale → the rabbit's house: the footsteps lead to the house's door, and the house opens on it", async ({
  page,
}) => {
  const tale = demos.find((candidate) => candidate.demo === 'mouse-tale');
  const house = demos.find((candidate) => candidate.demo === 'rabbit-house');
  test.skip(!tale || !house, 'both demos are needed for the join');
  const opacity = (selector: string) =>
    page.evaluate(
      (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
      selector,
    );
  await page.goto(tale?.url ?? '');
  await expect(page.locator('.hs__arrival .hs__front')).toBeAttached();
  // Alone on the bank, the house is small in the distance.
  await atCue(page, 'alone', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-at-house', '');
  await expect
    .poll(() => customProperty(page, '.hs__arrival', '--hz'), { timeout: 8000 })
    .toBeLessThan(0.2);
  // At the end the picture has tightened on it: the last frame is its front.
  await scrollTo(page, 1);
  await expect(page.locator('.demo')).toHaveAttribute('data-at-house', '', { timeout: 8000 });
  await expect
    .poll(() => customProperty(page, '.hs__arrival', '--hz'), { timeout: 8000 })
    .toBeCloseTo(1, 1);
  await expect.poll(() => opacity('.hs__garden'), { timeout: 8000 }).toBeGreaterThan(0.9);
  await atCue(page, 'alone', 0.5);
  await expect(page.locator('.demo')).not.toHaveAttribute('data-at-house', '', { timeout: 8000 });

  // The house opens on that front, and goes in through the door to the room.
  await page.goto(house?.url ?? '');
  await expect(page.locator('.hs__arrival .hs__front')).toBeAttached();
  await expect.poll(() => opacity('.hs__arrival')).toBeGreaterThan(0.9);
  await expect.poll(() => customProperty(page, '.hs__arrival', '--hz')).toBeCloseTo(1, 1);
  await atCue(page, 'sip', 0.5);
  await expect.poll(() => opacity('.hs__arrival'), { timeout: 8000 }).toBeLessThan(0.05);
  await scrollTo(page, 0);
  await expect.poll(() => opacity('.hs__arrival'), { timeout: 8000 }).toBeGreaterThan(0.9);
});

test('keepsakes: what the reader takes along the way lies on the bank at the end', async ({
  page,
}) => {
  const drinkMe = demos.find((candidate) => candidate.demo === 'drink-me');
  const trial = demos.find((candidate) => candidate.demo === 'trial');
  test.skip(!drinkMe || !trial, 'needs drink-me and the trial');
  // Nothing kept: the trial's end shows nothing.
  await page.goto(trial?.url ?? '');
  await page.evaluate(() => localStorage.removeItem('alice-demos:kept'));
  await page.reload();
  await scrollTo(page, 1);
  await expect(page.locator('.tr__keepsake')).toHaveCount(0);
  // Taking the key by hand keeps it; the story taking it does not.
  await page.goto(drinkMe?.url ?? '');
  await scrollTo(page, 0.24);
  await expect(page.locator('.dk__prop--key')).toBeVisible({ timeout: 8000 });
  await page.locator('.dk__prop--key').click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('alice-demos:kept')))
    .toContain('key');
  await page.goto(trial?.url ?? '');
  await scrollTo(page, 1);
  await expect(page.locator('.tr__keepsake[data-kind="key"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.tr__keepsake')).toHaveCount(1);
  // The status line fades after a while but keeps its text for the reader.
  await page.goto(drinkMe?.url ?? '');
  await page.evaluate(() => localStorage.removeItem('alice-demos:kept'));
});

test('the status line shows what the reader did, then fades', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'croquet');
  test.skip(!demo, 'no croquet demo in this build');
  await page.goto(demo?.url ?? '');
  await page.locator('.cq__rose').first().click();
  const status = page.locator('.demo__status');
  await expect(status).toHaveAttribute('data-shown', '');
  await expect(status).not.toBeEmpty();
  await expect(status).not.toHaveAttribute('data-shown', '', { timeout: 8000 });
  await expect(status).not.toBeEmpty();
});

test('going on by itself is off until asked, then follows a held end to the next scene', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'mock-turtle');
  test.skip(!demo, 'no Mock Turtle demo in this build');
  await page.goto(demo?.url ?? '');
  const toggle = page.locator('.demo__auto');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.__aliceDemo?.auto())).toBe(false);
  await scrollTo(page, 1);
  await page.waitForTimeout(1500);
  expect(new URL(page.url()).pathname).toMatch(/\/demos\/mock-turtle\/?$/);
  // Ask for it: remembered, and the ring starts to fill once the end is held.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.demo__end')).toHaveAttribute('data-auto', '');
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Number(
              document
                .querySelector<HTMLElement>('.demo__next')
                ?.style.getPropertyValue('--demo-auto'),
            ) || 0,
        ),
      { timeout: 4000 },
    )
    .toBeGreaterThan(0.1);
  await page.waitForURL(/\/demos\/lobster-quadrille\/?$/, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__aliceDemo?.auto())).toBe(true);
  await page.evaluate(() => localStorage.removeItem('alice-demos:auto'));
});

test('going on by itself empties its ring when the reader scrolls back', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'mock-turtle');
  test.skip(!demo, 'no Mock Turtle demo in this build');
  await page.goto(demo?.url ?? '');
  await page.locator('.demo__auto').click();
  await scrollTo(page, 1);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Number(
              document
                .querySelector<HTMLElement>('.demo__next')
                ?.style.getPropertyValue('--demo-auto'),
            ) || 0,
        ),
      { timeout: 4000 },
    )
    .toBeGreaterThan(0.1);
  await scrollTo(page, 0.5);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Number(
              document
                .querySelector<HTMLElement>('.demo__next')
                ?.style.getPropertyValue('--demo-auto'),
            ) || 0,
        ),
      { timeout: 4000 },
    )
    .toBe(0);
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).pathname).toMatch(/\/demos\/mock-turtle\/?$/);
  await page.evaluate(() => localStorage.removeItem('alice-demos:auto'));
});

test('reduced motion steps beat by beat: every scroll shows its beat settled, small scrolls count', async ({
  page,
}) => {
  const demo = demos.find((candidate) => candidate.demo === 'mock-turtle');
  test.skip(!demo, 'no Mock Turtle demo in this build');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.demo')).toHaveAttribute('data-motion', 'reduced');
  const beats = await page.locator('.demo__stage .demo-beat').count();
  // Small wheel steps are not thrown away: the page moves on and stays moved.
  await page.mouse.move(640, 380);
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  // Midway through the fourth beat the fourth beat is active and shown settled.
  await page.evaluate(
    ([n]) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * (3.5 / n)),
    [beats] as const,
  );
  await expect.poll(() => page.evaluate(() => window.__aliceDemo?.beat() ?? -1)).toBe(3);
  await expect.poll(() => page.evaluate(() => window.__aliceDemo?.settled() ?? false)).toBe(true);
  // It stays where the reader left it.
  await page.waitForTimeout(800);
  const progress = await page.evaluate(() => window.__aliceDemo?.progress() ?? -1);
  expect(progress * beats).toBeGreaterThan(3.3);
  expect(progress * beats).toBeLessThan(3.7);
});

test('the link to the next scene joins the tab order only on the last beat', async ({ page }) => {
  const demo = demos.find((candidate) => candidate.demo === 'caterpillar');
  test.skip(!demo, 'no Caterpillar demo in this build');
  await page.goto(demo?.url ?? '');
  await expect(page.locator('.demo__end')).toHaveAttribute('inert', '');
  await scrollTo(page, 1);
  await expect(page.locator('.demo__end')).not.toHaveAttribute('inert', '');
  await expect(page.locator('.demo__next')).toBeVisible();
});
