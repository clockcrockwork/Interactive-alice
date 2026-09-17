/**
 * Down the Rabbit-Hole: the concept demo.
 *
 * The parallax here is the fall itself. A WebGL well runs the length of the
 * scroll, the camera descends through it, and the story's sentences rise out of
 * the depth, pass the reader and vanish overhead. Around the well, DOM layers carry
 * Alice, the jar she takes from a shelf, the bats she wonders about, Dinah in the
 * dream, and the ground that finally arrives.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type Beat, type DemoShell, mix } from '../shell/shell.ts';
import { JAR_SVG } from './figures.ts';
import './rabbit-hole.css';
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
  const iDrop = shell.cue('drop');
  const iJar = shell.cue('jar');
  const iFlip = shell.cue('flip');
  const iBats = shell.cue('bats');
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
  surface.innerHTML =
    '<div class="rh__sun"></div><div class="rh__tree"></div><div class="rh__hedge"></div><div class="rh__hole"></div>';
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
  const flash = shell.layer('rh__flash');
  const dark = shell.layer('rh__dark');

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

  const hole = surface.querySelector<HTMLElement>('.rh__hole');
  const alice = props.querySelector<HTMLElement>('.rh__alice');
  const hand = props.querySelector<HTMLElement>('.rh__hand');
  const jarTrack = props.querySelector<HTMLElement>('.rh__jar-track');
  const jar = props.querySelector<HTMLElement>('.rh__jar');
  const cupboard = props.querySelector<HTMLElement>('.rh__cupboard');
  const dinah = props.querySelector<HTMLElement>('.rh__dinah');
  const rabbit = props.querySelector<HTMLElement>('.rh__rabbit');

  // --- The surface, then the drop.
  master.fromTo(
    surface,
    { '--hole': 0.15 },
    { '--hole': 1.35, duration: iDrop, ease: 'power2.in' },
    0,
  );
  master.to(surface, { opacity: 0, duration: 0.7 }, iDrop);
  master.to(well ? canvas : flat, { opacity: 1, duration: 0.6 }, iDrop + 0.05);
  if (hole) {
    master.to(hole, { scale: 6, duration: 0.7, ease: 'power3.in' }, iDrop);
  }

  const camera = well?.camera ?? {
    depth: 0,
    roll: 0,
    driftX: 0,
    driftY: 0,
    shake: 0,
    mood: 0,
    floor: 0,
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
    if (!reducedMotion) {
      master.to(alice, { rotation: 180, duration: 0.8, ease: 'power2.inOut' }, iFlip + 0.1);
      master.to(camera, { roll: Math.PI, duration: 0.8, ease: 'power2.inOut' }, iFlip + 0.1);
      master.to(alice, { rotation: 360, duration: 0.8, ease: 'power2.inOut' }, iFlip + 1.2);
      master.to(camera, { roll: Math.PI * 2, duration: 0.8, ease: 'power2.inOut' }, iFlip + 1.2);
      // The curtsey: a small bob at the end of the turn.
      master.to(
        alice,
        { y: 24, duration: 0.15, yoyo: true, repeat: 1, ease: 'sine.inOut' },
        iFlip + 1.55,
      );
    }
    master.to(alice, { y: 60, scale: 0.9, duration: 0.5, ease: 'power3.out' }, iThump);
    master.to(alice, { opacity: 0, duration: 0.5 }, iEnd + 0.2);
  }

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
    if (shell.ui.demoJarTucked) {
      shell.status(shell.ui.demoJarTucked);
    }
  };
  takeButton.addEventListener('click', take);
  jar?.addEventListener('click', take);
  if (jarTrack) {
    master.fromTo(jarTrack, { y: '70vh' }, { y: '-75vh', duration: 1.6 }, iJar - 0.2);
    master.call(
      () => (master.time() >= iJar - 0.1 ? takeButton.show() : takeButton.hide()),
      [],
      iJar - 0.1,
    );
    master.call(() => takeButton.hide(), [], iJar + 1.1);
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

  // --- Bats, only while she wonders about them.
  master.to(bats, { opacity: 1, duration: 0.3 }, iBats);
  master.to(bats, { opacity: 0, duration: 0.3 }, iBats + 1.8);
  const batEls = bats.querySelectorAll<HTMLElement>('.rh__bat');
  batEls.forEach((bat, index) => {
    ambient.fromTo(
      bat,
      { x: '-20vw', y: 0 },
      {
        x: '110vw',
        y: `${(index % 2 === 0 ? -1 : 1) * 12}vh`,
        duration: reducedMotion ? 0.001 : 6 + index * 1.7,
        ease: 'none',
        repeat: -1,
      },
      index * 1.2,
    );
  });
  if (reducedMotion) {
    batEls.forEach((bat, index) => {
      gsap.set(bat, { x: `${20 + index * 25}vw` });
    });
  }

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
  if (!reducedMotion) {
    master.fromTo(camera, { shake: 0 }, { shake: 1, duration: 0.05 }, iThump);
    master.to(camera, { shake: 0, duration: 0.5, ease: 'power2.out' }, iThump + 0.05);
  }

  // --- The passage: the well goes dark and the rabbit hurries off.
  master.to(dark, { opacity: 0.7, duration: 0.8 }, iEnd);
  if (rabbit) {
    // Above ground he runs for the hole and drops in; below, he hurries off ahead.
    master.fromTo(
      rabbit,
      { x: '-30vw', y: '-6vh', scale: 1.1 },
      { x: '45vw', y: '4vh', scale: 0.35, duration: iDrop * 0.9, ease: 'power1.in' },
      0,
    );
    master.to(rabbit, { opacity: 0, duration: 0.05 }, iDrop * 0.9);
    master.set(rabbit, { opacity: 1, x: '110vw', y: '0vh', scale: 1 }, iEnd);
    master.to(rabbit, { x: '-40vw', duration: 0.9, ease: 'power1.in' }, iEnd + 0.1);
  }

  // --- Per frame: pointer drift into the camera, and the well's own life.
  let elapsedSeen = 0;
  shell.onFrame((dt, elapsed) => {
    elapsedSeen = elapsed;
    if (!reducedMotion) {
      const targetX =
        shell.pointer.fine && shell.pointer.active
          ? shell.pointer.x
          : Math.sin(elapsed * 0.4) * 0.35;
      const targetY =
        shell.pointer.fine && shell.pointer.active
          ? shell.pointer.y
          : Math.cos(elapsed * 0.3) * 0.25;
      const k = Math.min(1, dt * 2.5);
      camera.driftX = mix(camera.driftX, targetX, k);
      camera.driftY = mix(camera.driftY, targetY, k);
      well?.tick(dt, elapsed);
    }
  });
  if (well) {
    const resize = (): void => well.resize(shell.stage.clientWidth, shell.stage.clientHeight);
    new ResizeObserver(resize).observe(shell.stage);
    resize();
    gsap.ticker.add(() => {
      if (reducedMotion) {
        well.tick(0, elapsedSeen);
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
