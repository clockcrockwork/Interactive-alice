import { expect, test } from '@playwright/test';
import { atCue, collectErrors } from '../demo-helpers.ts';

const selector = 'svg[data-generated-rig="flamingo"]';

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
      const head = rig.locator('.cq__flamingo-head');
      await expect(head).toHaveAttribute('data-rig-part', '');
      const origin = await head.evaluate((node) =>
        getComputedStyle(node)
          .transformOrigin.split(/\s+/)
          .map((value) => Number.parseFloat(value)),
      );
      expect(origin[0]).toBeCloseTo((650 * 300) / 1060, 2);
      expect(origin[1]).toBeCloseTo((310 * 420) / 1484, 2);
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
        parent.style.setProperty('--look-x', '0');
      });
      const pose = () =>
        head.evaluate((node: SVGUseElement) => {
          const matrix = new DOMMatrix(getComputedStyle(node).transform);
          const box = node.getBoundingClientRect();
          const rigBox = (node as SVGUseElement).ownerSVGElement?.getBoundingClientRect();
          if (!rigBox) throw new Error('head use has no rendered rig');
          return {
            rotation: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
            bounds: [box.left - rigBox.left, box.top - rigBox.top, box.width, box.height],
          };
        });
      await expect.poll(async () => (await pose()).rotation).toBeCloseTo(0, 2);
      const content = await pose();
      await page.locator('.cq__flamingo').evaluate((node) => {
        node.setAttribute('data-mood', 'sulking');
        (node as HTMLElement).style.setProperty('--mood', '0');
      });
      await expect.poll(async () => (await pose()).rotation).toBeCloseTo(52, 2);
      // The queried node is the visible <use>, so its geometry proves the paint
      // changed without hashing the moving story frame behind it.
      const sulking = await pose();
      expect(sulking.bounds).not.toEqual(content.bounds);
      await page.locator('.cq__flamingo').evaluate((node) => {
        node.setAttribute('data-mood', 'content');
        (node as HTMLElement).style.setProperty('--mood', '1');
      });
      await expect.poll(async () => (await pose()).rotation).toBeCloseTo(0, 2);
      await head.evaluate(async (node) => {
        await Promise.all(
          node.getAnimations().map((animation) => animation.finished.catch(() => {})),
        );
      });
      const restored = await pose();
      for (const [index, value] of restored.bounds.entries()) {
        expect(value).toBeCloseTo(content.bounds[index] ?? value, 2);
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const failedPart of ['body', 'head']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`a failed flamingo ${failedPart} keeps its visible fallback states: ${motion}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
      await page.route(new RegExp(`flamingo~${failedPart}\\.any\\.generated.*\\.webp`), (route) =>
        route.abort(),
      );
      await page.goto('/demos/croquet/');
      const rig = page.locator(selector);
      const flamingo = page.locator('.cq__flamingo');
      const fallbackHead = rig.locator('.cq__flamingo-head-fallback');
      await expect(rig).toHaveAttribute('data-rig-failed', '');
      await expect(rig).not.toHaveAttribute('data-rig-ready');
      for (const paint of await rig.locator('[data-rig-generated]').all()) {
        await expect(paint).toHaveCSS('display', 'none');
      }
      for (const fallback of await rig.locator('[data-rig-fallback]').all()) {
        await expect(fallback).not.toHaveCSS('display', 'none');
      }
      await expect(fallbackHead).toHaveCSS('transform-origin', '160px 130px');
      await expect(rig.locator('[data-flamingo-hands] path')).toHaveCount(2);
      await page.locator('.demo__motion').click();
      await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');

      const fallbackPose = () =>
        fallbackHead.evaluate((node) => {
          const matrix = new DOMMatrix(getComputedStyle(node).transform);
          const box = node.getBoundingClientRect();
          const rigBox = (node as SVGUseElement).ownerSVGElement?.getBoundingClientRect();
          if (!rigBox) throw new Error('fallback head has no rendered rig');
          return {
            rotation: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
            bounds: [box.left - rigBox.left, box.top - rigBox.top, box.width, box.height],
          };
        });

      await flamingo.evaluate((node) => {
        node.removeAttribute('data-looking');
        node.removeAttribute('data-puzzled');
        node.setAttribute('data-mood', 'content');
        (node as HTMLElement).style.setProperty('--mood', '1');
        (node as HTMLElement).style.setProperty('--look-x', '0');
      });
      await expect.poll(async () => (await fallbackPose()).rotation).toBeCloseTo(0, 1);
      const content = await fallbackPose();

      await flamingo.evaluate((node) => {
        node.removeAttribute('data-looking');
        node.removeAttribute('data-puzzled');
        node.setAttribute('data-mood', 'sulking');
        (node as HTMLElement).style.setProperty('--mood', '0');
      });
      await expect
        .poll(async () => (await fallbackPose()).rotation, { timeout: 2000 })
        .toBeCloseTo(motion === 'reduce' ? 150 : 134, 0);
      const sulking = await fallbackPose();
      expect(sulking.bounds).not.toEqual(content.bounds);

      await flamingo.evaluate((node) => {
        node.removeAttribute('data-looking');
        node.setAttribute('data-mood', 'content');
        node.setAttribute('data-puzzled', '');
        (node as HTMLElement).style.setProperty('--mood', '1');
        (node as HTMLElement).style.setProperty('--look-x', '0');
      });
      await expect.poll(async () => (await fallbackPose()).rotation).toBeCloseTo(150, 0);
      await flamingo.evaluate((node) => (node as HTMLElement).style.setProperty('--look-x', '14'));
      await expect
        .poll(async () => (await fallbackPose()).rotation, { timeout: 2000 })
        .toBeCloseTo(motion === 'reduce' ? 150 : 164, 0);
    });
  }
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
