/**
 * The Queen's Croquet-Ground: the concept demo.
 *
 * A garden in CSS 3D: a ground of ridges and furrows the camera moves across,
 * with flat card people standing on it. The rose-tree first, its white roses
 * waiting to be painted; then the procession marches past by suit, clubs,
 * diamonds, hearts, and stops at the Queen; the gardeners lie on their faces
 * showing the back of the pack, and a card can be turned over to see which it
 * is. Then the game, where the mallet is a flamingo under the reader's arm that
 * looks back up at them, the ball a hedgehog that unrolls and walks off, and the
 * arches soldiers who get up and wander. Last, a grin in the air over the
 * ground, and the head it belongs to, argued over (the executioner swings at
 * the air under it) until it fades; and the executioner comes back with the
 * Duchess.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import {
  CARD_BACK_SVG,
  CLUB_SOLDIER_SVG,
  COURTIER_SVG,
  CUSHION_SVG,
  EXECUTIONER_SVG,
  ROYAL_CHILD_SVG,
} from './figures.ts';
import './croquet.css';

interface Piece {
  el: HTMLElement;
  x: number;
  z: number;
}

/** Where the gardeners first stand, painting, and the flower-pot that stood near:
    left of the rose-tree and behind the line the procession halts on, so it
    never stands in front of anyone in it. */
const GARDENERS = [
  [-700, 60],
  [-560, 120],
  [-400, 80],
] as const;
const POT: readonly [number, number] = [-900, -160];

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iSplash = cue('splash');
  const iWhy = cue('why');
  const iFlat = cue('flat');
  const iFootsteps = cue('footsteps');
  const iCourtiers = cue('courtiers');
  const iCrown = cue('crown');
  const iWho = cue('who');
  const iThese = cue('these');
  const iHead = cue('head');
  const iConsider = cue('consider');
  const iGardeners = cue('gardeners');
  const iPlay = cue('play');
  const iPlaces = cue('places');
  const iGround = cue('ground');
  const iArches = cue('arches');
  const iFlamingo = cue('flamingo');
  const iHedgehog = cue('hedgehog');
  const iQuarrel = cue('quarrel');
  const iFury = cue('fury');
  const iGrin = cue('grin');
  const iEyes = cue('eyes');
  const iListening = cue('listening');
  const iKing = cue('king');
  const iRemoved = cue('removed');
  const iArgument = cue('argument');
  const iFade = cue('fade');
  const end = shell.beats.length;
  const random = seeded(8);
  const lite = matchMedia('(max-width: 700px)').matches;
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);
  /** The page's own sentence in a beat, said by a speaker: for a status line. */
  const lineOf = (beat: number, speaker?: string, last = false): string => {
    const lines = (shell.beats[beat]?.lines ?? []).filter(
      (line) => speaker === undefined || line.dataset.speaker === speaker,
    );
    return ((last ? lines.at(-1) : lines[0])?.textContent ?? '').trim();
  };
  /** An element only painted, and only reachable, between two times. */
  const between = (el: Element, from: number, to: number): void => {
    const update = (): void => {
      const t = master.time();
      el.toggleAttribute('data-off', !(t >= from && (to >= end || t < to)));
    };
    el.toggleAttribute('data-off', true);
    master.call(update, [], from);
    if (to < end) {
      master.call(update, [], to);
    }
  };

  shell.layer('cq__sky');
  const world = shell.layer('cq__world');
  const ground = document.createElement('div');
  ground.className = 'cq__ground';
  world.append(ground);
  ground.innerHTML = '<div class="cq__turf"></div>';

  // --- Pieces stand flat on the ground at (x, z) and face the camera.
  const pieces: Piece[] = [];
  const piece = (className: string, markup: string, x: number, z: number, w = 12): Piece => {
    const el = document.createElement('div');
    el.className = `cq__piece ${className}`;
    el.innerHTML = markup;
    el.style.setProperty('--w', `${w}rem`);
    const item = { el, x, z };
    ground.append(el);
    pieces.push(item);
    place(item);
    return item;
  };
  function place(item: Piece): void {
    item.el.style.setProperty('--x', item.x.toFixed(1));
    item.el.style.setProperty('--z', item.z.toFixed(1));
  }

  // The rose-tree and its roses: every rose a button that paints red.
  const roseTree = piece('cq__rose-tree', figure('rose-tree'), -520, -80, 22);
  const roseSpots = [
    [24, 30],
    [46, 20],
    [68, 30],
    [18, 52],
    [40, 46],
    [62, 50],
    [80, 54],
    [30, 68],
    [52, 66],
    [72, 72],
  ];
  roseTree.el.insertAdjacentHTML(
    'beforeend',
    `<div class="cq__roses">${roseSpots
      .map(
        ([x, y]) =>
          `<button type="button" class="cq__rose" aria-label="${shell.ui.demoPaintRose ?? ''}" aria-pressed="false" style="--rx: ${x}%; --ry: ${y}%"></button>`,
      )
      .join('')}</div>`,
  );
  const roses = [...roseTree.el.querySelectorAll<HTMLButtonElement>('.cq__rose')];
  const paint = (rose: HTMLButtonElement, byReader = false): void => {
    if (rose.getAttribute('aria-pressed') === 'true') {
      return;
    }
    rose.setAttribute('aria-pressed', 'true');
    rose.style.setProperty('--drip', (0.4 + random() * 0.8).toFixed(2));
    if (byReader) {
      shell.keep('rose');
      shell.sound.play('splash', 0.3);
      shell.status(shell.ui.demoPaintRose ?? '');
    }
  };
  for (const rose of roses) {
    rose.addEventListener('click', () => paint(rose, true));
    rose.addEventListener('pointerenter', (event) => {
      if (event.buttons > 0) {
        paint(rose, true);
      }
    });
  }
  // The roses are the keyboard's while the rose-tree is the picture; after
  // that they stay buttons for a pointer, out of the tab order.
  const roseKeys = (): void => {
    const live = master.time() < iFootsteps;
    for (const rose of roses) {
      rose.tabIndex = live ? 0 : -1;
    }
  };
  roseKeys();
  master.call(roseKeys, [], iFootsteps);
  // The gardeners paint on their own, a rose a moment, unless the reader got there first.
  roses.forEach((rose, index) => {
    const at = 0.15 + index * 0.22;
    master.call(
      () => {
        if (master.time() >= at) {
          paint(rose);
        } else {
          rose.setAttribute('aria-pressed', 'false');
        }
      },
      [],
      at,
    );
  });
  // The gardeners are cards like the rest: lying on their faces they show the
  // back of the pack, the same as every other card's.
  const gardeners = GARDENERS.map(([x, z], index) => {
    const g = piece(
      'cq__gardener',
      figure(['gardener/two', 'gardener/five', 'gardener/seven'][index] ?? 'gardener/five') +
        `<div class="cq__back">${CARD_BACK_SVG}</div>`,
      x,
      z,
      8,
    );
    return g;
  });
  const pot = piece('cq__pot', '<div class="cq__pot-shape"></div>', POT[0], POT[1], 9);

  // Splashing paint: Seven jogs Five's elbow and a dab lands on the glass.
  const splashLayer = shell.layer('cq__splash');
  master.call(
    () => {
      if (Math.abs(master.time() - (iSplash + 0.2)) < 0.3) {
        const dab = document.createElement('div');
        dab.className = 'cq__dab';
        dab.style.setProperty('--dx', (30 + random() * 40).toFixed(0));
        dab.style.setProperty('--dy', (20 + random() * 40).toFixed(0));
        splashLayer.append(dab);
        shell.sound.play('splash', 0.5);
        setTimeout(() => dab.remove(), 3000);
      }
    },
    [],
    iSplash + 0.2,
  );
  // The Queen! Flat on their faces, and the painting stops.
  const painting = (): void => {
    ground.toggleAttribute('data-painting', master.time() < iFlat + 0.5);
  };
  painting();
  master.call(painting, [], iFlat + 0.5);
  master.to(
    gardeners.map((g) => g.el),
    { '--flat': 1, duration: quick(0.25), ease: 'power3.in', stagger: 0.05 },
    iFlat + 0.5,
  );

  // --- The procession, by suit: ten soldiers carrying clubs, ten courtiers
  // ornamented all over with diamonds, the royal children with hearts, the
  // guests, the Knave with the King's crown on its cushion, the King and Queen.
  const procession: Piece[] = [];
  const marchers: [string, string, number][] = [
    ...Array.from({ length: lite ? 4 : 6 }, (): [string, string, number] => [
      'cq__soldier',
      `<span class="art">${CLUB_SOLDIER_SVG}</span>`,
      8,
    ]),
    ...Array.from({ length: lite ? 3 : 5 }, (): [string, string, number] => [
      'cq__courtier',
      `<span class="art">${COURTIER_SVG}</span>`,
      8,
    ]),
    ...Array.from({ length: lite ? 3 : 5 }, (): [string, string, number] => [
      'cq__child',
      `<span class="art">${ROYAL_CHILD_SVG}</span>`,
      6,
    ]),
    ['cq__rabbit', figure('white-rabbit/herald'), 8],
    ['cq__knave', `${figure('knave-of-hearts')}<div class="cq__cushion">${CUSHION_SVG}</div>`, 8],
    ['cq__king', figure('king-of-hearts'), 10],
    ['cq__queen', figure('queen-of-hearts'), 10],
  ];
  marchers.forEach(([className, markup, w], index) => {
    const item = piece(
      `cq__marcher ${className}`,
      markup,
      1400 + index * 130,
      40 + (index % 2) * 60,
      w,
    );
    item.el.style.setProperty('--i', String(index));
    procession.push(item);
  });
  const queen = procession[procession.length - 1];
  const king = procession[procession.length - 2];
  // They come in from the right over several beats and halt with the Queen before Alice.
  const stepMarch = { t: 0 };
  const applyMarch = (): void => {
    procession.forEach((item, index) => {
      const target = 60 - (procession.length - 1 - index) * 130;
      item.x = mix(1400 + index * 130, target, stepMarch.t);
      place(item);
    });
    ground.toggleAttribute('data-marching', stepMarch.t > 0 && stepMarch.t < 1);
  };
  applyMarch();
  master.to(
    stepMarch,
    { t: 1, duration: iWho - iFootsteps + 0.4, ease: 'none', onUpdate: applyMarch },
    iFootsteps + 0.1,
  );
  master.call(() => applyMarch(), [], iWho + 0.6);
  master.call(() => applyMarch(), [], iFootsteps + 0.05);

  // --- The camera: a walk along the garden. Numbers are unitless; CSS gives units.
  const camera = { x: -520, z: 0, tilt: 12, height: 0, zoom: 1 };
  const applyCamera = (): void => {
    world.style.setProperty('--cam-x', camera.x.toFixed(1));
    world.style.setProperty('--cam-z', camera.z.toFixed(1));
    world.style.setProperty('--tilt', camera.tilt.toFixed(2));
    world.style.setProperty('--height', camera.height.toFixed(1));
    world.style.setProperty('--zoom', camera.zoom.toFixed(3));
  };
  applyCamera();
  const look = (
    at: number,
    to: Partial<typeof camera>,
    duration = 0.8,
    ease = 'power2.inOut',
  ): void => {
    master.to(camera, { ...to, duration: quick(duration), ease, onUpdate: applyCamera }, at);
  };
  look(0, { x: -500, z: -60 }, 1.2, 'none');
  look(iWhy, { x: -560, z: 80, tilt: 8 });
  look(iFlat, { x: -400, z: -100, tilt: 14 }, 0.5);
  look(iFootsteps, { x: 200, z: -200, tilt: 10 }, 1.4);
  look(iCourtiers, { x: 100 }, 1);
  look(iCrown, { x: 0, z: -100 }, 0.8);
  look(iWho, { x: 60, z: 120, tilt: 6, zoom: 1.15 }, 0.8);
  // "And who are these?": down at the three lying on their faces, the Queen beside.
  // On a narrow frame the camera keeps to the three cards and leaves the Queen out.
  look(iThese, { x: lite ? -520 : -200, z: 140, tilt: 28, zoom: 1 }, 0.7);
  look(iHead, { x: 60, z: 200, zoom: 1.3, tilt: 4 }, 0.4, 'power3.in');
  look(iConsider, { z: 100, zoom: 1.1 }, 0.5);
  // Round to the gardeners and the flower-pot that stood near.
  look(iGardeners, { x: -440, z: 40, tilt: 12, zoom: 1 }, 0.7);
  look(iPlay, { x: 0, z: -100 }, 0.8);
  look(iPlaces, { x: 700, z: -300, tilt: 18 }, 1);
  look(iGround, { x: 800, z: -400, tilt: 26 }, 0.9);
  look(iArches, { x: 900, z: -200, tilt: 14 }, 0.8);
  look(iFlamingo, { x: 800, z: 0, tilt: 10 }, 0.8);
  look(iHedgehog, { x: 1000, z: -100, tilt: 16 }, 0.8);
  look(iQuarrel, { x: 700, z: -300, tilt: 20 }, 0.8);
  look(iGrin, { x: 800, z: -150, tilt: 6 }, 1);
  look(iKing, { x: 700, z: 0, tilt: 8 }, 0.8);
  look(iFade, { x: 800, z: -250, tilt: 12 }, 1);

  // --- And who are these? Lying on their faces, the gardeners are the back of
  // the pack: a gardener, a soldier, a courtier or a child, nobody can tell.
  // *Turn a card over* (or a tap on one) turns one face up; when they get up the
  // turn comes undone, since a card standing shows its face anyway.
  const turns = gardeners.map(() => ({ t: 0 }));
  const applyTurn = (index: number): void => {
    gardeners[index]?.el.style.setProperty('--turn', (turns[index]?.t ?? 0).toFixed(3));
  };
  const turnFrom = iThese + 0.1;
  const turning = (): boolean => master.time() >= turnFrom && master.time() < iGardeners;
  const turnButton = shell.prop(shell.ui.demoTurnCard ?? '', 'cq__prop cq__prop--turn');
  let turnCount = 0;
  const turnOver = (index: number, byButton: boolean): void => {
    const state = turns[index];
    if (!turning() || !state) {
      return;
    }
    turnCount += 1;
    gsap.to(state, {
      t: state.t > 0.5 ? 0 : 1,
      duration: quick(0.6),
      ease: 'power2.inOut',
      onUpdate: () => applyTurn(index),
      overwrite: 'auto',
    });
    shell.sound.play('paper', 0.6);
    if (byButton) {
      shell.status(shell.ui.demoCardTurned ?? '');
    }
  };
  turnButton.addEventListener('click', () => turnOver(turnCount % gardeners.length, true));
  gardeners.forEach((g, index) => {
    g.el.addEventListener('click', () => turnOver(index, false));
  });
  const offerTurn = (): void => {
    const on = turning();
    ground.toggleAttribute('data-turning', on);
    if (on) {
      turnButton.show();
    } else {
      turnButton.hide();
    }
    if (master.time() < iThese) {
      // Back before the question: nobody has been turned yet.
      turnCount = 0;
      turns.forEach((state, index) => {
        gsap.killTweensOf(state);
        state.t = 0;
        applyTurn(index);
      });
    }
  };
  master.call(offerTurn, [], turnFrom);
  master.call(offerTurn, [], iGardeners);

  // --- Off with her head: the world goes red and shakes at every shout.
  const fury = shell.layer('cq__fury');
  const shout = (strength = 1): void => {
    shell.sound.play('thud', strength);
    gsap.fromTo(
      fury,
      { opacity: 0.55 * strength },
      { opacity: 0, duration: 0.6, overwrite: 'auto' },
    );
    if (!reducedMotion) {
      gsap.fromTo(
        world,
        { x: -8 * strength },
        { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.25)', clearProps: 'x', overwrite: 'auto' },
      );
    }
    queen?.el.setAttribute('data-shouting', '');
    setTimeout(() => queen?.el.removeAttribute('data-shouting'), 700);
  };
  for (const beat of shell.spokenBy('queen-of-hearts')) {
    beat.lines.forEach((line, n) => {
      if (line.dataset.speaker === 'queen-of-hearts' && /!$/.test(line.textContent ?? '')) {
        const at = beat.index + 0.08 + n * 0.1;
        master.call(() => (Math.abs(master.time() - at) < 0.25 ? shout() : undefined), [], at);
      }
    });
  }
  // While the game is on, a tap on the ground strikes, or, once they quarrel,
  // sets the Queen off. It is pointer play: the prop buttons are the keyboard's.
  const groundTap = document.createElement('button');
  groundTap.type = 'button';
  groundTap.className = 'cq__ground-tap';
  groundTap.tabIndex = -1;
  groundTap.setAttribute('aria-label', shell.ui.demoStrike ?? '');
  shell.stage.append(groundTap);

  // --- The gardeners run to Alice, and into the flower-pot.
  const hideButton = shell.prop(shell.ui.demoHideGardeners ?? '', 'cq__prop cq__prop--hide');
  let hidden = false;
  const hide = (byReader: boolean): void => {
    if (hidden) {
      return;
    }
    hidden = true;
    hideButton.hide();
    shell.sound.play('whoosh', 0.6);
    if (byReader) {
      shell.status(shell.ui.demoHideGardeners ?? '');
    }
    gardeners.forEach((g, index) => {
      gsap.to(g, {
        x: pot.x + (index - 1) * 20,
        z: pot.z - 10,
        duration: quick(0.45),
        delay: index * 0.08,
        ease: 'power2.in',
        onUpdate: () => place(g),
        overwrite: 'auto',
      });
      gsap.to(g.el, {
        '--sink': 1,
        duration: quick(0.35),
        delay: 0.3 + index * 0.08,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    });
    if (!reducedMotion) {
      gsap.fromTo(
        pot.el,
        { rotation: -6 },
        { rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', delay: 0.5 },
      );
    }
  };
  hideButton.addEventListener('click', () => hide(true));
  pot.el.addEventListener('click', () => hide(true));
  master.to(
    gardeners.map((g) => g.el),
    { '--flat': 0, duration: quick(0.2) },
    iGardeners,
  );
  master.call(
    () => {
      const inside = master.time() >= iGardeners + 0.1 && master.time() < iGardeners + 0.75;
      if (inside) {
        // They run to the front, toward the reader.
        gardeners.forEach((g, index) => {
          gsap.to(g, {
            x: -320 + index * 60,
            z: 220,
            duration: quick(0.5),
            onUpdate: () => place(g),
            overwrite: 'auto',
          });
        });
        if (!hidden) {
          hideButton.show();
        }
      } else if (master.time() < iGardeners + 0.1) {
        hideButton.hide();
        hidden = false;
        gardeners.forEach((g, index) => {
          const [x, z] = GARDENERS[index] ?? GARDENERS[1];
          gsap.set(g, { x, z });
          place(g);
          gsap.set(g.el, { '--sink': 0 });
        });
      }
    },
    [],
    iGardeners + 0.1,
  );
  master.call(
    () => (master.time() >= iGardeners + 0.75 ? hide(false) : undefined),
    [],
    iGardeners + 0.75,
  );

  // --- The croquet-ground: arches that wander, hedgehogs that walk, players that run.
  const arches = Array.from({ length: 3 }, (_, i) =>
    piece('cq__arch', figure('card-arch'), 500 + i * 260, -260 + (i % 2) * 120, 10),
  );
  const mine = piece('cq__hedgehog', figure('hedgehog'), 620, 80, 5);
  const hedgehogs = [
    mine,
    ...Array.from({ length: 2 }, (_, i) =>
      piece('cq__hedgehog', figure('hedgehog'), 820 + i * 200, 140 - i * 60, 5),
    ),
  ];
  const players = Array.from({ length: lite ? 3 : 5 }, (_, i) =>
    piece('cq__player', figure('card-soldier'), 300 + i * 220, -420 + (i % 3) * 80, 7),
  );
  master.to(
    [...arches, ...hedgehogs, ...players].map((p) => p.el),
    { opacity: 1, duration: 0.3 },
    iPlaces,
  );
  // Places! Everyone runs about, tumbling up against each other.
  master.call(
    () => {
      const running = master.time() >= iPlaces + 0.1 && master.time() < iGround + 0.5;
      ground.toggleAttribute('data-running', running);
    },
    [],
    iPlaces + 0.1,
  );
  master.call(() => ground.toggleAttribute('data-running', false), [], iGround + 0.5);

  // --- The flamingo under the arm: the mallet. It looks back up at the reader.
  // The story raises and lowers the holder; the reader's swings, its escape and
  // its catching move the bird inside it, so the two never fight over a value.
  const hands = shell.layer('cq__hands');
  hands.innerHTML = `<div class="cq__hold"><div class="cq__flamingo">${figure('flamingo')}<div class="cq__stroke"></div></div></div>`;
  const hold = hands.querySelector<HTMLElement>('.cq__hold') ?? hands;
  between(hands, iFlamingo, iGrin + 0.6);
  const flamingo = hands.querySelector<HTMLElement>('.cq__flamingo') ?? hands;
  const head = hands.querySelector<SVGGElement>('.cq__flamingo-head');
  const strokeZone = hands.querySelector<HTMLElement>('.cq__stroke');
  const flamingoState = { looking: false, puzzled: false, away: false, swinging: false };
  master.fromTo(
    hold,
    { yPercent: 110 },
    { yPercent: 0, duration: quick(0.5), ease: 'power2.out' },
    iFlamingo + 0.1,
  );
  master.to(hold, { yPercent: 110, duration: quick(0.5), ease: 'power2.in' }, iGrin);
  const strikeButton = shell.prop(shell.ui.demoStrike ?? '', 'cq__prop cq__prop--strike');
  const catchButton = shell.prop(shell.ui.demoCatchFlamingo ?? '', 'cq__prop cq__prop--catch');
  const strokeButton = shell.prop(shell.ui.demoStrokeFlamingo ?? '', 'cq__prop cq__prop--stroke');
  const stirButton = shell.prop(shell.ui.demoStirQuarrel ?? '', 'cq__prop cq__prop--stir');

  // --- The flamingo's mood, from the beat she first holds it until the game
  // breaks up: left alone it sulks, the head turning away from the ball and up
  // into her face; stroked, it comes round. A function of time, not of scroll,
  // so it only colours the in-between; the story's own looks and the escape
  // happen at their beats regardless.
  const SULK = 0.2;
  const mood = { v: 1, live: false, sulking: false, said: false, nodding: false };
  const moodStep = (v: number): string => (v > 0.6 ? 'content' : v > SULK ? 'wary' : 'sulking');
  const applyMood = (): void => {
    flamingo.style.setProperty('--mood', mood.v.toFixed(3));
    flamingo.setAttribute('data-mood', moodStep(mood.v));
    const sulking = mood.v <= SULK;
    if (sulking !== mood.sulking) {
      mood.sulking = sulking;
      mood.said = false;
    }
  };
  const nod = (): void => {
    shell.sound.play('chime', 0.4);
    if (reducedMotion || mood.nodding) {
      return;
    }
    mood.nodding = true;
    const bob = { n: 0 };
    gsap.to(bob, {
      n: 1,
      duration: 0.14,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut',
      onUpdate: () => flamingo.style.setProperty('--nod', bob.n.toFixed(2)),
      onComplete: () => (mood.nodding = false),
    });
  };
  const stroke = (amount: number, byButton = false): void => {
    if (!mood.live || flamingoState.away || shell.paused) {
      return;
    }
    const wasSulking = mood.sulking;
    mood.v = Math.min(1, mood.v + amount);
    applyMood();
    if (byButton) {
      shell.status(shell.ui.demoStrokeFlamingo ?? '');
      nod();
    } else if (wasSulking && !mood.sulking) {
      nod();
    }
  };
  strokeButton.addEventListener('click', () => stroke(0.35, true));
  // A pointer drawn along the neck and head strokes it: the path's length counts.
  let last: [number, number] | null = null;
  strokeZone?.addEventListener('pointermove', (event) => {
    if (last) {
      const dist = Math.hypot(event.clientX - last[0], event.clientY - last[1]);
      stroke(Math.min(dist, 40) / 500);
    }
    last = [event.clientX, event.clientY];
  });
  strokeZone?.addEventListener('pointerleave', () => (last = null));
  shell.onFrame((dt) => {
    if (!mood.live || flamingoState.away || mood.v <= 0) {
      return;
    }
    mood.v = Math.max(0, mood.v - dt / 15);
    applyMood();
  });
  const syncMood = (): void => {
    const live = master.time() >= iFlamingo + 0.1 && master.time() < iGrin;
    if (live !== mood.live) {
      mood.live = live;
      mood.v = 1;
      applyMood();
      flamingo.toggleAttribute('data-mood-live', live);
      if (live && !flamingoState.away) {
        strokeButton.show();
      } else {
        strokeButton.hide();
      }
    }
  };
  master.call(syncMood, [], iFlamingo + 0.1);
  master.call(syncMood, [], iGrin);
  applyMood();
  // The story's own look, for its sentence: "It looked up in her face with such
  // a puzzled expression that she burst out laughing." Held from the head of the
  // beat until she gets its head down.
  const puzzledFrom = iHedgehog + 0.05;
  // Under reduced motion the beat's settled picture is the look itself.
  const puzzledTo = iHedgehog + (reducedMotion ? 0.95 : 0.48);
  const puzzle = (): void => {
    const t = master.time();
    flamingoState.puzzled = t >= puzzledFrom && t < puzzledTo;
    flamingo.toggleAttribute('data-puzzled', flamingoState.puzzled);
    if (flamingoState.puzzled && Math.abs(t - puzzledFrom) < 0.2) {
      shell.sound.play('chime', 0.4);
    }
  };
  master.call(puzzle, [], puzzledFrom);
  master.call(puzzle, [], puzzledTo);
  shell.onFrame((_dt, elapsed) => {
    // Every few seconds it twists round and looks up in her face; then down again.
    const phase = elapsed % 3.4;
    const looking = phase > 2.2 && !flamingoState.away && !reducedMotion;
    if (looking !== flamingoState.looking) {
      flamingoState.looking = looking;
      flamingo.toggleAttribute('data-looking', looking);
    }
    // The pupils follow the pointer a little while it looks at you.
    if (head && (looking || flamingoState.puzzled)) {
      head.style.setProperty('--look-x', (shell.pointer.x * 4).toFixed(2));
    }
  });
  const strike = (): void => {
    if (flamingoState.swinging || flamingoState.away) {
      return;
    }
    flamingoState.swinging = true;
    const swing = gsap.timeline({ onComplete: () => (flamingoState.swinging = false) });
    if (mood.sulking) {
      // Sulking, its neck twisted up at her: the mallet swings wide and misses.
      swing.to(flamingo, { rotation: -70, duration: quick(0.2), ease: 'power3.in' });
      swing.to(flamingo, { rotation: 12, duration: quick(0.3), ease: 'power2.out' });
      swing.to(flamingo, { rotation: 0, duration: quick(0.35), ease: 'power2.inOut' });
      shell.sound.play('paper', 0.5);
      if (!mood.said) {
        mood.said = true;
        shell.status(shell.ui.demoFlamingoSulks ?? '');
      }
      return;
    }
    if (flamingoState.looking || flamingoState.puzzled) {
      // It is looking up at you: no blow, only a wobble and a laugh.
      swing.to(flamingo, { rotation: -6, duration: 0.12, yoyo: true, repeat: 3 });
      shell.sound.play('paper', 0.5);
      shell.status(lineOf(iHedgehog));
      return;
    }
    swing.to(flamingo, { rotation: -40, duration: quick(0.18), ease: 'power3.in' });
    swing.to(flamingo, { rotation: 0, duration: quick(0.4), ease: 'power2.out' });
    shell.sound.play('thud', 0.8);
    shell.status(shell.ui.demoStruck ?? '');
    // The hedgehog rolls off toward the nearest arch, and the arch walks away.
    mine.el.removeAttribute('data-walking');
    const arch = arches[Math.floor(random() * arches.length)];
    if (!arch) {
      return;
    }
    gsap.to(mine, {
      x: arch.x + (random() - 0.5) * 80,
      z: arch.z + 40,
      duration: quick(0.9),
      ease: 'power2.out',
      onUpdate: () => place(mine),
      overwrite: 'auto',
      onComplete: () => {
        setTimeout(() => mine.el.setAttribute('data-walking', ''), 1200);
      },
    });
    gsap.to(arch, {
      x: arch.x + (random() > 0.5 ? 260 : -260),
      z: arch.z - 80,
      duration: quick(1.6),
      delay: 0.5,
      ease: 'sine.inOut',
      onUpdate: () => place(arch),
      overwrite: 'auto',
    });
  };
  strikeButton.addEventListener('click', strike);
  // Stirring up the quarrel: the Queen goes off again, in her own words.
  const stir = (byButton: boolean): void => {
    shout(0.8);
    if (byButton) {
      shell.status(lineOf(iFury, 'queen-of-hearts'));
    }
  };
  stirButton.addEventListener('click', () => stir(true));
  groundTap.addEventListener('click', (event) => {
    // A tap on the walking hedgehog itself rolls it up again, under the tap
    // target: looked up once, at the tap.
    const hedgehog = document
      .elementsFromPoint(event.clientX, event.clientY)
      .find((el) => el.closest('.cq__hedgehog[data-walking]'))
      ?.closest<HTMLElement>('.cq__hedgehog');
    if (hedgehog) {
      hedgehog.removeAttribute('data-walking');
      return;
    }
    if (groundTap.dataset.mode === 'strike') {
      strike();
    } else if (groundTap.dataset.mode === 'shout') {
      stir(false);
    }
  });
  // The hedgehog unrolls and crawls away when left alone; a tap rolls it up again.
  mine.el.addEventListener('click', () => mine.el.removeAttribute('data-walking'));
  let wander = 0;
  shell.onFrame((dt) => {
    if (!mine.el.hasAttribute('data-walking')) {
      return;
    }
    wander += dt;
    mine.x += Math.cos(wander * 0.7) * 30 * dt;
    mine.z -= 12 * dt;
    place(mine);
  });
  // The story's hedgehog unrolls and crawls away while she gets the head down.
  master.call(
    () => {
      const t = master.time();
      if ((t >= iFlamingo + 0.6 && t < iHedgehog) || (t >= iHedgehog + 0.5 && t < iQuarrel)) {
        mine.el.setAttribute('data-walking', '');
      }
    },
    [],
    iFlamingo + 0.6,
  );
  master.call(
    () => (master.time() >= iHedgehog + 0.5 ? mine.el.setAttribute('data-walking', '') : undefined),
    [],
    iHedgehog + 0.5,
  );
  // The flamingo goes off across the garden while they quarrel; catch it and
  // bring it back, or the story does at the end of the beat.
  const flyFrom = iQuarrel + 0.15;
  const flyTo = iQuarrel + 0.85;
  const flyOff = (): void => {
    if (flamingoState.away) {
      return;
    }
    flamingoState.away = true;
    flamingo.removeAttribute('data-looking');
    strokeButton.hide();
    // It comes back from its run content again.
    mood.v = 1;
    applyMood();
    catchButton.show();
    gsap.to(flamingo, {
      yPercent: -230,
      xPercent: 130,
      rotation: 30,
      duration: quick(0.9),
      ease: 'power2.in',
      overwrite: 'auto',
    });
    shell.sound.play('whoosh', 0.6);
  };
  const catchIt = (byReader: boolean): void => {
    if (!flamingoState.away) {
      return;
    }
    flamingoState.away = false;
    catchButton.hide();
    if (mood.live) {
      strokeButton.show();
    }
    if (byReader) {
      shell.status(shell.ui.demoCatchFlamingo ?? '');
    }
    gsap.to(flamingo, {
      yPercent: 0,
      xPercent: 0,
      rotation: 0,
      duration: quick(0.7),
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };
  catchButton.addEventListener('click', () => catchIt(true));
  master.call(
    () => {
      const t = master.time();
      if (t >= flyFrom && t < flyTo) {
        flyOff();
      } else {
        catchIt(false);
      }
    },
    [],
    flyFrom,
  );
  master.call(() => (master.time() >= flyTo ? catchIt(false) : undefined), [], flyTo);
  // Which game the ground tap and the props are playing: a strike while she has
  // the flamingo in hand, a quarrel stirred up once they all play at once.
  const strikeFrom = iFlamingo + 0.3;
  const games = (): void => {
    const t = master.time();
    const quarrel = t >= iQuarrel && t < iGrin;
    const striking = t >= strikeFrom && t < flyFrom;
    ground.toggleAttribute('data-quarrel', quarrel);
    groundTap.dataset.mode = quarrel ? 'shout' : striking ? 'strike' : '';
    groundTap.setAttribute(
      'aria-label',
      quarrel ? (shell.ui.demoStirQuarrel ?? '') : (shell.ui.demoStrike ?? ''),
    );
    if (striking) {
      strikeButton.show();
    } else {
      strikeButton.hide();
    }
    if (quarrel) {
      stirButton.show();
    } else {
      stirButton.hide();
    }
  };
  games();
  for (const at of [strikeFrom, iQuarrel, flyFrom, iGrin]) {
    master.call(games, [], at);
  }

  // --- A head in the air: the grin first, then the eyes, then the whole head.
  const air = shell.layer('cq__air');
  air.innerHTML =
    `<button type="button" class="cq__cat" aria-label="${shell.ui.demoCallCat ?? ''}">${figure('cheshire-cat/head')}</button>` +
    `<div class="cq__executioner"><div class="cq__exec-body">${EXECUTIONER_SVG}</div></div>` +
    `<div class="cq__duchess">${figure('duchess')}</div>`;
  const cat = air.querySelector<HTMLButtonElement>('.cq__cat') ?? air;
  const catParts = {
    grin: cat.querySelector<SVGGElement>('.cq__cat-grin'),
    eyes: cat.querySelector<SVGGElement>('.cq__cat-eyes'),
    face: cat.querySelector<SVGGElement>('.cq__cat-face'),
    ears: cat.querySelector<SVGGElement>('.cq__cat-ears'),
    pupils: cat.querySelector<SVGGElement>('.cq__cat-pupils'),
  };
  // Not painted, and not a button anyone can reach, until the grin is there.
  between(air, iGrin + 0.2, end);
  master.fromTo(air, { opacity: 0 }, { opacity: 1, duration: 0.2 }, iGrin + 0.2);
  master.fromTo(catParts.grin, { opacity: 0 }, { opacity: 1, duration: 0.4 }, iGrin + 0.3);
  // The eyes come with their pupils: nothing floats in the air before "the eyes appeared".
  master.fromTo(
    [catParts.eyes, catParts.pupils],
    { opacity: 0 },
    { opacity: 1, duration: 0.3 },
    iEyes + 0.1,
  );
  master.fromTo(catParts.face, { opacity: 0 }, { opacity: 1, duration: 0.4 }, iEyes + 0.55);
  master.fromTo(catParts.ears, { opacity: 0 }, { opacity: 1, duration: 0.3 }, iEyes + 0.8);
  // The Queen comes up behind, listening; the King comes to look; then it goes.
  master.call(
    () => {
      if (queen && king) {
        const near = master.time() >= iListening + 0.1;
        gsap.to(queen, {
          x: near ? 760 : 60,
          z: near ? 160 : 40,
          duration: quick(0.8),
          onUpdate: () => place(queen),
          overwrite: 'auto',
        });
      }
    },
    [],
    iListening + 0.1,
  );
  master.call(
    () => {
      if (king) {
        const near = master.time() >= iKing + 0.1;
        gsap.to(king, {
          x: near ? 620 : -70,
          z: near ? 220 : 100,
          duration: quick(0.8),
          onUpdate: () => place(king),
          overwrite: 'auto',
        });
      }
    },
    [],
    iKing + 0.1,
  );
  master.to(cat, { '--wobble': 1, duration: 0.3, yoyo: true, repeat: 1 }, iRemoved + 0.2);

  // --- The executioner: fetched at "Off with his head!", he argues that you
  // cannot cut off a head without a body, and swings at the empty air under it,
  // the head bobbing up just out of reach. He goes for the Duchess, the head
  // fades the moment he is gone, and he comes back with her.
  const executioner = air.querySelector<HTMLElement>('.cq__executioner') ?? air;
  const duchess = air.querySelector<HTMLElement>('.cq__duchess') ?? air;
  between(executioner, iRemoved + 0.45, end);
  master.fromTo(
    executioner,
    { '--in': 0 },
    { '--in': 1, duration: quick(0.4), ease: 'power1.out', immediateRender: false },
    iRemoved + 0.45,
  );
  const swings: [number, number, number][] = [
    // [at, to, duration]: across under the head and back, then up under it, held.
    [iArgument + 0.12, 1, 0.12],
    [iArgument + 0.32, 0, 0.12],
    [iArgument + 0.55, 0.5, 0.07],
    [iArgument + 0.86, 0, 0.1],
  ];
  for (const [at, to, duration] of swings) {
    master.to(executioner, { '--swing': to, duration: quick(duration), ease: 'power2.in' }, at);
    master.call(
      () => (Math.abs(master.time() - at) < 0.15 ? shell.sound.play('whoosh', 0.5) : undefined),
      [],
      at,
    );
  }
  const bobs: [number, number][] = [
    [iArgument + 0.15, 1],
    [iArgument + 0.26, 0],
    [iArgument + 0.35, 1],
    [iArgument + 0.46, 0],
    [iArgument + 0.56, 1],
    [iArgument + 0.9, 0],
  ];
  for (const [at, to] of bobs) {
    master.to(cat, { '--bob': to, duration: quick(0.06), ease: 'power2.out' }, at);
  }
  // Off for the Duchess, and back with her, then running up and down.
  master.to(executioner, { '--in': 0, duration: quick(0.25), ease: 'power1.in' }, iFade + 0.05);
  master.to(executioner, { '--in': 1, duration: quick(0.25), ease: 'power1.out' }, iFade + 0.4);
  between(duchess, iFade + 0.4, end);
  master.fromTo(
    duchess,
    { '--in': 0 },
    { '--in': 1, duration: quick(0.3), ease: 'power1.out', immediateRender: false },
    iFade + 0.4,
  );
  master.call(
    () => executioner.toggleAttribute('data-running', master.time() >= iFade + 0.66),
    [],
    iFade + 0.66,
  );
  // Fading away: ears first, then the face, then the eyes, and the grin last of all.
  master.to(catParts.ears, { opacity: 0, duration: 0.2 }, iFade + 0.1);
  master.to(catParts.face, { opacity: 0, duration: 0.3 }, iFade + 0.25);
  master.to([catParts.eyes, catParts.pupils], { opacity: 0, duration: 0.25 }, iFade + 0.45);
  master.to(catParts.grin, { opacity: 0, duration: 0.3 }, iFade + 0.7);
  // Tap the head and it winks out and back a moment later.
  let winking = false;
  cat.addEventListener('click', () => {
    if (winking || master.time() < iGrin + 0.4) {
      return;
    }
    winking = true;
    shell.sound.play('chime', 0.5);
    shell.status(shell.ui.demoCallCat ?? '');
    gsap.to(cat, {
      '--blink': 1,
      duration: quick(0.25),
      yoyo: true,
      repeat: 1,
      repeatDelay: 0.6,
      onComplete: () => (winking = false),
    });
  });
  const pupils = { x: 0, y: 0 };
  shell.onFrame((dt) => {
    const k = 1 - Math.exp(-dt * 6);
    const px = shell.pointer.active ? shell.pointer.x * 10 : 0;
    const py = shell.pointer.active ? shell.pointer.y * 6 : 0;
    const nx = mix(pupils.x, px, k);
    const ny = mix(pupils.y, py, k);
    if (Math.abs(nx - pupils.x) < 0.01 && Math.abs(ny - pupils.y) < 0.01) {
      return;
    }
    pupils.x = nx;
    pupils.y = ny;
    catParts.pupils?.style.setProperty('--px', nx.toFixed(2));
    catParts.pupils?.style.setProperty('--py', ny.toFixed(2));
  });

  // --- Out of the hall: the garden is first seen through the little door she
  // came in by (the one in Drink Me's hall, that the tea-party ended looking
  // toward), and the camera goes through the doorway as the roses come up.
  const doorway = shell.layer('cq__doorway');
  doorway.innerHTML = '<div class="cq__door-frame"><div class="cq__door-leaf"></div></div>';
  const frame = doorway.querySelector<HTMLElement>('.cq__door-frame');
  if (reducedMotion) {
    master.to(doorway, { opacity: 0, duration: 0.3 }, 0.25);
  } else {
    master.to(frame, { '--through': 1, duration: 0.7, ease: 'power2.in' }, 0.05);
    master.to(doorway, { opacity: 0, duration: 0.25 }, 0.5);
  }
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
