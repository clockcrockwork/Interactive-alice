import { expect, test } from '@playwright/test';
import { scrollTo } from './demo-helpers.ts';

const bankArt = /\/assets\/tree\.generated-[\w-]+\.webp$/;
const sisterArt = /\/assets\/alices-sister\.any\.generated-[\w-]+\.webp$/;
const rabbitMound = /\/assets\/rabbit-mound\.generated-[\w-]+\.webp$/;
const sceneModule = /\/assets\/main-[\w-]+\.js$/;

function gate() {
  let release = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { hold, release };
}

test('the opening verse appears before the scene script and stays through the first art decode', async ({
  page,
}) => {
  const script = gate();
  const art = gate();
  const sister = gate();
  await page.route(sisterArt, async (route) => {
    await sister.hold;
    await route.continue();
  });
  await page.route(sceneModule, async (route) => {
    await script.hold;
    await route.continue();
  });
  await page.route(bankArt, async (route) => {
    await art.hold;
    await route.continue();
  });

  try {
    const requestedScript = page.waitForRequest(sceneModule);
    await page.goto('./', { waitUntil: 'commit' });
    await requestedScript;
    const poem = page.locator('[data-opening-poem]');
    await expect(poem).toBeVisible();
    await expect(poem.locator('blockquote')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.demo__stage')).toHaveCount(0);

    const requestedArt = page.waitForRequest(bankArt);
    const requestedSister = page.waitForRequest(sisterArt);
    script.release();
    await Promise.all([requestedArt, requestedSister]);
    await expect(page.locator('#demo')).toHaveAttribute('data-attached', '');
    await expect(poem).toBeVisible();
    await expect(page.locator('.rb__tree [data-generated-rig]')).not.toHaveAttribute(
      'data-rig-ready',
    );

    art.release();
    await expect(page.locator('.rb__tree [data-generated-rig]')).toHaveAttribute(
      'data-rig-ready',
      '',
    );
    await expect(poem).toBeVisible();
    sister.release();
    await expect(poem).toBeHidden();
    await expect(page.locator('.demo__stage')).toBeVisible();
  } finally {
    script.release();
    art.release();
    sister.release();
  }
});

test('the entry waits for later field images too, not only the visible riverbank', async ({
  page,
}) => {
  const mound = gate();
  await page.route(rabbitMound, async (route) => {
    await mound.hold;
    await route.continue();
  });
  try {
    await page.goto('./');
    const poem = page.locator('[data-opening-poem]');
    await expect(poem).toBeVisible();
    await expect(page.locator('.field__mound img')).toHaveJSProperty('complete', false);
    await expect(poem).toBeVisible();
    mound.release();
    await expect(poem).toBeHidden();
    await expect(page.locator('.field__mound img')).toHaveJSProperty('naturalWidth', 1080);
  } finally {
    mound.release();
  }
});

test('the Japanese opening continues if its opening pictures cannot be loaded', async ({
  page,
}) => {
  await page.route(bankArt, (route) => route.abort());
  await page.route(sisterArt, (route) => route.abort());
  await page.goto('./demos/ja/riverbank/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('[data-opening-poem] blockquote')).not.toHaveAttribute('lang');
  await expect(page.locator('.rb__tree [data-generated-rig]')).toHaveAttribute(
    'data-rig-failed',
    '',
  );
  await expect(page.locator('.rb__sister [data-art="alices-sister"] svg')).toHaveCount(1);
  await expect(page.locator('.rb__sister [data-art="alices-sister"] image')).toHaveCount(0);
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
  await expect(page.locator('.demo__stage')).toBeVisible();
});

test('a failed entry script releases the readable fallback', async ({ page }) => {
  await page.route(sceneModule, (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
  await expect(page.locator('#demo .demo__track')).toBeVisible();
  await expect(page.locator('.opening-poem__again summary')).toBeVisible();
  await page.locator('.opening-poem__again summary').click();
  await expect(page.locator('.opening-poem__again blockquote')).toBeVisible();
});

test('the opening cannot become a permanent gate if a script request stalls', async ({ page }) => {
  const script = gate();
  await page.clock.install();
  await page.route(sceneModule, async (route) => {
    await script.hold;
    await route.abort();
  });
  try {
    await page.goto('./', { waitUntil: 'commit' });
    const poem = page.locator('[data-opening-poem]');
    await expect(poem).toBeVisible();
    await page.clock.runFor(8_100);
    await expect(poem).toBeHidden();
    await expect(page.locator('#demo .demo__track')).toBeVisible();
  } finally {
    script.release();
  }
});

test('late scene setup can still replace failed sister artwork after the safety deadline', async ({
  page,
}) => {
  const script = gate();
  await page.clock.install();
  await page.route(sceneModule, async (route) => {
    await script.hold;
    await route.continue();
  });
  await page.route(sisterArt, (route) => route.abort());
  try {
    await page.goto('./', { waitUntil: 'commit' });
    const poem = page.locator('[data-opening-poem]');
    await expect(poem).toBeVisible();
    await page.clock.runFor(8_100);
    await expect(poem).toBeHidden();
    script.release();
    await expect(page.locator('#demo')).toHaveAttribute('data-attached', '');
    const sister = page.locator('.rb__sister [data-art="alices-sister"]');
    await expect(sister.locator('svg')).toHaveCount(1);
    await expect(sister).not.toHaveAttribute('data-generated');
    await expect(sister.locator('image')).toHaveCount(0);
    await expect(poem).toBeHidden();
  } finally {
    script.release();
  }
});

test('the reread summary keeps native keyboard control and protects the reading area', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
  await scrollTo(page, 1);
  const reading = page.locator('.opening-poem__again');
  const summary = reading.locator('summary');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(reading).toHaveAttribute('open', '');
  await reading.dispatchEvent('wheel', { deltaY: 120, bubbles: true });
  await expect(reading.locator('blockquote')).toBeVisible();
  const auto = page.locator('.demo__auto');
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await page.clock.install();
  await page.clock.runFor(4_100);
  await expect(reading.locator('blockquote')).toBeVisible();
});

test('a later scene does not use the opening gate', async ({ page }) => {
  await page.goto('./demos/rabbit-hole/');
  await expect(page.locator('[data-opening-poem]')).toHaveCount(0);
  await expect(page.locator('.demo__stage')).toBeVisible();
});

test('the verse is not shown again when Riverbank is re-entered in the same tab', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
  await page.goto('./demos/riverbank/');
  await expect(page.locator('[data-opening-poem]')).toHaveCount(1);
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
  await expect(page.locator('.demo__stage')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the story and the verse reread remain available', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('[data-opening-poem]')).toBeHidden();
    await expect(page.locator('#demo .demo__track')).toBeVisible();
    await expect(page.locator('.opening-poem__again summary')).toBeVisible();
  });
});
