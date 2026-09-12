/**
 * Attaches the runtime to a story document.
 *
 * The ordering here is the contract: the page goes into its staged mode, layout is
 * flushed, and only then does a driver measure. The track's scroll distance comes
 * from CSS that applies only in staged mode, so measuring first reads the flow
 * layout and gets the distance wrong.
 */

import { SceneDriver } from './scene-driver.ts';
import { readUnits, Stage } from './stage.ts';

export function attachStory(story: HTMLElement): SceneDriver[] {
  // 1. Switch modes, so the staged CSS applies.
  story.dataset.mode = 'scene';
  // 2. Flush layout before anyone measures. Reading a layout property is the
  //    documented way to make the browser apply what we just changed.
  void story.offsetHeight;

  // 3. Now measure and mount.
  const drivers: SceneDriver[] = [];
  for (const scene of story.querySelectorAll<HTMLElement>('.scene')) {
    const track = scene.querySelector<HTMLElement>('[data-scene-track]');
    const stageElement = scene.querySelector<HTMLElement>('[data-scene-stage]');
    if (!track || !stageElement) {
      continue;
    }
    const shots = readUnits(scene, '.shot');
    const beats = readUnits(scene, '.beat');
    const stage = new Stage(scene, [...shots, ...beats]);
    const driver = new SceneDriver({
      scene,
      track,
      stage: stageElement,
      shots: shots.map((unit) => unit.span),
      beats: beats.map((unit) => unit.span),
      onUpdate: (context) => stage.apply(context),
    });
    driver.mount();
    drivers.push(driver);
  }

  story.dataset.ready = 'true';
  return drivers;
}
