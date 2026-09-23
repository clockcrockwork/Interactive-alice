/**
 * The trial: the concept demo.
 *
 * The court is a paper theatre: flat cutouts standing at different depths inside a
 * CSS perspective, so a sideways dolly separates them into layers. The camera
 * pans from the throne to the jury as Alice looks round, pushes into the Queen as
 * her temper rises, and pulls back as Alice grows. Then the pack rises, comes for
 * the reader, and some of the cards hit the glass and stay there, until they turn
 * to dead leaves and the riverbank is behind them.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, seeded } from '../shell/shell.ts';
import type { OneShotCue } from '../shell/sound.ts';
import { PIG_BABY_SVG, REAL_SVG, TARTS_SVG, TEACUPS_SVG } from './figures.ts';
import './trial.css';

const SUITS = [
  ['hearts', '♥'],
  ['diamonds', '♦'],
  ['clubs', '♣'],
  ['spades', '♠'],
] as const;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface CameraShot {
  x: number;
  z: number;
  ry?: number;
  y?: number;
}

/** Where the camera looks for each cue: court x in vw, push-in z in px. */
const SHOTS: Record<string, CameraShot> = {
  throne: { x: 0, z: 0 },
  knave: { x: -46, z: 120, ry: 6 },
  tarts: { x: 34, z: 260, ry: -5 },
  judge: { x: -9, z: 420, y: -6 },
  jury: { x: -92, z: 160, ry: 8 },
  herald: { x: 62, z: 220, ry: -8 },
  verdict: { x: 0, z: -80 },
  queen: { x: 9, z: 520, y: -8 },
  head: { x: 9, z: 760, y: -14 },
  grow: { x: 0, z: -420, y: 6 },
};

function buildCourt(court: HTMLElement): void {
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
    piece('tr__tarts', TARTS_SVG) +
    '<div class="tr__pack"></div>';
}

interface Card {
  el: HTMLElement;
  /** Where it stands in the crowd, in court units. */
  home: { x: number; y: number; z: number; rx: number; ry: number };
  stuck: boolean;
}

function buildPack(pack: HTMLElement, count: number): Card[] {
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

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iHerald = cue('herald');
  const iHead = cue('head');
  const iGrow = cue('grow');
  const iRise = cue('rise');
  const iAttack = cue('attack');
  const iBeat = cue('beat');
  const iLeaves = cue('leaves');
  const iWake = cue('wake');

  // --- Layers, back to front.
  const sky = shell.layer('tr__sky');
  const bank = shell.layer('tr__bank');
  bank.innerHTML = `<div class="tr__sister">${figure('alices-sister')}</div>`;
  const world = shell.layer('tr__world');
  const court = document.createElement('div');
  court.className = 'tr__court';
  buildCourt(court);
  world.append(court);
  const aliceLayer = shell.layer('tr__alice-layer');
  aliceLayer.innerHTML = `<div class="tr__alice">${figure('alice/silhouette')}</div>`;
  const alice = aliceLayer.querySelector<HTMLElement>('.tr__alice');
  const flash = shell.layer('tr__flash');
  const glass = shell.layer('tr__glass');

  const pack = court.querySelector<HTMLElement>('.tr__pack');
  const lite = window.innerWidth < 720;
  const cards = pack ? buildPack(pack, lite ? 56 : 104) : [];

  // --- The camera, cue by cue. Each shot holds until the next cue.
  const camera = { x: 0, z: 0, ry: 0, y: 0 };
  const applyCamera = (): void => {
    court.style.setProperty('--cam-x', camera.x.toFixed(2));
    court.style.setProperty('--cam-z', camera.z.toFixed(1));
    court.style.setProperty('--cam-ry', camera.ry.toFixed(2));
    court.style.setProperty('--cam-y', camera.y.toFixed(2));
  };
  applyCamera();
  for (const beat of shell.beats) {
    const shot = beat.cue ? SHOTS[beat.cue] : undefined;
    if (!shot) {
      continue;
    }
    const to = { x: shot.x, z: shot.z, ry: shot.ry ?? 0, y: shot.y ?? 0 };
    if (reducedMotion) {
      // A cut, softened by a dip to black rather than a move.
      master.to(world, { opacity: 0.2, duration: 0.05 }, beat.index);
      master.set(camera, { ...to, onUpdate: applyCamera }, beat.index + 0.05);
      master.to(world, { opacity: 1, duration: 0.2 }, beat.index + 0.05);
    } else {
      master.to(
        camera,
        { ...to, duration: 0.7, ease: 'power2.inOut', onUpdate: applyCamera },
        beat.index,
      );
    }
  }

  // --- The jury write it all down. Every sentence lands as a scribble on each
  // slate, and each juror decides for itself whether it was important; press a
  // juror and it changes its mind.
  const juryPiece = court.querySelector<HTMLElement>('.tr__jury');
  const slates = [...court.querySelectorAll<SVGGElement>('.tr__slate')];
  const juryRandom = seeded(23);
  const marks = juryRandom;
  const jurorButtons = slates.map((slate, i) => {
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
    juryPiece?.append(button);
    return button;
  });
  const write = (): void => {
    for (const [i, slate] of slates.entries()) {
      gsap.fromTo(
        slate,
        { '--written': 0 },
        { '--written': 1, duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : i * 0.04 },
      );
      const yes = marks() < 0.5;
      slate.dataset.verdict = yes ? 'yes' : 'no';
      jurorButtons[i]?.setAttribute('aria-pressed', String(yes));
    }
  };
  for (const beat of shell.beats) {
    if (beat.index >= iRise) {
      continue;
    }
    master.call(
      () => (master.time() >= beat.index + 0.05 ? write() : undefined),
      [],
      beat.index + 0.05,
    );
  }
  master.call(
    () =>
      juryPiece?.toggleAttribute(
        'data-listening',
        master.time() >= cue('jury') && master.time() < iRise,
      ),
    [],
    cue('jury'),
  );
  master.call(
    () =>
      juryPiece?.toggleAttribute(
        'data-listening',
        master.time() >= cue('jury') && master.time() < iRise,
      ),
    [],
    iRise,
  );

  // --- The herald's scroll unrolls to show the accusation.
  const heraldLines = shell.beats
    .slice(iHerald, iHerald + 3)
    .flatMap((beat) => beat.lines.filter((line) => line.dataset.speaker === 'white-rabbit'));
  for (const line of heraldLines) {
    master.fromTo(
      line,
      { '--unroll': 0 },
      { '--unroll': 1, duration: 0.3, ease: 'power1.out' },
      '<',
    );
  }

  // --- Off with her head: the court turns red and shakes.
  master.fromTo(flash, { opacity: 0 }, { opacity: 0.8, duration: 0.1 }, iHead + 0.02);
  master.call(
    () => (master.time() >= iHead + 0.02 ? shell.sound.play('thud') : undefined),
    [],
    iHead + 0.02,
  );
  master.to(flash, { opacity: 0.25, duration: 0.5 }, iHead + 0.12);
  master.to(flash, { opacity: 0, duration: 0.4 }, iGrow);
  master.call(
    () => {
      if (master.time() >= iHead + 0.02 && !reducedMotion) {
        shell.root.removeAttribute('data-shake');
        void shell.root.offsetWidth;
        shell.root.setAttribute('data-shake', '');
      }
    },
    [],
    iHead + 0.02,
  );
  const queenMouth = court.querySelector('.tr__queen-mouth');
  if (queenMouth) {
    master.to(queenMouth, { attr: { d: 'M62 84 q18 22 36 0' }, duration: 0.3 }, iHead);
  }

  // --- While the Queen shouts, every tap makes the pack leap.
  const leap = (): void => {
    if (master.time() < iHead || master.time() >= iRise) {
      return;
    }
    const some = cards.filter(() => pick() < 0.35);
    for (const card of some) {
      card.el.removeAttribute('data-leap');
      void card.el.offsetWidth;
      card.el.setAttribute('data-leap', '');
    }
  };
  shell.stage.addEventListener('pointerdown', (event) => {
    if (!(event.target as HTMLElement).closest('button')) {
      leap();
    }
  });

  // --- Alice grows to her full size, in front of everything.
  if (alice) {
    master.to(alice, { opacity: 1, duration: 0.3 }, iGrow);
    master.to(alice, { scale: 2.6, duration: 1.2, ease: 'power2.inOut' }, iGrow + 0.1);
    master.to(alice, { opacity: 0, duration: 0.3 }, iBeat + 0.6);
  }

  // --- The pack rises: every card leaves the crowd and hangs in the air, shaking.
  const random = seeded(7);
  for (const card of cards) {
    const hover = {
      x: `${card.home.x * 0.9}vw`,
      y: `${-4 - random() * 28}vh`,
      z: card.home.z + 120 + random() * 160,
      rotationY: (random() - 0.5) * 60,
      rotationX: (random() - 0.5) * 40,
      rotationZ: (random() - 0.5) * 50,
    };
    master.to(card.el, { ...hover, duration: 0.8, ease: 'power2.out' }, iRise + random() * 0.15);
  }
  // The tremble is a CSS animation on `translate`, which composes with the
  // transform GSAP owns, so the two never fight over one property.
  master.call(() => pack?.toggleAttribute('data-rising', master.time() >= iRise), [], iRise);

  // --- The attack: a burst in time, not on the scrub. About a third of the pack
  // reaches the glass and stays there; the rest streaks past.
  const stuckCount = Math.round(cards.length * 0.5);
  const stuckIndices = new Set<number>();
  const pick = seeded(11);
  while (stuckIndices.size < stuckCount) {
    stuckIndices.add(Math.floor(pick() * cards.length));
  }
  // --- On the glass: cards shy away from the pointer, and go when flicked.
  const flick = (card: Card): void => {
    if (!card.stuck) {
      return;
    }
    card.stuck = false;
    gsap.to(card.el, {
      x: `${(pick() - 0.5) * 160}vw`,
      y: '120vh',
      rotationZ: (pick() - 0.5) * 400,
      duration: reducedMotion ? 0 : 0.7,
      ease: 'power2.in',
      onComplete: () => card.el.remove(),
    });
  };
  let leavesNow = false;
  // Once she starts beating them off, a card that lands afterwards is beaten off too.
  let beatingOff = false;
  const turnToLeaf = (card: Card, index: number): void => {
    card.el.setAttribute('data-leaf', '');
    gsap.killTweensOf(card.el);
    gsap.to(card.el, {
      y: '+=140vh',
      x: `+=${(pick() - 0.5) * 30}vw`,
      rotationZ: `+=${(pick() - 0.5) * 240}`,
      duration: reducedMotion ? 0 : 3.5 + pick() * 2.5,
      delay: reducedMotion ? 0 : 0.9 + index * 0.1,
      ease: 'sine.in',
    });
  };
  const placeOnGlass = (card: Card, order: number): void => {
    const box = card.el.getBoundingClientRect();
    const stageBox = shell.stage.getBoundingClientRect();
    glass.append(card.el);
    card.stuck = true;
    shell.sound.play('paper', 0.6);
    const gx = 4 + ((order * 37) % 92) + (pick() - 0.5) * 8;
    const gy = 6 + ((order * 53) % 84) + (pick() - 0.5) * 8;
    card.el.style.setProperty('--gx', `${gx}%`);
    card.el.style.setProperty('--gy', `${gy}%`);
    gsap.set(card.el, { clearProps: 'transform' });
    const after = card.el.getBoundingClientRect();
    gsap.fromTo(
      card.el,
      {
        x: box.left - after.left + (box.width - after.width) / 2,
        y: box.top - after.top - stageBox.top + (box.height - after.height) / 2,
        scale: 0.6,
        rotationZ: (pick() - 0.5) * 120,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        rotationZ: (pick() - 0.5) * 50,
        duration: reducedMotion ? 0 : 0.18,
        ease: 'power3.out',
        onComplete: () => {
          if (beatingOff) {
            flick(card);
          } else if (leavesNow) {
            turnToLeaf(card, order);
          }
        },
      },
    );
  };
  const attack = gsap.timeline({ paused: true });
  cards.forEach((card, index) => {
    const stuck = stuckIndices.has(index);
    const at = index * 0.035 + (stuck ? 0.3 : 0);
    if (reducedMotion) {
      if (stuck) {
        attack.call(() => placeOnGlass(card, index), [], at);
      } else {
        attack.to(card.el, { opacity: 0, duration: 0.2 }, at);
      }
      return;
    }
    attack.to(
      card.el,
      {
        x: `${(pick() - 0.5) * 60}vw`,
        y: `${(pick() - 0.5) * 40}vh`,
        z: stuck ? 640 : 1180,
        rotationX: (pick() - 0.5) * 720,
        rotationY: (pick() - 0.5) * 720,
        rotationZ: (pick() - 0.5) * 360,
        duration: stuck ? 0.7 : 0.9,
        ease: 'power2.in',
        onComplete: stuck ? () => placeOnGlass(card, index) : undefined,
      },
      at,
    );
    if (!stuck) {
      attack.to(card.el, { opacity: 0, duration: 0.05 }, at + 0.88);
    }
  });
  const resetPack = (): void => {
    beatingOff = false;
    for (const card of cards) {
      if (card.el.parentElement !== pack && pack) {
        pack.append(card.el);
        card.stuck = false;
        card.el.style.removeProperty('--gx');
        card.el.style.removeProperty('--gy');
        card.el.removeAttribute('data-leaf');
      }
      gsap.set(card.el, { clearProps: 'all' });
      gsap.set(card.el, {
        x: `${card.home.x}vw`,
        y: `${card.home.y}vh`,
        z: card.home.z,
        rotationY: card.home.ry,
        rotationX: 0,
        rotationZ: 0,
        opacity: 1,
        transformPerspective: 0,
      });
    }
    // The rise is scrubbed, so the master re-applies it wherever the reader is.
    master.invalidate();
  };
  master.call(
    () => {
      if (master.time() >= iAttack + 0.05) {
        attack.play(0);
        if (!reducedMotion) {
          shell.root.removeAttribute('data-shake');
          void shell.root.offsetWidth;
          shell.root.setAttribute('data-shake', '');
        }
      } else {
        attack.pause(0);
        resetPack();
      }
    },
    [],
    iAttack + 0.05,
  );

  // Peel a stuck card off the glass: drag it and let go, and it flies where you
  // threw it; a plain tap flicks it away.
  let drag: { card: Card; x: number; y: number; vx: number; vy: number; t: number } | undefined;
  glass.addEventListener('pointerdown', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.tr__card');
    const card = cards.find((candidate) => candidate.el === target);
    if (!card?.stuck) {
      return;
    }
    drag = { card, x: event.clientX, y: event.clientY, vx: 0, vy: 0, t: performance.now() };
    card.el.setAttribute('data-dragging', '');
    gsap.killTweensOf(card.el);
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!drag) {
        return;
      }
      const now = performance.now();
      const dt = Math.max(1, now - drag.t);
      drag.vx = ((event.clientX - drag.x) / dt) * 16;
      drag.vy = ((event.clientY - drag.y) / dt) * 16;
      gsap.set(drag.card.el, {
        x: `+=${event.clientX - drag.x}`,
        y: `+=${event.clientY - drag.y}`,
      });
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.t = now;
    },
    { passive: true },
  );
  window.addEventListener('pointerup', () => {
    if (!drag) {
      return;
    }
    const { card, vx, vy } = drag;
    card.el.removeAttribute('data-dragging');
    drag = undefined;
    if (Math.hypot(vx, vy) > 6) {
      card.stuck = false;
      gsap.to(card.el, {
        x: `+=${vx * 60}`,
        y: `+=${vy * 60 + 400}`,
        rotationZ: `+=${vx * 20}`,
        duration: reducedMotion ? 0 : 0.7,
        ease: 'power2.in',
        onComplete: () => card.el.remove(),
      });
    } else {
      flick(card);
    }
  });
  const beatOff = shell.prop(shell.ui.demoBeatOff ?? '', 'tr__prop-beat');
  beatOff.addEventListener('click', () => {
    beatingOff = true;
    cards
      .filter((card) => card.stuck)
      .forEach((card, index) => {
        setTimeout(() => flick(card), index * 40);
      });
  });
  master.call(() => (master.time() >= iBeat ? beatOff.show() : beatOff.hide()), [], iBeat);
  master.call(() => (master.time() >= iLeaves ? beatOff.hide() : beatOff.show()), [], iLeaves);
  if (!reducedMotion) {
    window.addEventListener(
      'pointermove',
      (event) => {
        for (const card of cards) {
          if (!card.stuck) {
            continue;
          }
          const box = card.el.getBoundingClientRect();
          const dx = box.left + box.width / 2 - event.clientX;
          const dy = box.top + box.height / 2 - event.clientY;
          const distance = Math.hypot(dx, dy);
          if (distance < 170 && distance > 0) {
            const push = (170 - distance) / 170;
            gsap.to(card.el, {
              x: `+=${(dx / distance) * push * 26}`,
              y: `+=${(dy / distance) * push * 26}`,
              duration: 0.4,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          }
        }
      },
      { passive: true },
    );
  }

  // --- Dead leaves: what is still on the glass turns to leaves and drifts down
  // as the court gives way to the bank.
  master.to(world, { opacity: 0, duration: 0.8 }, iLeaves);
  master.to(sky, { opacity: 0, duration: 0.8 }, iLeaves);
  master.to(bank, { opacity: 1, duration: 0.8 }, iLeaves + 0.1);
  master.call(
    () => {
      leavesNow = master.time() >= iLeaves + 0.1;
      cards
        .filter((card) => card.stuck)
        .forEach((card, index) => {
          if (leavesNow) {
            turnToLeaf(card, index);
          } else {
            card.el.removeAttribute('data-leaf');
            gsap.killTweensOf(card.el);
            gsap.to(card.el, { x: 0, y: 0, rotationZ: 0, duration: reducedMotion ? 0 : 0.4 });
          }
        });
    },
    [],
    iLeaves + 0.1,
  );
  // And more leaves than there were cards: the trees let go of their own.
  const leafFall = shell.layer('tr__leaf-fall');
  leafFall.innerHTML = Array.from(
    { length: lite ? 40 : 90 },
    (_, i) =>
      `<div class="tr__leaf" style="--x: ${(pick() * 100).toFixed(1)}%; --delay: ${(pick() * 6).toFixed(2)}s; --dur: ${(5 + pick() * 5).toFixed(2)}s; --sway: ${((pick() - 0.5) * 30).toFixed(1)}vw; --hue: ${(30 + (i % 5) * 12).toFixed(0)}; --ly: ${pick().toFixed(2)}"></div>`,
  ).join('');
  master.to(leafFall, { opacity: 1, duration: 0.4 }, iLeaves + 0.3);
  master.call(
    () => leafFall.toggleAttribute('data-falling', master.time() >= iLeaves + 0.3),
    [],
    iLeaves + 0.3,
  );
  master.to(bank, { '--warm': 1, duration: 1 }, iWake);

  // --- Her sister's dream. Alice runs in to her tea; the sun goes down; and the
  // bank fills with the creatures of the dream, each a sound, until her sister
  // knows she has only to open her eyes for every one to turn into the farm.
  const iTea = cue('tea');
  const iAlive = cue('alive');
  const iSoundsOne = cue('sounds-one');
  const iSoundsTwo = cue('sounds-two');
  const iSoundsThree = cue('sounds-three');
  const iClosed = cue('closed');
  const iRealOne = cue('real-one');
  const iRealTwo = cue('real-two');
  const iRealThree = cue('real-three');
  const iAfter = cue('after');
  const iSummer = cue('summer');
  const dusk = shell.layer('tr__dusk');
  dusk.innerHTML = '<div class="tr__sun"></div>';
  const runner = shell.layer('tr__runner');
  runner.innerHTML = `<div class="tr__alice-off">${figure('alice/silhouette')}</div>`;
  const aliceOff = runner.querySelector<HTMLElement>('.tr__alice-off') ?? runner;
  master.fromTo(
    aliceOff,
    { opacity: 1, x: 0 },
    { x: '60vw', y: '-6vh', duration: 0.6, ease: 'power1.in', immediateRender: false },
    iTea + 0.05,
  );
  master.to(aliceOff, { opacity: 0, duration: 0.2 }, iTea + 0.55);
  master.to(dusk, { '--dusk': 1, duration: iClosed - iTea, ease: 'none' }, iTea + 0.2);
  master.to(dusk, { '--dusk': 1.5, duration: 1 }, iSummer);

  interface Ghost {
    el: HTMLElement;
    sound: OneShotCue;
    real: boolean;
  }
  const dream = shell.layer('tr__dream');
  const dreamThings: [string, string, string, OneShotCue][] = [
    ['rabbit', figure('white-rabbit/running'), REAL_SVG.grass ?? '', 'paper'],
    ['mouse', figure('mouse/swimming'), REAL_SVG.reeds ?? '', 'splash'],
    ['teacups', TEACUPS_SVG, REAL_SVG.sheep ?? '', 'glass'],
    ['queen', figure('queen-of-hearts'), REAL_SVG.shepherd ?? '', 'thud'],
    ['pig', PIG_BABY_SVG, REAL_SVG.hen ?? '', 'whoosh'],
    ['gryphon', figure('gryphon'), REAL_SVG.hen ?? '', 'whoosh'],
    ['turtle', figure('mock-turtle'), REAL_SVG.cow ?? '', 'thud'],
  ];
  const ghosts: Ghost[] = dreamThings.map(([kind, dreamMarkup, realMarkup, sound], index) => {
    const el = document.createElement('div');
    el.className = 'tr__ghost';
    el.dataset.kind = kind;
    el.style.setProperty('--gx', `${8 + index * 13}%`);
    el.style.setProperty('--i', String(index));
    el.innerHTML = `<div class="tr__ghost-dream">${dreamMarkup}</div><div class="tr__ghost-real">${realMarkup}</div>`;
    dream.append(el);
    return { el, sound, real: false };
  });
  const showGhosts = (at: number, kinds: string[]): void => {
    const chosen = ghosts.filter((ghost) => kinds.includes(ghost.el.dataset.kind ?? ''));
    master.call(
      () => {
        const shown = master.time() >= at;
        for (const ghost of chosen) {
          ghost.el.toggleAttribute('data-shown', shown);
        }
        if (shown && Math.abs(master.time() - at) < 0.3) {
          for (const ghost of chosen) {
            shell.sound.play(ghost.sound, 0.5);
          }
        }
      },
      [],
      at,
    );
  };
  showGhosts(iSoundsOne + 0.1, ['rabbit']);
  showGhosts(iSoundsOne + 0.5, ['mouse']);
  showGhosts(iSoundsTwo + 0.1, ['teacups']);
  showGhosts(iSoundsTwo + 0.5, ['queen']);
  showGhosts(iSoundsThree + 0.1, ['pig']);
  showGhosts(iSoundsThree + 0.4, ['gryphon']);
  showGhosts(iSoundsThree + 0.7, ['turtle']);
  master.call(
    () => dream.toggleAttribute('data-alive', master.time() >= iAlive + 0.2),
    [],
    iAlive + 0.2,
  );
  master.call(() => leafFall.toggleAttribute('data-dream', master.time() >= iAlive), [], iAlive);

  // Opening her eyes: every creature becomes what it really is. The story does it
  // one by one from "dull reality" on; the button does it all at once, and back.
  let eyesOpen = false;
  const eyesButton = shell.prop(shell.ui.demoOpenEyes ?? '', 'tr__prop-eyes');
  eyesButton.setAttribute('aria-pressed', 'false');
  const applyEyes = (): void => {
    eyesButton.setAttribute('aria-pressed', String(eyesOpen));
    dream.toggleAttribute('data-real', eyesOpen);
    dusk.toggleAttribute('data-real', eyesOpen);
    shell.sound.level('wind', eyesOpen ? 0.25 : 0);
  };
  eyesButton.addEventListener('click', () => {
    eyesOpen = !eyesOpen;
    applyEyes();
    shell.sound.play(eyesOpen ? 'chime' : 'glass', 0.5);
    shell.status(shell.ui.demoOpenEyes ?? '');
  });
  const turnReal = (at: number, kinds: string[]): void => {
    master.call(
      () => {
        const real = master.time() >= at;
        for (const ghost of ghosts) {
          if (kinds.includes(ghost.el.dataset.kind ?? '')) {
            ghost.real = real;
            ghost.el.toggleAttribute('data-real', real);
          }
        }
        if (real && Math.abs(master.time() - at) < 0.3) {
          shell.sound.play('chime', 0.3);
        }
      },
      [],
      at,
    );
  };
  turnReal(iRealOne + 0.1, ['rabbit']);
  turnReal(iRealOne + 0.5, ['mouse']);
  turnReal(iRealTwo + 0.1, ['teacups']);
  turnReal(iRealTwo + 0.5, ['queen']);
  turnReal(iRealThree + 0.1, ['pig', 'gryphon']);
  turnReal(iRealThree + 0.6, ['turtle']);
  master.call(
    () => {
      const inside = master.time() >= iAlive + 0.3 && master.time() < iAfter;
      if (inside) {
        eyesButton.show();
      } else {
        eyesButton.hide();
        eyesOpen = false;
        applyEyes();
      }
    },
    [],
    iAlive + 0.3,
  );
  master.call(
    () => {
      if (master.time() >= iAfter) {
        eyesButton.hide();
        eyesOpen = false;
        applyEyes();
      }
    },
    [],
    iAfter,
  );
  // Tapping a creature of the dream makes its sound again.
  for (const ghost of ghosts) {
    ghost.el.addEventListener('click', () => {
      shell.sound.play(ghost.real || eyesOpen ? 'chime' : ghost.sound, 0.6);
      ghost.el.removeAttribute('data-nudged');
      void ghost.el.offsetWidth;
      ghost.el.setAttribute('data-nudged', '');
    });
  }

  // The after-time: other little children gather about her, and the summer days.
  const children = shell.layer('tr__children');
  children.innerHTML = [0, 1, 2]
    .map((i) => `<div class="tr__child" style="--i: ${i}">${figure('alice/silhouette')}</div>`)
    .join('');
  master.to(dream, { opacity: 0, duration: 0.6 }, iAfter);
  master.fromTo(
    children,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: reducedMotion ? 0.01 : 0.7, immediateRender: false },
    iAfter + 0.3,
  );
  master.call(() => leafFall.toggleAttribute('data-slow', master.time() >= iSummer), [], iSummer);
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
