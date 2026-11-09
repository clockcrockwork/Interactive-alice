import { expect, test } from '@playwright/test';

const props = [
  ['bill-the-lizard', 'hedge-clump', 1],
  ['caterpillar', 'mushroom-piece', 2],
  ['croquet', 'crown-cushion', 1],
] as const;
for (const [scene, name, count] of props) {
  test(`${name} decodes atomically and preserves its SVG box`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
    await page.goto(`/demos/${scene}/`);
    const rigs = page.locator(`svg[data-generated-rig="prop/${name}"]`);
    await expect(rigs).toHaveCount(count);
    for (const rig of await rigs.all()) {
      await expect(rig).toHaveAttribute('data-rig-ready', '');
      await expect(rig.locator('[data-rig-fallback]')).toHaveCSS('display', 'none');
      await expect(rig.locator('[data-rig-generated]')).toHaveCSS('display', 'inline');
      expect(await rig.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(0);
    }
    if (name === 'mushroom-piece') {
      await expect(page.locator('button.ct__bit')).toHaveCount(2);
      const left = page.locator('.ct__bit--left .ct__bit-piece svg');
      const right = page.locator('.ct__bit--right .ct__bit-piece svg');
      expect(await left.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(1);
      expect(await right.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(
        -1,
      );
    }
  });
  test(`${name} failed image leaves original visible`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('alice-demos:art', 'engraved'));
    await page.route(`**/*${name}*.webp`, (route) => route.abort());
    await page.goto(`/demos/${scene}/`);
    const rigs = page.locator(`svg[data-generated-rig="prop/${name}"]`);
    await expect(rigs).toHaveCount(count);
    for (const rig of await rigs.all()) {
      await expect(rig).toHaveAttribute('data-rig-failed', '');
      await expect(rig.locator('[data-rig-generated]')).toHaveCSS('display', 'none');
      await expect(rig.locator('[data-rig-fallback]')).not.toHaveCSS('display', 'none');
    }
  });
  for (const style of ['flat', 'paper']) {
    test(`${name} keeps ${style} source and does not request the generated prop`, async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes(name)) requests.push(request.url());
      });
      await page.addInitScript((value) => localStorage.setItem('alice-demos:art', value), style);
      await page.goto(`/demos/${scene}/`);
      await expect(page.locator(`svg[data-generated-rig="prop/${name}"]`)).toHaveCount(0);
      expect(requests).toEqual([]);
    });
  }
}
