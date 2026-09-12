import { expect, test } from '@playwright/test';

const LOCALES = ['en-simple', 'ja'] as const;
const PART = 'rabbit-hole';

test('the home page offers every locale', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  for (const locale of LOCALES) {
    await expect(page.locator(`a[lang="${locale}"]`)).toHaveAttribute(
      'href',
      `./${locale}/${PART}/`,
    );
  }
  expect(errors).toEqual([]);
});

for (const locale of LOCALES) {
  test(`${locale}: the part page loads its scene in reading order`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`./${locale}/${PART}/`);

    const story = page.locator('.story');
    await expect(story).toHaveAttribute('data-locale', locale);
    await expect(story).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('h1')).not.toBeEmpty();

    await expect(page.locator('.scene[data-scene="rabbit-hole"] .shot')).toHaveCount(5);
    await expect(page.locator('.beat')).toHaveCount(21);
    await expect(page.locator('.line')).toHaveCount(44);

    const segments = await page
      .locator('.line')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-segment')));
    expect(segments[0]).toBe('ch01.s0200');
    expect(segments.at(-1)).toBe('ch01.s0630');
    expect([...segments].sort()).toEqual(segments);

    // Every sentence carries text in this locale, and no line is empty.
    const lines = await page.locator('.line').allInnerTexts();
    expect(lines.filter((line) => line.trim().length === 0)).toEqual([]);

    expect(errors).toEqual([]);
  });

  test(`${locale}: shot and beat spans cover the scene once, in order`, async ({ page }) => {
    await page.goto(`./${locale}/${PART}/`);

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
