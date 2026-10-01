/**
 * The Queen's Croquet-Ground: the concept demo.
 *
 * A garden in CSS 3D: a ground of ridges and furrows the camera moves across,
 * with flat card people standing on it. The rose-tree first, its white roses
 * waiting to be painted; then the procession marches past and stops at the
 * Queen; then the game, where the mallet is a flamingo under the reader's arm
 * that looks back up at them, the ball a hedgehog that unrolls and walks off,
 * and the arches soldiers who get up and wander. Last, a grin in the air over
 * the ground, and the head it belongs to, argued over until it fades.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './croquet.css';

interface Piece {
  el: HTMLElement;
  x: number;
  z: number;
}

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
  const iGrin = cue('grin');
  const iEyes = cue('eyes');
  const iListening = cue('listening');
  const iKing = cue('king');
  const iRemoved = cue('removed');
  const iArgument = cue('argument');
  const iFade = cue('fade');
  const random = seeded(8);
  const lite = matchMedia('(max-width: 700px)').matches;

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
  const gardeners = [
    piece('cq__gardener', figure('gardener/two'), -700, 60, 8),
    piece('cq__gardener', figure('gardener/five'), -560, 120, 8),
    piece('cq__gardener', figure('gardener/seven'), -400, 80, 8),
  ];
  const pot = piece('cq__pot', '<div class="cq__pot-shape"></div>', -240, 140, 9);

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
  // The Queen! Flat on their faces.
  master.to(
    gardeners.map((g) => g.el),
    { '--flat': 1, duration: reducedMotion ? 0.01 : 0.25, ease: 'power3.in', stagger: 0.05 },
    iFlat + 0.5,
  );

  // --- The procession: soldiers, courtiers, children, guests, the Knave, the King and Queen.
  const procession: Piece[] = [];
  const marchers: [string, string, number][] = [
    ...Array.from({ length: lite ? 4 : 6 }, (): [string, string, number] => [
      'cq__soldier',
      figure('card-soldier'),
      8,
    ]),
    ...Array.from({ length: lite ? 3 : 5 }, (): [string, string, number] => [
      'cq__courtier',
      figure('card-soldier'),
      8,
    ]),
    ...Array.from({ length: lite ? 3 : 5 }, (): [string, string, number] => [
      'cq__child',
      figure('card-soldier'),
      5,
    ]),
    ['cq__rabbit', figure('white-rabbit/herald'), 8],
    ['cq__knave', figure('knave-of-hearts'), 8],
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
    master.to(
      camera,
      { ...to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: applyCamera },
      at,
    );
  };
  look(0, { x: -500, z: -60 }, 1.2, 'none');
  look(iWhy, { x: -560, z: 80, tilt: 8 });
  look(iFlat, { x: -400, z: -100, tilt: 14 }, 0.5);
  look(iFootsteps, { x: 200, z: -200, tilt: 10 }, 1.4);
  look(iCourtiers, { x: 100 }, 1);
  look(iCrown, { x: 0, z: -100 }, 0.8);
  look(iWho, { x: 60, z: 120, tilt: 6, zoom: 1.15 }, 0.8);
  look(iThese, { x: -200, z: 60, zoom: 1 }, 0.7);
  look(iHead, { x: 60, z: 200, zoom: 1.3, tilt: 4 }, 0.4, 'power3.in');
  look(iConsider, { z: 100, zoom: 1.1 }, 0.5);
  look(iGardeners, { x: -300, z: 40, tilt: 12, zoom: 1 }, 0.7);
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
  // While the game is on, any tap on the ground sets her off too.
  const groundTap = document.createElement('button');
  groundTap.type = 'button';
  groundTap.className = 'cq__ground-tap';
  groundTap.setAttribute('aria-label', shell.ui.demoStrike ?? '');
  shell.stage.append(groundTap);

  // --- The gardeners run to Alice, and into the flower-pot.
  const hideButton = shell.prop(shell.ui.demoHideGardeners ?? '', 'cq__prop cq__prop--hide');
  let hidden = false;
  const hide = (): void => {
    if (hidden) {
      return;
    }
    hidden = true;
    hideButton.hide();
    shell.sound.play('whoosh', 0.6);
    shell.status(shell.ui.demoHideGardeners ?? '');
    gardeners.forEach((g, index) => {
      gsap.to(g, {
        x: pot.x + (index - 1) * 20,
        z: pot.z - 10,
        duration: reducedMotion ? 0.01 : 0.45,
        delay: index * 0.08,
        ease: 'power2.in',
        onUpdate: () => place(g),
        overwrite: 'auto',
      });
      gsap.to(g.el, {
        '--sink': 1,
        duration: reducedMotion ? 0.01 : 0.35,
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
  hideButton.addEventListener('click', hide);
  pot.el.addEventListener('click', hide);
  master.to(
    gardeners.map((g) => g.el),
    { '--flat': 0, duration: reducedMotion ? 0.01 : 0.2 },
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
            duration: reducedMotion ? 0.01 : 0.5,
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
          gsap.set(g, { x: [-700, -560, -400][index] ?? -560, z: [60, 120, 80][index] ?? 80 });
          place(g);
          gsap.set(g.el, { '--sink': 0 });
        });
      }
    },
    [],
    iGardeners + 0.1,
  );
  master.call(
    () => (master.time() >= iGardeners + 0.75 ? hide() : undefined),
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
  const hands = shell.layer('cq__hands');
  hands.innerHTML = `<div class="cq__flamingo">${figure('flamingo')}<div class="cq__stroke"></div></div>`;
  const flamingo = hands.querySelector<HTMLElement>('.cq__flamingo') ?? hands;
  const head = hands.querySelector<SVGGElement>('.cq__flamingo-head');
  const strokeZone = hands.querySelector<HTMLElement>('.cq__stroke');
  const flamingoState = { looking: false, away: false, swinging: false };
  master.fromTo(
    flamingo,
    { yPercent: 110 },
    { yPercent: 0, duration: reducedMotion ? 0.01 : 0.5, ease: 'power2.out' },
    iFlamingo + 0.1,
  );
  const strikeButton = shell.prop(shell.ui.demoStrike ?? '', 'cq__prop cq__prop--strike');
  const catchButton = shell.prop(shell.ui.demoCatchFlamingo ?? '', 'cq__prop cq__prop--catch');
  const strokeButton = shell.prop(shell.ui.demoStrokeFlamingo ?? '', 'cq__prop cq__prop--stroke');

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
  shell.onFrame((_dt, elapsed) => {
    // Every few seconds it twists round and looks up in her face; then down again.
    const phase = elapsed % 3.4;
    const looking = phase > 2.2 && !flamingoState.away && !reducedMotion;
    if (looking !== flamingoState.looking) {
      flamingoState.looking = looking;
      flamingo.toggleAttribute('data-looking', looking);
    }
    // The pupils follow the pointer a little while it looks at you.
    if (head && looking) {
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
      swing.to(flamingo, {
        rotation: -70,
        duration: reducedMotion ? 0.01 : 0.2,
        ease: 'power3.in',
      });
      swing.to(flamingo, {
        rotation: 12,
        duration: reducedMotion ? 0.01 : 0.3,
        ease: 'power2.out',
      });
      swing.to(flamingo, {
        rotation: 0,
        duration: reducedMotion ? 0.01 : 0.35,
        ease: 'power2.inOut',
      });
      shell.sound.play('paper', 0.5);
      if (!mood.said) {
        mood.said = true;
        shell.status(shell.ui.demoFlamingoSulks ?? '');
      }
      return;
    }
    if (flamingoState.looking) {
      // It is looking up at you: no blow, only a wobble and a laugh.
      swing.to(flamingo, { rotation: -6, duration: 0.12, yoyo: true, repeat: 3 });
      shell.sound.play('paper', 0.5);
      shell.status(shell.ui.demoCatchFlamingo ?? '');
      return;
    }
    swing.to(flamingo, { rotation: -40, duration: reducedMotion ? 0.01 : 0.18, ease: 'power3.in' });
    swing.to(flamingo, { rotation: 0, duration: reducedMotion ? 0.01 : 0.4, ease: 'power2.out' });
    shell.sound.play('thud', 0.8);
    shell.status(shell.ui.demoStrike ?? '');
    // The hedgehog rolls off toward the nearest arch, and the arch walks away.
    mine.el.removeAttribute('data-walking');
    const arch = arches[Math.floor(random() * arches.length)];
    if (!arch) {
      return;
    }
    gsap.to(mine, {
      x: arch.x + (random() - 0.5) * 80,
      z: arch.z + 40,
      duration: reducedMotion ? 0.01 : 0.9,
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
      duration: reducedMotion ? 0.01 : 1.6,
      delay: 0.5,
      ease: 'sine.inOut',
      onUpdate: () => place(arch),
      overwrite: 'auto',
    });
  };
  strikeButton.addEventListener('click', strike);
  groundTap.addEventListener('click', () => {
    if (groundTap.dataset.mode === 'strike') {
      strike();
    } else if (groundTap.dataset.mode === 'shout') {
      shout(0.8);
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
  master.call(
    () => {
      const inGame = master.time() >= iFlamingo + 0.3 && master.time() < iHedgehog;
      if (inGame) {
        strikeButton.show();
        groundTap.dataset.mode = 'strike';
      } else {
        strikeButton.hide();
        delete groundTap.dataset.mode;
      }
    },
    [],
    iFlamingo + 0.3,
  );
  master.call(
    () => {
      if (master.time() >= iFlamingo + 0.6 && master.time() < iHedgehog) {
        mine.el.setAttribute('data-walking', '');
      }
    },
    [],
    iFlamingo + 0.6,
  );
  // The flamingo goes across to the other side of the garden; catch it and bring it back.
  const flyOff = (): void => {
    flamingoState.away = true;
    flamingo.removeAttribute('data-looking');
    strokeButton.hide();
    // It comes back from its run content again.
    mood.v = 1;
    applyMood();
    catchButton.show();
    gsap.to(flamingo, {
      yPercent: -160,
      xPercent: 90,
      rotation: 30,
      duration: reducedMotion ? 0.01 : 0.9,
      ease: 'power2.in',
      overwrite: 'auto',
    });
    shell.sound.play('whoosh', 0.6);
  };
  const catchIt = (): void => {
    if (!flamingoState.away) {
      return;
    }
    flamingoState.away = false;
    catchButton.hide();
    if (mood.live) {
      strokeButton.show();
    }
    shell.status(shell.ui.demoCatchFlamingo ?? '');
    gsap.to(flamingo, {
      yPercent: 0,
      xPercent: 0,
      rotation: 0,
      duration: reducedMotion ? 0.01 : 0.7,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };
  catchButton.addEventListener('click', catchIt);
  master.call(
    () => {
      if (master.time() >= iHedgehog + 0.1 && master.time() < iHedgehog + 0.8) {
        strikeButton.hide();
        delete groundTap.dataset.mode;
        flyOff();
      } else if (master.time() < iHedgehog + 0.1) {
        catchIt();
      }
    },
    [],
    iHedgehog + 0.1,
  );
  master.call(
    () => (master.time() >= iHedgehog + 0.8 ? catchIt() : undefined),
    [],
    iHedgehog + 0.8,
  );
  master.to(
    flamingo,
    { yPercent: 110, duration: reducedMotion ? 0.01 : 0.5, ease: 'power2.in' },
    iGrin,
  );
  // Quarrelling: a tap anywhere sets the Queen shouting.
  master.call(
    () => {
      const shouting = master.time() >= iQuarrel && master.time() < iGrin;
      ground.toggleAttribute('data-quarrel', shouting);
      const striking = master.time() >= iFlamingo + 0.3 && master.time() < iHedgehog;
      groundTap.dataset.mode = shouting ? 'shout' : striking ? 'strike' : '';
      groundTap.setAttribute(
        'aria-label',
        shouting ? (shell.ui.demoBeatOff ?? '') : (shell.ui.demoStrike ?? ''),
      );
    },
    [],
    iQuarrel,
  );
  master.call(() => ground.toggleAttribute('data-quarrel', false), [], iGrin);

  // --- A head in the air: the grin first, then the eyes, then the whole head.
  const air = shell.layer('cq__air');
  air.innerHTML = `<button type="button" class="cq__cat" aria-label="${shell.ui.demoCallCat ?? ''}">${figure('cheshire-cat/head')}</button>`;
  const cat = air.querySelector<HTMLButtonElement>('.cq__cat') ?? air;
  const catParts = {
    grin: cat.querySelector<SVGGElement>('.cq__cat-grin'),
    eyes: cat.querySelector<SVGGElement>('.cq__cat-eyes'),
    face: cat.querySelector<SVGGElement>('.cq__cat-face'),
    ears: cat.querySelector<SVGGElement>('.cq__cat-ears'),
    pupils: cat.querySelector<SVGGElement>('.cq__cat-pupils'),
  };
  master.fromTo(air, { opacity: 0 }, { opacity: 1, duration: 0.2 }, iGrin + 0.2);
  master.fromTo(catParts.grin, { opacity: 0 }, { opacity: 1, duration: 0.4 }, iGrin + 0.3);
  master.fromTo(catParts.eyes, { opacity: 0 }, { opacity: 1, duration: 0.3 }, iEyes + 0.1);
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
          duration: reducedMotion ? 0.01 : 0.8,
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
          duration: reducedMotion ? 0.01 : 0.8,
          onUpdate: () => place(king),
          overwrite: 'auto',
        });
      }
    },
    [],
    iKing + 0.1,
  );
  master.to(cat, { '--wobble': 1, duration: 0.3, yoyo: true, repeat: 1 }, iRemoved + 0.2);
  master.to(cat, { '--wobble': 1, duration: 0.2, yoyo: true, repeat: 3 }, iArgument + 0.2);
  // Fading away: ears first, then the face, then the eyes, and the grin last of all.
  master.to(catParts.ears, { opacity: 0, duration: 0.2 }, iFade + 0.1);
  master.to(catParts.face, { opacity: 0, duration: 0.3 }, iFade + 0.25);
  master.to(catParts.eyes, { opacity: 0, duration: 0.25 }, iFade + 0.45);
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
      duration: reducedMotion ? 0.01 : 0.25,
      yoyo: true,
      repeat: 1,
      repeatDelay: 0.6,
      onComplete: () => (winking = false),
    });
  });
  shell.onFrame((dt) => {
    const k = 1 - Math.exp(-dt * 6);
    const px = shell.pointer.active ? shell.pointer.x * 10 : 0;
    const py = shell.pointer.active ? shell.pointer.y * 6 : 0;
    const current = Number(catParts.pupils?.style.getPropertyValue('--px') || 0);
    const currentY = Number(catParts.pupils?.style.getPropertyValue('--py') || 0);
    catParts.pupils?.style.setProperty('--px', mix(current, px, k).toFixed(2));
    catParts.pupils?.style.setProperty('--py', mix(currentY, py, k).toFixed(2));
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
