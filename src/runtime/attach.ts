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

/**
 * Marks the document as running in a reduced form, so degradation is observable.
 *
 * Console output is for whoever has the console open; `data-degraded` is what a test,
 * a support request or a later diagnostic can read off the page itself.
 */
function degrade(story: HTMLElement, reason: 'markup' | 'mount'): void {
  story.dataset.degraded = reason;
}

export function attachStory(story: HTMLElement): SceneDriver[] {
  // Preflight: read the markup and construct, while the document is still in flow.
  const prepared: Prepared[] = [];
  let unreadable = 0;
  try {
    for (const scene of story.querySelectorAll<HTMLElement>('.scene')) {
      const track = scene.querySelector<HTMLElement>('[data-scene-track]');
      const stage = scene.querySelector<HTMLElement>('[data-scene-stage]');
      if (!track || !stage) {
        // A scene without a track or a stage cannot be driven, and staging is a
        // decision about the whole document: the stylesheet keys off `data-mode` on
        // the story, so a scene left out of staging would still be laid out as if it
        // were staged, and would become unreadable. So one unstageable scene means
        // the document stays in flow. Staging part of a document would need the mode
        // to move onto each scene, in CSS as well as here.
        unreadable += 1;
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
    degrade(story, 'markup');
    return [];
  }

  if (unreadable > 0) {
    console.error(`Interactive Alice: ${unreadable} scene(s) cannot be staged`);
    degrade(story, 'markup');
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
    degrade(story, 'mount');
    return [];
  }

  story.dataset.ready = 'true';
  return mounted;
}
