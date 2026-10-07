/**
 * The language-differences standard in the browser (docs/text-experience-binding.md,
 * Language differences): every page carries its locale's profile on the root, and the
 * stages draw and measure what the locale's realia say, in every locale, without a
 * language's name anywhere in the test. The expected values come from the text layer.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import type { LocaleRealia, LocaleRegistry, LocaleUIStrings } from '../../src/types/schema.ts';
import { atCue, pages as demoPages, demos } from '../demo-helpers.ts';
import { pageGraph } from '../manifest.ts';

const text = (...parts: string[]): unknown =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'text', ...parts), 'utf8'));
const registry = text('locales.json') as LocaleRegistry;
const realiaOf = (locale: string) =>
  (text('locales', locale, 'realia.json') as LocaleRealia).realia;
const uiOf = (locale: string) => (text('locales', locale, 'ui.json') as LocaleUIStrings).strings;
const settingsOf = (locale: string) => {
  const settings = registry.locales[locale];
  if (!settings) {
    throw new Error(`no locale ${locale}`);
  }
  return settings;
};

const label = (page: Page, key: string) =>
  page.evaluate(
    (k) =>
      (
        JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<
          string,
          string
        >
      )[k] ?? '',
    key,
  );

test('every page carries its locale profile on the root, as the registry declares it', async ({
  request,
}) => {
  const story = pageGraph().map((page) => ({
    url: page.path.replace(/index\.html$/, ''),
    locale: page.locale ?? registry.baseLocale,
  }));
  const demo = demoPages.map((page) => ({ url: page.url, locale: page.locale }));
  expect(story.length + demo.length).toBeGreaterThan(20);
  for (const { url, locale } of [...story, ...demo]) {
    const html = await (await request.get(url)).text();
    const open = /<html[^>]*>/.exec(html)?.[0] ?? '';
    const settings = settingsOf(locale);
    expect(open, url).toContain(`lang="${locale}"`);
    expect(open, url).toContain(`dir="${settings.dir}"`);
    expect(open, url).toContain(`data-line-break="${settings.lineBreak}"`);
    expect(open, url).toContain(`data-significant-spaces="${settings.significantSpaces}"`);
    expect(open, url).toContain(`data-set-apart="${settings.setApart.join(' ')}"`);
    expect(open, url).toContain(`data-word-unit="${settings.wordUnit}"`);
    expect(open, url).toContain(`data-emphasis="${settings.emphasis}"`);
    expect(open, url).toContain(`data-glyph-width="${settings.glyphWidth}"`);
    expect(open, url).toContain(`data-numbers="${settings.numbers}"`);
  }
});

for (const locale of Object.keys(registry.locales)) {
  const settings = settingsOf(locale);
  const realia = realiaOf(locale);
  const ui = uiOf(locale);
  const at = (id: string) => demos.find((entry) => entry.demo === id && entry.locale === locale);

  test.describe(`${locale}: the stages read the profile and the realia`, () => {
    test('the shell reads the profile the page carries, and speech is never slanted where the script has no italic', async ({
      page,
    }) => {
      const dormouse = at('dormouse');
      test.skip(!dormouse, `no dormouse page in ${locale}`);
      await page.goto(dormouse?.url ?? '');
      const profile = await page.evaluate(() => window.__aliceDemo?.profile());
      expect(profile).toEqual({
        lang: locale,
        dir: settings.dir,
        setApart: settings.setApart,
        wordUnit: settings.wordUnit,
        emphasis: settings.emphasis,
        glyphWidth: settings.glyphWidth,
        tag: settings.numbers,
      });
      const style = await page
        .locator('.line[data-kind="dialogue"]')
        .first()
        .evaluate((line) => getComputedStyle(line).fontStyle);
      expect(style).toBe(settings.emphasis === 'italic' ? 'italic' : 'normal');
    });

    test("the tape reads her height in the text's own unit, and lands on its notch", async ({
      page,
    }) => {
      const caterpillar = at('caterpillar');
      test.skip(!caterpillar, `no caterpillar page in ${locale}`);
      await page.goto(caterpillar?.url ?? '');
      const tape = page.getByRole('meter');
      await expect(tape).toHaveAccessibleName(ui.demoHeight);
      await expect(page.locator('.ct__tape')).toHaveAttribute('data-unit', realia.height.unit);
      await expect(page.locator('.ct__tape-unit')).toHaveText(ui.demoHeightUnit);
      // On the mushroom she stands on the notch: the number the sentence says.
      await expect(tape).toHaveAttribute('aria-valuenow', realia.height.notch.toFixed(1));
      await expect(page.locator('.ct__tape')).toHaveAttribute('data-notch', '');
      await expect(page.locator('.ct__tape-value')).toHaveText(
        new Intl.NumberFormat(settings.numbers, { maximumFractionDigits: 1 }).format(
          realia.height.notch,
        ),
      );
      // A nibble takes her off it, and the other bit brings her back.
      await atCue(page, 'sides', 0.9);
      await page.locator('.ct__bit--left').click();
      await expect(page.locator('.ct__tape')).not.toHaveAttribute('data-notch', '', {
        timeout: 15_000,
      });
      await page.locator('.ct__bit--right').click();
      await expect(page.locator('.ct__tape')).toHaveAttribute('data-notch', '', {
        timeout: 15_000,
      });
      await expect(tape).toHaveAttribute('aria-valuenow', realia.height.notch.toFixed(1));
    });

    test("the Cat's second answer is the thing this language hears instead of a pig", async ({
      page,
    }) => {
      const cat = at('cheshire-cat');
      test.skip(!cat, `no cheshire-cat page in ${locale}`);
      await page.goto(cat?.url ?? '');
      await atCue(page, 'again', 0.7);
      await page.locator('.cc__prop--fig').click();
      const moon = page.locator('.cc__moon-picture');
      await expect(moon).toHaveAttribute('data-picture', realia['cat-mishearing'].picture);
      await expect(moon.locator('svg')).toHaveCount(1);
    });

    test("the Dormouse's sisters draw this language's things, in its sentence's order", async ({
      browser,
    }) => {
      const dormouse = at('dormouse');
      test.skip(!dormouse, `no dormouse page in ${locale}`);
      // Reduced motion: the letters hang still, so none comes round and turns back.
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(dormouse?.url ?? '');
      await atCue(page, 'muchness', 0.5);
      const draw = page.locator('.dm__prop-m');
      await expect(draw).toHaveText(await label(page, 'demoDrawM'));
      const things = realia['m-things'].map((thing) => thing.picture);
      for (const thing of things) {
        await draw.click();
        await expect(page.locator(`.dm__letter[data-picture="${thing}"] svg`)).toHaveCount(1);
      }
      const drawn = await page
        .locator('.dm__letter[data-picture]')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.picture));
      expect([...drawn].sort()).toEqual([...things].sort());
      await context.close();
    });
  });

  test.describe(`${locale}: on a phone`, () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test('the bar stays one row, and every label fits inside its own pill', async ({ page }) => {
      const demo = at('mock-turtle');
      test.skip(!demo, `no mock-turtle page in ${locale}`);
      await page.goto(demo?.url ?? '');
      const bar = await page.locator('.demo__bar').boundingBox();
      const pills = page.locator(
        '.demo__bar :is(.demo__back, .demo__motion, .demo__sound, .demo__tilt):visible',
      );
      expect(await pills.count()).toBeGreaterThan(1);
      for (const box of await pills.evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            over: node.scrollWidth - node.clientWidth,
          };
        }),
      )) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(320);
        expect(box.top).toBeGreaterThanOrEqual((bar?.y ?? 0) - 1);
        expect(box.bottom).toBeLessThanOrEqual((bar?.y ?? 0) + (bar?.height ?? 0) + 1);
        expect(box.over).toBeLessThanOrEqual(1);
      }
    });
  });
}
