import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos, scrollTo } from '../demo-helpers.ts';

/**
 * A Golden Afternoon, across the field: Alice from behind, running after the
 * Rabbit with the reader's scroll as her stride, the Rabbit glancing back on a fast
 * scroll and going down the hole nose first, and a field that meets the bank
 * without a seam.
 */
const demo = demos.find((d) => d.demo === 'riverbank');

const opacity = (page: Page, selector: string) =>
  page.evaluate(
    (sel) => Number(getComputedStyle(document.querySelector(sel) as Element).opacity),
    selector,
  );

test.describe('the riverbank: across the field', () => {
  test.skip(!demo, 'no riverbank page in this build');

  test('Alice runs into the field from behind and the Rabbit goes down nose first; back, she is on the bank', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'up', 0.5);
    await expect.poll(() => opacity(page, '.field__runner')).toBeLessThan(0.05);
    await expect.poll(() => opacity(page, '.rb__alice')).toBeGreaterThan(0.95);

    await scrollTo(page, 1);
    await expect
      .poll(() => opacity(page, '.field__runner'), { timeout: 8000 })
      .toBeGreaterThan(0.95);
    await expect.poll(() => opacity(page, '.rb__alice')).toBeLessThan(0.05);
    await expect(page.locator('.rb__field')).toHaveAttribute('data-diving', '');
    await expect(page.locator('.rb__rabbit')).toHaveAttribute('data-gone', '');
    await expect
      .poll(() => opacity(page, '.rb__field .field__rabbit'), { timeout: 8000 })
      .toBeGreaterThan(0.95);
    // She is in the frame, not under the sentence in the sky.
    const runner = await page.locator('.field__runner').boundingBox();
    const caption = await page.locator('.demo-beat[data-cue="field"] .line').first().boundingBox();
    const view = page.viewportSize();
    expect(runner && caption && view).toBeTruthy();
    if (runner && caption && view) {
      expect(runner.x).toBeGreaterThan(0);
      expect(runner.x + runner.width).toBeLessThan(view.width);
      expect(runner.y).toBeGreaterThan(caption.y + caption.height);
    }

    // And back: the join is a function of the scroll.
    await atCue(page, 'up', 0.5);
    await expect.poll(() => opacity(page, '.field__runner'), { timeout: 8000 }).toBeLessThan(0.05);
    await expect.poll(() => opacity(page, '.rb__alice'), { timeout: 8000 }).toBeGreaterThan(0.95);
    await expect(page.locator('.rb__field')).not.toHaveAttribute('data-diving', '');
  });

  test('her stride is the scroll: she runs while the reader scrolls and stands when it stops', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'field', 0.3);
    await page.mouse.move(640, 380);
    const swings: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(60);
      swings.push(Math.abs(await customProperty(page, '.field__alice', '--swing')));
    }
    expect(Math.max(...swings)).toBeGreaterThan(0.05);
    // At rest she settles to standing.
    await expect
      .poll(() => customProperty(page, '.field__alice', '--swing').then(Math.abs), {
        timeout: 8000,
      })
      .toBeLessThan(0.02);
  });

  test('a fast scroll makes the running Rabbit glance back', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'rabbit', 0.4);
    await expect(page.locator('.rb__rabbit')).toHaveAttribute('data-running', '');
    // Watch for the glance while the page is scrolled hard, frame by frame.
    const glanced = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const rabbit = document.querySelector('.rb__rabbit');
          let seen = false;
          const watch = new MutationObserver(() => {
            seen ||= rabbit?.hasAttribute('data-glance') ?? false;
          });
          if (rabbit) {
            watch.observe(rabbit, { attributes: true });
          }
          let frames = 0;
          const step = (): void => {
            window.scrollBy(0, frames % 2 === 0 ? 260 : -260);
            frames += 1;
            if (frames < 40 && !seen) {
              requestAnimationFrame(step);
            } else {
              watch.disconnect();
              resolve(seen);
            }
          };
          requestAnimationFrame(step);
        }),
    );
    expect(glanced).toBe(true);
  });

  test('the field meets the bank without a seam: its ground and hedge fade into it', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'field', 0.45);
    for (const part of ['.rb__field .field__ground', '.rb__field .field__hedge']) {
      const mask = await page.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel) as Element).maskImage,
        part,
      );
      expect(mask, part).toContain('linear-gradient');
      // They run on past the field's own edge, where the fade is.
      const reach = await page.evaluate((sel) => {
        const field = document.querySelector('.rb__field')?.getBoundingClientRect();
        const box = document.querySelector(sel)?.getBoundingClientRect();
        return field && box ? box.right - field.right : 0;
      }, part);
      expect(reach, part).toBeGreaterThan(100);
    }
  });

  test('a page turned or a daisy picked says what happened, never the button again', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const ui = await page.evaluate(
      () =>
        JSON.parse(document.getElementById('demo-ui')?.textContent ?? '{}') as Record<
          string,
          string
        >,
    );
    const status = page.locator('.demo__status');
    await page.locator('.rb__prop--turn').click();
    await expect(page.locator('.rb__book')).toHaveAttribute('data-page', '1');
    await expect(status).toHaveText(ui.demoPageEmpty ?? '');
    await page.locator('.rb__prop--pick').click();
    await expect(page.locator('.rb__chain')).toHaveAttribute('data-chain', '1');
    await expect(status).toHaveText(ui.demoChainLonger ?? '');
    expect(ui.demoChainLonger).not.toBe(ui.demoPickDaisy);
  });

  test('under reduced motion the field is a still with her caught mid-stride', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(demo?.url ?? '');
    await scrollTo(page, 1);
    await expect
      .poll(() => opacity(page, '.field__runner'), { timeout: 8000 })
      .toBeGreaterThan(0.95);
    await expect(page.locator('.rb__field')).toHaveAttribute('data-diving', '');
    expect(await customProperty(page, '.field__alice', '--lift-l')).toBeGreaterThan(0.5);
  });
});
