import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pageGraph } from './manifest.ts';

/**
 * Accessibility at a stable checkpoint: the page as it loads, before any scene
 * animation starts. Mid-animation states are checked by hand, per docs/testing.md.
 */
for (const entry of pageGraph()) {
  test(`${entry.url} has no accessibility violations on load`, async ({ page }) => {
    await page.goto(entry.url);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  });
}
