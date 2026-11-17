/**
 * Steering by tilting: a phone's orientation, read as a pointer on the screen.
 *
 * `deviceorientation` reports `beta` (front to back) and `gamma` (left to right)
 * in the device's own frame, which turns with the device while the screen's frame
 * does not. The screen's angle (`screen.orientation.angle`) says how far it has
 * turned, so the same lean steers the same way on the screen in portrait and in
 * either landscape.
 */

/** Degrees of lean that reach the edge of the screen. */
export const TILT_RANGE = 25;
/** How far back a phone held to be read leans, in degrees: level is the middle. */
export const TILT_REST = 45;

/**
 * The pointer, -1..1 on both axes with y down, that a device lean steers to, for
 * a screen turned by `angle` degrees (0, 90, 180 or 270; anything else is taken to
 * the nearest of them).
 */
export function tiltToPointer(
  beta: number,
  gamma: number,
  angle: number,
): { x: number; y: number } {
  const turn = ((Math.round(angle / 90) % 4) + 4) % 4;
  // The lean along the screen's own right and down, before the reading rest.
  const [right, back] =
    turn === 1
      ? [beta, -gamma]
      : turn === 2
        ? [-gamma, -beta]
        : turn === 3
          ? [-beta, gamma]
          : [gamma, beta];
  // `+ 0` so a level lean is 0, never -0.
  const clamp = (v: number): number => Math.max(-1, Math.min(1, v)) + 0;
  return { x: clamp(right / TILT_RANGE), y: clamp((back - TILT_REST) / TILT_RANGE) };
}

/** Whether an orientation event carries a reading: some devices send only nulls. */
export const validTilt = (event: { beta: number | null; gamma: number | null }): boolean =>
  typeof event.beta === 'number' &&
  typeof event.gamma === 'number' &&
  Number.isFinite(event.beta) &&
  Number.isFinite(event.gamma);
