/**
 * The Pool of Tears: the concept demo.
 *
 * The parallax is the swell. A Canvas sea rises through the hall as Alice cries,
 * takes her in with a splash when she shrinks, and carries her, the Mouse, and
 * eventually a Duck and a Dodo, a Lory and an Eaglet, to the shore. The captions
 * ride the surface: each frame the stage samples the water under them and the
 * sentences bob and tilt with it. The reader stirs the water with a finger or a
 * pointer, or with a button, and leans it with the pointer, the phone's tilt, or
 * a pair of buttons: the surface tips a few degrees, the water slops to the low
 * side, and everything afloat drifts downhill.
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
  const iGiant = cue('giant');
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
  // Her own skirt and shoes at the bottom of the frame, as Drink Me left them:
  // she is the camera still, nine feet high, until the pool takes her.
  const selfLayer = shell.layer('pt__self-layer');
  selfLayer.innerHTML = `<div class="pt__self">${figure('alice/looking-down')}</div>`;
  const self = selfLayer.querySelector<HTMLElement>('.pt__self');
  // The roof, folded in at the top of the frame where her head met it.
  const roof = shell.layer('pt__roof');
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
  const mouse: Swimmer = {
    x: 1.3,
    dir: -1,
    show: 0,
    jump: 0,
    bristle: 0,
    climb: 0,
    kind: 'mouse',
  };
  const alice: Swimmer = {
    x: 0.5,
    dir: 1,
    show: 0,
    jump: 0,
    bristle: 0,
    climb: 0,
    kind: 'alice',
  };
  const others: Swimmer[] = (['duck', 'dodo', 'lory', 'eaglet'] as const).map((kind, i) => ({
    x: -0.3 - i * 0.18,
    dir: 1,
    show: 0,
    jump: 0,
    bristle: 0,
    climb: 0,
    kind,
  }));
  state.swimmers = [...others, mouse, alice];

  // --- Nine feet high: the same giant view Drink Me ended on, her first tears
  // already falling, a low horizon with the dolls' doors and the toy table on the
  // floor. Then her head strikes the roof, and the tears come in earnest and the
  // pool rises; her skirt and the furniture go under it.
  state.horizon = 0.78;
  state.tears = 0.18;
  master.set(state, { horizon: 0.78, level: 0, tears: 0.18, hallDetail: 1 }, iGiant);
  master.to(
    roof,
    { '--fold': 0.72, duration: reducedMotion ? 0.01 : 0.18, ease: 'power3.in' },
    iRoof + 0.4,
  );
  master.call(
    () => (master.time() >= iRoof + 0.55 ? shell.sound.play('thud') : undefined),
    [],
    iRoof + 0.55,
  );
  master.to(state, { horizon: 0.86, duration: 0.6, ease: 'power2.in' }, iRoof);
  master.to(state, { tears: 1, duration: 0.5 }, iTears);
  master.to(
    roof,
    { '--fold': 0, duration: reducedMotion ? 0.01 : 0.6, ease: 'power2.inOut' },
    iTears + 0.1,
  );
  master.to(state, { hallDetail: 0, duration: 0.6 }, iTears + 0.2);
  master.to(state, { level: 0.14, duration: 1.6, ease: 'power1.in' }, iTears + 0.3);
  master.to(
    self,
    { opacity: 0, yPercent: reducedMotion ? 0 : 30, duration: 0.8, ease: 'power1.in' },
    iTears + 0.5,
  );
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

  // --- The pool fills with creatures, and everyone swims to the shore: the bank
  // comes in far enough to meet them, they swim up to it in a loose group on the
  // right, and climb out one after another, the last of them as the beat ends.
  others.forEach((other, index) => {
    master.to(
      other,
      { show: 1, x: 0.12 + index * 0.16, duration: 0.7, ease: 'power1.out' },
      iCrowd + index * 0.1,
    );
  });
  master.to(state, { shore: 1, duration: 0.8, ease: 'power2.out' }, iShore);
  master.to(state, { pan: 0, level: 0.5, duration: 0.8 }, iShore);
  const landing: [Swimmer, number][] = [
    [others[0] as Swimmer, 0.5],
    [others[1] as Swimmer, 0.62],
    [alice, 0.7],
    [others[2] as Swimmer, 0.79],
    [others[3] as Swimmer, 0.88],
    [mouse, 0.95],
  ];
  landing.forEach(([swimmer, x], index) => {
    master.to(swimmer, { x, dir: 1, duration: 0.7, ease: 'power1.inOut' }, iShore + 0.05);
    master.to(
      swimmer,
      { climb: 1, duration: 0.3, ease: 'power2.out' },
      iShore + 0.45 + index * 0.05,
    );
  });
  master.call(
    () => shell.root.toggleAttribute('data-ashore', master.time() >= iShore + 0.5),
    [],
    iShore + 0.5,
  );

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

  // --- Leaning the water. While she is in the pool the surface tips with the
  // pointer (the mouse, or the phone's tilt when the reader turned it on); the
  // buttons tip it the same way for a couple of seconds and let it level again.
  // The lean is one parameter the existing draw reads: no extra canvas pass.
  const LEAN_MAX = 6;
  const LEAN_HOLD = 2;
  let lean = 0;
  let leanSpeed = 0;
  let pulseDir = 0;
  let pulseUntil = 0;
  let lastElapsed = 0;
  let lastSplash = -1;
  let atEdge = false;
  const leanLeft = shell.prop(shell.ui.demoLeanLeft ?? '', 'pt__prop pt__prop--left');
  const leanRight = shell.prop(shell.ui.demoLeanRight ?? '', 'pt__prop pt__prop--right');
  const pulse = (dir: -1 | 1): void => {
    pulseDir = dir;
    pulseUntil = lastElapsed + LEAN_HOLD;
  };
  leanLeft.addEventListener('click', () => pulse(-1));
  leanRight.addEventListener('click', () => pulse(1));
  const inPool = (): boolean => {
    const t = master.time();
    return t >= iSplash + 0.3 && t < iShore + 0.45;
  };
  // Offered while she swims, from the drowning beat until the party is ashore.
  const offerLean = (): void => {
    const shown = master.time() >= iSwim && inPool();
    for (const button of [leanLeft, leanRight]) {
      shown ? button.show() : button.hide();
    }
  };
  master.call(offerLean, [], iSwim);
  master.call(offerLean, [], iShore + 0.45);
  const leanTarget = (elapsed: number): number => {
    if (elapsed < pulseUntil) {
      return pulseDir * LEAN_MAX;
    }
    if (inPool() && shell.pointer.active) {
      return Math.max(-1, Math.min(1, shell.pointer.x)) * LEAN_MAX;
    }
    return 0;
  };

  // --- Per frame: the sea lives, and the captions ride it.
  const resize = (): void => sea.resize(shell.stage.clientWidth, shell.stage.clientHeight);
  new ResizeObserver(resize).observe(shell.stage);
  resize();
  let bob = 0;
  let tilt = 0;
  shell.onFrame((dt, elapsed) => {
    lastElapsed = elapsed;
    // The lean: a loose spring toward the target, so the water slops past it and
    // settles; under reduced motion a quiet cut to the angle instead.
    const target = leanTarget(elapsed);
    if (reducedMotion) {
      lean = target;
    } else {
      // Small fixed steps, so a slow frame neither explodes the spring nor slows it.
      for (let left = Math.min(dt, 0.25); left > 0; left -= 0.02) {
        const step = Math.min(left, 0.02);
        leanSpeed += ((target - lean) * 40 - leanSpeed * 7) * step;
        lean += leanSpeed * step;
      }
      lean = Math.max(-LEAN_MAX * 1.15, Math.min(LEAN_MAX * 1.15, lean));
    }
    state.lean = lean;
    // The slop reaching the edge: one splash as it arrives, not while it sits there.
    const edge = Math.abs(lean) >= LEAN_MAX * 0.85;
    if (edge && !atEdge && elapsed - lastSplash > 0.8) {
      shell.sound.play('splash', 0.35);
      lastSplash = elapsed;
    }
    atEdge = edge;
    seaLayer.style.setProperty('--lean', lean.toFixed(2));
    // Everything afloat drifts downhill, and comes back to its place when the
    // water levels; the cut has no slop, so nothing drifts under it.
    const downhill = reducedMotion ? 0 : Math.sin((lean * Math.PI) / 180) * dt * 0.5;
    for (const swimmer of state.swimmers) {
      const drift = swimmer.drift ?? 0;
      swimmer.drift =
        swimmer.show > 0.5 && (swimmer.climb ?? 0) < 0.5 && Math.abs(lean) > 0.3
          ? Math.max(-0.2, Math.min(0.2, drift + downhill))
          : mix(drift, 0, Math.min(1, dt * 0.8));
    }
    sea.tick(dt, elapsed);
    shell.sound.level('waves', Math.max(0, Math.min(1, (state.level - 0.2) * 1.2)) * 0.5);
    if (alice.show > 0.5 && !reducedMotion) {
      const want = swimTarget === undefined ? 0 : swimTarget - alice.x;
      const before = alice.offset ?? 0;
      alice.offset = mix(before, Math.max(-0.45, Math.min(0.45, want)), Math.min(1, dt * 1.2));
      alice.dir =
        alice.offset - before > 0.0005 ? 1 : alice.offset - before < -0.0005 ? -1 : alice.dir;
      if (Math.abs(alice.offset - before) > 0.0008 && Math.random() < dt * 6) {
        sea.stir(
          (alice.x + alice.offset + (alice.drift ?? 0)) * shell.stage.clientWidth,
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
      tilt = mix(tilt, Math.atan(surface.slope) * 12 - lean * 0.4, Math.min(1, dt * 6));
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
