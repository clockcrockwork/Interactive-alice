import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { focusScene, geometryOf, holdAt } from './drive.ts';
import { pageGraph } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');

/**
 * Progression-critical state for one scene. Velocity is deliberately absent: it is a
 * function of timing, not of progress, and nothing narrative may depend on it.
 */
interface Progression {
  progress: number;
  shot: string | undefined;
  beat: string | undefined;
  units: Record<string, string>;
}

const progression = async (page: Page, sceneId: string): Promise<Progression> =>
  page.evaluate((scene) => {
    const snapshot = window.__alice?.snapshot(scene)[0];
    const units: Record<string, string> = {};
    const root = document.querySelector(`.scene[data-scene="${scene}"]`);
    for (const element of root?.querySelectorAll<HTMLElement>('.shot, .beat') ?? []) {
      const kind = element.classList.contains('shot') ? 'shot' : 'beat';
      const id = element.dataset.shot ?? element.dataset.beat ?? '';
      units[`${kind}:${id}`] =
        `${element.dataset.state}:${element.style.getPropertyValue('--progress')}`;
    }
    return {
      progress: snapshot?.progress ?? -1,
      shot: snapshot?.shot,
      beat: snapshot?.beat,
      units,
    };
  }, sceneId);

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;
  const scenes = entry.scenes ?? [];

  test(`${entry.url} exposes exactly the scenes the data says`, async ({ page }) => {
    await page.goto(url);
    expect(await page.evaluate(() => window.__alice?.scenes())).toEqual(scenes);
  });

  for (const sceneId of scenes) {
    test(`${entry.url} ${sceneId}: maps real scroll onto progress`, async ({ page }) => {
      await page.goto(url);

      // The track's own geometry decides the mapping, so read it from the document
      // rather than assuming a viewport unit. A midpoint has to read as a midpoint:
      // clamping hides a wrong distance at the ends.
      const { top, travel } = await geometryOf(page, sceneId);
      await page.evaluate((to) => window.scrollTo(0, to), top + travel / 2);

      // Polled rather than counted in frames. A scene further down the document
      // starts suspended, and it is the intersection observer that wakes it, which
      // lands on its own schedule rather than on the next frame after the scroll.
      await expect
        .poll(async () => (await progression(page, sceneId)).progress, { timeout: 5000 })
        .toBeGreaterThan(0.45);
      expect((await progression(page, sceneId)).progress).toBeLessThan(0.55);
    });

    test(`${entry.url} ${sceneId}: reconstructs the same state when scrolled back`, async ({
      page,
    }) => {
      await page.goto(url);

      await focusScene(page, sceneId);

      const boundaries = await page
        .locator(`.scene[data-scene="${sceneId}"] .shot`)
        .evaluateAll((nodes) => nodes.map((node) => Number(node.dataset.start)));
      // Both sides of every shot boundary, so an overlap is entered and left in
      // each direction rather than only sampled at the seam itself.
      const points = [
        ...new Set([0, ...boundaries.flatMap((at) => [at - 0.01, at, at + 0.01]), 0.93, 1]),
      ]
        .filter((point) => point >= 0 && point <= 1)
        .sort((a, b) => a - b);

      for (const point of points) {
        await page.evaluate(
          ([scene, value]) => window.__alice?.setProgress(scene as string, value as number),
          [sceneId, point] as const,
        );
        const before = await progression(page, sceneId);

        await page.evaluate(
          ([scene, value]) =>
            window.__alice?.setProgress(scene as string, Math.min((value as number) + 0.2, 1)),
          [sceneId, point] as const,
        );
        await page.evaluate(
          ([scene, value]) => window.__alice?.setProgress(scene as string, value as number),
          [sceneId, point] as const,
        );
        const after = await progression(page, sceneId);

        expect(after, `progress ${point} did not reconstruct`).toEqual(before);
      }
    });

    test(`${entry.url} ${sceneId}: agrees with the markup about the active shot and beat`, async ({
      page,
    }) => {
      await page.goto(url);
      await focusScene(page, sceneId);

      // 1 included on purpose: it is the only value at which the snapshot and the
      // markup can disagree, because it is the only one where a span has ended
      // while the stage that shows it is still in the viewport.
      for (const point of [0, 0.05, 0.2, 0.45, 0.7, 0.95, 1]) {
        await page.evaluate(
          ([scene, value]) => window.__alice?.setProgress(scene as string, value as number),
          [sceneId, point] as const,
        );
        const state = await progression(page, sceneId);
        const root = page.locator(`.scene[data-scene="${sceneId}"]`);

        expect(await root.locator('.shot[data-state="active"]').getAttribute('data-shot')).toBe(
          state.shot,
        );
        expect(
          await root
            .locator('.beat[data-state="active"]')
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-beat'))),
        ).toEqual([state.beat]);
      }
    });

    test(`${entry.url} ${sceneId}: settles its velocity after scrolling stops`, async ({
      page,
    }) => {
      await page.goto(url);

      // Somewhere inside this scene's own travel, whichever scene it is.
      const { top, travel } = await geometryOf(page, sceneId);
      await page.evaluate((to) => window.scrollTo(0, to), top + travel * 0.5);
      await page.waitForTimeout(700);
      const settled = await page.evaluate(
        (scene) => window.__alice?.snapshot(scene)[0]?.velocity,
        sceneId,
      );
      expect(Math.abs(settled ?? 1)).toBeLessThan(0.01);
    });

    test(`${entry.url} ${sceneId}: survives a resize without losing its composition`, async ({
      page,
    }) => {
      await page.goto(url);
      await holdAt(page, sceneId, 0.5);
      const before = await progression(page, sceneId);

      await page.setViewportSize({ width: 420, height: 820 });
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      const after = await progression(page, sceneId);

      expect(after.progress).toBeCloseTo(before.progress, 6);
      expect(after.shot).toBe(before.shot);
      expect(after.beat).toBe(before.beat);
    });
  }

  test(`${entry.url} ends every scene on something to read`, async ({ page }) => {
    await page.goto(url);

    for (const sceneId of scenes) {
      await holdAt(page, sceneId, 1);

      // A beat fades out because the next one is taking over. The last beat of a
      // scene has nothing taking over from it, and its stage is still on screen,
      // so the scene must not end on an empty stage.
      const painted = await page
        .locator(`.scene[data-scene="${sceneId}"] .beat`)
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const shot = node.closest('.shot');
              return (
                node.querySelector('.line') !== null &&
                Number(getComputedStyle(node).opacity) > 0.02 &&
                shot !== null &&
                Number(getComputedStyle(shot).opacity) > 0.02
              );
            })
            .map((node) => node.getAttribute('data-beat')),
        );
      const last = await page
        .locator(`.scene[data-scene="${sceneId}"] .beat`)
        .last()
        .evaluate((node) => ({
          beat: node.dataset.beat,
          state: node.dataset.state,
          hasText: node.querySelector('.line') !== null,
        }));

      // The last beat still owns the scene's end, whether or not it carries text.
      expect(last.state, `${sceneId} last beat`).toBe('active');
      expect(await progression(page, sceneId).then((state) => state.beat)).toBe(last.beat);
      if (last.hasText) {
        expect(painted, `${sceneId} ends on an empty stage`).toContain(last.beat);
      }
    }
  });

  test(`${entry.url} reaches both ends by scrolling alone`, async ({ page }) => {
    await page.goto(url);
    const last = scenes.at(-1) ?? '';
    const first = scenes[0] ?? '';

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => (await progression(page, last)).progress, { timeout: 5000 })
      .toBeGreaterThan(0.99);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(async () => (await progression(page, first)).progress, { timeout: 5000 })
      .toBeLessThan(0.01);
  });
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const entry of parts) {
    for (const sceneId of entry.scenes ?? []) {
      test(`${entry.url} ${sceneId}: drops the drift and lowers the tier`, async ({ page }) => {
        await page.goto(`${entry.url}?probe=1`);
        await holdAt(page, sceneId, 0.5);

        const snapshot = await page.evaluate(
          (scene) => window.__alice?.snapshot(scene)[0],
          sceneId,
        );
        expect(snapshot?.reducedMotion).toBe(true);
        expect(snapshot?.quality).toBe('reduced');

        const translate = await page
          .locator(`.scene[data-scene="${sceneId}"] .beat[data-state="active"]`)
          .evaluate((node) => getComputedStyle(node).translate);
        expect(translate).toBe('none');
      });
    }
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const entry of parts) {
    test(`${entry.url} stays a readable document`, async ({ page }) => {
      await page.goto(entry.url);

      await expect(page.locator('.story')).not.toHaveAttribute('data-mode', 'scene');
      const lines = page.locator('.line');
      await expect(lines).toHaveCount(entry.segments?.length ?? 0);
      await expect(lines.first()).toBeVisible();
      await expect(lines.last()).toBeVisible();
    });
  }
});
