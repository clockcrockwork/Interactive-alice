import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { holdAt } from './drive.ts';
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

/**
 * The whole chapter stays available while a scene is staged.
 *
 * A staged scene shows one beat at a time, and the runtime hides the rest. *How*
 * it hides them decides whether a screen reader still has the story: opacity
 * leaves the text in the accessibility tree, `visibility` or `display` take it
 * out. The difference is invisible on load, when the scene is at progress 0 and
 * most of it is in the same state anyway, so this drives each scene into the
 * middle of itself and asks again. Written after a review round in which hiding
 * inactive shots with `visibility: hidden` removed most of the chapter and only
 * an unrelated load-time assertion noticed.
 */
for (const entry of pageGraph().filter((page) => page.kind === 'part')) {
  test(`${entry.url} keeps its text readable mid-scene`, async ({ page }) => {
    await page.goto(`${entry.url}?probe=1`);
    const expected = entry.segments?.length ?? 0;

    for (const sceneId of entry.scenes ?? []) {
      for (const point of [0.25, 0.5, 0.9, 1]) {
        await holdAt(page, sceneId, point);

        // Rendered text, which excludes anything `visibility` or `display` has
        // taken out of the box tree, and with it out of the accessibility tree.
        const readable = (await page.locator('.line').allInnerTexts()).filter(
          (line) => line.trim().length > 0,
        );
        expect(readable, `${sceneId} at ${point}`).toHaveLength(expected);
      }
    }
  });
}
