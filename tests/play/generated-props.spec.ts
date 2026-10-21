import { expect, type Locator, type Page, test } from '@playwright/test';
import { atCue, collectErrors, customProperty, settled } from '../demo-helpers.ts';

type Motion = 'reduce' | 'no-preference';

const visit = async (page: Page, scene: string, locale: string, motion: Motion) => {
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
  expect(await page.evaluate(() => window.__aliceDemo?.reduced())).toBe(motion === 'reduce');
};

const cue = async (page: Page, name: string, within = 0.5) => {
  // atCue deliberately uses real scrolling and the shell's settled() / seek() seam.
  await expect(page.locator(`.demo__stage .demo-beat[data-cue="${name}"]`)).toHaveCount(1);
  await atCue(page, name, within);
};

const layout = (element: Locator) =>
  element.evaluate((el) => {
    const style = getComputedStyle(el);
    return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) };
  });

const opacity = (element: Locator) =>
  element.evaluate((el) => Number(getComputedStyle(el).opacity));

/** Scene CSS dimensions before perspective, rotation or whole-card scaling. */
const responsiveWidth = async (
  element: Locator,
  minRem: number,
  vmin: number,
  maxRem: number,
  factor = 1,
) => {
  const expected = await element.evaluate(
    (_el, [min, viewport, max, multiplier]) => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      return (
        Math.min(
          max * rem,
          Math.max(min * rem, (Math.min(innerWidth, innerHeight) * viewport) / 100),
        ) * multiplier
      );
    },
    [minRem, vmin, maxRem, factor] as const,
  );
  expect((await layout(element)).width).toBeCloseTo(expected, 1);
};

const noPageOverflow = async (page: Page) => {
  const { width, available } = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    available: document.documentElement.clientWidth,
  }));
  expect(width).toBeLessThanOrEqual(available + 1);
};

/** Decode the delivered file, rather than treating an SVG <image> as a loaded <img>.
 * The alpha bounds are measured after delivery encoding: a one-logical-pixel
 * tolerance allows its resampled edge to differ from the source's measured foot. */
const cutout = async (figure: Locator, id: string, width: number, height: number) => {
  await expect(figure).toHaveAttribute('data-generated', '');
  await expect(figure).toHaveClass(/\bart--generated\b/);
  await expect(figure.locator(':scope > svg')).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
  await expect(figure.locator(':scope > svg')).toHaveCSS('overflow', 'visible');
  const image = figure.locator(':scope > svg > image');
  await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute('data-variant', 'any');
  await expect(image).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  const source = (await image.getAttribute('href')) ?? '';
  expect(source).toContain(`${id.replaceAll('/', '--')}.any.generated`);
  const measured = await image.evaluate(async (el) => {
    const raster = new Image();
    raster.src = el.getAttribute('href') ?? '';
    await raster.decode();
    const canvas = document.createElement('canvas');
    canvas.width = raster.naturalWidth;
    canvas.height = raster.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no canvas for decoded cut-out');
    context.drawImage(raster, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let bottom = -1;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 0) > 32) bottom = Math.floor(i / 4 / canvas.width);
      if (data[i] === 0) transparent += 1;
    }
    const n = (name: string) => Number(el.getAttribute(name));
    const scaleX = n('width') / canvas.width;
    const scaleY = n('height') / canvas.height;
    return {
      width: canvas.width,
      height: canvas.height,
      scaleX,
      scaleY,
      center: n('x') + n('width') / 2,
      foot: n('y') + bottom * scaleY,
      transparent,
    };
  });
  expect(measured.width).toBeGreaterThan(width);
  expect(measured.height).toBeGreaterThan(height);
  expect(measured.scaleX).toBeCloseTo(measured.scaleY, 8);
  expect(measured.center).toBeCloseTo(width / 2, 6);
  expect(Math.abs(measured.foot - height)).toBeLessThanOrEqual(1);
  expect(measured.transparent).toBeGreaterThan(0);
  const box = await layout(figure);
  expect(box.width).toBeGreaterThan(0);
  expect(box.width / box.height).toBeCloseTo(width / height, 2);
  return { image, source, box };
};

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    const context = `${locale || 'en-simple'}, ${motion}`;

    test(`generated lobster keeps one source, hand layers and whole-figure motion: ${context}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      const requests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('lobster.any.generated')) requests.push(request.url());
      });
      await visit(page, 'lobster-quadrille', locale, motion);
      const figures = page.locator('[data-art="lobster"]');
      const partner = page.locator('.lq__partner').first();
      const held = page.locator('.lq__lobster-held');
      const flying = page.locator('.lq__lobster-flying');
      const { source } = await cutout(held.locator(':scope > .art'), 'lobster', 160, 120);
      expect(await figures.count()).toBe((await page.locator('.lq__partner').count()) + 2);
      for (const figure of await figures.all()) {
        await expect(figure).toHaveAttribute('data-generated', '');
        await expect(figure.locator('svg')).toHaveAttribute('viewBox', '0 0 160 120');
        await expect(figure.locator('image')).toHaveAttribute('href', source);
      }
      expect(requests).toHaveLength(1);
      // The existing left / lobster / right paint order keeps fingers separate.
      expect(
        await page
          .locator('.lq__hands')
          .evaluate((el) => [...el.children].map((child) => child.className)),
      ).toEqual(['lq__hand lq__hand--left', 'lq__lobster-held', 'lq__hand lq__hand--right']);
      await expect(page.locator('.lq__hand [data-art^="alice/hand-"]')).toHaveCount(2);
      const heldBox = await layout(held);
      const flyingBox = await layout(flying);
      expect(heldBox).toEqual(flyingBox);
      expect(heldBox.width / heldBox.height).toBeCloseTo(4 / 3, 2);
      await responsiveWidth(held, 7, 22, 12);
      await responsiveWidth(partner, 4.5, 15, 9, 0.56);

      await cue(page, 'advance', motion === 'reduce' ? 0.5 : 0.62);
      const partnerArt = partner.locator(':scope > .art');
      await expect(partnerArt).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'lq-set');
      await expect.poll(() => opacity(partner)).toBeGreaterThan(0.95);
      await page.locator('.demo__motion').click();
      await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
      expect(await page.evaluate(() => window.__aliceDemo?.paused())).toBe(true);
      await expect(partnerArt).toHaveCSS('animation-play-state', 'paused');
      const paused = await partnerArt.evaluate((el) => getComputedStyle(el).transform);
      await page.waitForTimeout(150);
      expect(await partnerArt.evaluate((el) => getComputedStyle(el).transform)).toBe(paused);
      await page.locator('.demo__motion').click();

      if (motion === 'no-preference') {
        await cue(page, 'throw', 0.3);
        // Observe the real arc from before the click; slow frames cannot hide a
        // brief flying pose. No timeline or image transform is replaced by a test.
        const flight = await flying.evaluate(
          (el) =>
            new Promise<{
              shown: boolean;
              rotated: boolean;
              shrunk: boolean;
              whole: boolean;
            }>((resolve) => {
              const result = { shown: false, rotated: false, shrunk: false, whole: true };
              let timer = 0;
              const observer = new MutationObserver(() => {
                const style = getComputedStyle(el);
                const matrix = new DOMMatrixReadOnly(style.transform);
                result.shown ||= Number(style.opacity) > 0.5;
                result.rotated ||= Math.abs(matrix.b) > 0.1;
                result.shrunk ||= Math.hypot(matrix.a, matrix.b) < 0.9;
                const image = el.querySelector('image');
                result.whole &&= !!image && getComputedStyle(image).transform === 'none';
                if (result.shown && Number(style.opacity) < 0.01) finish();
              });
              const finish = () => {
                observer.disconnect();
                clearTimeout(timer);
                resolve(result);
              };
              observer.observe(el, { attributes: true, attributeFilter: ['style'] });
              timer = window.setTimeout(finish, 15_000);
              const button = document.querySelector<HTMLButtonElement>('.lq__prop--throw');
              if (!button) throw new Error('no throw button');
              button.click();
            }),
        );
        expect(flight).toEqual({ shown: true, rotated: true, shrunk: true, whole: true });
      } else {
        // Reduced motion settles at +0.7, where the story has already thrown.
        await cue(page, 'throw');
      }
      await expect(page.locator('.lq__ring')).toHaveAttribute('data-thrown', '');
      await expect(held).toHaveAttribute('data-gone', '');
      await cue(page, 'land', 0.8);
      await expect(held).toHaveAttribute('data-changed', '');
      await expect(held).not.toHaveAttribute('data-gone', '');
      expect(await held.evaluate((el) => getComputedStyle(el).filter)).toContain(
        'hue-rotate(40deg)',
      );
      // Reverse before the throw reconstructs the same held/partner artwork.
      await cue(page, 'advance', 0.97);
      await expect(page.locator('.lq__ring')).not.toHaveAttribute('data-thrown', '');
      await expect(held).not.toHaveAttribute('data-changed', '');
      await expect.poll(() => opacity(partner)).toBeGreaterThan(0.95);
      await expect(held.locator('image')).toHaveAttribute('href', source);
      expect(await layout(held)).toEqual(heldBox);
      await noPageOverflow(page);
      expect(errors).toEqual([]);
    });

    test(`generated crab keeps its grounded sideways entrance and reverse exit: ${context}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await visit(page, 'mock-turtle', locale, motion);
      const crab = page.locator('.mt__crab');
      const figure = crab.locator(':scope > .art');
      const { image, source, box } = await cutout(figure, 'crab', 200, 120);
      await responsiveWidth(crab, 5, 14, 8);
      const rest = await crab.evaluate(
        (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e,
      );
      await cue(page, 'grief', 0.8);
      expect(await customProperty(page, '.mt__crab', '--in')).toBeCloseTo(1, 3);
      await expect(crab).toHaveCSS('opacity', '1');
      const grounded = await crab.evaluate((el) => {
        const stage = document.querySelector('.demo__stage');
        const art = el.querySelector('.art');
        if (!stage || !art) throw new Error('missing crab stage or art');
        const stageBox = stage.getBoundingClientRect();
        return {
          bottom: art.getBoundingClientRect().bottom,
          baseline: stageBox.top + stageBox.height * 0.97,
          x: new DOMMatrixReadOnly(getComputedStyle(el).transform).e,
          distance: window.innerWidth * 0.46,
          origin: getComputedStyle(el).transformOrigin,
        };
      });
      expect(Math.abs(grounded.bottom - grounded.baseline)).toBeLessThan(1);
      expect(rest - grounded.x).toBeCloseTo(grounded.distance, 0);
      expect(grounded.origin).toBe('0px 0px');
      await expect(image).toHaveCSS('transform', 'none');
      await cue(page, 'hours', 0.8);
      await expect.poll(() => opacity(crab)).toBeLessThan(0.01);
      await cue(page, 'grief', 0.8);
      await expect(crab).toHaveCSS('opacity', '1');
      expect(await layout(figure)).toEqual(box);
      await cue(page, 'drawling', 0.8);
      await expect.poll(() => opacity(crab)).toBeLessThan(0.01);
      expect(
        await crab.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e),
      ).toBeCloseTo(rest, 1);
      await expect(image).toHaveAttribute('href', source);
      await noPageOverflow(page);
      expect(errors).toEqual([]);
    });

    test(`generated opened map retains its sheet size and all close paths: ${context}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      await visit(page, 'rabbit-hole', locale, motion);
      const map = page.locator('.rh__map');
      const sheet = map.locator('.rh__map-sheet');
      const svg = sheet.locator(':scope > svg');
      await expect(svg).toHaveAttribute('data-generated-map', '');
      await expect(svg).toHaveAttribute('viewBox', '0 0 400 300');
      const image = svg.locator('image');
      await expect(image).toHaveAttribute('width', '400');
      await expect(image).toHaveAttribute('height', '300');
      await expect(image).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
      expect(Number(await image.getAttribute('x'))).toBe(0);
      expect(Number(await image.getAttribute('y'))).toBe(0);
      const source = (await image.getAttribute('href')) ?? '';
      expect(source).toContain('wall-map.any.generated');
      const decoded = await svg.evaluate(async (el) => {
        const image = el.querySelector('image');
        const backing = el.querySelector('rect');
        if (!image || !backing) throw new Error('missing map image or paper backing');
        const raster = new Image();
        raster.src = image.getAttribute('href') ?? '';
        await raster.decode();
        const canvas = document.createElement('canvas');
        canvas.width = raster.naturalWidth;
        canvas.height = raster.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('no canvas for decoded map');
        context.drawImage(raster, 0, 0);
        // Rasterize the actual SVG composition with its computed paper colour.
        // Embedding the decoded raster avoids SVG-as-image external-resource rules.
        const clone = el.cloneNode(true) as SVGSVGElement;
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', '400');
        clone.setAttribute('height', '300');
        clone.querySelector('image')?.setAttribute('href', canvas.toDataURL());
        clone.querySelector('rect')?.setAttribute('fill', getComputedStyle(backing).fill);
        const composed = new Image();
        composed.src = `data:image/svg+xml,${encodeURIComponent(clone.outerHTML)}`;
        await composed.decode();
        canvas.width = 400;
        canvas.height = 300;
        context.drawImage(composed, 0, 0);
        const alpha = (x: number, y: number) => context.getImageData(x, y, 1, 1).data[3];
        return {
          width: raster.naturalWidth,
          height: raster.naturalHeight,
          corners: [
            alpha(0, 0),
            alpha(canvas.width - 1, 0),
            alpha(0, canvas.height - 1),
            alpha(canvas.width - 1, canvas.height - 1),
          ],
          paper: [0.2, 0.5, 0.8].flatMap((x) =>
            [0.2, 0.5, 0.8].map((y) =>
              alpha(Math.floor(canvas.width * x), Math.floor(canvas.height * y)),
            ),
          ),
        };
      });
      expect(decoded.width).toBeGreaterThan(400);
      expect(decoded.width / decoded.height).toBeCloseTo(4 / 3, 2);
      expect(decoded.corners).toEqual([0, 0, 0, 0]);
      for (const alpha of decoded.paper) expect(alpha).toBe(255);
      // Only the opened DOM sheet is replaced; no other layer borrows this file.
      expect(
        await page
          .locator('image')
          .evaluateAll(
            (images, url) => images.filter((el) => el.getAttribute('href') === url).length,
            source,
          ),
      ).toBe(1);
      await cue(page, 'jar');
      const open = async () => {
        await expect(page.locator('.rh__prop-map')).toHaveAttribute('data-shown', '');
        await page.locator('.rh__prop-map').click();
        await expect(map).toHaveAttribute('data-open', '');
        await expect(sheet).toHaveCSS('opacity', '1');
      };
      await open();
      const box = await layout(sheet);
      const expectedWidth = await page.evaluate(() =>
        Math.min(window.innerWidth * 0.84, window.innerHeight * 0.66),
      );
      expect(box.width).toBeCloseTo(expectedWidth, 1);
      expect(box.width / box.height).toBeCloseTo(4 / 3, 2);
      expect(await layout(svg)).toEqual(box);
      if (motion === 'reduce') await expect(sheet).toHaveCSS('transform', 'none');
      // Real pointer hit on the generated image bubbles to the original sheet.
      await sheet.click();
      await expect(map).not.toHaveAttribute('data-open', '');
      await open();
      await page.locator('.rh__prop-away').click();
      await expect(map).not.toHaveAttribute('data-open', '');
      await open();
      await cue(page, 'drop', 0.3);
      await expect(map).not.toHaveAttribute('data-open', '');
      await cue(page, 'jar');
      await open();
      await cue(page, 'flip');
      await expect(map).not.toHaveAttribute('data-open', '');
      await expect(image).toHaveAttribute('href', source);
      expect(await layout(sheet)).toEqual(box);
      await noPageOverflow(page);
      expect(errors).toEqual([]);
    });
  }

  test(`deferred mushroom retains its baked art and separate caterpillar: ${locale || 'en-simple'}`, async ({
    page,
  }) => {
    await visit(page, 'caterpillar', locale, 'reduce');
    const mushroom = page.locator('.ct__mushroom > [data-art="mushroom"]');
    await expect(mushroom).not.toHaveAttribute('data-generated', '');
    await expect(mushroom.locator(':scope > svg')).toHaveAttribute('viewBox', '0 0 400 320');
    const baked = mushroom.locator(':scope > img');
    await expect(baked).toHaveAttribute('src', /mushroom\.any(?:[-.]|$)/);
    expect(
      await baked.evaluate(async (el) => {
        await (el as HTMLImageElement).decode();
        return (el as HTMLImageElement).naturalWidth;
      }),
    ).toBeGreaterThan(0);
    await expect(
      page.locator('.ct__mushroom > .ct__caterpillar [data-art="caterpillar"]'),
    ).toHaveCount(1);
    await expect(page.locator('.ct__mushroom > .ct__caterpillar .ct__body')).toHaveCount(1);
    const box = await layout(mushroom);
    expect(box.width / box.height).toBeCloseTo(5 / 4, 2);
  });
}

for (const style of ['flat', 'paper']) {
  test(`new generated props retain their original vectors without fetching in ${style}`, async ({
    page,
  }) => {
    test.slow();
    const requests: string[] = [];
    page.on('request', (request) => {
      if (
        /(?:lobster|crab|mushroom|wall-map|conger-eel|march-hare)\.any\.generated/.test(
          request.url(),
        )
      )
        requests.push(request.url());
    });
    await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
    for (const [scene, selector, viewBox] of [
      ['lobster-quadrille', '[data-art="lobster"]', '0 0 160 120'],
      ['mock-turtle', '[data-art="crab"]', '0 0 200 120'],
      ['mock-turtle', '[data-art="conger-eel"]', '0 0 300 200'],
      ['tea-party', '[data-art="march-hare"]', '0 0 160 260'],
      ['caterpillar', '[data-art="mushroom"]', '0 0 400 320'],
      ['rabbit-hole', '.rh__map-sheet', '0 0 400 300'],
    ] as const) {
      await page.goto(`/demos/${style === 'paper' ? 'ja/' : ''}${scene}/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
      await settled(page);
      const figures = page.locator(selector);
      expect(await figures.count()).toBeGreaterThan(0);
      for (const figure of await figures.all()) {
        await expect(figure).not.toHaveAttribute('data-generated', '');
        await expect(figure.locator('[data-generated-map], image, img')).toHaveCount(0);
        await expect(figure.locator(':scope > svg')).toHaveAttribute('viewBox', viewBox);
        expect(await figure.locator('svg path').count()).toBeGreaterThan(0);
      }
    }
    expect(requests).toEqual([]);
  });
}

for (const locale of ['', 'ja/']) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    test(`whole-figure eel and hare preserve their scene boxes: ${locale || 'en-simple'} ${motion}`, async ({
      page,
    }) => {
      test.slow();
      const errors = collectErrors(page);
      for (const [scene, id, w, h] of [
        ['mock-turtle', 'conger-eel', 300, 200],
        ['tea-party', 'march-hare', 160, 260],
        ['witnesses', 'march-hare', 160, 260],
      ] as const) {
        await visit(page, scene, locale, motion);
        const figure = page.locator(`[data-art="${id}"]`);
        await cutout(figure, id, w, h);
        for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.5, 0]) {
          await page.evaluate((value) => window.__aliceDemo?.seek(value), progress);
          await settled(page);
          await expect(figure).toHaveAttribute('data-art', id);
          await expect(figure.locator('image')).toHaveCount(1);
        }
        await noPageOverflow(page);
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const locale of ['', 'ja/']) {
  for (const style of ['engraved', 'flat', 'paper'] as const) {
    test(`generated shore dancers retain whole-card motion and style fallback: ${locale || 'en-simple'} ${style}`, async ({
      page,
    }) => {
      await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
      const requests: string[] = [];
      page.on('request', (request) => {
        if (/dancer--.*[.]any[.]generated/.test(request.url())) requests.push(request.url());
      });
      await page.goto(`/demos/${locale}lobster-quadrille/`);
      await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
      for (const kind of ['seal', 'turtle', 'snail', 'porpoise', 'salmon', 'whiting']) {
        const figures = page.locator(`[data-art="dancer/${kind}"]`);
        expect(await figures.count()).toBeGreaterThan(0);
        for (const figure of await figures.all()) {
          if (style === 'engraved') await cutout(figure, `dancer/${kind}`, 140, 140);
          else {
            await expect(figure).not.toHaveAttribute('data-generated');
            await expect(figure.locator('image,img')).toHaveCount(0);
          }
        }
      }
      for (const progress of [0.25, 0.5, 0.75, 1, 0.5, 0]) {
        await page.evaluate((value) => window.__aliceDemo?.seek(value), progress);
        await settled(page);
      }
      await noPageOverflow(page);
      if (style !== 'engraved') expect(requests).toEqual([]);
    });
  }
}

for (const locale of ['', 'ja/']) {
  for (const style of ['engraved', 'flat', 'paper'] as const) {
    test(`new court and bank cutouts retain overlays and original styles: ${locale || 'en-simple'} ${style}`, async ({
      page,
    }) => {
      test.slow();
      await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
      const errors = collectErrors(page);
      for (const [scene, ids] of [
        [
          'trial',
          [
            ['king-of-hearts', 160, 240],
            ['knave-of-hearts', 140, 220],
            ['card-soldier', 120, 220],
          ],
        ],
        [
          'croquet',
          [
            ['card-arch', 200, 140],
            ['rose-tree', 320, 360],
          ],
        ],
        ['riverbank', [['alices-sister', 300, 200]]],
      ] as const) {
        await page.goto(`/demos/${locale}${scene}/`);
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', {
          timeout: 30_000,
        });
        await settled(page);
        for (const [id, w, h] of ids) {
          const figures = page.locator(`[data-art="${id}"]`);
          expect(await figures.count()).toBeGreaterThan(0);
          for (const figure of await figures.all()) {
            if (style === 'engraved') await cutout(figure, id, w, h);
            else {
              await expect(figure).not.toHaveAttribute('data-generated');
              await expect(figure.locator('image,img')).toHaveCount(0);
            }
          }
        }
        if (scene === 'riverbank') await expect(page.locator('.rb__book')).toHaveCount(1);
        if (scene === 'croquet') {
          const roses = page.locator('.cq__rose');
          await expect(roses).toHaveCount(10);
          await roses.first().evaluate((el) => (el as HTMLButtonElement).click());
          await expect(roses.first()).toHaveAttribute('aria-pressed', 'true');
        }
        for (const progress of [0, 0.5, 1, 0]) {
          await page.evaluate((value) => window.__aliceDemo?.seek(value), progress);
          await settled(page);
        }
        await noPageOverflow(page);
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const locale of ['', 'ja/']) {
  for (const style of ['engraved', 'flat', 'paper'] as const) {
    test(`generated runners keep animated groups and style fallback: ${locale || 'en-simple'} ${style}`, async ({
      page,
    }) => {
      test.slow();
      await page.addInitScript((art) => localStorage.setItem('alice-demos:art', art), style);
      for (const scene of ['caucus-race', 'mouse-tale']) {
        await page.goto(`/demos/${locale}${scene}/`);
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', {
          timeout: 30_000,
        });
        await settled(page);
        for (const kind of ['duck', 'eaglet', 'lory', 'mouse', 'crab', 'dodo', 'magpie']) {
          const figures = page.locator(`[data-art="runner/${kind}"]`);
          expect(await figures.count()).toBeGreaterThan(0);
          for (const figure of await figures.all()) {
            await expect(figure.locator('.cr__figure')).toHaveCount(1);
            if (style === 'engraved') {
              await expect(figure).toHaveAttribute('data-generated', '');
              await expect(figure.locator('.cr__figure > image')).toHaveCount(1);
              await expect(figure.locator(':scope > svg')).toHaveAttribute(
                'viewBox',
                '0 0 100 116',
              );
            } else {
              await expect(figure).not.toHaveAttribute('data-generated');
              await expect(figure.locator('image,img')).toHaveCount(0);
            }
          }
        }
        for (const progress of [0, 0.5, 1, 0]) {
          await page.evaluate((value) => window.__aliceDemo?.seek(value), progress);
          await settled(page);
        }
        await noPageOverflow(page);
      }
    });
  }
}
