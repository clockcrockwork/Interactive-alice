/** Prepared browser contracts. This checkpoint does not claim browser execution. */
import { expect, test } from '@playwright/test';

const scenes = [
  { name: 'rabbit-hole', rig: 'bat', part: '.rh__wing', animation: 'rh-flap', asset: 'bat' },
  { name: 'tea-party', rig: 'bat', part: '.rh__wing', animation: 'tp-flap', asset: 'bat' },
  {
    name: 'riverbank',
    rig: 'diving-rabbit',
    part: '[data-part^="foot"]',
    animation: 'generated-diving-kick',
    asset: 'white-rabbit',
  },
];

for (const scene of scenes) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`generated ${scene.rig}: ${scene.name}, ${motion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
      await page.goto(`/demos/${scene.name}/`);
      const rigs = page.locator(`svg[data-generated-rig="${scene.rig}"]`);
      const rig = rigs.first();
      await expect(rig).toHaveAttribute('data-rig-ready', '');
      await expect(rig.locator(scene.part)).toHaveCount(2);
      for (const paint of await rig.locator('[data-rig-generated]').all()) {
        await expect(paint).toHaveCSS('display', 'inline');
      }
      for (const fallback of await rig.locator('[data-rig-fallback]').all()) {
        await expect(fallback).toHaveCSS('display', 'none');
      }
      const left = rig.locator(scene.part).nth(0);
      const right = rig.locator(scene.part).nth(1);
      await expect(left).toHaveCSS(
        'animation-name',
        motion === 'reduce' ? 'none' : scene.animation,
      );
      await expect(left).toHaveCSS('transform-box', 'view-box');
      const expectedOrigins =
        scene.name === 'rabbit-hole'
          ? [
              [50, 25],
              [50, 25],
            ]
          : scene.name === 'tea-party'
            ? [
                [49.3, 20.8],
                [50, 20.8],
              ]
            : [
                [22, 91.97221010748488],
                [78, 91.97221010748488],
              ];
      for (const [index, part] of [left, right].entries()) {
        const origin = await part.evaluate((node) =>
          getComputedStyle(node).transformOrigin.split(' ').map(Number.parseFloat),
        );
        expect(origin[0]).toBeCloseTo(expectedOrigins[index]?.[0] ?? 0, 3);
        expect(origin[1]).toBeCloseTo(expectedOrigins[index]?.[1] ?? 0, 3);
      }
      await page.locator('.demo__motion').click();
      await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
      if (motion !== 'reduce') {
        await expect(left).toHaveCSS('animation-play-state', 'paused');
        const held = await left.evaluate((node) => getComputedStyle(node).transform);
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        expect(await left.evaluate((node) => getComputedStyle(node).transform)).toBe(held);
      }
      if (scene.name === 'tea-party')
        await expect(page.locator('.tp__bat > .tp__tray')).toHaveCount(1);
      if (scene.name === 'riverbank')
        await expect(page.locator('.field__burrow')).toHaveCSS('overflow', 'hidden');
    });
  }

  const parts =
    scene.rig === 'bat'
      ? ['body', 'wing-left', 'wing-right']
      : ['diving-body', 'diving-foot-left', 'diving-foot-right'];
  for (const failed of parts) {
    test(`failed ${scene.name} ${failed} preserves complete original geometry`, async ({
      page,
    }) => {
      await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
      await page.route(`**/${scene.asset}~${failed}.any.generated*`, (route) => route.abort());
      await page.goto(`/demos/${scene.name}/`);
      const rig = page.locator(`svg[data-generated-rig="${scene.rig}"]`).first();
      await expect(rig).toHaveAttribute('data-rig-failed', '');
      await expect(rig).not.toHaveAttribute('data-rig-ready');
      await expect(rig.locator(scene.part)).toHaveCount(2);
      for (const paint of await rig.locator('[data-rig-generated]').all())
        await expect(paint).toHaveCSS('display', 'none');
      for (const fallback of await rig.locator('[data-rig-fallback]').all())
        await expect(fallback).not.toHaveCSS('display', 'none');
      if (scene.name === 'riverbank') {
        for (const [index, part] of (await rig.locator(scene.part).all()).entries()) {
          const box = await part.evaluate((node) => {
            const b = (node as SVGGraphicsElement).getBBox();
            return { x: b.x, y: b.y, width: b.width, height: b.height };
          });
          expect(box.x + box.width / 2).toBeCloseTo(index === 0 ? 22 : 78, 3);
          expect(box.y + box.height * 0.9).toBeCloseTo(91.97221010748488, 3);
          expect(box.height * 0.04).toBeCloseTo(1.1972210107484877, 3);
        }
      }
    });
  }

  test(`delayed ${scene.name} layer does not partially reveal`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/${scene.asset}~${parts[0]}.any.generated*`, async (route) => {
      await held;
      await route.continue();
    });
    await page.goto(`/demos/${scene.name}/`, { waitUntil: 'domcontentloaded' });
    const rig = page.locator(`svg[data-generated-rig="${scene.rig}"]`).first();
    await expect(rig).toBeAttached();
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    for (const paint of await rig.locator('[data-rig-generated]').all())
      await expect(paint).toHaveCSS('display', 'none');
    release();
    await expect(rig).toHaveAttribute('data-rig-ready', '');
  });
}
