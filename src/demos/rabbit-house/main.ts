/**
 * The White Rabbit's house: the concept demo.
 *
 * A dollhouse cutaway in one SVG. The camera starts close in the tidy little room,
 * at the table in the window, and pulls out as Alice grows: standing, then kneeling
 * under the ceiling, then lying with an elbow at the door, an arm out of the window
 * and a foot up the chimney, the walls bulging and the roof lifting. Then it steps
 * outside for the Rabbit's visit, and the snatch that sends him into the cucumber
 * frame. Zoom is the parallax; the house is what changes size, not her.
 */

import gsap from 'gsap';
import { attachDemo, type DemoShell, seeded } from '../shell/shell.ts';
import { HOUSE_SVG } from './figures.ts';
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

  shell.layer('hs__garden');
  const stage = shell.layer('hs__stage');
  stage.innerHTML = HOUSE_SVG;
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
  master.to(roof, { '--bulge': 0.5, duration: 0.6 }, iKneel + 0.2);
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
    gsap.to(shards, { opacity: 1, duration: 0.2, delay: 0.7 });
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
  master.to(shards, { opacity: 0, duration: 0.5 }, iCrash + 0.7);

  // --- Pointer: the house sits a little in front of the garden.
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const target = shell.pointer.active ? shell.pointer.x * -12 : 0;
    view.px += (target - view.px) * Math.min(1, dt * 3);
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
