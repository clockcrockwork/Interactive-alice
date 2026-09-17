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
import { TARTS_SVG } from './figures.ts';
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
      const row = Math.floor(index / 2) % 5;
      const column = Math.floor(index / 10);
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
  const cards = pack ? buildPack(pack, lite ? 32 : 52) : [];

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
  const stuckCount = Math.round(cards.length * 0.36);
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
    const gx = 8 + ((order * 37) % 84) + (pick() - 0.5) * 6;
    const gy = 10 + ((order * 53) % 76) + (pick() - 0.5) * 6;
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

  glass.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.tr__card');
    const card = cards.find((candidate) => candidate.el === target);
    if (card) {
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
  master.to(bank, { '--warm': 1, duration: 1 }, iWake);
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
