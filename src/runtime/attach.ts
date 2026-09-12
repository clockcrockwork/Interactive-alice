/**
 * Attaches the runtime to a story document.
 *
 * The order matters twice over:
 *
 * 1. Everything that can fail is built **before** the page changes mode, so a broken
 *    scene leaves a readable document rather than a staged one nobody can read.
 * 2. Staged mode is applied and layout flushed **before** anything measures, because
 *    the track's scroll distance comes from CSS that applies only in that mode.
 */

import { SceneDriver } from './scene-driver.ts';
import { readUnits, Stage } from './stage.ts';

interface Prepared {
  driver: SceneDriver;
}

export function attachStory(story: HTMLElement): SceneDriver[] {
  // Preflight: read the markup and construct, while the document is still in flow.
  const prepared: Prepared[] = [];
  try {
    for (const scene of story.querySelectorAll<HTMLElement>('.scene')) {
      const track = scene.querySelector<HTMLElement>('[data-scene-track]');
      const stage = scene.querySelector<HTMLElement>('[data-scene-stage]');
      if (!track || !stage) {
        continue;
      }
      const shots = readUnits(scene, '.shot');
      const beats = readUnits(scene, '.beat');
      const staging = new Stage(scene, [...shots, ...beats]);
      prepared.push({
        driver: new SceneDriver({
          scene,
          track,
          stage,
          shots: shots.map((unit) => unit.span),
          beats: beats.map((unit) => unit.span),
          onUpdate: (context) => staging.apply(context),
        }),
      });
    }
  } catch (error) {
    // Nothing has changed yet, so the document is still the readable fallback.
    console.error('Interactive Alice: scene markup could not be read', error);
    return [];
  }

  if (prepared.length === 0) {
    return [];
  }

  story.dataset.mode = 'scene';
  // Reading a layout property applies what we just changed before anyone measures.
  void story.offsetHeight;

  const mounted: SceneDriver[] = [];
  try {
    for (const { driver } of prepared) {
      driver.mount();
      mounted.push(driver);
    }
  } catch (error) {
    // Put the page back the way a visitor can read it, then give up on staging.
    console.error('Interactive Alice: the scene runtime failed to mount', error);
    for (const driver of mounted) {
      driver.destroy();
    }
    delete story.dataset.mode;
    return [];
  }

  story.dataset.ready = 'true';
  return mounted;
}
