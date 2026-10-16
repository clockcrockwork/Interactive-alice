/**
 * How the figures are drawn (docs/art-trials.md): engraved is the default and is
 * delivered as baked pictures that load and are cut out; flat and cut paper are still
 * chosen on the index, remembered, and applied to every demo page as `data-art` on
 * the root before first paint; the trial's old `baked` choice reads as engraved; a
 * dark ground rims the figures; and a figure whose parts a demo moves comes as
 * cut-outs there.
 */

import { expect, type Page, test } from '@playwright/test';
import { demos, pages } from '../demo-helpers.ts';

const index = pages.find((page) => page.kind === 'demos');
const url = (id: string) => demos.find((d) => d.demo === id)?.url ?? '';

const choose = async (page: Page, name: RegExp) => {
  const button = page.locator('.demos__art-choice').filter({ hasText: name });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
};

const rootArt = (page: Page) => page.evaluate(() => document.documentElement.dataset.art ?? null);

/** The baked pictures on screen: each decoded, with its size and its corner's alpha. */
const shownPictures = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll(async (images) =>
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

test.describe('how the figures are drawn', () => {
  test.skip(!index || !url('duchess'), 'no demo pages in the build');

  test('engraved is the default, as baked pictures that load and are cut out', async ({ page }) => {
    const statuses = new Map<string, number>();
    page.on('response', (response) => {
      if (response.url().endsWith('.webp')) {
        statuses.set(response.url(), response.status());
      }
    });
    await page.goto(index?.url ?? '');
    await expect(page.locator('.demos__art-choice[aria-pressed="true"]')).toHaveAttribute(
      'data-art-style',
      'engraved',
    );
    await expect(page.locator('.demos__art-choice').first()).toHaveAttribute(
      'data-art-style',
      'engraved',
    );
    await expect(page.locator('.demos__art-choice')).toHaveCount(3);
    expect(await rootArt(page)).toBeNull();
    await page.locator('.demos__alice-choice[data-alice="blue"]').click();

    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBeNull();
    await expect(page.locator('.art-defs filter#art-engraved')).toBeAttached();
    const shown = page.locator('img.art__image--baked:visible');
    await expect.poll(() => shown.count(), { timeout: 10_000 }).toBeGreaterThan(1);
    // The Alice shown is the chosen one's picture.
    await expect(page.locator('.art[data-art="alice/falling"] img:visible')).toHaveAttribute(
      'data-variant',
      'blue',
    );
    for (const image of await shownPictures(page, 'img.art__image--baked:visible')) {
      expect(image.width, image.src).toBeGreaterThan(0);
      expect(image.corner, `${image.src} has a transparent corner`).toBe(0);
      if (!image.src.startsWith('data:')) {
        expect(statuses.get(image.src), image.src).toBe(200);
      }
    }
    // The vector it stands in for steps aside; a figure with no picture is engraved live.
    await expect(page.locator('.art--baked > svg:visible')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const svg = document.querySelector('.demo .art:not(.art--baked, .art--cut) > svg');
          return svg ? getComputedStyle(svg).filter : '';
        }),
      )
      .toContain('art-engraved');
    // A light ground: no rim.
    expect(
      await page.evaluate(() => {
        const image = document.querySelector('.demo img.art__image--baked');
        return image ? getComputedStyle(image).filter : '';
      }),
    ).toBe('none');
  });

  test('flat and cut paper can still be chosen, and reach every demo page', async ({ page }) => {
    await page.goto(index?.url ?? '');
    await choose(page, /Flat/);
    expect(await rootArt(page)).toBe('flat');
    expect(await page.evaluate(() => localStorage.getItem('alice-demos:art'))).toBe('flat');

    await page.reload();
    expect(await rootArt(page)).toBe('flat');
    await expect(page.locator('.demos__art-choice[data-art-style="flat"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Flat leaves a demo page as drawn: no filters, no pictures.
    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBe('flat');
    await expect(page.locator('.art').first()).toBeAttached();
    await expect(page.locator('.art-defs')).toHaveCount(0);
    await expect(page.locator('img.art__image--baked')).toHaveCount(0);

    await page.goto(index?.url ?? '');
    await choose(page, /Cut paper/);
    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBe('paper');
    await expect(page.locator('.art-defs filter#art-paper')).toBeAttached();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const svg = document.querySelector('.demo .art > svg');
          return svg ? getComputedStyle(svg).filter : '';
        }),
      )
      .toContain('art-paper');

    // And back: engraved removes the attribute again.
    await page.goto(index?.url ?? '');
    await choose(page, /Engraved/);
    expect(await rootArt(page)).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('alice-demos:art'))).toBe('engraved');
  });

  test('the trial’s old pictures choice reads as engraved', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'baked'));
    await page.goto(index?.url ?? '');
    expect(await rootArt(page)).toBeNull();
    await expect(page.locator('.demos__art-choice[data-art-style="engraved"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBeNull();
    await expect
      .poll(() => page.locator('img.art__image--baked:visible').count(), { timeout: 10_000 })
      .toBeGreaterThan(1);
  });

  test('a dark ground gives every engraved figure a paper rim', async ({ page }) => {
    test.skip(!url('witnesses'), 'no witnesses page');
    await page.goto(url('witnesses'));
    await expect(page.locator('body')).toHaveAttribute('data-ground', 'dark');
    await expect(page.locator('.art-defs filter#art-rim')).toBeAttached();
    const filters = await page.evaluate(() =>
      [...document.querySelectorAll('.demo .art')].map((box) => {
        const drawing =
          box.querySelector(':scope > img.art__image--baked') ?? box.querySelector(':scope > svg');
        return drawing ? getComputedStyle(drawing).filter : '';
      }),
    );
    expect(filters.length).toBeGreaterThan(3);
    for (const filter of filters.filter((value) => value !== '')) {
      expect(filter).toContain('art-rim');
    }
  });

  test('a figure whose parts the demo moves comes as cut-outs that load', async ({ page }) => {
    test.skip(!url('croquet'), 'no croquet page');
    await page.goto(url('croquet'));
    const flamingo = page.locator('.cq__flamingo .art--cut');
    await expect(flamingo).toHaveCount(1);
    // The parts keep their classes, so the demo's transforms on them still apply.
    await expect(flamingo.locator('g.cq__flamingo-body > image')).toHaveCount(1);
    await expect(flamingo.locator('g.cq__flamingo-head > image')).toHaveCount(1);
    await expect(flamingo.locator('path')).toHaveCount(0);
    const loaded = await flamingo.locator('image').evaluateAll((images) =>
      Promise.all(
        images.map(
          (image) =>
            new Promise<boolean>((resolve) => {
              const probe = new Image();
              probe.onload = () => resolve(probe.naturalWidth > 0);
              probe.onerror = () => resolve(false);
              probe.src = (image as SVGImageElement).href.baseVal;
            }),
        ),
      ),
    );
    expect(loaded.length).toBeGreaterThanOrEqual(3);
    expect(loaded.every(Boolean)).toBe(true);
  });
});
