/**
 * Shot overlap, in a browser.
 *
 * The unit layer already proves the arithmetic. What is proven here is that the
 * arithmetic reaches the document: that two shots are genuinely on screen together
 * during a handover, that exactly one of them owns the scene's progress, and that
 * scrolling back through the handover puts the page back the way it was.
 */

import { expect, test } from '@playwright/test';
import { focusScene, holdAt, shotsOf } from './drive.ts';
import { pageGraph, sceneOf } from './manifest.ts';

const parts = pageGraph().filter((page) => page.kind === 'part');

/**
 * Every shot's rendered state, straight off the page.
 *
 * Read from the DOM rather than from the snapshot, because the question is whether
 * the runtime's view of the composition and the document's agree.
 */
const shotStates = (page: import('@playwright/test').Page, scene: string) =>
  page.locator(`.scene[data-scene="${scene}"] .shot`).evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.dataset.shot ?? '',
      state: node.dataset.state ?? '',
      progress: node.style.getPropertyValue('--progress'),
      handoff: node.style.getPropertyValue('--handoff'),
      opacity: getComputedStyle(node).opacity,
    })),
  );

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;

  for (const sceneId of entry.scenes ?? []) {
    const mapping = sceneOf(sceneId);
    // The mapping is the only list of shots, so which handovers exist comes from
    // there. A scene of hard cuts contributes the no-overlap case instead.
    const handovers = mapping.shots
      .map((shot, index) => ({ index, id: shot.id, overlap: shot.overlap ?? 0 }))
      .filter((shot) => shot.overlap > 0);

    test(`${entry.url} ${sceneId}: keeps one shot per hard cut`, async ({ page }) => {
      await page.goto(url);
      await focusScene(page, sceneId);

      const hardCuts = mapping.shots
        .map((shot, index) => ({ index, overlap: shot.overlap ?? 0 }))
        .filter((shot) => shot.overlap === 0 && shot.index < mapping.shots.length - 1);

      for (const shot of hardCuts) {
        // Just past the boundary the next shot starts at, so the cut has happened.
        const boundary = await page
          .locator(`.scene[data-scene="${sceneId}"] .shot`)
          .nth(shot.index + 1)
          .evaluate((node) => Number(node.dataset.start));
        await holdAt(page, sceneId, boundary + 0.001);

        expect(await shotsOf(page, sceneId), `after the cut at ${boundary}`).toHaveLength(1);
        const states = await shotStates(page, sceneId);
        expect(states.map((state) => state.state)).not.toContain('outgoing');
      }
    });

    if (handovers.length === 0) {
      continue;
    }

    test(`${entry.url} ${sceneId}: draws two shots through a handover`, async ({ page }) => {
      await page.goto(url);
      await focusScene(page, sceneId);

      for (const shot of handovers) {
        const spans = await page
          .locator(`.scene[data-scene="${sceneId}"] .shot`)
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              start: Number(node.dataset.start),
              end: Number(node.dataset.end),
            })),
          );
        const next = spans[shot.index + 1];
        if (!next) {
          throw new Error(`${sceneId}/${shot.id} has no next shot`);
        }
        const tail = shot.overlap * (next.end - next.start);

        // Before the boundary: one shot, and nothing is handing over.
        await holdAt(page, sceneId, next.start - 0.002);
        expect(await shotsOf(page, sceneId), `before ${shot.id} hands over`).toHaveLength(1);

        // Halfway through the handover: two shots, one of them outgoing.
        await holdAt(page, sceneId, next.start + tail / 2);
        const active = await shotsOf(page, sceneId);
        expect(active, `during ${shot.id}'s handover`).toHaveLength(2);
        expect(active[0]).toBe(shot.id);

        const states = await shotStates(page, sceneId);
        const outgoing = states.find((state) => state.id === shot.id);
        const incoming = states.find((state) => state.id === active[1]);
        expect(outgoing?.state).toBe('outgoing');
        expect(incoming?.state).toBe('active');

        // Both are painted, and the outgoing one is partly faded by its handoff.
        expect(Number(incoming?.opacity)).toBe(1);
        expect(Number(outgoing?.handoff)).toBeGreaterThan(0.4);
        expect(Number(outgoing?.handoff)).toBeLessThan(0.6);
        expect(Number(outgoing?.opacity)).toBeGreaterThan(0.3);
        expect(Number(outgoing?.opacity)).toBeLessThan(0.7);
        // The outgoing shot owns no more of the scene: its own progress is spent.
        expect(Number(outgoing?.progress)).toBe(1);

        // Past the tail: back to one shot, and the old one is gone.
        await holdAt(page, sceneId, next.start + tail + 0.002);
        expect(await shotsOf(page, sceneId), `after ${shot.id} has left`).toHaveLength(1);
        const gone = (await shotStates(page, sceneId)).find((state) => state.id === shot.id);
        expect(gone?.state).toBe('after');
        expect(Number(gone?.opacity)).toBe(0);
      }
    });

    // Named for what it does. The seam, not the scrollbar: what is proven is that
    // the composition is a function of progress and nothing else, arrived at from
    // either direction. Reversal by real scrolling is covered in handoff.spec.ts.
    test(`${entry.url} ${sceneId}: reconstructs a handover from either direction`, async ({
      page,
    }) => {
      await page.goto(url);
      await focusScene(page, sceneId);

      const shot = handovers[0];
      if (!shot) {
        throw new Error('no handover to walk');
      }
      const spans = await page
        .locator(`.scene[data-scene="${sceneId}"] .shot`)
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            start: Number(node.dataset.start),
            end: Number(node.dataset.end),
          })),
        );
      const next = spans[shot.index + 1];
      if (!next) {
        throw new Error('no shot to hand over to');
      }
      const tail = shot.overlap * (next.end - next.start);
      const points = [
        next.start - 0.005,
        next.start,
        next.start + tail * 0.25,
        next.start + tail * 0.5,
        next.start + tail * 0.75,
        next.start + tail,
        next.start + tail + 0.005,
      ];

      const walk = async () => {
        const seen = [];
        for (const point of points) {
          await holdAt(page, sceneId, point);
          seen.push(await shotStates(page, sceneId));
        }
        return seen;
      };

      const forwards = await walk();
      points.reverse();
      const backwards = (await walk()).reverse();

      // Nothing about the composition depends on how the reader arrived.
      expect(backwards).toEqual(forwards);
    });
  }
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const entry of parts) {
    for (const sceneId of entry.scenes ?? []) {
      const mapping = sceneOf(sceneId);
      const handover = mapping.shots
        .map((shot, index) => ({ index, id: shot.id, overlap: shot.overlap ?? 0 }))
        .find((shot) => shot.overlap > 0);
      if (!handover) {
        continue;
      }

      test(`${entry.url} ${sceneId}: hands over without the push`, async ({ page }) => {
        await page.goto(`${entry.url}?probe=1`);
        await focusScene(page, sceneId);

        const next = await page
          .locator(`.scene[data-scene="${sceneId}"] .shot`)
          .nth(handover.index + 1)
          .evaluate((node) => ({
            start: Number(node.dataset.start),
            end: Number(node.dataset.end),
          }));
        await holdAt(page, sceneId, next.start + handover.overlap * (next.end - next.start) * 0.5);

        // The handover still happens: two shots, one giving way to the other.
        expect(await shotsOf(page, sceneId)).toHaveLength(2);
        const outgoing = page
          .locator(`.scene[data-scene="${sceneId}"] .shot[data-state="outgoing"]`)
          .first();
        await expect(outgoing).toHaveCount(1);
        // What goes is the movement towards the reader, not the transition.
        expect(await outgoing.evaluate((node) => getComputedStyle(node).scale)).toBe('none');
        expect(
          Number(await outgoing.evaluate((node) => getComputedStyle(node).opacity)),
        ).toBeLessThan(1);
      });
    }
  }
});
