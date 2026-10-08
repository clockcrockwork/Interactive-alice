import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

/**
 * A Caucus-race: taps reach the runners, the prizes can be handed round by hand,
 * by keyboard and by button, the Dodo is pushed in on as he thinks, and the
 * thimble ends in Alice's hand.
 */
const demo = demos.find((d) => d.demo === 'caucus-race');
const runner = (page: Page, kind: string) => page.locator(`.cr__runner[data-kind="${kind}"]`);

/** Which runner, if any, a real pointer at this runner's centre would land on. */
const landsOn = (page: Page, kind: string) =>
  page.evaluate((k) => {
    const el = document.querySelector(`.cr__runner[data-kind="${k}"]`);
    const box = el?.getBoundingClientRect();
    if (!box) {
      return '';
    }
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height * 0.7);
    return (
      (hit?.closest('.cr__runner') as HTMLElement | null)?.dataset.kind ?? hit?.className ?? ''
    );
  }, kind);

test.describe('the Caucus-race', () => {
  test.skip(!demo, 'no caucus-race page in this build');

  test('a real tap reaches a runner: no layer over the ring takes it', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'proposal', 0.5);
    // Some runner is under the pointer, never a layer; a click there toggles it.
    const kinds = ['dodo', 'duck', 'lory', 'eaglet', 'mouse', 'alice', 'crab', 'magpie'];
    let hitKind = '';
    for (const kind of kinds) {
      const hit = await landsOn(page, kind);
      expect(hit, `pointer over the ${kind}`).not.toMatch(/demo__layer/);
      if (!hitKind && kinds.includes(hit)) {
        hitKind = hit;
      }
    }
    expect(hitKind).not.toBe('');
    const target = runner(page, hitKind);
    const box = await target.boundingBox();
    await expect(target).toHaveAttribute('aria-pressed', 'false');
    await page.mouse.click(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) * 0.7,
    );
    await expect(target).toHaveAttribute('aria-pressed', 'true');
  });

  test('the prizes: one comfit each, by the button, by a tap and by the keyboard', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await page.evaluate(() => localStorage.removeItem('alice-demos:kept'));
    const give = page.locator('.cr__prop--give');
    await atCue(page, 'she', 0.5);
    await expect(give).not.toHaveAttribute('data-shown', '');
    await expect(runner(page, 'dodo')).toHaveAttribute('aria-pressed', 'false');

    await atCue(page, 'comfits', 0.6);
    await expect(give).toHaveAttribute('data-shown', '');
    // While the prizes go round, every runner is labelled for it, and not a toggle.
    const label = await give.textContent();
    await expect(runner(page, 'duck')).toHaveAttribute('aria-label', label ?? '');
    await expect(runner(page, 'duck')).not.toHaveAttribute('aria-pressed', /.*/);

    await give.click();
    await expect
      .poll(() => page.locator('.cr__runner[data-fed]').count(), { timeout: 5000 })
      .toBe(1);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('alice-demos:kept')))
      .toContain('comfit');
    // The keyboard's way: a runner is a button, and Enter gives it its comfit.
    await runner(page, 'magpie').focus();
    await page.keyboard.press('Enter');
    await expect(runner(page, 'magpie')).toHaveAttribute('data-fed', '', { timeout: 5000 });
    // A real tap on a runner during the prizes feeds it, never rests or runs it.
    const hit = await landsOn(page, 'crab');
    expect(hit).not.toMatch(/demo__layer/);
    const box = await runner(page, 'crab').boundingBox();
    await page.mouse.click(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) * 0.7,
    );
    await expect
      .poll(() => page.locator('.cr__runner[data-fed]').count(), { timeout: 5000 })
      .toBe(3);
    // Alice gives; she is never fed.
    await expect(runner(page, 'alice')).not.toHaveAttribute('data-fed', '');
    // Past the prizes, the runners rest or run again.
    await atCue(page, 'bow', 0.5);
    await expect(give).not.toHaveAttribute('data-shown', '');
    await expect(runner(page, 'duck')).toHaveAttribute('aria-pressed', 'false');
    await page.evaluate(() => localStorage.removeItem('alice-demos:kept'));
  });

  test('the Dodo thinks, finger to forehead, pushed in on; the thimble ends in her hand', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const dodo = runner(page, 'dodo');
    await atCue(page, 'over', 0.2);
    await expect(dodo).not.toHaveAttribute('data-thinking', '');
    await atCue(page, 'thinking', 0.9);
    await expect(dodo).toHaveAttribute('data-thinking', '', { timeout: 8000 });
    await expect
      .poll(() => customProperty(page, '.cr__runner[data-kind="dodo"]', '--think'))
      .toBe(1);
    // He is the one in front: nearest the camera of the whole party.
    const nearest = await page.evaluate(() => {
      const spin = Number(
        (document.querySelector('.cr__ring') as HTMLElement).style.getPropertyValue('--spin'),
      );
      const depth = (el: HTMLElement) =>
        Number(el.style.getPropertyValue('--r')) *
        Math.cos(((Number(el.style.getPropertyValue('--a')) + spin) * Math.PI) / 180);
      return [...document.querySelectorAll<HTMLElement>('.cr__runner')].sort(
        (a, b) => depth(b) - depth(a),
      )[0]?.dataset.kind;
    });
    expect(nearest).toBe('dodo');
    // The thimble is presented, then goes into her hand.
    await atCue(page, 'thimble', 0.9);
    await expect(dodo).toHaveAttribute('data-present', '', { timeout: 8000 });
    await scrollTo(page, 1);
    const alice = runner(page, 'alice');
    await expect(alice).toHaveAttribute('data-holding', '', { timeout: 8000 });
    await expect
      .poll(() => customProperty(page, '.cr__carry', '--a'), { timeout: 8000 })
      .toBeCloseTo(await customProperty(page, '.cr__runner[data-kind="alice"]', '--a'), 1);
    await expect.poll(() => customProperty(page, '.cr__carry', '--s')).toBeGreaterThan(0.7);
    await expect(dodo).not.toHaveAttribute('data-present', '');
  });
});

test.describe('the Caucus-race under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test.skip(!demo, 'no caucus-race page in this build');

  test('the settled thinking beat has the Dodo thinking, his thoughts all risen', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'thinking', 0);
    await expect(runner(page, 'dodo')).toHaveAttribute('data-thinking', '', { timeout: 8000 });
    await expect
      .poll(() => customProperty(page, '.cr__runner[data-kind="dodo"]', '--think'))
      .toBe(1);
    await atCue(page, 'bow', 0);
    await expect(runner(page, 'alice')).toHaveAttribute('data-holding', '', { timeout: 8000 });
  });
});
