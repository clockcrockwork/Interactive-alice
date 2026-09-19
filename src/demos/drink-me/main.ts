/**
 * Drink Me: the concept demo.
 *
 * The hall of doors is a round room in CSS 3D: the glass table in the middle, twelve
 * doors of twelve shapes round the walls, and the strange door in the ceiling she
 * fell through. We watch her fall in from the floor; she lands on us, and from then
 * on Alice is the camera: turning to see every door, kneeling at the little one,
 * coming back for the bottle. When she drinks, the whole hall scales up around the
 * floor under her feet until the table is a building, and when she eats the cake it
 * scales down until the roof arrives. Scale is the parallax. Drinking and eating are
 * hers to do, or the story does them for her.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './drink-me.css';
import { bottleSvg, cakeSvg, KEY_SVG } from './figures.ts';

const EYE = 240;
const TABLE_Z = -600;
/** The wall ring's radius round the table; the curtain panel is straight ahead. */
const RADIUS = 1100;
const CURTAIN_Z = TABLE_Z - RADIUS;

interface Camera {
  /** Scale of the hall around the floor point under the camera. */
  room: number;
  /** The hall point the camera stands at, in hall units, and how far before it. */
  z: number;
  distance: number;
  /** Eye offset from standing height, screen px; negative kneels. */
  y: number;
  pitch: number;
  /** Turning on the spot, degrees. */
  yaw: number;
  lookX: number;
  lookY: number;
}

/** Words on a label: the capitals a sentence quotes, taken from the text itself. */
function labelIn(lines: HTMLElement[]): string {
  for (const line of lines) {
    const found = /\b([A-Z]{2,}(?: [A-Z]{2,})+)\b/.exec(line.textContent ?? '');
    if (found?.[1]) {
      return found[1];
    }
  }
  return '';
}

const DOORS = [
  'curtain',
  'arched',
  'gothic',
  'round',
  'double',
  'tiny',
  'keyhole',
  'dutch',
  'square',
  'trapezoid',
  'windowed',
  'oval',
] as const;

function buildHall(
  hall: HTMLElement,
  bottleLabel: string,
  cakeLabel: string,
  tryLabel: string,
): void {
  const panels = DOORS.map((shape, i) => {
    const door =
      shape === 'curtain'
        ? '<div class="dk__curtain"></div>' +
          '<div class="dk__little-door"><div class="dk__garden"></div><div class="dk__door-leaf"></div></div>'
        : `<button type="button" class="dk__door dk__door--${shape}" style="--i: ${i}" aria-label="${tryLabel}"></button>`;
    return `<div class="dk__panel" style="--i: ${i}">${door}</div>`;
  }).join('');
  const lamps = Array.from(
    { length: 6 },
    (_, i) => `<div class="dk__lamp" style="--i: ${i}"></div>`,
  ).join('');
  const legs = [
    [-120, -80],
    [120, -80],
    [-120, 80],
    [120, 80],
  ]
    .map(([x, z]) => `<div class="dk__table-leg" style="--lx: ${x}; --lz: ${z}"></div>`)
    .join('');
  hall.innerHTML =
    '<div class="dk__ring">' +
    '<div class="dk__plane dk__floor"></div>' +
    '<div class="dk__plane dk__ceiling"><div class="dk__trapdoor"><div class="dk__trapdoor-leaf"></div></div></div>' +
    panels +
    lamps +
    '</div>' +
    `<div class="dk__table">${legs}<div class="dk__table-top"></div>` +
    `<div class="dk__key">${KEY_SVG}</div>` +
    `<div class="dk__bottle">${bottleSvg(bottleLabel)}</div>` +
    `<div class="dk__cake">${cakeSvg(cakeLabel)}</div></div>`;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iFall = cue('fall');
  const iDoors = cue('doors');
  const iLocked = cue('locked');
  const iHall = cue('hall');
  const iKey = cue('key');
  const iGarden = cue('garden');
  const iWish = cue('wish');
  const iBottle = cue('bottle');
  const iPoison = cue('poison');
  const iTaste = cue('taste');
  const iShrink = cue('shrink');
  const iSmall = cue('small');
  const iKeyLost = cue('key-lost');
  const iCry = cue('cry');
  const iCake = cue('cake');
  const iBite = cue('bite');
  const iGrow = cue('grow');

  const bottleLabel = labelIn(shell.beats[iBottle]?.lines ?? []);
  const cakeLabel = labelIn(shell.beats[iCake]?.lines ?? []);

  const world = shell.layer('dk__world');
  const hall = document.createElement('div');
  hall.className = 'dk__hall';
  hall.style.setProperty('--dk-eye', `${EYE}px`);
  buildHall(hall, bottleLabel, cakeLabel, shell.ui.demoTryDoor ?? '');
  world.append(hall);
  const irisTop = shell.layer('dk__iris dk__iris--top');
  const irisBottom = shell.layer('dk__iris dk__iris--bottom');
  const tears = shell.layer('dk__tears');
  const flavours = shell.layer('dk__flavours');
  const hands = shell.layer('dk__hands');
  hands.innerHTML =
    `<div class="dk__hand dk__hand--bottle">${bottleSvg(bottleLabel)}</div>` +
    `<div class="dk__hand dk__hand--cake">${cakeSvg(cakeLabel)}</div>`;
  const flash = shell.layer('dk__flash');
  const fallingLayer = shell.layer('dk__falling-layer');
  fallingLayer.innerHTML = `<div class="dk__falling">${figure('alice/falling')}</div>`;
  const falling = fallingLayer.querySelector<HTMLElement>('.dk__falling');
  const trapdoor = hall.querySelector<HTMLElement>('.dk__trapdoor-leaf');

  const random = seeded(19);
  tears.innerHTML = Array.from(
    { length: 14 },
    () =>
      `<div class="dk__tear" style="--x: ${(random() * 100).toFixed(1)}%; --delay: ${(-random() * 3.2).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  const flavourColours = ['oklch(62% 0.2 25)', 'oklch(88% 0.12 90)', 'oklch(70% 0.12 60)'];
  flavours.innerHTML = Array.from(
    { length: 12 },
    (_, i) =>
      `<div class="dk__flavour" style="--x: ${(20 + random() * 60).toFixed(1)}%; --s: ${(3 + random() * 4).toFixed(1)}vmin; --c: ${flavourColours[i % 3]}; --delay: ${(-random() * 2.8).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');

  const garden = hall.querySelector<HTMLElement>('.dk__garden');
  const doorLeaf = hall.querySelector<HTMLElement>('.dk__door-leaf');
  const bottle = hall.querySelector<HTMLElement>('.dk__bottle');
  const cake = hall.querySelector<HTMLElement>('.dk__cake');
  const handBottle = hands.querySelector<HTMLElement>('.dk__hand--bottle');
  const handCake = hands.querySelector<HTMLElement>('.dk__hand--cake');

  // --- The camera.
  // We start on the floor under the strange door, looking straight up at it.
  const camera: Camera = {
    room: 1,
    z: TABLE_Z,
    distance: 0,
    y: 0,
    pitch: 80,
    yaw: 0,
    lookX: 0,
    lookY: 0,
  };
  const apply = (): void => {
    hall.style.setProperty('--room', camera.room.toFixed(4));
    // The eye sits the perspective distance (900px) in front of the hall's plane.
    hall.style.setProperty('--cam-z', (900 - camera.z * camera.room - camera.distance).toFixed(1));
    hall.style.setProperty('--cam-y', camera.y.toFixed(1));
    hall.style.setProperty('--cam-pitch', camera.pitch.toFixed(2));
    hall.style.setProperty('--yaw', camera.yaw.toFixed(2));
    hall.style.setProperty('--look-x', camera.lookX.toFixed(2));
    hall.style.setProperty('--look-y', camera.lookY.toFixed(2));
  };
  apply();
  const move = (at: number, to: Partial<Camera>, duration = 0.7, ease = 'power2.inOut'): void => {
    master.to(
      camera,
      { ...to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: apply },
      at,
    );
    if (reducedMotion) {
      // A cut with a blink rather than a walk.
      master.fromTo(flash, { opacity: 0.6 }, { opacity: 0, duration: 0.2 }, at);
    }
  };

  // --- She falls in through the strange door in the ceiling. We watch from the
  // floor, looking up; she lands on us, and from then on we are Alice.
  master.to(trapdoor, { '--open': 1, duration: 0.35, ease: 'back.out(1.6)' }, iFall + 0.05);
  master.fromTo(
    falling,
    { opacity: 0, scale: 0.15, rotation: -20, y: '-10vh' },
    { opacity: 1, scale: 3.2, rotation: 400, y: '30vh', duration: 0.6, ease: 'power2.in' },
    iFall + 0.2,
  );
  master.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.05 }, iFall + 0.8);
  master.set(falling, { opacity: 0 }, iFall + 0.82);
  master.to(flash, { opacity: 0, duration: 0.5 }, iFall + 0.85);
  master.to(trapdoor, { '--open': 0.1, duration: 0.3 }, iFall + 0.9);
  move(iFall + 0.85, { pitch: 0 }, 0.5);
  // Doors all round: a slow turn on the spot to see every one, then every one locked.
  move(iDoors, { yaw: 360, z: TABLE_Z + 150, distance: 0 }, 1.9, 'sine.inOut');
  master.call(
    () => hall.toggleAttribute('data-locked', master.time() >= iLocked + 0.1),
    [],
    iLocked + 0.1,
  );
  master.call(() => hall.toggleAttribute('data-locked', master.time() < iHall), [], iHall);
  move(iHall, { yaw: 360, z: TABLE_Z - 200, distance: 0 }, 0.8);
  move(iKey, { z: TABLE_Z, distance: 330, pitch: -18 }, 0.7);
  move(iGarden, { z: CURTAIN_Z, distance: 260, y: -150, pitch: 4 });
  master.to(doorLeaf, { '--open': 1, duration: 0.4 }, iGarden + 0.3);
  master.to(garden, { opacity: 1, duration: 0.4 }, iGarden + 0.3);
  if (!reducedMotion) {
    master.to(irisTop, { '--fold': 0.35, duration: 0.3, yoyo: true, repeat: 1 }, iWish + 0.2);
    master.to(irisBottom, { '--fold': 0.35, duration: 0.3, yoyo: true, repeat: 1 }, iWish + 0.2);
  }
  move(iBottle, { z: TABLE_Z, distance: 300, y: 0, pitch: -12 });
  master.fromTo(bottle, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, iBottle + 0.3);
  if (!reducedMotion) {
    master.to(bottle, { rotation: 8, duration: 0.15, yoyo: true, repeat: 3 }, iPoison + 0.2);
  }

  // --- Drinking. The bottle comes to hand; press it or the button, and it drains.
  // The story drinks it anyway before the beat is out.
  const drinkButton = shell.prop(shell.ui.demoDrink ?? '', 'dk__prop');
  let drunk = false;
  const drink = (): void => {
    if (drunk || !handBottle) {
      return;
    }
    drunk = true;
    handBottle.setAttribute('data-held', '');
    drinkButton.hide();
    gsap.to(handBottle, {
      rotation: -60,
      y: -40,
      duration: reducedMotion ? 0 : 0.6,
      ease: 'power2.inOut',
    });
    gsap.to(handBottle, {
      '--fill': 0,
      duration: reducedMotion ? 0 : 1.1,
      delay: reducedMotion ? 0 : 0.4,
    });
    gsap.to(flavours, { opacity: 1, duration: 0.3 });
  };
  handBottle?.addEventListener('click', drink);
  drinkButton.addEventListener('click', drink);
  master.to(bottle, { opacity: 0, duration: 0.1 }, iTaste);
  master.fromTo(handBottle, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.3 }, iTaste);
  master.call(
    () => (master.time() >= iTaste + 0.05 ? drinkButton.show() : drinkButton.hide()),
    [],
    iTaste + 0.05,
  );
  master.call(() => (master.time() >= iTaste + 0.7 ? drink() : undefined), [], iTaste + 0.7);
  master.to(flavours, { opacity: 0, duration: 0.3 }, iShrink + 0.3);
  master.to(handBottle, { opacity: 0, y: 80, duration: 0.3 }, iShrink);

  // --- Folding up like a telescope: the hall grows around her feet, the view
  // folds in from the top and the bottom, and lets go a little smaller.
  master.to(
    camera,
    {
      room: 5.5,
      distance: 300 * 5.5,
      duration: reducedMotion ? 0.01 : 0.9,
      ease: reducedMotion ? 'none' : 'power3.inOut',
      onUpdate: apply,
    },
    iShrink + 0.05,
  );
  if (reducedMotion) {
    master.fromTo(flash, { opacity: 0.6 }, { opacity: 0, duration: 0.3 }, iShrink + 0.05);
  } else {
    master.to(
      [irisTop, irisBottom],
      { '--fold': 0.7, duration: 0.5, ease: 'power2.in' },
      iShrink + 0.05,
    );
    master.to(
      [irisTop, irisBottom],
      { '--fold': 0, duration: 0.35, ease: 'power2.out' },
      iShrink + 0.6,
    );
  }
  move(iSmall, { z: CURTAIN_Z, distance: 80 * 5.5, y: 0, pitch: 6 }, 0.9);
  move(iKeyLost, { z: TABLE_Z, distance: 60 * 5.5, pitch: 26 }, 0.8);
  master.to(tears, { opacity: 1, duration: 0.4 }, iCry);
  master.to(tears, { opacity: 0, duration: 0.4 }, iCake);
  move(iCake, { pitch: 8, distance: 20 * 5.5 }, 0.6);
  master.fromTo(cake, { opacity: 0 }, { opacity: 1, duration: 0.3 }, iCake + 0.2);

  // --- Eating: one bite, then the whole cake.
  const eatButton = shell.prop(shell.ui.demoEat ?? '', 'dk__prop');
  let bites = 0;
  const eat = (): void => {
    if (!handCake || bites >= 2) {
      return;
    }
    bites += 1;
    handCake.setAttribute('data-held', '');
    gsap.to(handCake, { '--bites': 1, duration: reducedMotion ? 0 : 0.3 });
    gsap.fromTo(
      handCake,
      { y: 0 },
      { y: -30, duration: reducedMotion ? 0 : 0.2, yoyo: true, repeat: 1 },
    );
    if (bites === 2) {
      eatButton.hide();
      gsap.to(handCake, {
        scale: 0.2,
        opacity: 0,
        duration: reducedMotion ? 0 : 0.5,
        ease: 'power2.in',
      });
    }
  };
  handCake?.addEventListener('click', eat);
  eatButton.addEventListener('click', eat);
  master.to(cake, { opacity: 0, duration: 0.1 }, iBite);
  master.fromTo(handCake, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.3 }, iBite);
  master.call(
    () => (master.time() >= iBite + 0.05 ? eatButton.show() : eatButton.hide()),
    [],
    iBite + 0.05,
  );
  master.call(() => (master.time() >= iBite + 0.7 ? eat() : undefined), [], iBite + 0.7);
  master.call(
    () => {
      if (master.time() >= iGrow + 0.6) {
        eat();
        eat();
      }
    },
    [],
    iGrow + 0.6,
  );

  // --- Growing: the hall comes down to a normal size and then keeps coming.
  master.to(
    camera,
    {
      room: 0.45,
      distance: 200 * 0.45,
      y: 0,
      pitch: 12,
      duration: reducedMotion ? 0.01 : 0.35,
      ease: reducedMotion ? 'none' : 'power4.in',
      onUpdate: apply,
    },
    iGrow + 0.65,
  );
  master.fromTo(flash, { opacity: 0 }, { opacity: 0.9, duration: 0.05 }, iGrow + 0.98);
  master.to(flash, { opacity: 0, duration: 0.4 }, iGrow + 1.03);

  // --- The key. Take it off the table and it hangs in her hand; try it in any
  // door and the door will not have it, until the little one, which opens.
  const keyOnTable = hall.querySelector<HTMLElement>('.dk__key');
  const keyInHand = document.createElement('div');
  keyInHand.className = 'dk__hand dk__hand--key';
  keyInHand.innerHTML = KEY_SVG;
  hands.append(keyInHand);
  const keyButton = shell.prop(shell.ui.demoTakeKey ?? '', 'dk__prop dk__prop--key');
  let hasKey = false;
  const takeKey = (): void => {
    if (hasKey) {
      return;
    }
    hasKey = true;
    keyButton.hide();
    gsap.to(keyOnTable, { opacity: 0, duration: 0.2 });
    gsap.fromTo(
      keyInHand,
      { opacity: 0, y: 120, rotation: -30 },
      { opacity: 1, y: 0, rotation: -12, duration: reducedMotion ? 0 : 0.5, ease: 'power3.out' },
    );
  };
  keyButton.addEventListener('click', takeKey);
  keyOnTable?.addEventListener('click', takeKey);
  master.call(
    () =>
      master.time() >= iKey && master.time() < iKey + 0.8 && !hasKey
        ? keyButton.show()
        : keyButton.hide(),
    [],
    iKey,
  );
  master.call(() => (master.time() >= iKey + 0.8 ? takeKey() : keyButton.hide()), [], iKey + 0.8);
  master.to(keyInHand, { opacity: 0, y: 80, duration: 0.3 }, iBottle);
  const keyOpens = (): void => {
    shell.sound.play('chime');
    gsap.fromTo(
      keyInHand,
      { rotation: -12 },
      { rotation: 60, duration: reducedMotion ? 0 : 0.35, yoyo: true, repeat: 1 },
    );
    gsap.to(doorLeaf, { '--open': 1, duration: reducedMotion ? 0 : 0.5, delay: 0.3 });
    gsap.to(garden, { opacity: 1, duration: reducedMotion ? 0 : 0.5, delay: 0.3 });
  };
  const littleDoor = hall.querySelector<HTMLElement>('.dk__little-door');
  littleDoor?.addEventListener('click', () => {
    if (hasKey) {
      keyOpens();
    }
  });

  // --- Every door can be tried, and every one is locked: the knob jiggles and the
  // whole hall gives a little thud. With the key in hand, it is tried in the lock.
  for (const door of hall.querySelectorAll<HTMLElement>('.dk__door')) {
    door.addEventListener('click', () => {
      shell.sound.play('thud', 0.5);
      if (hasKey) {
        gsap.fromTo(
          keyInHand,
          { rotation: -12 },
          { rotation: 20, duration: reducedMotion ? 0 : 0.15, yoyo: true, repeat: 3 },
        );
      }
      door.removeAttribute('data-tried');
      void door.offsetWidth;
      door.setAttribute('data-tried', '');
      if (!reducedMotion) {
        gsap.fromTo(
          camera,
          { lookY: -1.5 },
          { lookY: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)', onUpdate: apply },
        );
      }
    });
  }

  // --- Looking about: the pointer turns her head a little.
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const k = Math.min(1, dt * 3);
    const targetX = shell.pointer.active ? shell.pointer.x * 7 : 0;
    const targetY = shell.pointer.active ? -shell.pointer.y * 4 : 0;
    camera.lookX = mix(camera.lookX, targetX, k);
    camera.lookY = mix(camera.lookY, targetY, k);
    apply();
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
