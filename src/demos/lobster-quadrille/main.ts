/**
 * The Lobster Quadrille: the concept demo.
 *
 * A shore: sky, a sea that breathes, shingle. The Gryphon and the Mock Turtle
 * explain the dance in front of the reader, the dancers form their two lines and
 * advance, and the reader has a lobster of their own to throw as far out to sea
 * as they can, to swim after, and to turn a somersault under the water for. Then
 * the reader joins the dance: the ring of dancers turns round the camera, the
 * Mock Turtle sings, the creatures of the song come by in the sea, and at the
 * cry from the distance the Gryphon takes her hand and runs, the song fading
 * behind on the breeze, until the shore gives way to a path and the court's own
 * doors, which are just opening as the demo ends; the trial opens inside them.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { DANCERS } from '../art/vectors.ts';
import { attachDemo, type Beat, type DemoShell, mix, seeded } from '../shell/shell.ts';
import { COURT_DOORS, HANDS_WITH_LOBSTER, TUREEN_SVG } from './figures.ts';
import './quadrille.css';

interface Dancer {
  el: HTMLElement;
  /** Angle round the ring, degrees, and the angle it takes in the two lines. */
  angle: number;
  lineAngle: number;
  radius: number;
}

/** Sung lines rise with the swell, a word at a time; the last, faint, from far off. */
function sungCaption(
  beat: Beat,
  master: gsap.core.Timeline,
  reduced: boolean,
  last: boolean,
): boolean {
  const sung = beat.lines.filter((line) => line.dataset.speaker === 'mock-turtle');
  if (sung.length === 0) {
    return false;
  }
  const t = beat.index;
  master.fromTo(
    beat.lines,
    { opacity: 0, y: reduced ? 0 : 22, '--wave': reduced ? 0 : 1 },
    { opacity: last ? 0.55 : 1, y: 0, '--wave': 0, duration: 0.36, stagger: 0.1 },
    t + 0.05,
  );
  if (!last) {
    master.to(beat.lines, { opacity: 0, duration: 0.14 }, t + 0.84);
  }
  return true;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
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
  const random = seeded(10);
  const lite = matchMedia('(max-width: 700px)').matches;

  // --- The shore: sky, sea in three swells, shingle. The sea breathes on its own.
  const shore = shell.layer('lq__shore');
  shore.innerHTML =
    '<div class="lq__sky"></div>' +
    '<div class="lq__sea lq__sea--far"></div>' +
    '<div class="lq__sea lq__sea--mid"></div>' +
    '<div class="lq__sea lq__sea--near"></div>' +
    '<div class="lq__shingle"></div>';
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

  // --- The dance floor: a ring of dancers in CSS 3D. The camera stands outside
  // it to begin with and steps into its centre when she joins the dance.
  const world = shell.layer('lq__world');
  const ring = document.createElement('div');
  ring.className = 'lq__ring';
  world.append(ring);
  const kinds = [...DANCERS, ...DANCERS];
  const dancers: Dancer[] = kinds.slice(0, lite ? 8 : 12).map((kind, index, all) => {
    const el = document.createElement('div');
    el.className = 'lq__dancer';
    el.dataset.kind = kind;
    el.style.setProperty('--i', String(index));
    el.innerHTML = `${figure(`dancer/${kind}`)}<div class="lq__partner">${figure('lobster')}</div>`;
    ring.append(el);
    // Two lines: the first half on the left arc, the second on the right.
    const half = Math.floor(all.length / 2);
    const side = index < half ? -1 : 1;
    const along = index < half ? index : index - half;
    return {
      el,
      angle: 40 + (index / all.length) * 320,
      lineAngle: side * (30 + (along / half) * 60),
      radius: 1,
    };
  });
  const gryphon = document.createElement('div');
  gryphon.className = 'lq__dancer lq__gryphon';
  gryphon.innerHTML = figure('gryphon');
  const turtle = document.createElement('div');
  turtle.className = 'lq__dancer lq__turtle';
  turtle.innerHTML = figure('mock-turtle');
  ring.append(gryphon, turtle);
  const hosts = [
    { el: gryphon, angle: -30, lineAngle: -30, radius: 0.72 },
    { el: turtle, angle: 30, lineAngle: 30, radius: 0.72 },
  ];

  const floor = { spin: 0, lines: 0, radius: 1, step: 0, inside: 0, tilt: -6, run: 0 };
  // Joining the dance is the reader's own tween, on its own object, so nothing
  // the scroll drives on the floor can undo it.
  const joining = { amount: 0 };
  const applyFloor = (): void => {
    const inside = Math.max(floor.inside, joining.amount);
    const lines = floor.lines * (1 - joining.amount);
    for (const dancer of [...dancers, ...hosts]) {
      const angle = mix(dancer.angle, dancer.lineAngle, lines) + floor.spin;
      const radius = dancer.radius * floor.radius * (1 - floor.step * 0.18);
      dancer.el.style.setProperty('--a', angle.toFixed(2));
      dancer.el.style.setProperty('--r', radius.toFixed(3));
    }
    ring.style.setProperty('--inside', inside.toFixed(3));
    ring.style.setProperty('--tilt', floor.tilt.toFixed(2));
    ring.style.setProperty('--run', floor.run.toFixed(3));
    shore.style.setProperty('--run', floor.run.toFixed(3));
  };
  applyFloor();
  const move = (
    at: number,
    to: Partial<typeof floor>,
    duration = 0.7,
    ease = 'power2.inOut',
  ): void => {
    master.to(
      floor,
      { ...to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: applyFloor },
      at,
    );
  };

  // The Mock Turtle sighs and cries; the Gryphon bounds into the air at its shouts.
  master.to(turtle, { '--sob': 1, duration: 0.3, yoyo: true, repeat: 3 }, iSigh + 0.1);
  for (const beat of shell.spokenBy('gryphon')) {
    beat.lines.forEach((line, n) => {
      if (line.dataset.speaker === 'gryphon' && /!$/.test(line.textContent ?? '')) {
        master.to(
          gryphon,
          {
            '--hop': 1,
            duration: reducedMotion ? 0.01 : 0.18,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out',
          },
          beat.index + 0.1 + n * 0.1,
        );
      }
    });
  }
  master.to(turtle, { '--hop': 1, duration: 0.18, yoyo: true, repeat: 3 }, iSwim + 0.15);

  // --- Two lines along the shore, then advance twice, set to partners, change lobsters.
  master.to(ring, { '--shown': 1, duration: 0.5 }, iLines);
  move(iLines + 0.2, { lines: 1 }, 0.8);
  move(iAdvance + 0.1, { step: 1 }, 0.2, 'power2.out');
  move(iAdvance + 0.3, { step: 0 }, 0.2);
  move(iAdvance + 0.45, { step: 1 }, 0.2, 'power2.out');
  move(iAdvance + 0.65, { step: 0 }, 0.2);
  master.call(
    () =>
      ring.toggleAttribute(
        'data-partners',
        master.time() >= iAdvance + 0.7 && master.time() < iThrow,
      ),
    [],
    iAdvance + 0.7,
  );
  master.call(() => ring.toggleAttribute('data-partners', false), [], iThrow);
  master.to(ring, { '--changed': 1, duration: reducedMotion ? 0.01 : 0.3 }, iAdvance + 0.85);

  // --- Her own lobster, in her hands: throw it as far out to sea as you can.
  const hands = shell.layer('lq__hands');
  hands.innerHTML = HANDS_WITH_LOBSTER;
  const held = hands.querySelector<HTMLElement>('.lq__lobster-held') ?? hands;
  const thrown = shell.layer('lq__thrown');
  thrown.innerHTML = `<div class="lq__lobster-flying">${figure('lobster')}</div><div class="lq__splash-ring"></div>`;
  const flying = thrown.querySelector<HTMLElement>('.lq__lobster-flying') ?? thrown;
  const splashRing = thrown.querySelector<HTMLElement>('.lq__splash-ring') ?? thrown;
  const throwButton = shell.prop(shell.ui.demoThrowLobster ?? '', 'lq__prop lq__prop--throw');
  const seaTap = document.createElement('button');
  seaTap.type = 'button';
  seaTap.className = 'lq__sea-tap';
  seaTap.setAttribute('aria-label', shell.ui.demoThrowLobster ?? '');
  shell.stage.append(seaTap);
  let thrownAway = false;
  const throwLobster = (): void => {
    if (thrownAway) {
      return;
    }
    thrownAway = true;
    throwButton.hide();
    delete seaTap.dataset.shown;
    shell.sound.play('whoosh', 0.8);
    shell.status(shell.ui.demoThrowLobster ?? '');
    gsap.to(held, { opacity: 0, duration: 0.05 });
    const arc = gsap.timeline();
    arc.set(flying, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1 });
    arc.to(
      flying,
      {
        yPercent: reducedMotion ? -60 : -180,
        duration: reducedMotion ? 0.01 : 0.5,
        ease: 'power2.out',
      },
      0,
    );
    arc.to(
      flying,
      { scale: 0.18, xPercent: 40, duration: reducedMotion ? 0.01 : 1.1, ease: 'power1.in' },
      0,
    );
    arc.to(flying, { yPercent: -70, duration: reducedMotion ? 0.01 : 0.6, ease: 'power2.in' }, 0.5);
    arc.set(flying, { opacity: 0 }, 1.1);
    arc.fromTo(
      splashRing,
      { opacity: 0.9, scale: 0.2 },
      { opacity: 0, scale: 1.6, duration: reducedMotion ? 0.01 : 0.7 },
      1.05,
    );
    arc.call(() => shell.sound.play('splash', 0.9), [], 1.05);
    // Everyone else throws theirs too.
    ring.setAttribute('data-thrown', '');
  };
  throwButton.addEventListener('click', throwLobster);
  seaTap.addEventListener('click', throwLobster);
  master.fromTo(
    hands,
    { y: 140 },
    { y: 0, duration: reducedMotion ? 0.01 : 0.4, ease: 'power2.out' },
    iAdvance + 0.7,
  );
  master.call(
    () => {
      const inside = master.time() >= iThrow && master.time() < iThrow + 0.7;
      if (inside && !thrownAway) {
        throwButton.show();
        seaTap.dataset.shown = '';
      } else {
        throwButton.hide();
        delete seaTap.dataset.shown;
      }
      if (master.time() < iThrow && thrownAway) {
        thrownAway = false;
        gsap.set(held, { opacity: 1 });
        gsap.set(flying, { opacity: 0 });
        ring.removeAttribute('data-thrown');
      }
    },
    [],
    iThrow,
  );
  master.call(() => (master.time() >= iThrow + 0.7 ? throwLobster() : undefined), [], iThrow + 0.7);

  // --- Swim after them: under the water, and a somersault in the sea.
  const water = shell.layer('lq__water');
  water.innerHTML = Array.from(
    { length: lite ? 14 : 26 },
    () =>
      `<div class="lq__bubble" style="--x: ${(random() * 100).toFixed(1)}%; --delay: ${(-random() * 4).toFixed(2)}s; --size: ${(1 + random() * 2.4).toFixed(1)}; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  const dive = { depth: 0, roll: 0 };
  const applyDive = (): void => {
    water.style.setProperty('--depth', dive.depth.toFixed(3));
    shell.stage.style.setProperty('--roll', dive.roll.toFixed(1));
    shell.sound.level('drip', dive.depth * 0.4);
  };
  applyDive();
  master.to(
    dive,
    { depth: 1, duration: reducedMotion ? 0.01 : 0.5, ease: 'power2.in', onUpdate: applyDive },
    iSwim + 0.1,
  );
  master.to(hands, { y: 140, duration: reducedMotion ? 0.01 : 0.3 }, iSwim);
  const somersaultButton = shell.prop(
    shell.ui.demoSomersault ?? '',
    'lq__prop lq__prop--somersault',
  );
  let rolling = false;
  const somersault = (): void => {
    if (rolling) {
      return;
    }
    rolling = true;
    shell.sound.play('splash', 0.5);
    shell.status(shell.ui.demoSomersault ?? '');
    if (reducedMotion) {
      // A blink instead of a turn.
      gsap.fromTo(
        water,
        { '--blink': 1 },
        { '--blink': 0, duration: 0.3, onComplete: () => (rolling = false) },
      );
      return;
    }
    gsap.fromTo(
      dive,
      { roll: 0 },
      {
        roll: 360,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: applyDive,
        onComplete: () => (rolling = false),
      },
    );
  };
  somersaultButton.addEventListener('click', somersault);
  water.addEventListener('click', somersault);
  master.call(
    () => {
      const inside = master.time() >= iSwim + 0.3 && master.time() < iLand;
      if (inside) {
        somersaultButton.show();
        water.dataset.tappable = '';
      } else {
        somersaultButton.hide();
        delete water.dataset.tappable;
      }
    },
    [],
    iSwim + 0.3,
  );
  master.call(() => (master.time() >= iSwim + 0.75 ? somersault() : undefined), [], iSwim + 0.75);
  master.call(
    () => {
      somersaultButton.hide();
      delete water.dataset.tappable;
    },
    [],
    iLand,
  );
  // Change lobsters again: a new one in hand. Back to land.
  master.to(
    dive,
    { depth: 0, duration: reducedMotion ? 0.01 : 0.5, ease: 'power2.out', onUpdate: applyDive },
    iLand + 0.1,
  );
  master.call(
    () => {
      if (master.time() >= iLand + 0.2) {
        gsap.set(held, { opacity: 1 });
        held.setAttribute('data-changed', '');
      } else {
        held.removeAttribute('data-changed');
      }
    },
    [],
    iLand + 0.2,
  );
  master.fromTo(
    hands,
    { y: 140 },
    { y: 0, duration: reducedMotion ? 0.01 : 0.4, immediateRender: false },
    iLand + 0.2,
  );
  master.to(hands, { y: 140, duration: reducedMotion ? 0.01 : 0.4 }, iTry);
  master.to(ring, { '--changed': 0, duration: reducedMotion ? 0.01 : 0.3 }, iLand + 0.3);
  master.call(
    () => ring.toggleAttribute('data-thrown', master.time() < iLand + 0.3),
    [],
    iLand + 0.3,
  );

  // --- Would you like to see a little of it? Join the dance: the camera steps
  // into the ring, and the dancers go round and round her.
  const joinButton = shell.prop(shell.ui.demoJoinDance ?? '', 'lq__prop lq__prop--join');
  let joined = false;
  const join = (): void => {
    if (joined) {
      return;
    }
    joined = true;
    joinButton.hide();
    shell.sound.play('chime', 0.6);
    shell.status(shell.ui.demoJoinDance ?? '');
    gsap.to(joining, {
      amount: 1,
      duration: reducedMotion ? 0.01 : 0.9,
      ease: 'power2.inOut',
      onUpdate: applyFloor,
      overwrite: true,
    });
  };
  joinButton.addEventListener('click', join);
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
          duration: reducedMotion ? 0.01 : 0.5,
          onUpdate: applyFloor,
          overwrite: true,
        });
      }
    },
    [],
    iTry + 0.2,
  );
  master.call(() => (master.time() >= iRound + 0.2 ? join() : undefined), [], iRound + 0.2);
  // Round and round: the ring's own turning, which the pause button stops, is
  // only on while the dance is; the scroll carries the rest.
  let dancing = false;
  let spinRate = 0;
  master.call(
    () => {
      dancing = master.time() >= iRound + 0.3 && master.time() < iOver + 0.3;
      ring.toggleAttribute('data-dancing', dancing);
    },
    [],
    iRound + 0.3,
  );
  master.call(
    () => {
      dancing = master.time() >= iRound + 0.3 && master.time() < iOver + 0.3;
      ring.toggleAttribute('data-dancing', dancing);
    },
    [],
    iOver + 0.3,
  );
  let toes = 0;
  shell.onFrame((dt) => {
    const want = dancing && !reducedMotion ? 26 : 0;
    spinRate = mix(spinRate, want, 1 - Math.exp(-dt * 2));
    if (spinRate > 0.01) {
      floor.spin = (floor.spin + spinRate * dt) % 360;
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
  master.to(snail, { '--shy': 1, duration: reducedMotion ? 0.01 : 0.3 }, iVerseTwo + 0.4);
  master.to(snail, { '--shy': 0, duration: reducedMotion ? 0.01 : 0.4 }, iVerseThree + 0.5);
  master.to([whiting, snail, porpoise], { opacity: 0, duration: 0.3 }, iOver);
  snail?.addEventListener('click', () => {
    shell.sound.play('paper', 0.4);
    shell.status(shell.ui.demoSnail ?? '');
    gsap.fromTo(
      snail,
      { '--shy': 1 },
      { '--shy': 0, duration: reducedMotion ? 0.01 : 0.6, delay: 0.8, overwrite: 'auto' },
    );
  });

  // --- Beautiful Soup: a tureen steams while the Mock Turtle sobs through it.
  const soup = shell.layer('lq__soup');
  soup.innerHTML = `<div class="lq__tureen">${TUREEN_SVG}</div>`;
  master.fromTo(soup, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, iSoup + 0.1);
  master.to(turtle, { '--sob': 1, duration: 0.25, yoyo: true, repeat: 5 }, iSoup + 0.1);
  move(iSong, { inside: 0, lines: 0, radius: 1 }, 0.9);
  master.to(
    joining,
    { amount: 0, duration: reducedMotion ? 0.01 : 0.9, onUpdate: applyFloor },
    iSong,
  );
  master.to(soup, { opacity: 0, duration: 0.3 }, iCry);

  // --- A cry in the distance, and the run along the shore: the shore streams
  // past, the dancers fall behind, and the words come fainter on the breeze.
  master.to(
    gryphon,
    { '--hop': 1, duration: reducedMotion ? 0.01 : 0.2, yoyo: true, repeat: 1 },
    iCry + 0.5,
  );
  move(iRun, { run: 1 }, 1.6, 'power1.in');
  master.to([...dancers.map((d) => d.el), turtle], { opacity: 0, duration: 0.8 }, iRun + 0.3);
  master.fromTo(
    gryphon,
    { '--lead': 0 },
    { '--lead': 1, duration: reducedMotion ? 0.01 : 0.5, immediateRender: false },
    iRun,
  );
  master.call(
    () => {
      const running = master.time() >= iRun + 0.1 && !reducedMotion;
      shore.toggleAttribute('data-running', running);
      shell.sound.level('wind', running ? 0.4 : 0);
    },
    [],
    iRun + 0.1,
  );
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
