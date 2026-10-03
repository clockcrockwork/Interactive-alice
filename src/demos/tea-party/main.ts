/**
 * A Mad Tea-Party, the first half: the concept demo.
 *
 * A long table under a tree in front of the March Hare's house, laid for many,
 * in CSS 3D and seen from Alice's seat at the near end; the three are crowded at
 * the far corner. The camera is Alice: it drops into the armchair, travels up
 * the table toward the Hatter for the riddle, comes back for the watch, looks up
 * at the sun when Time himself is explained, and at the end turns to the sleeping
 * Dormouse and down into its cup, where the next demo begins. Every laid place is
 * one reused symbol; the figures stand on the table as billboards. Time is one
 * number (the hour) that the sun's place, the clock's hands and the dusk all
 * follow, and moving round is one number (the round) that the party's seat and
 * the dirty cups follow, so reverse scrolling reconstructs both. The places the
 * reader has sat the party at stay used on top of that: the Hatter's own way
 * round goes into a clean place, a used one tapped makes him frown, and with
 * nothing clean left the way round comes to the beginning again. The reader may
 * also try the raven against the writing-desk, and sing along with the Hatter
 * until the Dormouse sings in its sleep. What the status line says is the
 * page's own sentence for what happened, never the button's label.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix } from '../shell/shell.ts';
import {
  BUTTER_SVG,
  CUP_BACK_SVG,
  CUP_FRONT_SVG,
  DESK_SVG,
  FROWN_SVG,
  HOUSE_SVG,
  KNIFE_SVG,
  NOTES_SVG,
  RAVEN_SVG,
  SETTING_SYMBOL,
  SETTING_USE,
  TEAPOT_SVG,
  TRAY_SVG,
  TREE_SVG,
  watchSvg,
} from './figures.ts';
import './tea-party.css';

/** Seats along one side of the table, and the distance between them, in table px. */
const SLOTS = 7;
const SEAT = 240;
const FAR = SLOTS - 1;
/** Where the first seat is along the table (negative z runs away from Alice). */
const NEAR_Z = -140;
const PARTY_Z = NEAR_Z - FAR * SEAT - 60;
/** Hours on the sun's dial: the afternoon it is, the morning lessons begin, dinner, and tea. */
const AFTERNOON = 16;
const LESSONS = 9;
const DINNER = 13.5;
const TEA = 18;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

interface Camera {
  pitch: number;
  yaw: number;
  x: number;
  y: number;
  z: number;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iNoRoom = cue('no-room');
  const iWine = cue('wine');
  const iCivil = cue('civil');
  const iHair = cue('hair');
  const iRaven = cue('raven');
  const iMean = cue('mean');
  const iSee = cue('see');
  const iSilence = cue('silence');
  const iWatch = cue('watch');
  const iButter = cue('butter');
  const iTea = cue('tea');
  const iFunny = cue('funny');
  const iGiveUp = cue('give-up');
  const iHim = cue('him');
  const iQuarrel = cue('quarrel');
  const iTwinkle = cue('twinkle');
  const iMurder = cue('murder');
  const iTeaTime = cue('tea-time');
  const iStory = cue('story');
  const end = shell.beats.length;
  /** A motion's duration, or a cut under reduced motion. */
  const d = (n: number): number => (reducedMotion ? 0.01 : n);
  /** Shows a layer only between two times; hidden layers are not painted. */
  const between = (layer: HTMLElement, from: number, to: number): void => {
    const update = (): void => {
      const on = master.time() >= from && (to >= end || master.time() < to);
      layer.toggleAttribute('data-off', !on);
    };
    layer.toggleAttribute('data-off', true);
    master.call(update, [], from);
    if (to < end) {
      master.call(update, [], to);
    }
  };

  /** The page's own sentence in a beat, said by a speaker: what a status line says. */
  const lineOf = (beat: number, speaker: string, last = false): string => {
    const lines = (shell.beats[beat]?.lines ?? []).filter(
      (line) => line.dataset.speaker === speaker,
    );
    return ((last ? lines.at(-1) : lines[0])?.textContent ?? '').trim();
  };

  // --- The sky: the house with ears, the tree, and the sun that is also a clock.
  const sky = shell.layer('tp__sky');
  sky.innerHTML =
    '<div class="tp__horizon"><div class="tp__grass"></div>' +
    '<div class="tp__sun"><div class="tp__sun-disc"></div><div class="tp__hands">' +
    '<div class="tp__hand tp__hand--hour"></div><div class="tp__hand tp__hand--minute"></div></div></div>' +
    `<div class="tp__house">${HOUSE_SVG}</div><div class="tp__tree">${TREE_SVG}</div></div>`;
  const sun = sky.querySelector<HTMLElement>('.tp__sun');
  const house = sky.querySelector<HTMLElement>('.tp__house');
  const time = { hour: AFTERNOON, spin: 0, clock: 0, dusk: 0 };
  const whisper = { hour: 0, amount: 0, spin: 0 };
  const applyTime = (): void => {
    const hour = mix(time.hour, whisper.hour, whisper.amount);
    const spin = time.spin + whisper.spin;
    sky.style.setProperty('--sun', clamp((hour - 6) / 12, 0, 1).toFixed(4));
    sky.style.setProperty('--dusk', time.dusk.toFixed(3));
    for (const dial of [sun, house]) {
      dial?.style.setProperty('--hour', (hour * 30 + spin).toFixed(2));
      dial?.style.setProperty('--minute', ((hour % 1) * 360 + spin * 12).toFixed(2));
      dial?.style.setProperty('--clock', time.clock.toFixed(3));
    }
  };
  applyTime();

  // --- The world: a perspective, the table plane, and what stands on it.
  const world = shell.layer('tp__world');
  world.innerHTML = `${SETTING_SYMBOL}<div class="tp__scene"><div class="tp__cloth"></div></div>`;
  const scene = world.querySelector<HTMLElement>('.tp__scene') as HTMLElement;
  const piece = (
    className: string,
    markup: string,
    x: number,
    z: number,
    w: number,
  ): HTMLElement => {
    const el = document.createElement('div');
    el.className = `tp__piece ${className}`;
    el.innerHTML = markup;
    el.style.setProperty('--x', String(x));
    el.style.setProperty('--z', String(z));
    el.style.setProperty('--w', `${w}px`);
    scene.append(el);
    return el;
  };
  // The places: one symbol, a <use> per seat, two sides of the table.
  const places: { el: HTMLElement; slot: number }[] = [];
  for (let slot = 0; slot < SLOTS; slot += 1) {
    for (const side of [-1, 1]) {
      const el = piece('tp__place', SETTING_USE, side * 172, NEAR_Z - slot * SEAT, 150);
      el.dataset.slot = String(slot);
      places.push({ el, slot });
    }
  }
  const pot = piece('tp__teapot', TEAPOT_SVG, 30, -330, 230);
  piece('tp__butter-dish', BUTTER_SVG, -40, -560, 120);
  // The party, crowded together at the far end. Their seat follows the round.
  const hatter = piece(
    'tp__party tp__hatter',
    `<div class="tp__hatter-turn">${figure('hatter')}${FROWN_SVG}</div>`,
    -150,
    PARTY_Z + 20,
    230,
  );
  const dormouse = piece(
    'tp__party tp__dormouse',
    `${figure('dormouse')}<div class="tp__notes">${NOTES_SVG}</div>`,
    0,
    PARTY_Z - 10,
    170,
  );
  const hare = piece('tp__party tp__hare', figure('march-hare'), 150, PARTY_Z + 20, 230);

  // --- The camera: Alice. Standing at the table's end first.
  const camera: Camera = { pitch: 10, yaw: 0, x: 0, y: 400, z: 0 };
  const applyCamera = (): void => {
    scene.style.setProperty('--pitch', camera.pitch.toFixed(2));
    scene.style.setProperty('--yaw', camera.yaw.toFixed(2));
    scene.style.setProperty('--cam-x', camera.x.toFixed(1));
    scene.style.setProperty('--cam-y', camera.y.toFixed(1));
    scene.style.setProperty('--cam-z', camera.z.toFixed(1));
    sky.style.setProperty('--pitch', camera.pitch.toFixed(2));
  };
  applyCamera();
  const move = (at: number, to: gsap.TweenVars, duration = 0.6, ease = 'power2.inOut'): void => {
    master.to(camera, { ...to, duration: d(duration), ease, onUpdate: applyCamera }, at);
  };

  // --- No room! The words burst, then she sits: the camera drops into the armchair.
  const words = shell.layer('tp__words');
  const noRoomLine = shell.beats[iNoRoom]?.lines.find(
    (line) => line.dataset.speaker === 'march-hare',
  );
  words.innerHTML = `<p class="tp__big">${noRoomLine?.innerHTML ?? ''}</p>`;
  const big = words.querySelector<HTMLElement>('.tp__big');
  if (reducedMotion) {
    // A still: the words stand big over the table for the whole settled beat,
    // as she sits, and are gone with the next.
    between(words, iNoRoom - 0.02, iNoRoom + 0.95);
    master.fromTo(
      big,
      { opacity: 0 },
      { opacity: 1, duration: 0.01, immediateRender: false },
      iNoRoom - 0.02,
    );
  } else {
    between(words, iNoRoom, iNoRoom + 0.6);
    master.fromTo(
      big,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' },
      iNoRoom + 0.05,
    );
    master.to(big, { opacity: 0, scale: 1.15, duration: 0.15 }, iNoRoom + 0.42);
  }
  const chair = shell.layer('tp__chair');
  chair.innerHTML =
    '<div class="tp__arm tp__arm--left"></div><div class="tp__arm tp__arm--right"></div>';
  move(iNoRoom + 0.55, { pitch: 8, y: 260 }, 0.4, 'power2.in');
  master.to(chair, { '--sit': 1, duration: d(0.4), ease: 'power2.in' }, iNoRoom + 0.55);
  master.call(
    () => (Math.abs(master.time() - (iNoRoom + 0.95)) < 0.2 ? shell.sound.play('thud', 0.5) : 0),
    [],
    iNoRoom + 0.95,
  );

  // --- Have some wine: lifting the pot-lid finds only tea.
  const lid = { story: 0, reader: 0 };
  const applyLid = (): void => {
    pot.style.setProperty('--lid', Math.max(lid.story, lid.reader).toFixed(3));
  };
  master.to(
    lid,
    { story: 1, duration: d(0.25), ease: 'power2.out', onUpdate: applyLid },
    iWine + 0.3,
  );
  master.to(
    lid,
    { story: 0, duration: d(0.25), ease: 'power2.in', onUpdate: applyLid },
    iWine + 0.8,
  );
  move(iWine + 0.25, { pitch: 16, yaw: -5 }, 0.4);
  move(iCivil, { pitch: 8, yaw: 0 }, 0.4);
  const wineButton = shell.prop(shell.ui.demoLookForWine ?? '', 'tp__prop-wine');
  const lookForWine = (): void => {
    gsap.fromTo(
      lid,
      { reader: 0 },
      {
        reader: 1,
        duration: d(0.3),
        ease: 'power2.out',
        onUpdate: applyLid,
        overwrite: 'auto',
        yoyo: true,
        repeat: 1,
        repeatDelay: 0.8,
      },
    );
    shell.sound.play('glass', 0.4);
    // What she finds, in the Hare's own words: there is not any.
    shell.status(lineOf(iWine, 'march-hare', true));
  };
  wineButton.addEventListener('click', lookForWine);
  pot.addEventListener('click', lookForWine);
  const propBetween = (button: { show(): void; hide(): void }, from: number, to: number): void => {
    const update = (): void =>
      master.time() >= from && master.time() < to ? button.show() : button.hide();
    master.call(update, [], from);
    master.call(update, [], to);
  };
  propBetween(wineButton, iWine, iHair);
  // The March Hare's rebuke: he leans in.
  master.to(hare, { '--lean': 1, duration: d(0.3), ease: 'power2.out' }, iCivil + 0.4);
  master.to(hare, { '--lean': 0, duration: d(0.3) }, iHair);

  // --- Your hair wants cutting: up the table to the Hatter, whose eyes open wide.
  move(iHair + 0.05, { z: -1180, y: 210, pitch: 10, yaw: -6 }, 0.8);
  master.to(hatter, { '--wide': 1, duration: d(0.2), ease: 'power3.out' }, iHair + 0.65);
  master.to(hatter, { '--wide': 0, duration: d(0.4) }, iSilence);

  // --- The riddle: a raven and a writing-desk, paper cut-outs that swap places
  // on every "you might as well say".
  const riddle = shell.layer('tp__riddle');
  riddle.innerHTML =
    `<div class="tp__cutout tp__raven">${RAVEN_SVG}</div>` +
    `<div class="tp__cutout tp__desk">${DESK_SVG}</div>`;
  between(riddle, iRaven, iSilence + 0.4);
  master.fromTo(riddle, { opacity: 0 }, { opacity: 1, duration: 0.3 }, iRaven + 0.1);
  master.to(riddle, { opacity: 0, duration: 0.25 }, iSilence + 0.1);
  const swaps = [iMean + 0.55, iSee + 0.12, iSee + 0.42, iSee + 0.72];
  swaps.forEach((at, index) => {
    master.to(
      riddle,
      { '--swap': index % 2 === 0 ? 1 : 0, duration: d(0.25), ease: 'power2.inOut' },
      at,
    );
    master.call(
      () => (Math.abs(master.time() - at) < 0.2 ? shell.sound.play('paper', 0.5) : 0),
      [],
      at,
    );
  });
  // --- Answer the riddle: try the raven against the writing-desk. Drag it onto
  // the desk, or press the prop: the two change places, since they never
  // match, and the Hatter shrugs. The reader's swap rides on the story's
  // (`--play` beside `--swap`), so neither undoes the other.
  const raven = riddle.querySelector<HTMLElement>('.tp__raven') ?? riddle;
  const desk = riddle.querySelector<HTMLElement>('.tp__desk') ?? riddle;
  const answerFrom = iRaven + 0.3;
  const answerTo = iSilence;
  const answering = (): boolean => master.time() >= answerFrom && master.time() < answerTo;
  const riddlePlay = { play: 0, dx: 0, dy: 0 };
  const shrug = { v: 0 };
  const applyRiddle = (): void => {
    riddle.style.setProperty('--play', riddlePlay.play.toFixed(3));
    raven.style.setProperty('--drag-x', `${riddlePlay.dx.toFixed(1)}px`);
    raven.style.setProperty('--drag-y', `${riddlePlay.dy.toFixed(1)}px`);
  };
  const applyShrug = (): void => {
    hatter.style.setProperty('--shrug', shrug.v.toFixed(3));
  };
  const answerButton = shell.prop(shell.ui.demoAnswerRiddle ?? '', 'tp__prop-riddle');
  const answer = (): void => {
    if (!answering() || shell.paused) {
      return;
    }
    gsap.killTweensOf(riddlePlay);
    gsap
      .timeline({ onUpdate: applyRiddle, onComplete: applyRiddle })
      .to(riddlePlay, { dx: 0, dy: 0, duration: d(0.25), ease: 'power2.out' }, 0)
      .to(
        riddlePlay,
        { play: riddlePlay.play > 0.5 ? 0 : 1, duration: d(0.45), ease: 'power2.inOut' },
        0,
      );
    gsap.killTweensOf(shrug);
    gsap
      .timeline({ onUpdate: applyShrug, onComplete: applyShrug })
      .to(shrug, { v: 1, duration: d(0.25), ease: 'power2.out' }, d(0.3))
      .to(shrug, { v: 0, duration: d(0.35), ease: 'power2.inOut' }, '+=0.9');
    shell.sound.play('paper', 0.6);
    // His answer, when at last he is asked for it.
    shell.status(lineOf(iGiveUp, 'hatter', true));
  };
  answerButton.addEventListener('click', answer);
  let drag: { id: number; x: number; y: number } | undefined;
  raven.addEventListener('pointerdown', (event) => {
    if (!answering()) {
      return;
    }
    drag = {
      id: event.pointerId,
      x: event.clientX - riddlePlay.dx,
      y: event.clientY - riddlePlay.dy,
    };
    raven.setPointerCapture(event.pointerId);
    gsap.killTweensOf(riddlePlay);
  });
  raven.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) {
      return;
    }
    riddlePlay.dx = event.clientX - drag.x;
    riddlePlay.dy = event.clientY - drag.y;
    applyRiddle();
  });
  const drop = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.id) {
      return;
    }
    drag = undefined;
    // Measured once, at the drop: is the raven over the desk?
    const a = raven.getBoundingClientRect();
    const b = desk.getBoundingClientRect();
    const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (across > a.width * 0.3 && down > a.height * 0.3) {
      answer();
    } else {
      gsap.to(riddlePlay, {
        dx: 0,
        dy: 0,
        duration: d(0.4),
        ease: 'back.out(1.6)',
        onUpdate: applyRiddle,
        onComplete: applyRiddle,
      });
    }
  };
  raven.addEventListener('pointerup', drop);
  raven.addEventListener('pointercancel', drop);
  const offerAnswer = (): void => {
    const on = answering();
    riddle.toggleAttribute('data-answering', on);
    if (on) {
      answerButton.show();
    } else {
      answerButton.hide();
      drag = undefined;
      riddlePlay.dx = 0;
      riddlePlay.dy = 0;
      applyRiddle();
    }
  };
  master.call(offerAnswer, [], answerFrom);
  master.call(offerAnswer, [], answerTo);

  // The Dormouse talks in its sleep: its zzz are always on; here they grow.
  master.to(dormouse, { '--sleep': 1, duration: d(0.3) }, iSee);
  master.to(dormouse, { '--sleep': 0, duration: d(0.3) }, iSilence);
  move(iSilence + 0.1, { z: -900, pitch: 12, yaw: 0 }, 0.6);

  // --- The watch: a big close-up, shaken, buttered, dipped in tea.
  const watchLayer = shell.layer('tp__watch-layer');
  watchLayer.innerHTML =
    `<div class="tp__cup tp__cup--back">${CUP_BACK_SVG}</div>` +
    `<div class="tp__watch">${watchSvg()}</div>` +
    `<div class="tp__cup tp__cup--front">${CUP_FRONT_SVG}</div>` +
    `<div class="tp__knife">${KNIFE_SVG}</div>` +
    `<button type="button" class="tp__butter-pat" aria-label="${shell.ui.demoButterWatch ?? ''}">${BUTTER_SVG}</button>`;
  const watch = watchLayer.querySelector<HTMLElement>('.tp__watch') as HTMLElement;
  const knife = watchLayer.querySelector<HTMLElement>('.tp__knife') as HTMLElement;
  const cups = [...watchLayer.querySelectorAll<HTMLElement>('.tp__cup')];
  const butterPat = watchLayer.querySelector<HTMLButtonElement>('.tp__butter-pat');
  between(watchLayer, iWatch, iGiveUp + 0.4);
  master.fromTo(
    watchLayer,
    { opacity: 0, '--in': 0 },
    { opacity: 1, '--in': 1, duration: d(0.3), ease: 'power2.out' },
    iWatch + 0.05,
  );
  // Shaking it and holding it to his ear.
  if (!reducedMotion) {
    master.fromTo(
      watch,
      { '--shake': -7 },
      { '--shake': 7, duration: 0.05, yoyo: true, repeat: 7, ease: 'none', immediateRender: false },
      iWatch + 0.3,
    );
    master.to(watch, { '--shake': 0, duration: 0.05 }, iWatch + 0.7);
  }
  master.call(
    () => (Math.abs(master.time() - (iWatch + 0.35)) < 0.2 ? shell.sound.play('glass', 0.3) : 0),
    [],
    iWatch + 0.35,
  );
  // The best butter: the story's knife, and the reader's.
  const butter = { story: 0, reader: 0 };
  const applyButter = (): void => {
    const amount = Math.max(butter.story, butter.reader);
    knife.style.setProperty('--knife', amount.toFixed(3));
    watch.style.setProperty('--butter', clamp((amount - 0.35) / 0.4, 0, 1).toFixed(3));
    watchLayer.toggleAttribute('data-buttered', amount > 0.6);
  };
  master.to(
    butter,
    { story: 1, duration: d(0.5), ease: 'power1.inOut', onUpdate: applyButter },
    iButter + 0.15,
  );
  const butterButton = shell.prop(shell.ui.demoButterWatch ?? '', 'tp__prop-butter');
  const butterTheWatch = (): void => {
    gsap.fromTo(
      butter,
      { reader: 0 },
      {
        reader: 1,
        duration: d(0.6),
        ease: 'power1.inOut',
        onUpdate: applyButter,
        overwrite: 'auto',
      },
    );
    shell.sound.play('paper', 0.4);
    shell.status(lineOf(iButter, 'march-hare'));
  };
  butterButton.addEventListener('click', butterTheWatch);
  butterPat?.addEventListener('click', butterTheWatch);
  propBetween(butterButton, iWatch + 0.3, iTea);
  // Into the tea, and out again, gloomily.
  master.fromTo(cups, { opacity: 0 }, { opacity: 1, duration: d(0.2) }, iTea + 0.02);
  master.to(watch, { '--dip': 1, duration: d(0.4), ease: 'power2.in' }, iTea + 0.15);
  master.call(
    () => {
      if (Math.abs(master.time() - (iTea + 0.5)) < 0.2) {
        shell.sound.play('splash', 0.6);
      }
      watchLayer.toggleAttribute(
        'data-rings',
        master.time() >= iTea + 0.5 && master.time() < iFunny,
      );
    },
    [],
    iTea + 0.5,
  );
  master.call(
    () =>
      watchLayer.toggleAttribute(
        'data-rings',
        master.time() >= iTea + 0.5 && master.time() < iFunny,
      ),
    [],
    iFunny,
  );
  master.to(watch, { '--dip': 0, '--wet': 1, duration: d(0.4), ease: 'power2.out' }, iFunny + 0.05);
  master.to(cups, { opacity: 0, duration: d(0.3) }, iFunny + 0.3);
  // What a funny watch: the ring of dates lights for a moment.
  master.fromTo(
    watch,
    { '--aha': 0 },
    { '--aha': 1, duration: 0.2, immediateRender: false },
    iFunny + 0.3,
  );
  master.to(watch, { '--aha': 0, duration: 0.3 }, iFunny + 0.65);
  master.to(watchLayer, { opacity: 0, duration: d(0.3) }, iGiveUp + 0.05);
  move(iGiveUp + 0.1, { z: -520, pitch: 12, y: 240, yaw: 0 }, 0.6);

  // --- Time himself: the sun is his clock. Whisper, and round goes the clock.
  move(iHim + 0.05, { pitch: -6, y: 240 }, 0.6);
  master.to(time, { clock: 1, duration: d(0.3), onUpdate: applyTime }, iHim + 0.1);
  // Suppose it were nine in the morning: a cut to lessons, a spin to dinner, and back.
  master.to(time, { hour: LESSONS, duration: 0.01, onUpdate: applyTime }, iHim + 0.3);
  master.to(
    time,
    {
      hour: DINNER,
      spin: reducedMotion ? 0 : 720,
      duration: d(0.3),
      ease: 'power2.inOut',
      onUpdate: applyTime,
    },
    iHim + 0.55,
  );
  master.to(time, { hour: AFTERNOON, spin: 0, duration: 0.01, onUpdate: applyTime }, iHim + 0.95);
  master.call(
    () => (Math.abs(master.time() - (iHim + 0.6)) < 0.2 ? shell.sound.play('chime', 0.5) : 0),
    [],
    iHim + 0.6,
  );
  const whisperButton = shell.prop(shell.ui.demoWhisperTime ?? '', 'tp__prop-whisper');
  let whispering: gsap.core.Timeline | undefined;
  const whisperToTime = (): void => {
    whispering?.kill();
    whisper.hour = DINNER;
    whispering = gsap
      .timeline({ onUpdate: applyTime, onComplete: applyTime })
      .to(whisper, {
        amount: 1,
        spin: reducedMotion ? 0 : 1080,
        duration: d(0.9),
        ease: 'power2.inOut',
      })
      .to(whisper, { amount: 0, spin: 0, duration: d(0.5), ease: 'power2.inOut' }, '+=0.8');
    shell.sound.play('chime', 0.6);
    shell.status(lineOf(iHim, 'hatter', true));
  };
  whisperButton.addEventListener('click', whisperToTime);
  sun?.addEventListener('click', whisperToTime);
  propBetween(whisperButton, iHim + 0.2, iMurder);

  // --- The concert: the Hatter sings, and a bat flies up like a tea-tray.
  // On a narrow frame the camera looks a little further down for the song, so
  // the party sits above its sentences.
  const lite = matchMedia('(max-width: 700px)').matches;
  move(iQuarrel, { pitch: lite ? 14 : 6 }, 0.5);
  master.to(hatter, { '--sing': 1, duration: d(0.3), ease: 'back.out(1.5)' }, iTwinkle + 0.05);
  master.to(hatter, { '--sing': 0, duration: d(0.3) }, iMurder + 0.3);
  const batLayer = shell.layer('tp__bat-layer');
  batLayer.innerHTML = `<div class="tp__bat">${figure('bat')}<div class="tp__tray">${TRAY_SVG}</div></div>`;
  const bat = batLayer.querySelector<HTMLElement>('.tp__bat');
  between(batLayer, iTwinkle, iTeaTime);
  master.fromTo(
    bat,
    { '--fly': 0, opacity: 0 },
    { '--fly': 1, opacity: 1, duration: d(0.8), ease: 'power1.out' },
    iTwinkle + 0.1,
  );
  master.to(bat, { opacity: 0, duration: d(0.3) }, iMurder + 0.4);
  master.call(
    () => (Math.abs(master.time() - (iTwinkle + 0.15)) < 0.2 ? shell.sound.play('whoosh', 0.5) : 0),
    [],
    iTwinkle + 0.15,
  );
  // The Dormouse sings in its sleep, and is pinched to make it stop.
  master.to(dormouse, { '--sleep': 1, duration: d(0.3) }, iTwinkle + 0.5);
  master.to(dormouse, { '--jolt': 1, duration: d(0.08), ease: 'power3.out' }, iTwinkle + 0.85);
  master.to(
    dormouse,
    { '--jolt': 0, '--sleep': 0, duration: d(0.3), ease: 'power2.inOut' },
    iTwinkle + 0.93,
  );

  // --- Sing along: each tap flaps a bat across the sky like a tea-tray, the
  // Hatter's song in the status line; at the fourth the Dormouse sings in its
  // sleep. A tap on the Hatter sings along too.
  const singFrom = iTwinkle + 0.05;
  const singTo = iMurder;
  const singing = (): boolean => master.time() >= singFrom && master.time() < singTo;
  const singButton = shell.prop(shell.ui.demoSingAlong ?? '', 'tp__prop-sing');
  const song = (shell.beats[iTwinkle]?.lines ?? [])
    .filter((line) => line.dataset.speaker === 'hatter')
    .map((line) => (line.textContent ?? '').trim());
  let sung = 0;
  let batsOut = 0;
  let snore = 0;
  const singAlong = (): void => {
    if (!singing() || shell.paused) {
      return;
    }
    sung += 1;
    batsOut += 1;
    const bat = document.createElement('div');
    bat.className = 'tp__sing-bat';
    const side = batsOut % 2 === 0 ? -1 : 1;
    bat.style.setProperty('--dx', `${side * (22 + (batsOut % 3) * 7)}vw`);
    bat.style.setProperty('--peak', `${-(46 + (batsOut % 2) * 10)}vh`);
    // Under reduced motion each bat is a still in its own place in the sky.
    bat.style.setProperty('--still-x', `${8 + ((batsOut * 23) % 76)}vw`);
    bat.style.setProperty('--still-y', `${10 + ((batsOut * 11) % 26)}vh`);
    bat.innerHTML = `${figure('bat')}<div class="tp__tray">${TRAY_SVG}</div>`;
    if (!reducedMotion) {
      bat.addEventListener('animationend', (event) => {
        if (event.target === bat) {
          bat.remove();
        }
      });
    }
    batLayer.append(bat);
    shell.sound.play('whoosh', 0.4);
    if (sung >= 4) {
      sung = 0;
      dormouse.setAttribute('data-singing', '');
      window.clearTimeout(snore);
      snore = window.setTimeout(() => dormouse.removeAttribute('data-singing'), 3600);
      shell.sound.play('chime', 0.5);
      shell.status(lineOf(iTwinkle, 'dormouse'));
    } else {
      shell.status(song[(sung - 1) % Math.max(1, song.length)] ?? '');
    }
  };
  singButton.addEventListener('click', singAlong);
  hatter.addEventListener('click', singAlong);
  const offerSing = (): void => {
    const on = singing();
    scene.toggleAttribute('data-singalong', on);
    if (on) {
      singButton.show();
    } else {
      singButton.hide();
      sung = 0;
      window.clearTimeout(snore);
      dormouse.removeAttribute('data-singing');
      for (const bat of batLayer.querySelectorAll('.tp__sing-bat')) {
        bat.remove();
      }
    }
  };
  master.call(offerSing, [], singFrom);
  master.call(offerSing, [], singTo);

  // --- Off with his head: the Queen's words flash red; since then, six o'clock.
  const red = shell.layer('tp__red');
  between(red, iMurder + 0.1, iMurder + 0.9);
  master.fromTo(
    red,
    { opacity: 0 },
    { opacity: 0.45, duration: 0.06, immediateRender: false },
    iMurder + 0.3,
  );
  master.to(red, { opacity: 0, duration: 0.3 }, iMurder + 0.36);
  master.to(
    time,
    { hour: TEA, dusk: 1, duration: d(0.4), ease: 'power2.inOut', onUpdate: applyTime },
    iMurder + 0.55,
  );
  master.call(
    () => (Math.abs(master.time() - (iMurder + 0.9)) < 0.2 ? shell.sound.play('chime', 0.4) : 0),
    [],
    iMurder + 0.9,
  );

  // --- Always tea-time: the things are never washed, and everyone moves round.
  // The party sits at slot FAR - round. The places it has sat at are used: the
  // story's by the round (so scrolling back cleans them), the reader's for good.
  const storyRounds = { n: 0, mess: 0 };
  const readerRounds = { n: 0 };
  const satAt = new Set<number>();
  const seatOf = (round: number): number => FAR - round;
  const totalRound = (): number => clamp(storyRounds.n + readerRounds.n, 0, FAR - 1);
  const isUsed = (slot: number): boolean =>
    satAt.has(slot) || Math.round(totalRound()) + storyRounds.mess - (FAR - slot) >= 1;
  const applyRounds = (): void => {
    const total = totalRound();
    scene.style.setProperty('--round', total.toFixed(3));
    world.dataset.seat = String(seatOf(Math.round(total)));
    for (const place of places) {
      const dirt = Math.max(
        clamp(total + storyRounds.mess - (FAR - place.slot), 0, 1),
        satAt.has(place.slot) ? 1 : 0,
      );
      place.el.style.setProperty('--dirt', dirt.toFixed(2));
      place.el.toggleAttribute('data-used', isUsed(place.slot));
    }
  };
  applyRounds();
  move(iTeaTime, { pitch: 25, y: 260 }, 0.6);
  master.to(storyRounds, { mess: 1, duration: d(0.3), onUpdate: applyRounds }, iTeaTime + 0.05);
  master.to(
    storyRounds,
    { n: 1, duration: d(0.5), ease: 'power2.inOut', onUpdate: applyRounds },
    iTeaTime + 0.5,
  );
  const seating = (): boolean => master.time() >= iTeaTime + 0.6;
  /** Sits the party at a round: the reader's number is whatever makes the sum. */
  const goRound = (round: number): void => {
    satAt.add(seatOf(Math.round(totalRound())));
    satAt.add(seatOf(round));
    gsap.to(readerRounds, {
      n: round - Math.round(storyRounds.n),
      duration: d(0.6),
      ease: 'power2.inOut',
      onUpdate: applyRounds,
      overwrite: 'auto',
    });
  };
  // The Hatter's way: the next clean place toward Alice, and never her end.
  const roundButton = shell.prop(shell.ui.demoMoveRound ?? '', 'tp__prop-round');
  const moveRound = (): void => {
    const current = Math.round(totalRound());
    for (let round = current + 1; round <= FAR - 1; round += 1) {
      if (!isUsed(seatOf(round))) {
        goRound(round);
        shell.sound.play('glass', 0.4);
        shell.status(lineOf(iTeaTime, 'hatter', true));
        return;
      }
    }
    // Nothing clean left toward Alice: they come to the beginning again, to a
    // used place, and the Hatter frowns. This is also the keyboard's way to sit
    // at a used place.
    const back = current === 0 ? 1 : 0;
    const place = places.find((candidate) => candidate.slot === seatOf(back));
    goRound(back);
    if (place) {
      frown(place.el);
    }
  };
  roundButton.addEventListener('click', moveRound);
  propBetween(roundButton, iTeaTime + 0.6, end);
  master.call(() => scene.toggleAttribute('data-seating', seating()), [], iTeaTime + 0.6);
  // Or drag along the table.
  let dragY: number | undefined;
  shell.stage.addEventListener('pointerdown', (event) => {
    dragY = event.clientY;
  });
  window.addEventListener('pointerup', (event) => {
    if (dragY !== undefined && event.clientY - dragY > 60 && seating()) {
      moveRound();
    }
    dragY = undefined;
  });
  // Or tap a place. A used one is sat at anyway, and the Hatter frowns at it.
  const mood = { frown: 0 };
  const applyMood = (): void => {
    hatter.style.setProperty('--frown', mood.frown.toFixed(3));
  };
  let frowning: gsap.core.Timeline | undefined;
  const frown = (place: HTMLElement): void => {
    frowning?.kill();
    frowning = gsap
      .timeline({ onUpdate: applyMood, onComplete: applyMood })
      .to(mood, { frown: 1, duration: d(0.25), ease: 'power2.out' })
      .to(mood, { frown: 0, duration: d(0.4), ease: 'power2.inOut' }, '+=1.4');
    if (!reducedMotion) {
      place.setAttribute('data-wobble', '');
    }
    shell.sound.play('glass', 0.5);
    shell.status(shell.ui.demoDirtySeat ?? '');
  };
  const tapPlace = (place: { el: HTMLElement; slot: number }): void => {
    if (!seating()) {
      return;
    }
    const round = clamp(FAR - place.slot, 0, FAR - 1);
    const used = isUsed(seatOf(round));
    goRound(round);
    if (used) {
      frown(place.el);
    } else {
      shell.sound.play('glass', 0.4);
      shell.status(lineOf(iTeaTime, 'hatter', true));
    }
  };
  for (const place of places) {
    place.el.addEventListener('click', () => tapPlace(place));
    place.el.addEventListener('animationend', () => place.el.removeAttribute('data-wobble'));
  }

  // --- Then the Dormouse shall: the camera turns to it, and down into its cup.
  const joinLayer = shell.layer('tp__join');
  joinLayer.innerHTML = `<div class="tp__join-cup"></div><div class="tp__join-mouse">${figure('dormouse')}</div>`;
  between(joinLayer, iStory + 0.5, end);
  // Where the party sits when the turn begins, so it lands on the Dormouse
  // wherever the reader has moved it to.
  const partyZ = (): number => PARTY_Z + totalRound() * SEAT + 420;
  move(iStory + 0.05, { z: partyZ, pitch: 26, y: 220, yaw: 0 }, 0.5);
  master.fromTo(
    joinLayer,
    { opacity: 0, '--join': 0 },
    { opacity: 1, '--join': 1, duration: d(0.4), ease: 'power2.in', immediateRender: false },
    iStory + 0.55,
  );
  master.call(
    () => shell.root.toggleAttribute('data-join', master.time() >= iStory + 0.6),
    [],
    iStory + 0.6,
  );
  // Once the cup covers the frame, the table beneath it is not painted.
  const covered = (): void => {
    const under = master.time() >= iStory + 0.96;
    for (const layer of [sky, world, chair]) {
      layer.toggleAttribute('data-off', under);
    }
  };
  master.call(covered, [], iStory + 0.96);

  // --- Every frame: the table and the sky lean a little with the pointer.
  let lookX = 0;
  let lookY = 0;
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const k = 1 - Math.exp(-dt * 4);
    const targetX = shell.pointer.active ? shell.pointer.x : 0;
    const targetY = shell.pointer.active ? shell.pointer.y : 0;
    const nextX = mix(lookX, targetX, k);
    const nextY = mix(lookY, targetY, k);
    if (Math.abs(nextX - lookX) < 0.0005 && Math.abs(nextY - lookY) < 0.0005) {
      return;
    }
    lookX = nextX;
    lookY = nextY;
    scene.style.setProperty('--look-x', (lookX * 4).toFixed(3));
    scene.style.setProperty('--look-y', (lookY * 3).toFixed(3));
    sky.style.setProperty('--px', lookX.toFixed(3));
    sky.style.setProperty('--py', lookY.toFixed(3));
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
