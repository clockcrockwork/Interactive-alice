/** The generated tea layers keep their live overlays and the original stage geometry. */
import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  CUP_BACK_SVG,
  CUP_FRONT_SVG,
  SETTING_SYMBOL,
  TEAPOT_SVG,
  watchSvg,
} from '../../src/demos/tea-party/figures.ts';
import { atCue, collectErrors, customProperty, settled, watchProperty } from '../demo-helpers.ts';

const raster =
  /(?:place-setting-clean|teapot-body|teapot-lid|watch-body|cup-back|cup-front|frying-pan)\.any\.generated/;
const panVector =
  '<svg viewBox="0 0 140 80" focusable="false"><ellipse cx="50" cy="44" rx="44" ry="30" fill="var(--pp-iron)"/><ellipse cx="50" cy="40" rx="34" ry="20" fill="var(--pp-iron-rim)"/><path d="M92 40 h44" stroke="var(--pp-iron)" stroke-width="9" stroke-linecap="round"/></svg>';

const visit = async (
  page: Page,
  scene: 'tea-party' | 'pig-and-pepper',
  locale: string,
  motion: 'reduce' | 'no-preference',
  style = 'engraved',
) => {
  await page.emulateMedia({ reducedMotion: motion });
  await page.addInitScript(
    ({ art, alice }) => {
      localStorage.setItem('alice-demos:art', art);
      localStorage.setItem('alice-demos:alice', alice);
    },
    { art: style, alice: locale ? 'blue' : 'yellow' },
  );
  await page.goto(`/demos/${locale}${scene}/`);
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
  await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'ja' : 'en-simple');
  expect(await page.locator('html').getAttribute('data-alice')).toBe(locale ? 'blue' : null);
};

/** Decode shipping bytes rather than trusting an SVG image's nominal dimensions. */
const cutout = async (image: Locator, id: string, width: number, height: number) => {
  await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute('href', new RegExp(`${id}\\.any\\.generated`));
  await expect(image).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  const result = await image.evaluate(async (el) => {
    const source = new Image();
    source.src = el.getAttribute('href') ?? '';
    await source.decode();
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('missing image decoder context');
    context.drawImage(source, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const placed = el as SVGImageElement;
    // The shared place lives inside a symbol, whose outer SVG has a zero-size viewport.
    const root = el.closest('symbol') ?? placed.ownerSVGElement;
    const viewBox = root?.getAttribute('viewBox')?.split(' ').map(Number);
    if (viewBox?.length !== 4) throw new Error('missing logical canvas');
    const scale = Math.min(
      placed.width.baseVal.value / canvas.width,
      placed.height.baseVal.value / canvas.height,
    );
    const x = placed.x.baseVal.value + (placed.width.baseVal.value - canvas.width * scale) / 2;
    const y = placed.y.baseVal.value + (placed.height.baseVal.value - canvas.height * scale) / 2;
    let clear = 0;
    let solid = 0;
    let clipped = 0;
    let leftmost = Infinity;
    let topmost = Infinity;
    let rightmost = -Infinity;
    let bottommost = -Infinity;
    for (let p = 3; p < data.length; p += 4) {
      const alpha = data[p] ?? 0;
      if (alpha === 0) clear++;
      if (alpha >= 240) solid++;
      if (alpha < 16) continue;
      const pixel = (p - 3) / 4;
      const left = x + (pixel % canvas.width) * scale;
      const top = y + Math.floor(pixel / canvas.width) * scale;
      leftmost = Math.min(leftmost, left);
      topmost = Math.min(topmost, top);
      rightmost = Math.max(rightmost, left + scale);
      bottommost = Math.max(bottommost, top + scale);
      if (
        left < 0 ||
        top < 0 ||
        left + scale > (viewBox[2] ?? 0) ||
        top + scale > (viewBox[3] ?? 0)
      )
        clipped++;
    }
    return {
      clear,
      solid,
      clipped,
      total: canvas.width * canvas.height,
      viewBox,
      bounds: [leftmost, topmost, rightmost, bottommost],
    };
  });
  expect(result.viewBox).toEqual([0, 0, width, height]);
  expect(result.clipped).toBe(0);
  expect(result.clear / result.total).toBeGreaterThan(0.1);
  expect(result.solid / result.total).toBeGreaterThan(0.025);
  return result.bounds;
};

const box = async (wrapper: Locator, width: number, height: number, bottom = false) => {
  const svg = wrapper.locator(':scope > svg');
  await expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
  await expect(svg).toHaveAttribute('focusable', 'false');
  const geometry = await wrapper.evaluate((el) => {
    const css = getComputedStyle(el);
    return {
      width: Number.parseFloat(css.width),
      height: Number.parseFloat(css.height),
      origin: css.transformOrigin.split(' ').map(Number.parseFloat),
    };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.width / geometry.height).toBeCloseTo(width / height, 2);
  expect(geometry.origin[0]).toBeCloseTo(geometry.width / 2, 2);
  expect(geometry.origin[1]).toBeCloseTo(geometry.height * (bottom ? 1 : 0.5), 2);
};

/** Exact DOM signatures; the unit suite separately pins these vectors' pre-change bytes. */
const vector = async (svg: Locator, original: string) => {
  const result = await svg.evaluate((element, markup) => {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const root = template.content.firstElementChild;
    if (!root) throw new Error('missing original vector');
    const signature = (node: Element) =>
      [node, ...node.querySelectorAll('*')].map((el) => ({
        tag: el.localName,
        attributes: [...el.attributes].map((attr) => [attr.name, attr.value]).sort(),
        text: el.children.length ? '' : (el.textContent ?? '').trim(),
      }));
    return { expected: signature(root), actual: signature(element) };
  }, original);
  expect(result.actual).toEqual(result.expected);
};

const watchLayers = async (page: Page) => {
  expect(
    await page
      .locator('.tp__watch-layer > div')
      .evaluateAll((els) => els.slice(0, 3).map((el) => el.className)),
  ).toEqual(['tp__cup tp__cup--back', 'tp__watch', 'tp__cup tp__cup--front']);
  // Equal stacking contexts leave the front half after the watch in the paint order.
  for (const selector of ['.tp__cup--back', '.tp__watch', '.tp__cup--front']) {
    await expect(page.locator(selector)).toHaveCSS('z-index', 'auto');
  }
  const dates = await page.locator('.tp__dates text').allTextContents();
  const expected = await page.evaluate(() => {
    const format = new Intl.NumberFormat(document.documentElement.dataset.numbers, {
      maximumFractionDigits: 0,
    });
    return Array.from({ length: 31 }, (_, i) => format.format(i + 1));
  });
  expect(dates).toEqual(expected);
  await expect(page.locator('.tp__watch-hand > path')).toHaveCount(2);
  await expect(page.locator('.tp__watch-hand > circle')).toHaveCount(1);
  await expect(page.locator('.tp__smear > path')).toHaveCount(2);
  await expect(page.locator('.tp__crumbs > rect')).toHaveCount(5);
  await expect(page.locator('.tp__cup--back .tp__ring')).toHaveCount(3);
  await expect(page.locator('.tp__cup--front .tp__ring')).toHaveCount(0);
};

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    const label = `${locale || 'en/'} ${motion}`;
    test(`layered tea keeps a shared clean setting, independent dirt and the lid hinge: ${label}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      await visit(page, 'tea-party', locale, motion);
      const symbol = page.locator('symbol#tp-setting');
      await expect(symbol).toHaveCount(1);
      const setting = symbol.locator('image[data-generated-place-setting-clean]');
      await cutout(setting, 'place-setting-clean', 160, 120);
      await expect(page.locator('.tp__place .tp__setting use[href="#tp-setting"]')).toHaveCount(14);
      await expect(page.locator('.tp__place image')).toHaveCount(0);
      await expect(symbol.locator(':scope > g')).toHaveAttribute(
        'style',
        'opacity: var(--dirt, 0)',
      );
      await expect(symbol.locator(':scope > g > circle')).toHaveCount(3);
      const place = page.locator('.tp__place').first();
      await box(place, 160, 120, true);
      await expect(place).toHaveCSS('width', '150px');
      expect(await customProperty(page, '.tp__place', '--stand')).toBe(0.45);

      const pot = page.locator('.tp__teapot');
      await box(pot, 200, 150, true);
      await expect(pot).toHaveCSS('width', '230px');
      expect(await customProperty(page, '.tp__teapot', '--x')).toBe(30);
      expect(await customProperty(page, '.tp__teapot', '--z')).toBe(-330);
      expect(await customProperty(page, '.tp__teapot', '--stand')).toBe(0.7);
      await cutout(pot.locator('image[data-generated-teapot-body]'), 'teapot-body', 200, 150);
      await cutout(
        pot.locator('.tp__lid image[data-generated-teapot-lid]'),
        'teapot-lid',
        200,
        150,
      );
      expect(
        await pot.locator('svg > *').evaluateAll((els) => els.map((el) => el.localName)),
      ).toEqual(['ellipse', 'image', 'g', 'g']);
      await expect(pot.locator('svg > ellipse')).toHaveAttribute('cy', '140');
      await expect(pot.locator('.tp__steam > path')).toHaveCount(1);
      const lid = pot.locator('.tp__lid');
      const hinge = await lid.evaluate((el) => {
        const bounds = (el as SVGGraphicsElement).getBBox();
        const css = getComputedStyle(el);
        const [x = 0, y = 0] = css.transformOrigin.split(' ').map(Number.parseFloat);
        return {
          bounds: [bounds.x, bounds.y, bounds.width, bounds.height],
          pivot: [bounds.x + x, bounds.y + y],
          box: css.transformBox,
        };
      });
      expect(hinge.bounds).toEqual([56, 23, 88, 37]);
      expect(hinge.box).toBe('fill-box');
      expect(hinge.pivot[0]).toBeCloseTo(73.6, 2);
      expect(hinge.pivot[1]).toBeCloseTo(60, 2);
      await atCue(page, 'wine', 0.65);
      expect(await customProperty(page, '.tp__teapot', '--lid')).toBe(1);
      await expect(pot.locator('.tp__steam')).toHaveCSS('opacity', '1');
      await expect(pot.locator('svg > image')).toHaveCSS('transform', 'none');
      const lift = await lid.evaluate((el) => {
        const matrix = new DOMMatrix(getComputedStyle(el).transform);
        return { angle: (Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI, y: matrix.m42 };
      });
      expect(lift.angle).toBeCloseTo(-24, 2);
      expect(lift.y).toBeCloseTo(-14, 2);
      // A separate beat is essential: reduced motion settles every beat at +0.7.
      await atCue(page, 'civil', 0.5);
      expect(await customProperty(page, '.tp__teapot', '--lid')).toBe(0);
      for (let round = 0; round < 2; round++) {
        const frames = await watchProperty(page, '.tp__teapot', '--lid');
        await page.locator('.tp__prop-wine').focus();
        await page.keyboard.press('Enter');
        await expect.poll(async () => (await frames()).some((value) => value > 0.9)).toBe(true);
        await expect.poll(() => customProperty(page, '.tp__teapot', '--lid')).toBe(0);
      }
      await atCue(page, 'tea-time', 0.95);
      await expect(page.locator('.tp__place[data-slot="5"][data-used]')).toHaveCount(2);
      await atCue(page, 'watch', 0.8);
      await expect(page.locator('.tp__place[data-used]')).toHaveCount(0);
      await atCue(page, 'tea-time', 0.95);
      await page.locator('.tp__prop-round').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.tp__place[data-slot="4"][data-used]')).toHaveCount(2);
      await atCue(page, 'watch', 0.8);
      await expect(page.locator('.tp__place[data-slot="4"][data-used]')).toHaveCount(2);
      await expect(setting).toHaveCount(1);
      expect(await customProperty(page, '.tp__place[data-slot="4"]', '--dirt')).toBe(1);
      expect(await customProperty(page, '.tp__place[data-slot="3"]', '--dirt')).toBe(0);
      expect(errors).toEqual([]);
    });

    test(`layered watch dips between the cup halves and restores its live overlays: ${label}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      await visit(page, 'tea-party', locale, motion);
      await watchLayers(page);
      const inkBounds = new Map<string, number[]>();
      for (const [selector, id, width, height] of [
        ['.tp__watch', 'watch-body', 400, 440],
        ['.tp__cup--back', 'cup-back', 300, 220],
        ['.tp__cup--front', 'cup-front', 300, 220],
      ] as const) {
        const wrapper = page.locator(selector);
        await box(wrapper, width, height);
        inkBounds.set(
          id,
          await cutout(wrapper.locator(`image[data-generated-${id}]`), id, width, height),
        );
      }
      await expect(page.locator('.tp__cup--back svg > :first-child')).toHaveAttribute(
        'data-generated-cup-back',
        '',
      );
      await expect(page.locator('.tp__cup--back svg > :last-child')).toHaveAttribute(
        'class',
        'tp__rings',
      );
      await expect(page.locator('.tp__watch-hand')).toHaveCSS('transform-origin', '200px 220px');
      const layer = page.locator('.tp__watch-layer');
      for (let round = 0; round < 2; round++) {
        await atCue(page, 'butter', 0.85);
        await expect(layer).toHaveAttribute('data-buttered', '');
        await expect(page.locator('.tp__smear')).toHaveCSS('opacity', '1');
        await expect(page.locator('.tp__crumbs rect').first()).toHaveCSS(
          'animation-name',
          motion === 'reduce' ? 'none' : 'tp-crumb',
        );
        await atCue(page, 'tea', 0.7);
        expect(await customProperty(page, '.tp__watch', '--dip')).toBe(1);
        await expect(layer).toHaveAttribute('data-rings', '');
        for (const selector of ['.tp__cup--back', '.tp__cup--front'])
          await expect(page.locator(selector)).toHaveCSS('opacity', '1');
        const rings = await page.locator('.tp__ring').evaluateAll((els) =>
          els.map((el) => {
            const css = getComputedStyle(el);
            return {
              animation: css.animationName,
              origin: css.transformOrigin,
              opacity: Number(css.opacity),
              scale: new DOMMatrix(css.transform).m11,
              delay: css.animationDelay,
            };
          }),
        );
        for (const ring of rings) {
          expect(ring.origin).toBe('150px 60px');
          expect(ring.animation).toBe(motion === 'reduce' ? 'none' : 'tp-ring');
        }
        if (motion === 'reduce') {
          expect(rings.map((ring) => ring.opacity)).toEqual([0.4, 0.4, 0.4]);
          expect(rings.map((ring) => ring.scale)).toEqual([1.4, 2.2, 3]);
        } else {
          expect(rings.map((ring) => ring.delay)).toEqual(['0s', '0.6s', '1.2s']);
        }
        if (round === 0) {
          // Read painted frames inside the page so bridge latency cannot skip a ripple.
          const changes = await page.locator('.tp__ring').evaluateAll(
            async (els, duration) => {
              const seen = els.map(() => new Set<string>());
              const until = performance.now() + duration;
              // The third ripple starts 1.2 seconds later than the first.
              for (let frame = 0; frame < 12 || performance.now() < until; frame++) {
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
                els.forEach((el, index) => {
                  seen[index]?.add(getComputedStyle(el).transform);
                });
              }
              return seen.map((values) => values.size);
            },
            motion === 'reduce' ? 0 : 2_000,
          );
          for (const count of changes) {
            if (motion === 'reduce') expect(count).toBe(1);
            else expect(count).toBeGreaterThan(1);
          }
          const overlaps = await page.evaluate(() => {
            const watch = document.querySelector('.tp__watch')?.getBoundingClientRect();
            const front = document.querySelector('.tp__cup--front')?.getBoundingClientRect();
            return (
              !!watch &&
              !!front &&
              watch.left < front.right &&
              watch.right > front.left &&
              watch.top < front.bottom &&
              watch.bottom > front.top
            );
          });
          expect(overlaps).toBe(true);
        }
        await atCue(page, 'funny', 0.85);
        expect(await customProperty(page, '.tp__watch', '--dip')).toBe(0);
        expect(await customProperty(page, '.tp__watch', '--wet')).toBe(1);
        await expect(layer).not.toHaveAttribute('data-rings', '');
        await expect(page.locator('.tp__cup--front')).toHaveCSS('opacity', '0');
        // Reverse into the dip, then before the butter, reconstructing the same layers.
        await atCue(page, 'tea', 0.7);
        await expect(layer).toHaveAttribute('data-rings', '');
        expect(await customProperty(page, '.tp__watch', '--dip')).toBe(1);
        await atCue(page, 'watch', 0.8);
        expect(await customProperty(page, '.tp__watch', '--dip')).toBe(0);
        expect(await customProperty(page, '.tp__watch', '--wet')).toBe(0);
        await expect(layer).not.toHaveAttribute('data-rings', '');
        await expect(layer).not.toHaveAttribute('data-buttered', '');
        await expect(page.locator('.tp__smear')).toHaveCSS('opacity', '0');
      }
      await watchLayers(page);
      if (!locale && motion === 'reduce') {
        await page.setViewportSize({ width: 390, height: 844 });
        await atCue(page, 'tea', 0.7);
        expect(await customProperty(page, '.tp__watch', '--dip')).toBe(1);
        const watchBottom = inkBounds.get('watch-body')?.[3];
        const frontBottom = inkBounds.get('cup-front')?.[3];
        if (watchBottom === undefined || frontBottom === undefined)
          throw new Error('missing decoded ink bounds');
        const exposure = await page.evaluate(
          ({ watchBottom, frontBottom }) => {
            const watch = document.querySelector('.tp__watch');
            const watchSvg = watch?.querySelector('svg');
            const frontSvg = document.querySelector('.tp__cup--front > svg');
            if (!watch || !watchSvg || !frontSvg) throw new Error('missing dip layers');
            const w = watchSvg.getBoundingClientRect();
            const f = frontSvg.getBoundingClientRect();
            // At full dip there is no rotation: transformed SVG rectangles give the
            // exact projection of logical ink bounds, including the watch's scale.
            return {
              rotate: Number.parseFloat(getComputedStyle(watch).rotate),
              actual: Math.max(
                0,
                w.top + (watchBottom * w.height) / 440 - (f.top + (frontBottom * f.height) / 220),
              ),
              legacy: Math.max(
                0,
                w.top + (416 * w.height) / 440 - (f.top + (218 * f.height) / 220),
              ),
            };
          },
          { watchBottom, frontBottom },
        );
        expect(exposure.rotate).toBe(0);
        // The old vectors themselves expose a few pixels at this narrow viewport.
        // Guard against making that worse; raster fringes get one CSS pixel.
        expect(exposure.actual).toBeLessThanOrEqual(exposure.legacy + 1);
      }
      expect(errors).toEqual([]);
    });

    test(`generated frying-pan retains its centred flight and repeatable reverse pose: ${label}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      await visit(page, 'pig-and-pepper', locale, motion);
      const pan = page.locator('.pp__pan-after');
      await box(pan, 140, 80);
      await expect(pan.locator('svg')).toHaveAttribute('data-generated-frying-pan', '');
      await cutout(pan.locator('image'), 'frying-pan', 140, 80);
      await expect(pan.locator('svg')).toHaveCSS('transform', 'none');
      const pose = () =>
        pan.evaluate((el) => {
          const css = getComputedStyle(el);
          const matrix = new DOMMatrix(css.transform);
          return {
            opacity: Number(css.opacity),
            x: matrix.m41,
            y: matrix.m42,
            scale: Math.hypot(matrix.m11, matrix.m12),
            matrix: Array.from(matrix.toFloat64Array(), (v) => Number(v.toFixed(3))),
          };
        });
      await atCue(page, 'nurse', 0.7);
      const before = await pose();
      expect(before.opacity).toBe(0);
      await atCue(page, 'off', 0.7);
      const flying = await pose();
      expect(flying.opacity).toBe(1);
      expect(flying.x).toBeGreaterThan(before.x);
      expect(flying.y).toBeLessThan(before.y);
      expect(flying.scale).toBeGreaterThan(0.5);
      if (motion === 'reduce') expect(flying.scale).toBeCloseTo(1.2, 2);
      else expect(flying.scale).toBeLessThan(1.2);
      await atCue(page, 'catch', 0.7);
      expect((await pose()).opacity).toBe(0);
      await atCue(page, 'off', 0.7);
      expect((await pose()).matrix).toEqual(flying.matrix);
      await atCue(page, 'nurse', 0.7);
      expect((await pose()).opacity).toBe(0);
      await atCue(page, 'off', 0.7);
      expect((await pose()).matrix).toEqual(flying.matrix);
      expect(errors).toEqual([]);
    });
  }

  for (const style of ['flat', 'paper']) {
    test(`layered props preserve exact vector fallback with zero raster fetches: ${locale || 'en/'} ${style}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      const requests: string[] = [];
      page.on('request', (request) => {
        if (raster.test(request.url())) requests.push(request.url());
      });
      await visit(page, 'tea-party', locale, 'reduce', style);
      await settled(page);
      const numberLocale = await page.locator('html').getAttribute('data-numbers');
      const format = new Intl.NumberFormat(numberLocale ?? undefined, { maximumFractionDigits: 0 });
      for (const [selector, markup] of [
        ['.tp__defs', SETTING_SYMBOL],
        ['.tp__teapot > svg', TEAPOT_SVG],
        ['.tp__watch > svg', watchSvg((n) => format.format(n))],
        ['.tp__cup--back > svg', CUP_BACK_SVG],
        ['.tp__cup--front > svg', CUP_FRONT_SVG],
      ] as const)
        await vector(page.locator(selector), markup);
      await expect(
        page.locator('.tp__defs image, .tp__teapot image, .tp__watch image, .tp__cup image'),
      ).toHaveCount(0);
      await atCue(page, 'wine', 0.65);
      expect(await customProperty(page, '.tp__teapot', '--lid')).toBe(1);
      await atCue(page, 'tea', 0.7);
      await expect(page.locator('.tp__watch-layer')).toHaveAttribute('data-rings', '');
      await watchLayers(page);
      await visit(page, 'pig-and-pepper', locale, 'reduce', style);
      await vector(page.locator('.pp__pan-after > svg'), panVector);
      await expect(page.locator('.pp__pan-after image')).toHaveCount(0);
      await atCue(page, 'off', 0.7);
      await expect(page.locator('.pp__pan-after')).toHaveCSS('opacity', '1');
      expect(requests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
