/**
 * Which scenes bring a renderer of their own.
 *
 * Deliberately a lookup and not a registry: nothing registers itself, nothing is
 * discovered, and adding a scene with a Canvas layer means adding a line here. The
 * runtime asks by scene id so that `runtime/` never imports a scene, which is the
 * same direction of dependency the rest of the boundary already runs in.
 */

import type { ShotRenderer } from '../runtime/shot-renderer.ts';
import { createDustRenderer } from './rabbit-hole/dust.ts';

export function renderersFor(sceneId: string): ShotRenderer[] {
  return sceneId === 'rabbit-hole' ? [createDustRenderer()] : [];
}
