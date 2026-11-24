import { expect, type Page, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
] as const;

const hedge = '.rh__surface .field__hedge';
const hedgeRig = 'svg[data-generated-rig="scenery/hedge"]';

async function attached(page: Page) {
  // Keep the delayed image request from holding navigation's load event open.
  await page.goto('/demos/rabbit-hole/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
  await expect(page.locator(`${hedge} ${hedgeRig}`)).toHaveCount(1);
  await expect(page.locator('.rh__surface .field__runner')).toBeVisible();
  await page.evaluate(() => window.__aliceDemo?.seek(0));
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll('.rh__surface svg[data-generated-rig]')]
          .filter((rig) => rig.getAttribute('data-generated-rig') !== 'scenery/hedge')
          .every(
            (rig) => rig.hasAttribute('data-rig-ready') || rig.hasAttribute('data-rig-failed'),
          ),
      ),
    )
    .toBe(true);
  await page.evaluate(async () => {
    await Promise.all(
      [...document.querySelectorAll<HTMLImageElement>('.rh__surface img')].map((image) =>
        image.decode().catch(() => undefined),
      ),
    );
  });
}

async function assertSceneStillUsable(page: Page) {
  await expect(page.locator('.rh__surface .field__runner')).toHaveCount(1);
  await expect(page.locator('.demo__bar')).toBeVisible();
  await expect(page.locator('.demo__captions')).toBeVisible();
  const result = await page.evaluate(() => {
    const hedgeEl = document.querySelector('.rh__surface .field__hedge');
    const controls = document.querySelector('.demo__bar');
    const alice = document.querySelector('.rh__surface .field__runner');
    const captions = document.querySelector('.demo__captions');
    if (!hedgeEl || !controls || !alice || !captions) return null;
    const rect = (el: Element) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      hedge: rect(hedgeEl),
      controls: rect(controls),
      alice: rect(alice),
      captionOpacity: Number(getComputedStyle(captions).opacity),
    };
  });
  expect(result).not.toBeNull();
  if (!result) return;
  // The opening captions are in the sky; controls stay in the top bar.
  expect(result.captionOpacity).toBeGreaterThan(0);
  expect(result.hedge.y).toBeGreaterThan(result.controls.y + result.controls.height);
  expect(result.alice.width).toBeGreaterThan(0);
  expect(result.alice.height).toBeGreaterThan(0);
}

async function expectPlaceholder(page: Page) {
  const rig = page.locator(`${hedge} ${hedgeRig}`);
  await expect(rig).not.toHaveAttribute('data-rig-ready', '');
  const background = await page
    .locator(hedge)
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(background).toContain('0.78vh 0.34vh');
  expect(background).not.toContain('field-hedge.generated');
}

async function expectReadyArtwork(page: Page) {
  const rig = page.locator(`${hedge} ${hedgeRig}`);
  await expect(rig).toHaveAttribute('data-rig-ready', '');
  const ready = await page.locator(hedge).evaluate((node) => ({
    background: getComputedStyle(node).backgroundImage,
    href: node.querySelector('image[data-rig-image]')?.getAttribute('href') ?? '',
  }));
  expect(ready.background).toContain('field-hedge.generated');
  expect(ready.background).not.toContain('0.78vh 0.34vh');
  expect(ready.background).toContain(ready.href);
  expect(ready.href).toMatch(/field-hedge(?:-[^/?]+)?\.generated(?:-[^/?]+)?\.webp/);
}

for (const viewport of viewports) {
  test(`Rabbit Hole hedge fallback: natural successful decode at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await attached(page);
    await expectReadyArtwork(page);
    await assertSceneStillUsable(page);
  });

  test(`Rabbit Hole hedge fallback: delayed decode at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        releaseGate();
      }
    };
    const matchedUrls: string[] = [];
    const imagePattern = /field-hedge(?:-[^/?]+)?\.generated(?:-[^/?]+)?\.webp/;
    await page.route(imagePattern, async (route) => {
      matchedUrls.push(route.request().url());
      await gate;
      await route.continue();
    });

    try {
      await attached(page);
      await expect.poll(() => matchedUrls.length, { timeout: 5_000 }).toBeGreaterThan(0);
      await expectPlaceholder(page);
      await assertSceneStillUsable(page);
    } finally {
      // Every matching request waits on this shared promise; a failed assertion
      // must still let every route handler continue and release the document.
      release();
    }
    expect(matchedUrls.length).toBeGreaterThan(0);
    await expectReadyArtwork(page);
    await expect(page.locator('.rh__surface .field__runner')).toHaveCount(1);
  });

  test(`Rabbit Hole hedge fallback: failed load and reduced motion at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let requestedUrl = '';
    await page.route(/field-hedge(?:-[^/?]+)?\.generated(?:-[^/?]+)?\.webp/, async (route) => {
      requestedUrl = route.request().url();
      await route.abort('failed');
    });
    await attached(page);
    const rig = page.locator(`${hedge} ${hedgeRig}`);
    await expect.poll(() => rig.getAttribute('data-rig-failed')).toBe('');
    expect(requestedUrl).toContain('field-hedge');
    await expectPlaceholder(page);
    await assertSceneStillUsable(page);
    await expect(page.locator('.rh__surface .field__runner')).toHaveCount(1);
  });
}
