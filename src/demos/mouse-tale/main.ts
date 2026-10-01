/**
 * The Mouse's tale: the concept demo.
 *
 * The same bank as the Caucus-race, the party gathered round Alice as the race
 * left them, and the camera comes down low as they sit in a ring and beg the
 * Mouse for its tale. Then the tale is a tail: the verses the Mouse speaks are
 * not the caption layer's but are laid along a long curve that starts at the
 * Mouse's own tail and winds down the bank, each chunk a little smaller than the
 * last, exactly as the book sets it. The reader may pull the tail and the words
 * slide along it; at the knot the curve ties itself, and undoing it only offends
 * the Mouse, who walks off with its tail-text trailing after. The party calls
 * after it, Dinah is a ghost over the sky, the birds hurry off one by one, and
 * Alice is left alone until footsteps patter in from the distance, where the
 * Rabbit's house waits: the frame the next demo opens on.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { RUNNERS, type RunnerKind } from '../art/vectors.ts';
import { THIMBLE_SVG } from '../caucus-race/figures.ts';
import { HOUSE_FRONT_SVG } from '../rabbit-house/figures.ts';
import { attachDemo, type Beat, type DemoShell, mix, seeded } from '../shell/shell.ts';
import '../caucus-race/caucus.css';
import '../rabbit-house/house.css';
import './mouse-tale.css';
import { FOOTPRINTS_SVG, TEAR_SVG } from './figures.ts';

const SVG = 'http://www.w3.org/2000/svg';
/** Samples per path; the chunks are placed by interpolation between them. */
const SAMPLES = 180;
/** How many words a chunk of the tail carries: the book's lines are this short. */
const WORDS_PER_CHUNK = 3;

interface Member {
  kind: RunnerKind;
  el: HTMLButtonElement;
  angle: number;
  /** 1 once this one has gone off: the timeline's share, and a tap's. */
  leave: { v: number };
  tap: { v: number };
}

interface Chunk {
  el: SVGTextElement;
  beat: Beat;
  /** Position along the plain tail, in path pixels, before any pull. */
  s: number;
  size: number;
}

type Point = [number, number];

/** The verses of the tale are the beats whose cue names a verse. */
const isVerse = (beat: Beat): boolean => beat.cue?.startsWith('fury-') === true;

/** The words of a line in groups, the last group never a single word. */
function chunksOf(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    groups.push(words.slice(i, i + WORDS_PER_CHUNK).join(' '));
  }
  if (groups.length > 1 && !groups[groups.length - 1]?.includes(' ')) {
    const last = groups.pop();
    groups[groups.length - 1] = `${groups[groups.length - 1]} ${last}`;
  }
  return groups;
}

/**
 * The tail as a serpentine from `start`, `height` down: a sine wave about a
 * line drifting toward the middle, narrowing as it goes, and always going down,
 * so the chunks stack as the book's lines do. The knot variant ties a loop into
 * its lower third and is continuous with the plain one at both ends, so the two
 * interpolate point for point.
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
    if (knot && t > 0.58 && t < 0.8) {
      const u = (t - 0.58) / 0.22;
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
  const random = seeded(7);
  const lite = matchMedia('(max-width: 700px)').matches;
  // Reduced motion lands on whole beats, so a change that belongs inside beat i
  // is cut in just before the landing it must be seen at.
  const before = (i: number): number => Math.max(0, i - 0.02);
  const during = (i: number, frac: number): number => (reducedMotion ? before(i + 1) : i + frac);
  const at = (i: number, frac: number): number => (reducedMotion ? before(i) : i + frac);

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
  const members: Member[] = RUNNERS.map((kind, index) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'cr__runner mt__member';
    el.dataset.kind = kind;
    el.disabled = true;
    el.style.setProperty('--i', String(index));
    el.innerHTML = figure(`runner/${kind}`);
    if (kind === 'alice') {
      el.insertAdjacentHTML('beforeend', `<span class="mt__tear">${TEAR_SVG}</span>`);
    }
    ring.append(el);
    return { kind, el, angle: (index / RUNNERS.length) * 360, leave: { v: 0 }, tap: { v: 0 } };
  });
  const mouse = members.find((member) => member.kind === 'mouse');
  const alice = members.find((member) => member.kind === 'alice');
  const birds = members.filter((member) => member.kind !== 'alice' && member.kind !== 'mouse');
  const mouseAngle = mouse?.angle ?? 180;
  const aliceAngle = alice?.angle ?? 225;
  for (const bird of birds) {
    bird.el.setAttribute('aria-label', shell.ui.demoBirdLeave ?? '');
  }
  mouse?.el.setAttribute('aria-label', shell.ui.demoPullTail ?? '');
  alice?.el.setAttribute('aria-hidden', 'true');
  alice?.el.setAttribute('tabindex', '-1');

  // The race's last frame: the party crowded round Alice, the camera on her.
  const gather = { amount: 1, centre: aliceAngle, spread: 120 };
  // The Mouse's walk off: it goes round the ring and out of the frame.
  const away = { v: 0 };
  const apply = (): void => {
    members.forEach((member, index) => {
      const offset = ((index / members.length) * 2 - 1) * gather.spread;
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
    });
  };
  apply();

  const camera = { spin: -aliceAngle, tilt: -10, dolly: 80, lift: 0 };
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
    master.to(
      camera,
      { ...to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: applyCamera },
      time,
    );
  };

  // The thimble, where the race dropped it; it is forgotten with the course.
  const thimbleLayer = shell.layer('cr__thimble-layer');
  thimbleLayer.innerHTML = `<div class="cr__thimble">${THIMBLE_SVG}</div>`;
  gsap.set(thimbleLayer.querySelector('.cr__thimble'), { scale: 0.5, y: '20vh' });
  master.to(
    [course, thimbleLayer],
    { opacity: 0, duration: reducedMotion ? 0.01 : 0.6 },
    during(iRing, 0.2),
  );

  // They all sat down again in a ring: the huddle opens and the camera comes
  // down low, to the Mouse.
  master.to(
    gather,
    { amount: 0, duration: reducedMotion ? 0.01 : 0.7, ease: 'power2.inOut', onUpdate: apply },
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
  master.to(leanAmount, { v: 0, duration: reducedMotion ? 0.01 : 0.4 }, during(iSad, 0.3));
  master.to(leanAmount, { v: 1, duration: reducedMotion ? 0.01 : 0.4 }, during(iAway, 0.5));

  // --- The tail. The verses' words, in chunks, on one SVG in stage pixels.
  const tailLayer = shell.layer('mt__tail');
  tailLayer.removeAttribute('aria-hidden');
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('focusable', 'false');
  const grip = document.createElementNS(SVG, 'path');
  grip.classList.add('mt__tail-grip');
  svg.append(grip);
  const chunks: Chunk[] = [];
  const verses = shell.beats.filter(isVerse);
  const baseSize = lite ? 15 : 19;
  const shrink = 0.955;
  let s = 26;
  for (const beat of verses) {
    for (const line of beat.lines) {
      for (const words of chunksOf(line.textContent ?? '')) {
        const el = document.createElementNS(SVG, 'text');
        el.dataset.segment = line.dataset.segment ?? '';
        el.dataset.cue = beat.cue ?? '';
        el.textContent = words;
        const size = Math.max(lite ? 6 : 7.5, baseSize * shrink ** chunks.length);
        el.setAttribute('font-size', size.toFixed(2));
        svg.append(el);
        chunks.push({ el, beat, s, size });
        s += size * 1.6;
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
  /** The tail's natural height: the chunks stacked at their own pitch. */
  const natural = (last?.s ?? 0) + (last?.size ?? 0) * 2;
  /** The tail that fits the stage: the column is as tall as the bank below the
      Mouse allows, the chunks closer together where it must be shorter. */
  const fitTail = (start: Point, width: number, available: number): [Point[], Point[]] => {
    const height = Math.max(120, Math.min(available, natural));
    const amplitude = Math.min(width * (lite ? 0.2 : 0.11), 84);
    return [
      sampleTail(start, width, height, amplitude, false, bends),
      sampleTail(start, width, height, amplitude, true, bends),
    ];
  };
  let [plain, knotted] = fitTail([120, 200], 800, 400);
  const knot = { v: 0 };
  const pull = { v: 0 };
  // Each verse slides down the tail as it is spoken; the per-verse share.
  const slides = new Map(verses.map((beat) => [beat, { v: 0 }]));
  let dirty = true;
  const mark = (): void => {
    dirty = true;
  };
  /** Where a distance down the column falls, as a sample index fraction: past
      the end everything piles up at the tip. */
  const indexAt = (distance: number): number =>
    (Math.min(Math.max(distance, 0), natural) / natural) * SAMPLES;
  const pointAt = (index: number): Point => {
    const i = Math.min(Math.max(index, 0), SAMPLES - 1e-6);
    const lo = Math.floor(i);
    const f = i - lo;
    const p0 = plain[lo] as Point;
    const p1 = plain[lo + 1] as Point;
    const k0 = knotted[lo] as Point;
    const k1 = knotted[lo + 1] as Point;
    const px = mix(p0[0], p1[0], f);
    const py = mix(p0[1], p1[1], f);
    return [mix(px, mix(k0[0], k1[0], f), knot.v), mix(py, mix(k0[1], k1[1], f), knot.v)];
  };
  const layoutTail = (): void => {
    for (const chunk of chunks) {
      const slide = slides.get(chunk.beat)?.v ?? 0;
      const index = indexAt(chunk.s + pull.v + slide);
      const [x, y] = pointAt(index);
      const [x0, y0] = pointAt(index - 1.5);
      const [x1, y1] = pointAt(index + 1.5);
      // Each chunk reads left to right, leaning the way the tail bends below it
      // (the tail runs down the screen, so the lean is its drift from vertical).
      const lean = (Math.atan2(x1 - x0, Math.max(0.01, y1 - y0)) * 180) / Math.PI;
      const angle = Math.max(-11, Math.min(11, lean * 0.4));
      chunk.el.setAttribute(
        'transform',
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`,
      );
    }
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
  // and on resize, never per frame.
  const anchorTail = (): void => {
    if (!mouse) {
      return;
    }
    const box = shell.stage.getBoundingClientRect();
    const r = mouse.el.getBoundingClientRect();
    // At the Mouse's own tail, but never so near the edge that the words spill.
    const start: Point = [
      Math.max(lite ? 72 : 100, r.left - box.left + r.width * 0.08),
      r.top - box.top + r.height * 0.56,
    ];
    [plain, knotted] = fitTail(start, box.width, box.height - 14 - start[1]);
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

  // The verses appear chunk by chunk as the Mouse speaks them, each verse
  // sliding a little way down the tail as it comes; in place under reduced motion.
  for (const beat of verses) {
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
    master.call(
      () => (master.time() >= t + 0.05 ? shell.sound.play('paper', 0.25) : undefined),
      [],
      t + 0.05,
    );
  }
  // Pull the tail: the words slide along the curve and spring back.
  const pullButton = shell.prop(shell.ui.demoPullTail ?? '', 'mt__prop mt__prop--pull');
  let pullable = false;
  const setPullable = (): void => {
    pullable = master.time() >= iFuryOne && master.time() < iKnot;
    tailLayer.toggleAttribute('data-pullable', pullable);
    if (pullable) {
      pullButton.show();
    } else {
      pullButton.hide();
    }
    if (mouse) {
      mouse.el.disabled = !pullable;
    }
  };
  master.call(setPullable, [], iFuryOne);
  master.call(setPullable, [], iKnot);
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
  let drag: { y: number; x: number; from: number } | undefined;
  grip.addEventListener('pointerdown', (event) => {
    if (!pullable) {
      return;
    }
    gsap.killTweensOf(pull);
    drag = { x: event.clientX, y: event.clientY, from: pull.v };
    tailLayer.setAttribute('data-dragging', '');
    grip.setPointerCapture(event.pointerId);
  });
  grip.addEventListener('pointermove', (event) => {
    if (!drag) {
      return;
    }
    const delta = event.clientY - drag.y + (event.clientX - drag.x) * 0.3;
    pull.v = Math.max(-80, Math.min(240, drag.from + delta * (reducedMotion ? 1 : 1.2)));
    mark();
  });
  const endDrag = (): void => {
    if (!drag) {
      return;
    }
    drag = undefined;
    tailLayer.removeAttribute('data-dragging');
    settle();
  };
  grip.addEventListener('pointerup', endDrag);
  grip.addEventListener('pointercancel', endDrag);

  // You are not attending: the Mouse is sharp, and the fifth bend lights up.
  master.call(
    () => mouse?.el.toggleAttribute('data-sharp', master.time() >= iAttending + 0.05),
    [],
    iAttending + 0.05,
  );
  master.to(bend, { opacity: 0.9, duration: reducedMotion ? 0.01 : 0.3 }, at(iAttending, 0.45));
  master.to(bend, { opacity: 0, duration: reducedMotion ? 0.01 : 0.2 }, at(iKnot, 0.05));

  // A knot: the tail ties itself. Undoing it is tried and fails.
  master.to(
    knot,
    { v: 1, duration: reducedMotion ? 0.01 : 0.6, ease: 'power2.inOut', onUpdate: mark },
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
  master.call(
    () =>
      mouse?.el.toggleAttribute(
        'data-walking',
        master.time() >= at(iAway, 0.1) && master.time() < iDinah,
      ),
    [],
    at(iAway, 0.1),
  );
  master.call(
    () =>
      mouse?.el.toggleAttribute(
        'data-walking',
        master.time() >= at(iAway, 0.1) && master.time() < iDinah,
      ),
    [],
    iDinah,
  );
  master.to(
    away,
    { v: 1, duration: reducedMotion ? 0.01 : 0.8, ease: 'power1.in', onUpdate: apply },
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
  master.to(dinah, { opacity: 0.8, duration: reducedMotion ? 0.01 : 0.4 }, at(iDinah, 0.1));
  master.to(glow, { v: 0.8, duration: reducedMotion ? 0.01 : 0.4 }, at(iDinah, 0.1));
  master.to(dinah, { opacity: 0, duration: reducedMotion ? 0.01 : 0.3 }, at(iSensation, 0));
  master.to(glow, { v: 0, duration: reducedMotion ? 0.01 : 0.3 }, at(iSensation, 0));
  if (!reducedMotion) {
    master.fromTo(
      dinah,
      { x: 30, y: 10 },
      { x: -30, y: -6, duration: 1, ease: 'none', immediateRender: false },
      iDinah,
    );
  }

  // A remarkable sensation: the birds hurry off one by one, on various
  // pretexts; a tap sends one off at once. Under reduced motion they fade, half
  // of them by this beat's landing and the rest by the next.
  const order = [...birds].sort(() => random() - 0.5);
  order.forEach((bird, index) => {
    master.to(
      bird.leave,
      { v: 1, duration: reducedMotion ? 0.01 : 0.4, ease: 'power2.in', onUpdate: apply },
      reducedMotion
        ? before(index < order.length / 2 ? iSensation : iAlone)
        : iSensation + 0.12 + index * 0.13,
    );
  });
  const sensation = (): void => {
    const on = master.time() >= at(iSensation, 0) && master.time() < iAlone;
    for (const bird of birds) {
      bird.el.disabled = !on;
      if (master.time() < iSensation) {
        gsap.killTweensOf(bird.tap);
        bird.tap.v = 0;
      }
    }
    apply();
  };
  master.call(sensation, [], at(iSensation, 0));
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
  const house = { hx: lite ? 22 : 26, hy: lite ? -24 : -26, hz: lite ? 0.09 : 0.07 };
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
      duration: reducedMotion ? 0.01 : 0.5,
      ease: 'power3.in',
      onUpdate: applyHouse,
    },
    tighten,
  );
  master.to(
    garden,
    { opacity: 1, duration: reducedMotion ? 0.01 : 0.25 },
    tighten + (reducedMotion ? 0 : 0.25),
  );
  master.to(
    [world, rabbitLayer, dinahLayer],
    { opacity: 0, duration: reducedMotion ? 0.01 : 0.2 },
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
