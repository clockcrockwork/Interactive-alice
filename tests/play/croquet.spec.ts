/**
 * The croquet demo's play: the flamingo's mood (left alone it falls, a stroke
 * raises it, the motion pause holds it), the cards turned over, the procession
 * by suit and the executioner's swing; and the fixes the review asked for.
 */

import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

const demo = demos.find((d) => d.demo === 'croquet');
const FLAMINGO = '.cq__flamingo';

test.describe('croquet: the flamingo mood', () => {
  test.skip(!demo, 'no croquet demo page in the build');

  test('falls while the flamingo is left alone and rises when stroked', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'flamingo', 0.5);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-mood-live', '');
    const first = await customProperty(page, FLAMINGO, '--mood');
    expect(first).toBeGreaterThan(0.5);
    await page.waitForTimeout(4000);
    const later = await customProperty(page, FLAMINGO, '--mood');
    expect(later).toBeLessThan(first - 0.15);
    const stroke = page.getByRole('button', { name: 'Stroke the flamingo' });
    await expect(stroke).toBeVisible();
    await stroke.click();
    await expect
      .poll(() => customProperty(page, FLAMINGO, '--mood'), { timeout: 2000 })
      .toBeGreaterThan(Math.min(later + 0.2, 0.95));
  });

  test('stops falling while the motion is paused', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'flamingo', 0.5);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-mood-live', '');
    await page.locator('.demo__motion').click();
    await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
    const first = await customProperty(page, FLAMINGO, '--mood');
    await page.waitForTimeout(1500);
    const later = await customProperty(page, FLAMINGO, '--mood');
    expect(later).toBe(first);
  });

  test('is reset outside the game, and a sulk makes the strike miss', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'arches', 0.5);
    await expect(page.locator(FLAMINGO)).not.toHaveAttribute('data-mood-live', '');
    expect(await customProperty(page, FLAMINGO, '--mood')).toBe(1);
    await atCue(page, 'flamingo', 0.5);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-mood-live', '');
    // Thirteen seconds alone and it sulks; the status says so at the first miss.
    await expect
      .poll(() => page.locator(FLAMINGO).getAttribute('data-mood'), { timeout: 20_000 })
      .toBe('sulking');
    await page.getByRole('button', { name: 'Strike the hedgehog' }).first().click();
    await expect(page.locator('.demo__status')).toHaveText(/sulks/);
  });
});

/** A speaker's sentence in a beat, as the page carries it. */
const lineOf = (page: Page, cue: string, speaker?: string) =>
  page.evaluate(
    ([c, s]) => {
      const beat = document.querySelector(`.demo-beat[data-cue="${c}"]`);
      const lines = [...(beat?.querySelectorAll<HTMLElement>('.line') ?? [])].filter(
        (line) => !s || line.dataset.speaker === s,
      );
      return (lines[0]?.textContent ?? '').trim();
    },
    [cue, speaker ?? ''] as const,
  );

test.describe('croquet: the review fixes', () => {
  test.skip(!demo, 'no croquet demo page in the build');

  test('the flamingo is in her hands for its own sentence, looking up in her face', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hedgehog', 0.3);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-puzzled', '');
    await expect(page.locator('.cq__prop--catch')).toBeHidden();
    const box = await page.locator('.cq__hold').boundingBox();
    const height = page.viewportSize()?.height ?? 720;
    expect((box?.y ?? height) + 10).toBeLessThan(height);
    // It goes off across the garden while they quarrel, and can be caught.
    await atCue(page, 'quarrel', 0.5);
    await expect(page.locator('.cq__prop--catch')).toBeVisible();
    await page.locator('.cq__prop--catch').click();
    await expect(page.locator('.cq__prop--catch')).toBeHidden();
  });

  test('the ground is pointer play, and in the quarrel it stirs the quarrel up', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const tap = page.locator('.cq__ground-tap');
    await expect(tap).toHaveAttribute('tabindex', '-1');
    await atCue(page, 'quarrel', 0.5);
    await expect(tap).toHaveAttribute('data-mode', 'shout');
    const stir = await page.evaluate(
      () =>
        (
          JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<
            string,
            string
          >
        ).demoStirQuarrel,
    );
    await expect(tap).toHaveAttribute('aria-label', stir ?? '');
    await expect(page.locator('.cq__prop--stir')).toBeVisible();
    await page.locator('.cq__prop--stir').click();
    await expect(page.locator('.demo__status')).toHaveText(
      await lineOf(page, 'fury', 'queen-of-hearts'),
    );
    await atCue(page, 'grin', 0.5);
    await expect(page.locator('.cq__prop--stir')).toBeHidden();
  });

  test('a tap on the crawling hedgehog rolls it up, through the ground tap target', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'flamingo', 0.8);
    const hedgehog = page.locator('.cq__hedgehog').first();
    await expect(hedgehog).toHaveAttribute('data-walking', '', { timeout: 8000 });
    const box = await hedgehog.boundingBox();
    if (!box) {
      throw new Error('the hedgehog is not on the ground');
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(hedgehog).not.toHaveAttribute('data-walking', '');
  });

  test('the story speaks for itself: hiding the gardeners and catching the flamingo say nothing', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'play', 0.3);
    await atCue(page, 'fury', 0.3);
    const said = await page.evaluate(
      () => document.querySelector('.demo__status')?.textContent ?? '',
    );
    expect(said).toBe('');
  });

  test('the Cat is not there before its grin, and its pupils come with its eyes', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const cat = page.locator('.cq__cat');
    await atCue(page, 'fury', 0.5);
    await expect(page.locator('.cq__air')).toHaveAttribute('data-off', '');
    await cat.focus().catch(() => undefined);
    expect(await page.evaluate(() => document.activeElement?.classList.contains('cq__cat'))).toBe(
      false,
    );
    const opacity = (sel: string) =>
      page.evaluate(
        (s) => Number(getComputedStyle(document.querySelector(s) as Element).opacity),
        sel,
      );
    await atCue(page, 'grin', 0.9);
    await expect.poll(() => opacity('.cq__cat-grin'), { timeout: 8000 }).toBeGreaterThan(0.9);
    expect(await opacity('.cq__cat-pupils')).toBeLessThan(0.05);
    await atCue(page, 'eyes', 0.9);
    await expect.poll(() => opacity('.cq__cat-pupils'), { timeout: 8000 }).toBeGreaterThan(0.9);
  });

  test('the flower-pot never stands in front of the procession', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    for (const name of ['who', 'these', 'head', 'consider', 'gardeners', 'play']) {
      await atCue(page, name, 0.8);
      // In front means nearer the camera (a greater z) and over it on the screen.
      const hidden = await page.evaluate(() => {
        const potEl = document.querySelector<HTMLElement>('.cq__pot');
        const pot = potEl?.getBoundingClientRect();
        const potZ = Number(potEl?.style.getPropertyValue('--z'));
        if (!pot) {
          return 0;
        }
        return [...document.querySelectorAll<HTMLElement>('.cq__marcher')].filter((marcher) => {
          const m = marcher.getBoundingClientRect();
          return (
            potZ > Number(marcher.style.getPropertyValue('--z')) &&
            m.right > 0 &&
            m.left < innerWidth &&
            pot.left < m.right &&
            m.left < pot.right &&
            pot.top < m.bottom &&
            m.top < pot.bottom
          );
        }).length;
      });
      expect(hidden, name).toBe(0);
    }
  });
});

test.describe('croquet: the new play', () => {
  test.skip(!demo, 'no croquet demo page in the build');

  test('the gardeners lie on their faces, and a card can be turned over', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    const turn = page.locator('.cq__prop--turn');
    await atCue(page, 'who', 0.5);
    await expect(turn).toBeHidden();
    await atCue(page, 'these', 0.8);
    await expect(turn).toBeVisible();
    await expect(page.locator('.cq__gardener .cq__back')).toHaveCount(3);
    const turned = (n: number) =>
      page.evaluate(
        (i) =>
          Number(
            document
              .querySelectorAll<HTMLElement>('.cq__gardener')
              [i]?.style.getPropertyValue('--turn') || 0,
          ),
        n,
      );
    await turn.click();
    await expect.poll(() => turned(0), { timeout: 15_000 }).toBeGreaterThan(0.95);
    // A tap on another turns that one.
    await page.locator('.cq__gardener').nth(2).dispatchEvent('click');
    await expect.poll(() => turned(2), { timeout: 15_000 }).toBeGreaterThan(0.95);
    // Back before the question: nobody has been turned.
    await atCue(page, 'flat', 0.9);
    expect(await turned(0)).toBe(0);
    await expect(turn).toBeHidden();
  });

  test('the procession comes by suit, and the Knave carries the crown on its cushion', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'crown', 0.7);
    for (const sel of ['.cq__soldier', '.cq__courtier', '.cq__child']) {
      expect(await page.locator(sel).count(), sel).toBeGreaterThan(2);
    }
    await expect(page.locator('.cq__knave .cq__cushion svg')).toBeVisible();
  });

  test('the executioner swings at the air under the head, which bobs out of reach', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'king', 0.5);
    await expect(page.locator('.cq__executioner')).toHaveAttribute('data-off', '');
    await atCue(page, 'argument', 0.7);
    await expect(page.locator('.cq__executioner')).not.toHaveAttribute('data-off', '');
    await expect
      .poll(() => customProperty(page, '.cq__executioner', '--swing'), { timeout: 8000 })
      .toBeCloseTo(0.5, 1);
    await expect
      .poll(() => customProperty(page, '.cq__cat', '--bob'), { timeout: 8000 })
      .toBeCloseTo(1, 1);
    // He goes for the Duchess and comes back with her.
    await scrollTo(page, 1);
    await expect(page.locator('.cq__duchess')).not.toHaveAttribute('data-off', '');
    await expect(page.locator('.cq__executioner')).toHaveAttribute('data-running', '');
  });
});

test.describe('croquet under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test.skip(!demo, 'no croquet demo page in the build');

  test('the settled beats show the puzzled look and the swing held under the head', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hedgehog', 0);
    await expect(page.locator(FLAMINGO)).toHaveAttribute('data-puzzled', '');
    await atCue(page, 'argument', 0);
    expect(await customProperty(page, '.cq__executioner', '--swing')).toBeCloseTo(0.5, 1);
    expect(await customProperty(page, '.cq__cat', '--bob')).toBeCloseTo(1, 1);
  });
});

/** The page's own UI labels, as the build wrote them into `#demo-ui`. */
const uiLabels = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<string, string>,
  );

test.describe('croquet: what the status line says', () => {
  test.skip(!demo, 'no croquet demo page in the build');

  test('a card turned over by its button says what is on its face, not the button again', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const ui = await uiLabels(page);
    expect(ui.demoCardTurned).toBeTruthy();
    expect(ui.demoCardTurned).not.toBe(ui.demoTurnCard);
    await atCue(page, 'these', 0.8);
    const turn = page.locator('.cq__prop--turn');
    await expect(turn).toBeVisible();
    await expect(turn).toHaveAccessibleName(ui.demoTurnCard ?? '');
    await turn.click();
    const status = page.locator('.demo__status');
    await expect(status).toHaveText(ui.demoCardTurned ?? '');
    await expect(status).not.toHaveText(ui.demoTurnCard ?? '');
  });

  test.describe('with the flamingo held still', () => {
    // Under reduced motion the flamingo never twists up to look at her, so a
    // fresh strike always lands.
    test.use({ reducedMotion: 'reduce' });

    test('a strike by its button says where the hedgehog went, not the button again', async ({
      page,
    }) => {
      await page.goto(demo?.url ?? '');
      const ui = await uiLabels(page);
      expect(ui.demoStruck).toBeTruthy();
      expect(ui.demoStruck).not.toBe(ui.demoStrike);
      await atCue(page, 'flamingo', 0.5);
      const strike = page.locator('.cq__prop--strike');
      await expect(strike).toBeVisible();
      await expect(strike).toHaveAccessibleName(ui.demoStrike ?? '');
      await expect(page.locator(FLAMINGO)).not.toHaveAttribute('data-mood', 'sulking');
      await strike.click();
      const status = page.locator('.demo__status');
      await expect(status).toHaveText(ui.demoStruck ?? '');
      await expect(status).not.toHaveText(ui.demoStrike ?? '');
    });
  });
});
