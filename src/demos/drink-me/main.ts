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
 *
 * It opens on the rabbit hole's last frame, the strange door from above, open on
 * this hall's floor (drawn once in `../rabbit-hole/trapdoor.ts`), and falls through.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { TUNNEL_DOORS, trapdoorHtml } from '../rabbit-hole/trapdoor.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './drink-me.css';
import {
  BOTTLE_GLASS_SVG,
  bottleSvg,
  cakeSvg,
  KEY_SVG,
  type LabelLayout,
  labelFaceSvg,
} from './figures.ts';
import { labelIn } from './label.ts';

const EYE = 240;
const TABLE_Z = -600;
/** The wall ring's radius round the table; the curtain panel is straight ahead. */
const RADIUS = 1100;
const CURTAIN_Z = TABLE_Z - RADIUS;
/** Under the table, ten inches tall: how far from its middle she stands, how far
 *  up she looks, how high she gets up a leg, and how low she sits to cry. */
const KEY_LOST = { distance: 520, pitch: 40, climb: 240, sit: -70 };

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
  /** The lens: the perspective distance in px. Shorter is wider. */
  persp: number;
  /** Her stoop toward the curtain while peeking: the reader's, never the story's. */
  peekY: number;
  peekDistance: number;
  peekPitch: number;
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
  layout: LabelLayout,
): void {
  const panels = DOORS.map((shape, i) => {
    const door =
      shape === 'curtain'
        ? '<div class="dk__little-door"><div class="dk__garden"></div>' +
          '<div class="dk__door-leaf"><div class="dk__keyhole"></div><div class="dk__keyhole-glow"></div></div></div>' +
          '<div class="dk__curtain"></div>'
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
    `<div class="dk__bottle">${bottleSvg(bottleLabel, layout)}</div>` +
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
  const iRoof = cue('roof');

  const bottleLabel = labelIn(shell.beats[iBottle]?.lines ?? [], shell.profile.setApart);
  const cakeLabel = labelIn(shell.beats[iCake]?.lines ?? [], shell.profile.setApart);

  const world = shell.layer('dk__world');
  const hall = document.createElement('div');
  hall.className = 'dk__hall';
  hall.style.setProperty('--dk-eye', `${EYE}px`);
  buildHall(hall, bottleLabel, cakeLabel, shell.ui.demoTryDoor ?? '', shell.profile);
  world.append(hall);
  // Over the hall, under everything of hers: the dim that takes the room toward the
  // pool's colours at the end, so the next page's first frame is the same room.
  const dim = shell.layer('dk__dim');
  const irisTop = shell.layer('dk__iris dk__iris--top');
  const irisBottom = shell.layer('dk__iris dk__iris--bottom');
  const tears = shell.layer('dk__tears');
  const flavours = shell.layer('dk__flavours');
  const selfLayer = shell.layer('dk__self-layer');
  selfLayer.innerHTML = `<div class="dk__self">${figure('alice/looking-down')}</div>`;
  const self = selfLayer.querySelector<HTMLElement>('.dk__self');
  // Her first tears once she has grown: a few, big, falling past her own skirt.
  const giantTears = shell.layer('dk__tears dk__tears--giant');
  const hands = shell.layer('dk__hands');
  // The bottle in her hand: the glass is round, so it looks the same from every
  // side; only the paper label round its neck turns, and every side of it says
  // the same words.
  const labelFaces = Array.from(
    { length: 4 },
    (_, i) =>
      `<span class="dk__label-face" style="--k: ${i}">${labelFaceSvg(bottleLabel, shell.profile)}</span>`,
  ).join('');
  hands.innerHTML =
    `<div class="dk__hand dk__hand--bottle"><div class="dk__turn">${BOTTLE_GLASS_SVG}<div class="dk__label-ring">${labelFaces}</div></div></div>` +
    `<div class="dk__hand dk__hand--cake"><div class="dk__bite-wrap">${cakeSvg(cakeLabel)}</div></div>`;
  const flash = shell.layer('dk__flash');
  const fallingLayer = shell.layer('dk__falling-layer');
  fallingLayer.innerHTML = `<div class="dk__falling">${figure('alice/falling')}</div>`;
  const falling = fallingLayer.querySelector<HTMLElement>('.dk__falling');
  const trapdoor = hall.querySelector<HTMLElement>('.dk__trapdoor-leaf');
  // Over everything, at first: the rabbit hole's last frame, the strange door from
  // above, open on this hall's floor. The page falls through it.
  const arrival = shell.layer('dk__arrival trapdoor-shaft');
  arrival.innerHTML = trapdoorHtml(TUNNEL_DOORS - 1, 'dk__arrival-door');
  arrival.querySelector('.trapdoor')?.setAttribute('data-open', '');

  const random = seeded(19);
  tears.innerHTML = Array.from(
    { length: 14 },
    () =>
      `<div class="dk__tear" style="--x: ${(random() * 100).toFixed(1)}%; --delay: ${(-random() * 3.2).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  giantTears.innerHTML = Array.from(
    { length: 7 },
    () =>
      `<div class="dk__tear" style="--x: ${(8 + random() * 84).toFixed(1)}%; --delay: ${(-random() * 2.4).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  // The tastes, in the interaction colours: they rise while she drinks and go.
  const flavourColours = ['var(--ix-coral)', 'var(--ix-gold)', 'var(--ix-mint)'];
  flavours.innerHTML = Array.from(
    { length: 12 },
    (_, i) =>
      `<div class="dk__flavour" style="--x: ${(20 + random() * 60).toFixed(1)}%; --s: ${(3 + random() * 4).toFixed(1)}vmin; --c: ${flavourColours[i % 3]}; --delay: ${(-random() * 2.8).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');

  const garden = hall.querySelector<HTMLElement>('.dk__garden');
  const doorLeaf = hall.querySelector<HTMLElement>('.dk__door-leaf');
  const curtain = hall.querySelector<HTMLElement>('.dk__curtain');
  const keyholeGlow = hall.querySelector<HTMLElement>('.dk__keyhole-glow');
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
    persp: 900,
    peekY: 0,
    peekDistance: 0,
    peekPitch: 0,
  };
  // Her climb up the table leg when the reader tries it: hers, never the story's,
  // and its own object, so the story's camera tweens and hers never meet.
  const climbCam = { y: 0, pitch: 0 };
  const apply = (): void => {
    world.style.setProperty('--persp', camera.persp.toFixed(1));
    hall.style.setProperty('--room', camera.room.toFixed(4));
    // The eye sits the perspective distance in front of the hall's plane, and the
    // hall scales about that eye, so the point she stands at lands on it when the
    // hall is moved by (persp - z) scaled, less how far before it she is.
    hall.style.setProperty(
      '--cam-z',
      ((camera.persp - camera.z) * camera.room - camera.distance - camera.peekDistance).toFixed(1),
    );
    hall.style.setProperty('--cam-y', (camera.y + camera.peekY + climbCam.y).toFixed(1));
    hall.style.setProperty(
      '--cam-pitch',
      (camera.pitch + camera.peekPitch + climbCam.pitch).toFixed(2),
    );
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

  // --- The page opens on the rabbit hole's last frame: the strange door from
  // above, open on this floor. We fall through it and turn to look up at it, open,
  // as she tumbles out of it; she lands on us, and from then on we are Alice.
  gsap.set(trapdoor, { '--open': 1 });
  master.fromTo(
    arrival,
    { scale: 1, opacity: 1 },
    {
      scale: reducedMotion ? 1 : 4.5,
      opacity: 0,
      duration: reducedMotion ? 0.01 : 0.24,
      ease: 'power2.in',
      immediateRender: false,
    },
    iFall + 0.02,
  );
  if (reducedMotion) {
    // A still: she is through the door and half way down, held in mid-tumble.
    master.set(falling, { opacity: 1, scale: 1.3, rotation: 24, y: '12vh' }, iFall + 0.2);
  } else {
    // Out of the open door's dark, tumbling, larger and larger until she lands on us.
    master.fromTo(
      falling,
      { opacity: 0 },
      { opacity: 1, duration: 0.06, immediateRender: false },
      iFall + 0.2,
    );
    master.fromTo(
      falling,
      { scale: 0.2, rotation: -20, y: '14vh' },
      { scale: 3.2, rotation: 400, y: '36vh', duration: 0.6, ease: 'power2.in' },
      iFall + 0.2,
    );
  }
  master.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.05 }, iFall + 0.8);
  master.set(falling, { opacity: 0 }, iFall + 0.82);
  master.to(flash, { opacity: 0, duration: 0.5 }, iFall + 0.85);
  master.fromTo(
    trapdoor,
    { '--open': 1 },
    { '--open': 0.1, duration: 0.3, immediateRender: false },
    iFall + 0.9,
  );
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
  move(iKey, { z: TABLE_Z, distance: 330, pitch: -18 }, 0.45);
  // The low curtain hides the little door until the story finds it with the key.
  // The story's lift and the reader's peek are two objects; `applyCurtain`
  // combines them, and the story's wins.
  const storyCurtain = { lift: 0 };
  const peek = { lift: 0, glow: 0, sway: 0, fade: 1 };
  const STORY_LIFT_AT = iKey;
  const applyCurtain = (): void => {
    const lift = Math.max(storyCurtain.lift, peek.lift);
    curtain?.style.setProperty('--curtain-lift', lift.toFixed(3));
    curtain?.style.setProperty('--curtain-sway', peek.sway.toFixed(3));
    curtain?.style.setProperty('--curtain-fade', peek.fade.toFixed(3));
    keyholeGlow?.style.setProperty('--peek-glow', peek.glow.toFixed(3));
  };
  applyCurtain();
  master.to(
    storyCurtain,
    {
      lift: 1,
      duration: reducedMotion ? 0.01 : 0.3,
      ease: 'power2.out',
      onUpdate: applyCurtain,
    },
    STORY_LIFT_AT,
  );
  move(iGarden, { z: CURTAIN_Z, distance: 260, y: -150, pitch: 4 });
  master.to(doorLeaf, { '--open': 1, duration: 0.4 }, iGarden + 0.3);
  master.to(garden, { opacity: 1, duration: 0.4 }, iGarden + 0.3);
  if (!reducedMotion) {
    master.to(irisTop, { '--fold': 0.35, duration: 0.3, yoyo: true, repeat: 1 }, iWish + 0.2);
    master.to(irisBottom, { '--fold': 0.35, duration: 0.3, yoyo: true, repeat: 1 }, iWish + 0.2);
  }
  move(iBottle, { z: TABLE_Z, distance: 300, y: 0, pitch: -12 });
  master.fromTo(bottle, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, iBottle + 0.3);

  // --- She picks the bottle up to look it over for the word poison. The story
  // turns it once round in her hand; Turn the bottle round, a tap on it or a drag
  // across it turns it more. Every side has the same label, and nothing else.
  // The story's turn and the reader's are two objects, added, so neither ever
  // stops or undoes the other.
  const handTurn = handBottle?.querySelector<HTMLElement>('.dk__turn');
  const storyTurn = { turn: 0 };
  const readerTurn = { turn: 0 };
  const applyTurn = (): void => {
    handTurn?.style.setProperty('--turn', (storyTurn.turn + readerTurn.turn).toFixed(1));
  };
  applyTurn();
  master.to(bottle, { opacity: 0, duration: 0.1 }, iPoison);
  // Held up to the light to be looked over, above the sentences; lowered to drink.
  master.fromTo(
    handBottle,
    { opacity: 0, y: 120 },
    { opacity: 1, y: '-22vh', duration: 0.3, immediateRender: false },
    iPoison,
  );
  master.to(handBottle, { y: 0, duration: 0.25, ease: 'power1.inOut' }, iTaste);
  // Under reduced motion the story's look round is a still: caught between two
  // sides, both of them saying the same thing.
  master.to(
    storyTurn,
    {
      turn: reducedMotion ? 45 : 360,
      duration: reducedMotion ? 0.01 : 0.5,
      ease: 'sine.inOut',
      onUpdate: applyTurn,
    },
    iPoison + 0.2,
  );
  // The drink's button first, so it leads the props in the document as before.
  const drinkButton = shell.prop(shell.ui.demoDrink ?? '', 'dk__prop dk__prop--drink');
  const turnButton = shell.prop(shell.ui.demoTurnBottle ?? '', 'dk__prop dk__prop--turn');
  const inPoison = (): boolean => master.time() >= iPoison && master.time() < iTaste;
  const turnBottle = (by = reducedMotion ? 90 : 360): void => {
    if (!inPoison()) {
      return;
    }
    shell.sound.play('glass', 0.3);
    gsap.to(readerTurn, {
      turn: readerTurn.turn + by,
      duration: reducedMotion ? 0 : 1.2,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onUpdate: applyTurn,
    });
  };
  turnButton.addEventListener('click', () => turnBottle());
  // A drag across the bottle turns it by hand, as far as the finger goes.
  let dragFrom: number | undefined;
  let dragged = false;
  handBottle?.addEventListener('pointerdown', (event) => {
    if (!inPoison()) {
      return;
    }
    dragFrom = event.clientX;
    dragged = false;
    handBottle.setPointerCapture(event.pointerId);
  });
  handBottle?.addEventListener('pointermove', (event) => {
    if (dragFrom === undefined) {
      return;
    }
    const dx = event.clientX - dragFrom;
    if (Math.abs(dx) > 6) {
      dragged = true;
      dragFrom = event.clientX;
      gsap.killTweensOf(readerTurn);
      readerTurn.turn += dx * (reducedMotion ? 0 : 0.9);
      applyTurn();
    }
  });
  const dragEnd = (): void => {
    dragFrom = undefined;
  };
  handBottle?.addEventListener('pointerup', dragEnd);
  handBottle?.addEventListener('pointercancel', dragEnd);
  const showTurn = (): void => {
    inPoison() ? turnButton.show() : turnButton.hide();
  };
  master.call(showTurn, [], iPoison);
  master.call(showTurn, [], iTaste);
  // Scrolled back above the bottle, the turns are forgotten.
  master.call(
    () => {
      if (master.time() < iPoison) {
        gsap.killTweensOf(readerTurn);
        readerTurn.turn = 0;
        applyTurn();
      }
    },
    [],
    iPoison,
  );

  // --- Drinking. Press it or the button, and it drains; the story drinks it anyway
  // before the beat is out. The tilt and the level are on the bottle's inside, so
  // the story's coming and going of the bottle never fights them, and scrolling
  // back above the taste puts the bottle back full.
  let drunk = false;
  const drink = (): void => {
    if (drunk || !handBottle || !handTurn) {
      return;
    }
    drunk = true;
    handBottle.setAttribute('data-held', '');
    drinkButton.hide();
    gsap.to(handTurn, {
      rotation: -60,
      y: -40,
      duration: reducedMotion ? 0 : 0.6,
      ease: 'power2.inOut',
    });
    gsap.to(handTurn, {
      '--fill': 0,
      duration: reducedMotion ? 0 : 1.1,
      delay: reducedMotion ? 0 : 0.4,
    });
    gsap.to(flavours, { '--show': 1, duration: 0.3 });
  };
  const undrink = (): void => {
    if (!drunk || !handTurn) {
      return;
    }
    drunk = false;
    handBottle?.removeAttribute('data-held');
    gsap.killTweensOf(handTurn);
    gsap.killTweensOf(flavours, '--show');
    gsap.set(handTurn, { rotation: 0, y: 0, '--fill': 1 });
    gsap.set(flavours, { '--show': 0 });
  };
  handBottle?.addEventListener('click', () => {
    if (dragged) {
      dragged = false;
      return;
    }
    if (inPoison()) {
      turnBottle();
    } else if (master.time() >= iTaste) {
      drink();
    }
  });
  drinkButton.addEventListener('click', drink);
  // A hand takes taps only while what it holds is there to be tapped.
  const live = (el: HTMLElement | null, from: number, to: number): void => {
    const fn = (): void => {
      el?.toggleAttribute('data-live', master.time() >= from && master.time() < to);
    };
    master.call(fn, [], from);
    master.call(fn, [], to);
  };
  live(handBottle, iPoison, iShrink);
  // The story drinks at its moment; going back past it, the bottle is full again.
  const settleDrink = (): void => {
    const t = master.time();
    if (t >= iTaste + 0.7) {
      drink();
    } else {
      undrink();
    }
    t >= iTaste + 0.05 && !drunk ? drinkButton.show() : drinkButton.hide();
  };
  master.call(settleDrink, [], iTaste + 0.05);
  master.call(settleDrink, [], iTaste + 0.7);
  // The drink shows them and the story fades them, on two properties, so neither
  // tween undoes the other.
  master.to(flavours, { '--fade': 0, duration: 0.3 }, iShrink + 0.3);
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
  // --- "She had left the little golden key on the table. She could see it through
  // the glass top." She walks back under the table and looks straight up through
  // the glass at the key, the legs towering round her. "She tried to climb a table
  // leg": the story makes her try once, up and sliding back; Climb the table leg
  // lets the reader try again, with the same end.
  move(iKeyLost, { z: TABLE_Z, distance: KEY_LOST.distance, y: 0, pitch: KEY_LOST.pitch }, 0.45);
  const climbUp = KEY_LOST.climb;
  if (reducedMotion) {
    // A still: half way up the leg, looking at the key; she is down again, sitting,
    // at the next beat.
    master.to(
      camera,
      { y: climbUp * 0.6, pitch: KEY_LOST.pitch - 7, duration: 0.01, onUpdate: apply },
      iKeyLost + 0.5,
    );
  } else {
    // Up the leg, looking a little less steeply as she nears the glass, so the key
    // stays in sight above her; then down again, all at once.
    master.to(
      camera,
      {
        y: climbUp,
        pitch: KEY_LOST.pitch - 12,
        duration: 0.18,
        ease: 'power1.out',
        onUpdate: apply,
      },
      iKeyLost + 0.55,
    );
    master.to(
      camera,
      { y: 0, pitch: KEY_LOST.pitch, duration: 0.14, ease: 'power3.in', onUpdate: apply },
      iKeyLost + 0.76,
    );
  }
  const climbButton = shell.prop(shell.ui.demoClimbLeg ?? '', 'dk__prop dk__prop--climb');
  // Offered once she is under the table, looking up at the key.
  const climbFrom = iKeyLost + 0.45;
  const inKeyLost = (): boolean => master.time() >= climbFrom && master.time() < iCry;
  let climbing = false;
  let slideTimer = 0;
  const climb = (): void => {
    if (climbing || !inKeyLost()) {
      return;
    }
    climbing = true;
    const slide = (): void => {
      shell.sound.play('thud', 0.35);
      gsap.to(climbCam, {
        y: 0,
        pitch: 0,
        duration: reducedMotion ? 0 : 0.45,
        ease: 'power3.in',
        overwrite: 'auto',
        onUpdate: apply,
        onComplete: () => {
          climbing = false;
        },
      });
    };
    gsap.to(climbCam, {
      y: climbUp * 0.8,
      pitch: -10,
      duration: reducedMotion ? 0 : 1.1,
      ease: 'power1.out',
      overwrite: 'auto',
      onUpdate: apply,
      onComplete: () => {
        slideTimer = window.setTimeout(slide, reducedMotion ? 800 : 250);
      },
    });
  };
  climbButton.addEventListener('click', climb);
  const showClimb = (): void => {
    if (inKeyLost()) {
      climbButton.show();
    } else {
      climbButton.hide();
      window.clearTimeout(slideTimer);
      gsap.killTweensOf(climbCam);
      climbCam.y = 0;
      climbCam.pitch = 0;
      climbing = false;
      apply();
    }
  };
  master.call(showClimb, [], climbFrom);
  master.call(showClimb, [], iCry);

  // --- She sat down and cried: the eye drops to sitting, the floor and the
  // table's foot before her, and her tears fall.
  move(iCry, { y: KEY_LOST.sit, pitch: -4, distance: KEY_LOST.distance + 260 }, 0.6);
  master.to(tears, { opacity: 1, duration: 0.4 }, iCry);
  master.to(tears, { opacity: 0, duration: 0.4 }, iCake);
  move(iCake, { y: 0, pitch: 8, distance: 20 * 5.5 }, 0.6);
  master.fromTo(cake, { opacity: 0 }, { opacity: 1, duration: 0.3 }, iCake + 0.2);

  // --- Eating: one bite, then the whole cake. The bites are on the cake's inside,
  // so the story's coming and going of it never fights them, and scrolling back
  // above the bite puts the cake back whole.
  const eatButton = shell.prop(shell.ui.demoEat ?? '', 'dk__prop');
  const cakeInside = handCake?.querySelector<HTMLElement>('.dk__bite-wrap');
  let bites = 0;
  const eat = (): void => {
    if (!handCake || !cakeInside || bites >= 2) {
      return;
    }
    bites += 1;
    handCake.setAttribute('data-held', '');
    gsap.to(cakeInside, { '--bites': 1, duration: reducedMotion ? 0 : 0.3 });
    gsap.fromTo(
      cakeInside,
      { y: 0 },
      { y: -30, duration: reducedMotion ? 0 : 0.2, yoyo: true, repeat: reducedMotion ? 0 : 1 },
    );
    if (bites === 2) {
      eatButton.hide();
      gsap.to(cakeInside, {
        scale: 0.2,
        opacity: 0,
        duration: reducedMotion ? 0 : 0.5,
        ease: 'power2.in',
      });
    }
  };
  // The story's bites, as a function of where the page is: none before her first,
  // one through "nothing happened", the whole cake at the roof. Going forward she
  // eats up to them; going back the cake is put back to them, still.
  const storyBites = (): number => {
    const t = master.time();
    return t >= iRoof + 0.05 ? 2 : t >= iBite + 0.7 ? 1 : 0;
  };
  const settleBites = (): void => {
    const want = storyBites();
    if (want > bites) {
      while (bites < want) {
        eat();
      }
    } else if (want < bites && cakeInside) {
      bites = want;
      handCake?.toggleAttribute('data-held', want > 0);
      gsap.killTweensOf(cakeInside);
      gsap.set(cakeInside, { '--bites': want > 0 ? 1 : 0, y: 0, scale: 1, opacity: 1 });
    }
    const t = master.time();
    t >= iBite + 0.05 && t < iRoof + 0.05 && bites < 2 ? eatButton.show() : eatButton.hide();
  };
  handCake?.addEventListener('click', eat);
  eatButton.addEventListener('click', eat);
  master.to(cake, { opacity: 0, duration: 0.1 }, iBite);
  master.fromTo(handCake, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.3 }, iBite);
  live(handCake, iBite, iRoof + 0.4);
  for (const at of [iBite + 0.05, iBite + 0.7, iRoof + 0.05]) {
    master.call(settleBites, [], at);
  }

  // --- Growing: nothing happens for a beat, as the text says; then she finishes
  // the cake, and the hall comes down to a normal size and then keeps coming.
  master.to(
    camera,
    {
      room: 0.45,
      distance: 200 * 0.45,
      y: 0,
      pitch: 12,
      duration: reducedMotion ? 0.01 : 0.3,
      ease: reducedMotion ? 'none' : 'power4.in',
      onUpdate: apply,
    },
    iRoof + 0.1,
  );
  master.fromTo(flash, { opacity: 0 }, { opacity: 0.9, duration: 0.05 }, iRoof + 0.38);
  master.to(flash, { opacity: 0, duration: 0.4 }, iRoof + 0.43);
  // And keeps coming. Her eye ends just under the ceiling, looking down at a toy
  // table and dolls' doors through a lens that widens as she goes up; her own
  // skirt and shoes rise into the bottom of the frame, and her head meets the
  // roof with a thud.
  master.to(
    camera,
    {
      room: 0.3,
      distance: 60,
      y: 10,
      pitch: -28,
      persp: 420,
      duration: reducedMotion ? 0.01 : 0.4,
      ease: reducedMotion ? 'none' : 'power2.in',
      onUpdate: apply,
    },
    iRoof + 0.45,
  );
  master.fromTo(
    self,
    { yPercent: 110, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: reducedMotion ? 0.01 : 0.35, ease: 'power2.out' },
    iRoof + 0.55,
  );
  master.to(
    irisTop,
    { '--fold': 0.55, duration: reducedMotion ? 0.01 : 0.3, ease: 'power3.in' },
    iRoof + 0.62,
  );
  master.call(
    () => {
      if (master.time() >= iRoof + 0.85) {
        shell.sound.play('thud');
        if (!reducedMotion) {
          gsap.fromTo(
            camera,
            { lookY: -3 },
            { lookY: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)', onUpdate: apply },
          );
        }
      }
    },
    [],
    iRoof + 0.85,
  );
  // And, head against the roof, she begins to cry: the first big tears fall past
  // her skirt and the hall dims toward the pool of tears, which opens on this
  // same view. Under reduced motion the tears hang still and only the dim moves.
  master.to(dim, { opacity: 1, duration: 0.28, ease: 'power1.inOut' }, iRoof + 0.72);
  master.to(giantTears, { opacity: 1, duration: 0.2 }, iRoof + 0.8);

  // --- Peeking behind the curtain early. From the hall beat until the story lifts
  // the curtain itself, the curtain or the button lifts it a little: the little
  // door shows, the garden glows through its keyhole, and it drops back after a
  // moment. Pressing the button again, or keeping the pointer on the curtain, keeps
  // it up; it drops when let go or when the scroll moves to another beat.
  const peekButton = shell.prop(shell.ui.demoPeekCurtain ?? '', 'dk__prop dk__prop--peek');
  const PEEK_LIFT = 0.7;
  const PEEK_MOMENT = 1400;
  let peekUp = false;
  let peekPinned = false;
  let pressHeld = false;
  let peekBeat = -1;
  let peekTimer = 0;
  const storyHasCurtain = (): boolean =>
    storyCurtain.lift > 0 || master.time() >= STORY_LIFT_AT || master.time() < iHall;
  const peekTween = (to: Partial<typeof peek>, duration: number): void => {
    gsap.to(peek, {
      ...to,
      duration: reducedMotion ? 0 : duration,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: applyCurtain,
    });
    if (reducedMotion) {
      // A cut with a short fade, no sway.
      gsap.fromTo(peek, { fade: 0.4 }, { fade: 1, duration: 0.25, onUpdate: applyCurtain });
    }
  };
  /** She stoops toward the curtain to look: a lower eye and a step closer, hers
   *  alone (the story never tweens these two), combined with the walk in `apply`. */
  let stooping = false;
  let onStooped: (() => void) | undefined;
  const stoop = (to: number): void => {
    stooping = to > 0;
    gsap.to(camera, {
      peekY: -140 * to,
      peekDistance: -320 * to,
      peekPitch: -7 * to,
      duration: reducedMotion ? 0 : 0.6,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onUpdate: apply,
      onComplete: () => {
        stooping = false;
        onStooped?.();
      },
    });
  };
  const dropCurtain = (): void => {
    window.clearTimeout(peekTimer);
    peekTimer = 0;
    peekPinned = false;
    if (!peekUp) {
      return;
    }
    peekUp = false;
    hoverHeld = false;
    pressHeld = false;
    curtain?.removeAttribute('data-peek');
    peekTween({ lift: 0, glow: 0, sway: 0 }, 0.5);
    stoop(0);
  };
  const liftCurtain = (): void => {
    window.clearTimeout(peekTimer);
    peekTimer = 0;
    if (peekUp || storyHasCurtain()) {
      return;
    }
    peekUp = true;
    peekBeat = Math.floor(master.time());
    curtain?.setAttribute('data-peek', '');
    shell.sound.play('paper', 0.7);
    peekTween({ lift: PEEK_LIFT, glow: 1 }, 0.45);
    stoop(1);
    if (!reducedMotion) {
      gsap.fromTo(
        peek,
        { sway: 1 },
        { sway: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)', onUpdate: applyCurtain },
      );
    }
  };
  /** Let go: the curtain stays a moment, then drops, unless it is pinned up. */
  const releaseCurtain = (): void => {
    if (!peekUp || peekPinned || pressHeld) {
      return;
    }
    window.clearTimeout(peekTimer);
    peekTimer = window.setTimeout(dropCurtain, PEEK_MOMENT);
  };
  peekButton.addEventListener('click', () => {
    if (!peekUp) {
      liftCurtain();
      releaseCurtain();
    } else if (peekPinned) {
      dropCurtain();
    } else {
      peekPinned = true;
      window.clearTimeout(peekTimer);
      peekTimer = 0;
    }
  });
  // Press and hold: the pointer is captured, so the stoop moving the curtain
  // under the finger does not let go of it; release drops it after the moment.
  curtain?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    curtain.setPointerCapture(event.pointerId);
    pressHeld = true;
    liftCurtain();
    peekPinned = false;
    window.clearTimeout(peekTimer);
    peekTimer = 0;
  });
  const letGo = (): void => {
    pressHeld = false;
    releaseCurtain();
  };
  // A resting fine pointer on the curtain keeps it up. The stoop moves the
  // curtain on screen, so a leave during it is not a leave: when the stoop
  // settles, the curtain is looked for under the pointer once. A curtain that has
  // dropped back under a resting pointer waits for the pointer to move before it
  // lifts again, so it cannot bob up and down on its own.
  let hoverHeld = false;
  let hoverBlocked = false;
  const underPointer = (): boolean => {
    if (!curtain) {
      return false;
    }
    const x = ((shell.pointer.x + 1) / 2) * window.innerWidth;
    const y = ((shell.pointer.y + 1) / 2) * window.innerHeight;
    return curtain.contains(document.elementFromPoint(x, y));
  };
  const hoverLift = (): void => {
    if (!shell.pointer.fine || hoverBlocked) {
      return;
    }
    liftCurtain();
    if (peekUp) {
      hoverHeld = true;
      window.clearTimeout(peekTimer);
      peekTimer = 0;
    }
  };
  const hoverLeave = (): void => {
    hoverBlocked = false;
    if (!hoverHeld || stooping) {
      return;
    }
    hoverHeld = false;
    releaseCurtain();
  };
  onStooped = () => {
    if (hoverHeld && !underPointer()) {
      hoverHeld = false;
      hoverBlocked = true;
      releaseCurtain();
    }
  };
  curtain?.addEventListener('pointerenter', hoverLift);
  curtain?.addEventListener('pointermove', () => {
    if (hoverBlocked) {
      hoverBlocked = false;
      hoverLift();
    }
  });
  curtain?.addEventListener('pointerleave', hoverLeave);
  window.addEventListener('pointerup', letGo);
  window.addEventListener('pointercancel', letGo);
  const peekButtonCheck = (): void => {
    if (storyHasCurtain()) {
      peekButton.hide();
      dropCurtain();
    } else {
      peekButton.show();
    }
  };
  master.call(peekButtonCheck, [], iHall);
  master.call(peekButtonCheck, [], STORY_LIFT_AT);
  shell.onFrame(() => {
    if (peekUp && (Math.floor(master.time()) !== peekBeat || storyHasCurtain())) {
      dropCurtain();
    }
  });

  // --- The key. It lies on the glass table until the key beat; Take the key, or a
  // tap on it, and it hangs in her hand, and the story takes it anyway at the end
  // of the beat. She has it in her hand until she goes back to the table for the
  // bottle and leaves it there, where it stays, so at "She could see it through
  // the glass top" it is on the table. Where it is is a function of the scroll and
  // of whether the reader took it in this pass; scrolling back above the key beat
  // puts it back on the table, to be taken again.
  const keyOnTable = hall.querySelector<HTMLElement>('.dk__key');
  const keyInHand = document.createElement('div');
  keyInHand.className = 'dk__hand dk__hand--key';
  keyInHand.innerHTML = `<div class="dk__key-turn">${KEY_SVG}</div>`;
  hands.append(keyInHand);
  const keyTurn = keyInHand.querySelector<HTMLElement>('.dk__key-turn');
  const keyButton = shell.prop(shell.ui.demoTakeKey ?? '', 'dk__prop dk__prop--key');
  const KEY_STORY = iKey + 0.8;
  let readerTook = false;
  const hasKey = (): boolean => {
    const t = master.time();
    return t >= iKey && t < iBottle && (readerTook || t >= KEY_STORY);
  };
  const applyKey = (): void => {
    const t = master.time();
    if (t < iKey) {
      readerTook = false;
    }
    const held = hasKey();
    hall.toggleAttribute('data-key-taken', held);
    hands.toggleAttribute('data-key', held);
    t >= iKey && t < KEY_STORY && !held ? keyButton.show() : keyButton.hide();
  };
  const takeKey = (): void => {
    const t = master.time();
    if (readerTook || t < iKey || t >= KEY_STORY) {
      return;
    }
    readerTook = true;
    shell.keep('key');
    shell.sound.play('chime', 0.4);
    applyKey();
  };
  keyButton.addEventListener('click', takeKey);
  keyOnTable?.addEventListener('click', takeKey);
  for (const at of [iKey, KEY_STORY, iBottle]) {
    master.call(applyKey, [], at);
  }
  applyKey();
  const keyOpens = (): void => {
    shell.sound.play('chime');
    gsap.fromTo(
      keyTurn,
      { rotation: 0 },
      { rotation: 72, duration: reducedMotion ? 0 : 0.35, yoyo: true, repeat: 1 },
    );
    gsap.to(doorLeaf, { '--open': 1, duration: reducedMotion ? 0 : 0.5, delay: 0.3 });
    gsap.to(garden, { opacity: 1, duration: reducedMotion ? 0 : 0.5, delay: 0.3 });
  };
  const littleDoor = hall.querySelector<HTMLElement>('.dk__little-door');
  littleDoor?.addEventListener('click', () => {
    if (hasKey()) {
      keyOpens();
    }
  });

  // --- Every door can be tried, and every one is locked: the knob jiggles and the
  // whole hall gives a little thud. With the key in hand, it is tried in the lock.
  for (const door of hall.querySelectorAll<HTMLElement>('.dk__door')) {
    door.addEventListener('click', () => {
      shell.sound.play('thud', 0.5);
      if (hasKey()) {
        gsap.fromTo(
          keyTurn,
          { rotation: 0 },
          { rotation: 32, duration: reducedMotion ? 0 : 0.15, yoyo: true, repeat: 3 },
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
