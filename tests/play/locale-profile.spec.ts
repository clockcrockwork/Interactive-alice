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
        significantSpaces: settings.significantSpaces,
        tag: settings.numbers,
      });
      const style = await page
        .locator('.line[data-kind="dialogue"]')
        .first()
        .evaluate((line) => getComputedStyle(line).fontStyle);
      expect(style).toBe(settings.emphasis === 'italic' ? 'italic' : 'normal');
    });

    test("the jury marks its slates with this language's yes and no", async ({ page }) => {
      const trial = at('trial');
      test.skip(!trial, `no trial page in ${locale}`);
      await page.goto(trial?.url ?? '');
      const shapes = (verdict: string) =>
        page
          .locator(`.tr__mark--${verdict}`)
          .evaluateAll((marks) => [
            ...new Set(marks.map((mark) => mark.getAttribute('data-shape'))),
          ]);
      expect(await shapes('yes')).toEqual([realia.marks.yes]);
      expect(await shapes('no')).toEqual([realia.marks.no]);
      // Drawn as shapes, a little larger than the scribble's line, never lettering.
      const box = await page
        .locator('.tr__mark--yes')
        .first()
        .evaluate((mark) => {
          const { width, height } = (mark as SVGGraphicsElement).getBBox();
          return { width, height };
        });
      expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(13);
      await expect(page.locator('.tr__slate text')).toHaveCount(0);
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

  if (settings.emphasis !== 'italic') {
    // Where the script has no italic, nothing on any demo page is set in one: not a
    // speaker's line, not a narrator's, not a word a demo draws. Every element of the
    // page, every beat, both widths.
    for (const viewport of [
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'phone', width: 390, height: 780 },
    ]) {
      test.describe(`${locale}: no italic at ${viewport.name}`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } });
        for (const entry of demos.filter((candidate) => candidate.locale === locale)) {
          test(`${entry.demo}`, async ({ page }) => {
            await page.goto(entry.url);
            await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
            const count = await page.locator('.demo__stage .demo-beat').count();
            const slanted = new Set<string>();
            for (let beat = 0; beat < count; beat += 1) {
              for (const found of await page.evaluate(
                ([index, total]) => {
                  window.__aliceDemo?.seek((index + 0.6) / total);
                  return (
                    [...document.querySelectorAll<HTMLElement>('body *')]
                      // Elements that set text of their own; an empty <i> drawn as a
                      // twinkle has no letters to slant.
                      .filter((el) =>
                        [...el.childNodes].some(
                          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
                        ),
                      )
                      .filter((el) => getComputedStyle(el).fontStyle !== 'normal')
                      .map((el) =>
                        `${el.tagName.toLowerCase()} ${el.getAttribute('class') ?? ''} ${
                          el.dataset.segment ?? ''
                        }`.trim(),
                      )
                  );
                },
                [beat, count] as const,
              )) {
                slanted.add(found);
              }
            }
            expect([...slanted]).toEqual([]);
          });
        }
      });
    }
  }

  test.describe(`${locale}: the phone bar`, () => {
    // The chrome's floor: every pill a 24-pixel target with a label of 12 pixels or
    // more, and a bar that wraps to a second row rather than shrink below it.
    for (const width of [320, 390, 430]) {
      for (const touch of [false, true]) {
        test(`at ${width} pixels${touch ? ', on a touch screen' : ''}, every pill keeps the floor`, async ({
          browser,
        }) => {
          const demo = at('mock-turtle');
          test.skip(!demo, `no mock-turtle page in ${locale}`);
          const context = await browser.newContext({
            viewport: { width, height: 700 },
            hasTouch: touch,
            isMobile: touch,
          });
          const page = await context.newPage();
          await page.goto(demo?.url ?? '');
          await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
          const bar = await page.locator('.demo__bar').evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
          });
          const pills = await page
            .locator(
              '.demo__bar :is(.demo__back, .demo__motion, .demo__sound, .demo__tilt):visible',
            )
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const r = node.getBoundingClientRect();
                return {
                  label: node.textContent ?? '',
                  left: r.left,
                  right: r.right,
                  top: r.top,
                  bottom: r.bottom,
                  font: Number.parseFloat(getComputedStyle(node).fontSize),
                  over: node.scrollWidth - node.clientWidth,
                };
              }),
            );
          expect(pills.length).toBeGreaterThan(2);
          if (touch) {
            // The tilt control is offered on a touch screen: four pills.
            expect(pills).toHaveLength(4);
          }
          for (const pill of pills) {
            expect(pill.right - pill.left, pill.label).toBeGreaterThanOrEqual(24);
            expect(pill.bottom - pill.top, pill.label).toBeGreaterThanOrEqual(24);
            expect(pill.font, pill.label).toBeGreaterThanOrEqual(12);
            expect(pill.over, pill.label).toBeLessThanOrEqual(1);
            expect(pill.left, pill.label).toBeGreaterThanOrEqual(0);
            expect(pill.right, pill.label).toBeLessThanOrEqual(width);
            expect(pill.top, pill.label).toBeGreaterThanOrEqual(bar.top - 1);
            expect(pill.bottom, pill.label).toBeLessThanOrEqual(bar.bottom + 1);
            // A label stays on one line: no pill is taller than one line of it.
            expect(pill.bottom - pill.top, pill.label).toBeLessThan(pill.font * 2.4);
          }
          // No two pills overlap: a full row wraps instead.
          for (const [i, a] of pills.entries()) {
            for (const b of pills.slice(i + 1)) {
              const apart =
                a.right <= b.left + 1 ||
                b.right <= a.left + 1 ||
                a.bottom <= b.top + 1 ||
                b.bottom <= a.top + 1;
              expect(apart, `${a.label} / ${b.label}`).toBe(true);
            }
          }
          // What sits under the bar knows how tall it is.
          const declared = await page
            .locator('.demo')
            .evaluate((el) => Number.parseFloat(el.style.getPropertyValue('--demo-bar-height')));
          expect(Math.abs(declared - (bar.bottom - bar.top))).toBeLessThanOrEqual(1);
          await context.close();
        });
      }
    }
  });
}
