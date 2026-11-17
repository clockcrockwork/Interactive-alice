/** The four engraved witness props keep the existing theatre's geometry and cues. */
import { expect, type Locator, type Page, test } from '@playwright/test';
import { atCue, collectErrors, settled } from '../demo-helpers.ts';

const visit = async (
  page: Page,
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
  await page.goto(`/demos/${locale}witnesses/`);
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
};

/** Decode the shipping WebP, including alpha, then project its ink into the logical SVG. */
const cutout = async (
  wrapper: Locator,
  id: string,
  width: number,
  height: number,
  bounds: readonly [number, number, number, number],
) => {
  const svg = wrapper.locator(':scope > svg');
  await expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
  await expect(svg).toHaveAttribute(`data-generated-${id}`, '');
  await expect(svg).toHaveAttribute('focusable', 'false');
  await expect(svg.locator(':scope > *')).toHaveCount(1);
  const image = svg.locator(':scope > image');
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
    const box = placed.ownerSVGElement?.viewBox.baseVal;
    if (!box) throw new Error('missing logical canvas');
    const scale = Math.min(
      placed.width.baseVal.value / canvas.width,
      placed.height.baseVal.value / canvas.height,
    );
    const x = placed.x.baseVal.value + (placed.width.baseVal.value - canvas.width * scale) / 2;
    const y = placed.y.baseVal.value + (placed.height.baseVal.value - canvas.height * scale) / 2;
    let clear = 0;
    let solid = 0;
    let clipped = 0;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (let p = 3; p < data.length; p += 4) {
      const alpha = data[p] ?? 0;
      if (alpha === 0) clear++;
      if (alpha >= 240) solid++;
      // Ignore sub-visible resampling fringes, as in the existing cutout tests.
      if (alpha < 16) continue;
      const pixel = (p - 3) / 4;
      const x0 = x + (pixel % canvas.width) * scale;
      const y0 = y + Math.floor(pixel / canvas.width) * scale;
      const x1 = x0 + scale;
      const y1 = y0 + scale;
      if (x0 < 0 || y0 < 0 || x1 > box.width || y1 > box.height) clipped++;
      left = Math.min(left, x0);
      top = Math.min(top, y0);
      right = Math.max(right, x1);
      bottom = Math.max(bottom, y1);
    }
    return {
      clear,
      solid,
      clipped,
      bounds: [left, top, right, bottom],
      total: canvas.width * canvas.height,
    };
  });
  expect(result.clipped).toBe(0);
  expect(result.clear / result.total).toBeGreaterThan(0.3);
  expect(result.solid / result.total).toBeGreaterThan(0.15);
  for (const [index, expected] of bounds.entries()) {
    // Less than two shipping-image pixels: enough for WebP's resampling fringe.
    expect(Math.abs((result.bounds[index] ?? Infinity) - expected)).toBeLessThan(0.25);
  }
  const geometry = await svg.evaluate((el) => {
    const css = getComputedStyle(el);
    return { width: Number.parseFloat(css.width), height: Number.parseFloat(css.height) };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.width / geometry.height).toBeCloseTo(width / height, 2);
};

const geometry = async (wrapper: Locator, x: number, y: number, parentRatio?: number) => {
  const value = await wrapper.evaluate((el) => {
    const css = getComputedStyle(el);
    if (!el.parentElement) throw new Error('missing prop parent');
    return {
      origin: css.transformOrigin.split(' ').map(Number.parseFloat),
      width: Number.parseFloat(css.width),
      height: Number.parseFloat(css.height),
      parentWidth: Number.parseFloat(getComputedStyle(el.parentElement).width),
    };
  });
  expect(value.origin[0]).toBeCloseTo(value.width * x, 2);
  expect(value.origin[1]).toBeCloseTo(value.height * y, 2);
  if (parentRatio !== undefined)
    expect(value.width / value.parentWidth).toBeCloseTo(parentRatio, 2);
};

const hatterState = (page: Page) =>
  page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`missing ${selector}`);
      const css = getComputedStyle(el);
      const matrix = new DOMMatrix(css.transform);
      return {
        opacity: Number(css.opacity),
        matrix: Array.from(matrix.toFloat64Array(), (value) => Number(value.toFixed(4))),
        y: matrix.m42,
        angle: (Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI,
        scaleX: matrix.m11,
        thin: Number(css.getPropertyValue('--thin')),
        x: Number(css.getPropertyValue('--x')),
        rotation: Number(css.getPropertyValue('--r')),
        shaking: el.hasAttribute('data-shaking'),
      };
    };
    return {
      cup: read('.wt__teacup'),
      bread: read('.wt__bread'),
      left: read('.wt__shoe--left'),
      right: read('.wt__shoe--right'),
      height: innerHeight,
    };
  });

const unrelatedVectors = async (page: Page) => {
  for (const selector of ['.wt__bag', '.wt__notebook', '.wt__peek-book', '.wt__sheet']) {
    await expect(page.locator(`${selector} image`)).toHaveCount(0);
    expect(await page.locator(`${selector} path`).count()).toBeGreaterThan(0);
  }
};

/** Sample motion in-page: the bridge must not race a 300 ms alternating animation. */
const pepperFrames = (page: Page) =>
  page.evaluate(async () => {
    const box = document.querySelector('.wt__pepper-box');
    if (!box) throw new Error('missing pepper box');
    const frames: { transform: string; angle: number }[] = [];
    for (let frame = 0; frame < 12; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const transform = getComputedStyle(box).transform;
      const matrix = new DOMMatrix(transform);
      frames.push({ transform, angle: (Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI });
    }
    return frames;
  });

// Golden copies of the original vectors, independent of the renderer's fallback constants.
const originals = [
  [
    '.wt__teacup',
    '<svg viewBox="0 0 60 44" focusable="false"><path d="M8 10 h36 v12 q0 14 -18 14 q-18 0 -18 -14 Z" fill="var(--paper-base)"/><path d="M44 14 q12 0 12 8 q0 8 -12 8" stroke="var(--paper-base)" stroke-width="4" fill="none"/><ellipse cx="26" cy="12" rx="16" ry="4" fill="color-mix(in oklab, var(--sepia-mid) 70%, var(--paper-warm))"/><ellipse cx="26" cy="40" rx="20" ry="4" fill="var(--paper-base)"/></svg>',
  ],
  [
    '.wt__bread',
    '<svg viewBox="0 0 60 40" focusable="false"><path d="M4 36 L4 14 Q8 4 18 4 L52 4 Q56 4 56 10 L56 36 Z" fill="var(--paper-aged)"/><path d="M8 34 L8 16 Q10 8 18 8 L50 8 L50 34 Z" fill="var(--paper-warm)"/><path d="M10 14 h36" stroke="var(--world-glow)" stroke-width="4" stroke-linecap="round" opacity="0.8"/></svg>',
  ],
  [
    '.wt__shoe',
    '<svg viewBox="0 0 44 22" focusable="false"><path d="M2 18 Q2 6 16 6 L26 6 Q34 6 40 14 Q44 18 40 20 L4 20 Q2 20 2 18 Z" fill="var(--sepia-deep)"/><path d="M14 6 L16 2 L24 2 L26 6" fill="var(--sepia-dark)"/><circle cx="20" cy="10" r="1.6" fill="var(--paper-aged)"/></svg>',
  ],
  [
    '.wt__pepper-box',
    '<svg viewBox="0 0 30 50" focusable="false"><rect x="6" y="14" width="18" height="34" rx="3" fill="var(--sepia-dark)"/><path d="M6 20 h18" stroke="var(--paper-aged)" stroke-width="2"/><rect x="8" y="4" width="14" height="12" rx="4" fill="var(--sepia-deep)"/><circle cx="12" cy="8" r="1.2" fill="var(--paper-aged)"/><circle cx="18" cy="8" r="1.2" fill="var(--paper-aged)"/><circle cx="15" cy="12" r="1.2" fill="var(--paper-aged)"/></svg>',
  ],
] as const;

const vectorSignatures = async (page: Page) => {
  for (const [selector, markup] of originals) {
    const svgs = page.locator(`${selector} > svg`);
    await expect(svgs).toHaveCount(selector === '.wt__shoe' ? 2 : 1);
    const result = await svgs.evaluateAll((elements, original) => {
      const template = document.createElement('template');
      template.innerHTML = original;
      const root = template.content.firstElementChild;
      if (!root) throw new Error('missing golden SVG');
      const signature = (svg: Element) =>
        [svg, ...svg.querySelectorAll('*')].map((el) => ({
          tag: el.localName,
          attributes: Object.fromEntries(
            [...el.attributes].map((attribute) => [attribute.name, attribute.value]).sort(),
          ),
        }));
      return { expected: signature(root), actual: elements.map(signature) };
    }, markup);
    for (const actual of result.actual) expect(actual).toEqual(result.expected);
  }
};

/** Visit every beat in both directions with the supported seam, not remote timing guesses. */
const traverse = async (page: Page) => {
  await page.evaluate(async () => {
    const seam = window.__aliceDemo;
    const count = document.querySelectorAll('.demo__stage .demo-beat').length;
    if (!seam || !count) throw new Error('missing witness timeline');
    const stops = Array.from({ length: count }, (_, index) => (index + 0.5) / count);
    for (const progress of [0, ...stops, 1, ...stops.slice().reverse(), 0]) {
      seam.seek(progress);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }
  });
  await settled(page);
};

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    const label = `${locale || 'en/'} ${motion}`;
    test(`witness props preserve cup drop, bread thinning and both shoe releases: ${label}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      await visit(page, locale, motion);
      await atCue(page, 'hatter', 0.8);
      const cup = page.locator('.wt__teacup');
      const bread = page.locator('.wt__bread');
      const left = page.locator('.wt__shoe--left');
      const right = page.locator('.wt__shoe--right');
      await cutout(cup, 'witness-teacup', 60, 44, [2, 9.53, 58, 43]);
      await cutout(bread, 'bread-and-butter', 60, 40, [2, 6.6, 58, 36]);
      await cutout(left, 'hatter-shoe', 44, 22, [2, 2.9, 42, 20]);
      await cutout(right, 'hatter-shoe', 44, 22, [2, 2.9, 42, 20]);
      expect(await left.locator('image').getAttribute('href')).toBe(
        await right.locator('image').getAttribute('href'),
      );
      await geometry(cup, 0.5, 0.5, 0.26);
      await geometry(bread, 0, 0.5, 0.26);
      for (const shoe of [left, right]) {
        await geometry(shoe, 0.5, 0.5);
        for (const node of [shoe.locator('svg'), shoe.locator('image')]) {
          await expect(node).not.toHaveAttribute('transform', /.*/);
          await expect(node).toHaveCSS('transform', 'none');
        }
        const width = await shoe.evaluate((el) => {
          const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
          return {
            actual: Number.parseFloat(getComputedStyle(el).width),
            expected: Math.min(
              3.4 * rem,
              Math.max(2 * rem, 0.055 * Math.min(innerWidth, innerHeight)),
            ),
          };
        });
        expect(width.actual).toBeCloseTo(width.expected, 1);
      }
      // These never had .art children. Adding one silently activates trembling/shoe CSS.
      await expect(page.locator('.wt__teacup .art, .wt__bread .art, .wt__shoe .art')).toHaveCount(
        0,
      );
      const held = await hatterState(page);
      expect(held.cup.opacity).toBe(1);
      expect(held.cup.y).toBe(0);
      expect(held.cup.angle).toBe(0);
      expect(held.bread.thin).toBe(0);
      expect(held.bread.scaleX).toBe(1);
      expect([held.left.x, held.left.rotation, held.right.x, held.right.rotation]).toEqual([
        18, 0, 30, 0,
      ]);

      await atCue(page, 'twinkling', 0.4);
      const thinning = await hatterState(page);
      expect(thinning.cup.opacity).toBe(1);
      expect(thinning.cup.y).toBe(0);
      expect(thinning.bread.thin).toBeCloseTo(motion === 'reduce' ? 1 : 0.5, 1);
      expect(thinning.bread.scaleX).toBeCloseTo(1 - thinning.bread.thin * 0.8, 4);
      expect(thinning.left.shaking).toBe(true);
      expect(thinning.right.shaking).toBe(true);
      await expect(left.locator('svg')).toHaveCSS('animation-name', 'none');
      await expect(right.locator('svg')).toHaveCSS('animation-name', 'none');

      await atCue(page, 'knee', 0.22);
      const falling = await hatterState(page);
      if (motion === 'no-preference') {
        expect(falling.cup.opacity).toBe(1);
        expect(falling.cup.y).toBeGreaterThan(0);
        expect(falling.cup.y).toBeLessThan(falling.height * 0.28);
        expect(falling.cup.angle).toBeGreaterThan(0);
        expect(falling.cup.angle).toBeLessThan(140);
      } else {
        // The reduced-motion shell snaps every within-beat position to +0.7,
        // after both the short fall and the unchanged +0.34 fade start.
        expect(falling.cup.opacity).toBe(0);
        expect(falling.cup.y).toBeCloseTo(falling.height * 0.28, 0);
      }

      await atCue(page, 'knee', 0.8);
      const dropped = await hatterState(page);
      expect(dropped.cup.opacity).toBe(0);
      expect(dropped.cup.y).toBeCloseTo(dropped.height * 0.28, 0);
      expect(dropped.cup.angle).toBeCloseTo(140, 2);
      expect(dropped.bread.thin).toBe(1);
      expect(dropped.bread.scaleX).toBeCloseTo(0.2, 4);
      expect([
        dropped.left.x,
        dropped.left.rotation,
        dropped.right.x,
        dropped.right.rotation,
      ]).toEqual([12, -70, 37, 40]);
      expect(dropped.left.shaking || dropped.right.shaking).toBe(false);
      expect([dropped.left.opacity, dropped.right.opacity]).toEqual([1, 1]);
      await atCue(page, 'shoes', 0.8);
      await expect(page.locator('.wt__hatter')).not.toHaveAttribute('data-trembling', /.*/);
      expect((await hatterState(page)).left).toEqual(dropped.left);
      expect((await hatterState(page)).right).toEqual(dropped.right);
      // Reconstruct the same held and released poses, then repeat the whole release.
      for (let round = 0; round < 2; round++) {
        await atCue(page, 'hatter', 0.8);
        expect(await hatterState(page)).toEqual(held);
        await atCue(page, 'knee', 0.8);
        expect(await hatterState(page)).toEqual(dropped);
      }
      await unrelatedVectors(page);
      expect(errors).toEqual([]);
    });

    test(`witness pepper keeps its bottom pivot, shake and reduced still on reentry: ${label}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      await visit(page, locale, motion);
      await atCue(page, 'cook', 0.8);
      const box = page.locator('.wt__pepper-box');
      const cook = page.locator('.wt__cook');
      const pepper = page.locator('.wt__pepper');
      const court = page.locator('.tr__court');
      await cutout(box, 'pepper-box', 30, 50, [5.43, 4, 24.57, 48]);
      await geometry(box, 0.5, 1, 0.16);
      await expect(box.locator('.art, .wt__speck')).toHaveCount(0);
      await expect(pepper.locator('image')).toHaveCount(0);
      expect(await pepper.locator('.wt__speck').count()).toBeGreaterThan(0);
      await expect(box).toHaveCSS('animation-name', 'none');
      await expect(box).toHaveCSS('transform', 'none');
      for (let round = 0; round < 2; round++) {
        await atCue(page, 'pepper', 0.6);
        await expect(cook).toHaveAttribute('data-shaking', '');
        await expect(pepper).toHaveAttribute('data-shown', '');
        await expect(court).toHaveAttribute('data-sneezing', '');
        await expect(box).toHaveCSS(
          'animation-name',
          motion === 'reduce' ? 'none' : 'wt-pepper-box',
        );
        const frames = await pepperFrames(page);
        const transforms = new Set(frames.map((frame) => frame.transform));
        if (motion === 'reduce') {
          expect(transforms.size).toBe(1);
          for (const frame of frames) expect(frame.angle).toBeCloseTo(-16, 2);
          await expect(pepper.locator('.wt__speck').first()).toHaveCSS('animation-name', 'none');
          await expect(pepper.locator('.wt__speck').first()).toHaveCSS('opacity', '0.5');
        } else {
          expect(transforms.size).toBeGreaterThan(1);
          await expect(box).toHaveCSS('animation-duration', '0.3s');
          await expect(box).toHaveCSS('animation-direction', 'alternate');
          await expect(box).toHaveCSS('animation-iteration-count', 'infinite');
          await expect(pepper.locator('.wt__speck').first()).toHaveCSS(
            'animation-name',
            'wt-drift',
          );
        }
        await atCue(page, 'called', 0.4);
        await expect(cook).not.toHaveAttribute('data-shaking', '');
        await expect(pepper).not.toHaveAttribute('data-shown', '');
        await expect(court).not.toHaveAttribute('data-sneezing', '');
        await expect(cook).toHaveCSS('opacity', '0');
        await expect(box).toHaveCSS('animation-name', 'none');
        await expect(box).toHaveCSS('transform', 'none');
        // Reverse into the active pepper beat, then before it: both gates reconstruct.
        await atCue(page, 'pepper', 0.6);
        await expect(cook).toHaveAttribute('data-shaking', '');
        await expect(pepper).toHaveAttribute('data-shown', '');
        await expect(cook).toHaveCSS('opacity', '1');
        await atCue(page, 'cook', 0.8);
        await expect(cook).not.toHaveAttribute('data-shaking', '');
        await expect(pepper).not.toHaveAttribute('data-shown', '');
        await expect(court).not.toHaveAttribute('data-sneezing', '');
        await expect(box).toHaveCSS('animation-name', 'none');
        await expect(box).toHaveCSS('transform', 'none');
      }
      await unrelatedVectors(page);
      expect(errors).toEqual([]);
    });
  }

  for (const style of ['flat', 'paper']) {
    test(`witness props keep exact vectors and fetch none of the four cutouts: ${locale || 'en/'} ${style}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      const requests: string[] = [];
      page.on('request', (request) => {
        if (
          /(?:witness-teacup|bread-and-butter|hatter-shoe|pepper-box)\.any\.generated/.test(
            request.url(),
          )
        )
          requests.push(request.url());
      });
      await visit(page, locale, 'reduce', style);
      await vectorSignatures(page);
      await traverse(page);
      await vectorSignatures(page);
      await expect(page.locator('.wt__shoe .art')).toHaveCount(0);
      await unrelatedVectors(page);
      expect(requests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
