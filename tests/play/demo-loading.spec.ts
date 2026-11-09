import { expect, test } from '@playwright/test';

test('the scene text stays hidden until the stage is ready, including after re-entry', async ({
  page,
}) => {
  let releaseEntry: (() => void) | undefined;
  let entryStarted: (() => void) | undefined;
  const blocked = new Promise<void>((resolve) => {
    releaseEntry = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entryStarted = resolve;
  });
  let held = false;
  await page.route('**/assets/main-*.js', async (route) => {
    if (!held) {
      held = true;
      entryStarted?.();
      await blocked;
    }
    await route.continue();
  });

  await page.goto('/demos/cheshire-cat/', { waitUntil: 'commit' });
  await page.locator('.demo__track').waitFor({ state: 'attached' });
  await started;
  await expect(page.locator('html')).toHaveAttribute('data-demo-booting', '');
  await expect(page.locator('.demo__track')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.demo__track .line')).toHaveCount(43);

  releaseEntry?.();
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-demo-booting');
  await expect(page.locator('.demo__track')).toBeHidden();
  await expect(page.locator('.demo-beat[data-active]')).toHaveCount(1);

  await page.locator('.demo__back').click();
  await expect(page).toHaveURL(/\/demos\/pig-and-pepper\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/demos\/cheshire-cat\/$/);
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await expect(page.locator('.demo-beat[data-active]')).toHaveCount(1);
});

test('the story text remains readable when scripts are disabled', async ({ browser }) => {
  const noScriptPage = await browser.newPage({ javaScriptEnabled: false });
  await noScriptPage.goto('/demos/cheshire-cat/');
  await expect(noScriptPage.locator('.demo__track')).toBeVisible();
  await expect(noScriptPage.locator('.demo__track .line').first()).toBeVisible();
  await expect(noScriptPage.locator('html')).not.toHaveAttribute('data-demo-booting');
  await noScriptPage.close();
});
