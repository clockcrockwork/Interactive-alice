/** Browser contracts prepared for the generated rig; not executed in this checkpoint. */
import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { atCue, collectErrors } from '../demo-helpers.ts';

const selector = 'svg[data-generated-rig="flamingo"]';
const digest = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`generated flamingo keeps visible mood and pause states: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: motion });
      await page.addInitScript(
        (alice) => {
          localStorage.setItem('alice-demos:art', 'engraved');
          localStorage.setItem('alice-demos:alice', alice);
        },
        locale ? 'blue' : 'yellow',
      );
      await page.goto(`/demos/${locale}croquet/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      const rig = page.locator(selector);
      await expect(rig).toHaveAttribute('data-rig-ready', '');
      await expect(rig.locator('.cq__flamingo-head')).toHaveCount(1);
      await expect(rig.locator('.cq__flamingo-body')).toHaveCount(1);
      await expect(rig.locator('[data-flamingo-hands] path')).toHaveCount(2);
      for (const fallback of await rig.locator('[data-rig-fallback]').all()) {
        await expect(fallback).toHaveCSS('display', 'none');
      }
      await atCue(page, 'flamingo', 0.5);
      await page.locator('.demo__motion').click();
      await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
      const body = rig.locator('.cq__flamingo-body');
      await expect(body).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'cq-breathe');
      if (motion !== 'reduce') await expect(body).toHaveCSS('animation-play-state', 'paused');
      await page.locator('.cq__flamingo').evaluate((node) => {
        const parent = node as HTMLElement;
        parent.removeAttribute('data-looking');
        parent.removeAttribute('data-puzzled');
        parent.setAttribute('data-mood', 'content');
        parent.style.setProperty('--mood', '1');
        parent.style.setProperty('--nod', '0');
        const head = parent.querySelector<SVGElement>('.cq__flamingo-head');
        if (head) {
          head.style.setProperty('--look-x', '0');
        }
      });
      const head = rig.locator('.cq__flamingo-head');
      const rotation = () =>
        head.evaluate((node) => {
          const matrix = new DOMMatrix(getComputedStyle(node).transform);
          return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
        });
      await expect.poll(rotation).toBeCloseTo(0, 2);
      const content = digest(await rig.screenshot());
      await page.locator('.cq__flamingo').evaluate((node) => {
        node.setAttribute('data-mood', 'sulking');
        (node as HTMLElement).style.setProperty('--mood', '0');
      });
      await expect.poll(rotation).toBeCloseTo(52, 2);
      // Checking the source node alone cannot prove that <use> painted the change.
      const sulking = digest(await rig.screenshot());
      expect(sulking).not.toBe(content);
      await page.locator('.cq__flamingo').evaluate((node) => {
        node.setAttribute('data-mood', 'content');
        (node as HTMLElement).style.setProperty('--mood', '1');
      });
      await expect.poll(rotation).toBeCloseTo(0, 2);
      await expect.poll(async () => digest(await rig.screenshot())).toBe(content);
      expect(errors).toEqual([]);
    });
  }
}

for (const failedPart of ['body', 'head']) {
  test(`a failed flamingo ${failedPart} leaves the full original bird and hands`, async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
    await page.route(new RegExp(`flamingo~${failedPart}\\.any\\.generated.*\\.webp`), (route) =>
      route.abort(),
    );
    await page.goto('/demos/croquet/');
    const rig = page.locator(selector);
    await expect(rig).toHaveAttribute('data-rig-failed', '');
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    for (const paint of await rig.locator('[data-rig-generated]').all()) {
      await expect(paint).toHaveCSS('display', 'none');
    }
    for (const fallback of await rig.locator('[data-rig-fallback]').all()) {
      await expect(fallback).not.toHaveCSS('display', 'none');
    }
    await expect(rig.locator('.cq__flamingo-head')).toHaveCSS('transform-origin', '160px 130px');
    await expect(rig.locator('[data-flamingo-hands] path')).toHaveCount(2);
  });
}

test('one late flamingo layer never reveals a partial bird', async ({ page }) => {
  let release = (): void => {};
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
  await page.route(/flamingo~head\.any\.generated.*\.webp/, async (route) => {
    await blocked;
    await route.continue();
  });
  try {
    await page.goto('/demos/croquet/', { waitUntil: 'domcontentloaded' });
    const rig = page.locator(selector);
    await expect(rig).toHaveCount(1);
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    for (const paint of await rig.locator('[data-rig-generated]').all()) {
      await expect(paint).toHaveCSS('display', 'none');
    }
    release();
    await expect(rig).toHaveAttribute('data-rig-ready', '');
    await expect(rig.locator('[data-flamingo-head-original]').locator('..')).toHaveCSS(
      'display',
      'none',
    );
    await expect(rig.locator('[data-flamingo-head-mounted]').locator('..')).toHaveCSS(
      'display',
      'inline',
    );
  } finally {
    release();
  }
});
