/**
 * The trial: the concept demo. "Sentence first": the end of the trial.
 *
 * The court is the paper theatre of court.ts, shared with the witnesses, and this
 * demo opens on the frame the witnesses end on: Alice at her full size in front,
 * the camera high over the court. The camera pushes into the Queen as her temper
 * rises, and pulls back as Alice stands taller still. Then the pack rises, comes
 * for the reader, and some of the cards hit the glass and stay there, until they
 * turn to dead leaves and the riverbank is behind them.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, seeded } from '../shell/shell.ts';
import type { OneShotCue } from '../shell/sound.ts';
import {
  buildCourt,
  buildPack,
  type CameraShot,
  type Card,
  HIGH_SHOT,
  mountAlice,
  mountCamera,
  mountHeight,
  mountJury,
  packSize,
} from './court.ts';
import { keepsakeSvg, PIG_BABY_SVG, REAL_SVG, TEACUPS_SVG } from './figures.ts';
import './trial.css';

/**
 * Where the camera looks for each cue; each shot holds until the next. It opens
 * already high, where the witnesses left it, looks down into the Queen as she
 * shouts, and rises higher still as Alice grows.
 */
const SHOTS: Record<string, CameraShot> = {
  queen: { x: 30, z: 200, y: -12, rx: -16 },
  head: { x: 30, z: 440, y: -16, rx: -10 },
  grow: { x: 0, z: -1150, y: -44, rx: -26 },
};

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iQueen = cue('queen');
  const iHead = cue('head');
  const iGrow = cue('grow');
  const iRise = cue('rise');
  const iAttack = cue('attack');
  const iBeat = cue('beat');
  const iLeaves = cue('leaves');
  const iWake = cue('wake');
  const iTea = cue('tea');

  // On the bank the captions go up into the sky, so the sister, the dream's
  // creatures, the children and the keepsakes have the grass to themselves.
  for (const beat of shell.beats) {
    beat.el.toggleAttribute('data-sky', beat.index >= iLeaves);
  }

  // --- Layers, back to front.
  const sky = shell.layer('tr__sky');
  const bank = shell.layer('tr__bank');
  bank.innerHTML = `<div class="tr__sister">${figure('alices-sister')}</div>`;
  const world = shell.layer('tr__world');
  const court = document.createElement('div');
  court.className = 'tr__court';
  buildCourt(court);
  // Her head: the court hangs inside a wrapper that leans when she dodges.
  const head = document.createElement('div');
  head.className = 'tr__head';
  head.append(court);
  world.append(head);
  const height = mountHeight(shell);
  const alice = mountAlice(shell);
  const flash = shell.layer('tr__flash');
  const glass = shell.layer('tr__glass');

  const pack = court.querySelector<HTMLElement>('.tr__pack');
  const lite = window.innerWidth < 720;
  const cards = pack ? buildPack(pack, packSize()) : [];

  // --- The camera, cue by cue. It starts where the witnesses ended: high over
  // the court, Alice already grown; the first beat holds that frame.
  court.setAttribute('data-high', '');
  const camera = mountCamera(shell, world, court, HIGH_SHOT);
  for (const beat of shell.beats) {
    const shot = beat.cue ? SHOTS[beat.cue] : undefined;
    if (shot) {
      camera.to(shot, beat.index);
    }
  }

  // --- The jury write it all down, every sentence a scribble on each slate,
  // until the pack rises. The jurors took the pointer in the witnesses' demo.
  mountJury(shell, court, { until: iRise, buttons: false });

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

  // --- Alice is already at her full size, in front of everything, the clouds
  // below her shoulders (the frame the witnesses ended on). The push into the
  // Queen goes down past her shoulder and through the clouds: she slides out
  // of the frame's right, so nothing stands between the reader and the Queen;
  // at "who cares for you" the camera pulls back up and she is there again,
  // drawn up taller still. Under reduced motion each of these is a cut.
  const cut = (seconds: number): number => (reducedMotion ? 0.01 : seconds);
  if (alice) {
    gsap.set(alice, { opacity: 1, scale: 2.6, x: '0%' });
    master.fromTo(
      alice,
      { x: '0%', scale: 2.6 },
      { x: '40%', scale: 3, duration: cut(0.7), ease: 'power2.inOut', immediateRender: false },
      iQueen,
    );
    master.fromTo(
      alice,
      { x: '40%', scale: 3 },
      { x: '80%', scale: 3.4, duration: cut(0.7), ease: 'power2.inOut', immediateRender: false },
      iHead,
    );
    master.fromTo(
      alice,
      { x: '80%', scale: 3.4 },
      { x: '0%', scale: 2.9, duration: cut(0.8), ease: 'power2.inOut', immediateRender: false },
      iGrow + 0.1,
    );
    master.to(alice, { opacity: 0, duration: 0.3 }, iBeat + 0.6);
  }
  gsap.set(height, { opacity: 1 });
  // The clouds drift while they are up: from the first frame until the push
  // has gone through them, and again from "who cares for you" until the bank.
  const heightShown = (): void => {
    const t = master.time();
    height.toggleAttribute('data-shown', t < iQueen + 0.5 || (t >= iGrow && t < iLeaves + 0.8));
  };
  heightShown();
  master.fromTo(
    height,
    { opacity: 1 },
    { opacity: 0, duration: cut(0.5), immediateRender: false },
    iQueen,
  );
  master.fromTo(
    height,
    { opacity: 0 },
    { opacity: 1, duration: cut(0.7), immediateRender: false },
    iGrow + 0.1,
  );

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

  // --- Dodging. Her head leans with the pointer (the phone's tilt), or for a
  // second after a Dodge button. Every flying card has a lane, left or right;
  // a card whose lane she has leant away from by the time it arrives whips past
  // instead of hitting, and the misses are counted in `--dodged` on the court.
  // Under reduced motion the lean is a cut and a dodged card simply fades out.
  const dodge = { lean: 0, held: 0, until: 0, count: 0, told: false };
  const flying = (): boolean => master.time() >= iAttack + 0.05 && master.time() < iLeaves;
  court.style.setProperty('--dodged', '0');
  shell.onFrame((dt) => {
    let target = 0;
    if (flying()) {
      if (performance.now() < dodge.until) {
        target = dodge.held;
      } else if (shell.pointer.active) {
        const raw = Math.max(-1, Math.min(1, shell.pointer.x * 1.25));
        target = reducedMotion ? (Math.abs(raw) > 0.45 ? Math.sign(raw) : 0) : raw;
      }
    }
    let next = reducedMotion ? target : dodge.lean + (target - dodge.lean) * Math.min(1, dt * 9);
    if (Math.abs(target - next) < 0.005) {
      next = target;
    }
    if (next !== dodge.lean) {
      dodge.lean = next;
      // One transform on one element per frame; the court beneath is composited.
      gsap.set(head, { xPercent: next * -7, rotation: next * -5 });
    }
  });
  const dodged = (lane: number): boolean => dodge.lean * lane < -0.45;
  const miss = (card: Card, lane: number): void => {
    dodge.count += 1;
    court.style.setProperty('--dodged', String(dodge.count));
    if (!dodge.told) {
      dodge.told = true;
      shell.status(shell.ui.demoDodged ?? '');
    }
    shell.sound.play('whoosh', 0.5);
    if (reducedMotion) {
      gsap.to(card.el, { opacity: 0, duration: 0.2 });
      return;
    }
    gsap.to(card.el, {
      x: `${lane * 70}vw`,
      z: 1150,
      rotationZ: `+=${lane * 120}`,
      duration: 0.3,
      ease: 'power1.in',
    });
    gsap.to(card.el, { opacity: 0, duration: 0.08, delay: 0.24 });
  };
  const hold = (direction: -1 | 1): void => {
    dodge.held = direction;
    dodge.until = performance.now() + 1000;
  };
  const dodgeLeft = shell.prop(shell.ui.demoDodgeLeft ?? '', 'tr__prop-dodge tr__prop-dodge--left');
  const dodgeRight = shell.prop(
    shell.ui.demoDodgeRight ?? '',
    'tr__prop-dodge tr__prop-dodge--right',
  );
  dodgeLeft.addEventListener('click', () => hold(-1));
  dodgeRight.addEventListener('click', () => hold(1));
  const showDodge = (): void => {
    const on = master.time() >= iAttack && master.time() < iLeaves;
    for (const button of [dodgeLeft, dodgeRight]) {
      if (on) {
        button.show();
      } else {
        button.hide();
      }
    }
  };
  master.call(showDodge, [], iAttack);
  master.call(showDodge, [], iLeaves);
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
  let phase: 'crowd' | 'flight' | 'gone' = 'crowd';
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
      // A shower, not a queue: the last leaf is down a few seconds after the first.
      delay: reducedMotion ? 0 : 0.6 + Math.min(index, 18) * 0.07 + pick() * 0.4,
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
  // Built afresh for every flight: the glass, the leaves and a flick each kill a
  // card's own tweens, and a timeline kept from the last flight would have lost
  // them, so a reader back in the flight would see half a pack.
  const buildAttack = (): gsap.core.Timeline => {
    const attack = gsap.timeline({ paused: true });
    cards.forEach((card, index) => {
      const stuck = stuckIndices.has(index);
      const at = index * 0.035 + (stuck ? 0.3 : 0);
      const x = (pick() - 0.5) * 60;
      const lane = x < 0 ? -1 : 1;
      const arrive = (): void => {
        if (phase === 'gone') {
          return;
        }
        if (dodged(lane)) {
          miss(card, lane);
        } else {
          placeOnGlass(card, index);
        }
      };
      if (reducedMotion) {
        if (stuck) {
          attack.call(arrive, [], at);
        } else {
          attack.to(card.el, { opacity: 0, duration: 0.2 }, at);
        }
        return;
      }
      attack.to(
        card.el,
        {
          x: `${x}vw`,
          y: `${(pick() - 0.5) * 40}vh`,
          z: stuck ? 640 : 1180,
          rotationX: (pick() - 0.5) * 720,
          rotationY: (pick() - 0.5) * 720,
          rotationZ: (pick() - 0.5) * 360,
          duration: stuck ? 0.7 : 0.9,
          ease: 'power2.in',
          onComplete: stuck ? arrive : undefined,
        },
        at,
      );
      if (!stuck) {
        attack.to(card.el, { opacity: 0, duration: 0.05 }, at + 0.88);
      }
    });
    return attack;
  };
  let attack = buildAttack();
  const resetPack = (): void => {
    beatingOff = false;
    dodge.count = 0;
    dodge.told = false;
    dodge.until = 0;
    court.style.setProperty('--dodged', '0');
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
    // The rise is scrubbed: its tweens take the cards from home again, wherever
    // the reader is, and nothing else on the master is touched.
    for (const rise of master.getTweensOf(cards.map((card) => card.el))) {
      rise.invalidate();
    }
  };
  // The burst is a moment to arrive at, not a place to pass through: a reader who
  // jumps past it (End, the scrollbar) finds the pack already gone, rather than
  // the cards and their leaves replaying over the bank and the dream.
  const fly = (): void => {
    phase = 'flight';
    attack.kill();
    attack = buildAttack();
    attack.play(0);
    if (!reducedMotion) {
      shell.root.removeAttribute('data-shake');
      void shell.root.offsetWidth;
      shell.root.setAttribute('data-shake', '');
    }
  };
  const settleGone = (): void => {
    phase = 'gone';
    attack.pause();
    for (const card of cards) {
      gsap.killTweensOf(card.el);
      card.stuck = false;
      gsap.to(card.el, {
        opacity: 0,
        duration: reducedMotion ? 0 : 0.25,
        onComplete: () => {
          // Back in the crowd, unseen: nothing on the glass takes the pointer.
          if (pack && card.el.parentElement !== pack) {
            pack.append(card.el);
            card.el.removeAttribute('data-leaf');
          }
        },
      });
    }
  };
  master.call(
    () => {
      const t = master.time();
      if (t < iAttack + 0.05) {
        phase = 'crowd';
        attack.pause(0);
        resetPack();
      } else if (t < iLeaves) {
        fly();
      } else {
        settleGone();
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
  // Under reduced motion the cross-fade is over by the time the beat settles.
  const fade = reducedMotion ? 0.4 : 0.8;
  master.to([world, sky, height], { opacity: 0, duration: fade }, iLeaves);
  master.to(bank, { opacity: 1, duration: fade }, iLeaves + 0.1);
  master.call(
    () => {
      const t = master.time();
      leavesNow = t >= iLeaves + 0.1;
      if (t >= iTea) {
        settleGone();
        return;
      }
      if (!leavesNow && phase === 'gone') {
        // Back from the bank into the flight: the pack comes at her again.
        resetPack();
        fly();
        return;
      }
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
  // By her tea the leaves that were cards have fallen: whatever is still on the
  // glass goes, so the dream and the summer are never under them.
  master.call(() => (master.time() >= iTea ? settleGone() : undefined), [], iTea);
  for (const at of [iQueen + 0.5, iGrow, iLeaves + 0.8]) {
    master.call(heightShown, [], at);
  }
  // And more leaves than there were cards: the trees let go of their own.
  const leafFall = shell.layer('tr__leaf-fall');
  leafFall.innerHTML = Array.from(
    { length: lite ? 40 : 90 },
    (_, i) =>
      `<div class="tr__leaf" style="--x: ${(pick() * 100).toFixed(1)}%; --delay: ${(pick() * 6).toFixed(2)}s; --dur: ${(5 + pick() * 5).toFixed(2)}s; --sway: ${((pick() - 0.5) * 30).toFixed(1)}vw; --turn: ${((i % 5) / 4).toFixed(2)}; --ly: ${pick().toFixed(2)}"></div>`,
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
  runner.innerHTML = `<div class="tr__alice-off">${figure('alice/falling')}</div>`;
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
  // Its label says what a press will do, so it carries no pressed state.
  let eyesOpen = false;
  const eyesButton = shell.prop(shell.ui.demoOpenEyes ?? '', 'tr__prop-eyes');
  const applyEyes = (): void => {
    eyesButton.textContent = (eyesOpen ? shell.ui.demoCloseEyes : shell.ui.demoOpenEyes) ?? '';
    eyesButton.toggleAttribute('data-open', eyesOpen);
    dream.toggleAttribute('data-real', eyesOpen);
    dusk.toggleAttribute('data-real', eyesOpen);
    shell.sound.level('wind', eyesOpen ? 0.25 : 0);
  };
  eyesButton.addEventListener('click', () => {
    eyesOpen = !eyesOpen;
    applyEyes();
    shell.sound.play(eyesOpen ? 'chime' : 'glass', 0.5);
    // What the reader just did: opened her eyes, or closed them again.
    shell.status((eyesOpen ? shell.ui.demoOpenEyes : shell.ui.demoCloseEyes) ?? '');
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

  // The court's crowd, until the pack rises and the bank takes over.
  const crowd = (): void => shell.sound.level('murmur', master.time() < iRise ? 0.3 : 0);
  master.call(crowd, [], 0.01);
  master.call(crowd, [], iRise);
  crowd();

  // The after-time: other little children gather about her, and the summer days.
  // Each child stands at its place on the bank (a share of the frame's width).
  const CHILD_AT = [14, 70, 82];
  const children = shell.layer('tr__children');
  children.innerHTML = CHILD_AT.map(
    (at, i) =>
      `<div class="tr__child" style="--cx: ${at}%; --i: ${i}"><div class="tr__child-body">${figure('alice/silhouette')}</div></div>`,
  ).join('');
  const kids = [...children.querySelectorAll<HTMLElement>('.tr__child')].map((el) => ({
    el,
    busy: false,
  }));
  master.to(dream, { opacity: 0, duration: 0.6 }, iAfter);
  master.fromTo(
    children,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: reducedMotion ? 0.01 : 0.7, immediateRender: false },
    iAfter + 0.3,
  );
  master.call(() => leafFall.toggleAttribute('data-slow', master.time() >= iSummer), [], iSummer);

  // What the reader kept along the way comes down with the leaves as her sister
  // thinks of her keeping "the loving heart of her childhood", and lies on the
  // bank beside her: the daisy chain, the jar, the key, a comfit, a rose, the
  // lobster. Nothing kept, nothing shown, and nothing to give.
  const kept = shell.kept().filter((kind) => keepsakeSvg(kind) !== '');
  if (kept.length === 0) {
    return;
  }
  const iDown = iAfter + 0.35;
  const keptLayer = shell.layer('tr__kept');
  keptLayer.innerHTML = kept
    .map((kind, i) => {
      const x = 20 + (i % 4) * 4.2 + (i >= 4 ? 2.1 : 0);
      const y = i >= 4 ? 15 : 7;
      return `<div class="tr__keepsake" data-kind="${kind}" style="--kx: ${x.toFixed(1)}%; --ky: ${y}%; --i: ${i}"><div class="tr__keepsake-fall">${keepsakeSvg(kind)}</div></div>`;
    })
    .join('');
  master.fromTo(
    keptLayer,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, immediateRender: false },
    iDown - 0.02,
  );
  master.fromTo(
    keptLayer.querySelectorAll('.tr__keepsake-fall'),
    { y: '-60vh', rotation: -40 },
    {
      y: 0,
      rotation: 0,
      duration: reducedMotion ? 0.01 : 0.45,
      stagger: reducedMotion ? 0 : 0.06,
      ease: 'bounce.out',
      immediateRender: false,
    },
    iDown,
  );

  // Give it to the children: a press (or a tap on a keepsake) sends the nearest
  // child running over, it takes the thing up in both hands and carries it off
  // out of the frame, and comes back without it. The story never does this; it
  // is the reader's, and scrolling back before the keepsakes come down undoes it.
  // Under reduced motion each step is a cut, held as long as with motion.
  const sakes = [...keptLayer.querySelectorAll<HTMLElement>('.tr__keepsake')].map((el) => ({
    el,
    given: false,
    busy: false,
  }));
  const giveProp = shell.prop(shell.ui.demoGiveChildren ?? '', 'tr__prop-give');
  const plays = new Set<gsap.core.Timeline>();
  const giving = (): boolean => master.time() >= iDown + 0.05;
  const applyGive = (): void => {
    const open = giving() && sakes.some((sake) => !sake.given && !sake.busy);
    if (open) {
      giveProp.show();
    } else {
      giveProp.hide();
    }
    for (const sake of sakes) {
      sake.el.toggleAttribute('data-givable', giving() && !sake.given && !sake.busy);
      sake.el.toggleAttribute('data-given', sake.given);
    }
  };
  const resetGive = (): void => {
    for (const play of plays) {
      play.kill();
    }
    plays.clear();
    for (const kid of kids) {
      kid.busy = false;
      kid.el.removeAttribute('data-running');
      gsap.set(kid.el, { x: 0, opacity: 1 });
    }
    for (const sake of sakes) {
      sake.given = false;
      sake.busy = false;
      gsap.set(sake.el, { x: 0, y: 0, opacity: 1 });
    }
  };
  const give = (chosen?: (typeof sakes)[number]): void => {
    const sake = chosen ?? sakes.find((candidate) => !candidate.given && !candidate.busy);
    if (!giving() || !sake || sake.given || sake.busy) {
      return;
    }
    // Read once, on the press: where the keepsake lies and where each child stands.
    const box = sake.el.getBoundingClientRect();
    const sx = box.left + box.width / 2;
    const free = kids
      .filter((candidate) => !candidate.busy)
      .map((candidate) => ({ kid: candidate, box: candidate.el.getBoundingClientRect() }))
      .sort(
        (a, b) =>
          Math.abs(a.box.left + a.box.width / 2 - sx) - Math.abs(b.box.left + b.box.width / 2 - sx),
      )[0];
    if (!free) {
      return;
    }
    const { kid } = free;
    const kx = free.box.left + free.box.width / 2;
    const width = shell.stage.clientWidth;
    const reach = sx - kx;
    const lift = free.box.top + free.box.height * 0.42 - (box.top + box.height / 2);
    const off = kx < width / 2 ? -kx - free.box.width : width - kx + free.box.width;
    sake.busy = true;
    kid.busy = true;
    applyGive();
    shell.status(shell.ui.demoGiveChildren ?? '');
    const play = gsap.timeline({
      onComplete: () => {
        plays.delete(play);
        kid.busy = false;
        sake.busy = false;
        sake.given = true;
        applyGive();
      },
    });
    plays.add(play);
    play
      .call(() => kid.el.setAttribute('data-running', ''), [], 0)
      .to(kid.el, { x: reach, duration: cut(0.6), ease: 'power1.inOut' }, 0)
      .call(() => shell.sound.play('chime', 0.4), [], 0.6)
      .to(sake.el, { y: lift, duration: cut(0.22), ease: 'power2.out' }, 0.6)
      .to(kid.el, { x: off, duration: cut(0.9), ease: 'power1.in' }, 0.9)
      .to(sake.el, { x: off - reach, duration: cut(0.9), ease: 'power1.in' }, 0.9)
      .set(sake.el, { opacity: 0 }, 1.8)
      .call(() => kid.el.removeAttribute('data-running'), [], 1.8)
      .set(kid.el, { x: 0, opacity: 0 }, 1.85)
      .to(kid.el, { opacity: 1, duration: cut(0.4) }, 2.3);
  };
  giveProp.addEventListener('click', () => give());
  for (const sake of sakes) {
    sake.el.addEventListener('click', () => give(sake));
  }
  master.call(
    () => {
      if (master.time() < iDown + 0.05) {
        resetGive();
      }
      applyGive();
    },
    [],
    iDown + 0.05,
  );
  applyGive();
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
