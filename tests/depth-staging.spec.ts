/**
 * Rabbit Hole's temporary depth staging: the Alice anchor and the depth bands
 * this scene's visual work package adds on top of the generic shot/beat runtime,
 * and the reduced-motion counterpart of its one motivated shot handover.
 *
 * The generic overlap contract (two shots on screen, exactly one primary, reverse
 * reconstruction) is already proven scene-agnostically in overlap.spec.ts; what is
 * new here is that this scene's own CSS actually reacts: shots read differently
 * from one another, the handover really does push the camera through the rim
 * rather than only crossfading, and the comfortable variant changes something a
 * reader can observe rather than only existing in the stylesheet.
 */
import { expect, test } from '@playwright/test';
import { focusScene, holdAt } from './drive.ts';
import { pageGraph, sceneOf } from './manifest.ts';

const SCENE_ID = 'rabbit-hole';
const parts = pageGraph().filter(
  (page) => page.kind === 'part' && (page.scenes ?? []).includes(SCENE_ID),
);
const mapping = sceneOf(SCENE_ID);
const shotIds = mapping.shots.map((shot) => shot.id);

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;

  test(`${entry.url} ${SCENE_ID}: every shot carries an Alice anchor and its depth bands`, async ({
    page,
  }) => {
    await page.goto(url);
    await focusScene(page, SCENE_ID);

    for (const shotId of shotIds) {
      const shot = page.locator(`.scene[data-scene="${SCENE_ID}"] .shot[data-shot="${shotId}"]`);
      await expect(shot.locator('.scene-rabbit-hole__alice[aria-hidden="true"]')).toHaveCount(1);
      await expect(shot.locator('.scene-rabbit-hole__depth--mid[aria-hidden="true"]')).toHaveCount(
        1,
      );
      await expect(shot.locator('.scene-rabbit-hole__depth--near[aria-hidden="true"]')).toHaveCount(
        1,
      );
    }
  });

  test(`${entry.url} ${SCENE_ID}: the first and last shot read as different compositions`, async ({
    page,
  }) => {
    await page.goto(url);
    await focusScene(page, SCENE_ID);

    const first = shotIds[0];
    const last = shotIds.at(-1);
    if (!first || !last || first === last) {
      throw new Error(`${SCENE_ID} needs at least two shots to compare`);
    }

    await holdAt(page, SCENE_ID, 0.02);
    const early = await page
      .locator(`.scene[data-scene="${SCENE_ID}"] .shot[data-shot="${first}"]`)
      .evaluate((node) => getComputedStyle(node, '::before').backgroundImage);

    await holdAt(page, SCENE_ID, 0.98);
    const late = await page
      .locator(`.scene[data-scene="${SCENE_ID}"] .shot[data-shot="${last}"]`)
      .evaluate((node) => getComputedStyle(node, '::before').backgroundImage);

    // Different palettes and different gradients, not a shared wash reused as-is.
    expect(early).not.toBe(late);
  });

  test(`${entry.url} ${SCENE_ID}: the motivated handover pushes the camera through as it hands off`, async ({
    page,
  }) => {
    await page.goto(url);
    await focusScene(page, SCENE_ID);

    // Read from the mapping rather than naming a shot: whichever shot declares the
    // first overlap is the one this scene's handover is built around.
    const handoverIndex = mapping.shots.findIndex((shot) => (shot.overlap ?? 0) > 0);
    if (handoverIndex < 0) {
      throw new Error(`${SCENE_ID} declares no shot overlap to test`);
    }
    const overlap = mapping.shots[handoverIndex]?.overlap ?? 0;

    const spans = await page
      .locator(`.scene[data-scene="${SCENE_ID}"] .shot`)
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          start: Number(node.dataset.start),
          end: Number(node.dataset.end),
        })),
      );
    const next = spans[handoverIndex + 1];
    if (!next) {
      throw new Error('no next shot to hand over to');
    }
    const tail = overlap * (next.end - next.start);
    const outgoing = page.locator(`.scene[data-scene="${SCENE_ID}"] .shot`).nth(handoverIndex);

    await holdAt(page, SCENE_ID, next.start + tail * 0.2);
    const early = Number(await outgoing.evaluate((node) => getComputedStyle(node).scale));

    await holdAt(page, SCENE_ID, next.start + tail * 0.8);
    const late = Number(await outgoing.evaluate((node) => getComputedStyle(node).scale));

    // The outgoing composition keeps growing toward the viewer as it hands off,
    // rather than only fading in place: an occlusion/zoom transition, not a wash.
    expect(late).toBeGreaterThan(early);
  });

  test(`${entry.url} ${SCENE_ID}: reduced motion changes the active shot's computed style`, async ({
    page,
  }) => {
    await page.goto(url);
    await focusScene(page, SCENE_ID);

    // Comfortably inside a shot rather than at a boundary, so what changes is the
    // ordinary per-frame motion rather than a handover already covered elsewhere.
    await holdAt(page, SCENE_ID, 0.45);

    const activeAliceRotate = () =>
      page
        .locator(
          `.scene[data-scene="${SCENE_ID}"] .shot[data-state="active"] .scene-rabbit-hole__alice`,
        )
        .evaluate((node) => getComputedStyle(node).rotate);

    const full = await activeAliceRotate();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await activeAliceRotate();

    expect(reduced).not.toBe(full);
  });

  test(`${entry.url} ${SCENE_ID}: reduced motion drops the perspective vantage`, async ({
    page,
  }) => {
    await page.goto(url);
    await focusScene(page, SCENE_ID);

    // Positional rather than by id: whichever shot is given a 3D vantage in the
    // full-motion stylesheet must lose it under reduced motion.
    const perspectiveIndex = await page
      .locator(`.scene[data-scene="${SCENE_ID}"] .shot`)
      .evaluateAll((nodes) =>
        nodes.findIndex((node) => getComputedStyle(node).perspective !== 'none'),
      );
    if (perspectiveIndex < 0) {
      throw new Error(`${SCENE_ID} declares no shot with a perspective vantage to test`);
    }
    const shot = page.locator(`.scene[data-scene="${SCENE_ID}"] .shot`).nth(perspectiveIndex);
    const start = Number(
      await page
        .locator(`.scene[data-scene="${SCENE_ID}"] .shot`)
        .nth(perspectiveIndex)
        .getAttribute('data-start'),
    );
    await holdAt(page, SCENE_ID, start + 0.01);

    expect(await shot.evaluate((node) => getComputedStyle(node).perspective)).not.toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await shot.evaluate((node) => getComputedStyle(node).perspective)).toBe('none');
  });
}
