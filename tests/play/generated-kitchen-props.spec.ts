import { expect, type Page, test } from '@playwright/test';
import { atCue, collectErrors, customProperty } from '../demo-helpers.ts';

const kinds = [
  'fire-iron',
  'fire-iron',
  'saucepan',
  'plate',
  'dish',
  'saucepan',
  'plate',
  'fire-iron',
  'dish',
  'saucepan',
  'plate',
  'dish',
  'saucepan',
  'plate',
];
const props = [
  ['saucepan', 120, 80],
  ['plate', 100, 100],
  ['dish', 120, 70],
  ['fire-iron', 140, 40],
] as const;
const raster = /(?:plate|dish|saucepan|fire-iron)\.any\.generated/;

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
  await page.goto(`/demos/${locale}pig-and-pepper/`);
  await expect(page.locator('.demo')).toHaveAttribute('data-attached', '', { timeout: 30_000 });
};

const expectedKinds = async (page: Page) =>
  kinds.slice(0, (await page.evaluate(() => matchMedia('(max-width: 700px)').matches)) ? 9 : 14);

const captionOverlap = async (page: Page) =>
  page.evaluate(() => {
    const lines = [...document.querySelectorAll('.demo-beat[data-active] .line')].map((line) =>
      line.getBoundingClientRect(),
    );
    return [...document.querySelectorAll('.pp__glass .pp__thing')].some((el) => {
      const box = el.getBoundingClientRect();
      return lines.some(
        (line) =>
          box.left < line.right &&
          box.right > line.left &&
          box.top < line.bottom &&
          box.bottom > line.top,
      );
    });
  });

for (const locale of ['', 'ja/']) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    const label = `${locale || 'en/'} ${motion}`;
    test(`generated kitchen keeps decoded cutouts, boxes and pivots: ${label}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, locale, motion);
      const expected = await expectedKinds(page);
      expect(
        await page
          .locator('.pp__thing')
          .evaluateAll((els) => els.map((el) => el.getAttribute('data-kind'))),
      ).toEqual(expected);
      await expect(page.locator('.pp__plate-flying > svg')).toHaveAttribute(
        'data-generated-plate',
        '',
      );
      await expect(page.locator('.pp__big-pan > svg')).toHaveAttribute(
        'data-generated-saucepan',
        '',
      );
      await expect(page.locator('.pp__pan-after > svg')).toHaveAttribute(
        'data-generated-frying-pan',
        '',
      );
      for (const [kind, width, height] of props) {
        const wrapper = page.locator(`.pp__thing[data-kind="${kind}"]`).first();
        const svg = wrapper.locator(':scope > svg');
        await expect(svg).toHaveAttribute(`data-generated-${kind}`, '');
        await expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
        await expect(svg).toHaveAttribute('focusable', 'false');
        const picture = svg.locator(':scope > image');
        await expect(picture).toHaveCount(1);
        await expect(picture).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
        const pixels = await picture.evaluate(async (el) => {
          const source = new Image();
          source.src = el.getAttribute('href') ?? '';
          await source.decode();
          const canvas = document.createElement('canvas');
          canvas.width = source.naturalWidth;
          canvas.height = source.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('no image context');
          ctx.drawImage(source, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let clear = 0;
          let solid = 0;
          let outside = 0;
          const placed = el as SVGImageElement;
          const w = placed.width.baseVal.value;
          const h = placed.height.baseVal.value;
          const scale = Math.min(w / canvas.width, h / canvas.height);
          const x = placed.x.baseVal.value + (w - canvas.width * scale) / 2;
          const y = placed.y.baseVal.value + (h - canvas.height * scale) / 2;
          const box = placed.ownerSVGElement?.viewBox.baseVal;
          if (!box) throw new Error('no logical canvas');
          for (let p = 3; p < data.length; p += 4) {
            const alpha = data[p] ?? 0;
            if (alpha === 0) clear++;
            if (alpha >= 240) solid++;
            if (alpha > 32) {
              const px = x + (((p - 3) / 4) % canvas.width) * scale;
              const py = y + Math.floor((p - 3) / 4 / canvas.width) * scale;
              if (px < 0 || py < 0 || px >= box.width || py >= box.height) outside++;
            }
          }
          return {
            clear: clear / (canvas.width * canvas.height),
            solid: solid / (canvas.width * canvas.height),
            outside,
          };
        });
        expect(pixels.clear).toBeGreaterThan(0.25);
        expect(pixels.solid).toBeGreaterThan(0.04);
        expect(pixels.outside).toBe(0);
        const geometry = await wrapper.evaluate((el) => {
          const css = getComputedStyle(el);
          return {
            w: Number.parseFloat(css.width),
            h: Number.parseFloat(css.height),
            origin: css.transformOrigin.split(' ').map(Number.parseFloat),
            inert: (el as HTMLElement).inert,
          };
        });
        expect(geometry.w / geometry.h).toBeCloseTo(width / height, 2);
        expect(geometry.origin[0]).toBeCloseTo(geometry.w / 2, 2);
        expect(geometry.origin[1]).toBeCloseTo(geometry.h / 2, 2);
        expect(geometry.inert).toBe(true);
      }
      expect(errors).toEqual([]);
    });

    test(`generated kitchen still bats, ducks and reconstructs in reverse: ${label}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await visit(page, locale, motion);
      const expected = await expectedKinds(page);
      const stuck = page.locator('.pp__glass .pp__thing');
      await atCue(page, 'throw', 0.9);
      await expect(stuck).toHaveCount(Math.ceil(expected.length / 2), { timeout: 10_000 });
      expect(await stuck.evaluateAll((els) => els.every((el) => !(el as HTMLElement).inert))).toBe(
        true,
      );
      await expect(stuck.first()).toHaveAttribute('aria-label', /\S/);
      await stuck.first().focus();
      await page.keyboard.press('Enter');
      await expect(stuck).toHaveCount(Math.ceil(expected.length / 2) - 1);
      await page.locator('.pp__prop--duck').click();
      await expect(stuck).toHaveCount(0);
      // Removal finishes before the duck's camera recovery and its input guard.
      await expect.poll(() => customProperty(page, '.demo__stage', '--jy')).toBe(0);
      await atCue(page, 'grin', 0.6);
      await expect(page.locator('.pp__flying .pp__thing')).toHaveCount(expected.length);
      expect(
        await page
          .locator('.pp__thing')
          .evaluateAll((els) => els.every((el) => (el as HTMLElement).inert)),
      ).toBe(true);
      // Existing reset re-appends stuck objects after the flight-only siblings.
      // Preserve the full set; DOM order is not the timeline's throw order.
      expect(
        await page
          .locator('.pp__thing')
          .evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')).sort()),
      ).toEqual([...expected].sort());
      await atCue(page, 'throw', 0.9);
      await expect(stuck).toHaveCount(Math.ceil(expected.length / 2), { timeout: 10_000 });
      for (const cue of ['throw', 'mind', 'axes']) {
        await atCue(page, cue, 0.6);
        await expect.poll(() => captionOverlap(page), { message: cue }).toBe(false);
      }
      // Existing stuck objects reflow when caption fitting changes the safe band.
      await page.setViewportSize({ width: 600, height: 480 });
      await atCue(page, 'axes', 0.6);
      await expect(stuck).toHaveCount(Math.ceil(expected.length / 2));
      await expect.poll(() => captionOverlap(page), { message: 'resized axes' }).toBe(false);
      expect(errors).toEqual([]);
    });
  }

  for (const style of ['flat', 'paper']) {
    test(`kitchen ${style} keeps vector crockery without new raster requests: ${locale || 'en/'}`, async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on('request', (request) => {
        if (raster.test(request.url())) requests.push(request.url());
      });
      await visit(page, locale, 'reduce', style);
      const all = page.locator('.pp__thing, .pp__plate-flying, .pp__big-pan, .pp__pan-after');
      await expect(all.locator('image')).toHaveCount(0);
      await expect(all.locator('svg')).toHaveCount((await expectedKinds(page)).length + 3);
      await atCue(page, 'throw', 0.9);
      await expect(page.locator('.pp__glass .pp__thing')).toHaveCount(
        Math.ceil((await expectedKinds(page)).length / 2),
        { timeout: 10_000 },
      );
      expect(requests).toEqual([]);
    });
  }
}
