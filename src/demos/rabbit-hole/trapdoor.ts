/**
 * The strange door: the trapdoor in the ceiling of the hall of doors, seen from
 * above as the rabbit hole's tunnel of doors, and the last of them open on the
 * hall's checkered floor. Drawn once here with `trapdoor.css`, so the rabbit hole's
 * last frame and the frame Drink Me opens on are the same door by construction.
 */

import './trapdoor.css';
import { type ArtStyle, artStyle } from '../art/treatments.ts';

const TRAPDOOR_IMAGE = new URL(
  '../../assets/images/figures/trapdoor-room.any.generated.webp',
  import.meta.url,
).href;

/** How many doors the tunnel has; the last opens on the hall. */
export const TUNNEL_DOORS = 6;

/** How far each door is turned, alternately, so the tunnel twists as it falls. */
export const doorTurn = (index: number): number => (index % 2 ? 1 : -1) * (4 + index * 3);

/** One door: its light, the hall's floor below it if it is the last, and its leaf. */
export function trapdoorHtml(
  index: number,
  className: string,
  style: ArtStyle = typeof document === 'undefined' ? 'flat' : artStyle(),
): string {
  const floor = index === TUNNEL_DOORS - 1 ? '<div class="trapdoor__floor"></div>' : '';
  const image =
    style === 'engraved'
      ? `<img class="trapdoor__leaf-art" src="${TRAPDOOR_IMAGE}" alt="" aria-hidden="true" decoding="async">`
      : '';
  return `<div class="trapdoor ${className}" style="--i: ${index}; --turn: ${doorTurn(index)}"><div class="trapdoor__light"></div>${floor}<div class="trapdoor__leaf">${image}</div></div>`;
}
