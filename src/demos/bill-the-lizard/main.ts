/**
 * Bill the Lizard: the concept demo.
 *
 * The reader is Bill. It opens on the garden from the chimney's rim, the picture
 * the Rabbit's house ends on; sent down, the camera drops through the rim into a
 * brick shaft that rushes past. A foot rises from below, waits, and the kick sends
 * the camera up like a sky-rocket, spinning, out of the chimney and into the
 * clouds. Then the view is the garden's: Bill tumbles out of the sky toward the
 * hedge, and the crowd by the hedge can be moved under him to catch him. Down, he
 * is dazed; a guinea-pig holds up his head and gives him the brandy, and he comes
 * round enough to tell them about it. The parallax is vertical, and the screen
 * itself takes the kick.
 */

import gsap from 'gsap';
import { figure, svgFigure } from '../art/art.ts';
import '../rabbit-house/house.css';
import { RIM_SVG } from '../rabbit-house/figures.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './bill.css';
import { BOTTLE_SVG, CLUMP_SVG, GARDEN_HOUSE_SVG, LEAVES } from './figures.ts';

/** Where Bill comes down, as a share of the frame's width. */
const LAND_X = 0.64;
/** Where the crowd by the hedge stands until the reader moves it. */
const CROWD_START = 0.34;
/** How near his landing the crowd must stand to catch him, and one press's step. */
const CATCH_REACH = 0.08;
const CATCH_STEP = 0.1;
/** The ground line, as a share of the frame's height. */
const GROUND = 0.81;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Bill's pose in the garden: his feet's place (shares of the frame) and his turn. */
interface Pose {
  x: number;
  y: number;
  r: number;
}

/** The tumble out of the sky, as a function of the fall's progress. */
function fallPose(t: number, reduced: boolean): Pose {
  return {
    x: 0.5 + (LAND_X - 0.5) * t + 0.06 * Math.sin(2.5 * Math.PI * t) * (1 - t),
    y: -0.15 + (0.7 + 0.15) * (reduced ? t : t ** 1.6),
    r: reduced ? 160 : 540 * t,
  };
}

/** On his back across the crowd's paws; head first in the hedge; on his back on the grass. */
const CAUGHT: Pose = { x: LAND_X, y: 0.75, r: 180 };
const IN_THE_HEDGE: Pose = { x: LAND_X, y: 0.76, r: 95 };
const ON_THE_GROUND: Pose = { x: LAND_X, y: GROUND, r: 180 };

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iDescend = cue('descend');
  const iFoot = cue('foot');
  const iKick = cue('kick');
  const iLaunch = cue('launch');
  const iLand = cue('land');
  const iBrandy = cue('brandy');

  // --- Bill's own eyes: the rooftop he starts on, the shaft, the sky. The spin
  // turns a box larger than the frame, so its corners never show.
  const world = shell.layer('bl__world');
  const random = seeded(17);
  const soot = Array.from(
    { length: 18 },
    () =>
      `<div class="bl__soot" style="--x: ${(35 + random() * 30).toFixed(1)}%; --y: ${(8 + random() * 80).toFixed(1)}%; --delay: ${(-random() * 2.6).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  world.innerHTML =
    '<div class="bl__spin"><div class="bl__view">' +
    '<div class="bl__layer bl__clouds"></div>' +
    '<div class="bl__layer bl__house"><div class="bl__roof"></div><div class="bl__stack"></div><div class="bl__hedge"></div></div>' +
    '<div class="bl__chimney"></div>' +
    `<div class="bl__soots">${soot}</div>` +
    `<div class="bl__foot"><div class="bl__foot-wag"><div class="bl__foot-kick">${figure('alice/foot')}</div></div></div>` +
    '</div></div>' +
    // The garden from the chimney's rim, as the Rabbit's house left it.
    `<div class="bl__rooftop">${RIM_SVG}</div>`;
  const foot = world.querySelector<HTMLElement>('.bl__foot');
  const footWag = world.querySelector<HTMLElement>('.bl__foot-wag');
  const footKick = world.querySelector<HTMLElement>('.bl__foot-kick');
  const rooftop = world.querySelector<HTMLElement>('.bl__rooftop');

  // --- The garden, seen from the hedge: where he comes down.
  const garden = shell.layer('bl__garden');
  const pig = figure('guinea-pig');
  garden.innerHTML =
    `<div class="bl__g-house">${GARDEN_HOUSE_SVG}</div>` +
    '<div class="bl__g-hedge"></div>' +
    `<div class="bl__g-rabbit"><svg viewBox="0 0 60 80" focusable="false">${svgFigure('white-rabbit/garden', 0, 0, 60, 80)}</svg></div>` +
    `<div class="bl__crowd"><div class="bl__crowd-inner">${pig}${pig}${pig}</div></div>` +
    '<div class="bl__faller"><div class="bl__shake"><div class="bl__bounce"><div class="bl__sit">' +
    `<div class="bl__body">${figure('bill')}</div></div></div></div>` +
    '<div class="bl__at-head"><span class="bl__stars"><i></i><i></i><i></i></span>' +
    '<span class="bl__drops"><b></b><b></b><b></b><b></b></span></div>' +
    '<div class="bl__bill-hit"></div></div>' +
    `<div class="bl__clump">${CLUMP_SVG}</div>` +
    `<div class="bl__leaves">${LEAVES}</div>` +
    `<div class="bl__nurse"><div class="bl__nurse-pig">${pig}</div><div class="bl__bottle">${BOTTLE_SVG}</div></div>` +
    '<div class="bl__drag"></div>';
  garden.style.setProperty('--land-x', String(LAND_X));
  const faller = garden.querySelector<HTMLElement>('.bl__faller');
  const billHit = garden.querySelector<HTMLElement>('.bl__bill-hit');
  const drag = garden.querySelector<HTMLElement>('.bl__drag');
  const flash = shell.layer('bl__flash');
  const kickFlash = shell.layer('bl__flash bl__flash--kick');

  // --- The camera: height in px above the roof line, and spin. The descent is
  // the timeline's; the kick is a burst in real time on its own values; the
  // launch is the timeline's again and takes over from wherever the burst is.
  const cam = { y: 0, shaft: 0 };
  const burst = { y: -1500, spin: 0 };
  const rise = { y: 1600, spin: 540, k: 0 };
  let kicked = false;
  let brick = 50;
  const apply = (): void => {
    const base = kicked ? burst.y : cam.y;
    const y = mix(base, rise.y, rise.k);
    const spin = reducedMotion ? 0 : mix(kicked ? burst.spin : 0, rise.spin, rise.k);
    // The shaft is a treadmill of bricks a frame tall: it never runs out, and it
    // fades as the camera comes up past the rim.
    const offset = ((y % brick) + brick) % brick;
    world.style.setProperty('--cam', y.toFixed(1));
    world.style.setProperty('--spin', spin.toFixed(2));
    world.style.setProperty('--shaft', offset.toFixed(2));
    const shaft = cam.shaft * clamp(-y / 200, 0, 1);
    world.style.setProperty('--shaft-o', shaft.toFixed(3));
    // Soot falls only while there is a shaft to fall in.
    world.toggleAttribute('data-shaft', shaft > 0.01);
    // Behind a shaft that fills the frame, the sky and the roof need not be drawn.
    world.toggleAttribute('data-deep', shaft > 0.99);
  };
  const measure = (): void => {
    brick = Math.max(8, 0.068 * Math.min(window.innerWidth, window.innerHeight));
    world.style.setProperty('--brick', `${brick.toFixed(2)}px`);
    apply();
  };
  measure();
  window.addEventListener('resize', measure);

  // Off the rim and into the dark: the rooftop rushes up past the eyes and is
  // gone; under reduced motion it is a cut with a blink, just before the descent
  // beat's head, so the first beat rests on the rooftop as the house left it.
  const offTheRim = reducedMotion ? iDescend - 0.02 : iDescend - 0.3;
  master.fromTo(
    rooftop,
    { '--dive': 0 },
    {
      '--dive': 1,
      duration: reducedMotion ? 0.01 : 0.7,
      ease: 'power2.in',
      immediateRender: false,
    },
    offTheRim,
  );
  if (reducedMotion) {
    master.fromTo(
      flash,
      { opacity: 0.8 },
      { opacity: 0, duration: 0.3, immediateRender: false },
      offTheRim,
    );
  }
  // Down the chimney: the shaft fades in around the camera as it sinks.
  master.fromTo(
    cam,
    { y: 0 },
    { y: -300, duration: 0.6, ease: 'power1.in', onUpdate: apply, immediateRender: false },
    iDescend - 0.4,
  );
  master.fromTo(
    cam,
    { shaft: 0 },
    { shaft: 1, duration: 0.5, onUpdate: apply, immediateRender: false },
    iDescend,
  );
  master.fromTo(
    cam,
    { y: -300 },
    {
      y: -1500,
      duration: iFoot - iDescend + 0.5,
      ease: 'none',
      onUpdate: apply,
      immediateRender: false,
    },
    iDescend + 0.2,
  );
  // A foot rises from below, into the middle of the shaft, and waits.
  master.fromTo(
    foot,
    { '--rise': 0 },
    {
      '--rise': 1,
      duration: reducedMotion ? 0.01 : 0.6,
      ease: 'power2.out',
      immediateRender: false,
    },
    iFoot + 0.25,
  );
  if (!reducedMotion) {
    master.to(
      footWag,
      { rotation: 6, duration: 0.15, yoyo: true, repeat: 3, transformOrigin: '50% 100%' },
      iFoot + 0.95,
    );
  }

  // --- The kick: a burst in time. The reader gives it, or the story does.
  const kickAt = iKick + 0.8;
  const kickButton = shell.prop(shell.ui.demoKick ?? '', 'bl__prop bl__prop--kick');
  // The whole frame is the foot's to kick for a pointer; the button is the
  // keyboard's way, so the tap target takes no focus and says nothing.
  const kickTarget = document.createElement('div');
  kickTarget.className = 'bl__kick-target';
  kickTarget.setAttribute('aria-hidden', 'true');
  shell.stage.append(kickTarget);
  const kickShown = (): void => {
    const t = master.time();
    const live = t >= iKick && t < kickAt && !kicked;
    if (live) {
      kickButton.show();
    } else {
      kickButton.hide();
    }
    kickTarget.toggleAttribute('data-shown', live);
  };
  let kickTimeline: gsap.core.Timeline | undefined;
  const kick = (): void => {
    if (kicked) {
      return;
    }
    kicked = true;
    kickShown();
    kickTimeline?.kill();
    // Reached by a jump well past it, the kick has happened: no flash, no noise.
    if (master.time() > kickAt + 0.3) {
      burst.y = 1600;
      burst.spin = 540;
      gsap.set(footKick, { opacity: 0 });
      apply();
      return;
    }
    shell.sound.play('whoosh');
    burst.y = cam.y;
    burst.spin = 0;
    const burstTimeline = gsap.timeline();
    kickTimeline = burstTimeline;
    burstTimeline.to(
      footKick,
      { y: '-70vh', duration: reducedMotion ? 0 : 0.12, ease: 'power4.in' },
      0,
    );
    burstTimeline.fromTo(
      kickFlash,
      { opacity: 0 },
      { opacity: reducedMotion ? 0.6 : 0.8, duration: reducedMotion ? 0 : 0.05 },
      0.1,
    );
    burstTimeline.to(kickFlash, { opacity: 0, duration: reducedMotion ? 0.25 : 0.4 }, 0.15);
    burstTimeline.to(footKick, { opacity: 0, duration: reducedMotion ? 0 : 0.2 }, 0.3);
    if (reducedMotion) {
      burstTimeline.call(
        () => {
          burst.y = 1600;
          apply();
        },
        [],
        0.1,
      );
    } else {
      burstTimeline.to(burst, { y: 1600, duration: 1.4, ease: 'power3.out', onUpdate: apply }, 0.1);
      burstTimeline.to(
        burst,
        { spin: 540, duration: 1.6, ease: 'power2.out', onUpdate: apply },
        0.1,
      );
    }
  };
  const unkick = (): void => {
    if (!kicked) {
      return;
    }
    kicked = false;
    kickTimeline?.kill();
    gsap.set(footKick, { y: 0, opacity: 1 });
    gsap.set(kickFlash, { opacity: 0 });
    burst.y = -1500;
    burst.spin = 0;
    apply();
    kickShown();
  };
  const kickByReader = (): void => {
    if (master.time() >= iKick && master.time() < kickAt) {
      kick();
    }
  };
  kickButton.addEventListener('click', kickByReader);
  kickTarget.addEventListener('pointerdown', kickByReader);
  master.call(kickShown, [], iKick);
  // Scrolling back above the kick puts everything back for another go.
  master.call(() => (master.time() < iKick ? unkick() : undefined), [], iKick);
  master.call(() => (master.time() < kickAt - 0.01 ? unkick() : undefined), [], kickAt - 0.01);
  master.call(() => (master.time() >= kickAt ? kick() : kickShown()), [], kickAt);

  // --- Up: the timeline takes the camera from the burst, higher and spinning.
  master.fromTo(
    rise,
    { k: 0 },
    { k: 1, duration: 0.2, onUpdate: apply, immediateRender: false },
    iLaunch,
  );
  master.fromTo(
    rise,
    { y: 1600, spin: 540 },
    {
      y: 2400,
      spin: 900,
      duration: 0.45,
      ease: 'power1.out',
      onUpdate: apply,
      immediateRender: false,
    },
    iLaunch,
  );
  master.fromTo(
    foot,
    { opacity: 1 },
    { opacity: 0, duration: 0.2, immediateRender: false },
    iLaunch,
  );

  // --- "Catch him, you by the hedge!": the view is the garden's, and Bill comes
  // down out of the sky. Under reduced motion the launch beat rests on him in
  // the air, the crowd still to be moved.
  const toGarden = iLaunch + 0.45;
  const landAt = iLaunch + 0.95;
  master.set(world, { opacity: 0 }, toGarden);
  master.set(garden, { opacity: 1 }, toGarden);
  if (!reducedMotion) {
    master.fromTo(
      flash,
      { opacity: 0.85 },
      { opacity: 0, duration: 0.12, immediateRender: false },
      toGarden,
    );
  }

  const fall = { t: 0 };
  const gather = { g: 0 };
  const nurse = { near: 0, lift: 0, tip: 0, sit: 0 };
  // The reader's: where the crowd stands, and their own brandy for him.
  const crowd = { x: CROWD_START };
  const holdFx = { lift: 0, tip: 0 };
  let holds = 0;
  let outcome: 'none' | 'catch' | 'miss' = 'none';

  const headAt = (r: number, sit: number): { x: number; y: number } => {
    // His head in his own box (120 by 100, as shares of his width), turned with
    // him about the box's centre and then with the sitting up about his tail.
    const hx = 0.767;
    const hy = 0.383;
    const cx = 0.5;
    const cy = 0.417;
    const a = (r * Math.PI) / 180;
    let x = cx + (hx - cx) * Math.cos(a) - (hy - cy) * Math.sin(a);
    let y = cy + (hx - cx) * Math.sin(a) + (hy - cy) * Math.cos(a);
    const s = (-28 * sit * Math.PI) / 180;
    const px = 0.2;
    const py = 0.79;
    const sx = px + (x - px) * Math.cos(s) - (y - py) * Math.sin(s);
    const sy = py + (x - px) * Math.sin(s) + (y - py) * Math.cos(s);
    x = sx;
    y = sy;
    return { x, y };
  };

  // The daze: three stars once he is down, two after the story's brandy, one
  // once he has come round; each brandy the reader gives clears one more.
  const dazeLevel = (): number => {
    const t = master.time();
    return t >= iBrandy + 0.3 ? 1 : t >= iLand + 0.62 ? 2 : t >= landAt ? 3 : 0;
  };
  const applyGarden = (): void => {
    let pose: Pose;
    if (fall.t < 1) {
      pose = fallPose(fall.t, reducedMotion);
    } else {
      const from = outcome === 'catch' ? CAUGHT : outcome === 'miss' ? IN_THE_HEDGE : CAUGHT;
      const g = smooth(gather.g);
      pose = {
        x: mix(from.x, ON_THE_GROUND.x, g),
        y: mix(from.y, ON_THE_GROUND.y, g),
        r: mix(from.r, ON_THE_GROUND.r, g),
      };
    }
    // Coming round: he rolls off his back onto his feet, then sits up.
    const roll = smooth(clamp(nurse.sit * 1.6, 0, 1));
    const sitUp = smooth(clamp(nurse.sit * 2 - 1, 0, 1));
    const r = mix(pose.r, 360, roll);
    const lift = Math.max(nurse.lift, holdFx.lift);
    // On his back his head lolls to the grass; held up, it comes off it.
    const head = mix(mix(-12, 40, lift), -6, roll);
    const at = headAt(r, sitUp);
    const upside = (1 - Math.cos((r * Math.PI) / 180)) / 2;
    const style = garden.style;
    style.setProperty('--bill-x', pose.x.toFixed(4));
    style.setProperty('--bill-y', pose.y.toFixed(4));
    style.setProperty('--bill-r', r.toFixed(1));
    style.setProperty('--drop', (upside * 0.22).toFixed(3));
    style.setProperty('--head', head.toFixed(1));
    style.setProperty('--sit', sitUp.toFixed(3));
    style.setProperty('--hx', at.x.toFixed(3));
    style.setProperty('--hy', at.y.toFixed(3));
    style.setProperty('--crowd-x', mix(crowd.x, LAND_X + 0.16, smooth(gather.g)).toFixed(4));
    style.setProperty('--near', nurse.near.toFixed(3));
    style.setProperty('--lift', lift.toFixed(3));
    style.setProperty('--tip', Math.max(nurse.tip, holdFx.tip).toFixed(3));
    style.setProperty('--out', (outcome === 'miss' ? 1 - smooth(gather.g) : 0).toFixed(3));
    garden.dataset.daze = String(fall.t < 1 ? 0 : Math.max(0, dazeLevel() - holds));
  };
  applyGarden();

  master.fromTo(
    fall,
    { t: 0 },
    {
      t: 1,
      duration: landAt - (toGarden + 0.05),
      ease: 'none',
      onUpdate: applyGarden,
      immediateRender: false,
    },
    toGarden + 0.05,
  );

  // --- Catch him: drag the crowd under him, or step it with the button.
  const catchButton = shell.prop(shell.ui.demoCatchBill ?? '', 'bl__prop bl__prop--catch');
  const catchLive = (): boolean => master.time() >= toGarden && master.time() < landAt;
  const catchShown = (): void => {
    const live = catchLive();
    if (live) {
      catchButton.show();
    } else {
      catchButton.hide();
    }
    garden.toggleAttribute('data-ready', live);
    drag?.toggleAttribute('data-live', live);
  };
  // Where the crowd is going: a press steps from there, not from wherever the
  // last step has got to.
  let crowdTo = crowd.x;
  const moveCrowd = (x: number, duration: number): void => {
    crowdTo = clamp(x, 0.3, 0.92);
    gsap.to(crowd, {
      x: crowdTo,
      duration: reducedMotion ? 0 : duration,
      ease: 'power2.out',
      onUpdate: applyGarden,
      overwrite: true,
    });
  };
  catchButton.addEventListener('click', () => {
    if (!catchLive()) {
      return;
    }
    const gap = LAND_X - crowdTo;
    const step = Math.sign(gap) * Math.min(Math.abs(gap), CATCH_STEP);
    moveCrowd(crowdTo + step, 0.3);
    shell.status(shell.ui.demoCatchBill ?? '');
  });
  let dragging: { left: number; width: number } | undefined;
  drag?.addEventListener('pointerdown', (event) => {
    if (!catchLive() || event.button > 0) {
      return;
    }
    const box = shell.stage.getBoundingClientRect();
    dragging = { left: box.left, width: box.width };
    drag.setPointerCapture(event.pointerId);
    moveCrowd((event.clientX - dragging.left) / dragging.width, 0.15);
    shell.status(shell.ui.demoCatchBill ?? '');
  });
  drag?.addEventListener('pointermove', (event) => {
    if (dragging && catchLive()) {
      moveCrowd((event.clientX - dragging.left) / dragging.width, 0.12);
    }
  });
  const endDrag = (): void => {
    dragging = undefined;
  };
  drag?.addEventListener('pointerup', endDrag);
  drag?.addEventListener('pointercancel', endDrag);
  master.call(catchShown, [], toGarden);
  master.call(catchShown, [], landAt);

  // He lands: on the crowd's paws with a soft bounce if they are under him,
  // into the hedge with a thump if not. Scrolling back above it takes it back.
  const setOutcome = (next: typeof outcome): void => {
    outcome = next;
    if (next === 'none') {
      delete garden.dataset.outcome;
      holds = 0;
    } else {
      garden.dataset.outcome = next;
    }
    applyGarden();
  };
  master.call(
    () => {
      if (master.time() < landAt) {
        setOutcome('none');
        return;
      }
      if (outcome !== 'none') {
        return;
      }
      const caught = Math.abs(crowd.x - LAND_X) <= CATCH_REACH;
      setOutcome(caught ? 'catch' : 'miss');
      if (master.time() > iLand + 0.5) {
        // Reached by a jump: he is already down; no noise for it.
        return;
      }
      shell.sound.play(caught ? 'paper' : 'thud', caught ? 0.5 : 1);
      if (!caught && !reducedMotion) {
        gsap.fromTo(
          shell.stage,
          { y: 8 },
          { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', clearProps: 'y' },
        );
      }
    },
    [],
    landAt,
  );
  master.call(applyGarden, [], landAt + 0.001);

  // A splutter: the brandy goes down the wrong way.
  const splutter = (byReader: boolean): void => {
    if (byReader) {
      holds = Math.min(3, holds + 1);
      applyGarden();
    }
    shell.sound.play('splash', 0.4);
    if (!faller) {
      return;
    }
    faller.removeAttribute('data-splutter');
    requestAnimationFrame(() => faller.setAttribute('data-splutter', ''));
    window.setTimeout(() => faller.removeAttribute('data-splutter'), 1200);
  };
  // --- "Then silence, and then another confusion of voices": they gather round,
  // and pull him out of the hedge if that is where he went.
  master.fromTo(
    gather,
    { g: 0 },
    {
      g: 1,
      duration: reducedMotion ? 0.01 : 0.35,
      ease: 'none',
      onUpdate: applyGarden,
      immediateRender: false,
    },
    iLand + 0.05,
  );
  master.fromTo(
    nurse,
    { near: 0 },
    {
      near: 1,
      duration: reducedMotion ? 0.01 : 0.3,
      ease: 'power1.inOut',
      onUpdate: applyGarden,
      immediateRender: false,
    },
    iLand + 0.15,
  );
  // "Hold up his head, brandy now": the story's own brandy, if the reader has
  // given none; it is the still that reduced motion rests on for the beat.
  master.fromTo(
    nurse,
    { lift: 0, tip: 0 },
    {
      lift: 1,
      tip: 1,
      duration: reducedMotion ? 0.01 : 0.1,
      ease: 'power2.out',
      onUpdate: applyGarden,
      immediateRender: false,
    },
    iLand + 0.5,
  );
  master.call(applyGarden, [], iLand + 0.62);
  const spill = (): void => {
    const t = master.time();
    garden.toggleAttribute('data-spill', t >= iLand + 0.6 && t < iLand + 0.9);
  };
  master.call(spill, [], iLand + 0.6);
  master.call(spill, [], iLand + 0.9);
  master.call(
    () => {
      if (master.time() >= iLand + 0.6 && master.time() < iLand + 0.7 && !reducedMotion) {
        splutter(false);
      }
    },
    [],
    iLand + 0.6,
  );
  master.fromTo(
    nurse,
    { lift: 1, tip: 1 },
    {
      lift: 0.3,
      tip: 0,
      duration: reducedMotion ? 0.01 : 0.1,
      onUpdate: applyGarden,
      immediateRender: false,
    },
    iLand + 0.88,
  );
  // He comes round and sits up to tell them, still a little dazed.
  master.fromTo(
    nurse,
    { sit: 0, lift: 0.3 },
    {
      sit: 1,
      lift: 0,
      duration: reducedMotion ? 0.01 : 0.35,
      ease: 'power2.inOut',
      onUpdate: applyGarden,
      immediateRender: false,
    },
    iBrandy + 0.05,
  );
  master.call(applyGarden, [], iBrandy + 0.3);

  // --- Hold up his head: a guinea-pig lifts it and tips the bottle; he
  // splutters, and the daze clears a step.
  const holdButton = shell.prop(shell.ui.demoHoldHead ?? '', 'bl__prop bl__prop--hold');
  const holdLive = (): boolean => master.time() >= iLand + 0.25 && master.time() < iBrandy;
  const holdShown = (): void => {
    const live = holdLive();
    if (live) {
      holdButton.show();
    } else {
      holdButton.hide();
    }
    billHit?.toggleAttribute('data-live', live);
  };
  let holdTimeline: gsap.core.Timeline | undefined;
  const hold = (): void => {
    if (!holdLive()) {
      return;
    }
    holdTimeline?.kill();
    const timeline = gsap.timeline();
    holdTimeline = timeline;
    shell.status(shell.ui.demoHoldHead ?? '');
    if (reducedMotion) {
      timeline.set(holdFx, { lift: 1, tip: 1, onComplete: applyGarden }, 0);
      timeline.call(() => splutter(true), [], 0);
      timeline.set(holdFx, { lift: 0, tip: 0, onComplete: applyGarden }, 1.4);
      return;
    }
    timeline.to(holdFx, { lift: 1, duration: 0.3, ease: 'power2.out', onUpdate: applyGarden });
    timeline.to(holdFx, { tip: 1, duration: 0.3, ease: 'power1.inOut', onUpdate: applyGarden });
    timeline.call(() => splutter(true));
    timeline.to(holdFx, { tip: 0, duration: 0.3, delay: 0.3, onUpdate: applyGarden });
    timeline.to(holdFx, { lift: 0, duration: 0.5, ease: 'power2.inOut', onUpdate: applyGarden });
  };
  holdButton.addEventListener('click', hold);
  billHit?.addEventListener('pointerdown', hold);
  master.call(holdShown, [], iLand + 0.25);
  master.call(holdShown, [], iBrandy);

  // Test seam: the garden's state, in one serialisable snapshot.
  window.__aliceBill = () => ({
    kicked,
    outcome,
    crowd: crowd.x,
    fall: fall.t,
    daze: Number(garden.dataset.daze ?? 0),
    holds,
  });
}

declare global {
  interface Window {
    /** Test seam: Bill's own state. */
    __aliceBill?: () => {
      kicked: boolean;
      outcome: 'none' | 'catch' | 'miss';
      crowd: number;
      fall: number;
      daze: number;
      holds: number;
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
