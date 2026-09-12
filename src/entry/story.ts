/**
 * Story page entry.
 *
 * Without JavaScript the page stays a readable document in reading order; the
 * runtime turns it into a staged scene. The ordering that makes measurement correct
 * lives in `attachStory`, not here.
 */

import { attachStory } from '../runtime/attach.ts';
import { installProbe } from '../runtime/probe.ts';
import '../styles/scene.css';

const story = document.querySelector<HTMLElement>('.story');
const coordinator = story ? attachStory(story) : undefined;
const drivers = coordinator?.drivers ?? [];

installProbe(drivers);

if (import.meta.env.DEV && drivers.length > 0) {
  const { installDebugOverlay } = await import('../runtime/debug-overlay.ts');
  installDebugOverlay(drivers);
}
