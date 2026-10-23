import { expect, test } from '@playwright/test';
import { atCue } from '../demo-helpers.ts';

for (const locale of ['', 'ja/']) {
  for (const variant of ['yellow', 'blue'] as const) {
    test(`overhead master comparison remains reversible: ${locale || 'en-simple'} ${variant}`, async ({
      page,
    }) => {
      await page.addInitScript(
        (colour) => localStorage.setItem('alice-demos:alice', colour),
        variant,
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/demos/${locale}rabbit-hole/?artPreview=overhead`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await atCue(page, 'drop', 0.7);
      const panel = page.locator('.rh__preview-controls');
      await expect(panel).not.toHaveAttribute('open');
      await panel.locator('summary').click();
      const image = page.locator('[data-generated-master]');
      const toggle = page.locator('[data-generated-toggle]');
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute(
        'src',
        new RegExp(`alice--falling-overhead[.]${variant}[.]`),
      );
      expect(await image.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(1206);
      await expect(page.locator('.rh__alice .rh__hair')).toHaveCount(1);
      await expect(page.locator('.rh__alice .rh__skirt')).toHaveCount(1);
      await toggle.click();
      await expect(image).not.toBeVisible();
      await expect(page.locator('.rh__alice > .art > svg')).toBeVisible();
      await toggle.click();
      await expect(image).toBeVisible();
      const ratio = await image.evaluate((el) => {
        const style = getComputedStyle(el);
        return Number.parseFloat(style.width) / Number.parseFloat(style.height);
      });
      expect(ratio).toBeCloseTo(1206 / (variant === 'blue' ? 1305 : 1304), 2);
      await panel.locator('summary').click();
      await expect(toggle).not.toBeVisible();
      await expect(image).toBeVisible();
    });
  }
}

test('ordinary rabbit hole and shared-falling scenes keep their original art', async ({ page }) => {
  for (const scene of ['rabbit-hole', 'drink-me', 'duchess', 'trial']) {
    await page.goto(`/demos/${scene}/${scene === 'rabbit-hole' ? '' : '?artPreview=overhead'}`);
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await expect(page.locator('[data-generated-master]')).toHaveCount(0);
    await expect(page.locator('[data-generated-toggle]')).toHaveCount(0);
  }
});

test('failed candidate keeps the original figure visible', async ({ page }) => {
  await page.route('**/alice--falling-overhead.*.webp', (route) => route.abort());
  await page.goto('/demos/rabbit-hole/?artPreview=overhead');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await atCue(page, 'drop', 0.7);
  await page.locator('.rh__preview-controls summary').click();
  await expect(page.locator('[data-generated-toggle]')).toBeDisabled();
  await expect(page.locator('[data-generated-master]')).not.toBeVisible();
  await expect(page.locator('.rh__alice > .art')).not.toHaveAttribute('data-generated-preview');
  await expect(page.locator('.rh__alice > .art > svg')).toBeVisible();
});
