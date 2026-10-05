import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { lonelyLetter, namedWords } from '../../src/demos/shell/words.ts';
import { atCue, collectErrors, demos, pages } from '../demo-helpers.ts';

/**
 * The demos in Japanese: the index and its language switch, and every place a
 * demo reads something out of its sentences, read the Japanese way (words set
 * apart in quotation marks rather than by capitals). The words themselves are
 * never written here: they come from the page and the text layer.
 */
const LOCALE = 'ja';
const ja = (id: string) => demos.find((d) => d.demo === id && d.locale === LOCALE);
const index = pages.find((page) => page.kind === 'demos' && page.locale === LOCALE);
const baseIndex = pages.find((page) => page.kind === 'demos' && page.locale !== LOCALE);
const ui = (
  JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', '..', 'text', 'locales', LOCALE, 'ui.json'),
      'utf8',
    ),
  ) as { strings: Record<string, string> }
).strings;
const OPEN = '「';
const CLOSE = '」';

test.describe('the demos in Japanese', () => {
  test.skip(!index, 'no Japanese demo index in this build');

  test('the index: its own words, every card, and a language switch both ways', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(index?.url ?? '');
    await expect(page.locator('html')).toHaveAttribute('lang', LOCALE);
    await expect(page.locator('h1')).toHaveText(ui.demosTitle ?? '-');
    const links = page.locator('.demos__card a');
    await expect(links).toHaveCount(index?.published?.length ?? -1);
    for (const id of index?.published ?? []) {
      await expect(page.locator(`.demos__card[data-demo="${id}"] a`)).toHaveAttribute(
        'href',
        `./${id}/`,
      );
    }
    // The switch is a link, and the way back is one too.
    const switcher = page.locator('.demos__languages');
    await expect(switcher).toHaveAttribute('aria-label', ui.demoLanguages ?? '-');
    await expect(switcher.locator(`a[lang="${LOCALE}"]`)).toHaveAttribute('aria-current', 'page');
    await switcher.locator(`a[lang="${baseIndex?.locale}"]`).click();
    await expect(page).toHaveURL(/\/demos\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', baseIndex?.locale ?? '-');
    await page.locator(`.demos__languages a[lang="${LOCALE}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/demos/${LOCALE}/$`));
    // And a card leads to that demo in Japanese.
    await page.locator('.demos__card[data-demo="riverbank"] a').click();
    await expect(page).toHaveURL(new RegExp(`/demos/${LOCALE}/riverbank/$`));
    await expect(page.locator('.demo__back')).toHaveText(ui.demoBack ?? '-');
    expect(errors).toEqual([]);
  });

  test('the Mock Turtle writes his quoted subjects on the sand', async ({ page }) => {
    const turtle = ja('mock-turtle');
    test.skip(!turtle, 'no Japanese mock-turtle page');
    await page.goto(turtle?.url ?? '');
    await atCue(page, 'drawling', 0.6);
    const said = await page
      .locator('.demo-beat[data-cue="drawling"] .line[data-speaker="mock-turtle"]')
      .allTextContents();
    const expected = [...new Set(said.flatMap((text) => namedWords(text)))];
    expect(expected.length).toBeGreaterThan(1);
    for (const word of expected) {
      expect(said.join('')).toContain(`${OPEN}${word}${CLOSE}`);
    }
    const written = await page
      .locator('.mt__group[data-cue="drawling"] .mt__subject')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.word));
    expect(written).toEqual(expected);
  });

  test('the Dormouse floats the kana it sets apart, and it becomes a picture', async ({ page }) => {
    const dormouse = ja('dormouse');
    test.skip(!dormouse, 'no Japanese dormouse page');
    await page.goto(dormouse?.url ?? '');
    const doze = await page.locator('.demo-beat[data-cue="doze"] .line').allTextContents();
    const letter = lonelyLetter(doze);
    expect([...letter]).toHaveLength(1);
    expect(doze.join('')).toContain(`${OPEN}${letter}${CLOSE}`);
    await atCue(page, 'muchness', 0.5);
    await expect(page.locator('.dm__letters .dm__letter').first()).toHaveText(letter);
    await page.locator('.dm__prop-m').click();
    await expect(page.locator('.dm__letter[data-picture] svg')).toHaveCount(1);
    await expect(page.locator('.dm__prop-m')).toHaveText(ui.demoDrawM ?? '-');
  });

  test('the Cheshire Cat: the second answer is a lid, drawn in the moon', async ({ page }) => {
    const cat = ja('cheshire-cat');
    test.skip(!cat, 'no Japanese cheshire-cat page');
    await page.goto(cat?.url ?? '');
    await atCue(page, 'again', 0.7);
    const second = page.locator('.cc__prop--fig');
    await expect(second).toHaveAttribute('data-shown', '');
    await expect(second).toHaveText(ui.demoFig ?? '-');
    // The answer the page's own sentence sets apart.
    const asked = await page.locator('.demo-beat[data-cue="again"]').textContent();
    expect(asked).toContain(`${OPEN}${ui.demoFig}${CLOSE}`);
    await second.click();
    const moon = page.locator('.cc__moon-picture');
    await expect(moon).toHaveAttribute('data-picture', 'lid');
    await expect(moon.locator('svg')).toHaveCount(1);
    await expect(moon.locator('text')).toHaveCount(0);
  });

  test('the Duchess stitches each moral on a ribbon, after her colon or as her sentence', async ({
    page,
  }) => {
    const duchess = ja('duchess');
    test.skip(!duchess, 'no Japanese duchess page');
    await page.goto(duchess?.url ?? '');
    await atCue(page, 'seem', 0.9);
    await expect(page.locator('.dc__ribbon[data-shown]')).toHaveCount(5);
    const expected = await page.evaluate(() =>
      ['chin', 'sense', 'feather', 'mine', 'seem'].map((cue) => {
        const lines = [
          ...document.querySelectorAll<HTMLElement>(`.demo-beat[data-cue="${cue}"] .line`),
        ].filter((line) => line.dataset.speaker === 'duchess');
        const withColon = lines.find((line) => /[:：]/.test(line.textContent ?? ''));
        return withColon
          ? { colon: true, text: (withColon.textContent ?? '').split(/[:：]/).slice(1).join('') }
          : { colon: false, text: lines.at(-1)?.textContent ?? '' };
      }),
    );
    // Four of hers carry a colon; one moral is a sentence of its own.
    expect(expected.filter((moral) => moral.colon)).toHaveLength(4);
    const words = await page.locator('.dc__ribbon-words').allTextContents();
    expect(words.map((w) => w.trim())).toEqual(expected.map((moral) => moral.text.trim()));
  });

  test("the Mouse's tale is the verses' own words, every one of them, down the tail", async ({
    page,
  }) => {
    const tale = ja('mouse-tale');
    test.skip(!tale, 'no Japanese mouse-tale page');
    await page.goto(tale?.url ?? '');
    await atCue(page, 'fury-four', 0.95);
    const verses = await page.locator('.demo-beat[data-cue^="fury-"] .line').allTextContents();
    const tail = await page.locator('.mt__tail text').allTextContents();
    const squash = (parts: string[]) => parts.join('').replace(/\s+/g, '');
    expect(squash(tail)).toBe(squash(verses));
    // In groups of a few phrases, not one line per sentence.
    expect(tail.length).toBeGreaterThan(verses.length);
  });
});
