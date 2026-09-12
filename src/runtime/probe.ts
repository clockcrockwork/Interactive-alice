/**
 * The test and debug seam.
 *
 * Browser tests need to set progress, read state, and switch optional layers off, as
 * docs/testing.md §3 requires. Those tests run against the production build, so the
 * seam ships, but only attaches itself when asked: `?probe=1`, or in development.
 *
 * Every call addresses a scene by id, because a document may host several scenes and
 * driving them all to the same progress is a state real scrolling never produces.
 * Omitting the id means every scene, which is only ever right for a page with one.
 */

import type { QualityTier } from './context.ts';
import type { SceneDriver, SceneSnapshot } from './scene-driver.ts';

export interface ProbeFlags {
  effects?: boolean;
  audio?: boolean;
  quality?: QualityTier;
}

export interface AliceProbe {
  /** Scene ids on this page, in document order. */
  scenes(): string[];
  setProgress(sceneId: string, progress: number): void;
  releaseProgress(sceneId?: string): void;
  snapshot(sceneId?: string): SceneSnapshot[];
  setFlags(flags: ProbeFlags, sceneId?: string): void;
}

export const probeRequested = (): boolean =>
  import.meta.env.DEV || new URLSearchParams(location.search).has('probe');

const sceneIdOf = (driver: SceneDriver): string => driver.snapshot().scene;

function select(drivers: readonly SceneDriver[], sceneId: string | undefined): SceneDriver[] {
  if (sceneId === undefined) {
    return [...drivers];
  }
  const found = drivers.filter((driver) => sceneIdOf(driver) === sceneId);
  if (found.length === 0) {
    throw new Error(`no scene ${sceneId} on this page`);
  }
  return found;
}

export function installProbe(drivers: readonly SceneDriver[]): void {
  if (!probeRequested()) {
    return;
  }
  window.__alice = {
    scenes: () => drivers.map(sceneIdOf),
    setProgress: (sceneId, progress) => {
      for (const driver of select(drivers, sceneId)) {
        driver.setProgress(progress);
      }
    },
    releaseProgress: (sceneId) => {
      for (const driver of select(drivers, sceneId)) {
        driver.releaseProgress();
      }
    },
    snapshot: (sceneId) => select(drivers, sceneId).map((driver) => driver.snapshot()),
    setFlags: (flags, sceneId) => {
      for (const driver of select(drivers, sceneId)) {
        driver.setFlags(flags);
      }
    },
  };
}
