/**
 * How the figures are drawn (docs/art-trials.md): engraved is the public default,
 * delivered as baked pictures that load and are cut out. Flat and cut paper remain
 * internal-only test modes; old visitor preferences do not change the public work. A
 * dark ground rims the figures; and a figure whose parts a demo moves comes as
 * cut-outs there.
 */

import { expect, type Page, test } from '@playwright/test';
import { demos } from '../demo-helpers.ts';

const url = (id: string) => demos.find((d) => d.demo === id)?.url ?? '';
const styleUrl = (id: string, style: 'flat' | 'paper') => `${url(id)}?qa-art=${style}`;

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
  test.skip(!url('duchess'), 'no demo pages in the build');

  test('engraved is the default, as baked pictures that load and are cut out', async ({ page }) => {
    const statuses = new Map<string, number>();
    page.on('response', (response) => {
      if (response.url().endsWith('.webp')) {
        statuses.set(response.url(), response.status());
      }
    });
    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBeNull();
    await expect(page.locator('.demos__art-choice, .demos__alice-choice')).toHaveCount(0);
    await expect(page.locator('.art-defs filter#art-engraved')).toBeAttached();
    const shown = page.locator('img.art__image--baked:visible');
    await expect.poll(() => shown.count(), { timeout: 10_000 }).toBeGreaterThan(1);
    // Public pages always use the yellow Alice, even if an old comparison preference exists.
    await expect(page.locator('.art[data-art="alice/falling"] svg')).toHaveAttribute(
      'data-duchess-variant',
      'yellow',
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

  test('flat and cut paper remain available to internal rendering checks', async ({ page }) => {
    await page.addInitScript(() => {
      const style = new URLSearchParams(location.search).get('qa-art');
      if (style === 'flat' || style === 'paper') localStorage.setItem('alice-demos:art', style);
    });
    await page.goto(styleUrl('duchess', 'flat'));
    expect(await rootArt(page)).toBe('flat');

    // Flat leaves a demo page as drawn: no filters, no pictures.
    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBe('flat');
    await expect(page.locator('.art').first()).toBeAttached();
    await expect(page.locator('.art-defs')).toHaveCount(0);
    await expect(page.locator('img.art__image--baked')).toHaveCount(0);

    await page.goto(styleUrl('duchess', 'paper'));
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
  });

  test('legacy art and Alice preferences remain usable in local QA', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('alice-demos:art', 'flat');
      localStorage.setItem('alice-demos:alice', 'blue');
    });
    await page.goto(url('duchess'));
    expect(await rootArt(page)).toBe('flat');
    await expect(page.locator('html')).toHaveAttribute('data-alice', 'blue');
    await expect(page.locator('.art[data-art="alice/falling"] svg')).toHaveCount(1);
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
    const rig = flamingo.locator('svg[data-generated-rig="flamingo"]');
    await expect(rig).toHaveAttribute('data-rig-ready', '');
    // The visible <use> instances reference cut-outs held in SVG definitions.
    const bodyHref = await rig.locator('g.cq__flamingo-body > use').getAttribute('href');
    const headHref = await rig
      .locator('g[data-flamingo-head-mounted] > use.cq__flamingo-head')
      .getAttribute('href');
    expect(bodyHref).toMatch(/^#art-flamingo-body-/);
    expect(headHref).toMatch(/^#art-flamingo-head-/);
    const bodyImage = rig.locator(`defs > g${bodyHref} image[data-rig-image]`);
    const headImage = rig.locator(`defs > g${headHref} image[data-rig-image]`);
    await expect(bodyImage).toHaveCount(1);
    await expect(headImage).toHaveCount(1);
    // The shared SVG keeps its engraved contour paths beneath the generated cut-outs.
    const images = rig.locator('image[data-rig-image]');
    await expect(images).toHaveCount(2);
    const loaded = await images.evaluateAll((nodes) =>
      Promise.all(
        nodes.map(
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
    // Provenance and the runtime mapping each declare exactly body and head.
    expect(loaded).toHaveLength(2);
    expect(loaded.every(Boolean)).toBe(true);
  });
});
