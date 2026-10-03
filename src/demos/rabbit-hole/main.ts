/**
 * Down the Rabbit-Hole: the concept demo.
 *
 * The parallax here is the fall itself. A WebGL well runs the length of the
 * scroll, the camera descends through it, and the story's sentences rise out of
 * the depth, pass the reader and vanish overhead. Around the well, DOM layers carry
 * Alice, the jar she takes from a shelf, a map off the wall she may look at, the
 * bats she wonders about, a bat and a ghost of Dinah chasing each other round the
 * well, Dinah in the dream, and the ground that finally arrives.
 *
 * It opens on the riverbank's last frame, drawn once in `../riverbank/field.ts`:
 * the hedge, the Rabbit nose-down in the hole under it, and Alice from behind.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { createStride, fieldHtml } from '../riverbank/field.ts';
import { attachDemo, type Beat, type DemoShell, mix } from '../shell/shell.ts';
import { heldSvg, JAR_SVG, MAP_SVG } from './figures.ts';
import './rabbit-hole.css';
import { TUNNEL_DOORS, trapdoorHtml } from './trapdoor.ts';
import { createWell, type Well } from './well.ts';

const UNITS_PER_BEAT = 16;

function depthCaption(
  beat: Beat,
  master: gsap.core.Timeline,
  reduced: boolean,
  from: number,
  last: number,
): boolean {
  if (reduced || beat.index < from) {
    return false;
  }
  const t = beat.index;
  master.fromTo(
    beat.lines,
    { opacity: 0, z: -700, y: 40 },
    { opacity: 1, z: 0, y: 0, duration: 0.38, stagger: 0.1, ease: 'power2.out' },
    t + 0.04,
  );
  if (beat.index !== last) {
    master.to(
      beat.lines,
      { opacity: 0, z: 520, y: -60, duration: 0.2, ease: 'power2.in' },
      t + 0.8,
    );
  }
  return true;
}

function mount(shell: DemoShell): void {
  const iTunnel = shell.cue('tunnel');
  const iDrop = shell.cue('drop');
  const iJar = shell.cue('jar');
  const iFlip = shell.cue('flip');
  const iCurtsey = shell.cue('curtsey');
  const iBats = shell.cue('bats');
  const iCats = shell.cue('cats');
  const iDream = shell.cue('dream');
  const iThump = shell.cue('ground');
  const iEnd = shell.cue('end');
  const { master, ambient, reducedMotion } = shell;

  // Depth: the first well beat accelerates, the long middle is steady, the landing
  // eases out onto the floor. The floor sits where the steady fall would arrive.
  const steadyStart = iDrop + 1;
  const floorDepth = 12 + (iThump - steadyStart) * UNITS_PER_BEAT + 8;
  const depthTotal = floorDepth + 10;

  // Layers, back to front.
  const flat = shell.layer('rh__flat');
  const canvas = document.createElement('canvas');
  canvas.className = 'rh__canvas';
  const canvasLayer = shell.layer('rh__well');
  canvasLayer.append(canvas);
  const surface = shell.layer('rh__surface');
  surface.innerHTML = `<div class="rh__sun"></div>${fieldHtml()}`;
  const props = shell.layer('rh__props');
  props.innerHTML =
    `<div class="rh__cupboard"></div>` +
    `<div class="rh__alice">${figure('alice/falling')}<div class="rh__hand"></div></div>` +
    `<div class="rh__jar-track"><div class="rh__jar" data-jar>${JAR_SVG}</div></div>` +
    `<div class="rh__dinah">${figure('dinah-cat')}</div>` +
    `<div class="rh__rabbit">${figure('white-rabbit/running')}</div>`;
  const bats = shell.layer('rh__bats');
  bats.innerHTML = [0.22, 0.4, 0.58]
    .map((y) => `<div class="rh__bat" style="--bat-y: ${y * 100}%">${figure('bat')}</div>`)
    .join('');
  // The stage's size, kept by an observer so nothing per frame has to measure it.
  const stageSize = { w: shell.stage.clientWidth, h: shell.stage.clientHeight };
  new ResizeObserver(() => {
    stageSize.w = shell.stage.clientWidth;
    stageSize.h = shell.stage.clientHeight;
  }).observe(shell.stage);
  const chase = shell.layer('rh__chase');
  chase.innerHTML =
    `<div class="rh__chaser rh__chaser--cat">${figure('dinah-cat/pouncing')}</div>` +
    `<div class="rh__chaser rh__chaser--bat">${figure('bat')}</div>`;
  const mapLayer = shell.layer('rh__map');
  mapLayer.innerHTML = `<div class="rh__map-sheet">${MAP_SVG}</div>`;
  const flash = shell.layer('rh__flash');
  const dark = shell.layer('rh__dark');
  // Under reduced motion a cut is a blink of paper, on crossing it either way.
  const blinkLayer = shell.layer('rh__blink');
  const blink = (at: number): void => {
    if (reducedMotion) {
      master.call(
        () => gsap.fromTo(blinkLayer, { opacity: 0.4 }, { opacity: 0, duration: 0.3 }),
        [],
        at,
      );
    }
  };

  const quality = window.innerWidth < 720 || navigator.hardwareConcurrency <= 4 ? 'lite' : 'full';
  const well: Well | undefined = createWell(canvas, depthTotal, floorDepth, quality);
  shell.root.dataset.mode = well ? 'webgl' : 'flat';
  if (!well) {
    canvasLayer.remove();
    if (shell.ui.demoFlatWell) {
      shell.note(shell.ui.demoFlatWell);
    }
  } else {
    flat.remove();
  }

  const land = surface.querySelector<HTMLElement>('.field__land');
  const fieldRabbit = surface.querySelector<HTMLElement>('.field__rabbit');
  const runnerBox = surface.querySelector<HTMLElement>('.field__alice');
  const runner = surface.querySelector<HTMLElement>('.field__runner');
  const alice = props.querySelector<HTMLElement>('.rh__alice');
  const hand = props.querySelector<HTMLElement>('.rh__hand');
  const jarTrack = props.querySelector<HTMLElement>('.rh__jar-track');
  const jar = props.querySelector<HTMLElement>('.rh__jar');
  const cupboard = props.querySelector<HTMLElement>('.rh__cupboard');
  const dinah = props.querySelector<HTMLElement>('.rh__dinah');
  const rabbit = props.querySelector<HTMLElement>('.rh__rabbit');

  // --- The surface: the riverbank's last frame. The Rabbit pops down the hole;
  // Alice runs on after him, the reader's scroll her stride, and the camera runs
  // with her until the hole is at her feet. She ducks into it, the camera follows
  // her into the dark, and the tunnel drops away under them both.
  if (fieldRabbit) {
    master.fromTo(
      fieldRabbit,
      { yPercent: 0 },
      { yPercent: 115, duration: 0.25, ease: 'power2.in', immediateRender: false },
      0.08,
    );
  }
  if (land) {
    master.fromTo(
      land,
      { scale: 1 },
      { scale: 2.4, duration: 0.85, ease: 'sine.inOut', immediateRender: false },
      0.15,
    );
    master.to(land, { scale: 9, duration: 0.55, ease: 'power2.in' }, iTunnel + 0.05);
    // "Then it dropped away under her feet": the camera tips over the lip.
    master.to(land, { scale: 26, yPercent: -18, duration: 0.35, ease: 'power3.in' }, iTunnel + 0.6);
  }
  if (runner) {
    master.fromTo(
      runner,
      { x: 0, y: 0, scale: 1 },
      {
        x: '-11vw',
        y: '-10vh',
        scale: 0.92,
        duration: 0.85,
        ease: 'power1.inOut',
        immediateRender: false,
      },
      0.15,
    );
    // She ducks in: down and away into the dark of the hole.
    master.to(
      runner,
      {
        x: '-14vw',
        y: '-17vh',
        scaleX: 0.5,
        scaleY: 0.38,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      },
      iTunnel + 0.05,
    );
  }
  master.to(surface, { opacity: 0, duration: 0.7 }, iDrop);
  master.to(well ? canvas : flat, { opacity: 1, duration: 0.6 }, iDrop + 0.05);

  const camera = well?.camera ?? {
    depth: 0,
    roll: 0,
    driftX: 0,
    driftY: 0,
    shake: 0,
    mood: 0,
    floor: 0,
    rush: 0,
  };
  master.to(camera, { depth: 12, duration: 1, ease: 'power2.in' }, iDrop);
  master.to(camera, { depth: floorDepth - 8, duration: iThump - steadyStart }, steadyStart);
  master.to(camera, { depth: floorDepth - 3.6, duration: 0.5, ease: 'power3.out' }, iThump);
  master.fromTo(camera, { floor: 0 }, { floor: 1, duration: 1.2 }, iThump - 1.4);
  if (!well) {
    master.fromTo(
      flat,
      { '--fall-rings': 1 },
      { '--fall-rings': 4, duration: iThump - iDrop },
      iDrop,
    );
  }

  // --- Alice.
  if (alice) {
    master.to(alice, { opacity: 1, duration: 0.5 }, iDrop + 0.4);
    // "Where people walk upside down": the whole view rolls over, she curtseys to
    // the people there while she is the wrong way up, and it rolls back. Under
    // reduced motion each roll is a cut with a blink, placed so the settled
    // pictures are hers: upside down with her sentence, curtseying with hers.
    const over = reducedMotion ? iFlip + 0.1 : iFlip + 0.12;
    const back = reducedMotion ? iCurtsey + 0.9 : iCurtsey + 0.62;
    const roll = reducedMotion ? 0.01 : 0.75;
    master.to(alice, { rotation: 180, duration: roll, ease: 'power2.inOut' }, over);
    master.to(camera, { roll: Math.PI, duration: roll, ease: 'power2.inOut' }, over);
    master.to(alice, { rotation: 360, duration: roll * 0.5, ease: 'power2.inOut' }, back);
    master.to(camera, { roll: Math.PI * 2, duration: roll * 0.5, ease: 'power2.inOut' }, back);
    blink(over);
    blink(back);
    // The story's own curtsey, while she is upside down.
    const bowFrom = iCurtsey + 0.15;
    const bowTo = reducedMotion ? iCurtsey + 0.85 : iCurtsey + 0.58;
    const storyBow = (): void => {
      const t = master.time();
      alice.toggleAttribute('data-bow', t >= bowFrom && t < bowTo);
    };
    master.call(storyBow, [], bowFrom);
    master.call(storyBow, [], bowTo);
    master.to(alice, { y: 60, scale: 0.9, duration: 0.5, ease: 'power3.out' }, iThump);
    master.to(alice, { opacity: 0, duration: 0.5 }, iEnd + 0.2);
  }

  // --- Bow: the reader may make her curtsey again, as often as she likes, while
  // the curtsey beat is on. Her own attribute, so the story's never fights it.
  const bowButton = shell.prop(shell.ui.demoBow ?? '', 'rh__prop-bow');
  let bowTimer = 0;
  const curtsey = (): void => {
    if (!alice || master.time() < iCurtsey || master.time() >= iCurtsey + 1) {
      return;
    }
    alice.setAttribute('data-bowing', '');
    shell.sound.play('paper', 0.4);
    window.clearTimeout(bowTimer);
    bowTimer = window.setTimeout(() => alice.removeAttribute('data-bowing'), 900);
  };
  bowButton.addEventListener('click', curtsey);
  const showBow = (): void => {
    const t = master.time();
    if (t >= iCurtsey && t < iCurtsey + 0.95) {
      bowButton.show();
    } else {
      bowButton.hide();
      window.clearTimeout(bowTimer);
      alice?.removeAttribute('data-bowing');
    }
  };
  master.call(showBow, [], iCurtsey);
  master.call(showBow, [], iCurtsey + 0.95);

  // --- The jar: a shelf passes; the reader may take the jar off it.
  let jarState: 'shelf' | 'hand' | 'cupboard' = 'shelf';
  const takeButton = shell.prop(shell.ui.demoGrabJar ?? '', 'rh__prop-jar');
  const moveInto = (target: HTMLElement, extra: gsap.TweenVars = {}): void => {
    if (!jar) {
      return;
    }
    const before = jar.getBoundingClientRect();
    target.append(jar);
    const after = jar.getBoundingClientRect();
    gsap.fromTo(
      jar,
      { x: before.left - after.left, y: before.top - after.top },
      { x: 0, y: 0, duration: reducedMotion ? 0 : 0.6, ease: 'power3.out', ...extra },
    );
  };
  const take = (): void => {
    if (jarState !== 'shelf' || !hand) {
      return;
    }
    jarState = 'hand';
    takeButton.hide();
    moveInto(hand, { rotation: -20 });
    jar?.setAttribute('data-hot', '');
  };
  const tuck = (): void => {
    if (jarState !== 'hand' || !cupboard) {
      return;
    }
    jarState = 'cupboard';
    jar?.removeAttribute('data-hot');
    gsap.to(cupboard, { '--door': 1, duration: reducedMotion ? 0 : 0.4 });
    moveInto(cupboard, { scale: 0.7, rotation: 0, delay: 0.1 });
    gsap.to(cupboard, { '--door': 0, duration: reducedMotion ? 0 : 0.4, delay: 0.8 });
  };
  // Scrolled back above the shelf, the jar is on it again, to be taken or not.
  const unshelve = (): void => {
    if (jarState === 'shelf' || !jar || !jarTrack) {
      return;
    }
    jarState = 'shelf';
    jar.removeAttribute('data-hot');
    jarTrack.append(jar);
    gsap.set(jar, { x: 0, y: 0, rotation: 0, scale: 1 });
  };
  takeButton.addEventListener('click', take);
  jar?.addEventListener('click', take);
  if (jarTrack) {
    master.fromTo(jarTrack, { y: '70vh' }, { y: '-75vh', duration: 1.6 }, iJar - 0.2);
    const jarButton = (): void => {
      const t = master.time();
      if (t < iJar - 0.1) {
        unshelve();
      }
      t >= iJar - 0.1 && t < iJar + 1.1 && jarState === 'shelf'
        ? takeButton.show()
        : takeButton.hide();
    };
    master.call(jarButton, [], iJar - 0.1);
    master.call(jarButton, [], iJar + 1.1);
    master.call(() => (master.time() >= iJar + 1.25 ? tuck() : undefined), [], iJar + 1.25);
  }
  if (cupboard) {
    master.fromTo(
      cupboard,
      { opacity: 0, y: '50vh' },
      { opacity: 1, y: '0vh', duration: 1.3 },
      iJar + 0.6,
    );
    master.to(cupboard, { y: '-90vh', opacity: 0, duration: 1.2 }, iJar + 2);
  }

  // --- Bats, only while she wonders about them. Under reduced motion they hang
  // still across the well, wings held.
  master.to(bats, { opacity: 1, duration: 0.3 }, iBats);
  master.to(bats, { opacity: 0, duration: 0.2 }, iCats);
  const batEls = bats.querySelectorAll<HTMLElement>('.rh__bat');
  batEls.forEach((bat, index) => {
    if (reducedMotion) {
      gsap.set(bat, { x: `${20 + index * 25}vw`, y: `${(index % 2 === 0 ? -1 : 1) * 4}vh` });
      return;
    }
    ambient.fromTo(
      bat,
      { x: '-20vw', y: 0 },
      {
        x: '110vw',
        y: `${(index % 2 === 0 ? -1 : 1) * 12}vh`,
        duration: 6 + index * 1.7,
        ease: 'none',
        repeat: -1,
      },
      index * 1.2,
    );
  });

  // --- "Do cats eat bats? Do bats eat cats?" A bat chases a ghost of Dinah once
  // round the well, then Dinah turns and chases the bat round the other way: the
  // dream cannot answer either. The laps are the scroll's; a tap on either of them,
  // or Call Dinah, makes Dinah pounce, and the bat jinks out of reach.
  const chaseCat = chase.querySelector<HTMLElement>('.rh__chaser--cat');
  const chaseBat = chase.querySelector<HTMLElement>('.rh__chaser--bat');
  const laps = { turn: 0 };
  const pounce = { lunge: 0 };
  const applyChase = (): void => {
    if (!chaseCat || !chaseBat) {
      return;
    }
    const rx = Math.min(stageSize.w * 0.36, stageSize.h * 0.44);
    const ry = Math.min(stageSize.h * 0.2, rx * 0.8);
    // First lap anticlockwise with the bat behind; second clockwise, Dinah behind.
    const first = laps.turn <= 1;
    const dir = first ? -1 : 1;
    const lap = first ? laps.turn : laps.turn - 1;
    const lead = Math.PI / 2 + dir * lap * Math.PI * 2;
    const gap = 0.62 - pounce.lunge * 0.42;
    const place = (el: HTMLElement, angle: number, runner: boolean): void => {
      // The near side of the well is lower and nearer: larger.
      const near = 0.78 + 0.3 * Math.sin(angle);
      const heading = Math.atan2(Math.cos(angle) * ry * dir, -Math.sin(angle) * rx * dir);
      // Dinah is drawn facing right: she points along the way she runs, turned
      // over when it is leftward so she stays upright. The bat only banks.
      const upright = Math.cos(heading) < 0 ? -1 : 1;
      gsap.set(el, {
        x: Math.cos(angle) * rx,
        y: Math.sin(angle) * ry,
        rotation: runner ? (heading * 180) / Math.PI : -dir * 20 * Math.cos(angle),
        scaleX: near,
        scaleY: runner ? near * upright : near,
      });
    };
    const behind = lead - dir * gap;
    const catAngle = first ? lead : behind;
    const batAngle = first ? behind : lead + Math.sin(pounce.lunge * Math.PI) * 0.35 * dir;
    place(chaseCat, catAngle, true);
    place(chaseBat, batAngle, false);
  };
  master.fromTo(chase, { opacity: 0 }, { opacity: 1, duration: 0.12 }, iCats + 0.02);
  master.to(chase, { opacity: 0, duration: 0.1 }, iCats + 0.9);
  master.fromTo(
    laps,
    { turn: 0 },
    { turn: 1, duration: 0.42, ease: 'sine.inOut', onUpdate: applyChase, immediateRender: false },
    iCats + 0.05,
  );
  master.to(
    laps,
    { turn: 2, duration: 0.4, ease: 'sine.inOut', onUpdate: applyChase },
    iCats + 0.48,
  );
  applyChase();
  const callButton = shell.prop(shell.ui.demoCallDinah ?? '', 'rh__prop-call');
  const inChase = (): boolean => master.time() >= iCats && master.time() < iCats + 0.9;
  let pounceTimer = 0;
  const pounceNow = (): void => {
    if (!inChase()) {
      return;
    }
    shell.sound.play('whoosh', 0.35);
    gsap.fromTo(
      pounce,
      { lunge: 0 },
      {
        lunge: 1,
        duration: reducedMotion ? 0 : 0.28,
        ease: 'power2.out',
        yoyo: !reducedMotion,
        repeat: reducedMotion ? 0 : 1,
        onUpdate: applyChase,
        onComplete: () => {
          if (reducedMotion) {
            // A still: caught mid-pounce for a moment, then back.
            window.clearTimeout(pounceTimer);
            pounceTimer = window.setTimeout(() => {
              pounce.lunge = 0;
              applyChase();
            }, 700);
          }
        },
      },
    );
  };
  callButton.addEventListener('click', pounceNow);
  for (const chaser of [chaseCat, chaseBat]) {
    chaser?.addEventListener('click', pounceNow);
  }
  const showCall = (): void => {
    const here = inChase();
    here ? callButton.show() : callButton.hide();
    chase.toggleAttribute('data-play', here);
    if (!here) {
      window.clearTimeout(pounceTimer);
      gsap.killTweensOf(pounce);
      pounce.lunge = 0;
    }
  };
  master.call(showCall, [], iCats);
  master.call(showCall, [], iCats + 0.9);

  // --- The dream.
  master.to(camera, { mood: 1, duration: 1 }, iDream);
  master.to(camera, { mood: 0, duration: 0.6 }, iThump - 0.3);
  if (dinah) {
    master.fromTo(
      dinah,
      { opacity: 0, x: '20vw' },
      { opacity: 0.9, x: '0vw', duration: 0.8 },
      iDream + 0.1,
    );
    master.to(dinah, { opacity: 0, duration: 0.4 }, iThump - 0.5);
    if (!reducedMotion) {
      ambient.to(dinah, { y: -14, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
    }
  }

  // --- Thump.
  master.fromTo(
    flash,
    { opacity: 0 },
    { opacity: reducedMotion ? 0.35 : 0.9, duration: 0.06 },
    iThump,
  );
  master.to(flash, { opacity: 0, duration: 0.3 }, iThump + 0.06);
  master.call(() => (master.time() >= iThump ? shell.sound.play('thud') : undefined), [], iThump);
  if (!reducedMotion) {
    master.fromTo(camera, { shake: 0 }, { shake: 1, duration: 0.05 }, iThump);
    master.to(camera, { shake: 0, duration: 0.5, ease: 'power2.out' }, iThump + 0.05);
  }

  // --- The passage: the well goes dark, the rabbit hurries off ahead, and where it
  // went a door opens in the floor: the strange door in the ceiling of the hall of
  // doors, seen from above. She is drawn down through it, and beyond it is another
  // door, and another, until the last one opens on the hall itself, far below.
  master.to(dark, { opacity: 0.7, duration: 0.8 }, iEnd);
  if (rabbit) {
    // Above ground he is the field's, nose-down in the hole; below, he runs on
    // down the passage for the door, facing the way he goes.
    gsap.set(rabbit, { opacity: 0, xPercent: -50, x: '110vw', y: '0vh' });
    master.set(rabbit, { opacity: 1, x: '110vw', y: '0vh', scaleX: -1, scaleY: 1 }, iEnd);
    master.to(rabbit, { x: '47vw', y: '-24vh', duration: 0.35, ease: 'power1.in' }, iEnd + 0.05);
    master.to(
      rabbit,
      {
        y: '-16vh',
        scaleX: -0.15,
        scaleY: 0.15,
        opacity: 0,
        duration: reducedMotion ? 0.01 : 0.15,
        ease: 'power2.in',
      },
      iEnd + 0.4,
    );
  }
  // The doors are drawn by trapdoor.ts, which Drink Me draws its first frame with.
  const DOORS = TUNNEL_DOORS;
  const DOOR_GAP = 700;
  const doors = shell.layer('rh__doors trapdoor-shaft');
  doors.innerHTML = Array.from({ length: DOORS }, (_, i) => trapdoorHtml(i, 'rh__door')).join('');
  const doorEls = [...doors.querySelectorAll<HTMLElement>('.rh__door')];
  const tunnel = { fall: 0 };
  const applyTunnel = (): void => {
    doors.style.setProperty('--fall', tunnel.fall.toFixed(0));
    doorEls.forEach((door, i) => {
      // A door opens as she nears it, and is behind her once she is through.
      door.toggleAttribute('data-open', tunnel.fall > i * DOOR_GAP - 1100);
      door.toggleAttribute('data-passed', tunnel.fall > i * DOOR_GAP + 120);
    });
  };
  applyTunnel();
  master.call(
    () => doors.toggleAttribute('data-shown', master.time() >= iEnd + 0.3),
    [],
    iEnd + 0.3,
  );
  master.to(doors, { opacity: 1, duration: 0.15 }, iEnd + 0.3);
  master.to(well ? canvas : flat, { opacity: 0, duration: 0.3 }, iEnd + 0.5);
  master.fromTo(
    tunnel,
    { fall: 0 },
    {
      fall: (DOORS - 1) * DOOR_GAP,
      duration: reducedMotion ? 0.01 : 0.5,
      ease: 'power2.in',
      onUpdate: applyTunnel,
      immediateRender: false,
    },
    iEnd + 0.45,
  );
  for (let i = 1; i < DOORS; i += 1) {
    const at = iEnd + 0.45 + 0.5 * Math.sqrt(i / (DOORS - 1));
    master.call(
      () => {
        if (Math.abs(master.time() - at) < 0.08) {
          shell.sound.play('whoosh', 0.4 + i * 0.1);
        }
      },
      [],
      at,
    );
  }
  master.call(
    () => shell.sound.level('wind', master.time() >= iEnd + 0.45 ? 0.6 : 0),
    [],
    iEnd + 0.45,
  );

  // --- A map on the wall can be looked at while the shelves pass: it comes close
  // and holds still in front while the fall goes on behind it. The window runs
  // from the sentence that hangs the maps on their pegs to the end of the cupboard
  // beat, and the timeline closes it on leaving the window in either direction.
  const mapSheet = mapLayer.querySelector<HTMLElement>('.rh__map-sheet');
  const mapFrom = iJar - 0.6;
  const mapTo = iJar + 2;
  const lookButton = shell.prop(shell.ui.demoLookMap ?? '', 'rh__prop-map');
  const awayButton = shell.prop(shell.ui.demoLookAway ?? '', 'rh__prop-away');
  let mapOpen = false;
  const inMapBeats = (): boolean => master.time() >= mapFrom && master.time() < mapTo;
  const mapButtons = (): void => {
    const here = inMapBeats();
    here && !mapOpen ? lookButton.show() : lookButton.hide();
    here && mapOpen ? awayButton.show() : awayButton.hide();
  };
  const openMap = (fromX?: number, fromY?: number): void => {
    if (mapOpen || !inMapBeats()) {
      return;
    }
    mapOpen = true;
    // It comes from where it was tapped, or from the wall at the right.
    const box = shell.stage.getBoundingClientRect();
    const dx = fromX === undefined ? box.width * 0.3 : fromX - box.left - box.width / 2;
    const dy = fromY === undefined ? -box.height * 0.1 : fromY - box.top - box.height * 0.36;
    mapLayer.style.setProperty('--map-x', `${dx.toFixed(0)}px`);
    mapLayer.style.setProperty('--map-y', `${dy.toFixed(0)}px`);
    mapLayer.setAttribute('data-open', '');
    shell.sound.play('paper');
    mapButtons();
  };
  const closeMap = (): void => {
    if (!mapOpen) {
      return;
    }
    mapOpen = false;
    mapLayer.removeAttribute('data-open');
    shell.sound.play('paper');
    mapButtons();
  };
  lookButton.addEventListener('click', () => openMap());
  awayButton.addEventListener('click', closeMap);
  mapSheet?.addEventListener('click', closeMap);
  const leaveMapBeats = (): void => {
    if (!inMapBeats()) {
      closeMap();
    }
    mapButtons();
  };
  master.call(leaveMapBeats, [], mapFrom);
  master.call(leaveMapBeats, [], mapTo);

  // --- The shelves are full of things to take. Tap a book, a jar or a map as it
  // passes and it jumps into her hand; she would not drop it, so put it back into
  // a cupboard. A quick tap picks; a drag still tumbles her.
  const held = document.createElement('div');
  held.className = 'rh__held';
  const shelfCupboard = document.createElement('div');
  shelfCupboard.className = 'rh__shelf-cupboard';
  props.append(shelfCupboard, held);
  const backButton = shell.prop(shell.ui.demoPutBack ?? '', 'rh__prop-back');
  let holding = false;
  let downAt: { x: number; y: number; t: number } | undefined;
  canvas.setAttribute('data-pickable', '');
  const pickAt = (clientX: number, clientY: number): void => {
    if (!well || !hand || master.time() < iDrop + 0.9 || master.time() > iThump - 0.3) {
      return;
    }
    const box = shell.stage.getBoundingClientRect();
    // A map in its beats is looked at, not taken; anything else is taken, unless
    // her hand is full.
    const lookable = (kind: string): boolean => kind === 'map' && inMapBeats();
    const picked = well.pick(
      ((clientX - box.left) / box.width) * 2 - 1,
      -(((clientY - box.top) / box.height) * 2 - 1),
      (kind) => holding || lookable(kind),
    );
    if (!picked) {
      return;
    }
    if (lookable(picked.kind)) {
      openMap(clientX, clientY);
      return;
    }
    if (holding) {
      return;
    }
    holding = true;
    shell.sound.play('paper');
    held.innerHTML = heldSvg(picked.kind, picked.color);
    shell.keep(picked.kind === 'jar' ? 'jar' : 'book');
    const handBox = hand.getBoundingClientRect();
    gsap.fromTo(
      held,
      { x: clientX - box.left, y: clientY - box.top, scale: 0.5, opacity: 1, rotation: -30 },
      {
        x: handBox.left - box.left,
        y: handBox.top - box.top,
        scale: 1,
        rotation: -12,
        duration: reducedMotion ? 0 : 0.5,
        ease: 'power3.out',
      },
    );
    gsap.to(shelfCupboard, { opacity: 1, scale: 1, duration: reducedMotion ? 0 : 0.4, delay: 0.2 });
    backButton.show();
  };
  const putBack = (): void => {
    if (!holding) {
      return;
    }
    holding = false;
    backButton.hide();
    const box = shell.stage.getBoundingClientRect();
    const target = shelfCupboard.getBoundingClientRect();
    gsap.to(shelfCupboard, { '--door': 1, duration: reducedMotion ? 0 : 0.3 });
    gsap.to(held, {
      x: target.left - box.left + target.width / 2,
      y: target.top - box.top + target.height / 2,
      scale: 0.6,
      rotation: 0,
      duration: reducedMotion ? 0 : 0.5,
      delay: 0.1,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.to(held, { opacity: 0, duration: 0.15 });
        gsap.to(shelfCupboard, { '--door': 0, duration: reducedMotion ? 0 : 0.3 });
        gsap.to(shelfCupboard, { opacity: 0, scale: 0.8, duration: 0.3, delay: 0.5 });
      },
    });
    if (shell.ui.demoJarTucked) {
      shell.status(shell.ui.demoJarTucked);
    }
  };
  backButton.addEventListener('click', putBack);

  // --- Drag anywhere to tumble her: the spin keeps going and settles by itself.
  let spin = 0;
  let spinVelocity = 0;
  let dragging = false;
  let lastX = 0;
  shell.stage.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button, .rh__jar, .rh__map-sheet, .rh__chaser')) {
      return;
    }
    dragging = true;
    lastX = event.clientX;
    downAt = { x: event.clientX, y: event.clientY, t: performance.now() };
  });
  window.addEventListener('pointerup', (event) => {
    dragging = false;
    if (
      downAt &&
      performance.now() - downAt.t < 300 &&
      Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) < 8
    ) {
      pickAt(event.clientX, event.clientY);
    }
    downAt = undefined;
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!dragging || reducedMotion) {
        return;
      }
      spinVelocity += (event.clientX - lastX) * 0.6;
      lastX = event.clientX;
    },
    { passive: true },
  );

  // --- Per frame: pointer drift into the camera, and the well's own life.
  let elapsedSeen = 0;
  let lastProgress = shell.progress();
  const stride = runnerBox ? createStride(runnerBox, reducedMotion) : undefined;
  shell.onFrame((dt, elapsed) => {
    elapsedSeen = elapsed;
    // Scrolling fast is falling fast: the dust streaks and she tumbles a little.
    const progress = shell.progress();
    const velocity = Math.abs(progress - lastProgress) / Math.max(dt, 0.001);
    // Above ground the scroll is her stride, as it was on the bank.
    if (master.time() < iTunnel + 0.3) {
      stride?.step((progress - lastProgress) * shell.beats.length, dt);
    }
    lastProgress = progress;
    camera.rush = mix(camera.rush, Math.min(1, velocity * 6), Math.min(1, dt * 4));
    const falling = master.time() > iDrop + 0.5 && master.time() < iThump;
    shell.sound.level('wind', falling ? 0.25 + camera.rush * 0.75 : 0);
    if (!reducedMotion && camera.rush > 0.2) {
      spinVelocity += camera.rush * 8 * dt * (spinVelocity >= 0 ? 1 : -1);
    }
    if (!reducedMotion) {
      const steer = (shell.pointer.fine || shell.pointer.tilt) && shell.pointer.active;
      const targetX = steer ? shell.pointer.x : Math.sin(elapsed * 0.4) * 0.35;
      const targetY = steer ? shell.pointer.y : Math.cos(elapsed * 0.3) * 0.25;
      const k = Math.min(1, dt * 2.5);
      camera.driftX = mix(camera.driftX, targetX, k);
      camera.driftY = mix(camera.driftY, targetY, k);
      well?.tick(dt, elapsed);
      if (alice && (Math.abs(spinVelocity) > 0.01 || Math.abs(spin) > 0.01)) {
        spin += spinVelocity * dt;
        spinVelocity *= 1 - Math.min(1, dt * 1.5);
        spin *= 1 - Math.min(1, dt * 0.8);
        alice.style.setProperty('--tumble', spin.toFixed(2));
      }
    }
  });
  if (well) {
    const resize = (): void => well.resize(shell.stage.clientWidth, shell.stage.clientHeight);
    new ResizeObserver(resize).observe(shell.stage);
    resize();
    // Draw only while the well can be seen, and only when a frame would differ:
    // the surface before the drop and the hall after the doors leave the canvas
    // invisible, and a paused page or a stepped (reduced-motion) camera needs a
    // new frame only when the camera has moved.
    let lastPose = '';
    gsap.ticker.add(() => {
      const t = master.time();
      if (t < iDrop || t > iEnd + 0.85) {
        return;
      }
      if (reducedMotion) {
        well.tick(0, elapsedSeen);
      }
      if (shell.paused || reducedMotion) {
        const pose = `${camera.depth.toFixed(3)}|${camera.roll.toFixed(3)}|${camera.driftX.toFixed(3)}|${camera.driftY.toFixed(3)}|${camera.shake.toFixed(3)}|${camera.mood.toFixed(3)}|${camera.floor.toFixed(3)}`;
        if (pose === lastPose) {
          return;
        }
        lastPose = pose;
      }
      well.render();
    });
  }
}

const shell = attachDemo({
  caption: (beat, master, reduced, beats) =>
    depthCaption(
      beat,
      master,
      reduced,
      beats.find((candidate) => candidate.cue === 'drop')?.index ?? 0,
      beats.length - 1,
    ),
});

if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
