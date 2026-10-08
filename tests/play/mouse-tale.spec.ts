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
      // The camera has followed the words down as far as it needs to, never so far
      // that the first verse goes up under the bar, and the last words are in frame.
      await page.waitForTimeout(1200);
      // Each group's own box (before its small lean), where its transforms put it: on
      // its row's place, and across the row where a row holds two groups.
      const placed = await page.locator('.mt__tail text').evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = (node as SVGTextElement).getBBox();
          const transform = node.getAttribute('transform') ?? '';
          const [, tx, ty, angle] =
            /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/.exec(transform) ?? [];
          const [, dx] = /\) translate\(([-\d.]+) 0\)/.exec(transform) ?? [];
          const x = Number(tx) + Number(dx ?? 0);
          return {
            y: Number(ty),
            angle: Number(angle),
            size: Number(node.getAttribute('font-size')),
            left: x + box.x,
            right: x + box.x + box.width,
            top: Number(ty) + box.y,
            bottom: Number(ty) + box.y + box.height,
          };
        }),
      );
      // Rows: the groups that share a place down the tail.
      const rows: (typeof placed)[] = [];
      for (const piece of placed) {
        const row = rows.at(-1);
        if (row && Math.abs((row[0]?.y ?? 0) - piece.y) < 0.5) {
          row.push(piece);
        } else {
          rows.push([piece]);
        }
      }
      // Never squeezed: each row sits at least a line's height below the last, and
      // leans only a little, so a bend cannot tip one row into the next.
      for (let i = 1; i < rows.length; i += 1) {
        const a = rows[i - 1]?.[0];
        const b = rows[i]?.[0];
        if (a && b) {
          expect(b.y - a.y, `row ${i} below row ${i - 1}`).toBeGreaterThanOrEqual(
            1.25 * Math.max(a.size, b.size),
          );
          expect(Math.abs(b.angle)).toBeLessThanOrEqual(6);
        }
      }
      const pan = await customProperty(page, '.demo__stage', '--mt-pan');
      const bar = await page.evaluate(
        () => document.querySelector('.demo__bar')?.getBoundingClientRect().bottom ?? 0,
      );
      const bottom = Math.max(...placed.map((piece) => piece.bottom));
      const top = Math.min(...placed.map((piece) => piece.top));
      expect(bottom - pan).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
      expect(top - pan).toBeGreaterThanOrEqual(bar);
      // Side by side on a row, groups keep apart; rows that share any width may
      // touch by a hair, never cover each other.
      for (const row of rows) {
        for (let j = 1; j < row.length; j += 1) {
          expect((row[j]?.left ?? 0) - (row[j - 1]?.right ?? 0)).toBeGreaterThan(0);
        }
      }
      const spans = rows.map((row) => ({
        left: Math.min(...row.map((piece) => piece.left)),
        right: Math.max(...row.map((piece) => piece.right)),
        top: Math.min(...row.map((piece) => piece.top)),
        bottom: Math.max(...row.map((piece) => piece.bottom)),
      }));
      for (let i = 1; i < spans.length; i += 1) {
        const a = spans[i - 1];
        const b = spans[i];
        if (!a || !b) {
          continue;
        }
        const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        const height = Math.min(a.bottom - a.top, b.bottom - b.top);
        if (across > 0) {
          expect(down, `row ${i} into row ${i - 1}`).toBeLessThan(height * 0.15);
        }
      }
      // The Mouse walks off with it, and the camera comes back up.
      await atCue(page, 'come-back', 0.5);
      await expect
        .poll(() => customProperty(page, '.demo__stage', '--mt-pan'), { timeout: 8000 })
        .toBe(0);
    });
  }

  for (const size of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'phone', width: 390, height: 780 },
  ]) {
    test(`the base locale's tail keeps the book's groups at full size, one to a row (${size.name})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
      });
      const page = await context.newPage();
      await page.goto(demo?.url ?? '');
      await atCue(page, 'fury-four', 0.95);
      const tail = page.locator('.mt__tail');
      await expect(tail).toHaveAttribute('data-level', '0');
      await expect(tail).toHaveAttribute('data-scale', '1.00');
      await expect(tail).not.toHaveAttribute('data-over', '');
      await context.close();
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
