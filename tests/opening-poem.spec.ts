import { expect, test } from '@playwright/test';
import { scrollTo } from './demo-helpers.ts';

const bankArt = /\/assets\/tree\.generated-[\w-]+\.webp$/;
const sisterArt = /\/assets\/alices-sister-reading\.any\.generated-[\w-]+\.webp$/;
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
    const [treeRequest, sisterRequest] = await Promise.all([requestedArt, requestedSister]);
    expect(treeRequest.url()).toMatch(bankArt);
    expect(sisterRequest.url()).toMatch(sisterArt);
    await expect(page.locator('#demo')).toHaveAttribute('data-attached', '');
    await expect(page.locator('.rb__sister-reading')).toHaveJSProperty('complete', false);
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
    await expect(page.locator('.rb__sister-reading')).toHaveJSProperty('naturalWidth', 1000);
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
    await page.goto('./', { waitUntil: 'commit' });
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

test('the Japanese opening shows its fallback if the current reading illustration fails', async ({
  page,
}) => {
  const requestedSister = page.waitForRequest(sisterArt);
  await page.route(sisterArt, (route) => route.abort());
  await page.goto('./demos/ja/riverbank/');
  const sisterRequest = await requestedSister;
  expect(sisterRequest.url()).toMatch(sisterArt);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('[data-opening-poem] blockquote')).not.toHaveAttribute('lang');
  await expect(page.locator('.rb__sister')).toHaveAttribute('data-image-failed', '');
  await expect(page.locator('.rb__sister-reading')).toBeHidden();
  await expect(page.locator('.rb__sister-fallback')).toBeVisible();
  await expect(page.locator('.rb__sister [data-art="alices-sister"] svg')).toHaveCount(1);
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
  await expect(page.locator('.demo__stage')).toBeVisible();
});

test('a failed tree raster keeps the CSS tree fallback available', async ({ page }) => {
  const requestedTree = page.waitForRequest(bankArt);
  await page.route(bankArt, (route) => route.abort());
  await page.goto('./demos/ja/riverbank/');
  const treeRequest = await requestedTree;
  expect(treeRequest.url()).toMatch(bankArt);
  const treeRig = page.locator('.rb__tree [data-generated-rig="scenery/tree"]');
  await expect(treeRig).toHaveAttribute('data-rig-failed', '');
  await expect(treeRig.locator('[data-rig-generated]')).toBeHidden();
  await expect
    .poll(() =>
      page.locator('.rb__tree').evaluate((tree) => getComputedStyle(tree).backgroundImage),
    )
    .not.toBe('none');
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
  const requestedSister = page.waitForRequest(sisterArt);
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
    const sisterRequest = await requestedSister;
    expect(sisterRequest.url()).toMatch(sisterArt);
    await expect(page.locator('#demo')).toHaveAttribute('data-attached', '');
    const sister = page.locator('.rb__sister [data-art="alices-sister"]');
    await expect(sister.locator('svg')).toHaveCount(1);
    await expect(page.locator('.rb__sister')).toHaveAttribute('data-image-failed', '');
    await expect(page.locator('.rb__sister-reading')).toBeHidden();
    await expect(page.locator('.rb__sister-fallback')).toBeVisible();
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

test('a one-raster complete synthetic manifest exercises the opening state gate', async ({
  page,
}) => {
  const manifestGate = gate();
  // Route interception makes this a state-transition fixture, not cache or cold-delivery evidence.
  await page.route('**/assets/**', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'cache-control': 'public, max-age=31536000, immutable' },
    });
  });
  await page.route('**/demo-image-usage.json', async (route) => {
    await manifestGate.hold;
    const response = await route.fetch();
    const manifest = (await response.json()) as {
      coverage: Record<string, unknown>;
      preloadEligible: boolean;
      routes: Array<{
        path: string;
        demo: string;
        status: string;
        assets: Array<Record<string, unknown>> | null;
      }>;
    };
    const riverbank = manifest.routes.find((entry) => entry.demo === 'riverbank');
    const raster = riverbank?.assets?.find((asset) =>
      String(asset.sourcePath).endsWith('/tree.generated.webp'),
    );
    if (!raster || !riverbank) throw new Error('Riverbank fixture has no emitted tree raster');
    for (const entry of manifest.routes) {
      entry.status = 'source-audited';
      entry.assets = entry === riverbank ? [raster] : [];
    }
    manifest.coverage = {
      status: 'complete',
      publicSceneCount: new Set(manifest.routes.map((entry) => entry.demo)).size,
      auditedSceneCount: new Set(manifest.routes.map((entry) => entry.demo)).size,
      incompleteScenes: [],
    };
    manifest.preloadEligible = true;
    await route.fulfill({ response, json: manifest });
  });

  try {
    await page.goto('./');
    await expect(page.locator('[data-opening-poem]')).toBeVisible();
    manifestGate.release();
    await expect(page.locator('html')).toHaveAttribute('data-opening-state', 'full-ready');
    await expect(page.locator('[data-opening-status]')).toHaveText(
      'The story’s pictures are ready.',
    );
    await expect(page.locator('[data-opening-poem]')).toBeHidden();
    await page.goto('./demos/rabbit-hole/');
    await expect(page.locator('[data-opening-poem]')).toHaveCount(0);
  } finally {
    manifestGate.release();
  }
});

test('partial coverage never starts whole-book image fetches', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { __openingFetches?: string[] };
    state.__openingFetches = [];
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      state.__openingFetches?.push(url);
      return nativeFetch(input, init);
    };
  });

  const requestedEntryArt = page.waitForRequest(sisterArt);
  await page.route('**/demo-image-usage.json', async (route) => {
    const response = await route.fetch();
    const manifest = (await response.json()) as {
      coverage: {
        status: string;
        publicSceneCount: number;
        auditedSceneCount: number;
        incompleteScenes: string[];
      };
      preloadEligible: boolean;
      routes: Array<{
        path: string;
        demo: string;
        locale: string;
        status: string;
        assets: Array<Record<string, unknown>> | null;
      }>;
    };
    const incompleteScene = 'dormouse';
    const sceneIds = new Set(manifest.routes.map((entry) => entry.demo));
    const incompleteRoutes = manifest.routes.filter((entry) => entry.demo === incompleteScene);
    expect(new Set(incompleteRoutes.map((entry) => entry.locale))).toEqual(
      new Set(['en-simple', 'ja']),
    );
    for (const entry of incompleteRoutes) {
      entry.status = 'not-audited';
      entry.assets = null;
    }
    const auditedSceneIds = new Set(
      manifest.routes
        .filter((entry) => entry.status === 'source-audited')
        .map((entry) => entry.demo),
    );
    manifest.coverage = {
      status: 'partial',
      publicSceneCount: sceneIds.size,
      auditedSceneCount: auditedSceneIds.size,
      incompleteScenes: [incompleteScene],
    };
    manifest.preloadEligible = false;
    expect(manifest.coverage).toEqual({
      status: 'partial',
      publicSceneCount: 19,
      auditedSceneCount: 18,
      incompleteScenes: [incompleteScene],
    });
    expect(incompleteRoutes.map((entry) => [entry.status, entry.assets])).toEqual([
      ['not-audited', null],
      ['not-audited', null],
    ]);
    await route.fulfill({ response, json: manifest });
  });

  await page.goto('./');
  const entryArtRequest = await requestedEntryArt;
  expect(entryArtRequest.url()).toMatch(sisterArt);
  await expect(page.locator('html')).toHaveAttribute('data-opening-state', 'partial');
  await expect(page.locator('.rb__sister-reading')).toHaveJSProperty('naturalWidth', 1000);
  const assetFetches = await page.evaluate(() =>
    ((window as Window & { __openingFetches?: string[] }).__openingFetches ?? []).filter((url) =>
      /\/assets\/.*-[\w-]{8}\.(?:webp|png|jpe?g|avif)$/i.test(url),
    ),
  );
  expect(assetFetches).toEqual([]);
  await expect(page.locator('[data-opening-poem]')).toBeHidden();
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
