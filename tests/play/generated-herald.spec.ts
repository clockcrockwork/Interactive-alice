import { expect, test } from '@playwright/test';
import { atCue, collectErrors, scrollTo } from '../demo-helpers.ts';

for (const locale of ['', 'ja/']) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    for (const variant of ['yellow', 'blue']) {
      test(`herald candidate keeps its shared box and motion: ${locale || 'en-simple'}, ${motion}, ${variant}`, async ({
        page,
      }) => {
        test.slow();
        const errors = collectErrors(page);
        await page.emulateMedia({ reducedMotion: motion });
        await page.addInitScript((alice) => {
          localStorage.setItem('alice-demos:alice', alice);
          localStorage.setItem('alice-demos:art', 'engraved');
        }, variant);
        let sharedSource = '';
        for (const scene of ['witnesses', 'trial', 'croquet']) {
          await page.goto(`/demos/${locale}${scene}/`);
          await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
          const figure = page.locator('[data-art="white-rabbit/herald"]');
          await expect(figure).toHaveCount(1);
          await expect(figure).toHaveAttribute('data-generated', '');
          await expect(figure.locator('svg')).toHaveAttribute('viewBox', '0 0 140 220');
          const image = figure.locator('image');
          await expect(image).toHaveAttribute('data-variant', 'any');
          const source = (await image.getAttribute('href')) ?? '';
          expect(source).toContain('white-rabbit--herald.any.generated');
          if (sharedSource) expect(source).toBe(sharedSource);
          sharedSource = source;
          expect(
            await page.evaluate(async (url) => {
              const image = new Image();
              image.src = url;
              await image.decode();
              return [image.naturalWidth, image.naturalHeight];
            }, source),
          ).toEqual([1001, 1572]);
          const geometry = await image.evaluate((el) => {
            const n = (name: string) => Number(el.getAttribute(name));
            return { foot: n('y') + (n('height') * 1515) / 1572, ratio: n('width') / n('height') };
          });
          expect(geometry.foot).toBeCloseTo(220, 6);
          expect(geometry.ratio).toBeCloseTo(1001 / 1572, 6);
          await expect(figure.locator('svg')).toHaveCSS('overflow', 'visible');
          await expect(figure).toHaveCSS('overflow', 'visible');
          await expect(figure.locator('..')).toHaveCSS('overflow', 'visible');
          const cue = scene === 'witnesses' ? 'called' : scene === 'trial' ? 'rise' : 'courtiers';
          await atCue(page, cue, 0.45);
          await expect(image).toBeVisible();
          const box = await figure.evaluate((el) => [el.clientWidth, el.clientHeight]);
          expect(box[0]).toBeGreaterThan(0);
          expect(box[1]).toBeGreaterThan(0);
          if (scene === 'witnesses') {
            await expect(page.locator('.tr__herald')).toHaveAttribute('data-fumbling', '');
            await expect(figure).toHaveCSS(
              'animation-name',
              motion === 'reduce' ? 'none' : 'wt-fumble',
            );
            const origin = await figure.evaluate((el) => ({
              origin: getComputedStyle(el).transformOrigin,
              height: el.clientHeight,
            }));
            expect(Number(origin.origin.split(' ')[1]?.replace('px', ''))).toBeCloseTo(
              origin.height,
              0,
            );
          }
          if (scene === 'croquet') {
            await expect(page.locator('.cq__ground')).toHaveAttribute('data-marching', '');
            await expect(figure).toHaveCSS(
              'animation-name',
              motion === 'reduce' ? 'none' : 'cq-step',
            );
          }
          await scrollTo(page, 0.05);
          await atCue(page, cue, 0.45);
          expect(await figure.evaluate((el) => [el.clientWidth, el.clientHeight])).toEqual(box);
          await expect(image).toHaveAttribute('href', source);
          if (scene === 'witnesses') {
            await expect(page.locator('.tr__herald')).toHaveAttribute('data-fumbling', '');
            await expect(figure).toHaveCSS(
              'animation-name',
              motion === 'reduce' ? 'none' : 'wt-fumble',
            );
          }
          if (scene === 'croquet') {
            await expect(page.locator('.cq__ground')).toHaveAttribute('data-marching', '');
            await expect(figure).toHaveCSS(
              'animation-name',
              motion === 'reduce' ? 'none' : 'cq-step',
            );
          }
        }
        expect(errors).toEqual([]);
      });
    }
  }
}

for (const style of ['flat', 'paper']) {
  test(`herald retains its vector in ${style} on all call sites`, async ({ page }) => {
    test.slow();
    const generatedRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('white-rabbit--herald.any.generated'))
        generatedRequests.push(request.url());
    });
    await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
    for (const scene of ['witnesses', 'trial', 'croquet']) {
      await page.goto(`/demos/${scene}/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      const figure = page.locator('[data-art="white-rabbit/herald"]');
      await expect(figure).not.toHaveAttribute('data-generated', '');
      await expect(figure.locator('[fill="var(--wonder-red)"]').first()).toBeAttached();
    }
    expect(generatedRequests).toEqual([]);
  });
}

for (const locale of ['', 'ja/']) {
  test(`index herald previews stay distinct while changing style: ${locale || 'en-simple'}`, async ({
    page,
  }) => {
    await page.goto(`/demos/${locale}`);
    const engraved = page.locator('.demos__art-figure[data-art-style="engraved"]');
    const image = engraved.locator('image');
    const source = (await image.getAttribute('href')) ?? '';
    expect(source).toContain('white-rabbit--herald.any.generated');
    expect(
      await page.evaluate(async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image.naturalWidth;
      }, source),
    ).toBe(1001);
    for (const style of ['flat', 'paper', 'engraved']) {
      await page.locator(`.demos__art-choice[data-art-style="${style}"]`).click();
      await expect(image).toBeVisible();
      for (const fallback of ['flat', 'paper']) {
        const preview = page.locator(`.demos__art-figure[data-art-style="${fallback}"]`);
        await expect(preview.locator('[data-generated]')).toHaveCount(0);
        await expect(preview.locator('svg')).toBeVisible();
      }
    }
  });
}
