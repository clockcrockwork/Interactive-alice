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
import { attachDemo, type DemoShell, seeded } from '../shell/shell.ts';
import { BOTTLE_IN_HAND_SVG, HOUSE_SVG } from './figures.ts';
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
  const flash = shell.layer('hs__flash');
  const eye = { yaw: 20, pitch: -6, grow: 1, rise: 0, lookX: 0, lookY: 0 };
  const applyEye = (): void => {
    box?.style.setProperty('--yaw', (eye.yaw + eye.lookX).toFixed(2));
    box?.style.setProperty('--pitch', (eye.pitch + eye.lookY).toFixed(2));
    box?.style.setProperty('--grow', eye.grow.toFixed(4));
    box?.style.setProperty('--rise', eye.rise.toFixed(1));
  };
  applyEye();
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
  let drunk = false;
  const drink = (): void => {
    if (drunk || !handBottle) {
      return;
    }
    drunk = true;
    drinkButton.hide();
    handBottle.setAttribute('data-held', '');
    gsap.to(handBottle, {
      rotation: -55,
      y: -30,
      duration: reducedMotion ? 0 : 0.5,
      ease: 'power2.inOut',
    });
    gsap.to(handBottle, {
      '--fill': 0,
      duration: reducedMotion ? 0 : 1,
      delay: reducedMotion ? 0 : 0.3,
    });
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
  master.call(
    () => (master.time() >= iSip + 0.35 ? drinkButton.show() : drinkButton.hide()),
    [],
    iSip + 0.35,
  );
  master.call(() => (master.time() >= iSip + 0.8 ? drink() : undefined), [], iSip + 0.8);
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
  master.to(room, { opacity: 0, duration: 0.3 }, iKneel - 0.3);
  master.to(ceilingShadow, { opacity: 0, duration: 0.3 }, iKneel - 0.55);
  master.to(hands, { opacity: 0, duration: 0.2 }, iKneel - 0.55);
  master.to(stage, { opacity: 1, duration: 0.3 }, iKneel - 0.35);
  const camera = stage.querySelector<SVGGElement>('.hs__camera');
  const wall = stage.querySelector<SVGGElement>('.hs__wall');
  const roof = stage.querySelector<SVGGElement>('.hs__roof');
  const standing = stage.querySelector<SVGGElement>('.hs__pose--standing');
  const kneeling = stage.querySelector<SVGGElement>('.hs__pose--kneeling');
  const filling = stage.querySelector<SVGGElement>('.hs__pose--filling');
  const hand = stage.querySelector<SVGGElement>('.hs__hand');
  const door = stage.querySelector<SVGGElement>('.hs__door');
  const rabbit = stage.querySelector<SVGGElement>('.hs__rabbit');
  const bottle = stage.querySelector<SVGGElement>('.hs__bottle');
  const shards = shell.layer('hs__shards');
  const random = seeded(41);
  shards.innerHTML = Array.from(
    { length: 16 },
    () =>
      `<div class="hs__shard" style="--x: ${(8 + random() * 14).toFixed(1)}%; --y: ${(72 + random() * 8).toFixed(1)}%; --delay: ${(-random() * 1.4).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');

  // --- The camera: zoom and pan in SVG units, around a point of interest.
  const view = { x: 320, y: 440, scale: 2.6, px: 0 };
  const apply = (): void => {
    camera?.setAttribute(
      'transform',
      `translate(${500 + view.px} 380) scale(${view.scale}) translate(${-view.x} ${-view.y})`,
    );
  };
  apply();
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
    void stage.offsetWidth;
    stage.setAttribute('data-shake', '');
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
  stage.addEventListener('pointerdown', (event) => {
    if (!(event.target as HTMLElement).closest('button')) {
      shake();
    }
  });
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
  look(iOutside, { x: 500, y: 360, scale: 0.72 }, 0.9);

  // --- The Rabbit tries the door, then goes round to the window.
  master.to(rabbit, { opacity: 1, duration: 0.1 }, iDoor);
  master.fromTo(rabbit, { x: 0 }, { x: -190, duration: 0.5, ease: 'power1.inOut' }, iDoor);
  if (!reducedMotion) {
    master.to(door, { '--rattle': 1, duration: 0.08, yoyo: true, repeat: 5 }, iDoor + 0.5);
  }
  master.to(rabbit, { x: -640, y: 40, duration: 0.6, ease: 'power1.inOut' }, iSnatch - 0.3);
  look(iSnatch, { x: 300, y: 400, scale: 0.95 }, 0.6);

  // --- The snatch: hers to make, or the story makes it.
  let snatched = false;
  const snatchButton = shell.prop(shell.ui.demoSnatch ?? '', 'hs__prop');
  const target = document.createElement('button');
  target.type = 'button';
  target.className = 'hs__window-target';
  target.setAttribute('aria-label', shell.ui.demoSnatch ?? '');
  shell.stage.append(target);
  const snatch = (): void => {
    if (snatched) {
      return;
    }
    snatched = true;
    snatchButton.hide();
    delete target.dataset.shown;
    gsap.to(hand, { '--snatch': 1, duration: reducedMotion ? 0 : 0.35, ease: 'power3.in' });
    gsap.to(hand, {
      '--snatch': 0,
      duration: reducedMotion ? 0 : 0.6,
      delay: 0.5,
      ease: 'power2.out',
    });
    gsap.to(rabbit, {
      y: 120,
      rotation: reducedMotion ? 0 : -150,
      transformOrigin: '50% 50%',
      duration: reducedMotion ? 0 : 0.6,
      delay: 0.2,
      ease: 'power2.in',
    });
    // Reached by a jump past the crash, the glass has already settled.
    if (master.time() < iCrash + 0.7) {
      gsap.to(shards, { opacity: 1, duration: 0.2, delay: 0.7 });
      setTimeout(() => shell.sound.play('glass'), 700);
    }
  };
  snatchButton.addEventListener('click', snatch);
  target.addEventListener('click', snatch);
  master.call(
    () => {
      const inside = master.time() >= iSnatch && master.time() < iSnatch + 0.9;
      if (inside && !snatched) {
        snatchButton.show();
        target.dataset.shown = '';
      } else {
        snatchButton.hide();
        delete target.dataset.shown;
      }
    },
    [],
    iSnatch,
  );
  master.call(() => (master.time() >= iSnatch + 0.9 ? snatch() : undefined), [], iSnatch + 0.9);
  // The glass settles; the shards are only ever tweened ad hoc, from here and
  // from the snatch, so the two never fight over one value.
  master.call(
    () => {
      gsap.killTweensOf(shards);
      gsap.to(shards, {
        opacity: master.time() >= iCrash + 0.7 || !snatched ? 0 : 1,
        duration: reducedMotion ? 0 : 0.4,
      });
    },
    [],
    iCrash + 0.7,
  );

  // --- To the chimney: the camera pulls back and up from the cutaway until the
  // house is seen from above, the Rabbit and Pat looking up from the garden;
  // Bill climbs the ladder and the roof to the chimney, and the camera comes
  // down to its rim, where Bill the Lizard picks the story up.
  const above = stage.querySelector<SVGGElement>('.hs__above');
  const bill = stage.querySelector<SVGGElement>('.hs__bill');
  const cutaway = [frame, wall, roof, slates, rabbit];
  // Reduced motion lands on whole beats, so its cuts sit just before the beat
  // starts and just before it ends: the beat opens on the house from above,
  // with a blink, and closes on the chimney's rim, with another.
  const cutAt = reducedMotion ? iChimney - 0.1 : iChimney + 0.3;
  const blink = (at: number): void => {
    master.fromTo(
      flash,
      { opacity: 0.8 },
      { opacity: 0, duration: 0.1, immediateRender: false },
      at,
    );
  };
  look(reducedMotion ? cutAt : iChimney, { x: 500, y: 250, scale: 0.5 }, 0.55);
  if (reducedMotion) {
    master.set(cutaway, { opacity: 0 }, cutAt);
    master.set(above, { opacity: 1 }, cutAt);
    blink(cutAt);
    blink(iChimney + 0.55);
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
  look(iChimney + 0.55, { x: 665, y: 126, scale: 3.6 }, 0.45);
  master.call(
    () => stage.toggleAttribute('data-at-chimney', master.time() >= iChimney + 0.8),
    [],
    iChimney + 0.8,
  );

  // --- Pointer: inside, it turns her head; outside, the house sits a little in
  // front of the garden.
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const k = Math.min(1, dt * 3);
    const target = shell.pointer.active ? shell.pointer.x * -12 : 0;
    view.px += (target - view.px) * k;
    apply();
    eye.lookX += ((shell.pointer.active ? shell.pointer.x * 14 : 0) - eye.lookX) * k;
    eye.lookY += ((shell.pointer.active ? -shell.pointer.y * 8 : 0) - eye.lookY) * k;
    applyEye();
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
