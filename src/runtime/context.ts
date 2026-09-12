/**
 * What a scene is told about the world.
 *
 * The runtime owns these values; a scene never measures the window or reads the
 * scroll position itself. See docs/implementation-charter.md §7.
 */

import type { Direction } from './progress.ts';

export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

/** Lowered when the device or the visitor's preferences ask for less work. */
export type QualityTier = 'full' | 'reduced';

export interface RuntimeContext {
  progress: number;
  direction: Direction;
  /** Normalized progress per second. */
  velocity: number;
  viewport: Viewport;
  reducedMotion: boolean;
  quality: QualityTier;
  /** Optional layers a test or a failure may switch off. */
  effects: boolean;
  audio: boolean;
}

export const readViewport = (view: Window = window): Viewport => ({
  width: view.innerWidth,
  height: view.innerHeight,
  // Capping the device ratio keeps Canvas and WebGL buffers honest on dense phones.
  dpr: Math.min(view.devicePixelRatio || 1, 2),
});

export const prefersReducedMotion = (view: Window = window): boolean =>
  view.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The starting quality tier.
 *
 * Reduced motion is a comfort preference rather than a performance one, but both end
 * up asking for less motion, so they share the tier until profiling says otherwise.
 */
export function initialQuality(view: Window = window): QualityTier {
  if (prefersReducedMotion(view)) {
    return 'reduced';
  }
  const cores = view.navigator.hardwareConcurrency ?? 4;
  return cores <= 4 ? 'reduced' : 'full';
}
