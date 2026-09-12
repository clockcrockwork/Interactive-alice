/**
 * The test and debug seam.
 *
 * Browser tests need to set progress, read state, and switch optional layers off, as
 * docs/testing.md §3 requires. Those tests run against the production build, so the
 * seam ships, but only attaches itself when asked: `?probe=1`, or in development.
 */

import type { QualityTier } from './context.ts';
import type { SceneDriver, SceneSnapshot } from './scene-driver.ts';

export interface AliceProbe {
  setProgress(progress: number): void;
  releaseProgress(): void;
  snapshot(): SceneSnapshot[];
  setFlags(flags: { effects?: boolean; audio?: boolean; quality?: QualityTier }): void;
}

export const probeRequested = (): boolean =>
  import.meta.env.DEV || new URLSearchParams(location.search).has('probe');

export function installProbe(drivers: readonly SceneDriver[]): void {
  if (!probeRequested()) {
    return;
  }
  window.__alice = {
    setProgress: (progress) => {
      for (const driver of drivers) {
        driver.setProgress(progress);
      }
    },
    releaseProgress: () => {
      for (const driver of drivers) {
        driver.releaseProgress();
      }
    },
    snapshot: () => drivers.map((driver) => driver.snapshot()),
    setFlags: (flags) => {
      for (const driver of drivers) {
        driver.setFlags(flags);
      }
    },
  };
}
