/**
 * The Mouse's tale: the concept demo.
 *
 * The same bank as the Caucus-race, the party gathered round Alice as the race
 * left them, the thimble in her hand, and the camera comes down low as they sit
 * in a ring and beg the Mouse for its tale. Then the tale is a tail: the verses
 * the Mouse speaks are laid along a long curve that starts at the Mouse's own
 * tail and winds down the bank, each line a little smaller than the last, as the
 * book sets it, and the camera follows the words down. The reader may read the
 * tail up close under a glass, or pull it and the words slide along; at the knot
 * the curve ties itself, and undoing it only offends the Mouse, who walks off
 * with its tail-text trailing after. The party calls after it, Dinah is a ghost
 * over the sky, the birds go off on their pretexts, and Alice is left alone until
 * footsteps patter in from the distance, where the Rabbit's house waits: the
 * frame the next demo opens on.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import {
  dressRunner,
  HANDS,
  huddleSlot,
  RUNNERS,
  type RunnerKind,
  THIMBLE_SVG,
} from '../caucus-race/figures.ts';
import { DISTANT_HOUSE, HOUSE_FRONT_SVG } from '../rabbit-house/front.ts';
import { attachDemo, type Beat, type DemoShell, mix } from '../shell/shell.ts';
import '../caucus-race/caucus.css';
import '../rabbit-house/house.css';
import './mouse-tale.css';
import { CANARY_SVG, FOOTPRINTS_SVG, SCARF, TEAR_SVG } from './figures.ts';

const SVG = 'http://www.w3.org/2000/svg';
/** Samples per path; the chunks are placed by interpolation between them. */
const SAMPLES = 180;
/** A line of the tail and the next are this many of its own sizes apart, so they never touch. */
const PITCH = 1.4;
/** Where the knot ties itself, as a share of the tail's length. */
const KNOT_FROM = 0.4;
const KNOT_TO = 0.62;

interface Member {
  kind: RunnerKind | 'canary';
  el: HTMLButtonElement;
  angle: number;
  /** 1 once this one has gone off: the timeline's share, and a tap's. */
  leave: { v: number };
  tap: { v: number };
}

interface Chunk {
  el: SVGTextElement;
  beat: Beat;
  /** Position down the plain tail, in px, before any pull. */
  s: number;
  size: number;
  /** Where it was last laid out, in the tail's own px (the stage's, before the pan). */
  x: number;
  y: number;
}

type Point = [number, number];

/** The verses of the tale are the beats whose cue names a verse. */
const isVerse = (beat: Beat): boolean => beat.cue?.startsWith('fury-') === true;

/**
 * The words of a line in groups, the last group never a single word. The book's
 * lines are three or four words long: four where the stage is wide enough.
 */
function chunksOf(text: string, perChunk: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += perChunk) {
    groups.push(words.slice(i, i + perChunk).join(' '));
  }
  if (groups.length > 1 && !groups[groups.length - 1]?.includes(' ')) {
    const last = groups.pop();
    groups[groups.length - 1] = `${groups[groups.length - 1]} ${last}`;
  }
  return groups;
}

/**
 * The tail as a serpentine from `start`, `height` down: a sine wave about a
 * line drifting toward the middle, narrowing as it goes, and always going down
 * at the chunks' own pitch, so the lines stack as the book's do and never meet.
 * The knot variant ties a loop into its lower third and is continuous with the
 * plain one at both ends, so the two interpolate point for point.
 */
function sampleTail(
  start: Point,
  width: number,
  height: number,
  amplitude: number,
  knot: boolean,
  bends: number,
): Point[] {
  const [sx, sy] = start;
  // A little drift toward the middle, and never off the side.
  const ex = Math.min(Math.max(mix(sx, width * 0.5, 0.3), amplitude + 20), width - amplitude - 20);
  const points: Point[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES;
    const cx = mix(sx, ex, t);
    // The wave grows out of the Mouse's tail and narrows toward the tip.
    const a = amplitude * Math.min(1, t * 5) * (1 - 0.6 * t);
    const x = cx + a * Math.sin(2 * Math.PI * bends * t + Math.PI);
    const y = sy + height * t;
    if (knot && t > KNOT_FROM && t < KNOT_TO) {
      const u = (t - KNOT_FROM) / (KNOT_TO - KNOT_FROM);
      const r = Math.max(34, a);
      const theta0 = -Math.PI / 2;
      const theta = theta0 + 2 * Math.PI * u;
      points.push([
        x + r * (Math.cos(theta) - Math.cos(theta0)),
        y + r * (Math.sin(theta) - Math.sin(theta0)),
      ]);
    } else {
      points.push([x, y]);
    }
  }
  return points;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iRing = cue('ring');
  const iSad = cue('sad');
  const iTail = cue('tail');
  const iFuryOne = cue('fury-one');
  const iAttending = cue('attending');
  const iKnot = cue('knot');
  const iAway = cue('away');
  const iComeBack = cue('come-back');
  const iDinah = cue('dinah');
  const iSensation = cue('sensation');
  const iAlone = cue('alone');
  const iFootsteps = cue('footsteps');
  const lite = matchMedia('(max-width: 700px)').matches;
  // Reduced motion lands on whole beats, so a change that belongs inside beat i
  // is cut in just before the landing it must be seen at.
  const before = (i: number): number => Math.max(0, i - 0.02);
  const during = (i: number, frac: number): number => (reducedMotion ? before(i + 1) : i + frac);
  const at = (i: number, frac: number): number => (reducedMotion ? before(i) : i + frac);
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);

  // --- The bank and the ring, the race's own.
  shell.layer('cr__sky');
  const world = shell.layer('cr__world');
  const ring = document.createElement('div');
  ring.className = 'cr__ring';
  // The race's chalk course, still drawn as the race left it; it wears off as
  // the party sits down again.
  ring.innerHTML =
    '<svg class="cr__course" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" pathLength="1" style="--drawn: 1"/></svg>';
  world.append(ring);
  const course = ring.querySelector<SVGElement>('.cr__course');
  const makeMember = (kind: RunnerKind | 'canary', index: number, angle: number): Member => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'cr__runner mt__member';
    el.dataset.kind = kind;
    el.disabled = true;
    el.style.setProperty('--i', String(index));
    if (kind === 'canary') {
      el.innerHTML = `<span class="art">${CANARY_SVG}</span>`;
    } else {
      el.innerHTML = figure(`runner/${kind}`);
      dressRunner(el, kind);
    }
    if (kind === 'alice') {
      el.insertAdjacentHTML('beforeend', `<span class="mt__tear">${TEAR_SVG}</span>`);
    }
    ring.append(el);
    return { kind, el, angle, leave: { v: 0 }, tap: { v: 0 } };
  };
  const members: Member[] = RUNNERS.map((kind, index) =>
    makeMember(kind, index, (index / RUNNERS.length) * 360),
  );
  const mouse = members.find((member) => member.kind === 'mouse');
  const alice = members.find((member) => member.kind === 'alice');
  const magpie = members.find((member) => member.kind === 'magpie');
  const mouseAngle = mouse?.angle ?? 180;
  const aliceAngle = alice?.angle ?? 225;
  // The Canary and its chicks were somewhere in the crowd; they are only seen
  // when it calls them home, from where the Mouse sat before it walked off.
  const canary = makeMember('canary', RUNNERS.length, mouseAngle + 12);
  const birds = [
    ...members.filter((member) => member.kind !== 'alice' && member.kind !== 'mouse'),
    canary,
  ];
  magpie?.el.querySelector('.cr__figure')?.insertAdjacentHTML('beforeend', SCARF);
  for (const bird of birds) {
    bird.el.setAttribute('aria-label', shell.ui.demoBirdLeave ?? '');
  }
  mouse?.el.setAttribute('aria-label', shell.ui.demoPullTail ?? '');
  alice?.el.setAttribute('aria-hidden', 'true');
  alice?.el.setAttribute('tabindex', '-1');

  // The race's last frame: the party crowded round Alice, the camera close on
  // her, the thimble in her hand.
  const gather = { amount: 1, centre: aliceAngle, spread: 120 };
  // The Mouse's walk off: it goes round the ring and out of the frame.
  const away = { v: 0 };
  // The Canary: 0 unseen, 1 come out to call its chicks.
  const called = { v: 0 };
  const carry = document.createElement('div');
  carry.className = 'cr__carry';
  carry.innerHTML = `<div class="cr__thimble">${THIMBLE_SVG}</div>`;
  carry.style.setProperty('--u', String(HANDS.aliceHand.u));
  carry.style.setProperty('--v', String(HANDS.aliceHand.v));
  carry.style.setProperty('--s', '0.8');
  ring.append(carry);
  alice?.el.setAttribute('data-holding', '');
  const apply = (): void => {
    members.forEach((member, index) => {
      const kind = member.kind === 'canary' ? 'alice' : member.kind;
      const offset = (huddleSlot(kind, 'alice') * gather.spread) / 4;
      let angle = mix(member.angle, gather.centre + offset, gather.amount);
      let radius = mix(1, 0.5, gather.amount);
      let leave = Math.max(member.leave.v, member.tap.v);
      if (member === mouse) {
        leave = away.v;
      }
      if (leave > 0 && !reducedMotion) {
        angle += leave * (member === mouse ? 75 : 30 * (index % 2 ? 1 : -1));
        radius += leave * (member === mouse ? 0.9 : 1.6);
      }
      member.el.style.setProperty('--a', angle.toFixed(2));
      member.el.style.setProperty('--r', radius.toFixed(3));
      member.el.style.setProperty('--leave', Math.min(1, leave).toFixed(3));
      member.el.toggleAttribute('data-gone', leave > 0.99);
      if (member === alice) {
        carry.style.setProperty('--a', angle.toFixed(2));
        carry.style.setProperty('--r', radius.toFixed(3));
      }
    });
    // The Canary stands a little behind the ring, unseen until it calls.
    const leave = Math.max(canary.leave.v, canary.tap.v);
    canary.el.style.setProperty(
      '--a',
      (canary.angle + (reducedMotion ? 0 : leave * 40)).toFixed(2),
    );
    canary.el.style.setProperty('--r', (1.05 + (reducedMotion ? 0 : leave * 1.4)).toFixed(3));
    canary.el.style.setProperty('--leave', Math.min(1, leave + (1 - called.v)).toFixed(3));
    canary.el.toggleAttribute('data-gone', leave > 0.99 || called.v < 0.01);
  };
  apply();

  const camera = { spin: -aliceAngle, tilt: -6, dolly: 300, lift: -70 };
  // The pointer leans the camera a little, except while the Mouse speaks.
  let lean = 0;
  const leanAmount = { v: 1 };
  const applyCamera = (): void => {
    ring.style.setProperty('--spin', (camera.spin + lean).toFixed(2));
    ring.style.setProperty('--tilt', camera.tilt.toFixed(2));
    ring.style.setProperty('--dolly', camera.dolly.toFixed(1));
    ring.style.setProperty('--lift', camera.lift.toFixed(1));
  };
  applyCamera();
  const look = (
    time: number,
    to: Partial<typeof camera>,
    duration = 0.7,
    ease = 'power2.inOut',
  ): void => {
    master.to(camera, { ...to, duration: quick(duration), ease, onUpdate: applyCamera }, time);
  };

  // The thimble and the course are forgotten as they sit down again.
  master.to([course, carry], { opacity: 0, duration: quick(0.6) }, during(iRing, 0.2));
  master.call(
    () => alice?.el.toggleAttribute('data-holding', master.time() < during(iRing, 0.2)),
    [],
    during(iRing, 0.2),
  );

  // They all sat down again in a ring: the huddle opens and the camera comes
  // down low, to the Mouse.
  master.to(
    gather,
    { amount: 0, duration: quick(0.7), ease: 'power2.inOut', onUpdate: apply },
    during(iRing, 0.15),
  );
  look(during(iRing, 0.15), { spin: -mouseAngle - 20, tilt: -3, dolly: 20, lift: -30 }, 0.8);
  // The Mouse turned to Alice and sighed: closer, the Mouse front-left, so the
  // tail has the bank below it.
  look(
    during(iSad, 0.3),
    {
      spin: -mouseAngle - (lite ? 12 : 30),
      tilt: -2,
      dolly: lite ? 40 : 100,
      lift: lite ? -110 : -40,
    },
    0.6,
  );
  master.to(leanAmount, { v: 0, duration: quick(0.4) }, during(iSad, 0.3));
  master.to(leanAmount, { v: 1, duration: quick(0.4) }, during(iAway, 0.5));

  // --- The tail. The verses' words, in chunks, on one SVG in stage pixels. It is
  // a picture of the verses: assistive technology reads them in the caption layer,
  // each with its own beat, so the layer stays hidden from it.
  const tailLayer = shell.layer('mt__tail');
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('focusable', 'false');
  const grip = document.createElementNS(SVG, 'path');
  grip.classList.add('mt__tail-grip');
  svg.append(grip);
  // The tail's own body, a pale band that narrows to its tip behind the words,
  // so the bends and the knot are seen as a tail's.
  const BODY_PARTS = 8;
  const body = Array.from({ length: BODY_PARTS }, () => {
    const part = document.createElementNS(SVG, 'path');
    part.classList.add('mt__tail-body');
    svg.append(part);
    return part;
  });
  const chunks: Chunk[] = [];
  const verses = shell.beats.filter(isVerse);
  // The book's lines grow smaller down the tail; these stop where reading would.
  const baseSize = lite ? 16 : 20;
  const floorSize = lite ? 11 : 12.5;
  const shrink = 0.955;
  let s = 26;
  for (const beat of verses) {
    for (const line of beat.lines) {
      for (const words of chunksOf(line.textContent ?? '', lite ? 3 : 4)) {
        const el = document.createElementNS(SVG, 'text');
        el.dataset.segment = line.dataset.segment ?? '';
        el.dataset.cue = beat.cue ?? '';
        el.textContent = words;
        const size = Math.max(floorSize, baseSize * shrink ** chunks.length);
        el.setAttribute('font-size', size.toFixed(2));
        svg.append(el);
        s += size * PITCH * 0.5;
        chunks.push({ el, beat, s, size, x: 0, y: 0 });
        s += size * PITCH * 0.5;
      }
    }
  }
  const bend = document.createElementNS(SVG, 'circle');
  bend.classList.add('mt__bend');
  bend.setAttribute('r', lite ? '12' : '18');
  svg.append(bend);
  tailLayer.append(svg);

  const bends = lite ? 3.5 : 3;
  const last = chunks[chunks.length - 1];
  /** The tail's natural height: the chunks stacked at their own pitch, never squeezed. */
  const natural = (last?.s ?? 0) + (last?.size ?? 0) * 2;
  const fitTail = (start: Point, width: number): [Point[], Point[]] => {
    const amplitude = Math.min(width * (lite ? 0.2 : 0.11), 84);
    return [
      sampleTail(start, width, natural, amplitude, false, bends),
      sampleTail(start, width, natural, amplitude, true, bends),
    ];
  };
  let [plain, knotted] = fitTail([120, 200], 800);
  const knot = { v: 0 };
  const pull = { v: 0 };
  // Each verse slides down the tail as it is spoken; the per-verse share.
  const slides = new Map(verses.map((beat) => [beat, { v: 0 }]));
  let dirty = true;
  const mark = (): void => {
    dirty = true;
  };
  /** Where a distance down the column falls, as a sample index: past the end
      everything piles up at the tip. */
  const indexAt = (distance: number): number =>
    (Math.min(Math.max(distance, 0), natural) / natural) * SAMPLES;
  const pointOn = (path: Point[], index: number): Point => {
    const i = Math.min(Math.max(index, 0), SAMPLES - 1e-6);
    const lo = Math.floor(i);
    const f = i - lo;
    const p0 = path[lo] as Point;
    const p1 = path[lo + 1] as Point;
    return [mix(p0[0], p1[0], f), mix(p0[1], p1[1], f)];
  };
  const pointAt = (index: number): Point => {
    const [px, py] = pointOn(plain, index);
    if (knot.v <= 0) {
      return [px, py];
    }
    const [kx, ky] = pointOn(knotted, index);
    return [mix(px, kx, knot.v), mix(py, ky, knot.v)];
  };

  // --- The camera follows the words down the bank as the Mouse speaks, comes up
  // to the fifth bend and the knot, and back up when the Mouse walks off. Where
  // each of those is depends on the layout, so the timeline drives a step `view`
  // and the pan in pixels is read off the steps measured with the layout.
  const view = { v: 0 };
  let pans = [0, 0, 0, 0, 0, 0, 0, 0];
  let stageHeight = 760;
  let mouseTop = 300;
  let pan = 0;
  const applyPan = (): void => {
    const i = Math.min(pans.length - 2, Math.max(0, Math.floor(view.v)));
    pan = mix(pans[i] ?? 0, pans[i + 1] ?? 0, Math.min(1, Math.max(0, view.v - i)));
    shell.stage.style.setProperty('--mt-pan', pan.toFixed(1));
  };
  const measurePans = (): void => {
    const room = stageHeight - (lite ? 76 : 56);
    const yOf = (distance: number): number => pointOn(plain, indexAt(distance))[1];
    // Never so far that the Mouse leaves the frame while it is speaking to her.
    const keepMouse = Math.max(0, mouseTop - (lite ? 200 : 170));
    const verseEnds = verses.map((beat) => {
      const own = chunks.filter((chunk) => chunk.beat === beat);
      const end = own[own.length - 1];
      return end ? Math.max(0, yOf(end.s) + end.size - room) : 0;
    });
    const bendY = pointOn(plain, SAMPLES * (4.5 / (2 * bends)))[1];
    // The knot hangs below where it is tied: its lowest point is what must be seen.
    let knotY = 0;
    for (let i = Math.floor(SAMPLES * KNOT_FROM); i <= Math.ceil(SAMPLES * KNOT_TO); i += 1) {
      knotY = Math.max(knotY, knotted[i]?.[1] ?? 0);
    }
    pans = [
      0,
      ...verseEnds,
      Math.min(keepMouse, Math.max(0, bendY + 40 - room)),
      // The knot is the picture of its beat: the party may slip up under the captions.
      Math.min(keepMouse + 60, Math.max(0, knotY + 30 - room)),
      0,
    ];
    applyPan();
  };

  const layoutTail = (): void => {
    for (const chunk of chunks) {
      const slide = slides.get(chunk.beat)?.v ?? 0;
      const index = indexAt(chunk.s + pull.v + slide);
      const [x, y] = pointAt(index);
      const [x0, y0] = pointAt(index - 1.5);
      const [x1, y1] = pointAt(index + 1.5);
      // Each chunk reads left to right, leaning a little the way the tail bends
      // below it, never so much that it reaches into the next line.
      const lean = (Math.atan2(x1 - x0, Math.max(0.01, y1 - y0)) * 180) / Math.PI;
      const angle = Math.max(-5, Math.min(5, lean * 0.25));
      chunk.x = x;
      chunk.y = y;
      // The line under the reading-glass swells a little where it lies.
      const swell = chunk === near ? ' scale(1.25)' : '';
      chunk.el.setAttribute(
        'transform',
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})${swell}`,
      );
    }
    body.forEach((part, k) => {
      const from = Math.floor((k * SAMPLES) / BODY_PARTS);
      const to = Math.min(SAMPLES, Math.ceil(((k + 1) * SAMPLES) / BODY_PARTS) + 1);
      let d = '';
      for (let i = from; i <= to; i += 2) {
        const [x, y] = pointAt(i);
        d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      part.setAttribute('d', d);
      part.setAttribute(
        'stroke-width',
        mix(baseSize * 1.7, floorSize * 1.2, k / (BODY_PARTS - 1)).toFixed(1),
      );
    });
    const [bx, by] = pointAt(SAMPLES * (4.5 / (2 * bends)));
    bend.setAttribute('cx', bx.toFixed(1));
    bend.setAttribute('cy', by.toFixed(1));
    grip.setAttribute(
      'd',
      plain.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(''),
    );
    dirty = false;
  };
  // The tail starts at the Mouse's own tail: read where that is, once per shot
  // and on resize, never per frame. The pan moves the Mouse too, so it is taken off.
  const anchorTail = (): void => {
    if (!mouse) {
      return;
    }
    const box = shell.stage.getBoundingClientRect();
    const r = mouse.el.getBoundingClientRect();
    stageHeight = box.height;
    mouseTop = r.top - box.top + pan;
    // Just below the Mouse's own tail, never so near the edge that the words spill.
    const start: Point = [
      Math.max(lite ? 76 : 104, r.left - box.left + r.width * 0.12),
      r.top - box.top + pan + r.height * 0.82,
    ];
    [plain, knotted] = fitTail(start, box.width);
    measurePans();
    mark();
  };
  anchorTail();
  // Under reduced motion the camera's cut sits at the landing minus 0.02 and
  // takes 0.01: the read comes after it.
  master.call(anchorTail, [], reducedMotion ? iTail - 0.005 : iTail + 0.05);
  master.call(anchorTail, [], reducedMotion ? iFuryOne - 0.005 : iFuryOne + 0.02);
  let resizeFrame = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(anchorTail);
  };
  window.addEventListener('resize', onResize, { passive: true });

  // "It is a long tail, certainly": she looks at it, and the tail is there, empty,
  // before the words come to fill it.
  master.fromTo(
    body,
    { opacity: 0 },
    { opacity: 1, duration: quick(0.5), immediateRender: true },
    at(iTail, 0.3),
  );

  // The verses appear chunk by chunk as the Mouse speaks them, each verse
  // sliding a little way down the tail as it comes, and the camera follows the
  // newest line down; in place, and the camera cut, under reduced motion.
  verses.forEach((beat, k) => {
    const own = chunks.filter((chunk) => chunk.beat === beat).map((chunk) => chunk.el);
    const t = beat.index;
    if (reducedMotion) {
      master.set(own, { opacity: 1 }, before(t));
    } else {
      master.fromTo(
        own,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, stagger: 0.05, immediateRender: false },
        t + 0.05,
      );
      const slide = slides.get(beat);
      if (slide) {
        master.fromTo(
          slide,
          { v: -36 },
          { v: 0, duration: 0.7, ease: 'power2.out', immediateRender: false, onUpdate: mark },
          t + 0.05,
        );
      }
    }
    master.to(
      view,
      { v: k + 1, duration: quick(0.75), ease: 'power1.inOut', onUpdate: applyPan },
      reducedMotion ? before(t) : t + 0.1,
    );
    master.call(
      () => (master.time() >= t + 0.05 ? shell.sound.play('paper', 0.25) : undefined),
      [],
      t + 0.05,
    );
  });
  master.to(
    view,
    { v: 5, duration: quick(0.4), ease: 'power2.out', onUpdate: applyPan },
    at(iAttending, 0.05),
  );
  master.to(
    view,
    { v: 6, duration: quick(0.5), ease: 'power1.inOut', onUpdate: applyPan },
    at(iKnot, 0.05),
  );
  master.to(
    view,
    { v: 7, duration: quick(0.7), ease: 'power2.inOut', onUpdate: applyPan },
    at(iAway, 0.15),
  );

  // --- Read the tail up close: drag along it and a reading-glass shows the
  // words under the finger large; the button steps the glass along the lines
  // spoken so far. Pull the tail: tap the Mouse or press the button, and the
  // words slide along the curve and spring back.
  const lensLayer = shell.layer('mt__lens');
  const lens = document.createElement('p');
  lens.className = 'mt__loupe';
  lensLayer.append(lens);
  const readButton = shell.prop(shell.ui.demoReadTail ?? '', 'mt__prop mt__prop--read');
  const pullButton = shell.prop(shell.ui.demoPullTail ?? '', 'mt__prop mt__prop--pull');
  let pullable = false;
  let readable = false;
  let near: Chunk | undefined;
  let lensTimer = 0;
  const spoken = (): Chunk[] =>
    chunks.filter((chunk) => master.time() >= chunk.beat.index + (reducedMotion ? -0.03 : 0.05));
  const showLens = (chunk: Chunk | undefined, x?: number, y?: number): void => {
    if (near !== chunk) {
      near?.el.removeAttribute('data-near');
      mark();
    }
    near = chunk;
    window.clearTimeout(lensTimer);
    if (!chunk) {
      lens.removeAttribute('data-shown');
      return;
    }
    chunk.el.setAttribute('data-near', '');
    lens.textContent = chunk.el.textContent;
    const box = shell.stage.getBoundingClientRect();
    // Above the finger, or above the line when the button brought it; always in frame.
    const lx = Math.min(box.width - 90, Math.max(90, x ?? chunk.x));
    const ly = Math.min(box.height - 40, Math.max(90, (y ?? chunk.y - pan) - (lite ? 64 : 56)));
    lens.style.setProperty('--lx', lx.toFixed(1));
    lens.style.setProperty('--ly', ly.toFixed(1));
    lens.setAttribute('data-shown', '');
  };
  const hideLensSoon = (delay: number): void => {
    window.clearTimeout(lensTimer);
    lensTimer = window.setTimeout(() => showLens(undefined), delay);
  };
  const nearest = (x: number, y: number): Chunk | undefined => {
    let best: Chunk | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const chunk of spoken()) {
      const distance = Math.hypot((chunk.x - x) * 0.6, chunk.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = chunk;
      }
    }
    return bestDistance < 60 ? best : undefined;
  };
  // The button reads on from where it left off, line by line, and round again.
  let step = -1;
  readButton.addEventListener('click', () => {
    const list = spoken();
    if (!list.length) {
      return;
    }
    step = (step + 1) % list.length;
    showLens(list[step]);
    hideLensSoon(2600);
  });
  const setPlay = (): void => {
    const t = master.time();
    pullable = t >= iFuryOne && t < iKnot;
    readable = t >= iFuryOne && t < iAway;
    tailLayer.toggleAttribute('data-readable', readable);
    if (pullable) {
      pullButton.show();
    } else {
      pullButton.hide();
    }
    if (readable) {
      readButton.show();
    } else {
      readButton.hide();
      showLens(undefined);
    }
    if (mouse) {
      mouse.el.disabled = !pullable;
    }
  };
  master.call(setPlay, [], iFuryOne);
  master.call(setPlay, [], iKnot);
  master.call(setPlay, [], iAway);
  const settle = (): void => {
    gsap.killTweensOf(pull);
    gsap.to(pull, {
      v: 0,
      duration: reducedMotion ? 0 : 1.1,
      ease: 'elastic.out(1, 0.45)',
      onUpdate: mark,
    });
  };
  const pullTail = (): void => {
    if (!pullable) {
      return;
    }
    gsap.killTweensOf(pull);
    if (reducedMotion) {
      // A cut: pulled, and let go on the next press.
      pull.v = pull.v > 1 ? 0 : 70;
      mark();
      return;
    }
    gsap.to(pull, {
      v: 90,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: mark,
      onComplete: settle,
    });
    shell.sound.play('whoosh', 0.2);
  };
  pullButton.addEventListener('click', pullTail);
  mouse?.el.addEventListener('click', pullTail);
  let reading = false;
  const readAt = (event: PointerEvent): void => {
    const box = shell.stage.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    showLens(nearest(x, y + pan), x, y);
  };
  grip.addEventListener('pointerdown', (event) => {
    if (!readable) {
      return;
    }
    reading = true;
    tailLayer.setAttribute('data-reading', '');
    grip.setPointerCapture(event.pointerId);
    readAt(event);
  });
  grip.addEventListener('pointermove', (event) => {
    if (reading) {
      readAt(event);
    }
  });
  const endRead = (): void => {
    if (!reading) {
      return;
    }
    reading = false;
    tailLayer.removeAttribute('data-reading');
    hideLensSoon(1200);
  };
  grip.addEventListener('pointerup', endRead);
  grip.addEventListener('pointercancel', endRead);

  // You are not attending: the Mouse is sharp, and the fifth bend lights up.
  master.call(
    () => mouse?.el.toggleAttribute('data-sharp', master.time() >= iAttending + 0.05),
    [],
    iAttending + 0.05,
  );
  master.to(bend, { opacity: 0.9, duration: quick(0.3) }, at(iAttending, 0.45));
  master.to(bend, { opacity: 0, duration: quick(0.2) }, at(iKnot, 0.05));

  // A knot: the tail ties itself. Undoing it is tried and fails.
  master.to(
    knot,
    { v: 1, duration: quick(0.6), ease: 'power2.inOut', onUpdate: mark },
    at(iKnot, 0.1),
  );
  master.call(
    () => {
      shell.root.toggleAttribute('data-knot', master.time() >= at(iKnot, 0.1));
      if (master.time() >= at(iKnot, 0.1)) {
        shell.sound.play('thud', 0.3);
      }
    },
    [],
    at(iKnot, 0.1),
  );
  const undoButton = shell.prop(shell.ui.demoUndoKnot ?? '', 'mt__prop mt__prop--undo');
  const undoKnot = (): void => {
    if (master.time() < iKnot || master.time() >= iAway) {
      return;
    }
    tailLayer.removeAttribute('data-tug');
    mouse?.el.removeAttribute('data-offended');
    void tailLayer.offsetWidth;
    tailLayer.setAttribute('data-tug', '');
    mouse?.el.setAttribute('data-offended', '');
    shell.root.setAttribute('data-offended', '');
    shell.status(shell.ui.demoKnotHolds ?? '');
    shell.sound.play('thud', 0.5);
  };
  undoButton.addEventListener('click', undoKnot);
  const undoWindow = (): void => {
    if (master.time() >= at(iKnot, 0.15) && master.time() < iAway) {
      undoButton.show();
    } else {
      undoButton.hide();
      shell.root.removeAttribute('data-offended');
      mouse?.el.removeAttribute('data-offended');
    }
  };
  master.call(undoWindow, [], at(iKnot, 0.15));
  master.call(undoWindow, [], iAway);

  // The Mouse got up and walked away, the tail-text trailing after it.
  const walking = (): void => {
    mouse?.el.toggleAttribute(
      'data-walking',
      master.time() >= at(iAway, 0.1) && master.time() < iDinah,
    );
  };
  master.call(walking, [], at(iAway, 0.1));
  master.call(walking, [], iDinah);
  master.to(
    away,
    { v: 1, duration: quick(0.8), ease: 'power1.in', onUpdate: apply },
    at(iAway, 0.15),
  );
  master.to(
    tailLayer,
    reducedMotion
      ? { opacity: 0, duration: 0.01 }
      : { xPercent: 90, yPercent: 8, opacity: 0, duration: 0.85, ease: 'power2.in' },
    at(iAway, 0.15),
  );
  master.call(
    () => (master.time() >= at(iAway, 0.15) ? shell.sound.play('whoosh', 0.4) : undefined),
    [],
    at(iAway, 0.15),
  );
  look(during(iAway, 0.2), { spin: -mouseAngle - 10, dolly: 40, lift: -20, tilt: -6 }, 0.8);

  // The others all joined in: the party calls after it.
  const calling = (): void => {
    const on = master.time() >= at(iComeBack, 0.05) && master.time() < iDinah;
    for (const member of members) {
      if (member !== mouse) {
        member.el.toggleAttribute('data-call', on);
      }
    }
  };
  master.call(calling, [], at(iComeBack, 0.05));
  master.call(calling, [], iDinah);
  master.call(
    () => (master.time() >= at(iComeBack, 0.1) ? shell.sound.play('chime', 0.35) : undefined),
    [],
    at(iComeBack, 0.1),
  );
  look(during(iComeBack, 0.1), { spin: -aliceAngle + 20, dolly: 0, lift: -10, tilt: -6 }, 0.8);

  // I wish I had our Dinah here: a ghost of her over the sky.
  const dinahLayer = shell.layer('mt__dinah');
  dinahLayer.innerHTML = figure('dinah-cat');
  const dinah = dinahLayer.querySelector<HTMLElement>('.art');
  const glow = { v: 0 };
  master.to(dinah, { opacity: 0.8, duration: quick(0.4) }, at(iDinah, 0.1));
  master.to(glow, { v: 0.8, duration: quick(0.4) }, at(iDinah, 0.1));
  master.to(dinah, { opacity: 0, duration: quick(0.3) }, at(iSensation, 0));
  master.to(glow, { v: 0, duration: quick(0.3) }, at(iSensation, 0));
  if (!reducedMotion) {
    master.fromTo(
      dinah,
      { x: 30, y: 10 },
      { x: -30, y: -6, duration: 1, ease: 'none', immediateRender: false },
      iDinah,
    );
  }

  // A remarkable sensation: the birds go off on various pretexts, and it is
  // getting late. The old Magpie wraps itself up for the night air; the Canary
  // calls its children to bed and they come; the rest hurry off at once. A tap
  // sends one off at once. Under reduced motion the sensation settles with the
  // Magpie wrapped and the Canary's chicks gathered and the others gone, and
  // the two with excuses are gone by the next beat.
  const dusk = shell.layer('mt__dusk');
  master.to(dusk, { opacity: 1, duration: quick(0.8) }, at(iSensation, 0.05));
  master.to(dusk, { opacity: 0, duration: quick(0.3) }, at(iFootsteps, 0.4));
  master.call(
    () => magpie?.el.toggleAttribute('data-wrapped', master.time() >= at(iSensation, 0.05)),
    [],
    at(iSensation, 0.05),
  );
  master.to(
    called,
    { v: 1, duration: quick(0.2), ease: 'back.out(2)', onUpdate: apply },
    at(iSensation, 0.1),
  );
  master.call(
    () => canary.el.toggleAttribute('data-calling', master.time() >= at(iSensation, 0.1)),
    [],
    at(iSensation, 0.1),
  );
  const leaveAt = (bird: Member, time: number): void => {
    master.to(bird.leave, { v: 1, duration: quick(0.4), ease: 'power2.in', onUpdate: apply }, time);
  };
  const hurried = birds.filter((bird) => bird !== magpie && bird !== canary);
  hurried.forEach((bird, index) => {
    leaveAt(bird, reducedMotion ? iSensation + 0.3 : iSensation + 0.5 + index * 0.08);
  });
  if (magpie) {
    leaveAt(magpie, reducedMotion ? before(iAlone) : iSensation + 0.28);
  }
  leaveAt(canary, reducedMotion ? before(iAlone) : iSensation + 0.4);
  const sensation = (): void => {
    const on = master.time() >= at(iSensation, 0) && master.time() < iAlone;
    for (const bird of birds) {
      bird.el.disabled = !on || (bird === canary && master.time() < at(iSensation, 0.1));
      if (master.time() < iSensation) {
        gsap.killTweensOf(bird.tap);
        bird.tap.v = 0;
      }
    }
    apply();
  };
  master.call(sensation, [], at(iSensation, 0));
  master.call(sensation, [], at(iSensation, 0.1));
  master.call(sensation, [], iAlone);
  for (const bird of birds) {
    bird.el.addEventListener('click', () => {
      if (bird.el.disabled) {
        return;
      }
      gsap.to(bird.tap, {
        v: 1,
        duration: reducedMotion ? 0 : 0.4,
        ease: 'power2.in',
        onUpdate: apply,
      });
      shell.sound.play('whoosh', 0.3);
    });
  }

  // Alice was soon left alone: close on her, and a tear.
  look(
    during(iAlone, 0.05),
    { spin: -aliceAngle, dolly: lite ? 160 : 240, lift: 10, tilt: -8 },
    0.8,
  );
  master.call(
    () => alice?.el.toggleAttribute('data-crying', master.time() >= at(iAlone, 0.3)),
    [],
    at(iAlone, 0.3),
  );

  // Footsteps in the distance: she looks up to the right, little prints come in
  // from far off with the Rabbit behind them, and the picture tightens on his
  // house, small on the bank until it fills the frame with its door.
  const rabbitLayer = shell.layer('mt__rabbit');
  rabbitLayer.innerHTML = `<div class="mt__prints">${FOOTPRINTS_SVG}</div>${figure('white-rabbit/running')}`;
  const rabbit = rabbitLayer.querySelector<HTMLElement>('.art');
  const steps = [...rabbitLayer.querySelectorAll<SVGGElement>('.mt__step')];
  const garden = shell.layer('hs__garden');
  gsap.set(garden, { opacity: 0 });
  const arrival = shell.layer('hs__arrival');
  arrival.innerHTML = HOUSE_FRONT_SVG;
  // Small on the bank's horizon, to the right of the party, clear of Alice even
  // on a narrow screen, where the race's last frame left it; it fills the frame
  // by the end.
  const house = DISTANT_HOUSE(lite);
  const applyHouse = (): void => {
    arrival.style.setProperty('--hx', house.hx.toFixed(2));
    arrival.style.setProperty('--hy', house.hy.toFixed(2));
    arrival.style.setProperty('--hz', house.hz.toFixed(4));
  };
  applyHouse();
  const flash = shell.layer('mt__flash');
  look(during(iFootsteps, 0.05), { spin: -aliceAngle - 40, dolly: 60, lift: -10, tilt: -5 }, 0.7);
  master.call(
    () => alice?.el.toggleAttribute('data-look', master.time() >= at(iFootsteps, 0.1)),
    [],
    at(iFootsteps, 0.1),
  );
  if (reducedMotion) {
    master.set(steps, { opacity: 1 }, before(iFootsteps));
    master.set(rabbit, { opacity: 1 }, before(iFootsteps));
  } else {
    master.to(steps, { opacity: 1, duration: 0.08, stagger: 0.07 }, iFootsteps + 0.1);
    master.fromTo(
      rabbit,
      { opacity: 0, x: '60vw', scale: 0.4 },
      { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: 'power1.out', immediateRender: false },
      iFootsteps + 0.15,
    );
  }
  const running = (): void => {
    rabbitLayer.toggleAttribute(
      'data-running',
      master.time() >= iFootsteps + 0.15 && master.time() < iFootsteps + 0.7,
    );
  };
  master.call(running, [], iFootsteps + 0.15);
  master.call(running, [], iFootsteps + 0.7);
  for (const step of [0.14, 0.26, 0.38, 0.5]) {
    master.call(
      () => (master.time() >= iFootsteps + step ? shell.sound.play('thud', 0.12) : undefined),
      [],
      iFootsteps + step,
    );
  }
  // The tightening: the house comes to the frame the Rabbit's house opens on.
  const tighten = reducedMotion ? iFootsteps + 0.5 : iFootsteps + 0.45;
  master.to(
    house,
    {
      hx: 0,
      hy: 0,
      hz: 1,
      duration: quick(0.5),
      ease: 'power3.in',
      onUpdate: applyHouse,
    },
    tighten,
  );
  master.to(garden, { opacity: 1, duration: quick(0.25) }, tighten + (reducedMotion ? 0 : 0.25));
  master.to(
    [world, rabbitLayer, dinahLayer],
    { opacity: 0, duration: quick(0.2) },
    tighten + (reducedMotion ? 0 : 0.3),
  );
  if (reducedMotion) {
    master.fromTo(
      flash,
      { opacity: 0.8 },
      { opacity: 0, duration: 0.1, immediateRender: false },
      tighten,
    );
  }
  master.call(
    () => shell.root.toggleAttribute('data-at-house', master.time() >= tighten + 0.4),
    [],
    tighten + 0.4,
  );

  // --- Per frame: the lean, the tail's layout when something moved it, the purr.
  shell.onFrame((dt) => {
    if (dirty) {
      layoutTail();
    }
    if (reducedMotion) {
      return;
    }
    const want = shell.pointer.active ? shell.pointer.x * 4 * leanAmount.v : 0;
    lean += (want - lean) * Math.min(1, dt * 2);
    applyCamera();
    shell.sound.level('purr', glow.v * 0.5);
  });
}

const shell = attachDemo({
  // The verses are drawn on the tail, not in the caption layer.
  caption: (beat) => isVerse(beat),
});
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
