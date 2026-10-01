/**
 * A Golden Afternoon: the concept demo.
 *
 * The bank in paper and sepia: the river slow at the bottom, a tree, her sister
 * reading under it and Alice beside her. The book is a real object with pages to
 * turn, and there is nothing in them. The heat shimmers and her eyes droop. Then
 * the White Rabbit runs past from right to left, stops for his watch, and the
 * camera runs after him across the field until the hedge comes up with the hole
 * under it: the frame the rabbit hole demo opens on.
 */

import gsap from 'gsap';
import { figure, svgFigure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import { BOOK_HTML, DAISY_SVG, WATCH_SVG } from './figures.ts';
import './riverbank.css';

const DAISIES = 10;
const CHAIN_MAX = 6;

function mount(shell: DemoShell): void {
  const { master, ambient, reducedMotion } = shell;
  const iGood = shell.cue('good');
  const iSleepy = shell.cue('sleepy');
  const iRabbit = shell.cue('rabbit');
  const iLate = shell.cue('late');
  const iWatch = shell.cue('watch');
  const iUp = shell.cue('up');
  const iField = shell.cue('field');
  const random = seeded(11);

  // --- Layers, back to front: sky, the bank with everyone on it, the river, the
  // field that slides in at the end, the Rabbit, the near grass, heat, a blink.
  const sky = shell.layer('rb__sky');
  sky.innerHTML = '<div class="rb__sun"></div>';
  const bank = shell.layer('rb__bank');
  const daisies = Array.from({ length: DAISIES }, (_, i) => {
    const x = 42 + ((i * 5.3) % 50) + random() * 4;
    const y = 47 + ((i * 7.1) % 14) + random() * 3;
    const s = 0.7 + random() * 0.5;
    return `<button type="button" class="rb__daisy" data-daisy="${i}" aria-label="${shell.ui.demoPickDaisy ?? ''}" style="--x: ${x.toFixed(1)}; --y: ${y.toFixed(1)}; --s: ${s.toFixed(2)}">${DAISY_SVG}</button>`;
  }).join('');
  bank.innerHTML =
    '<div class="rb__ground"></div>' +
    '<div class="rb__tree"></div>' +
    `<div class="rb__sister">${figure('alices-sister')}<button type="button" class="rb__book" aria-label="${shell.ui.demoTurnPage ?? ''}">${BOOK_HTML}</button></div>` +
    `<div class="rb__alice"><div class="rb__sitting">${figure('alice/sitting')}</div><div class="rb__standing"><svg viewBox="0 0 80 110" focusable="false">${svgFigure('alice/standing', 0, 0, 80, 110)}</svg></div>` +
    `<div class="rb__chain">${Array.from({ length: CHAIN_MAX }, (_, i) => `<span class="rb__link" style="--i: ${i}">${DAISY_SVG}</span>`).join('')}</div></div>` +
    `<div class="rb__daisies">${daisies}</div>`;
  shell.layer('rb__river');
  const field = shell.layer('rb__field');
  field.innerHTML =
    '<div class="rb__field-tree"></div><div class="rb__hedge"></div><div class="rb__hole"></div>';
  const runway = shell.layer('rb__runway');
  runway.innerHTML = `<div class="rb__rabbit">${figure('white-rabbit/running')}<button type="button" class="rb__watch" aria-label="${shell.ui.demoLookWatch ?? ''}">${WATCH_SVG}</button></div>`;
  shell.layer('rb__near');
  const heat = shell.layer('rb__heat');
  const flash = shell.layer('rb__flash');

  const book = bank.querySelector<HTMLButtonElement>('.rb__book');
  const leaf = bank.querySelector<HTMLElement>('.rb__leaf');
  const alice = bank.querySelector<HTMLElement>('.rb__alice');
  const chain = bank.querySelector<HTMLElement>('.rb__chain');
  const links = [...bank.querySelectorAll<HTMLElement>('.rb__link')];
  const daisyEls = [...bank.querySelectorAll<HTMLButtonElement>('.rb__daisy')];
  const rabbit = runway.querySelector<HTMLElement>('.rb__rabbit');
  const watch = runway.querySelector<HTMLButtonElement>('.rb__watch');
  const root = shell.root;

  // Under reduced motion the shell lands the scroll on whole beats, so a moment
  // inside a beat is moved to just before the nearest beat: a cut, complete by
  // the time the beat is shown. With motion on, moments stay where they are.
  const when = (at: number): number => (reducedMotion ? Math.round(at) - 0.03 : at);
  const dur = (seconds: number): number => (reducedMotion ? 0.01 : seconds);
  // A cut under reduced motion is a blink: paper over the frame, gone at once,
  // on crossing the moment in either direction.
  const blink = (at: number): void => {
    if (reducedMotion) {
      master.call(
        () => gsap.fromTo(flash, { opacity: 0.45 }, { opacity: 0, duration: 0.3 }),
        [],
        when(at),
      );
    }
  };
  const near = (at: number, width = 0.2): boolean => Math.abs(master.time() - at) < width;

  // --- The book: turn a page and find nothing in it. The story turns one itself
  // at "what is the good of a book like that".
  let pages = 0;
  let storyTurned = false;
  const turnPage = (byReader = true): void => {
    if (!book || !leaf) {
      return;
    }
    pages += 1;
    book.style.setProperty('--page', String(pages));
    book.dataset.page = String(pages);
    leaf.removeAttribute('data-turning');
    void leaf.offsetWidth;
    leaf.setAttribute('data-turning', '');
    shell.sound.play('paper', 0.6);
    if (byReader) {
      shell.status(shell.ui.demoTurnPage ?? '');
    }
  };
  leaf?.addEventListener('animationend', () => leaf.removeAttribute('data-turning'));
  const turnButton = shell.prop(shell.ui.demoTurnPage ?? '', 'rb__prop rb__prop--turn');
  turnButton.addEventListener('click', () => turnPage());
  book?.addEventListener('click', () => turnPage());
  const storyTurn = when(iGood + 0.35);
  master.call(
    () => {
      const past = master.time() >= storyTurn;
      if (past && !storyTurned) {
        storyTurned = true;
        turnPage(false);
      } else if (!past) {
        storyTurned = false;
      }
    },
    [],
    storyTurn,
  );

  // --- The daisies: pick them and they chain in her hand; at "too much work" the
  // chain falls out of it. Scrolling back lifts it again.
  let picked = 0;
  const pickButton = shell.prop(shell.ui.demoPickDaisy ?? '', 'rb__prop rb__prop--pick');
  const pick = (daisy?: HTMLButtonElement): void => {
    if (picked >= CHAIN_MAX || chain?.hasAttribute('data-dropped')) {
      return;
    }
    const target = daisy ?? daisyEls.find((candidate) => !candidate.hasAttribute('data-picked'));
    if (!target || target.hasAttribute('data-picked')) {
      return;
    }
    target.setAttribute('data-picked', '');
    picked += 1;
    shell.keep('daisy');
    chain?.style.setProperty('--chain', String(picked));
    chain?.setAttribute('data-chain', String(picked));
    links[picked - 1]?.setAttribute('data-shown', '');
    shell.sound.play('chime', 0.4);
    shell.status(shell.ui.demoPickDaisy ?? '');
  };
  pickButton.addEventListener('click', () => pick());
  for (const daisy of daisyEls) {
    daisy.addEventListener('click', () => pick(daisy));
  }
  const tooMuchWork = when(iSleepy + 0.75);
  const showPlay = (): void => {
    const playing = master.time() < tooMuchWork;
    if (playing) {
      turnButton.show();
      pickButton.show();
    } else {
      turnButton.hide();
      pickButton.hide();
    }
    bank.toggleAttribute('data-play', playing);
  };
  showPlay();
  master.call(
    () => {
      showPlay();
      chain?.toggleAttribute('data-dropped', master.time() >= tooMuchWork);
    },
    [],
    tooMuchWork,
  );
  if (alice) {
    // Her near arm reaches for a flower, and thinks better of it.
    if (!reducedMotion) {
      master.fromTo(
        alice,
        { '--reach': 0 },
        { '--reach': 1, duration: 0.3, ease: 'sine.inOut' },
        iSleepy + 0.2,
      );
      master.to(alice, { '--reach': 0, duration: 0.25, ease: 'sine.inOut' }, iSleepy + 0.6);
    }
    // The heat: her eyes droop through the beat, and open at the Rabbit.
    master.fromTo(
      alice,
      { '--droop': 0 },
      { '--droop': 1, duration: dur(0.8) },
      when(iSleepy + 0.1),
    );
    master.to(alice, { '--droop': 0, duration: dur(0.15) }, when(iRabbit + 0.05));
    // She jumps to her feet: a cut from sitting to standing.
    const jump = when(iUp + 0.12);
    master.call(() => alice.toggleAttribute('data-standing', master.time() >= jump), [], jump);
    blink(iUp + 0.12);
  }
  master.fromTo(heat, { '--heat': 0 }, { '--heat': 1, duration: iSleepy + 0.5 - iGood }, iGood);
  master.to(heat, { '--heat': 0.25, duration: 0.5 }, iRabbit);
  master.to(heat, { '--heat': 0, duration: 0.3 }, iField);

  // --- The Rabbit runs past from right to left, stops for the watch, hurries on.
  if (rabbit) {
    const run = (at: number, x: string, duration: number, ease = 'none'): void => {
      master.to(rabbit, { x, duration: dur(duration), ease }, when(at));
      blink(at);
    };
    const running = (from: number, to: number): void => {
      const fn = (): void => {
        rabbit.toggleAttribute('data-running', master.time() >= from && master.time() < to);
      };
      master.call(fn, [], from);
      master.call(fn, [], to);
    };
    master.set(rabbit, { x: '115vw', xPercent: -50 }, 0);
    running(iRabbit, iWatch);
    running(when(iUp + 0.3), when(iField + 0.8));
    run(iRabbit + 0.05, '72vw', 0.9, 'power1.out');
    run(iLate + 0.1, '64vw', 0.6, 'sine.inOut');
    master.call(
      () => (near(iRabbit + 0.1) ? shell.sound.play('whoosh', 0.5) : undefined),
      [],
      iRabbit + 0.1,
    );
    // The watch comes out of his pocket, and goes back.
    master.fromTo(
      rabbit,
      { '--watch': 0 },
      { '--watch': 1, duration: dur(0.25), ease: 'back.out(1.6)', immediateRender: false },
      when(iWatch + 0.1),
    );
    blink(iWatch + 0.1);
    master.to(
      rabbit,
      { '--watch': 0, duration: dur(0.15), ease: 'power2.in' },
      when(iWatch + 0.85),
    );
    master.call(
      () => (near(iWatch + 0.3) ? shell.sound.play('chime', 0.5) : undefined),
      [],
      iWatch + 0.3,
    );
    // Then on across the bank, and at the field the camera runs after him: he makes
    // for the hole under the hedge and is nose-down in it, tail out, at the end.
    run(iUp + 0.3, '18vw', 0.65, 'power1.in');
    master.to(
      rabbit,
      { x: '50vw', y: '6.4vh', scale: 0.35, duration: dur(0.75), ease: 'power1.inOut' },
      when(iField + 0.05),
    );
    master.to(
      rabbit,
      { rotation: -70, duration: dur(0.12), ease: 'power2.in' },
      when(iField + 0.8),
    );
    blink(iField + 0.8);
    master.call(
      () => (near(iField + 0.1) ? shell.sound.play('whoosh', 0.6) : undefined),
      [],
      iField + 0.1,
    );
  }

  // --- Look at the watch: its hands spin for a moment. Time himself.
  const watchButton = shell.prop(shell.ui.demoLookWatch ?? '', 'rb__prop rb__prop--watch');
  const watchOut = when(iWatch + 0.25);
  const watchAway = when(iWatch + 0.85);
  let spinTimer = 0;
  const lookAtWatch = (): void => {
    if (!watch || master.time() < watchOut || master.time() >= watchAway) {
      return;
    }
    watch.setAttribute('data-spinning', '');
    window.clearTimeout(spinTimer);
    spinTimer = window.setTimeout(
      () => watch.removeAttribute('data-spinning'),
      reducedMotion ? 900 : 1600,
    );
    shell.sound.play('chime', 0.7);
    shell.status(shell.ui.demoLookWatch ?? '');
  };
  watchButton.addEventListener('click', lookAtWatch);
  watch?.addEventListener('click', lookAtWatch);
  const showWatch = (): void => {
    const t = master.time();
    if (t >= watchOut && t < watchAway) {
      watchButton.show();
    } else {
      watchButton.hide();
    }
  };
  master.call(showWatch, [], watchOut);
  master.call(showWatch, [], watchAway);

  // --- The camera: it drifts after the Rabbit while he runs, then runs after him
  // across the field. The bank, the tree and the river slide away; the hedge
  // comes up with the hole under it, drawn to the rabbit hole demo's design.
  master.fromTo(
    root,
    { '--cam': 0 },
    { '--cam': 1, duration: iUp + 0.9 - iRabbit, ease: 'sine.inOut' },
    iRabbit,
  );
  const fieldShown = when(iField);
  master.call(
    () => field.toggleAttribute('data-shown', master.time() >= fieldShown),
    [],
    fieldShown,
  );
  master.fromTo(
    root,
    { '--pan': 0 },
    { '--pan': 1, duration: dur(0.75), ease: 'power2.inOut', immediateRender: false },
    when(iField + 0.05),
  );
  blink(iField + 0.05);
  const atHedge = when(iField + 0.82);
  master.call(() => root.toggleAttribute('data-at-hedge', master.time() >= atHedge), [], atHedge);
  const wind = (): void =>
    shell.sound.level(
      'wind',
      master.time() >= iField + 0.05 && master.time() < iField + 0.9 ? 0.3 : 0,
    );
  master.call(wind, [], iField + 0.05);
  master.call(wind, [], iField + 0.9);
  // The river and its birds, until the run across the field leaves them behind.
  const river = (): void => shell.sound.level('river', master.time() < iField + 0.3 ? 0.3 : 0);
  master.call(river, [], 0.01);
  master.call(river, [], iField + 0.3);
  river();

  // --- Ambient: her sister reads on, nodding over the book.
  const sisterArt = bank.querySelector<HTMLElement>('.rb__sister .art');
  if (sisterArt && !reducedMotion) {
    ambient.to(sisterArt, { y: 3, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  }

  // --- Every frame: the pointer leans the bank a little.
  let lean = 0;
  shell.onFrame((dt) => {
    const target = shell.pointer.active && !reducedMotion ? shell.pointer.x : 0;
    lean = mix(lean, target, 1 - Math.exp(-dt * 3));
    root.style.setProperty('--lean', lean.toFixed(3));
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
