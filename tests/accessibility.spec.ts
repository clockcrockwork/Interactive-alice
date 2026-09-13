import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { holdAt } from './drive.ts';
import { pageGraph, sentencesOf } from './manifest.ts';

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

/** The shape `ariaSnapshotJSON` returns, to the depth this needs. */
interface AriaNode {
  role?: string;
  text?: string;
  children?: (AriaNode | string)[];
}

/** Every paragraph's accessible text, in document order. */
function paragraphs(
  node: AriaNode | string | (AriaNode | string)[],
  found: string[] = [],
): string[] {
  if (typeof node === 'string') {
    return found;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      paragraphs(child, found);
    }
    return found;
  }
  if (node.role === 'paragraph') {
    found.push(node.text ?? '');
  }
  for (const child of node.children ?? []) {
    paragraphs(child, found);
  }
  return found;
}

/**
 * Every staged sentence stays in the accessibility tree while a scene runs.
 *
 * A staged scene shows one beat at a time and hides the rest, and *how* it hides
 * them decides whether a screen reader still has the story. Opacity leaves the
 * text in the accessibility tree; `visibility`, `display`, `aria-hidden` and
 * `inert` each take it out. So this reads the accessibility tree itself rather
 * than the rendered text: counting rendered lines would catch the first two and
 * quietly pass the last two.
 *
 * The comparison is the whole ordered list against the whole ordered list, not
 * membership and a count. Narrative text repeats — a cry said twice, a sentence
 * that contains another — and under membership a repeated sentence can cover for
 * a missing one, or a replaced paragraph can pass because some other staged
 * sentence happens to contain its words. Neither is hypothetical in a story.
 *
 * The difference is invisible on load, where a scene is at progress 0 and most of
 * it is in one state anyway, so each scene is driven into the middle of itself and
 * asked again. Written after a review round in which hiding inactive shots with
 * `visibility: hidden` removed two thirds of the chapter and only an unrelated
 * load-time assertion noticed.
 */
for (const entry of pageGraph().filter((page) => page.kind === 'part')) {
  test(`${entry.url} keeps every staged segment in the accessibility tree`, async ({ page }) => {
    await page.goto(`${entry.url}?probe=1`);
    const segments = entry.segments ?? [];
    // `sentencesOf` answers per chapter, and a page stages part of one, so the
    // expectation is the staged ids in the order the page must present them.
    const authored = sentencesOf(entry.locale ?? '', segments);
    const staged = segments.map((id) => authored[id] ?? '');

    for (const sceneId of entry.scenes ?? []) {
      for (const point of [0.25, 0.5, 0.9, 1]) {
        await holdAt(page, sceneId, point);
        const tree = (await page.locator('.story').ariaSnapshotJSON()) as AriaNode[];

        expect(paragraphs(tree), `${sceneId} at ${point}`).toEqual(staged);
      }
    }
  });
}
