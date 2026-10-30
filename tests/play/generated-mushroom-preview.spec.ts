import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type { LocaleUIStrings } from '../../src/types/schema.ts';
import { atCue, press } from '../demo-helpers.ts';

const original = '.ct__mushroom > .art';
const candidate = '[data-generated-mushroom]';
const control = '[data-generated-mushroom-toggle]';
const panel = '.ct__preview-controls';
const uiFor = (locale: string): LocaleUIStrings['strings'] =>
  (
    JSON.parse(
      readFileSync(new URL(`../../text/locales/${locale}/ui.json`, import.meta.url), 'utf8'),
    ) as LocaleUIStrings
  ).strings;

const geometry = (page: Page) =>
  page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`missing geometry target: ${selector}`);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return [rect('.ct__mushroom'), rect('.ct__mushroom > .art'), rect('.ct__caterpillar')] as const;
  });

for (const locale of ['en-simple', 'ja']) {
  const prefix = locale === 'en-simple' ? '' : `${locale}/`;
  const ui = uiFor(locale);
  for (const viewport of [
    { width: 1280, height: 800, reducedMotion: 'no-preference' },
    { width: 390, height: 844, reducedMotion: 'reduce' },
  ] as const) {
    test(`mushroom comparison preserves the Caterpillar: ${locale} ${viewport.width}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: viewport.reducedMotion });
      await page.goto(`/demos/${prefix}caterpillar/?artPreview=mushroom`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await atCue(page, 'who', 0.9);
      await expect(page.locator(candidate)).toBeVisible();
      await expect(page.locator(panel)).not.toHaveAttribute('open');
      const before = await geometry(page);
      const image = page.locator(candidate);
      expect(await image.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(1402);
      const ratio = await image.evaluate((el) => {
        const style = getComputedStyle(el);
        return Number.parseFloat(style.width) / Number.parseFloat(style.height);
      });
      expect(ratio).toBeCloseTo(1402 / 1122, 3);
      await expect(page.locator('.ct__caterpillar .ct__head')).toHaveCount(1);
      await expect(page.locator('.ct__caterpillar .ct__body')).toHaveCount(1);
      await page.locator(`${panel} summary`).focus();
      await page.keyboard.press('Enter');
      const toggle = page.getByRole('checkbox', { name: ui.demoGeneratedMushroom });
      await expect(toggle).toBeChecked();
      await expect(page.locator(`${panel} p`)).toHaveText(ui.demoGeneratedMushroomLimit);
      await toggle.focus();
      await page.keyboard.press('Space');
      await expect(image).not.toBeVisible();
      await expect(page.locator(original)).not.toHaveAttribute('data-generated-mushroom-active');
      await expect(page.locator(`${original} > .art__image--baked`)).toBeVisible();
      expect(await geometry(page)).toEqual(before);
      await page.keyboard.press('Space');
      await expect(image).toBeVisible();
      await expect(page.locator(`${original} > .art__image--baked`)).not.toBeVisible();
      expect(await geometry(page)).toEqual(before);
      await page.locator(`${panel} summary`).click();
      await expect(toggle).not.toBeVisible();
      await expect(image).toBeVisible();
      await atCue(page, 'crawl');
      await atCue(page, 'who', 0.9);
      await expect(image).toBeVisible();
      expect(await geometry(page)).toEqual(before);
    });
  }

  test(`mushroom failure restores its own original and localized notice: ${locale}`, async ({
    page,
  }) => {
    await page.route('**/mushroom.any.candidate-v1*.webp', (route) => route.abort());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/demos/${prefix}caterpillar/?artPreview=mushroom`);
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await atCue(page, 'who', 0.9);
    await page.locator(`${panel} summary`).click();
    await expect(page.locator(control)).toBeDisabled();
    await expect(page.locator(candidate)).not.toBeVisible();
    await expect(page.locator(original)).not.toHaveAttribute('data-generated-mushroom-active');
    await expect(page.locator(`${original} > .art__image--baked`)).toBeVisible();
    await expect(page.locator(`${panel} p`)).toHaveText(ui.demoGeneratedMushroomUnavailable);
    await expect(page.locator('.ct__caterpillar')).toBeVisible();
  });
}

test('a late mushroom load respects a checkbox already switched back to the original', async ({
  page,
}) => {
  let release = (): void => {};
  const waitForRelease = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/mushroom.any.candidate-v1*.webp', async (route) => {
    await waitForRelease;
    await route.continue();
  });
  try {
    await page.goto('/demos/caterpillar/?artPreview=mushroom', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await atCue(page, 'who', 0.9);
    await expect(page.locator(candidate)).not.toBeVisible();
    await expect(page.locator(`${original} > .art__image--baked`)).toBeVisible();
    await page.locator(`${panel} summary`).click();
    await page.locator(control).uncheck();
    release();
    await expect
      .poll(() => page.locator(candidate).evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBe(1402);
    await expect(page.locator(candidate)).not.toBeVisible();
    await expect(page.locator(`${original} > .art__image--baked`)).toBeVisible();
    await page.locator(control).check();
    await expect(page.locator(candidate)).toBeVisible();
  } finally {
    release();
  }
});

for (const style of ['flat', 'paper']) {
  test(`ordinary mushroom pages never fetch the candidate: ${style}`, async ({ page }) => {
    await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('mushroom.any.candidate-v1')) requests.push(request.url());
    });
    for (const query of ['', '?artPreview=overhead', '?artPreview=other']) {
      await page.goto(`/demos/caterpillar/${query}`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await atCue(page, 'who', 0.9);
      await expect(page.locator(candidate)).toHaveCount(0);
      await expect(page.locator(panel)).toHaveCount(0);
      await expect(page.locator(original)).not.toHaveAttribute('data-generated-mushroom-active');
      await expect(page.locator(`${original} > svg`)).toBeVisible();
    }
    expect(requests).toEqual([]);
  });
}

test('mushroom query never installs a comparison in another scene', async ({ page }) => {
  await page.goto('/demos/rabbit-hole/?artPreview=mushroom');
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
  await expect(page.locator(candidate)).toHaveCount(0);
  await expect(page.locator(control)).toHaveCount(0);
  await expect(page.locator('[data-generated-master]')).toHaveCount(0);
});

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`ordinary engraved mushroom preserves nibble targets and size restoration: ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demos/caterpillar/');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await atCue(page, 'sides', 0.9);
    await expect(page.locator(candidate)).toBeVisible();
    await expect(page.locator(original)).toHaveAttribute('data-generated-mushroom-active', '');
    await expect(page.locator(panel)).toHaveCount(0);
    const left = page.locator('.ct__bit--left');
    const right = page.locator('.ct__bit--right');
    for (const button of [left, right]) {
      await expect(button).toBeVisible();
      await expect(button).toHaveAccessibleName(/.+/);
      expect(
        await button.evaluate((element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return (
            document.elementFromPoint(x + width / 2, y + height / 2)?.closest('button') === element
          );
        }),
      ).toBe(true);
    }
    const before = await geometry(page);
    const tape = page.getByRole('meter');
    await expect(tape).toHaveAttribute('aria-valuenow', '3.0');
    await press(page, left);
    await expect(tape).toHaveAttribute('aria-valuenow', '5.1');
    const smaller = await geometry(page);
    expect(smaller[0].width / before[0].width).toBeCloseTo(1 / 1.7, 3);
    await press(page, right);
    await expect(tape).toHaveAttribute('aria-valuenow', '3.0');
    const restored = await geometry(page);
    expect(restored[0].width).toBeCloseTo(before[0].width, 2);
    expect(restored[1].width).toBeCloseTo(before[1].width, 2);
    await expect(page.locator(candidate)).toBeVisible();
    await atCue(page, 'shrink', 0.9);
    const large = await geometry(page);
    expect(large[0].width).toBeGreaterThan(before[0].width);
    await atCue(page, 'who', 0.9);
    const reversed = await geometry(page);
    expect(reversed[0].width).toBeCloseTo(before[0].width, 2);
    await expect(page.locator(candidate)).toBeVisible();
  });
}

for (const failure of ['request', 'decode'] as const) {
  test(`ordinary engraved mushroom keeps its original after ${failure} failure`, async ({
    page,
  }) => {
    if (failure === 'request') {
      await page.route('**/mushroom.any.candidate-v1*.webp', (route) => route.abort());
    } else {
      await page.addInitScript(() => {
        const decode = HTMLImageElement.prototype.decode;
        HTMLImageElement.prototype.decode = function () {
          return this.hasAttribute('data-generated-mushroom')
            ? Promise.reject(new Error('mushroom decode test'))
            : decode.call(this);
        };
      });
    }
    await page.goto('/demos/caterpillar/');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await atCue(page, 'who', 0.9);
    await expect
      .poll(() => page.locator(candidate).evaluate((el) => (el as HTMLImageElement).complete))
      .toBe(true);
    await expect(page.locator(candidate)).not.toBeVisible();
    await expect(page.locator(original)).not.toHaveAttribute('data-generated-mushroom-active');
    await expect(page.locator(`${original} > .art__image--baked`)).toBeVisible();
    await expect(page.locator(panel)).toHaveCount(0);
    await expect(page.locator('.ct__caterpillar')).toBeVisible();
  });
}
