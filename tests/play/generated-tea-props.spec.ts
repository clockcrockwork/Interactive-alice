import { expect, type Locator, type Page, test } from '@playwright/test';
import { atCue, collectErrors, customProperty, settled } from '../demo-helpers.ts';

const visit = async (
  page: Page,
  scene: string,
  locale: string,
  motion: 'reduce' | 'no-preference',
) => {
  await page.emulateMedia({ reducedMotion: motion });
  await page.addInitScript(
    (alice) => {
      localStorage.setItem('alice-demos:art', 'engraved');
      localStorage.setItem('alice-demos:alice', alice);
    },
    locale ? 'blue' : 'yellow',
  );
  await page.goto(`/demos/${locale}${scene}/`);
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
};

const cue = async (page: Page, name: string, within = 0.5) => {
  await expect(page.locator(`.demo__stage .demo-beat[data-cue="${name}"]`)).toHaveCount(1);
  await atCue(page, name, within);
};

const image = async (wrapper: Locator, id: string, width: number, height: number) => {
  const svg = wrapper.locator(':scope > svg');
  await expect(svg).toHaveAttribute(`data-generated-${id}`, '');
  await expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
  const picture = svg.locator(':scope > image');
  await expect(picture).toHaveCount(1);
  await expect(picture).toHaveAttribute('href', new RegExp(`${id}\\.any\\.generated`));
  await expect(picture).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  const pixels = await picture.evaluate(async (el) => {
    const source = new Image();
    source.src = el.getAttribute('href') ?? '';
    await source.decode();
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas context');
    ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    let solid = 0;
    let bottom = 0;
    for (let p = 3; p < data.length; p += 4) {
      const alpha = data[p] ?? 0;
      if (alpha === 0) clear++;
      if (alpha >= 240) solid++;
      if (alpha > 32) bottom = Math.floor((p - 3) / 4 / canvas.width) + 1;
    }
    const placed = el as SVGImageElement;
    const width = placed.width.baseVal.value;
    const height = placed.height.baseVal.value;
    const scale = Math.min(width / source.naturalWidth, height / source.naturalHeight);
    const top = placed.y.baseVal.value + (height - source.naturalHeight * scale) / 2;
    return {
      clear,
      solid,
      total: canvas.width * canvas.height,
      logicalBottom: top + bottom * scale,
    };
  });
  expect(pixels.clear / pixels.total).toBeGreaterThan(0.45);
  expect(pixels.solid / pixels.total).toBeGreaterThan(0.2);
  const box = await svg.evaluate((el) => {
    const css = getComputedStyle(el);
    return { width: Number.parseFloat(css.width), height: Number.parseFloat(css.height) };
  });
  expect(box.width / box.height).toBeCloseTo(width / height, 2);
  return pixels;
};

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    const context = `${locale || 'en/'} ${motion}`;
    test(`generated riddle keeps centred boxes, swaps and pointer drag: ${context}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, 'tea-party', locale, motion);
      const raven = page.locator('.tp__raven');
      const desk = page.locator('.tp__desk');
      await image(raven, 'raven', 240, 200);
      await image(desk, 'desk', 240, 200);
      await expect(raven.locator('image')).toHaveAttribute('y', '20');
      await expect(raven.locator('image')).toHaveAttribute('height', '160');
      for (const prop of [raven, desk]) {
        const pivot = await prop.evaluate((el) => {
          const css = getComputedStyle(el);
          return {
            origin: css.transformOrigin.split(' ').map(Number.parseFloat),
            w: Number.parseFloat(css.width),
            h: Number.parseFloat(css.height),
          };
        });
        expect(pivot.origin[0]).toBeCloseTo(pivot.w / 2, 2);
        expect(pivot.origin[1]).toBeCloseTo(pivot.h / 2, 2);
      }
      await cue(page, 'mean', 0.9);
      const storySwap = await customProperty(page, '.tp__riddle', '--swap');
      await page.locator('.tp__prop-riddle').click();
      await expect.poll(() => customProperty(page, '.tp__riddle', '--play')).toBe(1);
      const a = await raven.boundingBox();
      const b = await desk.boundingBox();
      if (!a || !b) throw new Error('missing riddle boxes');
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
      await page.mouse.up();
      await expect.poll(() => customProperty(page, '.tp__riddle', '--play')).toBe(0);
      await cue(page, 'watch', 0.5);
      await expect(page.locator('.tp__prop-riddle')).toBeHidden();
      await cue(page, 'mean', 0.9);
      expect(await customProperty(page, '.tp__riddle', '--swap')).toBeCloseTo(storySwap, 2);
      expect(errors).toEqual([]);
    });

    test(`generated fan keeps bottom pivot, wave action and reverse reset: ${context}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, 'pool-of-tears', locale, motion);
      const fan = page.locator('.pt__fan');
      await image(fan, 'fan', 200, 160);
      await expect(fan.locator('image')).toHaveAttribute('y', '1.8');
      const pivot = await fan.evaluate((el) => {
        const css = getComputedStyle(el);
        return {
          origin: css.transformOrigin.split(' ').map(Number.parseFloat),
          w: Number.parseFloat(css.width),
          h: Number.parseFloat(css.height),
        };
      });
      expect(pivot.origin[0]).toBeCloseTo(pivot.w / 2, 2);
      expect(pivot.origin[1]).toBeCloseTo(pivot.h, 2);
      await cue(page, 'fan', 0.4);
      await expect(fan).toHaveAttribute('data-fannable', '');
      await page.locator('.pt__prop--fan').click();
      await fan.dispatchEvent('click');
      await expect.poll(() => customProperty(page, '.pt__sea', '--fanned')).toBe(2);
      if (motion === 'reduce') await expect(fan).toHaveCSS('animation-name', 'none');
      await cue(page, 'rabbit', 0.5);
      await expect
        .poll(() => customProperty(page, '.pt__sea', '--fanned'), { timeout: 8000 })
        .toBe(0);
      await cue(page, 'fan', 0.4);
      await expect(fan).toHaveAttribute('data-fannable', '');
      expect(errors).toEqual([]);
    });

    test(`generated tureen keeps body height, independent steam and reverse entrance: ${context}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, 'lobster-quadrille', locale, motion);
      const tureen = page.locator('.lq__tureen');
      const pixels = await image(tureen, 'tureen', 200, 140);
      for (const [name, value] of [
        ['x', '0'],
        ['y', '0'],
        ['width', '200'],
        ['height', '140'],
      ]) {
        if (name && value) await expect(tureen.locator('image')).toHaveAttribute(name, value);
      }
      const bottom = pixels.logicalBottom;
      expect(bottom).toBeGreaterThan(117);
      expect(bottom).toBeLessThan(122);
      await expect(tureen.locator('svg > ellipse')).toHaveCount(1);
      await expect(tureen.locator('svg > ellipse')).toHaveAttribute('cy', '120');
      await expect(tureen.locator('svg > .lq__steam')).toHaveCount(1);
      const steam = tureen.locator('.lq__steam path');
      await expect(steam).toHaveAttribute(
        'd',
        'M70 46 q-10 -16 0 -30 M100 42 q-10 -18 0 -34 M130 46 q-10 -16 0 -30',
      );
      await expect(steam).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'lq-steam');
      const opacity = () =>
        page.locator('.lq__soup').evaluate((el) => Number(getComputedStyle(el).opacity));
      await cue(page, 'soup', 0.8);
      await expect.poll(opacity).toBeGreaterThan(0.9);
      await cue(page, 'verse-one', 0.5);
      await expect.poll(opacity).toBeLessThan(0.1);
      await cue(page, 'soup', 0.8);
      await expect.poll(opacity).toBeGreaterThan(0.9);
      expect(errors).toEqual([]);
    });
  }
}

for (const style of ['flat', 'paper']) {
  test(`generated tea props keep original vectors without raster requests in ${style}`, async ({
    page,
  }) => {
    test.slow();
    const requests: string[] = [];
    page.on('request', (request) => {
      if (/(?:raven|desk|fan|tureen)\.any\.generated/.test(request.url()))
        requests.push(request.url());
    });
    await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
    for (const [scene, selectors] of [
      ['tea-party', ['.tp__raven', '.tp__desk']],
      ['pool-of-tears', ['.pt__fan']],
      ['lobster-quadrille', ['.lq__tureen']],
    ] as const) {
      await page.goto(`/demos/${style === 'paper' ? 'ja/' : ''}${scene}/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      await settled(page);
      for (const selector of selectors) {
        await expect(page.locator(`${selector} image, ${selector} img`)).toHaveCount(0);
        expect(await page.locator(`${selector} svg path`).count()).toBeGreaterThan(0);
      }
    }
    expect(requests).toEqual([]);
  });
}
