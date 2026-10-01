import { expect, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

/**
 * Drink Me: peeking behind the low curtain before the story finds the little door.
 * The curtain carries `data-peek` while the reader holds it up, and `--curtain-lift`
 * (0..1) is the lift the story and the reader share: the story's wins.
 */
const demo = demos.find((d) => d.demo === 'drink-me');
const CURTAIN = '.dk__curtain';
const BUTTON = '.dk__prop--peek';

test.describe('Drink Me: the curtain', () => {
  test.skip(!demo, 'no drink-me page in this build');

  test('at the hall beat the button lifts the curtain, and it drops again by itself', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect.poll(() => customProperty(page, CURTAIN, '--curtain-lift')).toBe(0);

    await page.locator(BUTTON).click();
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    // The lift is a tween; on a slow renderer only its start may be seen before
    // the moment is over, so any lift at all is the check here.
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => customProperty(page, '.dk__keyhole-glow', '--peek-glow'), { timeout: 5000 })
      .toBeGreaterThan(0);

    // A moment later it has dropped back, glow and all.
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 6000 });
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeLessThan(0.05);
    await expect
      .poll(() => customProperty(page, '.dk__keyhole-glow', '--peek-glow'), { timeout: 5000 })
      .toBeLessThan(0.05);
  });

  test('pressing again keeps it up until it is pressed once more', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    await page.locator(BUTTON).click();
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await page.locator(BUTTON).click();
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 8000 })
      .toBeGreaterThan(0.5);
    await page.waitForTimeout(2500);
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 8000 })
      .toBeGreaterThan(0.5);
    await page.locator(BUTTON).click();
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 3000 });
  });

  test('a pointer resting on the curtain lifts it; pressing holds it up until let go', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    const box = await page.locator(CURTAIN).boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
      return;
    }
    // Hovering lifts it; moving well away lets it drop after the moment.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3);
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await page.mouse.move(10, 10);
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 6000 });
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeLessThan(0.05);

    // Pressing and holding keeps it up though she stoops and the curtain moves on
    // screen; letting go drops it. (She straightens up for a moment first.)
    await page.waitForTimeout(1500);
    const again = await page.locator(CURTAIN).boundingBox();
    expect(again).not.toBeNull();
    if (!again) {
      return;
    }
    await page.mouse.move(again.x + again.width / 2, again.y + again.height * 0.3);
    await page.mouse.down();
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await page.waitForTimeout(2500);
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.5);
    await page.mouse.up();
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 6000 });
  });

  test('the curtain drops when the scroll moves on, and the story lifts it regardless', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'hall', 0.5);
    await page.locator(BUTTON).click();
    await page.locator(BUTTON).click();
    await expect(page.locator(CURTAIN)).toHaveAttribute('data-peek', '');

    // Moving on to the story's own beat: the peek lets go and the story has the curtain.
    await atCue(page, 'garden', 0.5);
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '', { timeout: 5000 });
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.99);
    await expect(page.locator(BUTTON)).toBeHidden();

    // Back before the hall, nothing offers a peek and the curtain hangs down.
    await atCue(page, 'locked', 0.5);
    await expect(page.locator(BUTTON)).toBeHidden();
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeLessThan(0.05);
    await scrollTo(page, 1);
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.99);
  });

  test('without any interaction the story finds the door at its own beat', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'key', 0.6);
    await expect
      .poll(() => customProperty(page, CURTAIN, '--curtain-lift'), { timeout: 5000 })
      .toBeGreaterThan(0.99);
    await expect(page.locator(CURTAIN)).not.toHaveAttribute('data-peek', '');
  });
});
