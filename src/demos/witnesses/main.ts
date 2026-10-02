/**
 * Who Stole the Tarts?: the concept demo.
 *
 * The court of court.ts, the paper theatre the trial's end plays in, seen from
 * the moment the Lobster Quadrille's run arrives at its doors. The camera is
 * Alice's eyes: it looks round the court, then watches the witnesses from the
 * crowd, rises as she grows, and ends very high, looking down on the court with
 * her grown enormous in front, which is the frame the trial opens on.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, seeded } from '../shell/shell.ts';
import {
  buildCourt,
  buildPack,
  type CameraShot,
  HIGH_SHOT,
  mountAlice,
  mountCamera,
  mountJury,
  packSize,
} from '../trial/court.ts';
import {
  BAG_SVG,
  BREAD_SVG,
  LETTER_SVG,
  NOTEBOOK_SVG,
  PEPPER_BOX_SVG,
  SHOE_SVG,
  SPRAWLER_SVG,
  TEACUP_SVG,
} from './figures.ts';
import './witnesses.css';

/** Where the camera looks for each cue; each shot holds until the next. */
const SHOTS: Record<string, CameraShot> = {
  throne: { x: 0, z: 0 },
  knave: { x: -46, z: 120, ry: 6 },
  tarts: { x: 34, z: 260, ry: -5 },
  judge: { x: -9, z: 420, y: -6 },
  jury: { x: -92, z: 160, ry: 8 },
  herald: { x: 62, z: 220, ry: -8 },
  hatter: { x: 24, z: 280, ry: -4 },
  dates: { x: 2, z: 80 },
  hat: { x: 24, z: 340, ry: -4, y: -2 },
  grow: { x: 12, z: 60, y: -7, rx: -8 },
  twinkling: { x: 24, z: 320, y: -7, rx: -7 },
  knee: { x: 24, z: 180, y: -8, rx: -8 },
  suppress: { x: -26, z: 300, y: -6, rx: -6 },
  down: { x: 24, z: 160, y: -8, rx: -8 },
  shoes: { x: 44, z: 40, y: -8, rx: -8 },
  cook: { x: 24, z: 260, y: -8, rx: -8 },
  pepper: { x: 10, z: 20, y: -8, rx: -8 },
  collar: { x: -12, z: 120, y: -8, rx: -8 },
  called: { x: 62, z: 220, ry: -8, y: -8, rx: -8 },
  here: { x: -70, z: 40, ry: 6, y: -10, rx: -10 },
  pardon: { x: -88, z: 180, ry: 8, y: -10, rx: -10 },
  lizard: { x: -84, z: 340, ry: 8, y: -12, rx: -10 },
  nothing: { x: 12, z: 380, y: -12, rx: -12 },
  important: { x: -50, z: 160, y: -12, rx: -12 },
  rule: { x: 14, z: 160, y: -15, rx: -17 },
  mile: HIGH_SHOT,
};

/** The jury sitting as it did: the slate rects' coordinates, for the pennies. */
function addPennies(slates: SVGGElement[]): void {
  for (const slate of slates) {
    const rect = slate.querySelector('rect');
    if (!rect) {
      continue;
    }
    const x = Number(rect.getAttribute('x')) + 10;
    const y = Number(rect.getAttribute('y')) + 13;
    const penny = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    penny.setAttribute('class', 'wt__penny');
    penny.setAttribute('cx', String(x));
    penny.setAttribute('cy', String(y));
    penny.setAttribute('r', '4.5');
    slate.append(penny);
  }
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iJury = cue('jury');
  const iHerald = cue('herald');
  const iHatter = cue('hatter');
  const iDates = cue('dates');
  const iHat = cue('hat');
  const iGrow = cue('grow');
  const iTwinkling = cue('twinkling');
  const iKnee = cue('knee');
  const iSuppress = cue('suppress');
  const iDown = cue('down');
  const iShoes = cue('shoes');
  const iCook = cue('cook');
  const iPepper = cue('pepper');
  const iCollar = cue('collar');
  const iCalled = cue('called');
  const iHere = cue('here');
  const iPardon = cue('pardon');
  const iLizard = cue('lizard');
  const iNothing = cue('nothing');
  const iImportant = cue('important');
  const iRule = cue('rule');
  const iMile = cue('mile');
  const iOldest = cue('oldest');
  const iPaper = cue('paper');
  const iHandwriting = cue('handwriting');
  const iClever = cue('clever');
  const iRead = cue('read');
  const iVerses = cue('verses');
  const iMeaning = cue('meaning');
  const end = shell.beats.length;
  // Under reduced motion every move is a cut: a tween too short to see.
  const dur = (seconds: number): number => (reducedMotion ? 0.01 : seconds);

  // --- Layers, back to front.
  shell.layer('tr__sky');
  const world = shell.layer('tr__world');
  const court = document.createElement('div');
  court.className = 'tr__court';
  buildCourt(court);
  const head = document.createElement('div');
  head.className = 'tr__head';
  head.append(court);
  world.append(head);
  const piece = (className: string, inner: string): HTMLElement => {
    const el = document.createElement('div');
    el.className = `tr__piece ${className}`;
    el.innerHTML = inner;
    court.append(el);
    return el;
  };
  const pack = court.querySelector<HTMLElement>('.tr__pack');
  const cards = pack ? buildPack(pack, packSize()) : [];
  const near = shell.layer('wt__near');
  near.innerHTML = `<div class="wt__near-dormouse">${figure('dormouse')}</div>`;
  const nearDormouse = near.querySelector<HTMLElement>('.wt__near-dormouse');
  const pepper = shell.layer('wt__pepper');
  const specks = seeded(31);
  pepper.innerHTML = Array.from(
    { length: window.innerWidth < 720 ? 40 : 90 },
    () =>
      `<div class="wt__speck" style="--x: ${(specks() * 100).toFixed(1)}%; --y: ${(specks() * 100).toFixed(1)}%; --s: ${(0.6 + specks() * 1.4).toFixed(2)}; --d: ${(4 + specks() * 5).toFixed(2)}s; --i: ${(-specks() * 6).toFixed(2)}s"></div>`,
  ).join('');
  const alice = mountAlice(shell);
  const flash = shell.layer('tr__flash');
  const letterLayer = shell.layer('wt__letter');
  // The doors the run along the shore ended at, seen from inside as they open.
  const doors = shell.layer('tr__doors');
  doors.innerHTML =
    '<div class="tr__door-leaf tr__door-leaf--left"></div>' +
    '<div class="tr__door-leaf tr__door-leaf--right"></div>';

  // --- The camera, cue by cue. It starts a step behind the doorway, so the
  // throne shot is a walk in; from "a mile high" it holds the trial's own
  // opening frame.
  const camera = mountCamera(shell, world, court, { x: 0, z: -160 });
  for (const beat of shell.beats) {
    const shot = beat.cue ? SHOTS[beat.cue] : undefined;
    if (shot) {
      camera.to(shot, beat.index);
    }
  }
  // Within the dates, a glance across to the jury adding them up.
  camera.to({ x: -70, z: 120, ry: 6 }, iDates + 0.55, 0.4);
  master.call(() => court.toggleAttribute('data-high', master.time() >= iMile), [], iMile);
  // Her eyes: the court leans a little with the pointer, as a head does.
  const lean = { x: 0 };
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const target = shell.pointer.active ? shell.pointer.x : 0;
    const next = lean.x + (target - lean.x) * Math.min(1, dt * 4);
    if (Math.abs(next - lean.x) > 0.001) {
      lean.x = next;
      gsap.set(head, { xPercent: next * -1.5, rotation: next * -0.6 });
    }
  });

  // The leaves swing away from the slit the run ended on, and the frame is gone
  // by the next beat; under reduced motion they cross-fade instead of swinging.
  master.fromTo(
    doors,
    { '--open': 0.3 },
    { '--open': 1, duration: reducedMotion ? 0.3 : 0.7, ease: 'power2.in' },
    0,
  );
  master.to(doors, { opacity: 0, duration: 0.3 }, reducedMotion ? 0.3 : 0.55);

  // --- The jury write it all down, and each juror is a button that changes
  // what it wrote. They take the pointer while they sit in their box.
  const jury = mountJury(shell, court, { until: end, buttons: true });
  addPennies(jury.slates);
  const listening = (): void => {
    const t = master.time();
    jury.listen((t >= iJury && t < iHere) || t >= iLizard + 0.6);
  };
  for (const at of [iJury, iHere, iLizard + 0.6]) {
    master.call(listening, [], at);
  }
  master.call(
    () => jury.piece?.toggleAttribute('data-pennies', master.time() >= iDates + 0.75),
    [],
    iDates + 0.75,
  );

  // --- The herald's scroll unrolls to show the accusation.
  const heraldLines = shell.beats
    .slice(iHerald, iHerald + 3)
    .flatMap((beat) => beat.lines.filter((line) => line.dataset.speaker === 'white-rabbit'));
  for (const line of heraldLines) {
    master.fromTo(
      line,
      { '--unroll': 0 },
      { '--unroll': 1, duration: 0.3, ease: 'power1.out' },
      '<',
    );
  }
  const trumpet = (at: number): void => {
    master.call(
      () => {
        if (Math.abs(master.time() - at) < 0.3) {
          shell.sound.play('chime', 0.4);
        }
      },
      [],
      at,
    );
  };
  trumpet(iHerald + 0.3);
  trumpet(iHatter + 0.15);

  // --- The crowd: a stir runs through it when everybody claps or sneezes.
  const stir = seeded(17);
  const commotion = (share: number): void => {
    for (const card of cards) {
      if (stir() < share) {
        card.el.removeAttribute('data-leap');
        void card.el.offsetWidth;
        card.el.setAttribute('data-leap', '');
      }
    }
  };
  const shake = (): void => {
    if (!reducedMotion) {
      shell.root.removeAttribute('data-shake');
      void shell.root.offsetWidth;
      shell.root.setAttribute('data-shake', '');
    }
  };
  const moment = (at: number, fn: () => void): void => {
    master.call(
      () => {
        if (master.time() >= at && Math.abs(master.time() - at) < 0.3) {
          fn();
        }
      },
      [],
      at,
    );
  };

  // --- The Hatter, in the witness-box with his teacup and bread-and-butter.
  const hatter = piece(
    'wt__hatter',
    `${figure('hatter')}<div class="wt__teacup">${TEACUP_SVG}</div><div class="wt__bread">${BREAD_SVG}</div>` +
      `<div class="wt__twinkles">${'<i class="wt__twinkle"></i>'.repeat(4)}</div>`,
  );
  const hatterArt = hatter.querySelector<HTMLElement>('.art');
  const hat = hatter.querySelector<SVGGElement>('.hatter__hat');
  const teacup = hatter.querySelector<HTMLElement>('.wt__teacup');
  const bread = hatter.querySelector<HTMLElement>('.wt__bread');
  const shoeLeft = piece('wt__shoe wt__shoe--left', SHOE_SVG);
  const shoeRight = piece('wt__shoe wt__shoe--right', SHOE_SVG);
  master.fromTo(
    hatter,
    { '--x': 110, opacity: 1 },
    { '--x': 24, duration: dur(0.5), ease: 'power1.out', immediateRender: false },
    iHatter + 0.1,
  );
  master.fromTo(
    [shoeLeft, shoeRight],
    { opacity: 0 },
    { opacity: 1, duration: dur(0.2), immediateRender: false },
    iHatter + 0.5,
  );
  // He trembles from the first question, harder as the twinkling goes wrong, and
  // his shoes shake off his feet while he does.
  const trembling = (): void => {
    const t = master.time();
    const level = t < iDates ? '' : t < iTwinkling ? 'some' : t < iShoes ? 'hard' : '';
    hatter.setAttribute('data-trembling', level);
    hatter.toggleAttribute('data-trembling', level !== '');
    for (const shoe of [shoeLeft, shoeRight]) {
      shoe.toggleAttribute('data-shaking', t >= iDates && t < iKnee + 0.2);
    }
  };
  for (const at of [iDates, iTwinkling, iKnee + 0.2, iShoes]) {
    master.call(trembling, [], at);
  }
  master.fromTo(
    shoeLeft,
    { '--x': 18, '--r': 0 },
    { '--x': 12, '--r': -70, duration: dur(0.3), ease: 'bounce.out', immediateRender: false },
    iKnee + 0.2,
  );
  master.fromTo(
    shoeRight,
    { '--x': 30, '--r': 0 },
    { '--x': 37, '--r': 40, duration: dur(0.3), ease: 'bounce.out', immediateRender: false },
    iKnee + 0.25,
  );
  // "Take off your hat": it lifts, and settles back; it is not his to take off.
  if (hat) {
    master.fromTo(
      hat,
      { y: 0 },
      { y: -9, duration: dur(0.2), ease: 'power2.out', immediateRender: false },
      iHat + 0.15,
    );
    master.to(hat, { y: 0, duration: dur(0.3), ease: 'bounce.out' }, iHat + 0.6);
  }
  // The bread-and-butter gets thin; the tea twinkles, then the cup drops.
  if (bread) {
    master.fromTo(
      bread,
      { '--thin': 0 },
      { '--thin': 1, duration: dur(0.6), ease: 'none', immediateRender: false },
      iTwinkling + 0.1,
    );
  }
  master.call(
    () =>
      hatter.toggleAttribute(
        'data-twinkling',
        master.time() >= iTwinkling + 0.2 && master.time() < iKnee,
      ),
    [],
    iTwinkling + 0.2,
  );
  master.call(
    () =>
      hatter.toggleAttribute(
        'data-twinkling',
        master.time() >= iTwinkling + 0.2 && master.time() < iKnee,
      ),
    [],
    iKnee,
  );
  if (teacup) {
    master.fromTo(
      teacup,
      { y: 0, rotation: 0, opacity: 1 },
      {
        y: '28vh',
        rotation: 140,
        duration: dur(0.25),
        ease: 'power2.in',
        immediateRender: false,
      },
      iKnee + 0.1,
    );
    master.to(teacup, { opacity: 0, duration: dur(0.05) }, iKnee + 0.34);
    moment(iKnee + 0.34, () => shell.sound.play('glass', 0.5));
  }
  if (hatterArt) {
    master.fromTo(
      hatterArt,
      { y: '0%', rotation: 0 },
      { y: '12%', rotation: 4, duration: dur(0.25), ease: 'power2.out', immediateRender: false },
      iKnee + 0.15,
    );
    master.to(hatterArt, { y: '18%', duration: dur(0.2) }, iDown + 0.2);
  }
  // He hurries out without his shoes; the Queen has a word for outside.
  master.to(hatter, { '--x': 120, duration: dur(0.5), ease: 'power1.in' }, iShoes + 0.1);
  master.fromTo(
    flash,
    { opacity: 0 },
    { opacity: 0.45, duration: dur(0.08), immediateRender: false },
    iShoes + 0.62,
  );
  master.to(flash, { opacity: 0, duration: dur(0.3) }, iShoes + 0.72);
  moment(iShoes + 0.62, () => shell.sound.play('thud', 0.4));

  // --- The March Hare and the Dormouse, in the crowd, calling dates.
  const hare = piece('wt__hare', figure('march-hare'));
  const dormouse = piece('wt__dormouse', figure('dormouse'));
  master.fromTo(
    hare,
    { opacity: 0, '--pop': 1 },
    { opacity: 1, '--pop': 0, duration: dur(0.2), ease: 'back.out(2)', immediateRender: false },
    iDates + 0.3,
  );
  master.fromTo(
    dormouse,
    { opacity: 0, '--pop': 1 },
    { opacity: 1, '--pop': 0, duration: dur(0.2), ease: 'back.out(2)', immediateRender: false },
    iDates + 0.42,
  );
  master.call(
    () => dormouse.toggleAttribute('data-collared', master.time() >= iCollar + 0.3),
    [],
    iCollar + 0.3,
  );

  // --- Alice grows again, from her place in the crowd: the camera rises, and the
  // Dormouse beside her is squeezed toward the edge of the frame.
  if (nearDormouse) {
    master.fromTo(
      nearDormouse,
      { opacity: 0, scaleX: 1, x: '0%' },
      { opacity: 1, duration: dur(0.2), immediateRender: false },
      iGrow + 0.05,
    );
    master.to(
      nearDormouse,
      { scaleX: 0.55, x: '-30%', duration: dur(0.6), ease: 'power2.inOut' },
      iGrow + 0.25,
    );
    // "Collar that Dormouse!": it is taken out of court in the confusion.
    master.to(
      nearDormouse,
      { x: '-120%', rotation: -40, opacity: 0, duration: dur(0.4), ease: 'power2.in' },
      iCollar + 0.3,
    );
  }
  moment(iCollar + 0.3, () => {
    shake();
    commotion(0.5);
    shell.sound.play('thud', 0.5);
  });

  // --- A guinea-pig cheers, and is suppressed: into the officers' canvas bag,
  // head first, and sat upon. The story does it over the beat; the reader may do
  // it first, by tapping the cheering guinea-pig or pressing the button.
  const pigs = [0, 1, 2].map((i) => piece(`wt__pig wt__pig--${i}`, figure('guinea-pig')));
  const cheerer = pigs[1];
  piece('wt__bag', BAG_SVG);
  for (const i of [0, 1]) {
    piece(`wt__officer wt__officer--${i}`, figure('card-soldier'));
  }
  // Two objects: the story's is scrubbed by the master, the reader's is ad hoc.
  const story = { suppressed: 0 };
  const play = { suppressed: 0 };
  const holdButton = document.createElement('button');
  holdButton.type = 'button';
  holdButton.className = 'wt__pig-button';
  holdButton.setAttribute('aria-label', shell.ui.demoSuppressGuineaPig ?? '');
  cheerer?.append(holdButton);
  const holdProp = shell.prop(shell.ui.demoSuppressGuineaPig ?? '', 'wt__prop-hold');
  const applySuppression = (): void => {
    const v = Math.max(story.suppressed, play.suppressed);
    const t = master.time();
    const cheering = t >= iSuppress + 0.1 && v < 0.3;
    // The bag, the guinea-pig and the officers all read how far it has gone.
    court.style.setProperty('--in', v.toFixed(3));
    cheerer?.toggleAttribute('data-cheering', cheering);
    cheerer?.toggleAttribute('data-suppressed', v >= 0.95);
    if (cheering) {
      holdProp.show();
    } else {
      holdProp.hide();
    }
  };
  master.fromTo(
    story,
    { suppressed: 0 },
    {
      suppressed: 1,
      duration: dur(0.5),
      ease: 'power1.inOut',
      immediateRender: false,
      onUpdate: applySuppression,
    },
    iSuppress + 0.4,
  );
  master.call(
    () => {
      if (master.time() < iSuppress + 0.1) {
        // Scrolled back before the cheer: the reader's own suppression is undone.
        gsap.killTweensOf(play);
        play.suppressed = 0;
      } else if (Math.abs(master.time() - (iSuppress + 0.1)) < 0.3) {
        shell.sound.play('chime', 0.5);
      }
      applySuppression();
    },
    [],
    iSuppress + 0.1,
  );
  master.call(applySuppression, [], iSuppress + 0.9);
  moment(iSuppress + 0.85, () => shell.sound.play('thud', 0.4));
  const suppress = (): void => {
    const t = master.time();
    if (t < iSuppress + 0.1 || Math.max(story.suppressed, play.suppressed) >= 0.3) {
      return;
    }
    shell.status(shell.ui.demoSuppressGuineaPig ?? '');
    gsap.to(play, {
      suppressed: 1,
      duration: dur(0.6),
      ease: 'power1.inOut',
      onUpdate: applySuppression,
      onComplete: () => {
        applySuppression();
        shell.sound.play('thud', 0.4);
      },
    });
  };
  holdButton.addEventListener('click', suppress);
  holdProp.addEventListener('click', suppress);
  applySuppression();

  // --- The cook, with the pepper-box; the people near the door sneeze.
  const cook = piece(
    'wt__cook',
    `${figure('cook')}<div class="wt__pepper-box">${PEPPER_BOX_SVG}</div>`,
  );
  master.fromTo(
    cook,
    { '--x': 110, opacity: 1 },
    { '--x': 24, duration: dur(0.5), ease: 'power1.out', immediateRender: false },
    iCook + 0.1,
  );
  const sneezing = (): void => {
    const on = master.time() >= iPepper + 0.1 && master.time() < iCollar + 0.6;
    court.toggleAttribute('data-sneezing', on);
    pepper.toggleAttribute('data-shown', on);
    cook.toggleAttribute('data-shaking', on);
  };
  master.call(sneezing, [], iPepper + 0.1);
  master.call(sneezing, [], iCollar + 0.6);
  moment(iPepper + 0.1, () => shell.sound.play('whoosh', 0.4));
  // By the time they had settled down again, the cook had disappeared.
  master.to(cook, { opacity: 0, duration: dur(0.2) }, iCollar + 0.75);

  // --- "Alice!": the White Rabbit fumbles over the list, then reads out the name.
  const herald = court.querySelector<HTMLElement>('.tr__herald');
  master.call(
    () =>
      herald?.toggleAttribute(
        'data-fumbling',
        master.time() >= iCalled + 0.2 && master.time() < iCalled + 0.75,
      ),
    [],
    iCalled + 0.2,
  );
  master.call(
    () =>
      herald?.toggleAttribute(
        'data-fumbling',
        master.time() >= iCalled + 0.2 && master.time() < iCalled + 0.75,
      ),
    [],
    iCalled + 0.75,
  );
  moment(iCalled + 0.75, () => shell.sound.play('chime', 0.6));

  // --- "Here!": she jumps up, forgetting how large she has grown, and tips over
  // the jury-box with her skirt; the jurymen go sprawling on the crowd below.
  if (alice) {
    master.fromTo(
      alice,
      { y: '40%', opacity: 0, scale: 1.1 },
      {
        y: '0%',
        opacity: 1,
        scale: 1.6,
        duration: dur(0.3),
        ease: 'power2.out',
        immediateRender: false,
      },
      iHere + 0.1,
    );
    // Nearly two miles high.
    master.to(alice, { scale: 2.6, duration: dur(0.8), ease: 'power2.inOut' }, iMile + 0.1);
  }
  const juryPiece = jury.piece;
  if (juryPiece) {
    master.fromTo(
      juryPiece,
      { '--tip': 0 },
      { '--tip': 1, duration: dur(0.3), ease: 'power2.in', immediateRender: false },
      iHere + 0.3,
    );
    master.to(juryPiece, { '--tip': 0, duration: dur(0.4), ease: 'power2.out' }, iPardon + 0.2);
  }
  moment(iHere + 0.55, () => {
    shell.sound.play('thud', 0.6);
    shake();
  });
  const scatter = seeded(5);
  const sprawlers = Array.from({ length: 7 }, (_, i) => {
    const el = piece(`wt__sprawler wt__sprawler--${i}`, SPRAWLER_SVG);
    el.style.setProperty('--x', String(-82 + i * 2));
    return el;
  });
  for (const [i, sprawler] of sprawlers.entries()) {
    const away = {
      '--sx': (-96 + scatter() * 44).toFixed(1),
      '--sy': (14 + scatter() * 18).toFixed(1),
      '--sr': ((scatter() - 0.5) * 300).toFixed(0),
    };
    master.fromTo(
      sprawler,
      { opacity: 0, '--sx': 0, '--sy': 0, '--sr': 0 },
      { opacity: 1, duration: dur(0.05), immediateRender: false },
      iHere + 0.35 + i * 0.02,
    );
    master.to(
      sprawler,
      { ...away, duration: dur(0.35), ease: 'power1.out', immediateRender: false },
      iHere + 0.37 + i * 0.02,
    );
    // Picked up and put back, as quickly as she could.
    master.to(
      sprawler,
      { '--sx': 0, '--sy': 0, '--sr': 0, duration: dur(0.3), ease: 'power2.in' },
      iPardon + 0.1 + i * 0.03,
    );
    master.to(sprawler, { opacity: 0, duration: dur(0.05) }, iPardon + 0.4 + i * 0.03);
  }

  // --- The Lizard, put in head downwards, waving its tail. The story turns him
  // the right way up; the reader may tap him, or press the button, first.
  const lizard = piece('wt__lizard', `${figure('bill')}`);
  const lizardButton = document.createElement('button');
  lizardButton.type = 'button';
  lizardButton.className = 'wt__lizard-button';
  lizardButton.setAttribute('aria-label', shell.ui.demoRightLizard ?? '');
  lizard.append(lizardButton);
  const putBackProp = shell.prop(shell.ui.demoRightLizard ?? '', 'wt__prop-put-back');
  const righting = { story: false, play: false };
  const applyLizard = (): void => {
    const t = master.time();
    const shown = t >= iPardon + 0.45 && t < iRule + 0.3;
    const right = righting.story || righting.play;
    lizard.toggleAttribute('data-shown', shown);
    lizard.toggleAttribute('data-upside-down', shown && !right);
    lizard.toggleAttribute('data-right', shown && right);
    if (shown && !right) {
      putBackProp.show();
    } else {
      putBackProp.hide();
    }
  };
  const lizardAt = (at: number, fn?: () => void): void => {
    master.call(
      () => {
        fn?.();
        applyLizard();
      },
      [],
      at,
    );
  };
  lizardAt(iPardon + 0.45, () => {
    if (master.time() < iPardon + 0.45) {
      righting.play = false;
    }
  });
  lizardAt(iLizard + 0.55, () => {
    righting.story = master.time() >= iLizard + 0.55;
  });
  lizardAt(iRule + 0.3);
  const putRight = (): void => {
    if (!lizard.hasAttribute('data-upside-down')) {
      return;
    }
    righting.play = true;
    shell.status(shell.ui.demoRightLizard ?? '');
    shell.sound.play('paper', 0.4);
    applyLizard();
  };
  lizardButton.addEventListener('click', putRight);
  putBackProp.addEventListener('click', putRight);
  applyLizard();

  // --- Nothing whatever: the King writes both words in his note-book, and the
  // jury write it down important or unimportant, as each of them thinks.
  const king = court.querySelector<HTMLElement>('.tr__throne--king');
  const notebook = document.createElement('div');
  notebook.className = 'wt__notebook';
  notebook.innerHTML = NOTEBOOK_SVG;
  king?.append(notebook);
  master.fromTo(
    notebook,
    { opacity: 0, '--word-one': 0, '--word-two': 0, '--shut': 0, scale: 1 },
    { opacity: 1, duration: dur(0.2), immediateRender: false },
    iNothing + 0.1,
  );
  master.to(notebook, { '--word-one': 1, duration: dur(0.3), ease: 'none' }, iNothing + 0.6);
  master.to(notebook, { '--word-two': 1, duration: dur(0.3), ease: 'none' }, iImportant + 0.15);
  moment(iImportant + 0.5, () => jury.write());
  // Rule Forty-two: "Silence!", the book held up; then shut hastily.
  master.fromTo(
    flash,
    { opacity: 0 },
    { opacity: 0.5, duration: dur(0.06), immediateRender: false },
    iRule + 0.12,
  );
  master.to(flash, { opacity: 0, duration: dur(0.3) }, iRule + 0.2);
  moment(iRule + 0.12, () => shell.sound.play('thud', 0.5));
  master.to(notebook, { scale: 1.5, duration: dur(0.25), ease: 'power2.out' }, iRule + 0.1);
  master.to(
    notebook,
    { '--shut': 1, scale: 1, duration: dur(0.2), ease: 'power2.in' },
    iOldest + 0.55,
  );
  master.to(notebook, { opacity: 0, duration: dur(0.2) }, iPaper + 0.1);

  // --- The letter: the White Rabbit unfolds a paper into the frame, handwriting
  // as lines of scribble; it is a set of verses, read out as four couplets.
  const sheet = document.createElement('div');
  sheet.className = 'wt__sheet';
  // Three panels, each a third of the sheet, each folded inside the one before.
  const third = (k: number, inner: string): string =>
    `<div class="wt__panel wt__panel--${k}"><div class="wt__page" style="--k: ${k}">${LETTER_SVG}</div>${inner}</div>`;
  sheet.innerHTML = third(0, third(1, third(2, '')));
  letterLayer.append(sheet);
  master.fromTo(
    sheet,
    { opacity: 0, y: '70vh', '--unfold': 0, scale: 1 },
    { opacity: 1, y: '0vh', duration: dur(0.3), ease: 'power2.out', immediateRender: false },
    iPaper + 0.2,
  );
  master.to(sheet, { '--unfold': 1, duration: dur(0.4), ease: 'power1.inOut' }, iPaper + 0.6);
  moment(iPaper + 0.6, () => shell.sound.play('paper', 0.5));
  master.call(
    () => sheet.toggleAttribute('data-imitated', master.time() >= iHandwriting + 0.3),
    [],
    iHandwriting + 0.3,
  );
  moment(iClever + 0.25, () => {
    commotion(0.6);
    shell.sound.play('chime', 0.4);
  });
  master.to(sheet, { scale: 1.12, duration: dur(0.3), ease: 'power1.out' }, iRead + 0.2);
  // Each couplet is read in its turn; all copies of the sheet's panels read along.
  const allVerses = [...sheet.querySelectorAll<SVGGElement>('.wt__verse')];
  for (const n of [0, 1, 2, 3]) {
    const at = iVerses + 0.1 + n * 0.2;
    master.call(
      () => {
        for (const verse of allVerses) {
          if (Number(verse.style.getPropertyValue('--n')) === n) {
            verse.toggleAttribute('data-read', master.time() >= at);
          }
        }
      },
      [],
      at,
    );
  }
  // No meaning in it: the sheet goes down, and the court is as the trial finds
  // it, with Alice enormous in front.
  master.to(
    sheet,
    { y: '70vh', opacity: 0, scale: 1, duration: dur(0.3), ease: 'power2.in' },
    iMeaning + 0.3,
  );

  // The court's crowd, all through.
  const crowd = (): void => shell.sound.level('murmur', 0.3);
  master.call(crowd, [], 0.01);
  crowd();
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
