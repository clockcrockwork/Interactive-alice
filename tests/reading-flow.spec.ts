/**
 * The reading flow, as assistive technology meets it: as the reader scrolls from
 * beat to beat, the sentences now shown are in the accessibility tree and the ones
 * not shown are not; and a control that leaves after it is pressed does not leave
 * the keyboard's focus on a hidden element. What can be automated; a run with
 * VoiceOver and NVDA is still a person's job (docs/testing.md).
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, demos } from './demo-helpers.ts';

/** Each staged beat's sentences, in order, as the page carries them. */
const beatsOf = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.demo__stage .demo-beat')].map((beat) => ({
      cue: beat.getAttribute('data-cue') ?? '',
      lines: [...beat.querySelectorAll('.line')].map((line) => line.textContent?.trim() ?? ''),
    })),
  );

for (const id of ['riverbank', 'mock-turtle']) {
  const demo = demos.find((candidate) => candidate.demo === id);
  test(`${id}: the shown beat's sentences are in the accessibility tree, and no other beat's`, async ({
    page,
  }) => {
    test.skip(!demo, `no ${id} demo in this build`);
    test.slow();
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    const beats = await beatsOf(page);
    // The opening, a beat in the middle, and the end; and back.
    const visits = [0, Math.floor(beats.length / 2), beats.length - 1, 1];
    for (const index of visits) {
      const beat = beats[index];
      if (!beat) {
        continue;
      }
      await page.evaluate(([at, count]) => window.__aliceDemo?.seek((at + 0.6) / count), [
        index,
        beats.length,
      ] as const);
      await expect.poll(() => page.evaluate(() => window.__aliceDemo?.beat())).toBe(index);
      const tree = await page.locator('.demo__captions').ariaSnapshot();
      for (const line of beat.lines) {
        expect(tree, `beat ${index} (${beat.cue}) is read`).toContain(line.slice(0, 24));
      }
      for (const [other, rest] of beats.entries()) {
        if (other === index) {
          continue;
        }
        for (const line of rest.lines) {
          // A sentence shared word for word with the shown beat's would be read anyway.
          if (beat.lines.some((shown) => shown.includes(line))) {
            continue;
          }
          expect(tree, `beat ${other} (${rest.cue}) is not read on beat ${index}`).not.toContain(
            line,
          );
        }
      }
    }
  });
}

/** Where the keyboard's focus is: on something shown, or on the stage itself. */
const focusIsShown = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) {
      return 'body';
    }
    if (active.classList.contains('demo__stage')) {
      return 'stage';
    }
    return active.checkVisibility({ visibilityProperty: true, opacityProperty: true })
      ? 'shown'
      : `hidden: ${active.className}`;
  });

const pressByKeyboard = [
  { id: 'croquet', cue: 'gardeners', within: 0.4, control: '.cq__prop--hide' },
  { id: 'lobster-quadrille', cue: 'try', within: 0.5, control: '.lq__prop--join' },
];

for (const { id, cue, within, control } of pressByKeyboard) {
  const demo = demos.find((candidate) => candidate.demo === id);
  test(`${id}: a control that leaves once pressed does not leave focus on a hidden element`, async ({
    page,
  }) => {
    test.skip(!demo, `no ${id} demo in this build`);
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await atCue(page, cue, within);
    const button = page.locator(control);
    await expect(button).toBeVisible();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toBeHidden();
    // Past the fade: the button is hidden now, and focus is not on it.
    await page.waitForTimeout(400);
    expect(await focusIsShown(page)).toMatch(/^(shown|stage)$/);
    // The keyboard goes on from there into the page, not from the top.
    await page.keyboard.press('Tab');
    expect(await focusIsShown(page)).toBe('shown');
  });
}
