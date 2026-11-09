import { expect, type Locator, type Page, test } from '@playwright/test';
import { atCue, collectErrors, customProperty, press, settled } from '../demo-helpers.ts';

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
  await page.goto(`/demos/${locale}tea-party/`);
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
};

/** Decode the actual shipping image and project every visible pixel into the SVG. */
const cutout = async (wrapper: Locator, id: string, width: number, height: number) => {
  const svg = wrapper.locator(':scope > svg');
  await expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
  await expect(svg).toHaveAttribute(`data-generated-${id}`, '');
  await expect(svg).toHaveAttribute('focusable', 'false');
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
    if (!box) throw new Error('missing original logical canvas');
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
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (let p = 3; p < data.length; p += 4) {
      const alpha = data[p] ?? 0;
      if (alpha === 0) clear++;
      if (alpha >= 240) solid++;
      if (alpha < 16) continue;
      const pixel = (p - 3) / 4;
      const px = pixel % canvas.width;
      const py = Math.floor(pixel / canvas.width);
      const x0 = x + px * scale;
      const x1 = x0 + scale;
      const y0 = y + py * scale;
      const y1 = y0 + scale;
      if (x0 < 0 || y0 < 0 || x1 > box.width || y1 > box.height) clipped++;
      left = Math.min(left, x0);
      right = Math.max(right, x1);
      top = Math.min(top, y0);
      bottom = Math.max(bottom, y1);
    }
    return { clear, solid, clipped, left, right, top, bottom, total: canvas.width * canvas.height };
  });
  expect(result.clipped).toBe(0);
  expect(result.clear / result.total).toBeGreaterThan(0.3);
  expect(result.solid / result.total).toBeGreaterThan(0.15);
  const geometry = await svg.evaluate((el) => {
    const css = getComputedStyle(el);
    return { w: Number.parseFloat(css.width), h: Number.parseFloat(css.height) };
  });
  expect(geometry.w / geometry.h).toBeCloseTo(width / height, 2);
  return result;
};

const pivot = async (wrapper: Locator, bottom = false) => {
  const value = await wrapper.evaluate((el) => {
    const css = getComputedStyle(el);
    return {
      origin: css.transformOrigin.split(' ').map(Number.parseFloat),
      w: Number.parseFloat(css.width),
      h: Number.parseFloat(css.height),
    };
  });
  expect(value.origin[0]).toBeCloseTo(value.w / 2, 2);
  expect(value.origin[1]).toBeCloseTo(value.h * (bottom ? 1 : 0.5), 2);
};

/** Observe insertion in-page so an ordinary 2.2-second flight cannot outrun bridge reads. */
const watchChorus = async (page: Page) => {
  await page.evaluate(() => {
    const root = document.querySelector('.tp__bat-layer');
    if (!root) throw new Error('missing bat layer');
    const host = window as unknown as { __teaTrioCreated: unknown[] };
    host.__teaTrioCreated = [];
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const el of mutation.addedNodes) {
          if (!(el instanceof HTMLElement) || !el.matches('.tp__sing-bat')) continue;
          const tray = el.querySelector('.tp__tray');
          if (!tray) throw new Error('missing chorus tray');
          const svg = tray.querySelector('svg');
          host.__teaTrioCreated.push({
            href: tray.querySelector('image')?.getAttribute('href'),
            viewBox: svg?.getAttribute('viewBox'),
            generated: svg?.hasAttribute('data-generated-tray'),
            widthRatio:
              Number.parseFloat(getComputedStyle(tray).width) /
              Number.parseFloat(getComputedStyle(el).width),
            animation: getComputedStyle(el).animationName,
            opacity: getComputedStyle(el).opacity,
          });
        }
      }
    }).observe(root, { childList: true });
  });
  return () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __teaTrioCreated: {
              href: string;
              viewBox: string;
              generated: boolean;
              widthRatio: number;
              animation: string;
              opacity: string;
            }[];
          }
        ).__teaTrioCreated,
    );
};

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    const label = `${locale || 'en/'} ${motion}`;
    test(`tea trio keeps table grounding, knife framing and butter reactivation: ${label}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, locale, motion);
      const dish = page.locator('.tp__butter-dish');
      const pat = page.locator('.tp__butter-pat');
      const knife = page.locator('.tp__knife');
      const bounds = await cutout(dish, 'butter', 160, 90);
      expect(bounds.bottom).toBeGreaterThan(87.5);
      expect(bounds.bottom).toBeLessThan(88.5);
      await cutout(pat, 'butter', 160, 90);
      const blade = await cutout(knife, 'knife', 300, 60);
      expect((blade.left + blade.right) / 2).toBeCloseTo(150, 0);
      expect((blade.top + blade.bottom) / 2).toBeCloseTo(30, 0);
      await pivot(dish, true);
      await pivot(knife);
      await expect(dish).toHaveCSS('width', '120px');
      expect(await customProperty(page, '.tp__butter-dish', '--x')).toBe(-40);
      expect(await customProperty(page, '.tp__butter-dish', '--z')).toBe(-560);
      expect(await customProperty(page, '.tp__butter-dish', '--stand')).toBe(0.6);
      expect(await dish.locator('image').getAttribute('href')).toBe(
        await pat.locator('image').getAttribute('href'),
      );

      // A scrubbed intermediate pose is deterministic even when a live frame is late.
      await atCue(page, 'butter', 0.4);
      const middle = await customProperty(page, '.tp__knife', '--knife');
      if (motion === 'no-preference') {
        expect(middle).toBeGreaterThan(0.1);
        expect(middle).toBeLessThan(0.9);
      } else {
        expect(middle).toBe(1);
      }
      // Story-driven movement reconstructs on reverse before reader overrides it.
      await atCue(page, 'butter', 0.85);
      await expect.poll(() => customProperty(page, '.tp__knife', '--knife')).toBe(1);
      await atCue(page, 'watch', 0.8);
      await expect.poll(() => customProperty(page, '.tp__knife', '--knife')).toBe(0);
      await expect(pat).toBeVisible();
      await press(page, pat);
      await expect.poll(() => customProperty(page, '.tp__knife', '--knife')).toBe(1);
      await expect.poll(() => customProperty(page, '.tp__watch', '--butter')).toBe(1);
      await expect(page.locator('.tp__watch-layer')).toHaveAttribute('data-buttered', '');
      const status = page.locator('.demo__status');
      const sentence =
        (
          await page
            .locator('.demo-beat[data-cue="butter"] .line[data-speaker="march-hare"]')
            .first()
            .textContent()
        )?.trim() ?? '';
      expect(sentence).not.toBe('');
      await expect(status).toHaveText(sentence);
      // Start after the first flight finishes. A fresh live-region update proves
      // keyboard activation ran even when reduced motion cuts directly to 1.
      await status.evaluate((el) => {
        const host = window as unknown as { __teaReplayAnnouncements: number };
        host.__teaReplayAnnouncements = 0;
        new MutationObserver((records) => {
          host.__teaReplayAnnouncements += records.filter(
            (record) => record.type === 'childList',
          ).length;
        }).observe(el, { childList: true });
      });
      await pat.focus();
      await page.keyboard.press('Enter');
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { __teaReplayAnnouncements: number }).__teaReplayAnnouncements,
          ),
        )
        .toBeGreaterThan(0);
      await expect(status).toHaveText(sentence);
      await expect.poll(() => customProperty(page, '.tp__knife', '--knife')).toBe(1);
      await atCue(page, 'give-up', 0.8);
      await expect(page.locator('.tp__watch-layer')).toHaveAttribute('data-off', '');
      await atCue(page, 'watch', 0.8);
      await expect(pat).toBeVisible();
      await expect(pat.locator('image')).toHaveCount(1);
      // The watch casing and two cup halves are cutouts; all date text stays live.
      await expect(page.locator('.tp__watch image, .tp__cup image')).toHaveCount(3);
      await expect(page.locator('.tp__dates text')).toHaveCount(31);
      expect(errors).toEqual([]);
    });

    test(`tea trio shares centred trays across story and repeated chorus bats: ${label}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, locale, motion);
      const story = page.locator('.tp__bat > .tp__tray');
      const bounds = await cutout(story, 'tray', 160, 50);
      expect((bounds.left + bounds.right) / 2).toBeCloseTo(80, 0);
      expect((bounds.top + bounds.bottom) / 2).toBeCloseTo(25, 0);
      await pivot(story);
      const storyHref = await story.locator('image').getAttribute('href');
      const sing = page.locator('.tp__prop-sing');
      const createdBats = await watchChorus(page);
      for (let round = 0; round < 2; round++) {
        await atCue(page, 'twinkle', 0.5);
        await expect(page.locator('.tp__bat-layer')).not.toHaveAttribute('data-off', '');
        await sing.focus();
        await page.keyboard.press('Enter');
        await expect.poll(async () => (await createdBats()).length).toBe(round + 1);
        const created = (await createdBats())[round];
        if (!created) throw new Error('missing recorded chorus bat');
        expect(created.href).toBe(storyHref);
        expect(created.viewBox).toBe('0 0 160 50');
        expect(created.generated).toBe(true);
        expect(created.widthRatio).toBeCloseTo(1.4, 2);
        if (motion === 'reduce') {
          expect(created.animation).toBe('none');
          expect(created.opacity).toBe('1');
        } else {
          expect(created.animation).toBe('tp-sing-fly');
        }
        await atCue(page, 'tea-time', 0.5);
        await expect(page.locator('.tp__sing-bat')).toHaveCount(0);
        await expect(sing).toBeHidden();
      }
      expect(errors).toEqual([]);
    });
  }

  for (const style of ['flat', 'paper']) {
    test(`tea trio preserves zero-fetch vector fallbacks: ${locale || 'en/'} ${style}`, async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on('request', (request) => {
        if (/(?:knife|butter|tray)\.any\.generated/.test(request.url()))
          requests.push(request.url());
      });
      await visit(page, locale, 'reduce', style);
      await settled(page);
      for (const selector of [
        '.tp__knife',
        '.tp__butter-pat',
        '.tp__butter-dish',
        '.tp__bat > .tp__tray',
      ]) {
        await expect(page.locator(`${selector} image`)).toHaveCount(0);
        expect(await page.locator(`${selector} svg > *`).count()).toBeGreaterThan(0);
      }
      await atCue(page, 'twinkle', 0.5);
      await page.locator('.tp__prop-sing').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.tp__sing-bat .tp__tray svg > ellipse')).toHaveCount(2);
      await expect(page.locator('.tp__sing-bat .tp__tray image')).toHaveCount(0);
      expect(requests).toEqual([]);
    });
  }
}
