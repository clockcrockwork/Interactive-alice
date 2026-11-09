import { expect, test } from '@playwright/test';
import { atCue, demos } from '../demo-helpers.ts';

const croquet = demos.find((entry) => entry.demo === 'croquet');
const evidenceRoot = '/workspace/alice-audit-evidence-20261101/croquet-roses';

test('croquet roses swap between two separate engraved flower crops', async ({ page }) => {
  test.skip(!croquet, 'no croquet demo page in the build');
  await page.goto(croquet?.url ?? '');
  await atCue(page, 'splash', 0.005);

  const tree = page.locator('.cq__rose-tree');
  await expect(tree).toHaveAttribute('data-rose-art-ready', '', { timeout: 10_000 });
  const roses = tree.locator('.cq__rose');
  await expect(roses).toHaveCount(10);

  const targetIndex = await roses.evaluateAll((buttons) =>
    buttons.findIndex((button) => button.getAttribute('aria-pressed') === 'false'),
  );
  expect(targetIndex).toBeGreaterThanOrEqual(0);
  const firstUnpainted = roses.nth(targetIndex);
  await expect(firstUnpainted).toBeVisible();
  const whiteArt = firstUnpainted.locator('.cq__rose-art--white');
  const redArt = firstUnpainted.locator('.cq__rose-art--red');
  await expect(whiteArt).toHaveCSS('opacity', '1');
  await expect(redArt).toHaveCSS('opacity', '0');
  await expect(whiteArt).toHaveCSS('background-image', /rose-state-sprite/);

  const viewport = page.viewportSize();
  const screen = viewport && viewport.width < 700 ? 'phone' : 'desktop';
  await page.screenshot({ path: `${evidenceRoot}/rose-white-${screen}.png`, fullPage: false });

  await firstUnpainted.click();
  await expect(firstUnpainted).toHaveAttribute('aria-pressed', 'true');
  await expect(whiteArt).toHaveCSS('opacity', '0');
  await expect(redArt).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${evidenceRoot}/rose-red-${screen}.png`, fullPage: false });
});

test('the radial CSS rose fallback remains interactive if the generated plate fails', async ({
  page,
}) => {
  test.skip(!croquet, 'no croquet demo page in the build');
  await page.route(/rose-state-sprite.*\.webp/, (route) => route.abort());
  await page.goto(croquet?.url ?? '');
  await atCue(page, 'splash', 0.005);

  const tree = page.locator('.cq__rose-tree');
  await expect(tree).not.toHaveAttribute('data-rose-art-ready', '');
  const rose = tree.locator('.cq__rose').last();
  await expect(rose).toHaveCSS('background-image', /radial-gradient/);
  await rose.click();
  await expect(rose).toHaveAttribute('aria-pressed', 'true');
  await expect(rose).toHaveCSS('background-image', /radial-gradient/);
});
