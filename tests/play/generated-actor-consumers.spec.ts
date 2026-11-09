import { expect, type Locator, type Page, test } from '@playwright/test';
import { atCue, collectErrors, press } from '../demo-helpers.ts';

const consumers = [
  ['witnesses', '.wt__lizard', 'bill', 'bill~head.any.generated', 2],
  ['duchess', '.dc__landing .mt__gryphon', 'gryphon', 'gryphon~foreleg-far.shore.generated', 3],
  [
    'trial',
    '.tr__ghost[data-kind="rabbit"]',
    'white-rabbit/running',
    'white-rabbit--running.any.generated',
    1,
  ],
  ['trial', '.tr__ghost[data-kind="gryphon"]', 'gryphon', 'gryphon~whole.shore.generated', 1],
  ['trial', '.tr__ghost[data-kind="turtle"]', 'mock-turtle', 'mock-turtle~whole.any.generated', 1],
] as const;

async function engraved(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
}

async function ready(rig: Locator, images: number): Promise<void> {
  await expect(rig).toHaveCount(1);
  await expect(rig).toHaveAttribute('data-rig-ready', '');
  await expect(rig.locator('[data-rig-image]')).toHaveCount(images);
  await expect(rig).not.toHaveAttribute('data-rig-failed');
  for (const fallback of await rig.locator('[data-rig-fallback]').all())
    await expect(fallback).toHaveCSS('display', 'none');
  for (const generated of await rig.locator('[data-rig-generated]').all())
    await expect(generated).toHaveCSS('display', 'inline');
}

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`Witnesses generated Bill keeps righting, replay and pause: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: motion });
      await engraved(page);
      await page.goto(`/demos/${locale}witnesses/`);
      const lizard = page.locator('.wt__lizard');
      const art = lizard.locator('.art');
      await ready(lizard.locator('svg[data-generated-rig="bill"]'), 2);
      await atCue(page, 'lizard', 0.2);
      await expect(lizard).toHaveAttribute('data-upside-down', '');
      await expect(art).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'wt-wave');
      expect(
        await art.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
      ).toBeLessThan(-0.95);
      await press(page, page.locator('.demo__motion'));
      await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
      if (motion !== 'reduce') await expect(art).toHaveCSS('animation-play-state', 'paused');
      await press(page, page.locator('.wt__prop-put-back'));
      await expect(lizard).toHaveAttribute('data-right', '');
      await expect(lizard).not.toHaveAttribute('data-upside-down');
      await atCue(page, 'pardon', 0.1);
      await atCue(page, 'lizard', 0.2);
      await expect(lizard).toHaveAttribute('data-upside-down', '');
      await atCue(page, 'lizard', 0.9);
      await expect(lizard).toHaveAttribute('data-right', '');
      expect(errors).toEqual([]);
    });

    test(`Duchess landing reuses the chapter's neutral sleeping Gryphon: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: motion });
      await engraved(page);
      await page.goto(`/demos/${locale}duchess/`);
      const gryphon = page.locator('.dc__landing .mt__gryphon');
      await ready(gryphon.locator('svg[data-generated-rig="gryphon"]'), 3);
      await expect(gryphon.locator('.mt__paws')).toHaveCount(0);
      const parts = gryphon.locator('[data-gryphon-part]');
      await expect(parts).toHaveCount(2);
      for (const part of await parts.all()) await expect(part).toHaveCSS('transform', 'none');
      expect(
        await gryphon.evaluate((el) => getComputedStyle(el).getPropertyValue('--sleep').trim()),
      ).toBe('1');
      const transform = await gryphon.evaluate((el) => getComputedStyle(el).transform);
      await atCue(page, 'turtle', 0.9);
      expect(await gryphon.evaluate((el) => getComputedStyle(el).transform)).toBe(transform);
      expect(errors).toEqual([]);
    });

    test(`Trial generated ghosts retain tears, drift, eyes and reversal: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: motion });
      await engraved(page);
      await page.goto(`/demos/${locale}trial/`);
      for (const [scene, parent, id] of consumers) {
        if (scene === 'trial')
          await ready(page.locator(`${parent} svg[data-generated-rig="${id}"]`), 1);
      }
      const ghosts = page.locator('.tr__ghost').filter({
        has: page.locator(
          'svg[data-generated-rig="white-rabbit/running"], svg[data-generated-rig="gryphon"], svg[data-generated-rig="mock-turtle"]',
        ),
      });
      await expect(ghosts).toHaveCount(3);
      const tears = page.locator('.tr__ghost[data-kind="turtle"] .lq__tear');
      await expect(tears).toHaveCount(2);
      for (const tear of await tears.all()) {
        await expect(tear).toHaveCSS('opacity', '1');
        await expect(tear).toHaveCSS('animation-name', 'none');
      }
      await atCue(page, 'sounds-three', 0.95);
      for (const ghost of await ghosts.all()) {
        await expect(ghost).toHaveAttribute('data-shown', '');
        await expect(ghost.locator('.tr__ghost-dream')).toHaveCSS('opacity', '0.75');
        await expect(ghost.locator('.tr__ghost-dream')).toHaveCSS(
          'animation-name',
          motion === 'reduce' ? 'none' : 'tr-drift',
        );
      }
      await press(page, page.locator('.demo__motion'));
      if (motion !== 'reduce') {
        for (const ghost of await ghosts.all())
          await expect(ghost.locator('.tr__ghost-dream')).toHaveCSS(
            'animation-play-state',
            'paused',
          );
      }
      await press(page, page.locator('.tr__prop-eyes'));
      for (const ghost of await ghosts.all())
        await expect(ghost.locator('.tr__ghost-dream')).toHaveCSS('opacity', '0');
      await press(page, page.locator('.tr__prop-eyes'));
      for (const ghost of await ghosts.all())
        await expect(ghost.locator('.tr__ghost-dream')).toHaveCSS('opacity', '0.75');
      await atCue(page, 'real-three', 0.9);
      for (const ghost of await ghosts.all()) await expect(ghost).toHaveAttribute('data-real', '');
      await atCue(page, 'sounds-three', 0.95);
      for (const ghost of await ghosts.all()) {
        await expect(ghost).not.toHaveAttribute('data-real');
        await expect(ghost.locator('.tr__ghost-dream')).toHaveCSS('opacity', '0.75');
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const [scene, parent, id, source, images] of consumers) {
  for (const outcome of ['delayed', 'failed'] as const) {
    test(`${scene} ${id} keeps the whole original while its source is ${outcome}`, async ({
      page,
    }) => {
      await engraved(page);
      let release = (): void => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(`**/${source}*.webp`, async (route) => {
        if (outcome === 'failed') await route.abort();
        else {
          await held;
          await route.continue();
        }
      });
      try {
        await page.goto(`/demos/${scene}/`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
        const rig = page.locator(`${parent} svg[data-generated-rig="${id}"]`);
        await expect(rig).toHaveCount(1);
        if (outcome === 'failed') await expect(rig).toHaveAttribute('data-rig-failed', '');
        await expect(rig).not.toHaveAttribute('data-rig-ready');
        for (const generated of await rig.locator('[data-rig-generated]').all())
          await expect(generated).toHaveCSS('display', 'none');
        await expect(rig.locator('[data-rig-fallback]').last()).not.toHaveCSS('display', 'none');
        for (const map of await rig.locator('[data-rig-map]').all())
          await expect(map).toHaveCSS('transform', 'none');
        if (outcome === 'delayed') {
          release();
          await ready(rig, images);
        }
      } finally {
        release();
      }
    });
  }
}
