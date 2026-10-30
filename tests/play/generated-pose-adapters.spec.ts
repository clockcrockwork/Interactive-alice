/** Prepared DOM/readiness contracts, not evidence of rendered contact or browser execution. */
import { expect, type Locator, type Page, test } from '@playwright/test';
import { collectErrors } from '../demo-helpers.ts';

const consumers = [
  {
    scene: 'riverbank',
    parent: '.rb__sitting',
    rig: 'alice/sitting',
    box: '160 150',
    asset: 'alice--sitting~',
    count: 4,
    alice: true,
  },
  {
    scene: 'pig-and-pepper',
    parent: '.pp__duchess > .art',
    rig: 'duchess/seated',
    box: '240 260',
    asset: 'duchess--seated.',
    count: 1,
    alice: false,
  },
  {
    scene: 'croquet',
    parent: '.cq__duchess',
    rig: 'duchess/seated',
    box: '240 260',
    asset: 'duchess--seated.',
    count: 1,
    alice: false,
  },
  {
    scene: 'duchess',
    parent: '.dc__duchess',
    rig: 'duchess/walking',
    box: '240 260',
    asset: 'duchess.any.',
    count: 1,
    alice: false,
  },
  {
    scene: 'duchess',
    parent: '.dc__pig',
    rig: 'pig-baby/flying',
    box: '200 200',
    asset: 'pig-baby--flying.',
    count: 1,
    alice: false,
  },
  {
    scene: 'drink-me',
    parent: '.dk__falling',
    rig: 'alice/falling-card',
    box: '120 200',
    asset: 'alice--falling-card.',
    count: 1,
    alice: true,
  },
  {
    scene: 'trial',
    parent: '.tr__alice-off',
    rig: 'alice/falling-card',
    box: '120 200',
    asset: 'alice--falling-card.',
    count: 1,
    alice: true,
  },
] as const;

async function setup(page: Page, variant = 'yellow', style = 'engraved') {
  await page.addInitScript(
    ({ variant, style }) => {
      localStorage.setItem('alice-demos:alice', variant);
      localStorage.setItem('alice-demos:art', style);
    },
    { variant, style },
  );
}

async function fallbackOnly(rig: Locator) {
  await expect(rig).not.toHaveAttribute('data-rig-ready');
  const generated = rig.locator(':scope > [data-rig-generated]');
  const fallback = rig.locator(':scope > [data-rig-fallback]');
  await expect(generated).toHaveCount(1);
  await expect(generated).toHaveCSS('display', 'none');
  await expect(generated).toHaveCSS('visibility', 'hidden');
  await expect(fallback).toHaveCount(1);
  await expect(fallback).not.toHaveCSS('display', 'none');
  expect(await fallback.locator(':scope > *').count()).toBeGreaterThan(0);
}

async function ready(rig: Locator) {
  await expect(rig).toHaveAttribute('data-rig-ready', '');
  await expect(rig).not.toHaveAttribute('data-rig-failed');
  await expect(rig.locator(':scope > [data-rig-fallback]')).toHaveCSS('display', 'none');
  await expect(rig.locator(':scope > [data-rig-generated]')).toHaveCSS('display', 'inline');
  await expect(rig.locator(':scope > [data-rig-generated]')).toHaveCSS('visibility', 'visible');
}

for (const consumer of consumers) {
  const selector = `${consumer.parent} svg[data-generated-rig="${consumer.rig}"]`;
  const label = `${consumer.scene} ${consumer.rig}`;
  for (const variant of consumer.alice ? ['yellow', 'blue'] : ['yellow']) {
    for (const motion of ['no-preference', 'reduce'] as const) {
      test(`pose adapter decodes the selected source: ${label}, ${variant}, ${motion}`, async ({
        page,
      }) => {
        const errors = collectErrors(page);
        const requests: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes(consumer.asset)) requests.push(request.url());
        });
        await setup(page, variant);
        await page.emulateMedia({ reducedMotion: motion });
        await page.goto(`/demos/${consumer.scene}/`);
        const rig = page.locator(selector);
        await expect(rig).toHaveCount(1);
        await ready(rig);
        await expect(rig).toHaveAttribute('viewBox', `0 0 ${consumer.box}`);
        await expect(rig).toHaveAttribute('focusable', 'false');
        const images = rig.locator('image[data-rig-image]');
        await expect(images).toHaveCount(consumer.count);
        for (const image of await images.all()) {
          await expect(image).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
          const shared = (await image.getAttribute('data-sitting-layer')) === 'lids';
          const expectedVariant = consumer.alice && !shared ? variant : 'any';
          await expect(image).toHaveAttribute('data-variant', expectedVariant);
          await expect(image).toHaveAttribute(
            'href',
            new RegExp(`\\.${expectedVariant}\\.generated`),
          );
        }
        expect(requests.length).toBeGreaterThan(0);
        if (consumer.alice) {
          const other = variant === 'yellow' ? 'blue' : 'yellow';
          expect(requests.some((url) => url.includes(`.${other}.generated`))).toBe(false);
        }
        expect(errors).toEqual([]);
      });
    }
  }

  const sources =
    consumer.rig === 'alice/sitting'
      ? [
          'alice--sitting~body.yellow.',
          'alice--sitting~head.yellow.',
          'alice--sitting~arm-right.yellow.',
          'alice--sitting~lids.any.',
        ]
      : [consumer.asset];
  for (const source of sources) {
    test(`pose adapter retains the entire fallback after failure: ${label}, ${source}`, async ({
      page,
    }) => {
      await setup(page);
      let intercepted = false;
      await page.route(
        (url) => url.pathname.includes(source),
        (route) => {
          intercepted = true;
          return route.abort();
        },
      );
      await page.goto(`/demos/${consumer.scene}/`);
      const rig = page.locator(selector);
      await expect(rig).toHaveAttribute('data-rig-failed', '');
      expect(intercepted).toBe(true);
      await fallbackOnly(rig);
    });
  }

  test(`pose adapter reveals atomically after a delayed source: ${label}`, async ({ page }) => {
    await setup(page);
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let intercepted = false;
    // Holding the shared lids also proves the three coloured sitting layers cannot reveal alone.
    const source = consumer.rig === 'alice/sitting' ? 'alice--sitting~lids.any.' : consumer.asset;
    await page.route(
      (url) => url.pathname.includes(source),
      async (route) => {
        intercepted = true;
        await held;
        await route.continue();
      },
    );
    try {
      await page.goto(`/demos/${consumer.scene}/`, { waitUntil: 'domcontentloaded' });
      const rig = page.locator(selector);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await expect.poll(() => intercepted).toBe(true);
      await fallbackOnly(rig);
      await expect(rig).not.toHaveAttribute('data-rig-failed');
      release();
      await ready(rig);
    } finally {
      release();
    }
  });

  for (const style of ['flat', 'paper']) {
    test(`pose adapter does not request its raster in ${style}: ${label}`, async ({ page }) => {
      const requests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes(consumer.asset)) requests.push(request.url());
      });
      await setup(page, 'blue', style);
      await page.goto(`/demos/${consumer.scene}/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await expect(page.locator(consumer.parent)).toHaveCount(1);
      await expect(page.locator(selector)).toHaveCount(0);
      expect(requests).toEqual([]);
    });
  }
}

for (const variant of ['yellow', 'blue']) {
  test(`sitting Alice retains independent head, arm and progressive eyelid controls: ${variant}`, async ({
    page,
  }) => {
    await setup(page, variant);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demos/riverbank/');
    const rig = page.locator('.rb__sitting svg[data-generated-rig="alice/sitting"]');
    await ready(rig);
    const paint = rig.locator('[data-rig-generated]');
    await expect(paint.locator('.rb__head .rb__lids')).toHaveCount(1);
    await expect(paint.locator('.rb__head')).toHaveCSS('transform-box', 'view-box');
    await expect(paint.locator('.rb__arm')).toHaveCSS('transform-box', 'view-box');
    const sample = async (value: number) => {
      // Set on the rig to isolate the existing CSS controls from the scroll timeline.
      await rig.evaluate((node, value) => {
        node.style.setProperty('--droop', String(value));
        node.style.setProperty('--reach', String(value));
      }, value);
      return paint.evaluate((node) => {
        const matrix = (selector: string) => {
          const part = node.querySelector(selector);
          if (!part) throw new Error(`missing ${selector}`);
          return getComputedStyle(part).transform;
        };
        return {
          head: matrix('.rb__head'),
          arm: matrix('.rb__arm'),
          lid: new DOMMatrix(matrix('.rb__generated-lid-reveal')).d,
        };
      });
    };
    const open = await sample(0);
    const half = await sample(0.5);
    const closed = await sample(1);
    expect(open.lid).toBeCloseTo(0, 5);
    expect(half.lid).toBeCloseTo(0.5, 5);
    expect(closed.lid).toBeCloseTo(1, 5);
    expect(closed.head).not.toBe(open.head);
    expect(closed.arm).not.toBe(open.arm);
    expect(await sample(0)).toEqual(open);
  });
}

test('phone-width Duchess adapters keep the live bird and separate wings intact', async ({
  page,
}) => {
  // A narrow desktop-browser viewport, not mobile-device execution evidence.
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto('/demos/duchess/');
  await ready(page.locator('.dc__duchess svg[data-generated-rig="duchess/walking"]'));
  await ready(page.locator('.dc__pig svg[data-generated-rig="pig-baby/flying"]'));
  await ready(page.locator('.dc__alice > .art > svg[data-generated-rig="alice/duchess-hold"]'));
  await expect(page.locator('.dc__flamingo > .art')).toHaveCount(1);
  await expect(page.locator('.dc__flamingo [data-generated-rig]')).toHaveCount(0);
  for (const hook of ['neck', 'head', 'jaw', 'pupil'])
    await expect(page.locator(`.dc__flamingo .dc__tucked-${hook}`)).toHaveCount(1);
  await expect(page.locator('.dc__pig > .dc__wings .dc__wing')).toHaveCount(2);
  await expect(page.locator('.dc__pig [data-generated-rig] .dc__wing')).toHaveCount(0);
});

test('phone-width seated Duchess leaves both Kitchen staged babies intact', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demos/pig-and-pepper/');
  await ready(page.locator('.pp__duchess svg[data-generated-rig="duchess/seated"]'));
  for (const selector of ['.pp__baby-in-arms', '.pp__baby']) {
    await expect(page.locator(selector)).toHaveCount(1);
    await expect(page.locator(selector)).toHaveAttribute('data-stage', '0');
    await expect(page.locator(`${selector} svg`)).toHaveCount(1);
    await expect(page.locator(`${selector} [data-generated-rig="pig-baby/flying"]`)).toHaveCount(0);
  }
});

test('falling cards do not replace Rabbit Hole’s independent falling rig', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('alice--falling-card.')) requests.push(request.url());
  });
  await setup(page);
  await page.goto('/demos/rabbit-hole/');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await expect(page.locator('[data-generated-rig="alice/falling-card"]')).toHaveCount(0);
  expect(requests).toEqual([]);
});
