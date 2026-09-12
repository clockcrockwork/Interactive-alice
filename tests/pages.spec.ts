import { expect, test } from '@playwright/test';
import { locales, pageGraph } from './manifest.ts';

const pages = pageGraph();

for (const page of pages) {
  test(`${page.url} loads without errors`, async ({ page: browserPage }) => {
    const errors: string[] = [];
    browserPage.on(
      'console',
      (message) => message.type() === 'error' && errors.push(message.text()),
    );
    browserPage.on('pageerror', (error) => errors.push(error.message));
    browserPage.on('requestfailed', (request) =>
      errors.push(`${request.method()} ${request.url()} failed`),
    );

    await browserPage.goto(page.url);
    await expect(browserPage.locator('h1')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test('the home page links to every locale entry', async ({ page }) => {
  await page.goto('./');
  for (const locale of locales()) {
    await expect(page.locator(`a[lang="${locale}"]`)).toHaveAttribute('href', `./${locale}/`);
  }
});

for (const entry of pages.filter((page) => page.kind === 'locale')) {
  test(`${entry.url} lists this language's documents`, async ({ page }) => {
    await page.goto(entry.url);
    await expect(page.locator('.entry')).toHaveAttribute('data-locale', entry.locale ?? '');

    const parts = pages.filter(
      (candidate) => candidate.kind === 'part' && candidate.locale === entry.locale,
    );
    await expect(page.locator('.entry__parts a')).toHaveCount(parts.length);
    for (const part of parts) {
      await expect(page.locator(`.entry__parts a[href="./${part.part}/"]`)).toHaveCount(1);
    }
  });
}

for (const entry of pages.filter((page) => page.kind === 'part')) {
  test(`${entry.url} presents its scene in reading order`, async ({ page }) => {
    await page.goto(entry.url);

    const story = page.locator('.story');
    await expect(story).toHaveAttribute('data-locale', entry.locale ?? '');
    await expect(story).toHaveAttribute('data-ready', 'true');

    await expect(page.locator('.shot')).toHaveCount(entry.shots ?? 0);
    await expect(page.locator('.beat')).toHaveCount(entry.beats ?? 0);
    await expect(page.locator('.line')).toHaveCount(entry.segments?.length ?? 0);

    // The order the data says, not an incidental sort of the ids.
    const rendered = await page
      .locator('.line')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-segment')));
    expect(rendered).toEqual(entry.segments);

    const lines = await page.locator('.line').allInnerTexts();
    expect(lines.filter((line) => line.trim().length === 0)).toEqual([]);
  });

  test(`${entry.url} covers the scene once with its spans`, async ({ page }) => {
    await page.goto(entry.url);

    for (const selector of ['.shot', '.beat']) {
      const spans = await page.locator(selector).evaluateAll((nodes) =>
        nodes.map((node) => ({
          start: Number(node.getAttribute('data-start')),
          end: Number(node.getAttribute('data-end')),
        })),
      );
      expect(spans[0]?.start).toBe(0);
      expect(spans.at(-1)?.end).toBeCloseTo(1, 5);
      for (const [index, span] of spans.entries()) {
        expect(span.end).toBeGreaterThan(span.start);
        if (index > 0) {
          expect(span.start).toBeCloseTo(spans[index - 1]?.end ?? -1, 6);
        }
      }
    }
  });
}
