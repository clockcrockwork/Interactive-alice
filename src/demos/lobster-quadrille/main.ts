/**
 * The Lobster Quadrille: the concept demo.
 *
 * A shore: sky, a sea that breathes, shingle. The Gryphon and the Mock Turtle
 * explain the dance and step aside for it: the dancers form a line along the
 * shore, then two lines facing each other, the jelly-fish are cleared out of the
 * way, each takes a lobster as a partner, and the lines advance twice, set to
 * partners, change lobsters across the gap and retire. The reader has a lobster
 * of their own to throw as far out to sea as they can, to swim after, and to
 * turn a somersault under the water for. Then the reader joins the dance: the
 * ring of dancers turns round the camera, the Mock Turtle sings and the sung
 * words light one at a time on the swell, the creatures of the song come by in
 * the sea, and at the cry from the distance the Gryphon takes her hand and runs:
 * the shingle streams under them, the dancers fall behind, and the shore gives
 * way to a path and the court's own doors, which are just opening as the demo
 * ends; the trial opens inside them.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { DANCERS } from '../art/vectors.ts';
import {
  attachDemo,
  type Beat,
  captionEntry,
  type DemoShell,
  mix,
  seeded,
} from '../shell/shell.ts';
import { exclaims, type LocaleProfile, pageProfile, units } from '../shell/words.ts';
import { COURT_DOORS, HANDS_WITH_LOBSTER, JELLY_SVG, TUREEN_SVG } from './figures.ts';
import './quadrille.css';
import './shore.css';

/** The beats whose Mock Turtle lines are sung, not said. */
const SUNG = new Set(['verse-one', 'verse-two', 'verse-three', 'soup', 'faint']);

/** Where things stand on the dance floor. Depth is in ring radii (`--lq-radius`);
    across the shore, in the ring it is radii too and in the lines it is the
    frame's own half-width (`--lq-span`), so the lines fit a phone as well. */
const LINE_HALF = 0.7;
const Z_ONE = -0.5;
const Z_NEAR = 0.65;
const Z_FAR = -0.85;
const Z_NEAR_IN = 0.28;
const Z_FAR_IN = -0.48;
const HOST_X = 0.8;
const HOST_Z = 1;
const DEG = Math.PI / 180;

interface Spot {
  /** Across, in the ring (radii) and in the lines (half-widths); depth in radii. */
  xr: number;
  xl: number;
  z: number;
}

interface Dancer {
  el: HTMLElement;
  partner: HTMLElement;
  angle: number;
  /** 0 the near line, 1 the far one; its place along it, and in the first single line. */
  line: number;
  x: number;
  one: number;
  /** The dancer facing it across the gap, whose lobster it is given at the change. */
  opposite: number;
}

/** A sung line as a run of word spans, so each unit can be lit as it is sung: the
    units the page's language splits a line into (`units()`, by its profile). The
    units and the spaces between them stay the line's own text. */
function wordsOf(line: HTMLElement, profile: LocaleProfile): HTMLElement[] {
  line.replaceChildren(
    ...units(line.textContent ?? '', profile).flatMap((unit) => {
      const word = document.createElement('span');
      word.className = 'lq__word';
      word.textContent = unit.text;
      return unit.glue ? [word, document.createTextNode(unit.glue)] : [word];
    }),
  );
  return [...line.querySelectorAll<HTMLElement>('.lq__word')];
}

/**
 * The song: the whole verse comes up as the beat opens and stays up through it,
 * and the sung words light one at a time, each rising on the swell as it is
 * sung. Under reduced motion the verse is there lit. The last, faint line stays.
 */
function sungCaption(
  beat: Beat,
  master: gsap.core.Timeline,
  reduced: boolean,
  last: boolean,
): boolean {
  if (!SUNG.has(beat.cue ?? '')) {
    return false;
  }
  const t = beat.index;
  const entry = captionEntry(reduced, t);
  master.fromTo(
    beat.lines,
    { opacity: 0, y: reduced ? 0 : 14 },
    { opacity: 1, y: 0, duration: reduced ? entry.duration : 0.2, stagger: reduced ? 0 : 0.02 },
    entry.at,
  );
  // The caption is composed before the shell is handed over, so the profile is
  // read from the page here, as the shell reads it.
  const profile = pageProfile();
  const words = beat.lines
    .filter((line) => line.dataset.speaker === 'mock-turtle')
    .flatMap((line) => wordsOf(line, profile));
  if (words.length > 0) {
    if (reduced) {
      master.fromTo(words, { '--lit': 0 }, { '--lit': 1, duration: 0.01 }, entry.at);
    } else {
      // Sung from the head of the beat to seven tenths of it, every word in turn.
      const each = Math.min(0.1, 1.6 / words.length);
      master.fromTo(
        words,
        { '--lit': 0 },
        { '--lit': 1, duration: each, ease: 'sine.out', stagger: { amount: 0.6 - each } },
        t + 0.1,
      );
    }
  }
  if (!last) {
    master.to(beat.lines, { opacity: 0, duration: 0.08 }, t + 0.9);
  }
  return true;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);
  const iSigh = cue('sigh');
  const iLines = cue('lines');
  const iAdvance = cue('advance');
  const iThrow = cue('throw');
  const iSwim = cue('swim');
  const iLand = cue('land');
  const iTry = cue('try');
  const iRound = cue('round');
  const iVerseOne = cue('verse-one');
  const iVerseTwo = cue('verse-two');
  const iVerseThree = cue('verse-three');
  const iOver = cue('over');
  const iSong = cue('song');
  const iSoup = cue('soup');
  const iCry = cue('cry');
  const iRun = cue('run');
  const iFaint = cue('faint');
  // The sea on the shingle, until the run along the shore.
  const seaSound = (): void => shell.sound.level('waves', master.time() < iRun ? 0.3 : 0);
  master.call(seaSound, [], 0.01);
  master.call(seaSound, [], iRun);
  seaSound();
  const random = seeded(10);
  const lite = matchMedia('(max-width: 700px)').matches;

  // --- The shore: sky, sea in three swells, shingle, and the stream of shingle
  // that runs under them on the way to the court. The sea breathes on its own.
  const shore = shell.layer('lq__shore');
  shore.innerHTML =
    '<div class="lq__sky"></div>' +
    '<div class="lq__sea lq__sea--far"></div>' +
    '<div class="lq__sea lq__sea--mid"></div>' +
    '<div class="lq__sea lq__sea--near"></div>' +
    '<div class="lq__shingle"></div>' +
    '<div class="lq__stream"><div class="lq__stream-plane"></div></div>';
  const seas = [...shore.querySelectorAll<HTMLElement>('.lq__sea')];
  seas.forEach((sea, index) => {
    shell.ambient.to(
      sea,
      {
        x: (index + 1) * 18,
        y: (index + 1) * -3,
        duration: 3.2 + index,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      },
      index * 0.4,
    );
  });

  // --- The court's doors, behind the dancers: a speck on the horizon until the
  // run, when the shore gives way to a path and they grow to meet the runners.
  const doors = shell.layer('lq__doors');
  doors.innerHTML = COURT_DOORS;

  // --- The dance floor in CSS 3D: the dancers, their lobsters, the jelly-fish
  // and the two hosts. The camera stands outside it to begin with and steps into
  // its centre when she joins the dance.
  const world = shell.layer('lq__world');
  const ring = document.createElement('div');
  ring.className = 'lq__ring';
  world.append(ring);
  const kinds = [...DANCERS, ...DANCERS];
  const count = lite ? 8 : 12;
  const perLine = count / 2;
  const dancers: Dancer[] = kinds.slice(0, count).map((kind, index) => {
    const el = document.createElement('div');
    el.className = 'lq__item lq__dancer';
    el.dataset.kind = kind;
    el.style.setProperty('--i', String(index));
    el.innerHTML = figure(`dancer/${kind}`);
    const partner = document.createElement('div');
    partner.className = 'lq__item lq__partner';
    partner.style.setProperty('--i', String(index));
    partner.innerHTML = figure('lobster');
    ring.append(el, partner);
    // Alternate lines, so each line has every kind in it; the near line sits a
    // little to one side of the far one, so the far dancers show between them.
    const line = index % 2;
    const along = Math.floor(index / 2) / (perLine - 1);
    return {
      el,
      partner,
      angle: 40 + (index / count) * 320,
      line,
      x: mix(-LINE_HALF, LINE_HALF, along) + (line === 0 ? 0.05 : -0.05),
      one: mix(-0.9, 0.9, index / (count - 1)),
      opposite: index ^ 1,
    };
  });
  const jellies = [-0.4, 0.08, 0.5].map((x) => {
    const el = document.createElement('div');
    el.className = 'lq__item lq__jelly';
    el.innerHTML = JELLY_SVG;
    ring.append(el);
    return { el, x };
  });
  const gryphon = document.createElement('div');
  gryphon.className = 'lq__item lq__dancer lq__gryphon';
  gryphon.innerHTML = figure('gryphon');
  const turtle = document.createElement('div');
  turtle.className = 'lq__item lq__dancer lq__turtle';
  turtle.innerHTML = figure('mock-turtle');
  ring.append(gryphon, turtle);
  const hosts = [
    { el: gryphon, angle: -30, side: -1 },
    { el: turtle, angle: 30, side: 1 },
  ];

  // Everything the scroll drives on the floor, in one object: `form` the lines
  // (1) or the ring (0), `split` one line into two, `step` the advance, `change`
  // the lobsters crossing over, `clear` the jelly-fish, `aside` the hosts
  // stepping out of the way, `unwind` the ring turning back to its places
  // after the dance, `run` the run along the shore.
  const floor = {
    form: 1,
    split: 0,
    step: 0,
    change: 0,
    clear: 0,
    aside: 0,
    radius: 1,
    inside: 0,
    tilt: -6,
    run: 0,
    unwind: 0,
  };
  // Joining the dance is the reader's own tween, on its own object, so nothing
  // the scroll drives on the floor can undo it; the ring's own turning is the
  // frame loop's, on another.
  const joining = { amount: 0 };
  const dance = { spin: 0 };
  const place = (el: HTMLElement, spot: Spot, k: number): void => {
    el.style.setProperty('--xr', spot.xr.toFixed(3));
    el.style.setProperty('--xl', spot.xl.toFixed(3));
    el.style.setProperty('--z', spot.z.toFixed(3));
    el.style.setProperty('--k', k.toFixed(3));
  };
  /** Left behind on the run: everything but the Gryphon slides past and out. */
  const behind = (spot: Spot): Spot => {
    const spread = 1 + floor.run * 1.4;
    return { xr: spot.xr * spread, xl: spot.xl * spread, z: spot.z + floor.run * 1.6 };
  };
  const lineSpot = (dancer: Dancer): { x: number; z: number } => {
    const z =
      dancer.line === 0 ? mix(Z_NEAR, Z_NEAR_IN, floor.step) : mix(Z_FAR, Z_FAR_IN, floor.step);
    return { x: mix(dancer.one, dancer.x, floor.split), z: mix(Z_ONE, z, floor.split) };
  };
  const applyFloor = (): void => {
    const inside = Math.max(floor.inside, joining.amount);
    const k = floor.form * (1 - joining.amount);
    // After the dance the ring turns back to its own places, the nearest way.
    const turns = Math.round(dance.spin / 360) * 360;
    const spin = mix(dance.spin, turns, floor.unwind);
    const radius = floor.radius;
    const lift = Math.sin(floor.change * Math.PI);
    dancers.forEach((dancer) => {
      const a = (dancer.angle + spin) * DEG;
      const ringX = Math.sin(a) * radius;
      const ringZ = Math.cos(a) * radius;
      const own = lineSpot(dancer);
      place(dancer.el, behind({ xr: ringX, xl: own.x, z: mix(ringZ, own.z, k) }), k);
      // Its lobster, at its side (the stylesheet sets it beside the dancer), or
      // crossing the gap to the dancer opposite at the change.
      const there = lineSpot(dancers[dancer.opposite] ?? dancer);
      const across = {
        xr: ringX,
        xl: mix(own.x, there.x, floor.change),
        z: mix(ringZ, mix(own.z, there.z, floor.change), k) + 0.02,
      };
      place(dancer.partner, behind(across), k);
      dancer.partner.style.setProperty('--lift', lift.toFixed(3));
    });
    for (const jelly of jellies) {
      const spread = 1 + floor.clear * 2.4;
      place(jelly.el, behind({ xr: jelly.x, xl: jelly.x * spread, z: mix(Z_NEAR, Z_FAR, 0.5) }), 1);
    }
    const aside = floor.aside * (1 - joining.amount);
    for (const host of hosts) {
      const a = (host.angle + spin) * DEG;
      const spot: Spot = {
        xr: Math.sin(a) * 0.72 * radius,
        xl: host.side * HOST_X,
        z: mix(Math.cos(a) * 0.72 * radius, HOST_Z, aside),
      };
      place(host.el, host.el === gryphon ? spot : behind(spot), aside);
    }
    ring.style.setProperty('--inside', inside.toFixed(3));
    ring.style.setProperty('--tilt', floor.tilt.toFixed(2));
    shore.style.setProperty('--run', floor.run.toFixed(3));
  };
  applyFloor();
  const move = (
    at: number,
    to: Partial<typeof floor>,
    duration = 0.7,
    ease = 'power2.inOut',
  ): void => {
    master.to(floor, { ...to, duration: quick(duration), ease, onUpdate: applyFloor }, at);
  };

  // The Mock Turtle sighs and cries; the Gryphon bounds into the air at its shouts.
  // The first frame is the one the Mock Turtle's story ended on: he has drawn
  // breath, and the sigh is that breath let go.
  master.fromTo(
    turtle,
    { '--breath': 1 },
    { '--breath': 0, duration: quick(0.12), ease: 'sine.out' },
    iSigh,
  );
  master.to(turtle, { '--sob': 1, duration: 0.3, yoyo: true, repeat: 3 }, iSigh + 0.1);
  for (const beat of shell.spokenBy('gryphon')) {
    beat.lines.forEach((line, n) => {
      if (line.dataset.speaker === 'gryphon' && exclaims(line.textContent ?? '')) {
        master.to(
          gryphon,
          { '--hop': 1, duration: quick(0.18), yoyo: true, repeat: 1, ease: 'power2.out' },
          beat.index + 0.1 + n * 0.1,
        );
      }
    });
  }
  master.to(turtle, { '--hop': 1, duration: 0.18, yoyo: true, repeat: 3 }, iSwim + 0.15);

  // --- First a line along the sea-shore; two lines!; the hosts step aside. The
  // jelly-fish lie between the lines until they are cleared out of the way.
  master.to(ring, { '--shown': 1, duration: quick(0.3) }, iLines + 0.05);
  move(iLines + 0.05, { aside: 1 }, 0.5);
  move(iLines + 0.36, { split: 1 }, 0.36);
  master.fromTo(
    ring,
    { '--jelly': 0 },
    { '--jelly': 1, duration: quick(0.2), immediateRender: false },
    iLines + 0.5,
  );
  // Advance twice, each with a lobster as a partner; set to partners; change
  // lobsters across the gap, and retire in the same order.
  move(iAdvance + 0.02, { clear: 1 }, 0.16, 'power1.in');
  master.to(ring, { '--jelly': 0, duration: quick(0.1) }, iAdvance + 0.08);
  master.fromTo(
    ring,
    { '--partners': 0 },
    { '--partners': 1, duration: quick(0.12), immediateRender: false },
    iAdvance + 0.13,
  );
  move(iAdvance + 0.24, { step: 1 }, 0.1, 'power2.out');
  move(iAdvance + 0.35, { step: 0 }, 0.08);
  move(iAdvance + 0.45, { step: 1 }, 0.1, 'power2.out');
  const partnering = (): void => {
    const t = master.time();
    ring.toggleAttribute(
      'data-partners',
      t >= iAdvance + 0.56 && t < iAdvance + 0.68 && !reducedMotion,
    );
  };
  master.call(partnering, [], iAdvance + 0.56);
  master.call(partnering, [], iAdvance + 0.68);
  move(iAdvance + 0.68, { change: 1 }, 0.16);
  move(iAdvance + 0.86, { step: 0 }, 0.12);

  // --- Her own lobster, in her hands: throw it as far out to sea as you can.
  const hands = shell.layer('lq__hands');
  hands.innerHTML = HANDS_WITH_LOBSTER;
  const held = hands.querySelector<HTMLElement>('.lq__lobster-held') ?? hands;
  const thrown = shell.layer('lq__thrown');
  thrown.innerHTML = `<div class="lq__lobster-flying">${figure('lobster')}</div><div class="lq__splash-ring"></div>`;
  const flying = thrown.querySelector<HTMLElement>('.lq__lobster-flying') ?? thrown;
  const splashRing = thrown.querySelector<HTMLElement>('.lq__splash-ring') ?? thrown;
  const throwButton = shell.prop(shell.ui.demoThrowLobster ?? '', 'lq__prop lq__prop--throw');
  // The open sea is pointer play beside the button: no keyboard focus, and not
  // in the accessibility tree; the button is the way for both.
  const seaTap = document.createElement('button');
  seaTap.type = 'button';
  seaTap.className = 'lq__sea-tap';
  seaTap.tabIndex = -1;
  seaTap.setAttribute('aria-hidden', 'true');
  shell.stage.append(seaTap);
  /** Whether the throw is in its moment; nothing throws outside it. */
  let throwOpen = false;
  /** Who threw it, if anyone: the reader's throw stands until the scroll goes back
      before the throw; the story's is undone by scrolling back into the throw. */
  let thrownBy: 'reader' | 'story' | undefined;
  let arc: gsap.core.Timeline | undefined;
  // The lobster in her hands is gone from the throw until a new one is changed
  // in on land: an attribute set from the scroll's own position, so no fade can
  // race it.
  const heldNow = (): void => {
    const changed = master.time() >= iLand + 0.2;
    held.toggleAttribute('data-changed', changed);
    held.toggleAttribute('data-gone', thrownBy !== undefined && !changed);
  };
  const throwWindow = (): void => {
    const t = master.time();
    throwOpen = t >= iThrow && t < iThrow + 0.7 && thrownBy === undefined;
    if (throwOpen) {
      throwButton.show();
      seaTap.dataset.shown = '';
    } else {
      throwButton.hide();
      delete seaTap.dataset.shown;
    }
  };
  /** The arc in the air ends with the throw's beat, whoever threw. */
  const settleArc = (): void => {
    arc?.kill();
    arc = undefined;
    gsap.set(flying, { opacity: 0 });
    gsap.set(splashRing, { opacity: 0 });
  };
  const unthrow = (): void => {
    thrownBy = undefined;
    settleArc();
    ring.removeAttribute('data-thrown');
    heldNow();
  };
  const throwLobster = (byReader: boolean): void => {
    if (thrownBy !== undefined || (byReader && !throwOpen)) {
      return;
    }
    thrownBy = byReader ? 'reader' : 'story';
    throwOpen = false;
    if (byReader) {
      shell.keep('lobster');
      shell.status(shell.ui.demoThrowLobster ?? '');
    }
    throwWindow();
    heldNow();
    // The story's throw flies only while the throw is on: scrolled straight past,
    // the lobster is simply gone out to sea.
    if (!byReader && master.time() >= iSwim) {
      ring.setAttribute('data-thrown', '');
      return;
    }
    shell.sound.play('whoosh', 0.8);
    arc = gsap.timeline();
    arc.set(flying, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotate: 0 });
    if (reducedMotion) {
      // A short lift, then the splash.
      arc.set(flying, { yPercent: -60 }, 0);
      arc.set(flying, { opacity: 0 }, 0.35);
      arc.fromTo(splashRing, { opacity: 0.9, scale: 1 }, { opacity: 0, duration: 0.01 }, 0.9);
      arc.call(() => shell.sound.play('splash', 0.9), [], 0.35);
    } else {
      arc.to(flying, { yPercent: -180, duration: 0.5, ease: 'power2.out' }, 0);
      arc.to(flying, { scale: 0.18, xPercent: 40, duration: 1.1, ease: 'power1.in' }, 0);
      arc.to(flying, { rotate: 300, duration: 1.1, ease: 'none' }, 0);
      arc.to(flying, { yPercent: -70, duration: 0.6, ease: 'power2.in' }, 0.5);
      arc.set(flying, { opacity: 0 }, 1.1);
      arc.fromTo(
        splashRing,
        { opacity: 0.9, scale: 0.2 },
        { opacity: 0, scale: 1.6, duration: 0.7 },
        1.05,
      );
      arc.call(() => shell.sound.play('splash', 0.9), [], 1.05);
    }
    // Everyone else throws theirs too.
    ring.setAttribute('data-thrown', '');
  };
  throwButton.addEventListener('click', () => throwLobster(true));
  seaTap.addEventListener('click', () => throwLobster(true));
  // The hands rest out of the frame, all of them, lobster and fingers.
  const HANDS_AWAY = '34vh';
  master.fromTo(
    hands,
    { y: HANDS_AWAY },
    { y: 0, duration: quick(0.4), ease: 'power2.out' },
    iAdvance + 0.7,
  );
  master.call(
    () => {
      if (master.time() < iThrow && thrownBy !== undefined) {
        unthrow();
      }
      throwWindow();
    },
    [],
    iThrow,
  );
  master.call(
    () => {
      if (master.time() >= iThrow + 0.7) {
        throwLobster(false);
      } else if (thrownBy === 'story') {
        // Back into the moment: the story's throw is taken back, the reader's turn again.
        unthrow();
      }
      throwWindow();
    },
    [],
    iThrow + 0.7,
  );
  master.call(settleArc, [], iSwim);

  // --- Swim after them: under the water, and a somersault in the sea.
  const water = shell.layer('lq__water');
  water.innerHTML = Array.from(
    { length: lite ? 14 : 26 },
    () =>
      `<div class="lq__bubble" style="--x: ${(random() * 100).toFixed(1)}%; --delay: ${(-random() * 4).toFixed(2)}s; --size: ${(1 + random() * 2.4).toFixed(1)}; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  // The dive is the scroll's; the somersault is play, on its own object.
  const dive = { depth: 0 };
  const turn = { roll: 0 };
  const applyDive = (): void => {
    water.style.setProperty('--depth', dive.depth.toFixed(3));
    shell.stage.style.setProperty('--roll', turn.roll.toFixed(1));
    shell.sound.level('drip', dive.depth * 0.4);
  };
  applyDive();
  master.to(
    dive,
    { depth: 1, duration: quick(0.5), ease: 'power2.in', onUpdate: applyDive },
    iSwim + 0.1,
  );
  master.to(hands, { y: HANDS_AWAY, duration: quick(0.3) }, iSwim);
  const somersaultButton = shell.prop(
    shell.ui.demoSomersault ?? '',
    'lq__prop lq__prop--somersault',
  );
  let rolling = false;
  let rollTween: gsap.core.Tween | undefined;
  /** Upright again, at once: a somersault never outlasts its moment in the sea. */
  const settleRoll = (): void => {
    rollTween?.kill();
    rollTween = undefined;
    rolling = false;
    turn.roll = 0;
    water.style.setProperty('--blink', '0');
    applyDive();
  };
  const somersault = (byReader: boolean): void => {
    if (rolling || (byReader && water.dataset.tappable === undefined)) {
      return;
    }
    rolling = true;
    shell.sound.play('splash', 0.5);
    if (byReader) {
      shell.status(shell.ui.demoSomersault ?? '');
    }
    if (reducedMotion) {
      // A blink instead of a turn.
      rollTween = gsap.fromTo(
        water,
        { '--blink': 1 },
        { '--blink': 0, duration: 0.3, onComplete: () => (rolling = false) },
      );
      return;
    }
    rollTween = gsap.fromTo(
      turn,
      { roll: 0 },
      {
        roll: 360,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: applyDive,
        // Round to upright again, so nothing is left a hair off square.
        onComplete: settleRoll,
      },
    );
  };
  somersaultButton.addEventListener('click', () => somersault(true));
  water.addEventListener('click', () => somersault(true));
  const somersaultWindow = (): void => {
    const inside = master.time() >= iSwim + 0.3 && master.time() < iLand;
    if (inside) {
      somersaultButton.show();
      water.dataset.tappable = '';
    } else {
      somersaultButton.hide();
      delete water.dataset.tappable;
    }
  };
  master.call(somersaultWindow, [], iSwim + 0.3);
  master.call(somersaultWindow, [], iLand);
  // The story turns its own somersault only while the reader is in the sea;
  // scrolled on past it, or back before it, the frame is upright.
  master.call(
    () => (master.time() >= iSwim + 0.75 && master.time() < iLand ? somersault(false) : undefined),
    [],
    iSwim + 0.75,
  );
  const rollWindow = (): void => {
    const t = master.time();
    if (t < iSwim + 0.3 || t >= iLand + 0.5) {
      settleRoll();
    }
  };
  master.call(rollWindow, [], iSwim + 0.3);
  master.call(rollWindow, [], iLand + 0.5);
  // Change lobsters again: a new one in hand. Back to land.
  master.to(
    dive,
    { depth: 0, duration: quick(0.5), ease: 'power2.out', onUpdate: applyDive },
    iLand + 0.1,
  );
  master.call(heldNow, [], iLand + 0.2);
  master.fromTo(
    hands,
    { y: HANDS_AWAY },
    { y: 0, duration: quick(0.4), immediateRender: false },
    iLand + 0.2,
  );
  master.to(hands, { y: HANDS_AWAY, duration: quick(0.4) }, iTry);
  move(iLand + 0.3, { change: 0 }, 0.01);
  master.call(
    () => ring.toggleAttribute('data-thrown', master.time() < iLand + 0.3),
    [],
    iLand + 0.3,
  );
  // We can do without lobsters, you know.
  master.to(ring, { '--partners': 0, duration: quick(0.2) }, iTry + 0.4);

  // --- Would you like to see a little of it? Join the dance: the camera steps
  // into the ring, and the dancers go round and round her.
  const joinButton = shell.prop(shell.ui.demoJoinDance ?? '', 'lq__prop lq__prop--join');
  let joined = false;
  const join = (byReader: boolean): void => {
    if (joined) {
      return;
    }
    joined = true;
    joinButton.hide();
    shell.sound.play('chime', 0.6);
    if (byReader) {
      shell.status(shell.ui.demoJoinDance ?? '');
    }
    gsap.to(joining, {
      amount: 1,
      duration: quick(0.9),
      ease: 'power2.inOut',
      onUpdate: applyFloor,
      overwrite: true,
    });
  };
  joinButton.addEventListener('click', () => join(true));
  master.call(
    () => {
      const inside = master.time() >= iTry + 0.2 && master.time() < iRound + 0.2;
      if (inside && !joined) {
        joinButton.show();
      } else {
        joinButton.hide();
      }
      // Scrolling back before the offer puts her outside the ring again; the
      // check sits a little before the callback's own position so a playhead
      // landing exactly on it never undoes a join that just happened.
      if (master.time() < iTry && joined) {
        joined = false;
        gsap.to(joining, {
          amount: 0,
          duration: quick(0.5),
          onUpdate: applyFloor,
          overwrite: true,
        });
      }
    },
    [],
    iTry + 0.2,
  );
  master.call(() => (master.time() >= iRound + 0.2 ? join(false) : undefined), [], iRound + 0.2);
  // Round and round: the ring's own turning, which the pause button stops, is
  // only on while the dance is; the scroll carries the rest.
  let dancing = false;
  let spinRate = 0;
  const dancingNow = (): void => {
    dancing = master.time() >= iRound + 0.3 && master.time() < iOver + 0.3;
    ring.toggleAttribute('data-dancing', dancing);
  };
  master.call(dancingNow, [], iRound + 0.3);
  master.call(dancingNow, [], iOver + 0.3);
  let toes = 0;
  shell.onFrame((dt) => {
    const want = dancing && !reducedMotion ? 26 : 0;
    spinRate = mix(spinRate, want, 1 - Math.exp(-dt * 2));
    if (spinRate > 0.01) {
      dance.spin = (dance.spin + spinRate * dt) % 360;
      applyFloor();
    }
    // Every now and then one of them treads on her toes as it passes in front.
    toes += dt;
    if (dancing && !reducedMotion && toes > 5.5) {
      toes = 0;
      shell.sound.play('thud', 0.5);
      gsap.fromTo(
        shell.stage,
        { x: 6 },
        { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', clearProps: 'x' },
      );
    }
  });
  move(iRound, { radius: 0.9, tilt: -4 }, 1);
  move(iOver + 0.2, { radius: 1, tilt: -6 }, 0.8);

  // --- The song: the whiting and the snail come by in the sea as they are sung of.
  const songLayer = shell.layer('lq__song');
  songLayer.innerHTML =
    `<div class="lq__swimmer lq__swimmer--whiting">${figure('dancer/whiting')}</div>` +
    `<button type="button" class="lq__swimmer lq__swimmer--snail" aria-label="${shell.ui.demoSnail ?? ''}">${figure('dancer/snail')}</button>` +
    `<div class="lq__swimmer lq__swimmer--porpoise">${figure('dancer/porpoise')}</div>`;
  const whiting = songLayer.querySelector<HTMLElement>('.lq__swimmer--whiting') ?? songLayer;
  const snail = songLayer.querySelector<HTMLButtonElement>('.lq__swimmer--snail');
  const porpoise = songLayer.querySelector<HTMLElement>('.lq__swimmer--porpoise') ?? songLayer;
  master.fromTo(
    whiting,
    { x: '-30vw', opacity: 0 },
    { x: '0vw', opacity: 1, duration: 0.5 },
    iVerseOne + 0.1,
  );
  master.fromTo(
    snail,
    { x: '20vw', opacity: 0 },
    { x: '0vw', opacity: 1, duration: 0.5 },
    iVerseOne + 0.2,
  );
  master.fromTo(
    porpoise,
    { x: '-60vw', opacity: 0 },
    { x: '-18vw', opacity: 1, duration: 0.6 },
    iVerseOne + 0.3,
  );
  master.to(porpoise, { x: '10vw', duration: 0.8 }, iVerseTwo + 0.1);
  master.to(snail, { '--shy': 1, duration: quick(0.3) }, iVerseTwo + 0.4);
  master.to(snail, { '--shy': 0, duration: quick(0.4) }, iVerseThree + 0.5);
  master.to([whiting, snail, porpoise], { opacity: 0, duration: 0.3 }, iOver);
  // The snail is a button only while it is in the sea.
  const snailLive = (): void => {
    const t = master.time();
    snail?.toggleAttribute('data-live', t >= iVerseOne + 0.2 && t < iOver + 0.3);
  };
  master.call(snailLive, [], iVerseOne + 0.2);
  master.call(snailLive, [], iOver + 0.3);
  snail?.addEventListener('click', () => {
    if (!snail.hasAttribute('data-live')) {
      return;
    }
    shell.sound.play('paper', 0.4);
    shell.status(shell.ui.demoSnail ?? '');
    gsap.fromTo(
      snail,
      { '--shy': 1 },
      { '--shy': 0, duration: quick(0.6), delay: 0.8, overwrite: 'auto' },
    );
  });

  // --- Beautiful Soup: a tureen steams while the Mock Turtle sobs through it.
  const soup = shell.layer('lq__soup');
  soup.innerHTML = `<div class="lq__tureen">${TUREEN_SVG}</div>`;
  master.fromTo(soup, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, iSoup + 0.1);
  master.to(turtle, { '--sob': 1, duration: 0.25, yoyo: true, repeat: 5 }, iSoup + 0.1);
  move(iSong, { inside: 0, form: 0, aside: 0, radius: 1, unwind: 1 }, 0.9);
  master.to(joining, { amount: 0, duration: quick(0.9), onUpdate: applyFloor }, iSong);
  master.to(soup, { opacity: 0, duration: 0.3 }, iCry);

  // --- A cry in the distance, and the run along the shore: the shingle streams
  // under them, the dancers fall behind, and the words come fainter on the breeze.
  master.to(gryphon, { '--hop': 1, duration: quick(0.2), yoyo: true, repeat: 1 }, iCry + 0.5);
  move(iRun, { run: 1 }, 1, 'power1.inOut');
  // They fade as they fall behind: a property of the ring the stylesheet reads,
  // so nothing is left written on the dancers when the scroll comes back.
  master.fromTo(
    ring,
    { '--away': 0 },
    { '--away': 1, duration: quick(0.8), immediateRender: false },
    iRun + 0.3,
  );
  master.fromTo(
    gryphon,
    { '--lead': 0 },
    { '--lead': 1, duration: quick(0.5), immediateRender: false },
    iRun,
  );
  // The stream of shingle is there while they run, and gone as they arrive.
  master.fromTo(
    shore,
    { '--stream': 0 },
    { '--stream': 1, duration: 0.3, immediateRender: false },
    iRun + 0.05,
  );
  master.to(shore, { '--stream': 0, duration: 0.3 }, iFaint + 0.55);
  const running = (): void => {
    const on = master.time() >= iRun + 0.05 && master.time() < iFaint + 0.85 && !reducedMotion;
    shore.toggleAttribute('data-running', on);
    shell.sound.level('wind', on ? 0.4 : 0);
  };
  master.call(running, [], iRun + 0.05);
  master.call(running, [], iFaint + 0.85);
  master.to(shore, { '--dusk': 1, duration: 1 }, iFaint);
  // The run arrives: the doors grow along it, and at the last words they are up
  // close and just beginning to open on the court's light. Under reduced motion
  // they appear with a blink and open with a cross-fade instead.
  if (reducedMotion) {
    master.set(doors, { '--near': 1 }, iRun + 0.3);
    master.fromTo(doors, { opacity: 0 }, { opacity: 1, duration: 0.05 }, iRun + 0.3);
    master.set(doors, { '--open': 1 }, iFaint + 0.5);
  } else {
    master.to(doors, { '--near': 1, duration: 1.6, ease: 'power1.in' }, iRun);
    master.to(doors, { '--open': 0.4, duration: 0.5, ease: 'power2.out' }, iFaint + 0.5);
  }
  master.call(
    () => (master.time() >= iFaint + 0.5 ? shell.sound.play('paper', 0.5) : undefined),
    [],
    iFaint + 0.5,
  );
}

const shell = attachDemo({
  caption: (beat, master, reduced, beats) =>
    sungCaption(beat, master, reduced, beat.index === beats.length - 1),
});
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
