/**
 * A Moral in Everything: the concept demo.
 *
 * A walk arm in arm along the croquet-ground, side-on, the camera tracking the
 * two of them: the walk is the parallax, and the game (soldiers doubled up as
 * arches, players, hedgehogs) scrolls past behind in three bands. The Duchess
 * leans closer beat by beat until her sharp chin is on Alice's shoulder, and
 * every "the moral of that is" unrolls a stitched ribbon from her mouth; the
 * ribbons pile up, and the reader can fling one off over the ground. Then the
 * Queen's shadow falls across the two of them, the Queen herself with a storm
 * over her head, the Duchess is simply not there, the players go one by one
 * at every shout, and at the last the ground runs down to the sea where the
 * Gryphon lies asleep in the sun: the frame the Mock Turtle opens on.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix } from '../shell/shell.ts';
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

interface Ribbon {
  el: HTMLButtonElement;
  at: number;
  play: { f: number };
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
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);
  // Under reduced motion the shell snaps to the head of a beat, so a change
  // that belongs to a beat is cut in just before its head, as the captions are.
  const cut = (at: number, beat: number): number => (reducedMotion ? Math.max(0, beat - 0.02) : at);
  const after = (at: number, fn: () => void): void => {
    master.call(() => (master.time() >= at ? fn() : undefined), [], at);
  };
  const toggle = (el: Element, name: string, at: number): void => {
    master.call(() => el.toggleAttribute(name, master.time() >= at), [], at);
  };

  // --- The ground in bands, each sliding at its own rate as the two walk.
  shell.layer('dc__sky');
  const far = shell.layer('dc__far');
  far.innerHTML =
    '<div class="dc__band dc__band--far"><div class="dc__hedge"></div><div class="dc__sun"></div></div>';
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
    `<div class="dc__mine" style="--x: ${MINE_X}"><div class="dc__heap"></div><div class="dc__signpost"></div></div>`,
  ].join('')}</div>`;
  const near = shell.layer('dc__near');
  near.innerHTML =
    '<div class="dc__band dc__band--near"><div class="dc__turf"></div>' +
    `<div class="dc__shore"><div class="dc__sea"></div><div class="dc__shingle"></div><div class="dc__grass"></div><div class="dc__gryphon">${figure('gryphon')}</div></div>` +
    '<div class="dc__long-shadow"></div></div>';
  const shade = shell.layer('dc__shade');
  const bands = [far, mid, near];
  const walk = { v: 0 };
  const applyWalk = (): void => {
    for (const band of bands) {
      band.style.setProperty('--walk', walk.v.toFixed(2));
    }
  };
  applyWalk();
  const walkTo = (at: number, beat: number, v: number, duration: number, ease = 'none'): void => {
    // Under reduced motion a cut just before the beat the shell snaps to, so
    // each beat is a new frame of the walk.
    master.to(walk, { v, duration: quick(duration), ease, onUpdate: applyWalk }, cut(at, beat));
  };
  if (reducedMotion) {
    for (let beat = iGlad + 1; beat <= iThink; beat += 1) {
      walkTo(beat, beat, (WALK_OUT * (beat - iGlad)) / (iThink - iGlad), 0);
    }
  } else {
    walkTo(iGlad + 0.15, iGlad, WALK_OUT, iThink - iGlad + 0.55);
  }
  walkTo(iGame + 0.1, iGame, WALK_GAME, 0.8, 'power1.inOut');
  walkTo(iTurtle + 0.1, iTurtle, WALK_SEA, 0.85, 'power1.inOut');

  // --- The two of them, arm in arm, and the Queen who stops them.
  const pair = shell.layer('dc__pair');
  pair.innerHTML =
    '<div class="dc__walkers">' +
    `<div class="dc__duchess">${figure('duchess')}<div class="dc__morals"></div></div>` +
    `<div class="dc__alice">${figure('alice/falling')}<div class="dc__flamingo">${figure('flamingo/tucked')}</div></div>` +
    '</div>' +
    `<div class="dc__queen"><div class="dc__cloud"></div>${figure('queen-of-hearts')}</div>`;
  const walkers = pair.querySelector<HTMLElement>('.dc__walkers') ?? pair;
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
        t >= iTurtle + 0.1);
    pair.toggleAttribute('data-walking', on);
  };
  for (const at of [iGlad + 0.15, iThink + 0.7, iGame + 0.1, iGame + 0.9, iTurtle + 0.1]) {
    master.call(walking, [], at);
  }
  // She squeezes up closer beat by beat; at `chin` the chin is on the shoulder,
  // and Alice winces while the flamingo under her arm eyes the Duchess.
  master.to(duchess, { '--lean': 0.35, duration: quick(0.4) }, cut(iMoral + 0.1, iMoral));
  master.to(
    duchess,
    { '--lean': 1, duration: quick(0.4), ease: 'power2.inOut' },
    cut(iChin + 0.05, iChin),
  );
  master.to(alice, { '--wince': 1, duration: quick(0.3) }, cut(iChin + 0.15, iChin));
  master.to(flamingo, { '--eye': 1, duration: quick(0.3) }, cut(iChin + 0.2, iChin));
  master.to(alice, { '--wince': 0.45, duration: quick(0.4) }, cut(iSense + 0.1, iSense));
  // He might bite: the flamingo snaps at her.
  master.to(
    flamingo,
    { '--snap': 1, duration: quick(0.08), yoyo: true, repeat: 3, ease: 'power1.inOut' },
    iBite + 0.3,
  );
  after(iBite + 0.3, () => shell.sound.play('paper', 0.4));
  // Her voice dies away: she straightens, and the two stop.
  master.to(duchess, { '--lean': 0.2, duration: quick(0.2) }, cut(iThink + 0.7, iThunder));
  master.to(alice, { '--wince': 0, duration: quick(0.2) }, cut(iThink + 0.7, iThunder));
  master.to(flamingo, { '--eye': 0, duration: quick(0.2) }, cut(iThink + 0.7, iThunder));

  // --- The morals: a stitched ribbon unrolls from her mouth at each "the moral
  // of that is", on the last line she speaks in that beat. They pile up; a tap
  // or the prop flings one off over the ground, and the story's own fling at
  // `choice` takes the rest after her.
  const moralBeats = MORAL_CUES.map((name) => shell.beats[cue(name)]).filter(
    (beat): beat is NonNullable<typeof beat> => beat !== undefined,
  );
  const ribbons: Ribbon[] = moralBeats.map((beat, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dc__ribbon';
    el.setAttribute('aria-label', shell.ui.demoFlingMoral ?? '');
    el.style.setProperty('--i', String(i));
    morals.append(el);
    const lastLine = beat.lines.map((line) => line.dataset.speaker).lastIndexOf('duchess');
    const at = cut(beat.index + 0.12 + Math.max(0, lastLine) * 0.08, beat.index);
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
      { '--unroll': 1, duration: quick(0.3), ease: 'power2.out', immediateRender: false },
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
  master.fromTo(
    morals,
    { '--gone': 0 },
    { '--gone': 1, duration: quick(0.45), ease: 'power2.in', immediateRender: false },
    cut(iChoice + 0.35, iGame),
  );

  // --- The mustard-mine, far off along the ground.
  const mine = mid.querySelector<HTMLElement>('.dc__mine') ?? mid;
  master.fromTo(
    mine,
    { opacity: 0 },
    { opacity: 1, duration: quick(0.3), immediateRender: false },
    cut(iMine + 0.1, iMine),
  );
  toggle(mine, 'data-shown', cut(iMine + 0.1, iMine));

  // --- The Queen's shadow falls across the two of them first: the ground
  // darkens from the right, the murmur of the game stops; then the Queen
  // herself, with a storm over her head.
  shell.sound.level('murmur', 0.25);
  const shadeState = { v: 0 };
  const applyShade = (): void => {
    const v = shadeState.v.toFixed(3);
    shade.style.setProperty('--shade', v);
    near.style.setProperty('--shade', v);
    shade.toggleAttribute('data-on', shadeState.v > 0.001);
  };
  applyShade();
  master.to(
    shadeState,
    { v: 1, duration: quick(0.4), ease: 'power2.in', onUpdate: applyShade },
    cut(iThink + 0.75, iThunder),
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
    cut(iThunder + 0.2, iThunder),
  );
  toggle(queen, 'data-here', cut(iThunder + 0.2, iThunder));
  after(cut(iThunder + 0.45, iThunder), () => shell.sound.play('thud', 0.9));
  master.fromTo(
    queen,
    { '--storm': 0 },
    { '--storm': 1, duration: quick(0.2), immediateRender: false },
    cut(iThunder + 0.5, iThunder),
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
  const goneAt = cut(iChoice + 0.35, iGame);
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
  const hereAt = cut(iThunder + 0.2, iThunder);
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
  const executions = [
    cut(iGame + 0.4, iLeft),
    cut(iGame + 0.6, iLeft),
    cut(iGame + 0.8, iLeft),
    cut(iLeft + 0.08, iTurtle),
    cut(iLeft + 0.26, iTurtle),
  ];
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
  const departures = [
    cut(iGame + 0.5, iLeft),
    cut(iLeft + 0.05, iTurtle),
    cut(iLeft + 0.3, iTurtle),
  ];
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

  // --- Have you seen the Mock Turtle yet?: the Queen turns to Alice and the two
  // walk off to the right, where the ground runs down to the sea and the Gryphon
  // lies asleep in the sun: the Mock Turtle's opening frame.
  const turn = cut(iTurtle, iTurtle);
  master.to(queen, { '--arrive': 1.35, duration: quick(0.4), ease: 'power1.inOut' }, turn);
  master.to(queen, { '--storm': 0, duration: quick(0.3) }, turn);
  master.to(
    [walkers, queen],
    { '--exit': 1, duration: quick(0.8), ease: 'power1.inOut' },
    cut(iTurtle + 0.15, iTurtle),
  );
  master.to(far, { '--sun': 1, duration: quick(0.5) }, cut(iTurtle + 0.2, iTurtle));
  const breeze = (): void => {
    shell.sound.level('wind', master.time() >= iTurtle + 0.2 ? 0.25 : 0);
  };
  master.call(breeze, [], iTurtle + 0.2);

  // --- The pointer leans the far bands a little, and the flamingo's eye follows it.
  let lean = 0;
  const pupil = pair.querySelector<SVGElement>('.dc__tucked-pupil');
  shell.onFrame((dt) => {
    const want =
      shell.pointer.active && (shell.pointer.fine || shell.pointer.tilt) ? shell.pointer.x : 0;
    lean = mix(lean, want, 1 - Math.exp(-dt * 3));
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
