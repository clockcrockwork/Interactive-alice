/**
 * The field at the hedge: one picture, drawn once, where the riverbank ends and the
 * rabbit hole begins. The ground, a far tree, the hedge, the hole under it with the
 * Rabbit nose-down in it, and Alice from behind running after him. Both demos
 * mount this markup with `field.css`, so the last frame of one and the first of the
 * other are the same frame by construction, not by matching numbers.
 *
 * Alice's stride is the reader's scroll: `createStride` turns how far the page
 * moved into how far her legs swing, so scrolling fast is running fast and a page
 * at rest is a girl standing still.
 */

import { figure } from '../art/art.ts';
import './field.css';

export function fieldHtml(): string {
  return (
    '<div class="field__land">' +
    '<div class="field__ground"></div>' +
    '<div class="field__tree"></div>' +
    '<div class="field__hedge"></div>' +
    '<div class="field__hole"></div>' +
    `<div class="field__burrow"><div class="field__rabbit">${figure('white-rabbit/diving')}</div></div>` +
    '</div>' +
    `<div class="field__alice"><div class="field__runner">${figure('alice/running-away')}</div></div>`
  );
}

/** Strides per beat of scroll at full running pace. */
const STRIDES_PER_BEAT = 5;

/**
 * Her legs and arms, driven by the scroll. `step` takes how many beats the page
 * moved since the last frame and the frame's length; it eases the swing toward the
 * pace, so she slows to a stand when the reader stops.
 */
export function createStride(alice: HTMLElement, reduced: boolean) {
  let phase = 0;
  let amp = 0;
  let written = '';
  const write = (left: number, right: number, swing: number, bob: number): void => {
    const key = `${left.toFixed(3)}|${right.toFixed(3)}|${swing.toFixed(3)}|${bob.toFixed(3)}`;
    if (key === written) {
      return;
    }
    written = key;
    alice.style.setProperty('--lift-l', left.toFixed(3));
    alice.style.setProperty('--lift-r', right.toFixed(3));
    alice.style.setProperty('--swing', swing.toFixed(3));
    alice.style.setProperty('--bob', bob.toFixed(3));
  };
  if (reduced) {
    // Designed still: caught mid-stride, one foot up behind her.
    write(0.7, 0, 0.6, 0.6);
  } else {
    write(0, 0, 0, 0);
  }
  return {
    step(beatsMoved: number, dt: number): void {
      if (reduced) {
        return;
      }
      const pace = Math.min(1, Math.abs(beatsMoved) / Math.max(dt, 0.001) / 1.2);
      amp += (pace - amp) * Math.min(1, dt * 6);
      phase += Math.abs(beatsMoved) * STRIDES_PER_BEAT * Math.PI * 2;
      const s = Math.sin(phase);
      write(Math.max(0, s) * amp, Math.max(0, -s) * amp, s * amp, Math.abs(s) * amp);
    },
  };
}
