/**
 * The court of the King and Queen of Hearts, shared by the two demos that play
 * in it: the witnesses (chapter 11 and the evidence of chapter 12) and the trial's
 * end (the sentence, the pack, the bank). A paper theatre: flat cutouts standing
 * at different depths inside one CSS perspective, so a sideways dolly separates
 * them into layers. The camera is a few unitless numbers on the court, tweened
 * by each demo; the jury writes on its slates whenever a sentence lands.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { type MarkShape, slateMark } from '../art/vectors.ts';
import type { DemoShell } from '../shell/shell.ts';
import { seeded } from '../shell/shell.ts';
import { TARTS_SVG, WITNESS_BOX_SVG } from './figures.ts';
import './court.css';

const SUITS = [
  ['hearts', '♥'],
  ['diamonds', '♦'],
  ['clubs', '♣'],
  ['spades', '♠'],
] as const;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export interface CameraShot {
  /** Court x in vw. */
  x: number;
  /** Push-in in px. */
  z: number;
  /** Yaw in degrees. */
  ry?: number;
  /** Height in vh: negative lifts the camera. */
  y?: number;
  /** Pitch in degrees: negative looks down. */
  rx?: number;
}

/**
 * Where the camera is once Alice has grown to her full size: a mile up, the
 * court small and far below, the dark of the hall's height above it, and her
 * head out of the top of the frame. The witnesses end on it and the trial opens
 * on it, so the two demos are one frame at the join.
 */
export const HIGH_SHOT: CameraShot = { x: 10, z: -1050, y: -40, rx: -24 };

/** The crowd of cards: two packs' worth on a desktop, half that on a phone. */
export const packSize = (): number => (window.innerWidth < 720 ? 56 : 104);

export function buildCourt(court: HTMLElement): void {
  const piece = (className: string, svg: string): string =>
    `<div class="tr__piece ${className}">${svg}</div>`;
  court.innerHTML =
    '<div class="tr__backdrop"></div><div class="tr__floor"></div>' +
    piece('tr__jury', figure('jury')) +
    piece('tr__soldier tr__soldier--left', figure('card-soldier')) +
    piece('tr__knave', figure('knave-of-hearts')) +
    piece('tr__soldier tr__soldier--right', figure('card-soldier')) +
    piece('tr__throne tr__throne--king', figure('king-of-hearts')) +
    piece('tr__throne tr__throne--queen', figure('queen-of-hearts')) +
    piece('tr__herald', figure('white-rabbit/herald')) +
    piece('tr__witness-box', WITNESS_BOX_SVG) +
    piece('tr__tarts', TARTS_SVG) +
    '<div class="tr__pack"></div>';
}

export interface Card {
  el: HTMLElement;
  /** Where it stands in the crowd, in court units. */
  home: { x: number; y: number; z: number; rx: number; ry: number };
  stuck: boolean;
}

export function buildPack(pack: HTMLElement, count: number): Card[] {
  const random = seeded(52);
  const cards: Card[] = [];
  let index = 0;
  for (const [suit, pip] of SUITS) {
    for (const rank of RANKS) {
      if (index >= count) {
        break;
      }
      const el = document.createElement('div');
      el.className = 'tr__card';
      el.dataset.suit = suit;
      el.dataset.rank = rank;
      el.dataset.pip = pip;
      el.style.setProperty('--i', String(index));
      pack.append(el);
      // Two crowds, left and right of the throne, in loose rows.
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2) % 6;
      const column = Math.floor(index / 12);
      const home = {
        x: side * (14 + column * 7 + random() * 4) + (side < 0 ? -6 : 6),
        y: 8 + row * 3.2 + random() * 2,
        z: -260 + row * 40 + random() * 30,
        rx: 0,
        ry: side * -18 + (random() - 0.5) * 12,
      };
      gsap.set(el, {
        x: `${home.x}vw`,
        y: `${home.y}vh`,
        z: home.z,
        rotationY: home.ry,
        rotationX: home.rx,
        transformPerspective: 0,
      });
      cards.push({ el, home, stuck: false });
      index += 1;
    }
  }
  return cards;
}

export interface Camera {
  /** A tween to the shot placed at `at`: a move, or under reduced motion a cut softened by a dip. */
  to(shot: CameraShot, at: number, duration?: number): void;
}

/**
 * The camera, as four numbers on the court. `start` is where it stands before the
 * first beat; each shot then holds until the next.
 */
export function mountCamera(
  shell: DemoShell,
  world: HTMLElement,
  court: HTMLElement,
  start: CameraShot,
): Camera {
  const { master, reducedMotion } = shell;
  const camera = { x: start.x, z: start.z, ry: start.ry ?? 0, y: start.y ?? 0, rx: start.rx ?? 0 };
  const apply = (): void => {
    court.style.setProperty('--cam-x', camera.x.toFixed(2));
    court.style.setProperty('--cam-z', camera.z.toFixed(1));
    court.style.setProperty('--cam-ry', camera.ry.toFixed(2));
    court.style.setProperty('--cam-y', camera.y.toFixed(2));
    court.style.setProperty('--cam-rx', camera.rx.toFixed(2));
  };
  apply();
  return {
    to(shot, at, duration = 0.7) {
      const to = { x: shot.x, z: shot.z, ry: shot.ry ?? 0, y: shot.y ?? 0, rx: shot.rx ?? 0 };
      if (reducedMotion) {
        // A cut, softened by a dip to black rather than a move.
        master.to(world, { opacity: 0.2, duration: 0.05 }, at);
        master.set(camera, { ...to, onUpdate: apply }, at + 0.05);
        master.to(world, { opacity: 1, duration: 0.2 }, at + 0.05);
      } else {
        master.to(camera, { ...to, duration, ease: 'power2.inOut', onUpdate: apply }, at);
      }
    },
  };
}

/** The marks where a page carries none: a tick for yes, a cross for no. */
export const TICK_AND_CROSS: { yes: MarkShape; no: MarkShape } = { yes: 'check', no: 'cross' };

/**
 * Each slate's two marks in the shapes the page's language writes for yes and no
 * (its realia `marks`: a tick, or a circle where a tick reads as wrong).
 */
export function drawMarks(
  slates: readonly SVGGElement[],
  shapes: { yes: MarkShape; no: MarkShape },
): void {
  for (const slate of slates) {
    const x = Number(slate.dataset.x);
    const y = Number(slate.dataset.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    for (const verdict of ['yes', 'no'] as const) {
      const mark = slate.querySelector<SVGPathElement>(`.tr__mark--${verdict}`);
      mark?.setAttribute('d', slateMark(shapes[verdict], x, y));
      if (mark) {
        mark.dataset.shape = shapes[verdict];
      }
    }
  }
}

export interface Jury {
  piece: HTMLElement | null;
  slates: SVGGElement[];
  /** Every slate scribbles a line, and each juror decides whether it was important. */
  write(): void;
  /** The juror buttons, one per slate; empty when the jury does not listen. */
  buttons: HTMLButtonElement[];
  /** Whether the jurors take the pointer. */
  listen(on: boolean): void;
}

/**
 * The jury write it all down: every sentence lands as a scribble on each slate,
 * until `until`. With `buttons`, each juror is a real button that changes its mind.
 */
export function mountJury(
  shell: DemoShell,
  court: HTMLElement,
  options: { until: number; buttons: boolean },
): Jury {
  const { master, reducedMotion } = shell;
  const piece = court.querySelector<HTMLElement>('.tr__jury');
  const slates = [...court.querySelectorAll<SVGGElement>('.tr__slate')];
  drawMarks(slates, shell.realia('marks') ?? TICK_AND_CROSS);
  const marks = seeded(23);
  const buttons = options.buttons
    ? slates.map((slate, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tr__juror';
        button.style.setProperty('--i', String(i));
        button.setAttribute('aria-label', shell.ui.demoJurorToggle ?? '');
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
          const next = slate.dataset.verdict === 'yes' ? 'no' : 'yes';
          slate.dataset.verdict = next;
          button.setAttribute('aria-pressed', String(next === 'yes'));
        });
        piece?.append(button);
        return button;
      })
    : [];
  const write = (): void => {
    for (const [i, slate] of slates.entries()) {
      gsap.fromTo(
        slate,
        { '--written': 0 },
        { '--written': 1, duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : i * 0.04 },
      );
      const yes = marks() < 0.5;
      slate.dataset.verdict = yes ? 'yes' : 'no';
      buttons[i]?.setAttribute('aria-pressed', String(yes));
    }
  };
  for (const beat of shell.beats) {
    if (beat.index >= options.until) {
      continue;
    }
    master.call(
      () => (master.time() >= beat.index + 0.05 ? write() : undefined),
      [],
      beat.index + 0.05,
    );
  }
  return {
    piece,
    slates,
    write,
    buttons,
    listen: (on) => piece?.toggleAttribute('data-listening', on),
  };
}

/**
 * The air between her and the court once she is a mile high: wisps of cloud
 * drifting across below her shoulders, the court far down through them. Each
 * demo sets the layer's opacity, and `data-shown` while it is up; the drift is
 * a CSS animation that runs only then, the motion pause holds, and is a still
 * under reduced motion.
 */
export function mountHeight(shell: DemoShell): HTMLElement {
  const layer = shell.layer('tr__height');
  const random = seeded(42);
  layer.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const y = 14 + i * 9 + random() * 6;
    const w = 34 + random() * 30;
    const d = 38 + random() * 26;
    return `<div class="tr__wisp" style="--y: ${y.toFixed(1)}%; --w: ${w.toFixed(1)}; --d: ${d.toFixed(1)}s; --delay: ${(-random() * d).toFixed(1)}s; --o: ${(0.28 + random() * 0.3).toFixed(2)}"></div>`;
  }).join('');
  return layer;
}

/**
 * Alice at her full size, in front of everything, seen from behind: over her
 * shoulder at the court's right, so the throne and the Queen stay clear of her.
 * The witnesses grow her into this frame and the trial opens on it.
 */
export function mountAlice(shell: DemoShell): HTMLElement | null {
  const layer = shell.layer('tr__alice-layer');
  layer.innerHTML = `<div class="tr__alice">${figure('alice/from-behind')}</div>`;
  return layer.querySelector<HTMLElement>('.tr__alice');
}
