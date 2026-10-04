/**
 * A Moral in Everything: the concept demo.
 *
 * A walk arm in arm along the croquet-ground, side-on, the camera tracking the
 * two of them: the walk is the parallax, and the game (soldiers doubled up as
 * arches, players, hedgehogs) scrolls past behind in three bands. The Duchess
 * leans closer beat by beat until her sharp chin is on Alice's shoulder, and
 * every "the moral of that is" unrolls a stitched ribbon from her mouth with the
 * moral on it, taken from her own sentence; the ribbons pile up above her cap,
 * the reader can fling one off over the ground or shrug the chin off. When pigs
 * have to fly, one does, until the Queen's shadow cuts it off with her word;
 * then the Queen herself with a storm over her head, the Duchess is simply not
 * there, the players go one by one at every shout, and at the last the ground
 * runs on to the shore where the Gryphon lies asleep in the sun: the Mock
 * Turtle's own first frame, drawn by its own stylesheet, with the Queen walking
 * on to her place in it and Alice stepping past the camera, whose eyes are hers.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { SHORE_HTML } from '../mock-turtle/figures.ts';
import { attachDemo, type DemoShell, mix } from '../shell/shell.ts';
import { MINE_SVG, SNAP_SVG, WING_SVG } from './figures.ts';
import '../lobster-quadrille/shore.css';
import '../mock-turtle/mock-turtle.css';
import './duchess.css';

/** Where each piece of the game stands along the ground, in vw of the mid band. */
const PLAYERS = [56, 70, 104, 118, 136] as const;
const ARCHES = [64, 102, 122] as const;
const HEDGEHOGS = [80, 126] as const;
/** Pieces further along, only ever seen going past: not part of the sentence. */
const FAR_PLAYERS = [156, 190] as const;
const FAR_ARCHES = [172, 204] as const;
const KING_X = 90;
const MINE_X = 160;
/** The walk, in vw of the near band: out along the ground, back to the game, on to the sea. */
const WALK_OUT = 160;
const WALK_GAME = 80;
const WALK_SEA = 260;
/** The beats in which she finds a moral: a ribbon unrolls on her last line of each. */
const MORAL_CUES = ['chin', 'sense', 'feather', 'mine', 'seem'] as const;
/** What follows "the moral of that is:" in her line; either colon, so a locale's own works. */
const AFTER_COLON = /[:：]\s*(.+)$/u;

interface Ribbon {
  el: HTMLButtonElement;
  at: number;
  play: { f: number };
}

/**
 * The moral a beat stitches on its ribbon, from the page's own sentences: what
 * she says after the colon of "the moral of that is:", or, when the moral is a
 * sentence of its own, the last thing she says in the beat.
 */
function moralOf(lines: HTMLElement[]): string {
  const hers = lines.filter((line) => line.dataset.speaker === 'duchess');
  for (const line of hers) {
    const match = AFTER_COLON.exec(line.textContent ?? '');
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return (hers.at(-1)?.textContent ?? '').trim();
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iGlad = cue('glad');
  const iMoral = cue('moral');
  const iChin = cue('chin');
  const iSense = cue('sense');
  const iBite = cue('bite');
  const iMine = cue('mine');
  const iThink = cue('think');
  const iThunder = cue('thunder');
  const iChoice = cue('choice');
  const iGame = cue('game');
  const iLeft = cue('left');
  const iTurtle = cue('turtle');
  const end = shell.beats.length;
  // Under reduced motion the shell shows each beat as it has settled, seven tenths
  // in: a change placed before that is seen with its sentence, so the motion's
  // own times serve, with every move a cut.
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);
  const after = (at: number, fn: () => void): void => {
    master.call(() => (master.time() >= at ? fn() : undefined), [], at);
  };
  const toggle = (el: Element, name: string, at: number): void => {
    master.call(() => el.toggleAttribute(name, master.time() >= at), [], at);
  };
  /** A layer that is only painted between two times. */
  const between = (el: Element, from: number, to: number): void => {
    const update = (): void => {
      const t = master.time();
      el.toggleAttribute('data-off', !(t >= from && (to >= end || t < to)));
    };
    el.toggleAttribute('data-off', true);
    master.call(update, [], from);
    if (to < end) {
      master.call(update, [], to);
    }
  };

  // --- The ground in bands, each sliding at its own rate as the two walk.
  shell.layer('dc__sky');
  const far = shell.layer('dc__far');
  far.innerHTML = '<div class="dc__band dc__band--far"><div class="dc__hedge"></div></div>';
  const mid = shell.layer('dc__mid');
  const pieceMarkup = (className: string, art: string, x: number, extra = ''): string =>
    `<div class="dc__piece ${className}" style="--x: ${x}"${extra}>${figure(art)}</div>`;
  mid.innerHTML = `<div class="dc__band dc__band--mid">${[
    ...ARCHES.map((x) => pieceMarkup('dc__arch', 'card-arch', x)),
    ...HEDGEHOGS.map((x) => pieceMarkup('dc__hedgehog', 'hedgehog', x)),
    ...PLAYERS.map((x) => pieceMarkup('dc__player', 'card-soldier', x)),
    pieceMarkup('dc__king', 'king-of-hearts', KING_X),
    ...FAR_ARCHES.map((x) => pieceMarkup('dc__arch', 'card-arch', x, ' data-far')),
    ...FAR_PLAYERS.map((x) => pieceMarkup('dc__player', 'card-soldier', x, ' data-far')),
    `<div class="dc__mine" style="--x: ${MINE_X}">${MINE_SVG}</div>`,
  ].join('')}</div>`;
  const near = shell.layer('dc__near');
  near.innerHTML = '<div class="dc__band dc__band--near"><div class="dc__turf"></div></div>';

  // --- The shore the walk comes to: the Mock Turtle's own opening, drawn by its
  // own markup and stylesheet, so the last frame here is its first frame there.
  const landing = shell.layer('dc__landing');
  landing.innerHTML =
    `<div class="dc__land"><div class="mt__shore">${SHORE_HTML}</div>` +
    `<div class="mt__figures"><div class="mt__gryphon">${figure('gryphon')}</div></div></div>`;

  // --- The Queen's shadow and the storm's shade, over the ground, not walking.
  const shade = shell.layer('dc__shade');
  shade.innerHTML = '<div class="dc__long-shadow"></div>';
  const bands = [far, mid, near];
  const walk = { v: 0 };
  const applyWalk = (): void => {
    for (const band of bands) {
      band.style.setProperty('--walk', walk.v.toFixed(2));
    }
  };
  applyWalk();
  const walkTo = (at: number, v: number, duration: number, ease = 'none'): void => {
    master.to(walk, { v, duration, ease, onUpdate: applyWalk }, at);
  };
  // The long walk out keeps its length under reduced motion: each settled beat is
  // then a new frame of it. The short walks are cuts.
  walkTo(iGlad + 0.15, WALK_OUT, iThink - iGlad + 0.55);
  walkTo(iGame + 0.1, WALK_GAME, quick(0.8), 'power1.inOut');
  walkTo(iTurtle + 0.1, WALK_SEA, quick(0.85), 'power1.inOut');

  // --- The two of them, arm in arm, and the Queen who stops them.
  const pair = shell.layer('dc__pair');
  pair.innerHTML =
    '<div class="dc__walkers">' +
    `<div class="dc__duchess">${figure('duchess')}</div>` +
    `<div class="dc__alice">${figure('alice/falling')}<div class="dc__flamingo">${figure('flamingo/tucked')}<span class="dc__snap">${SNAP_SVG}</span></div></div>` +
    '<div class="dc__morals"></div>' +
    '</div>' +
    `<div class="dc__queen"><div class="dc__cloud"></div>${figure('queen-of-hearts')}</div>`;
  // --- Pigs have to fly: the pig-baby on a pair of wings, across the sky, in
  // front of everything while it lasts.
  const pigLayer = shell.layer('dc__pig-layer');
  pigLayer.innerHTML =
    '<div class="dc__pig"><div class="dc__wings">' +
    `<span class="dc__wing dc__wing--left">${WING_SVG}</span>` +
    `<span class="dc__wing dc__wing--right">${WING_SVG}</span></div>` +
    `${figure('pig-baby')}</div><div class="dc__dash"></div>`;
  const duchess = pair.querySelector<HTMLElement>('.dc__duchess') ?? pair;
  const alice = pair.querySelector<HTMLElement>('.dc__alice') ?? pair;
  const flamingo = pair.querySelector<HTMLElement>('.dc__flamingo') ?? pair;
  const queen = pair.querySelector<HTMLElement>('.dc__queen') ?? pair;
  const morals = pair.querySelector<HTMLElement>('.dc__morals') ?? pair;
  const walking = (): void => {
    const t = master.time();
    const on =
      !reducedMotion &&
      ((t >= iGlad + 0.15 && t < iThink + 0.7) ||
        (t >= iGame + 0.1 && t < iGame + 0.9) ||
        (t >= iTurtle + 0.1 && t < iTurtle + 0.92));
    pair.toggleAttribute('data-walking', on);
  };
  for (const at of [
    iGlad + 0.15,
    iThink + 0.7,
    iGame + 0.1,
    iGame + 0.9,
    iTurtle + 0.1,
    iTurtle + 0.92,
  ]) {
    master.call(walking, [], at);
  }
  // Which side of the figures the sentences stand on, on a wide frame: right of
  // the two of them on the walk, left of them once the Queen is at the right.
  const side = (): void => {
    const t = master.time();
    const where = t < iThunder ? 'right' : t < iTurtle ? 'left' : '';
    if (where) {
      shell.root.dataset.side = where;
    } else {
      delete shell.root.dataset.side;
    }
  };
  side();
  master.call(side, [], iThunder);
  master.call(side, [], iTurtle);
  // She squeezes up closer beat by beat; at `chin` the chin is on the shoulder,
  // and Alice winces while the flamingo under her arm eyes the Duchess.
  master.to(duchess, { '--lean': 0.35, duration: quick(0.4) }, iMoral + 0.1);
  master.to(duchess, { '--lean': 1, duration: quick(0.4), ease: 'power2.inOut' }, iChin + 0.05);
  master.to(alice, { '--wince': 1, duration: quick(0.3) }, iChin + 0.15);
  master.to(flamingo, { '--eye': 1, duration: quick(0.3) }, iChin + 0.2);
  master.to(alice, { '--wince': 0.45, duration: quick(0.4) }, iSense + 0.1);
  // He might bite: as the words are said the flamingo lunges at her and snaps,
  // and holds there, beak out, while she draws back; then it settles.
  master.to(flamingo, { '--bite': 1, duration: quick(0.08), ease: 'power3.out' }, iBite + 0.3);
  master.to(duchess, { '--flinch': 1, duration: quick(0.12) }, iBite + 0.32);
  if (!reducedMotion) {
    master.fromTo(
      flamingo,
      { '--snap': 0 },
      {
        '--snap': 1,
        duration: 0.05,
        yoyo: true,
        repeat: 3,
        ease: 'power1.inOut',
        immediateRender: false,
      },
      iBite + 0.4,
    );
  }
  master.to(flamingo, { '--bite': 0, duration: quick(0.15) }, iBite + 0.76);
  master.to(duchess, { '--flinch': 0, duration: quick(0.15) }, iBite + 0.78);
  after(iBite + 0.3, () =>
    Math.abs(master.time() - (iBite + 0.3)) < 0.2 ? shell.sound.play('paper', 0.6) : undefined,
  );
  // Her voice dies away: she straightens, and the two stop.
  master.to(duchess, { '--lean': 0.2, duration: quick(0.2) }, iThink + 0.75);
  master.to(alice, { '--wince': 0, duration: quick(0.2) }, iThink + 0.75);
  master.to(flamingo, { '--eye': 0, duration: quick(0.2) }, iThink + 0.75);

  // --- The morals: a stitched ribbon unrolls from her mouth at each "the moral
  // of that is", on the last line she speaks in that beat, with the moral on it,
  // and rises to the pile above her cap. A tap or the prop flings one off over
  // the ground, and the story's own fling at `choice` takes the rest after her.
  const moralBeats = MORAL_CUES.map((name) => shell.beats[cue(name)]).filter(
    (beat): beat is NonNullable<typeof beat> => beat !== undefined,
  );
  const ribbons: Ribbon[] = moralBeats.map((beat, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dc__ribbon';
    el.setAttribute('aria-label', shell.ui.demoFlingMoral ?? '');
    el.style.setProperty('--i', String(i));
    // The words are the page's own, already in the caption: hidden here, so the
    // accessibility tree carries the sentence once.
    const words = document.createElement('span');
    words.className = 'dc__ribbon-words';
    words.setAttribute('aria-hidden', 'true');
    words.textContent = moralOf(beat.lines);
    el.append(words);
    morals.append(el);
    const lastLine = beat.lines.map((line) => line.dataset.speaker).lastIndexOf('duchess');
    const at = beat.index + 0.12 + Math.max(0, lastLine) * 0.08;
    return { el, at, play: { f: 0 } };
  });
  const applyFling = (ribbon: Ribbon): void => {
    ribbon.el.style.setProperty('--fling', ribbon.play.f.toFixed(3));
  };
  const recount = (): void => {
    const shown = ribbons.filter((ribbon) => master.time() >= ribbon.at).length;
    morals.style.setProperty('--morals', String(shown));
    morals.dataset.morals = String(shown);
  };
  const flingButton = shell.prop(shell.ui.demoFlingMoral ?? '', 'dc__prop dc__prop--fling');
  const flingable = (ribbon: Ribbon): boolean =>
    master.time() >= ribbon.at &&
    master.time() < iChoice + 0.3 &&
    !ribbon.el.hasAttribute('data-flung');
  const offerFling = (): void => {
    if (ribbons.some(flingable)) {
      flingButton.show();
    } else {
      flingButton.hide();
    }
  };
  const fling = (ribbon: Ribbon, byButton = false): void => {
    if (!flingable(ribbon) || shell.paused) {
      return;
    }
    ribbon.el.setAttribute('data-flung', '');
    shell.sound.play('whoosh', 0.5);
    if (byButton) {
      shell.status(shell.ui.demoFlingMoral ?? '');
    }
    gsap.to(ribbon.play, {
      f: 1,
      duration: quick(1.1),
      ease: reducedMotion ? 'steps(1)' : 'power2.in',
      onUpdate: () => applyFling(ribbon),
      overwrite: 'auto',
    });
    offerFling();
  };
  for (const ribbon of ribbons) {
    master.fromTo(
      ribbon.el,
      { '--unroll': 0 },
      { '--unroll': 1, duration: quick(0.35), ease: 'power2.out', immediateRender: false },
      ribbon.at,
    );
    master.call(
      () => {
        const shown = master.time() >= ribbon.at;
        ribbon.el.toggleAttribute('data-shown', shown);
        if (shown) {
          if (Math.abs(master.time() - ribbon.at) < 0.3) {
            shell.sound.play('paper', 0.5);
            shell.sound.play('chime', 0.3);
          }
        } else if (ribbon.play.f > 0 || ribbon.el.hasAttribute('data-flung')) {
          // Scrolled back before it was said: the reader's fling is taken back too.
          gsap.killTweensOf(ribbon.play);
          ribbon.play.f = 0;
          applyFling(ribbon);
          ribbon.el.removeAttribute('data-flung');
        }
        recount();
        offerFling();
      },
      [],
      ribbon.at,
    );
    ribbon.el.addEventListener('click', () => fling(ribbon));
  }
  recount();
  flingButton.addEventListener('click', () => {
    const top = [...ribbons].reverse().find(flingable);
    if (top) {
      fling(top, true);
    }
  });
  master.call(offerFling, [], iChoice + 0.3);
  const goneAt = iChoice + 0.35;
  master.fromTo(
    morals,
    { '--gone': 0 },
    { '--gone': 1, duration: quick(0.45), ease: 'power2.in', immediateRender: false },
    goneAt,
  );
  toggle(morals, 'data-gone', goneAt);

  // --- Shrug her chin off: while the chin is on her shoulder, Alice shrugs and
  // the chin bounces off; it creeps back with the next moral. The reader's own
  // numbers, beside the story's lean, so neither overwrites the other.
  const shrug = { off: 0, up: 0 };
  const applyShrug = (): void => {
    duchess.style.setProperty('--shrugged', shrug.off.toFixed(3));
    alice.style.setProperty('--shrug-up', shrug.up.toFixed(3));
  };
  const shrugFrom = iChin + 0.45;
  const shrugTo = iThink + 0.75;
  const shrugButton = shell.prop(shell.ui.demoShrug ?? '', 'dc__prop dc__prop--shrug');
  const canShrug = (): boolean => master.time() >= shrugFrom && master.time() < shrugTo;
  const shrugOff = (byButton: boolean): void => {
    if (!canShrug() || shell.paused) {
      return;
    }
    gsap.killTweensOf(shrug);
    gsap
      .timeline({ onUpdate: applyShrug, onComplete: applyShrug })
      .to(shrug, { up: 1, duration: quick(0.12), ease: 'power2.out' }, 0)
      .to(shrug, { up: 0, duration: quick(0.25), ease: 'power2.in' }, quick(0.14))
      .to(shrug, { off: 1, duration: quick(0.5), ease: reducedMotion ? 'none' : 'back.out(3)' }, 0);
    shell.sound.play('thud', 0.35);
    if (byButton) {
      shell.status(shell.ui.demoShrugged ?? '');
    }
  };
  shrugButton.addEventListener('click', () => shrugOff(true));
  alice.addEventListener('click', () => shrugOff(false));
  const offerShrug = (): void => {
    const on = canShrug();
    pair.toggleAttribute('data-shrug', on);
    if (on) {
      shrugButton.show();
    } else {
      shrugButton.hide();
    }
  };
  master.call(offerShrug, [], shrugFrom);
  master.call(offerShrug, [], shrugTo);
  // With the next moral, or the next thought, the chin creeps back.
  const creep = (): void => {
    if (shrug.off <= 0) {
      return;
    }
    gsap.killTweensOf(shrug);
    gsap.to(shrug, {
      off: 0,
      up: 0,
      duration: quick(2.2),
      ease: 'sine.inOut',
      onUpdate: applyShrug,
      onComplete: applyShrug,
    });
  };
  for (const at of [...ribbons.map((ribbon) => ribbon.at), iThink + 0.05, shrugTo]) {
    if (at > shrugFrom) {
      master.call(creep, [], at);
    }
  }

  // --- The mustard-mine, far off along the ground: a pithead, a heap, a cart.
  const mine = mid.querySelector<HTMLElement>('.dc__mine') ?? mid;
  master.fromTo(
    mine,
    { opacity: 0 },
    { opacity: 1, duration: quick(0.3), immediateRender: false },
    iMine + 0.1,
  );
  toggle(mine, 'data-shown', iMine + 0.1);

  // --- Pigs have to fly: as she says it, the pig-baby flaps across the sky, and
  // with her word it is cut off, as the Queen's shadow lands: gone at a stroke,
  // and a dash in the sky where it was.
  const pig = pigLayer.querySelector<HTMLElement>('.dc__pig') ?? pigLayer;
  const dash = pigLayer.querySelector<HTMLElement>('.dc__dash') ?? pigLayer;
  const pigCut = iThink + 0.8;
  between(pigLayer, iThink + 0.25, iThunder + 0.4);
  master.fromTo(
    pig,
    { '--fly': 0 },
    { '--fly': 1, duration: pigCut - (iThink + 0.25), ease: 'none', immediateRender: false },
    iThink + 0.25,
  );
  toggle(pigLayer, 'data-cut', pigCut);
  master.fromTo(
    dash,
    { opacity: 0 },
    { opacity: 1, duration: 0.01, immediateRender: false },
    pigCut,
  );
  master.to(dash, { opacity: 0, duration: quick(0.35) }, pigCut + 0.05);
  after(pigCut, () =>
    Math.abs(master.time() - pigCut) < 0.2 ? shell.sound.play('paper', 0.5) : undefined,
  );

  // --- The Queen's shadow falls across the two of them first: the ground
  // darkens from the right, the murmur of the game stops; then the Queen
  // herself, with a storm over her head.
  shell.sound.level('murmur', 0.25);
  const shadeState = { v: 0 };
  const applyShade = (): void => {
    shade.style.setProperty('--shade', shadeState.v.toFixed(3));
    shade.toggleAttribute('data-on', shadeState.v > 0.001);
  };
  applyShade();
  master.to(
    shadeState,
    { v: 1, duration: quick(0.4), ease: 'power2.in', onUpdate: applyShade },
    iThink + 0.75,
  );
  master.call(
    () => shell.sound.level('murmur', master.time() >= iThunder ? 0 : 0.25),
    [],
    iThunder,
  );
  master.fromTo(
    queen,
    { '--arrive': 0 },
    { '--arrive': 1, duration: quick(0.35), ease: 'power3.out', immediateRender: false },
    iThunder + 0.2,
  );
  toggle(queen, 'data-here', iThunder + 0.2);
  after(iThunder + 0.45, () =>
    Math.abs(master.time() - (iThunder + 0.45)) < 0.25 ? shell.sound.play('thud', 0.9) : undefined,
  );
  master.fromTo(
    queen,
    { '--storm': 0 },
    { '--storm': 1, duration: quick(0.2), immediateRender: false },
    iThunder + 0.5,
  );
  // Off with her head: a red flash and a thud at every shout.
  const fury = shell.layer('dc__fury');
  const shout = (): void => {
    shell.sound.play('thud', 0.8);
    gsap.fromTo(fury, { opacity: 0.5 }, { opacity: 0, duration: 0.6, overwrite: 'auto' });
    queen.setAttribute('data-shouting', '');
    setTimeout(() => queen.removeAttribute('data-shouting'), 700);
  };
  for (const beat of shell.spokenBy('queen-of-hearts')) {
    beat.lines.forEach((line, n) => {
      if (line.dataset.speaker === 'queen-of-hearts' && /!$/.test(line.textContent ?? '')) {
        const at = beat.index + 0.08 + n * 0.1;
        master.call(() => (Math.abs(master.time() - at) < 0.25 ? shout() : undefined), [], at);
      }
    });
  }

  // --- Take your choice: she is simply not there, her ribbons fluttering after.
  const duchessArt = duchess.querySelector<HTMLElement>(':scope > .art') ?? duchess;
  const figures = {
    duchessGone: false,
    queenHere: false,
    playersGone: 0,
    archesOff: 0,
  };
  const recountLeft = (): void => {
    const left =
      1 + // Alice
      (figures.duchessGone ? 0 : 1) +
      (figures.queenHere ? 1 : 0) +
      1 + // the King
      (PLAYERS.length - figures.playersGone) +
      (ARCHES.length - figures.archesOff);
    shell.root.dataset.left = String(left);
  };
  master.call(
    () => {
      figures.duchessGone = master.time() >= goneAt;
      duchessArt.toggleAttribute('data-gone', figures.duchessGone);
      duchess.toggleAttribute('data-gone', figures.duchessGone);
      recountLeft();
    },
    [],
    goneAt,
  );
  const hereAt = iThunder + 0.2;
  master.call(
    () => {
      figures.queenHere = master.time() >= hereAt;
      recountLeft();
    },
    [],
    hereAt,
  );

  // --- Back to the game: at every shout a player goes, and an arch stands up
  // and walks off, until only the King, the Queen and Alice are left.
  const players = [...mid.querySelectorAll<HTMLElement>('.dc__player:not([data-far])')];
  const arches = [...mid.querySelectorAll<HTMLElement>('.dc__arch:not([data-far])')];
  const executions = [iGame + 0.4, iGame + 0.6, iGame + 0.8, iLeft + 0.08, iLeft + 0.26];
  executions.forEach((at, n) => {
    master.call(
      () => {
        const gone = master.time() >= at;
        players[n]?.toggleAttribute('data-gone', gone);
        figures.playersGone = executions.filter((time) => master.time() >= time).length;
        recountLeft();
        if (Math.abs(master.time() - at) < 0.2) {
          shout();
        }
      },
      [],
      at,
    );
  });
  const departures = [iGame + 0.5, iLeft + 0.05, iLeft + 0.3];
  departures.forEach((at, n) => {
    const arch = arches[n];
    if (!arch) {
      return;
    }
    master.fromTo(
      arch,
      { '--up': 0 },
      { '--up': 1, duration: quick(0.12), ease: 'power2.out', immediateRender: false },
      at,
    );
    master.fromTo(
      arch,
      { '--off': 0 },
      { '--off': 1, duration: quick(0.3), ease: 'power1.in', immediateRender: false },
      at + 0.1,
    );
    master.call(
      () => {
        arch.toggleAttribute('data-off', master.time() >= at);
        figures.archesOff = departures.filter((time) => master.time() >= time).length;
        recountLeft();
      },
      [],
      at,
    );
  });
  recountLeft();

  // --- Have you seen the Mock Turtle yet?: the Queen turns to Alice, then walks
  // on ahead toward the sea; the ground runs on to the shore where the Gryphon
  // lies asleep in the sun, and the Queen stops where the Mock Turtle's first
  // frame has her. Alice steps past the camera: from there on it is her eyes.
  master.to(queen, { '--arrive': 1.35, duration: quick(0.3), ease: 'power1.inOut' }, iTurtle);
  master.to(queen, { '--storm': 0, duration: quick(0.3) }, iTurtle);
  master.to(
    queen,
    { '--arrive': 1, '--recede': 1, duration: quick(0.5), ease: 'power1.inOut' },
    iTurtle + 0.42,
  );
  master.to(alice, { '--pass': 1, duration: quick(0.45), ease: 'power1.in' }, iTurtle + 0.48);
  master.to(
    shadeState,
    { v: 0, duration: quick(0.6), ease: 'power1.out', onUpdate: applyShade },
    iTurtle + 0.15,
  );
  between(landing, iTurtle + 0.1, end);
  master.fromTo(
    landing,
    { '--land': 0 },
    { '--land': 1, duration: quick(0.85), ease: 'power1.inOut', immediateRender: false },
    iTurtle + 0.1,
  );
  const shore = (): void => {
    const by = master.time() >= iTurtle + 0.4;
    shell.sound.level('wind', by ? 0.25 : 0);
    shell.sound.level('waves', by ? 0.3 : 0);
  };
  master.call(shore, [], iTurtle + 0.4);

  // --- The pointer leans the far bands a little, and the flamingo's eye follows it.
  let lean = 0;
  const pupil = pair.querySelector<SVGElement>('.dc__tucked-pupil');
  shell.onFrame((dt) => {
    const want =
      shell.pointer.active && (shell.pointer.fine || shell.pointer.tilt) ? shell.pointer.x : 0;
    const next = mix(lean, want, 1 - Math.exp(-dt * 3));
    if (Math.abs(next - lean) < 0.0005) {
      return;
    }
    lean = next;
    for (const band of bands) {
      band.style.setProperty('--lean', lean.toFixed(3));
    }
    pupil?.style.setProperty('--px', (lean * 2).toFixed(2));
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
