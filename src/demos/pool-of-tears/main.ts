/**
 * The Pool of Tears: the concept demo.
 *
 * The parallax is the swell. A Canvas sea rises through the hall as Alice cries,
 * takes her in with a splash when she shrinks, and carries her, the Mouse, and
 * eventually a Duck and a Dodo, a Lory and an Eaglet and the rest of the party,
 * out of the hall to the bank, where the race begins. The captions ride the
 * surface: each frame the stage samples the water under them and the sentences
 * bob and tilt with it. The reader sheds a giant tear of her own while she cries
 * and the pool rises a notch; fans herself smaller with the Rabbit's fan; stirs
 * the water with a finger or a pointer, or with a button; and leans it with the
 * pointer, the phone's tilt, or a pair of buttons.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { dressRunner, OPENING, RUNNERS } from '../caucus-race/figures.ts';
import '../caucus-race/caucus.css';
import { attachDemo, type DemoShell, mix } from '../shell/shell.ts';
import { FAN_SVG, TEAR_DROP_SVG } from './figures.ts';
import './pool.css';
import { createSea, type Swimmer } from './sea.ts';

/** How much one tear shed by hand raises the pool, and how many it may add. */
const NOTCH = 0.024;
const MAX_NOTCHES = 5;
/** How far one wave of the fan shrinks her, in horizon, and how many it may add. */
const FAN_STEP = 0.07;
const MAX_WAVES = 5;

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
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);

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
  // Tears she sheds by hand fall through their own layer, over the hall.
  const cryLayer = shell.layer('pt__cry');

  // --- The race's opening frame, in the race's own markup and sheet: the open
  // sky over the bank, the party standing at the water's edge seen from the
  // water, the water across the foreground. The pool ends on exactly this.
  const raceSky = shell.layer('cr__sky pt__race');
  const raceWorld = shell.layer('cr__world pt__race');
  const raceRing = document.createElement('div');
  raceRing.className = 'cr__ring';
  for (const [key, value] of Object.entries(OPENING.camera)) {
    raceRing.style.setProperty(`--${key}`, String(value));
  }
  raceWorld.append(raceRing);
  const party = RUNNERS.map((kind, index) => {
    const place = OPENING.places[index];
    const el = document.createElement('div');
    el.className = 'cr__runner';
    el.dataset.kind = kind;
    el.setAttribute('data-drip', '');
    el.style.setProperty('--i', String(index));
    el.style.setProperty('--a', (place?.angle ?? 0).toFixed(2));
    el.style.setProperty('--r', (place?.radius ?? 1).toFixed(3));
    el.innerHTML = figure(`runner/${kind}`);
    dressRunner(el, kind);
    raceRing.append(el);
    return { kind, el, sink: place?.sink ?? 0 };
  });
  const raceWater = shell.layer('cr__water pt__race');
  // 1 still swimming, low in the water; 0 standing as the race opens.
  const stand = { v: 1 };
  const applyStand = (): void => {
    for (const member of party) {
      member.el.style.setProperty('--y', (member.sink + stand.v * 70).toFixed(1));
    }
  };
  applyStand();

  const { state } = sea;
  const swimmer = (kind: Swimmer['kind'], x: number, dir: 1 | -1): Swimmer => ({
    x,
    dir,
    show: 0,
    jump: 0,
    bristle: 0,
    kind,
  });
  const mouse = swimmer('mouse', 1.3, -1);
  const alice = swimmer('alice', 0.5, 1);
  const named = (['duck', 'dodo', 'lory', 'eaglet'] as const).map((kind, i) =>
    swimmer(kind, -0.3 - i * 0.18, 1),
  );
  const curious = [swimmer('crab', 1.3, -1), swimmer('magpie', 1.45, -1)];
  const others = [...named, ...curious];
  state.swimmers = [...others, mouse, alice];

  // --- Nine feet high: the same giant view Drink Me ended on, her first tears
  // already falling, a low horizon with the dolls' doors and the toy table on the
  // floor. Then her head strikes the roof, and the tears come in earnest and the
  // pool rises; her skirt and the furniture go under it.
  state.horizon = 0.78;
  state.tears = 0.18;
  master.set(state, { horizon: 0.78, level: 0, tears: 0.18, hallDetail: 1 }, iGiant);
  master.to(roof, { '--fold': 0.72, duration: quick(0.18), ease: 'power3.in' }, iRoof + 0.4);
  master.call(
    () => (master.time() >= iRoof + 0.55 ? shell.sound.play('thud') : undefined),
    [],
    iRoof + 0.55,
  );
  master.to(state, { horizon: 0.86, duration: 0.6, ease: 'power2.in' }, iRoof);
  master.to(state, { tears: 1, duration: 0.5 }, iTears);
  master.to(roof, { '--fold': 0, duration: quick(0.6), ease: 'power2.inOut' }, iTears + 0.1);
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
  // Under reduced motion it is a still: under the water for the settled beat,
  // the sentences clear, and up again by the next.
  master.to(state, { level: 1.35, duration: quick(0.3), ease: 'power2.in' }, iSwim + 0.45);
  master.to(under, { opacity: 1, duration: quick(0.25) }, iSwim + 0.5);
  master.to(shell.captions, { '--under': 1, duration: quick(0.25) }, iSwim + 0.5);
  master.to(state, { level: 0.56, duration: quick(0.35), ease: 'power2.out' }, iSwim + 0.85);
  master.to(under, { opacity: 0, duration: quick(0.3) }, iSwim + 0.85);
  master.to(shell.captions, { '--under': 0, duration: quick(0.3) }, iSwim + 0.85);

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

  // --- The pool fills with creatures: the four the book names, then the Crab
  // and the Magpie, so that all the party the race is run by is in the water.
  named.forEach((other, index) => {
    master.to(
      other,
      { show: 1, x: 0.12 + index * 0.16, duration: 0.7, ease: 'power1.out' },
      iCrowd + index * 0.1,
    );
  });
  curious.forEach((other, index) => {
    master.to(
      other,
      { show: 1, x: 0.86 + index * 0.08, duration: 0.6, ease: 'power1.out' },
      iCrowd + 0.4 + index * 0.1,
    );
  });

  // --- To the shore. The hall gives way to the open sky over the bank, the water
  // settles flat at the race's own line, and they swim to their places at its
  // edge, Alice leading. There they stand up out of the water: the race's own
  // figures rise where the swimmers were, and the last frame is the race's first.
  master.to(state, { sky: 1, duration: 0.5, ease: 'power1.inOut' }, iShore);
  master.to(state, { level: 0.43, swell: 1.2, duration: 0.6, ease: 'power1.inOut' }, iShore);
  master.to(state, { zoom: 1.3, duration: 0.55, ease: 'power1.inOut' }, iShore + 0.05);
  const leading = [alice, mouse, ...others];
  leading.forEach((one, index) => {
    master.fromTo(
      one,
      { homing: 0 },
      { homing: 1, dir: 1, duration: 0.42, ease: 'power1.inOut', immediateRender: false },
      iShore + 0.02 + index * 0.02,
    );
  });
  master.to([raceSky, raceWater], { opacity: 1, duration: quick(0.12) }, iShore + 0.5);
  master.to(raceWorld, { opacity: 1, duration: quick(0.15) }, iShore + 0.55);
  master.to(
    stand,
    { v: 0, duration: quick(0.25), ease: 'power2.out', onUpdate: applyStand },
    iShore + 0.55,
  );
  master.to(state.swimmers, { show: 0, duration: quick(0.15) }, iShore + 0.6);
  master.call(
    () => shell.root.toggleAttribute('data-ashore', master.time() >= iShore + 0.6),
    [],
    iShore + 0.6,
  );
  master.call(
    () => {
      state.covered = master.time() >= iShore + 0.66;
    },
    [],
    iShore + 0.66,
  );

  // --- Swimming: hold a finger on the water and she swims toward it. The Mouse
  // keeps its distance while it is offended, and comes back when you give it room.
  let swimTarget: number | undefined;
  alice.offset = 0;
  mouse.offset = 0;

  // --- Cry a tear. While she sits and cries, nine feet high, one giant tear of
  // the reader's own falls past the eye, shrinking toward the floor far below,
  // splashes, and the pool rises a notch. The notches are the reader's: they
  // hold until she falls in, when the story's own water takes over.
  const cry = { notches: 0, level: 0 };
  const cryHold = { v: 1 };
  master.to(cryHold, { v: 0, duration: quick(0.3) }, iSplash + 0.05);
  const crying = (): boolean => master.time() >= iRoof && master.time() < iFan;
  const cryButton = shell.prop(shell.ui.demoCryTear ?? '', 'pt__prop pt__prop--cry');
  const offerCry = (): void => (crying() ? cryButton.show() : cryButton.hide());
  master.call(offerCry, [], iRoof);
  master.call(offerCry, [], iFan);
  let side = -1;
  const shedTear = (x: number, y?: number): void => {
    const land = sea.landAt(x, y);
    const height = shell.stage.clientHeight;
    const drop = document.createElement('div');
    drop.className = 'pt__tear';
    drop.innerHTML = TEAR_DROP_SVG;
    cryLayer.append(drop);
    const splash = (): void => {
      const crown = document.createElement('div');
      crown.className = 'pt__splash';
      gsap.set(crown, { x, y: land });
      cryLayer.append(crown);
      crown.addEventListener('animationend', () => crown.remove());
      // Reduced motion: no animation ends, so the still is taken away by a timer.
      if (reducedMotion) {
        window.setTimeout(() => crown.remove(), 900);
      }
      sea.stir(x, land, 2.4);
      shell.sound.play('splash', 0.6);
      cry.notches = Math.min(MAX_NOTCHES, cry.notches + 1);
      seaLayer.style.setProperty('--cried', String(cry.notches));
      gsap.to(cry, {
        level: cry.notches * NOTCH,
        duration: reducedMotion ? 0 : 0.6,
        ease: 'power2.out',
      });
    };
    if (reducedMotion) {
      // A still: the tear where it lands, and the splash, and the water up a notch.
      gsap.set(drop, { x, y: land, scale: 0.9 });
      splash();
      window.setTimeout(() => drop.remove(), 900);
      return;
    }
    gsap.fromTo(
      drop,
      { x, y: -height * 0.12, scale: 1.9 },
      {
        y: land,
        scale: 0.65,
        duration: 0.7,
        ease: 'power2.in',
        onComplete: () => {
          drop.remove();
          splash();
        },
      },
    );
  };
  cryButton.addEventListener('click', () => {
    // Beside her skirt, one side and then the other, where the floor shows.
    side = -side;
    shedTear(shell.stage.clientWidth * (0.5 + side * 0.36));
  });

  // --- Fan yourself. Each wave of the Rabbit's fan shrinks her a step: the
  // horizon climbs and the hall grows round her. The waves are the reader's; she
  // shrinks the whole way with the story anyway, and they are let go when she
  // falls in, or forgotten if the reader scrolls back before the fan.
  const waves = { count: 0, lift: 0 };
  const fanHold = { v: 0 };
  master.to(fanHold, { v: 1, duration: 0.01 }, iFan);
  master.to(fanHold, { v: 0, duration: quick(0.3) }, iSplash + 0.05);
  const fanning = (): boolean => master.time() >= iFan + 0.1 && master.time() < iSplash;
  const fanButton = shell.prop(shell.ui.demoFan ?? '', 'pt__prop pt__prop--fan');
  const offerFan = (): void => {
    const on = fanning();
    if (on) {
      fanButton.show();
    } else {
      fanButton.hide();
    }
    fan?.toggleAttribute('data-fannable', on);
    if (master.time() < iFan) {
      gsap.killTweensOf(waves);
      waves.count = 0;
      waves.lift = 0;
      seaLayer.style.setProperty('--fanned', '0');
    }
  };
  master.call(offerFan, [], iFan);
  master.call(offerFan, [], iFan + 0.1);
  master.call(offerFan, [], iSplash);
  const wave = (): void => {
    if (!fanning()) {
      return;
    }
    waves.count = Math.min(MAX_WAVES, waves.count + 1);
    seaLayer.style.setProperty('--fanned', String(waves.count));
    gsap.to(waves, {
      lift: waves.count * FAN_STEP,
      duration: reducedMotion ? 0 : 0.6,
      ease: 'power2.out',
    });
    if (fan) {
      // A sweep of the fan, or under reduced motion the fan cut to its other side.
      fan.toggleAttribute('data-side', !fan.hasAttribute('data-side'));
      fan.removeAttribute('data-sweep');
      void fan.offsetWidth;
      fan.setAttribute('data-sweep', '');
    }
    shell.sound.play('whoosh', 0.35);
  };
  fanButton.addEventListener('click', wave);
  fan?.addEventListener('click', wave);
  fan?.addEventListener('animationend', (event) => {
    if (event.animationName === 'pt-fan-sweep') {
      fan.removeAttribute('data-sweep');
    }
  });

  // --- Stirring the water, or, while she cries, a tear where the finger is.
  const stirAt = (clientX: number, clientY: number, strength = 1): void => {
    const box = shell.stage.getBoundingClientRect();
    sea.stir(clientX - box.left, clientY - box.top, strength);
    if (strength > 0.5) {
      shell.sound.play('splash', strength * 0.5);
    }
  };
  let dragging = false;
  canvas.addEventListener('pointerdown', (event) => {
    const box = shell.stage.getBoundingClientRect();
    if (crying()) {
      shedTear(event.clientX - box.left, event.clientY - box.top);
      return;
    }
    dragging = true;
    stirAt(event.clientX, event.clientY, 1.4);
    swimTarget = (event.clientX - box.left) / box.width;
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
  const stirButton = shell.prop(shell.ui.demoRipple ?? '', 'pt__prop pt__prop--stir');
  stirButton.addEventListener('click', () => {
    sea.stir(
      shell.stage.clientWidth * (0.3 + Math.random() * 0.4),
      shell.stage.clientHeight * (1 - state.level),
      1.4,
    );
  });
  // Offered in the water, and not once the party is ashore.
  const offerStir = (): void => {
    const t = master.time();
    if (t >= iSwim && t < iShore + 0.45) {
      stirButton.show();
    } else {
      stirButton.hide();
    }
  };
  master.call(offerStir, [], iSwim);
  master.call(offerStir, [], iShore + 0.45);

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

  // --- Per frame: the sea lives, and the captions ride it. Layout is read on
  // resize only: the sea's size, and where each of the party stands at the bank.
  const resize = (): void => {
    sea.resize(shell.stage.clientWidth, shell.stage.clientHeight);
    const box = shell.stage.getBoundingClientRect();
    for (const one of state.swimmers) {
      const member = party.find((candidate) => candidate.kind === one.kind);
      if (member && box.width > 0) {
        const r = member.el.getBoundingClientRect();
        one.home = (r.left + r.width / 2 - box.left) / box.width;
      }
    }
  };
  new ResizeObserver(resize).observe(shell.stage);
  resize();
  let bob = 0;
  let tilt = 0;
  shell.onFrame((dt, elapsed) => {
    lastElapsed = elapsed;
    state.extraLevel = cry.level * cryHold.v;
    state.extraHorizon = waves.lift * fanHold.v;
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
    for (const one of state.swimmers) {
      const drift = one.drift ?? 0;
      one.drift =
        one.show > 0.5 && Math.abs(lean) > 0.3
          ? Math.max(-0.2, Math.min(0.2, drift + downhill))
          : mix(drift, 0, Math.min(1, dt * 0.8));
    }
    sea.tick(dt, elapsed);
    shell.sound.level(
      'waves',
      state.covered ? 0 : Math.max(0, Math.min(1, (state.level - 0.2) * 1.2)) * 0.5,
    );
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
