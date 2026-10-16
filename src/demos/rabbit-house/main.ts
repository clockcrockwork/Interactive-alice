/**
 * The White Rabbit's house: the concept demo.
 *
 * It opens inside: the tidy little room is a CSS 3D box the reader looks round,
 * the bottle comes to hand, and when she drinks the room shrinks round her feet
 * until her head meets the ceiling. Then the room falls away and the house is a
 * dollhouse cutaway in one SVG. The camera starts close and pulls out as Alice grows: standing, then kneeling
 * under the ceiling, then lying with an elbow at the door, an arm out of the window
 * and a foot up the chimney, the walls bulging and the roof lifting. Then it steps
 * outside for the Rabbit's visit, and the snatch that sends him into the cucumber
 * frame. Zoom is the parallax; the house is what changes size, not her.
 */

import gsap from 'gsap';
import { attachDemo, type DemoShell, REDUCED_SETTLE, seeded } from '../shell/shell.ts';
import { BOTTLE_IN_HAND_SVG, HOUSE_SVG, RIM_SVG, WIDE_FRAME } from './figures.ts';
import { HOUSE_FRONT_SVG } from './front.ts';
import './house.css';

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iSip = cue('sip');
  const iCeiling = cue('ceiling');
  const iKneel = cue('kneel');
  const iLie = cue('lie');
  const iArm = cue('arm');
  const iOutside = cue('outside');
  const iDoor = cue('door');
  const iSnatch = cue('snatch');
  const iCrash = cue('crash');
  const iChimney = cue('chimney');

  const iRoom = cue('room');
  shell.layer('hs__garden');
  const stage = shell.layer('hs__stage');
  stage.innerHTML = HOUSE_SVG;
  const frame = stage.querySelector<SVGGElement>('.hs__frame');
  gsap.set(stage, { opacity: 0 });

  // --- The room from inside: a CSS 3D box the reader looks round, until she has
  // grown past it and the story steps outside to the dollhouse.
  const room = shell.layer('hs__room');
  room.innerHTML =
    '<div class="hs__box">' +
    '<div class="hs__face hs__face--back"><div class="hs__glass"></div></div>' +
    '<div class="hs__face hs__face--left"><div class="hs__window-frame"></div><div class="hs__room-table"></div><div class="hs__room-bottle"></div></div>' +
    '<div class="hs__face hs__face--right"><div class="hs__room-door"></div></div>' +
    '<div class="hs__face hs__face--floor"></div>' +
    '<div class="hs__face hs__face--ceiling"></div>' +
    '</div>';
  const box = room.querySelector<HTMLElement>('.hs__box');
  const roomBottle = room.querySelector<HTMLElement>('.hs__room-bottle');
  const ceilingShadow = shell.layer('hs__ceiling-shadow');
  const hands = shell.layer('hs__hands');
  hands.innerHTML = `<div class="hs__hand-bottle">${BOTTLE_IN_HAND_SVG}</div>`;
  const handBottle = hands.querySelector<HTMLElement>('.hs__hand-bottle');
  // The arrival: the house from the path, as the Mouse's tale left it, over the
  // room; the first beat goes in through the door and the room is there.
  const arrivalGarden = shell.layer('hs__garden hs__garden--arrival');
  const arrival = shell.layer('hs__arrival');
  arrival.innerHTML = HOUSE_FRONT_SVG;
  const flash = shell.layer('hs__flash');
  const eye = { yaw: 20, pitch: -6, grow: 1, rise: 0, lookX: 0, lookY: 0 };
  const applyEye = (): void => {
    box?.style.setProperty('--yaw', (eye.yaw + eye.lookX).toFixed(2));
    box?.style.setProperty('--pitch', (eye.pitch + eye.lookY).toFixed(2));
    box?.style.setProperty('--grow', eye.grow.toFixed(4));
    box?.style.setProperty('--rise', eye.rise.toFixed(1));
  };
  applyEye();
  // In through the door: the front comes at the reader and gives way to the
  // room. Under reduced motion the room is a cut with a blink placed after the
  // first beat's settled frame, so that beat rests on the house front (the join
  // with the Mouse's tale) and the room is there from the next beat.
  if (reducedMotion) {
    const inside = iRoom + REDUCED_SETTLE + 0.1;
    master.set([arrival, arrivalGarden], { opacity: 0 }, inside);
    master.fromTo(
      flash,
      { opacity: 0.8 },
      { opacity: 0, duration: 0.1, immediateRender: false },
      inside,
    );
  } else {
    master.to(
      arrival,
      { '--hz': 3.2, '--hy': 10, opacity: 0, duration: 0.55, ease: 'power2.in' },
      iRoom + 0.05,
    );
    master.to(arrivalGarden, { opacity: 0, duration: 0.3 }, iRoom + 0.3);
  }
  // Looking round the room, then to the bottle in the window.
  master.to(
    eye,
    { yaw: -50, pitch: -4, duration: 0.9, ease: 'sine.inOut', onUpdate: applyEye },
    iRoom,
  );
  master.to(
    eye,
    { yaw: -70, pitch: 12, duration: 0.5, ease: 'power2.inOut', onUpdate: applyEye },
    iSip,
  );
  const drinkButton = shell.prop(shell.ui.demoDrink ?? '', 'hs__prop');
  // The bottle's own tilt and draught are the reader's (or the story's) drink, on
  // the drawing inside the hand; the hand itself is the timeline's to raise.
  const bottleArt = handBottle?.querySelector<SVGSVGElement>('svg');
  let drunk = false;
  const drink = (): void => {
    if (drunk || !handBottle || !bottleArt) {
      return;
    }
    drunk = true;
    drinkButton.hide();
    handBottle.setAttribute('data-held', '');
    gsap.to(bottleArt, {
      rotation: -55,
      y: -30,
      transformOrigin: '50% 100%',
      duration: reducedMotion ? 0 : 0.5,
      ease: 'power2.inOut',
    });
    gsap.to(handBottle, {
      '--fill': 0,
      duration: reducedMotion ? 0 : 1,
      delay: reducedMotion ? 0 : 0.3,
    });
  };
  const undrink = (): void => {
    if (!drunk || !handBottle || !bottleArt) {
      return;
    }
    drunk = false;
    gsap.killTweensOf([bottleArt, handBottle]);
    gsap.set(bottleArt, { rotation: 0, y: 0 });
    gsap.set(handBottle, { '--fill': 1 });
    handBottle.removeAttribute('data-held');
  };
  handBottle?.addEventListener('click', drink);
  drinkButton.addEventListener('click', drink);
  master.to(roomBottle, { opacity: 0, duration: 0.1 }, iSip + 0.3);
  master.fromTo(
    handBottle,
    { opacity: 0, y: 120 },
    { opacity: 1, y: 0, duration: 0.3 },
    iSip + 0.3,
  );
  // The bottle in hand takes a press only while it is in hand.
  const bottleLive = (): void => {
    const t = master.time();
    handBottle?.toggleAttribute('data-live', t >= iSip + 0.3 && t < iCeiling + 0.1);
    if (t >= iSip + 0.35 && t < iSip + 0.8 && !drunk) {
      drinkButton.show();
    } else {
      drinkButton.hide();
    }
  };
  for (const at of [iSip + 0.3, iSip + 0.35, iSip + 0.8, iCeiling + 0.1]) {
    master.call(bottleLive, [], at);
  }
  master.call(() => (master.time() >= iSip + 0.8 ? drink() : undefined), [], iSip + 0.8);
  // Scrolling back above the sip puts the bottle back, full, for another go.
  master.call(() => (master.time() < iSip + 0.3 ? undrink() : undefined), [], iSip + 0.3);
  master.to(handBottle, { opacity: 0, y: 80, duration: 0.3 }, iCeiling + 0.1);
  // Growing: the room shrinks round her feet and her head meets the ceiling.
  master.to(
    eye,
    { grow: 0.42, pitch: 26, yaw: -30, duration: 0.9, ease: 'power2.in', onUpdate: applyEye },
    iCeiling + 0.05,
  );
  master.fromTo(flash, { opacity: 0 }, { opacity: 0.8, duration: 0.05 }, iCeiling + 0.9);
  master.to(flash, { opacity: 0, duration: 0.3 }, iCeiling + 0.95);
  master.to(ceilingShadow, { opacity: 1, duration: 0.3 }, iCeiling + 0.6);
  // Out to the dollhouse: the roof lifts off the room, the camera rises out
  // through the gap, and the cutaway is there below.
  master.to(
    eye,
    { rise: -900, pitch: 60, grow: 0.42, duration: 0.6, ease: 'power2.in', onUpdate: applyEye },
    iKneel - 0.55,
  );
  master.to(room, { autoAlpha: 0, duration: 0.3 }, iKneel - 0.3);
  master.to(ceilingShadow, { autoAlpha: 0, duration: 0.3 }, iKneel - 0.55);
  master.to(hands, { autoAlpha: 0, duration: 0.2 }, iKneel - 0.55);
  master.to(stage, { opacity: 1, duration: 0.3 }, iKneel - 0.35);
  const svg = stage.querySelector<SVGSVGElement>('.hs__svg');
  const camera = stage.querySelector<SVGGElement>('.hs__camera');
  const wall = stage.querySelector<SVGGElement>('.hs__wall');
  const roof = stage.querySelector<SVGGElement>('.hs__roof');
  const standing = stage.querySelector<SVGGElement>('.hs__pose--standing');
  const kneeling = stage.querySelector<SVGGElement>('.hs__pose--kneeling');
  const filling = stage.querySelector<SVGGElement>('.hs__pose--filling');
  const hand = stage.querySelector<SVGGElement>('.hs__hand');
  const door = stage.querySelector<SVGGElement>('.hs__door');
  const rabbitWalk = stage.querySelector<SVGGElement>('.hs__rabbit-walk');
  const rabbit = stage.querySelector<SVGGElement>('.hs__rabbit');
  const tumble = stage.querySelector<SVGGElement>('.hs__rabbit-tumble');
  const bottle = stage.querySelector<SVGGElement>('.hs__bottle');
  const flue = stage.querySelector<SVGGElement>('.hs__flue');
  const legLow = stage.querySelector<SVGGElement>('.hs__leg-low');
  const legUp = stage.querySelector<SVGGElement>('.hs__leg-up');
  const shoe = stage.querySelector<SVGGElement>('.hs__shoe');
  const random = seeded(41);

  // --- The camera: zoom and pan in SVG units, around a point of interest. On a
  // wide frame `side` slides the point toward one side, so the captions can sit on
  // the other (house.css places them by cue with the same query); on a tall one
  // the point sits higher, above the captions, and the zoom eases off so the
  // house fits the narrow frame.
  const wideQuery = matchMedia(WIDE_FRAME);
  const view = { x: 320, y: 440, scale: 2.6, side: 0, px: 0 };
  const apply = (): void => {
    const wide = wideQuery.matches;
    const ax = 500 + view.px + (wide ? view.side * 170 : 0);
    const ay = wide ? 380 : 300;
    const scale = view.scale * (wide ? 1 : 0.8);
    camera?.setAttribute(
      'transform',
      `translate(${ax.toFixed(1)} ${ay}) scale(${scale.toFixed(4)}) translate(${(-view.x).toFixed(1)} ${(-view.y).toFixed(1)})`,
    );
  };
  apply();
  wideQuery.addEventListener('change', apply);
  const look = (at: number, to: Partial<typeof view>, duration = 0.8): void => {
    master.to(
      view,
      { ...to, duration: reducedMotion ? 0.01 : duration, ease: 'power2.inOut', onUpdate: apply },
      at,
    );
  };
  const pose = (at: number, show: SVGGElement | null, hide: (SVGGElement | null)[]): void => {
    master.to(show, { opacity: 1, duration: 0.25 }, at);
    for (const el of hide) {
      master.to(el, { opacity: 0, duration: 0.25 }, at);
    }
  };

  // The room, the sip, then growth: each pose a size, the camera keeping pace.
  master.set(standing, { opacity: 1, scale: 0.55, transformOrigin: '50% 100%' }, 0);
  look(iSip, { x: 330, y: 430, scale: 2.4 }, 0.6);
  master.to(
    bottle,
    { y: -20, rotation: -40, transformOrigin: '50% 100%', duration: 0.3 },
    iSip + 0.3,
  );
  master.to(standing, { scale: 1.6, duration: 0.7, ease: 'power2.in' }, iCeiling);
  look(iCeiling, { x: 400, y: 380, scale: 1.4 }, 0.8);
  pose(iKneel, kneeling, [standing]);
  look(iKneel, { x: 460, y: 380, scale: 1.05 }, 0.7);
  master.fromTo(wall, { '--bulge': 0 }, { '--bulge': 0.5, duration: 0.6 }, iKneel + 0.2);
  master.fromTo(roof, { '--bulge': 1.6 }, { '--bulge': 0.5, duration: 0.6 }, iKneel - 0.35);

  // --- Push the wall: the house shakes and a slate slides off the roof.
  const shakeButton = shell.prop(shell.ui.demoShakeHouse ?? '', 'hs__prop hs__prop--shake');
  const slates = stage.querySelector<SVGGElement>('.hs__slates');
  let slateCount = 0;
  const shake = (): void => {
    if (master.time() < iKneel || master.time() >= iDoor) {
      return;
    }
    stage.removeAttribute('data-shake');
    requestAnimationFrame(() => stage.setAttribute('data-shake', ''));
    shell.sound.play('thud', 0.7);
    if (slates && slateCount < 8) {
      slateCount += 1;
      const slate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      slate.setAttribute('x', String(400 + random() * 200));
      slate.setAttribute('y', '150');
      slate.setAttribute('width', '34');
      slate.setAttribute('height', '20');
      slate.setAttribute('fill', 'var(--hs-roof-deep)');
      slates.append(slate);
      gsap.to(slate, {
        y: 460,
        x: `+=${(random() - 0.5) * 120}`,
        rotation: (random() - 0.5) * 200,
        transformOrigin: '50% 50%',
        duration: reducedMotion ? 0 : 0.9,
        ease: 'power2.in',
      });
    }
  };
  shakeButton.addEventListener('click', shake);
  master.call(
    () =>
      master.time() >= iKneel && master.time() < iDoor ? shakeButton.show() : shakeButton.hide(),
    [],
    iKneel,
  );
  master.call(
    () =>
      master.time() >= iKneel && master.time() < iDoor ? shakeButton.show() : shakeButton.hide(),
    [],
    iDoor,
  );
  pose(iLie, filling, [kneeling]);
  master.fromTo(
    filling,
    { scale: 0.75 },
    { scale: 0.92, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 100%' },
    iLie,
  );
  look(iLie, { x: 500, y: 380, scale: 0.9 }, 0.7);
  master.to(filling, { scale: 1, duration: 0.6, ease: 'power2.inOut' }, iArm);
  master.to(hand, { opacity: 1, duration: 0.2 }, iArm + 0.3);
  master.to([wall, roof], { '--bulge': 1, duration: 0.6 }, iArm + 0.2);
  // A little higher, so the chimney's top is in the frame when her foot comes out.
  look(iArm, { x: 500, y: 340, scale: 0.85 }, 0.7);
  look(iOutside, { x: 500, y: 350, scale: 0.72 }, 0.9);

  // --- One foot up the chimney: her leg runs up the flue and the shoe comes out
  // of the chimney's top. The rise is the timeline's; a wiggle is the reader's,
  // on its own value, and the two add up.
  const leg = { up: 0 };
  const kickFx = { k: 0 };
  const applyLeg = (): void => {
    legUp?.setAttribute(
      'transform',
      `translate(0 ${((1 - leg.up) * 170 - kickFx.k * 34).toFixed(1)})`,
    );
    shoe?.setAttribute('transform', `rotate(${(-kickFx.k * 38).toFixed(1)} 662 74)`);
  };
  applyLeg();
  master.fromTo(
    [flue, legLow],
    { opacity: 0 },
    { opacity: 1, duration: reducedMotion ? 0.01 : 0.1, immediateRender: false },
    iArm + 0.4,
  );
  master.fromTo(
    leg,
    { up: 0 },
    {
      up: 1,
      duration: reducedMotion ? 0.01 : 0.4,
      ease: 'power2.out',
      onUpdate: applyLeg,
      immediateRender: false,
    },
    iArm + 0.4,
  );

  // --- Wiggle her foot: it kicks out of the chimney's top in a puff of soot, the
  // kick that will send Bill up. Hers to play with from the moment the foot is
  // out until the Rabbit comes round to the window.
  const wiggleButton = shell.prop(shell.ui.demoWiggleFoot ?? '', 'hs__prop hs__prop--wiggle');
  const wiggleFrom = iArm + 0.75;
  const wiggleLive = (): boolean => master.time() >= wiggleFrom && master.time() < iSnatch;
  let wiggles = 0;
  let wiggleTimeline: gsap.core.Timeline | undefined;
  const wiggle = (): void => {
    if (!wiggleLive() || !flue) {
      return;
    }
    wiggles += 1;
    shell.sound.play('whoosh', 0.5);
    shell.status(shell.ui.demoWiggleFoot ?? '');
    flue.removeAttribute('data-puff');
    requestAnimationFrame(() => flue.setAttribute('data-puff', String(wiggles)));
    wiggleTimeline?.kill();
    wiggleTimeline = gsap.timeline({ onComplete: () => flue.removeAttribute('data-puff') });
    if (reducedMotion) {
      wiggleTimeline.set(kickFx, { k: 1, onUpdate: applyLeg }, 0);
      wiggleTimeline.set(kickFx, { k: 0, onUpdate: applyLeg }, 1.2);
    } else {
      wiggleTimeline.to(kickFx, { k: 1, duration: 0.16, ease: 'power3.out', onUpdate: applyLeg });
      wiggleTimeline.to(kickFx, {
        k: 0.35,
        duration: 0.14,
        ease: 'sine.inOut',
        onUpdate: applyLeg,
      });
      wiggleTimeline.to(kickFx, { k: 0.8, duration: 0.12, ease: 'sine.inOut', onUpdate: applyLeg });
      wiggleTimeline.to(kickFx, { k: 0, duration: 0.5, ease: 'power2.inOut', onUpdate: applyLeg });
      wiggleTimeline.to({}, { duration: 0.4 });
    }
  };
  wiggleButton.addEventListener('click', wiggle);
  const wiggleShown = (): void => {
    if (wiggleLive()) {
      wiggleButton.show();
    } else {
      wiggleButton.hide();
    }
  };
  master.call(wiggleShown, [], wiggleFrom);
  master.call(wiggleShown, [], iSnatch);

  // --- The Rabbit tries the door, then goes round to the window. His walk is
  // the timeline's (the outer group), his tumble the snatch's (the inner one).
  const rab = { x: 900, y: 560, hop: 0 };
  const applyRabbit = (): void => {
    const bob = -Math.abs(Math.sin(rab.hop * Math.PI)) * 9;
    rabbitWalk?.setAttribute(
      'transform',
      `translate(${rab.x.toFixed(1)} ${(rab.y + bob).toFixed(1)})`,
    );
  };
  applyRabbit();
  master.fromTo(
    rabbit,
    { opacity: 0 },
    { opacity: 1, duration: 0.1, immediateRender: false },
    iDoor,
  );
  master.fromTo(
    rab,
    { x: 900, y: 560, hop: 0 },
    {
      x: 712,
      y: 556,
      hop: 5,
      duration: reducedMotion ? 0.01 : 0.45,
      ease: 'power1.inOut',
      onUpdate: applyRabbit,
      immediateRender: false,
    },
    iDoor,
  );
  look(iDoor, { x: 560, y: 380, scale: 0.82, side: 1 }, 0.6);
  if (reducedMotion) {
    // The door held where her elbow stops it, rather than rattling.
    master.set(door, { '--rattle': 0.6 }, iDoor + 0.4);
    master.set(door, { '--rattle': 0 }, iSnatch);
  } else {
    master.to(door, { '--rattle': 1, duration: 0.08, yoyo: true, repeat: 5 }, iDoor + 0.5);
  }
  master.fromTo(
    rab,
    { x: 712, y: 556, hop: 5 },
    {
      x: 300,
      y: 585,
      hop: 14,
      duration: reducedMotion ? 0.01 : 0.55,
      ease: 'power1.inOut',
      onUpdate: applyRabbit,
      immediateRender: false,
    },
    reducedMotion ? iSnatch : iDoor + 0.75,
  );
  look(iDoor + 0.8, { x: 250, y: 440, scale: 1, side: -1 }, 0.5);
  look(iCrash, { x: 190, y: 480, scale: 1.2, side: -1 }, 0.5);

  // --- The snatch: hers to make, or the story makes it. The tumble runs from
  // under the window into the frame, head first; scrolling back above it puts
  // the Rabbit back under the window for another go.
  const fall = { t: 0 };
  const applyTumble = (): void => {
    const t = fall.t;
    const dx = -170 * t;
    const dy = -5 * t - 90 * Math.sin(Math.PI * t);
    tumble?.setAttribute(
      'transform',
      `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${(-180 * t).toFixed(1)} 0 -30)`,
    );
  };
  applyTumble();
  const snatchFrom = iSnatch + 0.3;
  const snatchBy = iSnatch + 0.9;
  let snatched = false;
  const snatchButton = shell.prop(shell.ui.demoSnatch ?? '', 'hs__prop hs__prop--snatch');
  const snatchShown = (): void => {
    const t = master.time();
    if (t >= snatchFrom && t < snatchBy && !snatched) {
      snatchButton.show();
    } else {
      snatchButton.hide();
    }
  };
  const crash = (): void => {
    svg?.setAttribute('data-crash', '');
    if (master.time() < iCrash + 0.9) {
      shell.sound.play('glass');
    }
  };
  const snatch = (): void => {
    if (snatched) {
      return;
    }
    snatched = true;
    snatchShown();
    gsap.killTweensOf([hand, fall]);
    gsap.to(hand, { '--snatch': 1, duration: reducedMotion ? 0 : 0.3, ease: 'power3.in' });
    gsap.to(hand, {
      '--snatch': 0,
      duration: reducedMotion ? 0 : 0.6,
      delay: reducedMotion ? 0 : 0.6,
      ease: 'power2.out',
    });
    gsap.to(fall, {
      t: 1,
      duration: reducedMotion ? 0 : 0.7,
      delay: reducedMotion ? 0 : 0.2,
      ease: 'power2.in',
      onUpdate: applyTumble,
      onComplete: crash,
    });
  };
  const unsnatch = (): void => {
    if (!snatched) {
      return;
    }
    snatched = false;
    gsap.killTweensOf([hand, fall]);
    gsap.set(hand, { '--snatch': 0 });
    fall.t = 0;
    applyTumble();
    svg?.removeAttribute('data-crash');
    snatchShown();
  };
  snatchButton.addEventListener('click', () => {
    if (master.time() >= snatchFrom) {
      snatch();
      shell.status(shell.ui.demoSnatch ?? '');
    }
  });
  master.call(snatchShown, [], snatchFrom);
  master.call(() => (master.time() < snatchFrom ? unsnatch() : undefined), [], snatchFrom);
  master.call(
    () => (master.time() < snatchBy - 0.01 ? unsnatch() : undefined),
    [],
    snatchBy - 0.01,
  );
  master.call(() => (master.time() >= snatchBy ? snatch() : snatchShown()), [], snatchBy);

  // --- Pointer play on the house: the window is the snatch, the chimney's top
  // the wiggle, anywhere else a push on the wall.
  stage.addEventListener('pointerdown', (event) => {
    const hit = event.target as Element;
    if (hit.closest('.hs__foot-hit') && wiggleLive()) {
      wiggle();
    } else if (
      hit.closest('.hs__window-hit') &&
      master.time() >= snatchFrom &&
      master.time() < snatchBy
    ) {
      snatch();
      shell.status(shell.ui.demoSnatch ?? '');
    } else {
      shake();
    }
  });

  // --- To the chimney: the camera pulls back and up from the cutaway until the
  // house is seen from above, the Rabbit and Pat looking up from the garden;
  // Bill climbs the ladder and the roof to the chimney, the camera comes down to
  // its rim and into his eyes: the garden from the rim, the picture Bill the
  // Lizard opens on.
  const above = stage.querySelector<SVGGElement>('.hs__above');
  const bill = stage.querySelector<SVGGElement>('.hs__bill');
  const cutaway = [frame, wall, roof, slates, rabbit];
  const rim = shell.layer('hs__rim');
  rim.innerHTML = RIM_SVG;
  // Reduced motion shows the last beat as it ends: the garden from the rim, a cut.
  const cutAt = iChimney + 0.3;
  look(iChimney, { x: 500, y: 250, scale: 0.5, side: 0 }, 0.55);
  if (reducedMotion) {
    master.set(cutaway, { opacity: 0 }, cutAt);
    master.set(above, { opacity: 1 }, cutAt);
  } else {
    master.to(cutaway, { opacity: 0, duration: 0.25 }, cutAt);
    master.to(above, { opacity: 1, duration: 0.25 }, cutAt);
  }
  // Up the ladder, over the slates, onto the rim.
  master.set(bill, { x: 599, y: 470, rotation: -80, transformOrigin: '50% 100%' }, 0);
  master.to(bill, { y: 330, duration: reducedMotion ? 0.01 : 0.25, ease: 'none' }, iChimney + 0.15);
  master.to(
    bill,
    { x: 640, y: 150, rotation: -50, duration: reducedMotion ? 0.01 : 0.25, ease: 'none' },
    iChimney + 0.4,
  );
  master.to(
    bill,
    { x: 646, y: 122, rotation: 0, duration: reducedMotion ? 0.01 : 0.15, ease: 'power1.out' },
    iChimney + 0.65,
  );
  look(iChimney + 0.55, { x: 665, y: 126, scale: 3.6 }, 0.3);
  look(iChimney + 0.85, { x: 665, y: 120, scale: 5.4 }, 0.15);
  master.fromTo(
    rim,
    { opacity: 0, '--rz': 1.45 },
    {
      opacity: 1,
      '--rz': 1,
      duration: reducedMotion ? 0.01 : 0.2,
      ease: 'power2.out',
      immediateRender: false,
    },
    iChimney + 0.8,
  );
  master.call(
    () => stage.toggleAttribute('data-at-chimney', master.time() >= iChimney + 0.8),
    [],
    iChimney + 0.8,
  );

  // --- Pointer: inside, it turns her head; outside, the house sits a little in
  // front of the garden.
  // Only when the pointer has moved them: an idle frame writes nothing.
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const k = Math.min(1, dt * 3);
    const target = shell.pointer.active ? shell.pointer.x * -12 : 0;
    const lookX = shell.pointer.active ? shell.pointer.x * 14 : 0;
    const lookY = shell.pointer.active ? -shell.pointer.y * 8 : 0;
    if (Math.abs(target - view.px) > 0.01) {
      view.px += (target - view.px) * k;
      apply();
    }
    if (Math.abs(lookX - eye.lookX) > 0.01 || Math.abs(lookY - eye.lookY) > 0.01) {
      eye.lookX += (lookX - eye.lookX) * k;
      eye.lookY += (lookY - eye.lookY) * k;
      applyEye();
    }
  });

  // Test seam: what the house is doing, in one serialisable snapshot.
  window.__aliceHouse = () => ({
    rabbit: { x: rab.x, y: rab.y, opacity: Number(getComputedStyle(rabbit as Element).opacity) },
    snatched,
    fall: fall.t,
    leg: leg.up,
    wiggles,
  });
}

declare global {
  interface Window {
    /** Test seam: the house's own state. */
    __aliceHouse?: () => {
      rabbit: { x: number; y: number; opacity: number };
      snatched: boolean;
      fall: number;
      leg: number;
      wiggles: number;
    };
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
