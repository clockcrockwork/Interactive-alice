import { expect, type Page, test } from '@playwright/test';
import { atCue, customProperty, demos } from '../demo-helpers.ts';

/**
 * A Long Tale: the pointer reaches the Mouse and the tail, the tail is readable
 * to its last words and its lines never run into each other, the reading-glass
 * shows the words under the finger, the verses are read in order with their
 * beats, and the birds go off on their pretexts.
 */
const demo = demos.find((d) => d.demo === 'mouse-tale');
const member = (page: Page, kind: string) => page.locator(`.mt__member[data-kind="${kind}"]`);

test.describe("the Mouse's tale", () => {
  test.skip(!demo, 'no mouse-tale page in this build');

  test('a real tap on the Mouse reaches it, and pulls the tail', async ({ page }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'fury-two', 0.9);
    const mouse = member(page, 'mouse');
    await expect(mouse).toBeEnabled({ timeout: 8000 });
    const box = await mouse.boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) * 0.6;
    const y = (box?.y ?? 0) + (box?.height ?? 0) * 0.75;
    const hit = await page.evaluate(
      ([px, py]) =>
        (document.elementFromPoint(px ?? 0, py ?? 0)?.closest('.mt__member') as HTMLElement | null)
          ?.dataset.kind ?? '',
      [x, y],
    );
    expect(hit).toBe('mouse');
    const first = () =>
      page
        .locator('.mt__tail text')
        .first()
        .evaluate((node) => node.getAttribute('transform'));
    const before = await first();
    await page.mouse.click(x, y);
    await expect.poll(first, { timeout: 3000 }).not.toBe(before);
  });

  // In every language the tale is built in: a script of wide glyphs gets its own
  // groups and leading, and must read as cleanly.
  for (const tale of demos.filter((d) => d.demo === 'mouse-tale')) {
    test(`every line of the tail is readable and none runs into the next (${tale.locale})`, async ({
      page,
    }) => {
      await page.goto(tale.url);
      await atCue(page, 'fury-four', 0.95);
      const sizes = await page
        .locator('.mt__tail text')
        .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('font-size'))));
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
      // The camera has followed the words down, and the last of them is in frame.
      await expect
        .poll(() => customProperty(page, '.demo__stage', '--mt-pan'), { timeout: 8000 })
        .toBeGreaterThan(0);
      // Each line's own box (before its small lean), where its transform puts it.
      const boxes = await page.locator('.mt__tail text').evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = (node as SVGTextElement).getBBox();
          const [, tx, ty] =
            /translate\(([-\d.]+) ([-\d.]+)\)/.exec(node.getAttribute('transform') ?? '') ?? [];
          return {
            left: Number(tx) + box.x,
            right: Number(tx) + box.x + box.width,
            top: Number(ty) + box.y,
            bottom: Number(ty) + box.y + box.height,
          };
        }),
      );
      // Never squeezed: each line sits at least a line's height below the last, and
      // leans only a little, so a bend cannot tip one line into the next.
      const placed = await page.locator('.mt__tail text').evaluateAll((nodes) =>
        nodes.map((node) => {
          const [, y, angle] =
            /translate\([-\d.]+ ([-\d.]+)\) rotate\(([-\d.]+)\)/.exec(
              node.getAttribute('transform') ?? '',
            ) ?? [];
          return {
            y: Number(y),
            angle: Number(angle),
            size: Number(node.getAttribute('font-size')),
          };
        }),
      );
      for (let i = 1; i < placed.length; i += 1) {
        const a = placed[i - 1];
        const b = placed[i];
        if (a && b) {
          expect(b.y - a.y, `line ${i} below line ${i - 1}`).toBeGreaterThanOrEqual(
            1.25 * Math.max(a.size, b.size),
          );
          expect(Math.abs(b.angle)).toBeLessThanOrEqual(6);
        }
      }
      const pan = await customProperty(page, '.demo__stage', '--mt-pan');
      const last = boxes[boxes.length - 1];
      expect((last?.bottom ?? 0) - pan).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
      for (let i = 1; i < boxes.length; i += 1) {
        const a = boxes[i - 1];
        const b = boxes[i];
        if (!a || !b) {
          continue;
        }
        const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        const height = Math.min(a.bottom - a.top, b.bottom - b.top);
        // Lines that share any width may touch by a hair, never cover each other.
        if (across > 0) {
          expect(down, `line ${i} into line ${i - 1}`).toBeLessThan(height * 0.15);
        }
      }
      // The Mouse walks off with it, and the camera comes back up.
      await atCue(page, 'come-back', 0.5);
      await expect
        .poll(() => customProperty(page, '.demo__stage', '--mt-pan'), { timeout: 8000 })
        .toBe(0);
    });
  }

  test('the reading-glass shows the words under the finger, and the button reads on', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const read = page.locator('.mt__prop--read');
    const lens = page.locator('.mt__loupe');
    await atCue(page, 'sad', 0.5);
    await expect(read).not.toHaveAttribute('data-shown', '');
    await atCue(page, 'fury-two', 0.9);
    await expect(read).toHaveAttribute('data-shown', '');
    // Drag along the tail: the glass shows the line under the finger.
    const line = page.locator('.mt__tail text').nth(3);
    const box = await line.boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 2, y + 2, { steps: 3 });
    await expect(lens).toHaveAttribute('data-shown', '');
    const under = await lens.textContent();
    const texts = await page
      .locator('.mt__tail text')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent));
    expect(texts).toContain(under);
    expect(await line.getAttribute('data-near')).toBe('');
    await page.mouse.up();
    await expect(lens).not.toHaveAttribute('data-shown', '', { timeout: 5000 });
    // The button reads the tail from the top, a line at a time.
    await read.click();
    await expect(lens).toHaveText(texts[0] ?? '');
    await read.click();
    await expect(lens).toHaveText(texts[1] ?? '');
  });

  test('the verses are read in order with their beats; the drawn tail is a picture', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await expect(page.locator('.mt__tail')).toHaveAttribute('aria-hidden', 'true');
    const verse = (await page
      .locator('.demo__stage .demo-beat[data-cue="fury-two"] .line')
      .first()
      .textContent()) as string;
    await atCue(page, 'sad', 0.5);
    expect(await page.locator('.demo__captions').ariaSnapshot()).not.toContain(verse.trim());
    await atCue(page, 'fury-two', 0.5);
    await expect
      .poll(() => page.locator('.demo__captions').ariaSnapshot(), { timeout: 8000 })
      .toContain(verse.trim());
  });

  test('the birds go off on their pretexts: the Magpie wraps up, the Canary calls its chicks', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    const canary = member(page, 'canary');
    await atCue(page, 'dinah', 0.5);
    await expect(canary).toHaveAttribute('data-gone', '');
    await expect(canary).toBeDisabled();
    await atCue(page, 'sensation', 0.25);
    await expect(member(page, 'magpie')).toHaveAttribute('data-wrapped', '', { timeout: 8000 });
    await expect(canary).toHaveAttribute('data-calling', '');
    await expect(canary).not.toHaveAttribute('data-gone', '');
    await expect(canary).toHaveAttribute('aria-label', /.+/);
    await atCue(page, 'alone', 0.6);
    await expect(canary).toHaveAttribute('data-gone', '', { timeout: 8000 });
    await expect(member(page, 'magpie')).toHaveAttribute('data-gone', '');
  });
});

test.describe("the Mouse's tale under reduced motion", () => {
  test.use({ reducedMotion: 'reduce' });
  test.skip(!demo, 'no mouse-tale page in this build');

  test('the sensation settles with the excuses in the picture, and they are gone by the next beat', async ({
    page,
  }) => {
    await page.goto(demo?.url ?? '');
    await atCue(page, 'sensation', 0);
    await expect(member(page, 'magpie')).toHaveAttribute('data-wrapped', '', { timeout: 8000 });
    await expect(member(page, 'magpie')).not.toHaveAttribute('data-gone', '');
    await expect(member(page, 'canary')).toHaveAttribute('data-calling', '');
    await expect(member(page, 'duck')).toHaveAttribute('data-gone', '');
    await atCue(page, 'alone', 0);
    await expect(member(page, 'magpie')).toHaveAttribute('data-gone', '', { timeout: 8000 });
    await expect(member(page, 'canary')).toHaveAttribute('data-gone', '');
  });
});
