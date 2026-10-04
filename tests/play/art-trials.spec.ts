/**
 * The drawing trial (docs/art-trials.md): the index's choice of drawing is
 * remembered, applied to every demo page as `data-art` on the root before first
 * paint, and the pictures style shows the baked images, which load and are cut out.
 */

import { expect, type Page, test } from '@playwright/test';
import { demos, pages } from '../demo-helpers.ts';

const index = pages.find((page) => page.kind === 'demos');
const duchess = demos.find((d) => d.demo === 'duchess');

const choose = async (page: Page, name: RegExp) => {
  const button = page.locator('.demos__art-choice').filter({ hasText: name });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
};

const rootArt = (page: Page) => page.evaluate(() => document.documentElement.dataset.art ?? null);

test.describe('the drawing trial', () => {
  test.skip(!index || !duchess, 'no demo pages in the build');

  test('flat is the default and leaves a demo page as it was', async ({ page }) => {
    await page.goto(duchess?.url ?? '');
    await expect(page.locator('.art').first()).toBeAttached();
    expect(await rootArt(page)).toBeNull();
    await expect(page.locator('.art-defs')).toHaveCount(0);
    await expect(page.locator('img.art__image--baked')).toHaveCount(0);
  });

  test('the choice persists and reaches every demo page', async ({ page }) => {
    await page.goto(index?.url ?? '');
    await expect(page.locator('.demos__art-choice[aria-pressed="true"]')).toHaveAttribute(
      'data-art-style',
      'flat',
    );
    await choose(page, /Engraved/);
    expect(await rootArt(page)).toBe('engraved');
    expect(await page.evaluate(() => localStorage.getItem('alice-demos:art'))).toBe('engraved');

    await page.reload();
    expect(await rootArt(page)).toBe('engraved');
    await expect(page.locator('.demos__art-choice[data-art-style="engraved"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.goto(duchess?.url ?? '');
    expect(await rootArt(page)).toBe('engraved');
    await expect(page.locator('.art-defs filter#art-engraved')).toBeAttached();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const svg = document.querySelector('.demo .art > svg');
          return svg ? getComputedStyle(svg).filter : '';
        }),
      )
      .toContain('art-engraved');

    // And back: flat removes the attribute again.
    await page.goto(index?.url ?? '');
    await choose(page, /Flat/);
    expect(await rootArt(page)).toBeNull();
  });

  test('pictures shows baked images that load, cut out on a transparent ground', async ({
    page,
  }) => {
    const statuses = new Map<string, number>();
    page.on('response', (response) => {
      if (response.url().endsWith('.webp')) {
        statuses.set(response.url(), response.status());
      }
    });
    await page.goto(index?.url ?? '');
    await page.locator('.demos__alice-choice[data-alice="blue"]').click();
    await choose(page, /Pictures/);
    await page.goto(duchess?.url ?? '');
    expect(await rootArt(page)).toBe('baked');

    const shown = page.locator('img.art__image--baked:visible');
    await expect.poll(() => shown.count(), { timeout: 10_000 }).toBeGreaterThan(1);
    // The Alice shown is the chosen one's picture.
    await expect(page.locator('.art[data-art="alice/falling"] img:visible')).toHaveAttribute(
      'data-variant',
      'blue',
    );
    const report = await shown.evaluateAll(async (images) =>
      Promise.all(
        (images as HTMLImageElement[]).map(async (image) => {
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          context?.drawImage(image, 0, 0);
          const corner = context?.getImageData(0, 0, 1, 1).data[3] ?? 255;
          return { src: image.currentSrc, width: image.naturalWidth, corner };
        }),
      ),
    );
    for (const image of report) {
      expect(image.width, image.src).toBeGreaterThan(0);
      expect(image.corner, `${image.src} has a transparent corner`).toBe(0);
      if (!image.src.startsWith('data:')) {
        expect(statuses.get(image.src), image.src).toBe(200);
      }
    }
    // The vector it stands in for steps aside.
    await expect(page.locator('.art--baked > svg:visible')).toHaveCount(0);
  });
});
