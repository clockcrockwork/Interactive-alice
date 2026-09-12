/**
 * Story page entry: attaches the runtime to every scene the page carries.
 *
 * Without JavaScript the page stays a readable document in reading order. This turns
 * it into a staged scene, which is why the mode switch happens here rather than in the
 * generated markup.
 */

import { installProbe } from '../runtime/probe.ts';
import { SceneDriver } from '../runtime/scene-driver.ts';
import { readUnits, Stage } from '../runtime/stage.ts';
import '../styles/scene.css';

const story = document.querySelector<HTMLElement>('.story');
const drivers: SceneDriver[] = [];

if (story) {
  for (const scene of story.querySelectorAll<HTMLElement>('.scene')) {
    const track = scene.querySelector<HTMLElement>('[data-scene-track]');
    if (!track) {
      continue;
    }
    const shots = readUnits(scene, '.shot');
    const beats = readUnits(scene, '.beat');
    const stage = new Stage(scene, [...shots, ...beats]);
    const driver = new SceneDriver({
      scene,
      track,
      shots: shots.map((unit) => unit.span),
      beats: beats.map((unit) => unit.span),
      onUpdate: (context) => stage.apply(context),
    });
    driver.mount();
    drivers.push(driver);
  }

  story.dataset.mode = 'scene';
  story.dataset.ready = 'true';
  installProbe(drivers);
}

if (import.meta.env.DEV && drivers.length > 0) {
  const { installDebugOverlay } = await import('../runtime/debug-overlay.ts');
  installDebugOverlay(drivers);
}
