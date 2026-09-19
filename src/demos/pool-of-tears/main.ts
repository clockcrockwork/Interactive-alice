/**
 * The Pool of Tears: the concept demo.
 *
 * The parallax is the swell. A Canvas sea rises through the hall as Alice cries,
 * takes her in with a splash when she shrinks, and carries her, the Mouse, and
 * eventually a Duck and a Dodo, a Lory and an Eaglet, to the shore. The captions
 * ride the surface: each frame the stage samples the water under them and the
 * sentences bob and tilt with it. The reader stirs the water with a finger or a
 * pointer, or with a button.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix } from '../shell/shell.ts';
import { FAN_SVG } from './figures.ts';
import './pool.css';
import { createSea, type Swimmer } from './sea.ts';

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iRoof = cue('roof');
  const iTears = cue('tears');
  const iRabbit = cue('rabbit');
  const iFan = cue('fan');
  const iSplash = cue('splash');
  const iSwim = cue('swim');
  const iMouse = cue('mouse');
  const iFrench = cue('french');
  const iCats = cue('cats');
  const iDogs = cue('dogs');
  const iBack = cue('back');
  const iCrowd = cue('crowd');
  const iShore = cue('shore');

  const seaLayer = shell.layer('pt__sea');
  const canvas = document.createElement('canvas');
  canvas.className = 'pt__canvas';
  seaLayer.append(canvas);
  const sea = createSea(canvas, reducedMotion);
  if (!sea) {
    return;
  }
  const under = shell.layer('pt__under');
  const props = shell.layer('pt__props');
  props.innerHTML =
    `<div class="pt__rabbit">${figure('white-rabbit/running')}</div>` +
    `<div class="pt__dinah">${figure('dinah-cat')}</div>` +
    `<div class="pt__fan">${FAN_SVG}</div>`;
  const rabbit = props.querySelector<HTMLElement>('.pt__rabbit');
  const dinah = props.querySelector<HTMLElement>('.pt__dinah');
  const fan = props.querySelector<HTMLElement>('.pt__fan');

  const { state } = sea;
  const mouse: Swimmer = { x: 1.3, dir: -1, show: 0, jump: 0, bristle: 0, kind: 'mouse' };
  const alice: Swimmer = { x: 0.5, dir: 1, show: 0, jump: 0, bristle: 0, kind: 'alice' };
  const others: Swimmer[] = (['duck', 'dodo', 'lory', 'eaglet'] as const).map((kind, i) => ({
    x: -0.3 - i * 0.18,
    dir: 1,
    show: 0,
    jump: 0,
    bristle: 0,
    kind,
  }));
  state.swimmers = [...others, mouse, alice];

  // --- Nine feet high: a low horizon, then the roof, then tears and the pool.
  master.set(state, { horizon: 0.78, level: 0 }, 0);
  master.to(state, { horizon: 0.86, duration: 0.6, ease: 'power2.in' }, iRoof);
  master.to(state, { tears: 1, duration: 0.5 }, iTears);
  master.to(state, { level: 0.14, duration: 1.6, ease: 'power1.in' }, iTears + 0.3);
  master.fromTo(
    rabbit,
    { opacity: 1, x: '110vw' },
    { x: '-30vw', duration: 0.9, ease: 'none' },
    iRabbit + 0.05,
  );
  master.set(rabbit, { opacity: 0 }, iRabbit + 0.96);
  master.fromTo(fan, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.3 }, iFan);
  master.call(
    () => fan?.toggleAttribute('data-waving', master.time() >= iFan + 0.1),
    [],
    iFan + 0.1,
  );
  // Fanning shrinks her: the horizon climbs, the pool comes up to meet her.
  master.to(state, { horizon: 0.5, tears: 0, duration: 0.8, ease: 'power2.in' }, iFan + 0.2);
  master.to(fan, { opacity: 0, y: 160, duration: 0.2 }, iSplash);
  master.to(
    state,
    { level: 0.56, swell: reducedMotion ? 3 : 14, duration: 0.25, ease: 'power3.in' },
    iSplash + 0.05,
  );
  master.call(
    () => {
      if (master.time() >= iSplash + 0.3) {
        sea.stir(shell.stage.clientWidth / 2, shell.stage.clientHeight * 0.44, 1.5);
      }
    },
    [],
    iSplash + 0.3,
  );
  master.to(state, { swell: reducedMotion ? 2 : 7, duration: 0.6 }, iSplash + 0.4);
  master.to(alice, { show: 1, duration: 0.3 }, iSplash + 0.3);
  // Drowned in her own tears, for a moment: the water goes over the camera.
  master.to(state, { level: 1.35, duration: 0.3, ease: 'power2.in' }, iSwim + 0.45);
  master.to(under, { opacity: 1, duration: 0.25 }, iSwim + 0.5);
  master.to(shell.captions, { '--under': 1, duration: 0.25 }, iSwim + 0.5);
  master.to(state, { level: 0.56, duration: 0.35, ease: 'power2.out' }, iSwim + 0.85);
  master.to(under, { opacity: 0, duration: 0.3 }, iSwim + 0.85);
  master.to(shell.captions, { '--under': 0, duration: 0.3 }, iSwim + 0.85);

  // --- The Mouse.
  master.to(mouse, { show: 1, x: 0.72, duration: 0.8, ease: 'power1.out' }, iMouse);
  master.to(mouse, { jump: 1, duration: 0.12, ease: 'power2.out' }, iFrench + 0.15);
  master.to(mouse, { jump: 0, duration: 0.18, ease: 'power2.in' }, iFrench + 0.27);
  master.call(
    () => {
      if (master.time() >= iFrench + 0.44) {
        sea.stir(mouse.x * shell.stage.clientWidth, shell.stage.clientHeight * 0.44, 1.2);
      }
    },
    [],
    iFrench + 0.44,
  );
  master.to(mouse, { bristle: 1, duration: 0.3 }, iCats + 0.3);
  master.fromTo(dinah, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, iCats + 0.15);
  master.to(dinah, { opacity: 0, duration: 0.3 }, iDogs);
  master.to(mouse, { x: 1.25, dir: 1, bristle: 0, duration: 0.7, ease: 'power2.in' }, iDogs + 0.3);
  master.to(mouse, { x: 0.68, dir: -1, duration: 0.9, ease: 'power1.out' }, iBack + 0.2);

  // --- The pool fills with creatures, and everyone swims to the shore.
  others.forEach((other, index) => {
    master.to(
      other,
      { show: 1, x: 0.12 + index * 0.16, duration: 0.7, ease: 'power1.out' },
      iCrowd + index * 0.1,
    );
  });
  master.to(state, { shore: 1, duration: 0.8, ease: 'power2.out' }, iShore);
  master.to(state, { pan: 0, level: 0.5, duration: 0.8 }, iShore);
  for (const swimmer of state.swimmers) {
    master.to(swimmer, { x: '+=0.3', dir: 1, duration: 0.9, ease: 'power1.inOut' }, iShore + 0.1);
  }

  // --- Swimming: hold a finger on the water and she swims toward it. The Mouse
  // keeps its distance while it is offended, and comes back when you give it room.
  let swimTarget: number | undefined;
  alice.offset = 0;
  mouse.offset = 0;

  // --- Stirring the water.
  const stirAt = (clientX: number, clientY: number, strength = 1): void => {
    const box = shell.stage.getBoundingClientRect();
    sea.stir(clientX - box.left, clientY - box.top, strength);
    if (strength > 0.5) {
      shell.sound.play('splash', strength * 0.5);
    }
  };
  let dragging = false;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    stirAt(event.clientX, event.clientY, 1.4);
    swimTarget =
      (event.clientX - shell.stage.getBoundingClientRect().left) / shell.stage.clientWidth;
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    swimTarget = undefined;
  });
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (dragging || (shell.pointer.fine && Math.hypot(event.movementX, event.movementY) > 12)) {
        stirAt(event.clientX, event.clientY, dragging ? 0.8 : 0.25);
        if (dragging) {
          swimTarget =
            (event.clientX - shell.stage.getBoundingClientRect().left) / shell.stage.clientWidth;
        }
      }
    },
    { passive: true },
  );
  const stirButton = shell.prop(shell.ui.demoRipple ?? '', 'pt__prop');
  stirButton.addEventListener('click', () => {
    sea.stir(
      shell.stage.clientWidth * (0.3 + Math.random() * 0.4),
      shell.stage.clientHeight * (1 - state.level),
      1.4,
    );
  });
  master.call(() => (master.time() >= iSwim ? stirButton.show() : stirButton.hide()), [], iSwim);

  // --- Per frame: the sea lives, and the captions ride it.
  const resize = (): void => sea.resize(shell.stage.clientWidth, shell.stage.clientHeight);
  new ResizeObserver(resize).observe(shell.stage);
  resize();
  let bob = 0;
  let tilt = 0;
  shell.onFrame((dt, elapsed) => {
    sea.tick(dt, elapsed);
    if (alice.show > 0.5 && !reducedMotion) {
      const want = swimTarget === undefined ? 0 : swimTarget - alice.x;
      const before = alice.offset ?? 0;
      alice.offset = mix(before, Math.max(-0.45, Math.min(0.45, want)), Math.min(1, dt * 1.2));
      alice.dir =
        alice.offset - before > 0.0005 ? 1 : alice.offset - before < -0.0005 ? -1 : alice.dir;
      if (Math.abs(alice.offset - before) > 0.0008 && Math.random() < dt * 6) {
        sea.stir(
          (alice.x + alice.offset) * shell.stage.clientWidth,
          shell.stage.clientHeight * (1 - state.level),
          0.3,
        );
      }
      // The Mouse: offended, it swims off from her; calm, it drifts back.
      const gap = mouse.x + (mouse.offset ?? 0) - (alice.x + alice.offset);
      const t = master.time();
      const offended = t >= iFrench + 0.3 && t < iBack;
      const wantMouse =
        offended && Math.abs(gap) < 0.22
          ? (mouse.offset ?? 0) + Math.sign(gap || 1) * 0.3 * dt
          : mix(mouse.offset ?? 0, 0, Math.min(1, dt * 0.5));
      mouse.offset = Math.max(-0.5, Math.min(0.5, wantMouse));
    }
    if (!reducedMotion && state.level > 0.2) {
      const centre = shell.stage.clientWidth / 2;
      const surface = sea.surfaceAt(centre);
      const rest = shell.stage.clientHeight * (1 - state.level);
      bob = mix(bob, (surface.y - rest) * 0.6, Math.min(1, dt * 6));
      tilt = mix(tilt, Math.atan(surface.slope) * 12, Math.min(1, dt * 6));
    } else {
      bob = mix(bob, 0, Math.min(1, dt * 4));
      tilt = mix(tilt, 0, Math.min(1, dt * 4));
    }
    shell.captions.style.setProperty('--bob', bob.toFixed(2));
    shell.captions.style.setProperty('--tilt', tilt.toFixed(3));
  });
  gsap.ticker.add(() => sea.draw());
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
