/**
 * Pig and Pepper: the concept demo.
 *
 * Outside the little house two footmen bow and tangle their curls, a plate
 * comes out of the door and breaks on a tree, and Alice goes in; from the door
 * on, the reader is Alice. The kitchen is smoke and pepper drifting as specks,
 * and every sneeze jolts the camera. The cook throws the fire-irons and the
 * crockery at the reader in CSS 3D: some clatter off the edges, some stick to
 * the glass to be batted away, or the reader ducks. The Duchess sings and the
 * whole kitchen bounces on the beat; then the baby is flung and lands in her own
 * two hands at the bottom of the frame, where, grunt by grunt, it turns stepwise
 * into a pig and trots off into the wood. The last beat looks up at a bough at
 * the wood's edge with a grin just arriving on it, which is where the Cheshire
 * Cat's demo begins.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { closeBough } from '../cheshire-cat/figures.ts';
import { attachDemo, type DemoShell, mix, REDUCED_SETTLE, seeded } from '../shell/shell.ts';
import './pig.css';
import {
  CAULDRON_SVG,
  DOOR_LEAF_SVG,
  HEARTH_SVG,
  HOUSE_SVG,
  hands,
  LETTER,
  THINGS,
  TREE_SVG,
} from './figures.ts';

/** The pig comes in stages: the baby, a grunt, a snout, and a pig. */
const PIG = 3;

interface Thing {
  el: HTMLButtonElement;
  stuck: boolean;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iInvitation = cue('invitation');
  const iLaugh = cue('laugh');
  const iGetIn = cue('get-in');
  const iPlate = cue('plate');
  const iIn = cue('in');
  const iSmoke = cue('smoke');
  const iPepper = cue('pepper');
  const iCat = cue('cat');
  const iWhy = cue('why');
  const iGrin = cue('grin');
  const iThrow = cue('throw');
  const iMind = cue('mind');
  const iAxes = cue('axes');
  const iSing = cue('sing');
  const iChorus = cue('chorus');
  const iNurse = cue('nurse');
  const iOff = cue('off');
  const iCatch = cue('catch');
  const iKnot = cue('knot');
  const iGrunt = cue('grunt');
  const iSnout = cue('snout');
  const iPig = cue('pig');
  const iTrot = cue('trot');
  const iLookUp = cue('look-up');
  const lite = matchMedia('(max-width: 700px)').matches;
  const random = seeded(6);
  const still = (duration: number): number => (reducedMotion ? 0.01 : duration);
  /** A call that fires only near its own moment, whichever way the scroll went. */
  const near = (at: number, fn: () => void, span = 0.3): void => {
    master.call(() => (Math.abs(master.time() - at) < span ? fn() : undefined), [], at);
  };

  // --- Outside: the wood's edge, the house, the tree, and the two footmen.
  const outside = shell.layer('pp__outside');
  outside.innerHTML =
    '<div class="pp__world">' +
    '<div class="pp__sky"></div><div class="pp__night"></div><div class="pp__moon"></div>' +
    '<div class="pp__trees pp__trees--far"></div><div class="pp__trees pp__trees--mid"></div>' +
    `<div class="pp__tree">${TREE_SVG}<div class="pp__shards">${Array.from(
      { length: 6 },
      (_, i) =>
        `<div class="pp__shard" style="--i: ${i}; --sx: ${((random() - 0.5) * 30).toFixed(1)}; --sy: ${((random() - 0.5) * 24).toFixed(1)}"></div>`,
    ).join('')}</div></div>` +
    `<div class="pp__house">${HOUSE_SVG}<div class="pp__door">${DOOR_LEAF_SVG}</div></div>` +
    `<div class="pp__footman pp__footman--frog">${figure('frog-footman')}</div>` +
    `<div class="pp__footman pp__footman--fish">${figure('fish-footman')}</div>` +
    '<div class="pp__letter"><div class="pp__fold pp__fold--mid">' +
    `${LETTER.mid}</div><div class="pp__fold pp__fold--bottom"><div class="pp__fold-face">${LETTER.bottom}</div>` +
    `<div class="pp__fold-back">${LETTER.plain}</div></div><div class="pp__fold pp__fold--top">` +
    `<div class="pp__fold-face">${LETTER.top}</div><div class="pp__fold-back">${LETTER.outside}</div></div></div>` +
    `<div class="pp__plate-flying">${THINGS.plate}</div>` +
    `<div class="pp__pig-run">${figure('pig/trotting')}</div>` +
    '<div class="pp__trees pp__trees--near"></div>' +
    '</div>';
  const world = outside.querySelector<HTMLElement>('.pp__world') ?? outside;
  const night = outside.querySelector<HTMLElement>('.pp__night');
  const moon = outside.querySelector<HTMLElement>('.pp__moon');
  const door = outside.querySelector<HTMLElement>('.pp__door');
  const fish = outside.querySelector<HTMLElement>('.pp__footman--fish');
  const frog = outside.querySelector<HTMLElement>('.pp__footman--frog');
  const footmen = [fish, frog].filter((el): el is HTMLElement => el !== null);
  const plateFlying = outside.querySelector<HTMLElement>('.pp__plate-flying');
  const shards = [...outside.querySelectorAll<HTMLElement>('.pp__shard')];
  const pigRun = outside.querySelector<HTMLElement>('.pp__pig-run');
  // The camera goes in through the door, so the world scales about it: measured
  // once at mount and on resize, never per frame.
  const aimAtDoor = (): void => {
    if (!door) {
      return;
    }
    const box = door.getBoundingClientRect();
    const stage = shell.stage.getBoundingClientRect();
    world.style.setProperty(
      '--ox',
      `${(((box.left + box.width * 0.5 - stage.left) / stage.width) * 100).toFixed(1)}%`,
    );
    world.style.setProperty(
      '--oy',
      `${(((box.top + box.height * 0.55 - stage.top) / stage.height) * 100).toFixed(1)}%`,
    );
  };
  aimAtDoor();
  window.addEventListener('resize', aimAtDoor, { passive: true });

  // --- The kitchen, from her own eyes once she is through the door.
  const kitchen = shell.layer('pp__kitchen');
  kitchen.innerHTML =
    '<div class="pp__room">' +
    '<div class="pp__wall"></div><div class="pp__shelf"></div><div class="pp__floor"></div>' +
    `<div class="pp__hearth">${HEARTH_SVG}<div class="pp__cat">${figure('cheshire-cat/on-hearth')}</div></div>` +
    `<div class="pp__cauldron">${CAULDRON_SVG}</div>` +
    `<div class="pp__cook">${figure('cook')}</div>` +
    `<div class="pp__duchess">${figure('duchess')}<div class="pp__baby-in-arms" data-stage="0">${figure('pig-baby')}</div></div>` +
    '<div class="pp__smoke"></div><div class="pp__anger"></div>' +
    '</div>';
  const room = kitchen.querySelector<HTMLElement>('.pp__room') ?? kitchen;
  const cauldron = kitchen.querySelector<HTMLElement>('.pp__cauldron');
  const hearthCat = kitchen.querySelector<HTMLElement>('.pp__cat');
  const cook = kitchen.querySelector<HTMLElement>('.pp__cook');
  const duchess = kitchen.querySelector<HTMLElement>('.pp__duchess');
  const babyInArms = kitchen.querySelector<HTMLElement>('.pp__baby-in-arms');
  const catGrin = kitchen.querySelector<SVGGElement>('.pp__cat-grin');
  const anger = kitchen.querySelector<HTMLElement>('.pp__anger');
  const smoke = kitchen.querySelector<HTMLElement>('.pp__smoke');

  // --- Pepper: specks that drift; static under reduced motion.
  const pepper = shell.layer('pp__pepper');
  const speck = (extra = ''): string =>
    `<div class="pp__speck ${extra}" style="--x: ${(random() * 100).toFixed(1)}%; --y: ${(random() * 100).toFixed(1)}%; --d: ${(6 + random() * 8).toFixed(1)}s; --i: ${(random() * -14).toFixed(1)}s; --s: ${(0.5 + random()).toFixed(2)}"></div>`;
  pepper.innerHTML = Array.from({ length: lite ? 36 : 70 }, () => speck()).join('');

  // --- The things the cook throws, and the glass they stick to.
  const flying = shell.layer('pp__flying');
  const glass = shell.layer('pp__glass');
  glass.innerHTML = `<div class="pp__big-pan">${THINGS.saucepan}</div><div class="pp__pan-after">${THINGS['frying-pan']}</div>`;
  const bigPan = glass.querySelector<HTMLElement>('.pp__big-pan');
  const panAfter = glass.querySelector<HTMLElement>('.pp__pan-after');

  // --- Her own hands, and the bundle in them.
  const handsLayer = shell.layer('pp__hands');
  handsLayer.innerHTML = hands(`<div class="pp__baby" data-stage="0">${figure('pig-baby')}</div>`);
  const held = handsLayer.querySelector<HTMLElement>('.pp__baby');

  // --- The join: a bough at the wood's edge, close, with a grin arriving on it.
  const bough = shell.layer('pp__bough');
  bough.innerHTML = closeBough('pp__close');
  const closeGrin = bough.querySelector<HTMLElement>('.pp__close-grin');
  const blink = shell.layer('pp__blink');
  // Under reduced motion a cut blinks. Each beat is seen settled, seven tenths in
  // (REDUCED_SETTLE), so a blink must never be under way there: one that would be
  // starts just after it instead, and is over before the next beat is seen.
  const wink = (at: number): void => {
    if (reducedMotion) {
      const into = at - Math.floor(at);
      const start =
        into > REDUCED_SETTLE - 0.25 && into <= REDUCED_SETTLE + 1e-6
          ? Math.floor(at) + REDUCED_SETTLE + 0.02
          : at;
      master.fromTo(
        blink,
        { opacity: 1 },
        { opacity: 0, duration: 0.25, immediateRender: false },
        start,
      );
    }
  };

  // --- The camera: a jolt for a sneeze, a bounce on the beat, a duck. Each
  // its own object; they meet in apply().
  const cam = { bounce: 0 };
  const jolt = { x: 0, y: 0, duck: 0 };
  const applyCam = (): void => {
    shell.stage.style.setProperty('--jx', jolt.x.toFixed(2));
    shell.stage.style.setProperty('--jy', (jolt.y + cam.bounce + jolt.duck).toFixed(2));
  };
  applyCam();
  const shake = (strength = 1): void => {
    if (reducedMotion) {
      gsap.fromTo(blink, { opacity: 0.7 }, { opacity: 0, duration: 0.25 });
      return;
    }
    gsap.fromTo(
      jolt,
      { x: (random() - 0.5) * 12 * strength, y: 16 * strength },
      { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)', onUpdate: applyCam },
    );
  };

  // --- Outside: the Fish-Footman runs out of the wood and raps; the Frog opens.
  master.fromTo(
    fish,
    { x: '-70vw' },
    { x: '0vw', duration: still(0.45), ease: 'power1.out' },
    0.05,
  );
  master.to(fish, { rotation: 6, duration: still(0.06), yoyo: true, repeat: 3 }, 0.55);
  master.to(door, { '--open': 0.45, duration: still(0.2) }, 0.7);
  master.fromTo(frog, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.75);
  near(0.6, () => shell.sound.play('thud', 0.4), 0.2);

  // They bow low, and their curls tangle. A press bows them again.
  const bow = (): void => {
    for (const footman of footmen) {
      footman.removeAttribute('data-bow');
      void footman.offsetWidth;
      footman.setAttribute('data-bow', '');
    }
    gsap.delayedCall(reducedMotion ? 0.1 : 0.5, () => {
      for (const footman of footmen) {
        footman.setAttribute('data-tangled', '');
      }
    });
    shell.sound.play('paper', 0.4);
  };
  const untangle = (): void => {
    for (const footman of footmen) {
      footman.removeAttribute('data-tangled');
      footman.removeAttribute('data-bow');
    }
  };
  master.call(
    () => (master.time() >= iInvitation + 0.55 ? bow() : untangle()),
    [],
    iInvitation + 0.55,
  );
  const bowButton = shell.prop(shell.ui.demoBow ?? '', 'pp__prop pp__prop--bow');
  bowButton.addEventListener('click', bow);
  for (const footman of footmen) {
    footman.addEventListener('click', bow);
  }
  bowButton.show();
  master.call(() => (master.time() >= iIn ? bowButton.hide() : bowButton.show()), [], iIn);

  // --- The invitation, "nearly as large as himself": the Fish-Footman holds it out
  // and the Frog-Footman takes it to read back. Folded in three, sealed with a
  // heart; a tap on it, or *Open the letter*, unfolds it, and the Frog leans in.
  const letter = outside.querySelector<HTMLElement>('.pp__letter');
  master.fromTo(
    letter,
    { opacity: 0, scale: 0.3, x: '-4vmin' },
    { opacity: 1, scale: 1, x: '0vmin', duration: still(0.2), ease: 'back.out(1.6)' },
    iInvitation + 0.05,
  );
  master.to(letter, { x: '5vmin', duration: still(0.25), ease: 'sine.inOut' }, iInvitation + 0.32);
  master.to(letter, { opacity: 0, duration: still(0.2) }, iLaugh + 0.05);
  let letterTimer: ReturnType<typeof setTimeout> | undefined;
  const unfold = (open: boolean): void => {
    gsap.killTweensOf(letter, '--unfold');
    if (reducedMotion) {
      letter?.style.setProperty('--unfold', open ? '1' : '0');
    } else {
      gsap.to(letter, {
        '--unfold': open ? 1 : 0,
        duration: open ? 0.7 : 0.5,
        ease: open ? 'power2.out' : 'power2.in',
      });
    }
    frog?.toggleAttribute('data-reading', open);
  };
  const openLetter = (): void => {
    unfold(true);
    shell.sound.play('paper', 0.6);
    clearTimeout(letterTimer);
    letterTimer = setTimeout(() => unfold(false), 4200);
  };
  letter?.addEventListener('click', (event) => {
    event.stopPropagation();
    openLetter();
  });
  const letterButton = shell.prop(
    shell.ui.demoOpenLetter ?? '',
    'pp__prop pp__prop--second pp__prop--letter',
  );
  letterButton.addEventListener('click', openLetter);
  const letterShown = (): void => {
    const inside = master.time() >= iInvitation && master.time() < iLaugh;
    if (inside) {
      letterButton.show();
    } else {
      letterButton.hide();
    }
  };
  master.call(letterShown, [], iInvitation);
  master.call(letterShown, [], iLaugh);

  // She laughs and runs back into the wood, then comes back; the Frog sits down.
  master.to(
    world,
    { '--cam-s': 0.72, '--cam-x': 14, duration: still(0.35), ease: 'power2.out' },
    iLaugh + 0.05,
  );
  master.to(
    world,
    { '--cam-s': 1, '--cam-x': 0, duration: still(0.35), ease: 'power2.inOut' },
    iLaugh + 0.55,
  );
  master.to(frog, { y: '5vmin', x: '-6vmin', rotation: -10, duration: still(0.3) }, iLaugh + 0.6);
  master.to(fish, { x: '-70vw', duration: still(0.4), ease: 'power1.in' }, iLaugh + 0.1);
  master.to(frog, { rotation: -16, duration: still(0.3) }, iGetIn + 0.2);

  // A large plate comes flying out of the door and breaks against the tree.
  // Things that fly once: shown by a set at their moment and hidden by one after,
  // so a scrub back past either puts them away again.
  master.to(plateFlying, { opacity: 1, duration: 0.01 }, iPlate + 0.1);
  // `--fly` carries it from the door to the tree's crown, a way the sheet sets
  // for the frame's shape; the spin and the growing are the tween's own.
  master.fromTo(
    plateFlying,
    { '--fly': 0, scale: 0.3, rotation: 0 },
    {
      '--fly': 1,
      scale: 1,
      rotation: 540,
      duration: still(0.3),
      ease: 'power1.in',
      immediateRender: false,
    },
    iPlate + 0.1,
  );
  master.to(plateFlying, { opacity: 0, duration: 0.01 }, iPlate + 0.41);
  shards.forEach((shard, i) => {
    master.to(shard, { opacity: 1, duration: 0.01 }, iPlate + 0.41);
    master.fromTo(
      shard,
      { x: 0, y: 0, rotation: 0 },
      {
        x: `${((i % 3) - 1) * 9 + (random() - 0.5) * 6}vmin`,
        y: `${6 + i * 3}vmin`,
        rotation: (random() - 0.5) * 400,
        duration: still(0.35),
        ease: 'power1.in',
        immediateRender: false,
      },
      iPlate + 0.41,
    );
    master.to(shard, { opacity: 0, duration: 0.01 }, iPlate + 0.78);
  });
  near(iPlate + 0.41, () => shell.sound.play('glass', 0.7), 0.2);

  // She opens the door and goes in: the camera passes through it.
  master.to(door, { '--open': 1, duration: still(0.2) }, iIn + 0.3);
  master.to(
    world,
    { '--cam-s': 5.5, '--cam-x': 0, duration: still(0.5), ease: 'power2.in' },
    reducedMotion ? iIn + 0.7 : iIn + 0.45,
  );
  master.to(outside, { opacity: 0, duration: still(0.25) }, iIn + 0.75);
  master.call(() => outside.toggleAttribute('data-away', master.time() >= iIn + 1), [], iIn + 1);
  master.fromTo(kitchen, { opacity: 0 }, { opacity: 1, duration: still(0.3) }, iIn + 0.7);
  master.fromTo(pepper, { opacity: 0 }, { opacity: 1, duration: 0.3 }, iIn + 0.85);
  // Faded layers are hidden outright: the kitchen and its seventy drifting specks
  // cost the same to paint at opacity zero.
  kitchen.toggleAttribute('data-away', true);
  pepper.toggleAttribute('data-away', true);
  const away = (layer: HTMLElement, from: number, to: number): void => {
    const apply = (): void => {
      const t = master.time();
      layer.toggleAttribute('data-away', t < from || t >= to);
    };
    master.call(apply, [], from);
    master.call(apply, [], to);
  };
  away(kitchen, iIn + 0.7, iKnot + 1.05);
  away(pepper, iIn + 0.85, iKnot + 0.85);
  // The cauldron on the fire, as long as the kitchen is.
  const potSound = (): void => {
    const t = master.time();
    shell.sound.level('bubble', t >= iIn + 0.7 && t < iKnot + 0.8 ? 0.35 : 0);
  };
  master.call(potSound, [], iIn + 0.7);
  master.call(potSound, [], iKnot + 0.8);
  wink(iIn + 0.7);
  master.call(
    () => shell.root.toggleAttribute('data-inside', master.time() >= iIn + 0.8),
    [],
    iIn + 0.8,
  );

  // --- The kitchen: smoke from one end to the other, and then the pepper.
  master.fromTo(smoke, { opacity: 0.9 }, { opacity: 0.45, duration: 1 }, iSmoke + 0.4);
  const sneeze = (who: HTMLElement | null, strength = 1): void => {
    if (who) {
      who.removeAttribute('data-sneeze');
      void who.offsetWidth;
      who.setAttribute('data-sneeze', '');
    } else {
      shake(strength);
    }
    shell.sound.play('thud', 0.3 * strength);
  };
  near(iPepper + 0.15, () => sneeze(duchess));
  near(iPepper + 0.4, () => sneeze(babyInArms, 0.6));
  near(iPepper + 0.6, () => sneeze(null));
  near(iPepper + 0.85, () => sneeze(null, 0.7));
  // More pepper: a press on the cauldron, or the button, shakes some out.
  const shakePepper = (): void => {
    const burst = document.createElement('div');
    burst.className = 'pp__burst';
    burst.innerHTML = Array.from({ length: lite ? 14 : 24 }, () => speck('pp__speck--burst')).join(
      '',
    );
    pepper.append(burst);
    burst.addEventListener('animationend', () => burst.remove(), { once: true });
    gsap.delayedCall(4, () => burst.remove());
    gsap.delayedCall(reducedMotion ? 0.2 : 0.7, () => sneeze(null));
    gsap.delayedCall(reducedMotion ? 0.3 : 1.1, () => sneeze(duchess));
    cauldron?.removeAttribute('data-shaken');
    void cauldron?.offsetWidth;
    cauldron?.setAttribute('data-shaken', '');
    shell.status(shell.ui.demoPepper ?? '');
  };
  const pepperButton = shell.prop(shell.ui.demoPepper ?? '', 'pp__prop pp__prop--pepper');
  pepperButton.addEventListener('click', shakePepper);
  cauldron?.addEventListener('click', shakePepper);
  const pepperShown = (): void => {
    const inside = master.time() >= iSmoke && master.time() < iThrow;
    if (inside) {
      pepperButton.show();
    } else {
      pepperButton.hide();
    }
  };
  master.call(pepperShown, [], iSmoke);
  master.call(pepperShown, [], iThrow);

  // The cat on the hearth: she looks over at it, and it grins wider.
  master.to(room, { '--look-x': 0.7, duration: still(0.4), ease: 'sine.inOut' }, iCat + 0.05);
  master.to(catGrin, { '--wide': 0.5, duration: still(0.4) }, iCat + 0.4);
  master.to(room, { '--look-x': 0, duration: still(0.4), ease: 'sine.inOut' }, iWhy + 0.05);
  // "Pig!": the Duchess snaps at the baby, and it jumps.
  master.to(duchess, { rotation: -8, duration: still(0.08), yoyo: true, repeat: 1 }, iWhy + 0.5);
  master.to(babyInArms, { y: -12, duration: still(0.08), yoyo: true, repeat: 1 }, iWhy + 0.54);
  near(iWhy + 0.5, () => shell.sound.play('thud', 0.5), 0.2);
  master.to(catGrin, { '--wide': 1, duration: still(0.4) }, iGrin + 0.1);
  // *Look at the cat*, or a tap on it: the one Cheshire face grins wider still
  // and winks, then is as the story has it. Its own amount (--more), so the
  // story's grin is the scroll's.
  const more = { v: 0 };
  const applyMore = (): void => catGrin?.style.setProperty('--more', more.v.toFixed(3));
  let winkTimer: ReturnType<typeof setTimeout> | undefined;
  let widening: gsap.core.Animation | undefined;
  const lookAtCat = (): void => {
    widening?.kill();
    hearthCat?.removeAttribute('data-wink');
    void hearthCat?.offsetWidth;
    hearthCat?.setAttribute('data-wink', '');
    clearTimeout(winkTimer);
    winkTimer = setTimeout(
      () => hearthCat?.removeAttribute('data-wink'),
      reducedMotion ? 1400 : 900,
    );
    shell.sound.play('chime', 0.3);
    if (reducedMotion) {
      more.v = 0.8;
      applyMore();
      widening = gsap.delayedCall(1.6, () => {
        more.v = 0;
        applyMore();
      });
      return;
    }
    widening = gsap
      .timeline()
      .to(more, { v: 0.8, duration: 0.3, ease: 'back.out(2)', onUpdate: applyMore })
      .to(more, { v: 0, duration: 0.7, ease: 'sine.inOut', onUpdate: applyMore }, '+=1');
  };
  hearthCat?.addEventListener('click', lookAtCat);
  const catButton = shell.prop(
    shell.ui.demoLookCat ?? '',
    'pp__prop pp__prop--second pp__prop--look',
  );
  catButton.addEventListener('click', lookAtCat);
  const catShown = (): void => {
    const inside = master.time() >= iCat && master.time() < iThrow;
    if (inside) {
      catButton.show();
    } else {
      catButton.hide();
    }
  };
  master.call(catShown, [], iCat);
  master.call(catShown, [], iThrow);
  master.to(duchess, { scale: 1.08, duration: still(0.3) }, iGrin + 0.6);
  master.to(duchess, { scale: 1, duration: still(0.3) }, iThrow + 0.05);

  // --- Pots and pans: a burst in time, not on the scrub, sent at the reader.
  const kinds = [
    'fire-iron',
    'fire-iron',
    'saucepan',
    'plate',
    'dish',
    'saucepan',
    'plate',
    'fire-iron',
    'dish',
    'saucepan',
    'plate',
    'dish',
    'saucepan',
    'plate',
  ];
  const things: Thing[] = kinds.slice(0, lite ? 9 : kinds.length).map((kind) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'pp__thing';
    el.dataset.kind = kind;
    el.setAttribute('aria-label', shell.ui.demoBatPan ?? '');
    // Only a thing stuck on the glass is in its moment: until then it is inert.
    el.inert = true;
    el.innerHTML = THINGS[kind] ?? '';
    flying.append(el);
    return { el, stuck: false };
  });
  const pick = seeded(17);
  const home = (): gsap.TweenVars => ({
    x: '24vw',
    y: '4vh',
    z: -400,
    scale: 0.4,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    opacity: 0,
  });
  for (const thing of things) {
    gsap.set(thing.el, home());
  }
  let ducking = false;
  const flick = (thing: Thing, dir = 1): void => {
    if (!thing.stuck) {
      return;
    }
    thing.stuck = false;
    thing.el.inert = true;
    shell.sound.play('thud', 0.35);
    gsap.to(thing.el, {
      x: `${(pick() - 0.5) * 120}vw`,
      y: `${dir * 120}vh`,
      rotationZ: (pick() - 0.5) * 300,
      duration: still(0.5),
      ease: 'power2.in',
      onComplete: () => thing.el.remove(),
    });
  };
  const placeOnGlass = (thing: Thing): void => {
    glass.append(thing.el);
    thing.stuck = true;
    thing.el.inert = false;
    shell.sound.play('thud', 0.6);
    // Never where the sentences are: they hold the lower part of the frame (on a
    // tall frame, more of it), so the glass takes its things above them.
    const gx = 6 + pick() * 88;
    const tall = shell.stage.clientHeight > shell.stage.clientWidth;
    const gy = 8 + pick() * (tall ? 32 : 42);
    thing.el.style.setProperty('--gx', `${gx.toFixed(1)}%`);
    thing.el.style.setProperty('--gy', `${gy.toFixed(1)}%`);
    gsap.set(thing.el, { clearProps: 'transform,opacity' });
    gsap.fromTo(
      thing.el,
      { scale: 0.5, rotationZ: (pick() - 0.5) * 90, opacity: reducedMotion ? 0 : 1 },
      {
        scale: 1,
        rotationZ: (pick() - 0.5) * 40,
        opacity: 1,
        duration: still(0.16),
        ease: 'power3.out',
        onComplete: () => (ducking ? flick(thing, -1) : undefined),
      },
    );
  };
  const attack = gsap.timeline({ paused: true });
  things.forEach((thing, index) => {
    const stuck = index % 2 === 0;
    const at = index * 0.1 + pick() * 0.06;
    if (reducedMotion) {
      if (stuck) {
        attack.call(() => placeOnGlass(thing), [], at);
      }
      return;
    }
    attack.fromTo(
      thing.el,
      { ...home(), opacity: 1 },
      {
        x: `${(pick() - 0.5) * 80}vw`,
        y: `${(pick() - 0.5) * 60}vh`,
        z: stuck ? 520 : 900,
        rotationX: (pick() - 0.5) * 500,
        rotationY: (pick() - 0.5) * 500,
        rotationZ: (pick() - 0.5) * 360,
        scale: 1,
        duration: stuck ? 0.55 : 0.7,
        ease: 'power1.in',
        immediateRender: false,
        onComplete: stuck ? () => placeOnGlass(thing) : () => shell.sound.play('thud', 0.25),
      },
      at,
    );
    if (!stuck) {
      attack.to(thing.el, { opacity: 0, duration: 0.05 }, at + 0.68);
    }
  });
  const resetThings = (): void => {
    for (const thing of things) {
      if (thing.el.parentElement !== flying) {
        flying.append(thing.el);
      }
      thing.stuck = false;
      thing.el.inert = true;
      thing.el.style.removeProperty('--gx');
      thing.el.style.removeProperty('--gy');
      gsap.killTweensOf(thing.el);
      gsap.set(thing.el, { clearProps: 'all' });
      gsap.set(thing.el, home());
    }
  };
  master.call(
    () => {
      if (master.time() >= iThrow + 0.2) {
        attack.play(0);
        cook?.removeAttribute('data-throwing');
        void cook?.offsetWidth;
        cook?.setAttribute('data-throwing', '');
      } else {
        attack.pause(0);
        resetThings();
      }
    },
    [],
    iThrow + 0.2,
  );
  glass.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.pp__thing');
    const thing = things.find((candidate) => candidate.el === target);
    if (thing) {
      flick(thing);
    }
  });
  // Duck: the view drops, and whatever is on the glass goes over your head.
  const duck = (): void => {
    if (ducking) {
      return;
    }
    ducking = true;
    shell.status(shell.ui.demoDuck ?? '');
    for (const thing of things) {
      flick(thing, -1);
    }
    gsap.to(jolt, { duck: 70, duration: still(0.18), ease: 'power2.out', onUpdate: applyCam });
    gsap.to(jolt, {
      duck: 0,
      duration: still(0.5),
      delay: reducedMotion ? 0.4 : 0.5,
      ease: 'power2.inOut',
      onUpdate: applyCam,
      onComplete: () => {
        ducking = false;
      },
    });
  };
  const duckButton = shell.prop(shell.ui.demoDuck ?? '', 'pp__prop pp__prop--duck');
  duckButton.addEventListener('click', duck);
  const duckShown = (): void => {
    const inside = master.time() >= iThrow && master.time() < iSing;
    if (inside) {
      duckButton.show();
    } else {
      duckButton.hide();
    }
  };
  master.call(duckShown, [], iThrow);
  master.call(duckShown, [], iSing);
  // The cook takes the soup off the fire first.
  master.to(cauldron, { x: '-10vmin', y: '6vmin', duration: still(0.2) }, iThrow + 0.02);
  // "There goes his precious nose!": a large saucepan skims past the reader.
  master.to(bigPan, { opacity: 1, duration: 0.01 }, iMind + 0.45);
  master.fromTo(
    bigPan,
    { x: '60vw', y: '-20vh', scale: 0.3, rotation: 20 },
    {
      x: '-80vw',
      y: '18vh',
      scale: 3,
      rotation: -200,
      duration: still(0.3),
      ease: 'power1.in',
      immediateRender: false,
    },
    iMind + 0.45,
  );
  master.to(bigPan, { opacity: 0, duration: 0.01 }, iMind + 0.76);
  near(
    iMind + 0.55,
    () => {
      shell.sound.play('whoosh', 0.8);
      shake(0.6);
    },
    0.2,
  );
  // "Talking of axes, chop off her head!"
  master.to(duchess, { scale: 1.1, duration: still(0.2) }, iAxes + 0.45);
  master.fromTo(anger, { opacity: 0 }, { opacity: 0.5, duration: still(0.15) }, iAxes + 0.45);
  master.to(anger, { opacity: 0, duration: still(0.3) }, iAxes + 0.7);
  master.to(duchess, { scale: 1, duration: still(0.2) }, iAxes + 0.8);

  // --- The lullaby: a toss at the end of every line, the whole kitchen with it.
  const toss = (at: number, strength = 1): void => {
    if (reducedMotion) {
      master.to(babyInArms, { y: -40 * strength, duration: 0.01 }, at);
      master.to(cam, { bounce: -10 * strength, onUpdate: applyCam, duration: 0.01 }, at);
      master.to(babyInArms, { y: 0, duration: 0.01 }, at + 0.1);
      master.to(cam, { bounce: 0, onUpdate: applyCam, duration: 0.01 }, at + 0.1);
      return;
    }
    master.to(
      babyInArms,
      { y: -60 * strength, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.out' },
      at,
    );
    master.to(
      cam,
      { bounce: -16 * strength, duration: 0.07, yoyo: true, repeat: 1, onUpdate: applyCam },
      at + 0.04,
    );
    near(at + 0.05, () => shell.sound.play('thud', 0.35), 0.12);
  };
  const singing = (): void => {
    const on = master.time() >= iSing && master.time() < iNurse + 0.5;
    duchess?.toggleAttribute('data-singing', on);
    cook?.toggleAttribute('data-singing', on && master.time() >= iChorus);
    babyInArms?.toggleAttribute('data-singing', on && master.time() >= iChorus);
  };
  for (const at of [iSing, iChorus, iNurse + 0.5]) {
    master.call(singing, [], at);
  }
  toss(iSing + 0.3);
  toss(iSing + 0.62);
  toss(iSing + 0.92);
  toss(iChorus + 0.12, 1.3);
  toss(iChorus + 0.32, 1.3);
  toss(iChorus + 0.52, 1.3);
  toss(iNurse + 0.1, 0.8);

  // She flings the baby at Alice: it comes at the camera and lands in her hands.
  master.to(
    babyInArms,
    { x: '-24vw', y: '46vh', scale: 3.2, rotation: 220, duration: still(0.35), ease: 'power1.in' },
    iNurse + 0.55,
  );
  master.to(babyInArms, { opacity: 0, duration: 0.01 }, iNurse + 0.9);
  master.fromTo(
    handsLayer,
    { y: 180 },
    { y: 0, duration: still(0.2), ease: 'power2.out' },
    iNurse + 0.8,
  );
  master.to(handsLayer, { opacity: 1, duration: 0.01 }, iNurse + 0.8);
  near(
    iNurse + 0.9,
    () => {
      shell.sound.play('thud', 0.7);
      shake(0.8);
    },
    0.2,
  );
  master.call(
    () => shell.root.toggleAttribute('data-holding', master.time() >= iNurse + 0.9),
    [],
    iNurse + 0.9,
  );
  wink(iNurse + 0.88);
  // She hurries out, and the cook throws a frying-pan after her.
  master.to(
    duchess,
    { x: '70vw', opacity: 0, duration: still(0.4), ease: 'power1.in' },
    iOff + 0.1,
  );
  master.to(panAfter, { opacity: 1, duration: 0.01 }, iOff + 0.55);
  master.fromTo(
    panAfter,
    { x: '20vw', y: '0vh', scale: 0.5, rotation: 0 },
    {
      x: '70vw',
      y: '-10vh',
      scale: 1.2,
      rotation: 400,
      duration: still(0.25),
      ease: 'power1.in',
      immediateRender: false,
    },
    iOff + 0.55,
  );
  master.to(panAfter, { opacity: 0, duration: 0.01 }, iOff + 0.81);
  near(iOff + 0.55, () => shell.sound.play('whoosh', 0.6), 0.2);

  // --- The baby in her hands: a starfish that doubles up and straightens.
  master.call(
    () =>
      held?.toggleAttribute('data-wriggle', master.time() >= iCatch && master.time() < iKnot + 0.5),
    [],
    iCatch,
  );
  /** Knots the bundle; the status speaks only when the reader did it. */
  const knot = (byReader = true): void => {
    if (held?.hasAttribute('data-knotted')) {
      return;
    }
    held?.setAttribute('data-knotted', '');
    held?.removeAttribute('data-wriggle');
    shell.sound.play('paper', 0.5);
    if (byReader) {
      shell.status(shell.ui.demoHoldTight ?? '');
    }
  };
  const unknot = (): void => {
    held?.removeAttribute('data-knotted');
    held?.toggleAttribute('data-wriggle', master.time() >= iCatch);
  };
  const holdButton = shell.prop(shell.ui.demoHoldTight ?? '', 'pp__prop pp__prop--hold');
  holdButton.addEventListener('click', () => knot());
  const holdShown = (): void => {
    const inside = master.time() >= iCatch + 0.2 && master.time() < iKnot + 0.5;
    if (inside) {
      holdButton.show();
    } else {
      holdButton.hide();
    }
  };
  master.call(holdShown, [], iCatch + 0.2);
  master.call(holdShown, [], iKnot + 0.5);
  master.call(() => (master.time() >= iKnot + 0.5 ? knot(false) : unknot()), [], iKnot + 0.5);
  // Or drag the bundle: a pull of a hand's width twists it into a knot.
  let drag: { x: number; y: number } | undefined;
  held?.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, y: event.clientY };
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (drag && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 40) {
        drag = undefined;
        if (master.time() >= iCatch) {
          knot();
        }
      }
    },
    { passive: true },
  );
  window.addEventListener('pointerup', () => {
    drag = undefined;
  });

  // She carries it outside: the kitchen turns away and the wood is there, at night.
  master.to(pepper, { opacity: 0, duration: still(0.3) }, iKnot + 0.5);
  master.to(room, { '--look-x': 2, duration: still(0.4), ease: 'power2.in' }, iKnot + 0.55);
  master.to(kitchen, { opacity: 0, duration: still(0.3) }, iKnot + 0.7);
  master.to(world, { '--cam-s': 1.15, '--cam-x': -30, duration: 0.01 }, iKnot + 0.65);
  master.to(night, { opacity: 1, duration: 0.01 }, iKnot + 0.65);
  master.to(glass, { opacity: 0, duration: still(0.2) }, iKnot + 0.4);
  master.to(moon, { opacity: 1, duration: 0.01 }, iKnot + 0.65);
  master.call(
    () => outside.toggleAttribute('data-away', master.time() < iKnot + 0.65),
    [],
    iKnot + 0.65,
  );
  master.to(outside, { opacity: 1, duration: still(0.3) }, iKnot + 0.7);
  master.to(
    world,
    { '--cam-x': 22, '--cam-s': 1.1, duration: still(0.5), ease: 'power2.out' },
    iKnot + 0.7,
  );
  master.call(
    () =>
      shell.root.toggleAttribute(
        'data-inside',
        master.time() < iKnot + 0.7 && master.time() >= iIn + 0.8,
      ),
    [],
    iKnot + 0.7,
  );
  wink(iKnot + 0.7);

  // --- The pig, in stages: the scroll sets one, a poke adds one until the next beat.
  let scrollStage = 0;
  let bonus = 0;
  const applyStage = (): void => {
    const stage = Math.min(PIG, scrollStage + bonus);
    held?.setAttribute('data-stage', String(stage));
    held?.style.setProperty('--stage', String(stage));
  };
  const setScrollStage = (stage: number): void => {
    if (stage !== scrollStage) {
      scrollStage = stage;
      bonus = 0;
      applyStage();
    }
  };
  const grunt = (strength = 1): void => {
    held?.removeAttribute('data-grunt');
    void held?.offsetWidth;
    held?.setAttribute('data-grunt', '');
    shell.sound.play('thud', 0.3 * strength);
  };
  master.call(() => setScrollStage(master.time() >= iGrunt ? 1 : 0), [], iGrunt);
  master.call(() => setScrollStage(master.time() >= iSnout ? 2 : 1), [], iSnout);
  master.call(() => setScrollStage(master.time() >= iPig + 0.05 ? PIG : 2), [], iPig + 0.05);
  near(iGrunt + 0.05, () => grunt(0.7));
  near(iPig + 0.05, () => {
    grunt(1.4);
    shake(0.5);
  });
  const poke = (): void => {
    if (master.time() < iCatch || scrollStage >= PIG) {
      grunt(0.7);
      return;
    }
    bonus = 1;
    applyStage();
    grunt();
    shell.status(shell.ui.demoPokeBaby ?? '');
  };
  held?.addEventListener('click', poke);
  const pokeButton = shell.prop(
    shell.ui.demoPokeBaby ?? '',
    'pp__prop pp__prop--second pp__prop--poke',
  );
  pokeButton.addEventListener('click', poke);
  const pokeShown = (): void => {
    const inside = master.time() >= iCatch + 0.2 && master.time() < iTrot + 0.1;
    if (inside) {
      pokeButton.show();
    } else {
      pokeButton.hide();
    }
  };
  master.call(pokeShown, [], iCatch + 0.2);
  master.call(pokeShown, [], iTrot + 0.1);
  // She looks down in alarm, then sets it down; it trots off into the wood.
  master.to(world, { '--look': -0.6, duration: still(0.3) }, iPig + 0.1);
  master.to(world, { '--look': 0, duration: still(0.4) }, iTrot);
  master.to(handsLayer, { y: 220, duration: still(0.3), ease: 'power2.in' }, iTrot + 0.1);
  // Set down at her feet, it trots off along the ground to the left, smaller as
  // it goes, and into the trees at the wood's edge (the near trunks pass in front
  // of it). `--trot` runs 0 to 1; the sheet turns it into the way along the
  // ground for the frame's shape. Under reduced motion it is a still, half-way to
  // the trees at its sentence, and gone when she looks up.
  master.fromTo(pigRun, { opacity: 0 }, { opacity: 1, duration: 0.05 }, iTrot + 0.35);
  if (reducedMotion) {
    master.fromTo(
      pigRun,
      { '--trot': 0 },
      { '--trot': 0.45, duration: 0.01, immediateRender: false },
      iTrot + 0.35,
    );
  } else {
    master.fromTo(
      pigRun,
      { '--trot': 0 },
      { '--trot': 1, duration: 0.6, ease: 'none', immediateRender: false },
      iTrot + 0.35,
    );
    master.to(pigRun, { opacity: 0, duration: 0.12 }, iTrot + 0.83);
  }
  master.call(
    () =>
      pigRun?.toggleAttribute(
        'data-trotting',
        master.time() >= iTrot + 0.35 && master.time() < iLookUp,
      ),
    [],
    iTrot + 0.35,
  );
  master.call(
    () =>
      pigRun?.toggleAttribute(
        'data-trotting',
        master.time() >= iTrot + 0.35 && master.time() < iLookUp,
      ),
    [],
    iLookUp,
  );
  master.call(
    () =>
      shell.root.toggleAttribute(
        'data-holding',
        master.time() >= iNurse + 0.9 && master.time() < iTrot + 0.3,
      ),
    [],
    iTrot + 0.3,
  );

  // --- She looks up: a bough of a tree at the wood's edge, and a grin on it.
  // Under reduced motion the last beat is seen as it ends, so the cut sits in it
  // and the trot's own beat keeps its picture of the pig going into the wood.
  const up = iLookUp;
  if (reducedMotion) {
    master.to(pigRun, { opacity: 0, duration: 0.01 }, up);
  }
  master.to(world, { '--look': 1.6, duration: still(0.45), ease: 'power2.inOut' }, up + 0.05);
  master.fromTo(bough, { opacity: 0 }, { opacity: 1, duration: still(0.3) }, up + 0.2);
  master.fromTo(
    closeGrin,
    { opacity: 0 },
    { opacity: 1, duration: still(0.25) },
    reducedMotion ? up + 0.02 : up + 0.6,
  );
  wink(reducedMotion ? up : up + 0.2);

  // --- Every frame: the pointer leans the view a little.
  let px = 0;
  let py = 0;
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const k = 1 - Math.exp(-dt * 3);
    px = mix(px, shell.pointer.active ? shell.pointer.x : 0, k);
    py = mix(py, shell.pointer.active ? shell.pointer.y : 0, k);
    shell.stage.style.setProperty('--px', px.toFixed(3));
    shell.stage.style.setProperty('--py', py.toFixed(3));
  });
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
