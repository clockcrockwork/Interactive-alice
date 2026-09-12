/**
 * Development overlay: the scene's state, visible while building it.
 *
 * Never shipped. The bundler drops this module's call in production, and the values
 * it shows come from the same snapshot the tests read, so the overlay and the suite
 * can never disagree about what the runtime thinks.
 */

import type { SceneDriver } from './scene-driver.ts';

const FIELDS = ['progress', 'shot', 'beat', 'direction', 'velocity', 'quality'] as const;

export function installDebugOverlay(drivers: readonly SceneDriver[]): () => void {
  const panel = document.createElement('aside');
  panel.className = 'debug-overlay';
  panel.setAttribute('aria-hidden', 'true');
  document.body.append(panel);

  const render = (): void => {
    panel.textContent = drivers
      .map((driver) => {
        const snapshot = driver.snapshot();
        const values = FIELDS.map((field) => {
          const value = snapshot[field];
          return `${field} ${typeof value === 'number' ? value.toFixed(3) : String(value)}`;
        });
        const { width, height, dpr } = snapshot.viewport;
        return [
          `${snapshot.scene} · ${snapshot.state}${snapshot.overridden ? ' · held' : ''}`,
          ...values,
          `viewport ${width}×${height} @${dpr}`,
          `reduced motion ${snapshot.reducedMotion}`,
        ].join('\n');
      })
      .join('\n\n');
  };

  let frame = requestAnimationFrame(function loop() {
    render();
    frame = requestAnimationFrame(loop);
  });

  return () => {
    cancelAnimationFrame(frame);
    panel.remove();
  };
}
