import { expect, test } from '@playwright/test';
import { atCue, collectErrors, scrollTo } from '../demo-helpers.ts';

const stages = [
  ['tea-party', 'hatter', '.tp__hatter'],
  ['dormouse', 'dormouse', '.dm__mouse'],
  ['trial', 'queen-of-hearts', '.tr__throne--queen'],
  ['pig-and-pepper', 'cook', '.pp__cook'],
] as const;

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`generated live expressions retain their scene controls: ${locale || 'en'}, ${motion}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await page.emulateMedia({ reducedMotion: motion });
      await page.addInitScript(
        (alice) => {
          localStorage.setItem('alice-demos:art', 'engraved');
          localStorage.setItem('alice-demos:alice', alice);
        },
        locale ? 'blue' : 'yellow',
      );
      for (const [scene, id, parent] of stages) {
        await page.goto(`/demos/${locale}${scene}/`);
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
        const rig = page.locator(`${parent} svg[data-generated-rig="${id}"]`);
        await expect(rig).toHaveCount(1);
        await expect(rig).toHaveAttribute('data-rig-ready', '');
        await expect(rig).not.toHaveAttribute('data-rig-failed');
        await expect(rig.locator('[data-rig-fallback]').first()).toHaveCSS('display', 'none');
        await expect(rig.locator('[data-rig-generated]').first()).toHaveCSS('display', 'inline');
        const mapped = rig.locator('[data-rig-map]').first();
        if (await mapped.count()) await expect(mapped).not.toHaveCSS('transform', 'none');

        if (id === 'hatter') {
          const eyes = rig.locator('.tp__hatter-eyes ellipse');
          await expect(eyes).toHaveCount(2);
          for (const [wide, frown, ry] of [
            ['0', '0', '5px'],
            ['1', '0', '10px'],
            ['0', '1', '3px'],
          ]) {
            await page.locator(parent).evaluate(
              (el, values) => {
                (el as HTMLElement).style.setProperty('--wide', values[0] ?? '0');
                (el as HTMLElement).style.setProperty('--frown', values[1] ?? '0');
              },
              [wide, frown],
            );
            await expect(eyes.first()).toHaveCSS('ry', ry ?? '5px');
          }
          await expect(page.locator('.tp__frown [data-live-frown-map="brows"]')).not.toHaveCSS(
            'transform',
            'none',
          );
        }
        if (id === 'dormouse') {
          for (const [awake, open, shut] of [
            ['0', '0', '1'],
            ['1', '1', '0'],
          ]) {
            await page.locator(parent).evaluate((el, value) => {
              (el as HTMLElement).style.setProperty('--awake', value ?? '0');
            }, awake);
            await expect(rig.locator('.dm__eye-open')).toHaveCSS('opacity', open ?? '0');
            await expect(rig.locator('.dm__eye-shut')).toHaveCSS('opacity', shut ?? '1');
          }
          await expect(rig.locator('.dm__zzz')).toHaveCount(3);
        }
        if (id === 'queen-of-hearts') {
          await atCue(page, 'head', 0.5);
          await expect(rig.locator('.tr__queen-mouth')).toHaveAttribute('d', 'M62 84 q18 22 36 0');
          await scrollTo(page, 0);
          await expect(rig.locator('.tr__queen-mouth')).toHaveAttribute('d', 'M66 86 q14 -8 28 0');
          await atCue(page, 'head', 0.5);
          await expect(rig.locator('.tr__queen-mouth')).toHaveAttribute('d', 'M62 84 q18 22 36 0');
        }
        if (id === 'cook') {
          const arm = rig.locator('.pp__cook-arm');
          await expect(arm).toHaveCSS('transform-box', 'view-box');
          await expect(arm).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'pp-stir');
          await page.locator(parent).evaluate((el) => el.setAttribute('data-throwing', ''));
          await expect(arm).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'pp-throw');
          await page.locator('.demo').evaluate((el) => el.setAttribute('data-paused', ''));
          if (motion !== 'reduce') await expect(arm).toHaveCSS('animation-play-state', 'paused');
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

test('generated Hatter still lifts only his hat in the witness scene', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
  await page.goto('/demos/witnesses/');
  const rig = page.locator('svg[data-generated-rig="hatter"]');
  await expect(rig).toHaveAttribute('data-rig-ready', '');
  const hat = rig.locator('.hatter__hat');
  await expect(hat).toHaveCount(1);
  await atCue(page, 'hat', 0.45);
  expect(await hat.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f)).toBeCloseTo(
    -9,
    1,
  );
  await atCue(page, 'hat', 0.95);
  expect(await hat.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f)).toBeCloseTo(
    0,
    1,
  );
});

for (const [scene, id, failedPart] of [
  ['tea-party', 'hatter', 'hatter~hat'],
  ['trial', 'queen-of-hearts', 'queen-of-hearts~base'],
  ['pig-and-pepper', 'cook', 'cook~arm'],
] as const) {
  test(`a failed ${failedPart} keeps the entire original figure, not a neutral plate`, async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
    await page.route(new RegExp(`${failedPart}\\.any\\.generated.*\\.webp`), (route) =>
      route.abort(),
    );
    await page.goto(`/demos/${scene}/`);
    const rig = page.locator(`svg[data-generated-rig="${id}"]`).first();
    await expect(rig).toHaveAttribute('data-rig-failed', '');
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    for (const generated of await rig.locator('[data-rig-generated]').all()) {
      await expect(generated).toHaveCSS('display', 'none');
    }
    await expect(rig.locator('[data-rig-fallback]').first()).not.toHaveCSS('display', 'none');
    const map = rig.locator('[data-rig-map]').first();
    if (await map.count()) await expect(map).toHaveCSS('transform', 'none');
    if (id === 'cook')
      await expect(rig.locator('.pp__cook-arm')).toHaveCSS('transform-box', 'fill-box');
  });
}
