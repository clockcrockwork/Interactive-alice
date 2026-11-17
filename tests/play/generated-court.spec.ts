import { expect, test } from '@playwright/test';
import { atCue, collectErrors, scrollTo } from '../demo-helpers.ts';

for (const locale of ['', 'ja/']) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    for (const variant of ['yellow', 'blue']) {
      test(`court illustration preserves the shared box: ${locale || 'en-simple'}, ${motion}, ${variant}`, async ({
        page,
      }) => {
        // Two full scene visits plus forward/reverse settled timeline checks.
        test.slow();
        const errors = collectErrors(page);
        const generatedRequests: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes('from-behind.yellow.generated'))
            generatedRequests.push(request.url());
        });
        await page.emulateMedia({ reducedMotion: motion });
        await page.addInitScript((alice) => {
          localStorage.setItem('alice-demos:alice', alice);
          localStorage.setItem('alice-demos:art', 'engraved');
        }, variant);
        let sharedSource = '';
        for (const scene of ['witnesses', 'trial']) {
          await page.goto(`/demos/${locale}${scene}/`);
          await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
          const figure = page.locator('.tr__alice > .art');
          if (variant === 'yellow') {
            await expect(figure).toHaveAttribute('data-generated', '');
            await expect(figure.locator('svg')).toHaveAttribute('viewBox', '0 0 120 220');
            const image = figure.locator('image');
            const source = (await image.getAttribute('href')) ?? '';
            expect(source).toContain('from-behind.yellow.generated');
            if (sharedSource) expect(source).toBe(sharedSource);
            sharedSource = source;
            expect(
              await page.evaluate(async (url) => {
                const image = new Image();
                image.src = url;
                await image.decode();
                return [image.naturalWidth, image.naturalHeight];
              }, source),
            ).toEqual([926, 1698]);
            const geometry = await image.evaluate((el) => {
              const n = (name: string) => Number(el.getAttribute(name));
              return {
                foot: n('y') + (n('height') * 1602) / 1698,
                ratio: n('width') / n('height'),
              };
            });
            expect(geometry.foot).toBeCloseTo(220, 6);
            expect(geometry.ratio).toBeCloseTo(926 / 1698, 6);
          } else {
            await expect(figure).not.toHaveAttribute('data-generated', '');
            await expect(figure.locator('svg')).toHaveCount(1);
            await expect(figure.locator('[fill="var(--alice-dress)"]').first()).toBeAttached();
            await expect(figure.locator('[fill="var(--alice-hair)"]').first()).toBeAttached();
          }
          // Exercise the existing whole-figure timeline forwards and backwards.
          await atCue(page, scene === 'witnesses' ? 'mile' : 'rise', 0.9);
          if (variant === 'yellow') {
            await expect(figure.locator('image[data-variant="yellow"]')).toBeVisible();
          } else {
            const original = figure.locator('img[data-variant="blue"]');
            await expect(original).toBeVisible();
            await expect(original).toHaveAttribute('src', /alice--from-behind\.blue/);
          }
          const before = await figure.evaluate((el) => el.getBoundingClientRect().height);
          expect(before).toBeGreaterThan(0);
          await scrollTo(page, 0.1);
          await atCue(page, scene === 'witnesses' ? 'mile' : 'rise', 0.9);
          const after = await figure.evaluate((el) => el.getBoundingClientRect().height);
          expect(after).toBeCloseTo(before, 0);
        }
        if (variant === 'blue') expect(generatedRequests).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  }
}

for (const style of ['flat', 'paper']) {
  test(`court retains the token-coloured drawing in ${style}`, async ({ page }) => {
    await page.addInitScript((art) => {
      localStorage.setItem('alice-demos:alice', 'yellow');
      localStorage.setItem('alice-demos:art', art);
    }, style);
    await page.goto('/demos/witnesses/');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    const figure = page.locator('.tr__alice > .art');
    await expect(figure).not.toHaveAttribute('data-generated', '');
    await expect(figure.locator('[fill="var(--alice-dress)"]').first()).toBeAttached();
    await expect(figure.locator('[fill="var(--alice-hair)"]').first()).toBeAttached();
  });
}
