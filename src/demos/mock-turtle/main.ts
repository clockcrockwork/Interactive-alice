/**
 * The Mock Turtle's Story: the concept demo.
 *
 * The same shore as the Lobster Quadrille, a little earlier in the day. The
 * Gryphon is asleep in the sun on the grass above the shore; the Queen leaves it
 * with Alice, it wakes, chuckles, and the camera follows it along the shore in
 * layers to the Mock Turtle on his ledge of rock. His sighs are visible: each one
 * sends a ripple out across the sea, and the swell answers. As he tells of his
 * schooling the picture goes under the water to the school in the sea, drawn in
 * depth; back on the shore the subjects he names are written on the wet sand,
 * taken from his own sentences, and the wave washes them away; the lessons are a
 * row of suns that lessen from day to day. At the last the camera settles into
 * the quadrille's opening composition and the Mock Turtle draws breath for the
 * sigh that opens it.
 *
 * The reader may break the long silence by clearing a throat, which startles
 * him into louder sobs; may wake the Drawling-master, who drawls, stretches
 * across the sea and faints in coils; and comforts him, which only makes it worse.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import { GRYPHON_PAWS, SHORE_HTML, schoolMarkup, TURTLE_FLAPPERS } from './figures.ts';
import '../lobster-quadrille/shore.css';
import './mock-turtle.css';

/** A capitalised word of five letters or more, so the pronouns and the words
    that only open a sentence stay out of the sand. */
const CAPITAL_WORD = /\b[A-Z][a-z]{4,}\b/g;

/** The subject names in what the Mock Turtle says in a beat, in order, once each. */
function subjectsIn(lines: HTMLElement[]): string[] {
  const found: string[] = [];
  for (const line of lines) {
    if (line.dataset.speaker !== 'mock-turtle') {
      continue;
    }
    for (const match of (line.textContent ?? '').matchAll(CAPITAL_WORD)) {
      if (!found.includes(match[0])) {
        found.push(match[0]);
      }
    }
  }
  return found;
}

/** Every capitalised word in a beat, whoever says it. */
function capitalsIn(lines: HTMLElement[]): string[] {
  return lines.flatMap((line) =>
    [...(line.textContent ?? '').matchAll(CAPITAL_WORD)].map((m) => m[0]),
  );
}

/** A word as a run of letter spans, so each letter can writhe on its own. */
function letters(word: string): string {
  return [...word]
    .map((letter, index) => `<span class="mt__letter" style="--l: ${index}">${letter}</span>`)
    .join('');
}

interface WordGroup {
  el: HTMLElement;
  words: HTMLElement[];
  /** Where the group is written, in timeline time, and where the story washes it. */
  at: number;
  washAt: number;
  story: { wash: number };
  play: { wash: number };
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iAlone = cue('alone');
  const iFun = cue('fun');
  const iDistance = cue('distance');
  // The sea, all along this shore.
  shell.sound.level('waves', 0.3);
  const iSorrow = cue('sorrow');
  const iTears = cue('tears');
  const iSilence = cue('silence');
  const iOnce = cue('once');
  const iSchool = cue('school');
  const iTortoise = cue('tortoise');
  const iEveryDay = cue('every-day');
  const iExtras = cue('extras');
  const iWashing = cue('washing');
  const iReeling = cue('reeling');
  const iUglify = cue('uglify');
  const iMore = cue('more');
  const iDrawling = cue('drawling');
  const iGrief = cue('grief');
  const iHours = cue('hours');
  const iHoliday = cue('holiday');
  const iGames = cue('games');
  const lite = matchMedia('(max-width: 700px)').matches;
  const random = seeded(9);
  const quick = (duration: number): number => (reducedMotion ? 0.01 : duration);

  // --- The shore in layers. The sea breathes on its own; the camera's walk along
  // the shore, the descent under the water and the settle at the end are one
  // camera object, applied as custom properties so the CSS does the parallax.
  const shore = shell.layer('mt__shore');
  shore.innerHTML = SHORE_HTML;
  const seas = [...shore.querySelectorAll<HTMLElement>('.mt__sea')];
  seas.forEach((sea, index) => {
    shell.ambient.to(
      sea,
      {
        x: (index + 1) * 18,
        y: (index + 1) * -3,
        duration: 3.2 + index,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      },
      index * 0.4,
    );
  });
  const ripples = [...shore.querySelectorAll<HTMLElement>('.mt__ripple')];
  let rippleIndex = 0;

  // The figures: the Queen, the Drawling-master out in the sea (a button while he
  // is up), the Gryphon on the shore in front of him (its shadow on the sand, and
  // its paws to hide its face in), and the old crab.
  const figures = shell.layer('mt__figures');
  figures.innerHTML =
    '<div class="mt__shade mt__shade--gryphon"><div class="mt__shade-blob"></div></div>' +
    `<div class="mt__queen">${figure('queen-of-hearts')}</div>` +
    `<button type="button" class="mt__eel" aria-label="${shell.ui.demoWakeEel ?? ''}" inert>${figure('conger-eel')}</button>` +
    `<div class="mt__gryphon">${figure('gryphon')}${GRYPHON_PAWS}</div>` +
    `<div class="mt__crab">${figure('crab')}</div>`;
  const queen = figures.querySelector<HTMLElement>('.mt__queen') ?? figures;
  const gryphon = figures.querySelector<HTMLElement>('.mt__gryphon') ?? figures;
  const eel = figures.querySelector<HTMLButtonElement>('.mt__eel') ?? figures;
  const crab = figures.querySelector<HTMLElement>('.mt__crab') ?? figures;

  // The Mock Turtle is pointer play on the stage: tap him and he sighs harder.
  // The *Comfort him* button is the way for the keyboard and for assistive
  // technology, so he takes no focus and is not announced twice.
  const turtle = document.createElement('button');
  turtle.type = 'button';
  turtle.className = 'mt__turtle';
  turtle.tabIndex = -1;
  turtle.setAttribute('aria-hidden', 'true');
  turtle.innerHTML =
    figure('mock-turtle') +
    TURTLE_FLAPPERS +
    Array.from({ length: 4 }, (_, i) => `<div class="mt__drop" style="--d: ${i}"></div>`).join('');
  shell.stage.append(turtle);

  const school = shell.layer('mt__school');
  school.innerHTML = schoolMarkup(lite);
  const schoolWorld = school.querySelector<HTMLElement>('.mt__school-world') ?? school;
  const tortoiseMaster = school.querySelector<HTMLElement>('.mt__master') ?? school;
  const bubbles = school.querySelector<HTMLElement>('.mt__bubbles') ?? school;
  bubbles.innerHTML = Array.from(
    { length: lite ? 10 : 18 },
    () =>
      `<div class="mt__bubble" style="--x: ${(random() * 100).toFixed(1)}%; --delay: ${(-random() * 4).toFixed(2)}s; --size: ${(1 + random() * 2).toFixed(1)}; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');

  const cam = { pan: 0, depth: 0, settle: 0 };
  const applyCam = (): void => {
    for (const el of [shore, figures, school, turtle]) {
      el.style.setProperty('--pan', cam.pan.toFixed(3));
      el.style.setProperty('--depth', cam.depth.toFixed(3));
      el.style.setProperty('--settle', cam.settle.toFixed(3));
    }
    shell.sound.level('drip', cam.depth * 0.35);
  };
  applyCam();
  const camTo = (
    at: number,
    to: Partial<typeof cam>,
    duration: number,
    ease = 'power2.inOut',
  ): void => {
    master.to(cam, { ...to, duration, ease, onUpdate: applyCam }, at);
  };

  // --- The day: the sun, and the shadows it throws on the sand. `hour` runs from
  // 0 to 1 through the long silence, the sun sliding across the sky and the
  // shadows swinging under it, and from 1 to 2 as the lessons lessen, when it
  // goes down into the sea at the far side; `shade` brings the shadows in once
  // the walk along the shore begins, so the first frame is untouched.
  const day = { hour: 0, shade: 0 };
  const applyDay = (): void => {
    const rise = Math.min(day.hour, 1);
    const set = Math.max(day.hour - 1, 0);
    const sunX = -rise * 58;
    const sunY = -Math.sin(rise * Math.PI) * 6 + set * 36;
    const angle = 140 - rise * 95 - set * 30;
    const length = day.hour <= 1 ? 1.1 - Math.sin(rise * Math.PI) * 0.35 : 1.1 + set * 1.2;
    const shade = day.shade * (1 - Math.min(1, Math.max(0, day.hour - 1.7) / 0.3));
    for (const el of [shore, figures]) {
      el.style.setProperty('--sun-x', sunX.toFixed(2));
      el.style.setProperty('--sun-y', sunY.toFixed(2));
      el.style.setProperty('--shade-a', angle.toFixed(1));
      el.style.setProperty('--shade-l', length.toFixed(3));
      el.style.setProperty('--shade', shade.toFixed(3));
    }
  };
  applyDay();
  master.fromTo(
    day,
    { shade: 0 },
    { shade: 1, duration: quick(0.8), onUpdate: applyDay, immediateRender: false },
    iFun + 0.5,
  );

  // --- The Gryphon asleep in the sun; the Queen walks off; it sits up, rubs its
  // eyes, watches her out of sight, and chuckles. Come on!: the walk along the shore.
  master.to(
    queen,
    { x: '-90vw', opacity: 0, duration: quick(0.6), ease: 'power1.in' },
    iAlone + 0.05,
  );
  master.to(gryphon, { '--sleep': 0, duration: quick(0.3), ease: 'power2.out' }, iAlone + 0.2);
  master.to(gryphon, { '--rub': 1, duration: quick(0.08), yoyo: true, repeat: 5 }, iAlone + 0.5);
  master.to(gryphon, { '--chuckle': 1, duration: quick(0.06), yoyo: true, repeat: 7 }, iFun + 0.1);
  master.call(
    () => (master.time() >= iFun + 0.1 ? shell.sound.play('chime', 0.4) : undefined),
    [],
    iFun + 0.1,
  );
  camTo(iFun + 0.5, { pan: 1 }, quick(0.9), 'power1.inOut');
  const walking = (): void => {
    const on = master.time() >= iFun + 0.5 && master.time() < iDistance + 0.4 && !reducedMotion;
    figures.toggleAttribute('data-walking', on);
    shell.sound.level('wind', on ? 0.2 : 0);
  };
  master.call(walking, [], iFun + 0.5);
  master.call(walking, [], iDistance + 0.4);

  // --- The Mock Turtle on his ledge: sighs you can see. Each one sends a ripple
  // out across the sea, and the swell answers; comforting him makes it worse.
  const sea = { swell: 0 };
  const heave = { amount: 0 };
  const applySea = (): void => {
    shore.style.setProperty('--swell', (sea.swell + heave.amount).toFixed(3));
  };
  applySea();
  const ripple = (strength: number): void => {
    const el = ripples[rippleIndex % ripples.length];
    rippleIndex += 1;
    if (!el) {
      return;
    }
    if (reducedMotion) {
      // A cut in the wave line: the ring is there, then it is not.
      gsap.fromTo(
        el,
        { opacity: 0.8, scale: 1.4 * strength },
        { opacity: 0, duration: 0.4, ease: 'steps(2)' },
      );
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0.85, scale: 0.15 },
      { opacity: 0, scale: 2.4 * strength, duration: 1.8, ease: 'power1.out' },
    );
  };
  const sigh = (at: number, strength = 1): void => {
    master.to(
      turtle,
      { '--sigh': strength, duration: quick(0.12), yoyo: true, repeat: 1, ease: 'sine.inOut' },
      at,
    );
    master.to(
      sea,
      {
        swell: 0.5 * strength,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
        onUpdate: applySea,
      },
      at + 0.06,
    );
    master.call(
      () => {
        ripple(strength);
        shell.sound.play('whoosh', 0.25 * strength);
      },
      [],
      at + 0.1,
    );
  };
  sigh(iDistance + 0.55);
  sigh(iSorrow + 0.15);
  sigh(iSorrow + 0.55, 1.3);
  sigh(iOnce + 0.2, 1.4);
  sigh(iOnce + 0.5, 1.6);
  sigh(iEveryDay + 0.4, 0.8);
  sigh(iHoliday + 0.5, 0.9);
  // Eyes full of tears at `tears`; they drop into the sea until the silence.
  master.to(turtle, { '--sob': 1, duration: quick(0.3) }, iTears + 0.05);
  master.to(turtle, { '--sob': 0.4, duration: quick(0.3) }, iSilence + 0.1);
  master.to(turtle, { '--sob': 1, duration: quick(0.2) }, iOnce + 0.15);
  master.to(turtle, { '--sob': 0, duration: quick(0.3) }, iSchool + 0.1);
  const crying = (): void => {
    const t = master.time();
    turtle.toggleAttribute(
      'data-crying',
      (t >= iTears + 0.1 && t < iSilence) || (t >= iOnce + 0.15 && t < iSchool),
    );
  };
  for (const at of [iTears + 0.1, iSilence, iOnce + 0.15, iSchool]) {
    master.call(crying, [], at);
  }

  // The reader's own sighs: he heaves, the sea heaves with him, and a ripple
  // goes out. Each on its own object, so the scroll's sighs are never undone.
  const stir = (strength: number): void => {
    shore.dataset.stirred = '';
    gsap.fromTo(
      turtle,
      { '--sigh-play': 0 },
      {
        '--sigh-play': strength,
        duration: quick(0.35),
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
        overwrite: 'auto',
      },
    );
    gsap.fromTo(
      heave,
      { amount: 0 },
      {
        amount: 0.7 * strength,
        duration: reducedMotion ? 0.01 : 0.5,
        yoyo: true,
        repeat: reducedMotion ? 0 : 1,
        ease: 'sine.inOut',
        onUpdate: applySea,
        onComplete: () => {
          if (reducedMotion) {
            gsap.to(heave, { amount: 0, duration: 0.01, delay: 0.6, onUpdate: applySea });
          }
          delete shore.dataset.stirred;
        },
        overwrite: 'auto',
      },
    );
    ripple(strength);
  };

  const comfortButton = shell.prop(shell.ui.demoComfort ?? '', 'mt__prop mt__prop--comfort');
  let comforting = 0;
  const comfort = (): void => {
    if (turtle.dataset.tappable === undefined) {
      return;
    }
    comforting += 1;
    shell.sound.play('whoosh', 0.4);
    shell.status(shell.ui.demoComfort ?? '');
    stir(Math.min(2.2, 1.2 + comforting * 0.25));
  };
  comfortButton.addEventListener('click', comfort);
  turtle.addEventListener('click', comfort);
  const comfortable = (): void => {
    const t = master.time();
    const inside =
      (t >= iDistance + 0.3 && t < iSchool + 0.1) || (t >= iReeling + 0.4 && t < iGames + 0.3);
    if (inside) {
      comfortButton.show();
      turtle.dataset.tappable = '';
    } else {
      comfortButton.hide();
      delete turtle.dataset.tappable;
    }
  };
  for (const at of [iDistance + 0.3, iSchool + 0.1, iReeling + 0.4, iGames + 0.3]) {
    master.call(comfortable, [], at);
  }

  // --- So they sat down, and nobody spoke for some minutes: the sun slides
  // across the sky and the shadows swing round under it while nobody speaks.
  // Clear your throat, and the silence breaks: the Mock Turtle starts and sobs
  // louder than ever, tears running, the sea heaving with him.
  master.to(
    day,
    { hour: 1, duration: quick(0.6), ease: 'none', onUpdate: applyDay },
    iSilence + 0.05,
  );
  const throatButton = shell.prop(shell.ui.demoClearThroat ?? '', 'mt__prop mt__prop--throat');
  const startle = { amount: 0 };
  const applyStartle = (): void => turtle.style.setProperty('--startle', startle.amount.toFixed(3));
  let throatOpen = false;
  let sobbing = 0;
  const clearThroat = (): void => {
    if (!throatOpen) {
      return;
    }
    shell.sound.play('thud', 0.3);
    shell.status(shell.ui.demoClearThroat ?? '');
    if (reducedMotion) {
      // A start held still for a moment, then settled: no bounce.
      gsap.fromTo(
        startle,
        { amount: 1 },
        { amount: 0, duration: 0.01, delay: 0.7, onUpdate: applyStartle, onStart: applyStartle },
      );
      applyStartle();
    } else {
      const jump = gsap.timeline({ onUpdate: applyStartle });
      jump.to(startle, { amount: 1, duration: 0.12, ease: 'power2.out' });
      jump.to(startle, { amount: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    }
    turtle.setAttribute('data-sobbing', '');
    window.clearTimeout(sobbing);
    sobbing = window.setTimeout(() => turtle.removeAttribute('data-sobbing'), 2800);
    window.setTimeout(() => {
      shell.sound.play('whoosh', 0.5);
      stir(1.8);
    }, 260);
  };
  throatButton.addEventListener('click', clearThroat);
  const throatWindow = (): void => {
    const t = master.time();
    throatOpen = t >= iSilence + 0.1 && t < iOnce;
    if (throatOpen) {
      throatButton.show();
    } else {
      throatButton.hide();
      window.clearTimeout(sobbing);
      turtle.removeAttribute('data-sobbing');
    }
  };
  master.call(throatWindow, [], iSilence + 0.1);
  master.call(throatWindow, [], iOnce);

  // --- Hjckrrh!: the Gryphon's own noise, taken from the sound line, drawn as a
  // big jagged word a letter at a time as its line appears, while the Gryphon
  // shakes with it; the word holds through the beat and goes before the school.
  const cry = shell.layer('mt__cry');
  const onceLines = shell.beats[iOnce]?.lines ?? [];
  const soundLine = onceLines.find((line) => line.dataset.kind === 'sound');
  const cryWord = document.createElement('div');
  cryWord.className = 'mt__cry-word';
  cryWord.innerHTML = letters(soundLine?.textContent?.trim() ?? '');
  cry.append(cryWord);
  const cryLetters = [...cryWord.querySelectorAll<HTMLElement>('.mt__letter')];
  // The shell's own captions come in a line at a time, 0.08 of a beat apart.
  const cryAt = iOnce + 0.05 + Math.max(0, soundLine ? onceLines.indexOf(soundLine) : 0) * 0.08;
  master.fromTo(
    cryWord,
    { opacity: 0 },
    { opacity: 1, duration: quick(0.04), immediateRender: false },
    cryAt,
  );
  master.fromTo(
    cryLetters,
    { '--drawn': 0 },
    {
      '--drawn': 1,
      duration: quick(0.05),
      stagger: reducedMotion ? 0 : 0.028,
      ease: 'back.out(2.4)',
    },
    cryAt,
  );
  master.to(cryWord, { opacity: 0, duration: 0.1 }, iOnce + 0.86);
  // Under reduced motion the shake is a held, tilted pose, there in the settled frame.
  const shakeEnd = iOnce + (reducedMotion ? 0.86 : 0.62);
  const shaking = (): void => {
    const t = master.time();
    figures.toggleAttribute('data-crying-out', t >= cryAt && t < shakeEnd);
  };
  master.call(shaking, [], cryAt);
  master.call(shaking, [], shakeEnd);
  master.to(
    gryphon,
    { '--hop': 1, duration: quick(0.1), yoyo: true, repeat: 1, ease: 'power2.out' },
    cryAt,
  );
  master.call(
    () => (master.time() >= cryAt ? shell.sound.play('thud', 0.6) : undefined),
    [],
    cryAt,
  );

  // --- School in the sea: the picture goes under the water, and the school is
  // there in depth. Under reduced motion the descent is a cross-fade.
  camTo(iSchool + 0.1, { depth: 1 }, reducedMotion ? 0.3 : 0.5, 'power2.in');
  camTo(iReeling, { depth: 0 }, reducedMotion ? 0.3 : 0.4, 'power2.out');
  master.call(
    () => (master.time() >= iSchool + 0.25 ? shell.sound.play('splash', 0.6) : undefined),
    [],
    iSchool + 0.25,
  );
  const underWater = (): void => {
    const on = master.time() >= iSchool + 0.1 && master.time() < iReeling + 0.2;
    shell.root.toggleAttribute('data-under', on);
  };
  master.call(underWater, [], iSchool + 0.1);
  master.call(underWater, [], iReeling + 0.2);
  // The old Tortoise raps his cane when he is asked about; the pupils sit up at
  // every day; the extras and the washing are bubbles.
  master.to(
    tortoiseMaster,
    { '--rap': 1, duration: quick(0.1), yoyo: true, repeat: 3 },
    iTortoise + 0.2,
  );
  master.call(
    () => (master.time() >= iTortoise + 0.2 ? shell.sound.play('thud', 0.4) : undefined),
    [],
    iTortoise + 0.2,
  );
  master.to(schoolWorld, { '--attend': 1, duration: quick(0.3) }, iEveryDay + 0.1);
  master.to(schoolWorld, { '--attend': 0, duration: quick(0.3) }, iExtras + 0.5);
  const bubbling = (): void => {
    bubbles.toggleAttribute('data-on', master.time() >= iExtras + 0.6 && master.time() < iReeling);
  };
  master.call(bubbling, [], iExtras + 0.6);
  master.call(bubbling, [], iReeling);
  master.fromTo(
    bubbles,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, immediateRender: false },
    iExtras + 0.6,
  );
  master.to(bubbles, { opacity: 0, duration: 0.2 }, iWashing + 0.8);

  // --- The subjects, written on the wet sand: the capitalised words of what the
  // Mock Turtle says in each beat of the shot, drawn as their own elements, and
  // washed away by the wave. Tap a word and it uglifies; drag a wave over the
  // words, or press Wash, and they go early. The story washes them anyway.
  const subjects = shell.layer('mt__subjects');
  const sand = document.createElement('div');
  sand.className = 'mt__sand-words';
  const wave = document.createElement('div');
  wave.className = 'mt__wash-wave';
  subjects.append(sand, wave);
  const subjectBeats = shell.beats.filter((beat) => beat.shot === 'the-subjects');
  const groups: WordGroup[] = [];
  const shotEnd = (subjectBeats.at(-1)?.index ?? iGrief) + 1;
  for (const beat of subjectBeats) {
    const words = subjectsIn(beat.lines);
    if (words.length === 0) {
      continue;
    }
    const el = document.createElement('div');
    el.className = 'mt__group';
    el.dataset.cue = beat.cue ?? '';
    el.innerHTML = words
      .map(
        (word, index) =>
          `<span class="mt__subject" data-word="${word}" style="--i: ${index}">${letters(word)}</span>`,
      )
      .join('');
    sand.append(el);
    groups.push({
      el,
      words: [...el.querySelectorAll<HTMLElement>('.mt__subject')],
      at: beat.index + 0.12,
      washAt: shotEnd - 0.2,
      story: { wash: 0 },
      play: { wash: 0 },
    });
  }
  groups.forEach((group, index) => {
    const next = groups[index + 1];
    if (next) {
      group.washAt = next.at - 0.32;
    }
  });
  const applyWash = (): void => {
    let total = 0;
    for (const group of groups) {
      const amount = Math.max(group.story.wash, group.play.wash);
      group.el.style.setProperty('--wash', amount.toFixed(3));
      total = Math.max(total, amount);
    }
    // The wave comes in over the words and goes back: a sine of the wash.
    wave.style.setProperty('--wave', Math.sin(total * Math.PI).toFixed(3));
  };
  applyWash();
  const activeGroup = (): WordGroup | undefined =>
    groups.find((group) => master.time() >= group.at && master.time() < group.washAt + 0.3);
  for (const group of groups) {
    master.fromTo(
      group.el,
      { '--show': 0 },
      { '--show': 1, duration: 0.3, immediateRender: false },
      group.at,
    );
    master.to(
      group.story,
      { wash: 1, duration: reducedMotion ? 0.2 : 0.3, onUpdate: applyWash },
      group.washAt,
    );
    // Scrolling back before a group is written also takes back the reader's wash.
    master.call(
      () => {
        if (master.time() < group.at + 0.01 && group.play.wash > 0) {
          gsap.killTweensOf(group.play);
          group.play.wash = 0;
          applyWash();
        }
      },
      [],
      group.at,
    );
  }
  let washing = false;
  const wash = (): void => {
    const group = activeGroup();
    if (!group || washing || group.play.wash > 0) {
      return;
    }
    washing = true;
    shell.sound.play('splash', 0.5);
    shell.status(shell.ui.demoWash ?? '');
    gsap.to(group.play, {
      wash: 1,
      duration: reducedMotion ? 0.4 : 1.4,
      ease: 'sine.inOut',
      onUpdate: applyWash,
      onComplete: () => {
        washing = false;
      },
    });
  };
  const washButton = shell.prop(shell.ui.demoWash ?? '', 'mt__prop mt__prop--wash');
  washButton.addEventListener('click', wash);
  const uglifyButton = shell.prop(shell.ui.demoUglify ?? '', 'mt__prop mt__prop--uglify');
  const uglifyTimers = new Map<HTMLElement, number>();
  const uglify = (word: HTMLElement): void => {
    word.setAttribute('data-uglified', '');
    shell.sound.play('paper', 0.4);
    const pending = uglifyTimers.get(word);
    if (pending) {
      clearTimeout(pending);
    }
    uglifyTimers.set(
      word,
      window.setTimeout(() => {
        word.removeAttribute('data-uglified');
        uglifyTimers.delete(word);
      }, 1600),
    );
  };
  let uglifyNext = 0;
  uglifyButton.addEventListener('click', () => {
    const group = activeGroup();
    if (!group) {
      return;
    }
    const word = group.words[uglifyNext % group.words.length];
    uglifyNext += 1;
    if (word) {
      uglify(word);
      shell.status(word.dataset.word ?? '');
    }
  });
  // A tap on a word; a drag across the sand is a wave of the reader's own.
  let drag: { x: number; moved: boolean } | undefined;
  sand.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, moved: false };
  });
  sand.addEventListener('pointermove', (event) => {
    if (!drag || drag.moved) {
      return;
    }
    if (Math.abs(event.clientX - drag.x) > window.innerWidth * 0.25) {
      drag.moved = true;
      wash();
    }
  });
  sand.addEventListener('pointerup', (event) => {
    const wasDrag = drag?.moved;
    drag = undefined;
    if (wasDrag) {
      return;
    }
    const word = (event.target as HTMLElement | null)?.closest<HTMLElement>('.mt__subject');
    if (word && activeGroup()?.words.includes(word)) {
      uglify(word);
    }
  });
  sand.addEventListener('pointercancel', () => {
    drag = undefined;
  });
  const wordsShown = (): void => {
    const group = activeGroup();
    shell.root.toggleAttribute('data-words', Boolean(group));
    if (group) {
      washButton.show();
      uglifyButton.show();
      subjects.dataset.tappable = '';
    } else {
      washButton.hide();
      uglifyButton.hide();
      delete subjects.dataset.tappable;
    }
  };
  for (const group of groups) {
    master.call(wordsShown, [], group.at);
    master.call(wordsShown, [], group.washAt + 0.3);
  }
  // Never heard of uglifying: the word the beat itself argues about writhes by itself.
  const argued = capitalsIn(shell.beats[iUglify]?.lines ?? []);
  master.call(
    () => {
      if (master.time() < iUglify + 0.35) {
        return;
      }
      for (const group of groups) {
        for (const word of group.words) {
          if (argued.includes(word.dataset.word ?? '')) {
            uglify(word);
          }
        }
      }
    },
    [],
    iUglify + 0.35,
  );
  master.to(gryphon, { '--hop': 1, duration: quick(0.12), yoyo: true, repeat: 1 }, iUglify + 0.2);
  master.to(turtle, { '--count': 1, duration: quick(0.1), yoyo: true, repeat: 5 }, iMore + 0.2);

  // The Drawling-master rises out of the sea in coils; the Classics master
  // scuttles in along the shingle; both creatures hide their faces in their paws.
  master.fromTo(
    eel,
    { '--up': 0 },
    { '--up': 1, duration: quick(0.5), ease: 'power2.out', immediateRender: false },
    iDrawling + 0.1,
  );
  master.to(eel, { '--up': 0, duration: quick(0.3) }, iGrief);
  // Wake him, and he does what he taught: he drawls, stretches right across the
  // sea, and faints in coils, then comes round. His own object, so the scroll
  // that raises him and the reader's play never fight over one value.
  const lesson = { drawl: 0, stretch: 0, faint: 0 };
  const applyLesson = (): void => {
    eel.style.setProperty('--drawl', lesson.drawl.toFixed(3));
    eel.style.setProperty('--stretch', lesson.stretch.toFixed(3));
    eel.style.setProperty('--faint', lesson.faint.toFixed(3));
  };
  applyLesson();
  let teaching: gsap.core.Timeline | undefined;
  const wake = (): void => {
    if (eel.inert || teaching?.isActive()) {
      return;
    }
    shell.status(shell.ui.demoWakeEel ?? '');
    const play = gsap.timeline({ onUpdate: applyLesson });
    if (reducedMotion) {
      // Three poses, cut one to the next: drawling, stretched, fainted.
      play.set(lesson, { drawl: 1 }, 0);
      play.set(lesson, { drawl: 0, stretch: 1 }, 0.7);
      play.set(lesson, { stretch: 0, faint: 1 }, 1.5);
      play.set(lesson, { faint: 0 }, 2.7);
    } else {
      play.to(lesson, { drawl: 1, duration: 0.7, ease: 'sine.inOut' }, 0);
      play.to(lesson, { drawl: 0, stretch: 1, duration: 0.9, ease: 'power1.inOut' }, 0.7);
      play.to(lesson, { stretch: 0, duration: 0.3, ease: 'power2.in' }, 1.6);
      play.to(lesson, { faint: 1, duration: 0.6, ease: 'bounce.out' }, 1.6);
      play.to(lesson, { faint: 0, duration: 0.8, ease: 'power2.inOut' }, 3.1);
    }
    play.call(() => shell.sound.play('whoosh', 0.3), [], 0.7);
    play.call(() => shell.sound.play('thud', 0.35), [], reducedMotion ? 1.5 : 1.7);
    teaching = play;
  };
  eel.addEventListener('click', wake);
  // He is a button only while he is up out of the sea.
  const eelLive = (): void => {
    const t = master.time();
    eel.inert = !(t >= iDrawling + 0.2 && t < iGrief);
  };
  master.call(eelLive, [], iDrawling + 0.2);
  master.call(eelLive, [], iGrief);
  master.fromTo(
    crab,
    { '--in': 0 },
    { '--in': 1, duration: quick(0.5), ease: 'power1.out', immediateRender: false },
    iGrief + 0.1,
  );
  master.to(crab, { '--in': 0, duration: quick(0.3) }, iHours);
  // They hide their faces as the line that says so appears (the shell's captions
  // come a line at a time, 0.08 of a beat apart), and keep them hidden.
  const griefLines = shell.beats[iGrief]?.lines ?? [];
  const hidLine = [...griefLines].reverse().find((line) => line.dataset.kind === 'narration');
  const hideAt = iGrief + 0.08 + Math.max(0, hidLine ? griefLines.indexOf(hidLine) : 2) * 0.08;
  master.to([gryphon, turtle], { '--hide': 1, duration: quick(0.2) }, hideAt);
  master.to([gryphon, turtle], { '--hide': 0, duration: quick(0.25) }, iHours + 0.1);

  // --- Lessons: ten hours the first day, nine the next; a row of suns that lessen
  // from day to day, an empty ring for the holiday, and nothing for the twelfth,
  // because the Gryphon cuts it off and sweeps the row away.
  const days = shell.layer('mt__days');
  const dayRow = document.createElement('div');
  dayRow.className = 'mt__day-row';
  dayRow.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const kind = i < 10 ? 'sun' : i === 10 ? 'holiday' : 'twelfth';
    const k = i < 10 ? Math.max(0.16, (10 - i) / 10) : 1;
    return `<div class="mt__day mt__day--${kind}" style="--k: ${k.toFixed(2)}"><div class="mt__day-sun"></div></div>`;
  }).join('');
  days.append(dayRow);
  const dayEls = [...dayRow.querySelectorAll<HTMLElement>('.mt__day')];
  master.fromTo(
    dayEls.slice(0, 10),
    { '--on': 0 },
    {
      '--on': 1,
      duration: quick(0.12),
      stagger: 0.05,
      ease: 'back.out(1.5)',
      immediateRender: false,
    },
    iHours + 0.25,
  );
  master.fromTo(
    dayEls[10] ?? days,
    { '--on': 0 },
    { '--on': 1, duration: quick(0.15), immediateRender: false },
    iHoliday + 0.2,
  );
  master.fromTo(
    dayEls[11] ?? days,
    { '--on': 0 },
    { '--on': 1, duration: quick(0.15), immediateRender: false },
    iHoliday + 0.7,
  );
  master.to(days, { '--off': 1, duration: quick(0.3), ease: 'power2.in' }, iGames + 0.05);
  // And the sun lessens with them: it goes down into the sea at the far side
  // before the first of the row comes up.
  master.to(day, { hour: 2, duration: quick(0.3), ease: 'power1.in', onUpdate: applyDay }, iHours);
  master.to(gryphon, { '--hop': 1, duration: quick(0.1), yoyo: true, repeat: 1 }, iGames + 0.05);

  // --- The join: the camera settles into the quadrille's opening composition,
  // the ledge goes, the two stand on the shingle where the quadrille finds them,
  // and the Mock Turtle draws breath for the sigh that opens it.
  camTo(iGames + 0.3, { settle: 1 }, quick(0.45));
  master.to(turtle, { '--breath': 1, duration: quick(0.18), ease: 'sine.in' }, iGames + 0.8);
  master.call(
    () => shell.root.toggleAttribute('data-settled', master.time() >= iGames + 0.75),
    [],
    iGames + 0.75,
  );

  // --- The pointer leans the shore and the school a little.
  let lean = 0;
  shell.onFrame((dt) => {
    const want =
      shell.pointer.active && (shell.pointer.fine || shell.pointer.tilt) ? shell.pointer.x : 0;
    lean = mix(lean, want, 1 - Math.exp(-dt * 3));
    shore.style.setProperty('--lean', lean.toFixed(3));
    schoolWorld.style.setProperty('--lean', lean.toFixed(3));
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
