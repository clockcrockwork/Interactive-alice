/**
 * Advice from a Caterpillar: the concept demo.
 *
 * Alice is three inches high, so the meadow is a forest of grass and the
 * mushroom a hill with the Caterpillar on top. Her height is the one number the
 * whole demo hangs off: the meadow scales about the ground under her feet, and
 * past the tree tops it gives way to a sky, a sea of leaves far below, and her own
 * neck running down into them like a stalk, bending wherever the pointer goes.
 * The Caterpillar's words arrive as smoke; the two bits of mushroom are in her
 * hands, and nibbling either changes her size; the Pigeon comes for her face.
 */

import gsap from 'gsap';
import { figure, svgFigure } from '../art/art.ts';
import {
  attachDemo,
  type Beat,
  captionEntry,
  type DemoShell,
  mix,
  seeded,
} from '../shell/shell.ts';
import './caterpillar.css';
import { ASK_SVG, LEFT_BIT_SVG, RIGHT_BIT_SVG } from './figures.ts';
import { INCHES, onNotch, reading, THREE } from './measure.ts';

/** Her height in inches: three on the mushroom (THREE, in measure.ts), one with her
 * chin on her foot, a few hundred above the trees, and thirty-six is her usual height. */
const CHIN_ON_FOOT = 1;
const ABOVE_THE_TREES = 320;
const USUAL = 36;
/** Where the meadow gives way to the tree tops, in inches. */
const TREE_LINE_LOW = 40;
const TREE_LINE_HIGH = 140;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The Caterpillar's lines arrive as smoke: blurred, rising, clearing. */
function smokeCaption(
  beat: Beat,
  master: gsap.core.Timeline,
  reduced: boolean,
  last: boolean,
): boolean {
  if (!beat.lines.some((line) => line.dataset.speaker === 'caterpillar')) {
    return false;
  }
  const t = beat.index;
  const entry = captionEntry(reduced, t);
  master.fromTo(
    beat.lines,
    { opacity: 0, y: reduced ? 0 : 26, '--blur': reduced ? 0 : 10 },
    {
      opacity: 1,
      y: 0,
      '--blur': 0,
      duration: reduced ? entry.duration : 0.34,
      stagger: reduced ? 0 : 0.1,
    },
    entry.at,
  );
  if (!last) {
    master.to(beat.lines, { opacity: 0, y: reduced ? 0 : -20, duration: 0.14 }, t + 0.84);
  }
  return true;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iWho = cue('who');
  const iExplain = cue('explain');
  const iPuff = cue('puff');
  const iTemper = cue('temper');
  const iSize = cue('size');
  const iRear = cue('rear');
  const iCrawl = cue('crawl');
  const iOfWhat = cue('of-what');
  const iSides = cue('sides');
  const iShrink = cue('shrink');
  const iGrow = cue('grow');
  const iFree = cue('free');
  const iNeck = cue('neck');
  const iBend = cue('bend');
  const iPigeon = cue('pigeon');
  const iTried = cue('tried');
  const iGirl = cue('girl');
  const iOff = cue('off');
  const iBack = cue('back');
  // Up she goes after the other bit. Under reduced motion the grow beat rests on
  // her chin on her foot, and the cut above the trees comes with the next beat.
  const shootUp = reducedMotion ? iGrow + 0.95 : iGrow + 0.6;
  const unfold = reducedMotion ? iGrow + 0.95 : iGrow + 0.3;
  const lite = matchMedia('(max-width: 700px)').matches;
  const random = seeded(5);

  // --- The sky, then the meadow: layers that scale about the ground under her feet.
  const sky = shell.layer('ct__sky');
  const meadow = shell.layer('ct__meadow');
  const blades = (count: number, className: string): string =>
    Array.from(
      { length: count },
      () =>
        `<div class="ct__blade ${className}" style="--x: ${(random() * 100).toFixed(1)}%; --h: ${(40 + random() * 60).toFixed(0)}; --lean: ${((random() - 0.5) * 16).toFixed(1)}; --hue: ${(120 + random() * 30).toFixed(0)}"></div>`,
    ).join('');
  sky.innerHTML = '<div class="ct__ground"></div>';
  meadow.innerHTML =
    `<div class="ct__grass ct__grass--far">${blades(lite ? 14 : 26, 'ct__blade--far')}</div>` +
    `<div class="ct__mushroom">${figure('mushroom')}<div class="ct__caterpillar">${figure('caterpillar')}</div></div>` +
    // The Caterpillar again, up out of the grass to nod when she lands on three.
    `<div class="ct__peek"><div class="ct__peek-cat">${figure('caterpillar')}</div></div>` +
    `<div class="ct__grass ct__grass--near">${blades(lite ? 8 : 14, 'ct__blade--near')}</div>`;
  const mushroom = meadow.querySelector<HTMLElement>('.ct__mushroom');
  const caterpillar = meadow.querySelector<HTMLElement>('.ct__caterpillar');
  // Its head is a group of its own; the body breathes by a CSS animation.
  const catHead = caterpillar?.querySelector<SVGGElement>('.ct__head') ?? caterpillar;
  const peek = meadow.querySelector<HTMLElement>('.ct__peek');

  // --- Above the trees: a sea of leaves far below and her neck running down into it.
  const treetops = shell.layer('ct__treetops');
  const leaves = Array.from({ length: lite ? 90 : 170 }, (_, i) => {
    const band = i % 3;
    return `<ellipse class="ct__leaf" data-band="${band}" cx="${(random() * 1200 - 100).toFixed(0)}" cy="${(380 + random() * 700).toFixed(0)}" rx="${(22 + random() * 46).toFixed(0)}" ry="${(10 + random() * 22).toFixed(0)}" style="--hue: ${(118 + random() * 36).toFixed(0)}; --l: ${(30 + band * 10 + random() * 8).toFixed(0)}%"/>`;
  }).join('');
  treetops.innerHTML =
    '<svg class="ct__canopy" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    `<g class="ct__leaves ct__leaves--0">${leaves}</g>` +
    '<ellipse class="ct__nest" cx="240" cy="820" rx="70" ry="26"/>' +
    `<g class="ct__shoulders">${svgFigure('alice/from-above', -46, -46, 92, 92)}</g>` +
    '<path class="ct__neck ct__neck--shade" d=""/>' +
    '<path class="ct__neck" d=""/>' +
    '</svg>';
  const canopy = treetops.querySelector<SVGSVGElement>('.ct__canopy');
  const neckPaths = [...treetops.querySelectorAll<SVGPathElement>('.ct__neck')];
  // The neck is a tapered ribbon along a curve: wide where it leaves the bottom
  // of the frame (nearest the eye) and narrow at the shoulders far below.
  const neckPath = (bx: number, by: number, cx: number, cy: number, wide: number): string => {
    const left: string[] = [];
    const right: string[] = [];
    const steps = 18;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const u = 1 - t;
      const x = u * u * bx + 2 * u * t * cx + t * t * 500;
      const y = u * u * by + 2 * u * t * cy + t * t * 1140;
      const dx = 2 * u * (cx - bx) + 2 * t * (500 - cx);
      const dy = 2 * u * (cy - by) + 2 * t * (1140 - cy);
      const length = Math.hypot(dx, dy) || 1;
      const w = mix(22, wide, t * t);
      const nx = (-dy / length) * w;
      const ny = (dx / length) * w;
      left.push(`${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}`);
      right.unshift(`${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}`);
    }
    return `M${left.join(' L')} L${right.join(' L')} Z`;
  };
  const shoulders = treetops.querySelector<SVGGElement>('.ct__shoulders');
  const leafGroup = treetops.querySelector<SVGGElement>('.ct__leaves');

  // --- Smoke: rings that leave the hookah and drift up toward the reader. A
  // ring's strength (0..1) sets its size, its pace and how long it lasts: the
  // story's own puffs are small; the reader's grow with how long the puff is held.
  const smoke = shell.layer('ct__smoke');
  smoke.style.setProperty('--strength', '0');
  const ember = document.createElement('span');
  ember.className = 'ct__ember';
  caterpillar?.append(ember);
  const puff = (strength = 0.15): void => {
    const s = Math.max(0, Math.min(1, strength));
    const ring = document.createElement('div');
    // While it asks her to explain herself, its smoke comes out as questions.
    const asking = master.time() >= iExplain && master.time() < iExplain + 1;
    ring.className = asking ? 'ct__ring ct__ring--ask' : 'ct__ring';
    ring.innerHTML = `<span class="ct__ring-body">${asking ? ASK_SVG : ''}</span>`;
    const stage = shell.stage.getBoundingClientRect();
    const head = caterpillar?.getBoundingClientRect();
    if (head) {
      ring.style.setProperty('--rx', (head.left + head.width * 0.98 - stage.left).toFixed(0));
      ring.style.setProperty('--ry', (head.top + head.height * 0.5 - stage.top).toFixed(0));
    }
    const seconds = 4 + s * 4;
    ring.style.setProperty('--drift', ((random() - 0.5) * 30 * (1 - s * 0.6)).toFixed(1));
    ring.style.setProperty('--size', (6 + s * 9 + random() * 2).toFixed(1));
    ring.style.setProperty('--strength', s.toFixed(3));
    ring.style.setProperty('--seconds', seconds.toFixed(2));
    smoke.style.setProperty('--strength', s.toFixed(3));
    smoke.append(ring);
    if (reducedMotion) {
      ring.dataset.still = '';
    }
    setTimeout(() => ring.remove(), seconds * 1000 + 200);
  };

  // --- The strength of a puff: holding the button (or the Caterpillar) charges
  // it for up to a second and a half; the hookah glows and the body swells.
  const HOLD_MS = 1500;
  const charge = { v: 0 };
  const applyCharge = (): void => {
    caterpillar?.style.setProperty('--charge', charge.v.toFixed(3));
  };
  let heldSince: number | undefined;
  let chargeTween: gsap.core.Tween | undefined;
  const beginCharge = (): void => {
    if (heldSince !== undefined) {
      return;
    }
    heldSince = performance.now();
    chargeTween?.kill();
    if (reducedMotion) {
      charge.v = 1;
      applyCharge();
      return;
    }
    chargeTween = gsap.to(charge, {
      v: 1,
      duration: HOLD_MS / 1000,
      ease: 'none',
      onUpdate: applyCharge,
    });
  };
  const endCharge = (blow: boolean): void => {
    if (heldSince === undefined) {
      return;
    }
    const held = performance.now() - heldSince;
    heldSince = undefined;
    chargeTween?.kill();
    if (reducedMotion) {
      charge.v = 0;
      applyCharge();
    } else {
      chargeTween = gsap.to(charge, { v: 0, duration: 0.25, onUpdate: applyCharge });
    }
    if (!blow) {
      return;
    }
    const strength = Math.min(1, held / HOLD_MS);
    puff(strength);
    shell.sound.play('whoosh', 0.3 + strength * 0.7);
  };
  const holdable = (el: HTMLElement): void => {
    el.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      el.setPointerCapture(event.pointerId);
      beginCharge();
    });
    el.addEventListener('pointerup', () => endCharge(true));
    el.addEventListener('pointercancel', () => endCharge(false));
    el.addEventListener('contextmenu', (event) => event.preventDefault());
    // Keyboard: Space or Enter held charges the same way; a repeat is not a new press.
    el.addEventListener('keydown', (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      if (!event.repeat) {
        beginCharge();
      }
    });
    el.addEventListener('keyup', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        endCharge(true);
      }
    });
    el.addEventListener('blur', () => endCharge(false));
    // A click with no press behind it (assistive technology): a tap.
    el.addEventListener('click', (event) => {
      if (event.detail === 0 && heldSince === undefined) {
        puff(0);
        shell.sound.play('whoosh', 0.3);
      }
    });
  };
  const puffButton = shell.prop(shell.ui.demoPuff ?? '', 'ct__prop ct__prop--puff');
  holdable(puffButton);
  if (caterpillar) {
    holdable(caterpillar);
  }
  puffButton.show();
  shell.status(shell.ui.demoPuffHold ?? '');
  // The story's own puffs: one per line the Caterpillar says, while it is on the mushroom.
  for (const beat of shell.spokenBy('caterpillar')) {
    if (beat.index > iCrawl) {
      continue;
    }
    beat.lines.forEach((line, n) => {
      if (line.dataset.speaker === 'caterpillar') {
        master.call(
          () =>
            Math.abs(master.time() - (beat.index + 0.05 + n * 0.1)) < 0.2 ? puff() : undefined,
          [],
          beat.index + 0.05 + n * 0.1,
        );
      }
    });
  }
  // At "for some minutes it puffed away", it puffs away.
  master.call(
    () => {
      if (master.time() >= iPuff + 0.1 && master.time() < iPuff + 0.9) {
        puff(0.3);
      }
    },
    [],
    iPuff + 0.1,
  );

  // --- Her height, and everything that hangs off it. The story's height is
  // `size.h`; the reader's nibbles are a factor on it of their own (`nib.l`, its
  // log), which the story takes back at its next change of size. `toy` is the
  // last look down, at her feet, where the mushroom is a toy.
  const size = { h: THREE };
  const nib = { l: 0 };
  const toy = { t: 0 };
  const shownHeight = (): number => clamp(size.h * Math.exp(nib.l), 0.6, ABOVE_THE_TREES * 1.5);
  const look = { pitch: 0 };
  const flash = shell.layer('ct__flash');
  const irisBottom = shell.layer('ct__iris');
  // Her own feet, seen as she looks down at them at the end.
  const feet = shell.layer('ct__feet');
  feet.innerHTML = `<div class="ct__feet-self">${figure('alice/looking-down')}</div>`;

  // --- The tape-measure down the frame's edge: her height read live at a mark,
  // with a notch where the text says she stands, in the unit the page's own
  // sentences measure her in (its realia `height`: inches, or fingers), its name
  // printed under the reading, its numbers in the page's own numerals. A meter,
  // for assistive technology.
  const measure = shell.realia('height') ?? INCHES;
  const tapeEl = document.createElement('div');
  tapeEl.className = 'ct__tape';
  tapeEl.dataset.unit = measure.unit;
  tapeEl.style.setProperty('--notch', String(measure.notch));
  tapeEl.setAttribute('role', 'meter');
  tapeEl.setAttribute('aria-label', shell.ui.demoHeight ?? '');
  tapeEl.setAttribute('aria-valuemin', '0');
  tapeEl.setAttribute('aria-valuemax', reading(ABOVE_THE_TREES * 1.5, measure).toFixed(1));
  const NUMBERS = 15;
  tapeEl.innerHTML =
    '<div class="ct__tape-strip" aria-hidden="true"><div class="ct__tape-ticks"></div>' +
    Array.from({ length: NUMBERS }, () => '<span class="ct__tape-num"></span>').join('') +
    '<span class="ct__tape-notch"></span></div>' +
    '<div class="ct__tape-mark" aria-hidden="true"><span class="ct__tape-read">' +
    '<span class="ct__tape-value"></span><span class="ct__tape-unit"></span></span></div>';
  shell.stage.append(tapeEl);
  const tapeNumbers = [...tapeEl.querySelectorAll<HTMLElement>('.ct__tape-num')];
  const tapeRead = tapeEl.querySelector<HTMLElement>('.ct__tape-value');
  const tapeUnit = tapeEl.querySelector<HTMLElement>('.ct__tape-unit');
  if (tapeUnit) {
    tapeUnit.textContent = shell.ui.demoHeightUnit ?? '';
  }
  const fine = shell.locale.numberFormat({ maximumFractionDigits: 1 });
  const whole = shell.locale.numberFormat({ maximumFractionDigits: 0 });
  let tapeFloor = Number.NaN;
  let tapeText = '';
  const tape = (inches: number): void => {
    const h = reading(inches, measure);
    tapeEl.style.setProperty('--h', h.toFixed(3));
    tapeEl.style.setProperty('--frac', (h - Math.floor(h)).toFixed(3));
    tapeEl.toggleAttribute('data-notch', onNotch(inches, measure));
    const floor = Math.floor(h);
    if (floor !== tapeFloor) {
      tapeFloor = floor;
      tapeEl.style.setProperty('--floor', String(floor));
      tapeNumbers.forEach((el, i) => {
        const n = floor - Math.floor(NUMBERS / 2) + i;
        el.style.setProperty('--n', String(n));
        el.textContent = n >= 0 ? whole.format(n) : '';
      });
    }
    const text = (h < 10 ? fine : whole).format(h);
    if (text !== tapeText) {
      tapeText = text;
      if (tapeRead) {
        tapeRead.textContent = text;
      }
      tapeEl.setAttribute('aria-valuenow', h.toFixed(1));
      tapeEl.setAttribute('aria-valuetext', text);
    }
  };

  const footLayer = shell.layer('ct__foot-layer');
  footLayer.innerHTML = `<div class="ct__foot">${figure('alice/foot')}</div>`;
  const foot = footLayer.querySelector<HTMLElement>('.ct__foot') ?? footLayer;
  // While the meadow's scale is changing it is one composited layer scaled as a
  // whole (`data-scaling`); a moment after it rests the flag goes and the meadow
  // is drawn crisp at its new size. Redrawing it every frame of a nibble, blades
  // and all, cost the software renderer the better part of a second a frame.
  let lastScale = '';
  let restTimer = 0;
  const rest = (): void => {
    restTimer = 0;
    meadow.removeAttribute('data-scaling');
  };
  const scaling = (scale: string): void => {
    if (scale === lastScale) {
      return;
    }
    const first = lastScale === '';
    lastScale = scale;
    if (first) {
      return;
    }
    meadow.setAttribute('data-scaling', '');
    window.clearTimeout(restTimer);
    restTimer = window.setTimeout(rest, 240);
  };
  const apply = (): void => {
    const h = shownHeight();
    // The meadow scales about the ground under her feet: at three inches it is
    // one to one; smaller, the grass towers; larger, the mushroom is at her feet.
    // At the very end she looks down at her feet, and the mushroom by her shoe is
    // nearer than the horizon: a toy, not a speck.
    const scale = mix(Math.max(0.02, THREE / h), 0.27, toy.t);
    scaling(scale.toFixed(4));
    meadow.style.setProperty('--s', scale.toFixed(4));
    meadow.style.setProperty('--toy', toy.t.toFixed(3));
    feet.style.setProperty('--toy', toy.t.toFixed(3));
    // The horizon is at eye level, so it climbs the frame as she does, and the
    // ground under the mushroom drops below it the taller she is.
    const tall = smoothstep(THREE, USUAL, h);
    sky.style.setProperty('--horizon', mix(mix(82, 44, tall), 10, toy.t).toFixed(2));
    meadow.style.setProperty('--base', mix(mix(82, 80, tall), 82, toy.t).toFixed(2));
    tape(h);
    // Looking up from the grass at three inches; looking down from higher.
    meadow.style.setProperty('--pitch', look.pitch.toFixed(2));
    const above = smoothstep(TREE_LINE_LOW, TREE_LINE_HIGH, h);
    meadow.style.setProperty('--fade', (1 - above).toFixed(3));
    treetops.style.setProperty('--fade', above.toFixed(3));
    sky.style.setProperty('--high', smoothstep(8, ABOVE_THE_TREES, h).toFixed(3));
    shell.root.style.setProperty('--ct-height', h.toFixed(2));
    shell.sound.level('wind', above * 0.5);
  };
  apply();
  const resize = (
    at: number,
    h: number,
    duration = 0.6,
    ease = 'power2.inOut',
    from?: number,
  ): void => {
    const vars = {
      h,
      duration: reducedMotion ? 0.01 : duration,
      ease: reducedMotion ? 'none' : ease,
      onUpdate: apply,
    };
    if (from === undefined) {
      master.to(size, vars, at);
    } else {
      master.fromTo(size, { h: from }, { ...vars, immediateRender: false }, at);
    }
    // The story keeps its own course: its change of size takes back her nibbles.
    master.call(unnibble, [], at);
    if (reducedMotion) {
      master.fromTo(
        flash,
        { opacity: 0.6 },
        { opacity: 0, duration: 0.2, immediateRender: false },
        at,
      );
    }
  };
  // How far the reader's nibbles have gone (as a log factor), and the nod when
  // she lands on exactly three inches again.
  let nibTo = 0;
  let nodTimer = 0;
  const nod = (): void => {
    if (!peek) {
      return;
    }
    shell.sound.play('chime', 0.3);
    peek.removeAttribute('data-nod');
    requestAnimationFrame(() => peek.setAttribute('data-nod', ''));
    window.clearTimeout(nodTimer);
    nodTimer = window.setTimeout(() => peek.removeAttribute('data-nod'), 1800);
  };
  const unnibble = (): void => {
    if (nibTo === 0 && nib.l === 0) {
      return;
    }
    nibTo = 0;
    gsap.to(nib, {
      l: 0,
      duration: reducedMotion ? 0 : 0.3,
      onUpdate: apply,
      overwrite: true,
    });
  };
  const tilt = (at: number, pitch: number, duration = 0.8): void => {
    master.to(
      look,
      { pitch, duration: reducedMotion ? 0.01 : duration, ease: 'sine.inOut', onUpdate: apply },
      at,
    );
  };

  // --- On the mushroom: a slow look up at the Caterpillar, the hookah, the smoke.
  tilt(0, 8, 1.2);
  tilt(iWho, 12);
  master.to(catHead, { y: -6, duration: 0.3, yoyo: true, repeat: 1 }, iWho + 0.1);
  tilt(iExplain, 4);
  // "Explain yourself!": it leans right in at her, its smoke a question.
  master.to(catHead, { x: 4, duration: 0.08, yoyo: true, repeat: 3 }, iExplain + 0.05);
  master.to(
    catHead,
    {
      scale: 1.3,
      x: -6,
      y: 8,
      transformOrigin: '30% 80%',
      duration: reducedMotion ? 0.01 : 0.2,
      ease: 'back.out(2)',
    },
    iExplain + 0.15,
  );
  master.to(
    catHead,
    { scale: 1, x: 0, y: 0, duration: reducedMotion ? 0.01 : 0.2 },
    iExplain + 0.82,
  );
  tilt(iTemper, 10, 0.5);
  master.to(catHead, { y: -6, duration: 0.3, yoyo: true, repeat: 1 }, iTemper + 0.1);
  // It rears itself upright: exactly three inches high.
  master.to(
    caterpillar,
    { rotation: -18, y: -14, duration: reducedMotion ? 0.01 : 0.3, ease: 'back.out(2)' },
    iRear + 0.15,
  );
  // Back down after the settle, so reduced motion rests on it upright.
  master.to(
    caterpillar,
    { rotation: 0, y: 0, duration: reducedMotion ? 0.01 : 0.12 },
    iRear + 0.85,
  );
  // Then down off the mushroom and away in the grass.
  master.to(
    caterpillar,
    {
      x: '-60vmin',
      y: '22vmin',
      scale: 0.6,
      duration: reducedMotion ? 0.01 : 0.9,
      ease: 'power1.in',
    },
    iCrawl + 0.2,
  );
  master.to(caterpillar, { opacity: 0, duration: 0.3 }, iOfWhat + 0.4);
  master.call(
    () => (master.time() >= iOfWhat + 0.6 ? puffButton.hide() : puffButton.show()),
    [],
    iOfWhat + 0.6,
  );
  tilt(iSize, 6);
  tilt(iCrawl, -6);
  // Looking at the mushroom: which are its two sides?
  tilt(iSides, 0);
  master.to(
    mushroom,
    { rotation: 6, duration: 0.6, yoyo: true, repeat: 1, ease: 'sine.inOut' },
    iSides + 0.2,
  );

  // --- The two bits, one in each hand. Real buttons: nibble either.
  const hands = shell.layer('ct__hands');
  hands.innerHTML =
    `<button type="button" class="ct__bit ct__bit--left" aria-label="${shell.ui.demoNibbleLeft ?? ''}">` +
    `<span class="ct__bit-hand">${figure('alice/hand-left')}</span><span class="ct__bit-piece">${LEFT_BIT_SVG}</span></button>` +
    `<button type="button" class="ct__bit ct__bit--right" aria-label="${shell.ui.demoNibbleRight ?? ''}">` +
    `<span class="ct__bit-hand">${figure('alice/hand-right')}</span><span class="ct__bit-piece">${RIGHT_BIT_SVG}</span></button>`;
  const bitLeft = hands.querySelector<HTMLButtonElement>('.ct__bit--left');
  const bitRight = hands.querySelector<HTMLButtonElement>('.ct__bit--right');
  const bites = { left: 0, right: 0 };
  let bitsShown = false;
  const showBits = (shown: boolean): void => {
    if (shown === bitsShown) {
      return;
    }
    bitsShown = shown;
    hands.toggleAttribute('data-shown', shown);
  };
  master.fromTo(hands, { y: 120 }, { y: 0, duration: 0.4, ease: 'power2.out' }, iSides + 0.5);
  // Above the trees her hands are far below with her shoulders: they go down out
  // of the frame as she shoots up, and come back when she remembers the pieces.
  master.fromTo(
    hands,
    { yPercent: 0 },
    {
      yPercent: 110,
      duration: reducedMotion ? 0.01 : 0.4,
      ease: 'power2.in',
      immediateRender: false,
    },
    shootUp,
  );
  master.fromTo(
    hands,
    { yPercent: 110 },
    {
      yPercent: 0,
      duration: reducedMotion ? 0.01 : 0.4,
      ease: 'power2.out',
      immediateRender: false,
    },
    iOff + 0.45,
  );
  const bitsLive = (): boolean => {
    const t = master.time();
    return (t >= iSides + 0.5 && t < shootUp) || t >= iOff + 0.45;
  };
  for (const at of [iSides + 0.5, shootUp, iOff + 0.45]) {
    master.call(() => showBits(bitsLive()), [], at);
  }
  // A nibble: the bit loses a bite and her size follows; the story keeps its own
  // course at the next beat, so play never strands her.
  const nibble = (side: 'left' | 'right'): void => {
    bites[side] = Math.min(5, bites[side] + 1);
    const bit = side === 'left' ? bitLeft : bitRight;
    bit?.style.setProperty('--bite', String(bites[side]));
    bit?.removeAttribute('data-bitten');
    void bit?.offsetWidth;
    bit?.setAttribute('data-bitten', '');
    // A bite is a factor of 1.7 either way, on the reader's own value; one of
    // each lands her back on exactly the height she had.
    const step = Math.log(1.7) * (side === 'left' ? 1 : -1);
    nibTo = clamp(nibTo + step, Math.log(0.6 / size.h), Math.log((ABOVE_THE_TREES * 1.5) / size.h));
    gsap.to(nib, {
      l: nibTo,
      duration: reducedMotion ? 0 : 0.7,
      ease: 'power2.out',
      onUpdate: apply,
      onComplete: () => {
        apply();
        // "It is a very good height indeed!": three inches, exactly.
        if (Math.abs(shownHeight() - THREE) < 0.01) {
          nod();
        }
      },
      overwrite: true,
    });
    shell.sound.play(side === 'left' ? 'chime' : 'paper', 0.6);
    shell.status(
      side === 'left' ? (shell.ui.demoNibbleLeft ?? '') : (shell.ui.demoNibbleRight ?? ''),
    );
  };
  bitLeft?.addEventListener('click', () => nibble('left'));
  bitRight?.addEventListener('click', () => nibble('right'));

  // --- The right-hand bit: she shrinks fast, and her chin meets her foot.
  resize(iShrink + 0.05, CHIN_ON_FOOT, 0.45, 'power3.in', THREE);
  tilt(iShrink, -20, 0.4);
  master.fromTo(
    foot,
    { y: '70vh' },
    { y: '0vh', duration: reducedMotion ? 0.01 : 0.35, ease: 'power3.in' },
    iShrink + 0.25,
  );
  master.to(
    irisBottom,
    { '--fold': 0.5, duration: reducedMotion ? 0.01 : 0.25, ease: 'power3.in' },
    iShrink + 0.4,
  );
  master.call(
    () => {
      if (master.time() >= iShrink + 0.6) {
        shell.sound.play('thud');
        if (!reducedMotion) {
          gsap.fromTo(
            shell.stage,
            { x: -6 },
            { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', clearProps: 'x' },
          );
        }
      }
    },
    [],
    iShrink + 0.6,
  );
  // The other bit, swallowed with hardly room to open her mouth: up she goes.
  master.to(irisBottom, { '--fold': 0, duration: reducedMotion ? 0.01 : 0.3 }, unfold);
  master.to(foot, { y: '70vh', duration: reducedMotion ? 0.01 : 0.4, ease: 'power2.in' }, unfold);
  if (!reducedMotion) {
    master.fromTo(flash, { opacity: 0 }, { opacity: 0.9, duration: 0.05 }, shootUp);
    master.to(flash, { opacity: 0, duration: 0.5 }, shootUp + 0.05);
  }
  resize(shootUp, ABOVE_THE_TREES, iFree - iGrow + 0.3, 'power2.inOut', CHIN_ON_FOOT);
  tilt(shootUp, 30, 1.2);

  // --- Above the trees: sky, then the look down at the neck; it bends with the pointer.
  tilt(iFree, 26, 0.6);
  tilt(iNeck, -40, 1);
  const hint = document.createElement('p');
  hint.className = 'ct__hint';
  hint.textContent = shell.ui.demoBendNeck ?? '';
  shell.stage.append(hint);
  master.call(
    () => hint.toggleAttribute('data-shown', master.time() >= iBend && master.time() < iPigeon),
    [],
    iBend,
  );
  master.call(
    () => hint.toggleAttribute('data-shown', master.time() >= iBend && master.time() < iPigeon),
    [],
    iPigeon,
  );

  // --- The Pigeon: it flies into her face and beats her with its wings. Where
  // it is, is the timeline's (`bird`); a shoo and the burst out of the leaves are
  // the reader's, on values of their own, mixed over it.
  const birdLayer = shell.layer('ct__bird-layer');
  birdLayer.innerHTML = `<button type="button" class="ct__pigeon" aria-label="${shell.ui.demoShoo ?? ''}">${figure('pigeon')}</button>`;
  const pigeon = birdLayer.querySelector<HTMLButtonElement>('.ct__pigeon');
  const bird = { x: 120, y: -40, scale: 0.4, near: 0 };
  const shooFx = { x: 0, y: 0, scale: 1, k: 0 };
  const dipBird = { y: 45, scale: 0.15, k: 0 };
  let shooed = 0;
  let birdNear = 0;
  const applyBird = (): void => {
    let x = mix(bird.x, 0, dipBird.k);
    let y = mix(bird.y, dipBird.y, dipBird.k);
    let scale = mix(bird.scale, dipBird.scale, dipBird.k);
    birdNear = Math.max(bird.near, dipBird.k * clamp((dipBird.scale - 0.3) / 0.6, 0, 1));
    // Each shoo, it comes back a little worse.
    scale *= 1 + 0.06 * Math.min(shooed, 4) * bird.near;
    x = mix(x, shooFx.x, shooFx.k);
    y = mix(y, shooFx.y, shooFx.k);
    scale = mix(scale, shooFx.scale, shooFx.k);
    pigeon?.style.setProperty('--bx', x.toFixed(1));
    pigeon?.style.setProperty('--by', y.toFixed(1));
    pigeon?.style.setProperty('--bs', scale.toFixed(3));
    pigeon?.toggleAttribute('data-beating', birdNear > 0.5 && !shell.paused);
    // Not in its moment, it is not there to be pressed or tabbed to.
    pigeon?.toggleAttribute('data-here', bird.near > 0.02 || dipBird.k > 0);
  };
  applyBird();
  let shooTimeline: gsap.core.Timeline | undefined;
  const shoo = (): void => {
    if (birdNear < 0.5) {
      return;
    }
    shooed += 1;
    shell.sound.play('whoosh', 0.7);
    shell.status(shell.ui.demoShoo ?? '');
    const away = shooed % 2 === 0 ? -1 : 1;
    shooTimeline?.kill();
    const timeline = gsap.timeline();
    shooTimeline = timeline;
    timeline.fromTo(
      shooFx,
      { x: bird.x, y: bird.y, scale: bird.scale, k: 0 },
      {
        x: 45 * away,
        y: -30,
        scale: 0.7,
        k: 1,
        duration: reducedMotion ? 0 : 0.35,
        ease: 'power3.out',
        onUpdate: applyBird,
      },
    );
    // And back it comes, worse than before.
    timeline.to(shooFx, {
      k: 0,
      delay: reducedMotion ? 0.3 : 0.9,
      duration: reducedMotion ? 0 : 0.5,
      ease: 'power2.in',
      onUpdate: applyBird,
      onComplete: applyBird,
    });
  };
  pigeon?.addEventListener('click', shoo);
  const flyIn = (
    at: number,
    from: typeof bird,
    to: typeof bird,
    duration = 0.6,
    ease = 'power2.out',
  ): void => {
    master.fromTo(
      bird,
      from,
      {
        ...to,
        duration: reducedMotion ? 0.01 : duration,
        ease,
        onUpdate: applyBird,
        immediateRender: false,
      },
      at,
    );
  };
  const away = { x: 120, y: -40, scale: 0.4, near: 0 };
  const atFace = { x: 0, y: 0, scale: 1, near: 1 };
  const atLeft = { x: -30, y: -10, scale: 0.85, near: 1 };
  const atRight = { x: 20, y: 5, scale: 1, near: 1 };
  const inNest = { x: -60, y: 55, scale: 0.35, near: 0 };
  flyIn(iPigeon + 0.1, away, atFace, 0.5, 'power3.out');
  master.call(
    () => {
      if (Math.abs(master.time() - (iPigeon + 0.6)) < 0.3 && !reducedMotion) {
        shell.sound.play('whoosh');
        gsap.fromTo(
          shell.stage,
          { x: 8 },
          { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)', clearProps: 'x' },
        );
      }
    },
    [],
    iPigeon + 0.6,
  );
  flyIn(iTried, atFace, atLeft);
  flyIn(iGirl, atLeft, atRight);
  // Be off, then: it settles down again into its nest among the leaves.
  flyIn(iOff + 0.1, atRight, inNest, 0.8, 'power2.inOut');

  // --- Dip into the leaves: she was going to dive in among them when a sharp
  // hiss made her draw back. Drag her head down (from where her neck leaves the
  // frame), or press the button: the head goes down into the leaves, and the
  // Pigeon bursts up out of them into her face. A drag down only; the rest of
  // the frame still scrolls.
  const dipButton = shell.prop(shell.ui.demoDipLeaves ?? '', 'ct__prop ct__prop--dip');
  const dipTarget = document.createElement('div');
  dipTarget.className = 'ct__dip-target';
  dipTarget.setAttribute('aria-hidden', 'true');
  shell.stage.append(dipTarget);
  const dip = { d: 0 };
  const applyDip = (): void => {
    treetops.style.setProperty('--dip', dip.d.toFixed(3));
    applyBird();
  };
  const dipLive = (): boolean => master.time() >= iBend && master.time() < iPigeon;
  const dipShown = (): void => {
    const live = dipLive();
    if (live) {
      dipButton.show();
    } else {
      dipButton.hide();
    }
    dipTarget.toggleAttribute('data-live', live);
  };
  let dips = 0;
  let dipTimeline: gsap.core.Timeline | undefined;
  const burstUp = (): void => {
    dips += 1;
    shell.sound.play('whoosh', 0.8);
    dipTimeline?.kill();
    const timeline = gsap.timeline();
    dipTimeline = timeline;
    if (reducedMotion) {
      // A still: her head among the leaves and the Pigeon at her face, then back.
      timeline.set(dip, { d: 1 }, 0);
      timeline.set(dipBird, { k: 1, y: 14, scale: 1.05, onComplete: applyDip }, 0);
      timeline.set(dip, { d: 0 }, 1.6);
      timeline.set(dipBird, { k: 0, y: 45, scale: 0.15, onComplete: applyDip }, 1.6);
      return;
    }
    timeline.to(dip, { d: 1, duration: 0.25, ease: 'power2.in', onUpdate: applyDip }, 0);
    timeline.fromTo(
      dipBird,
      { k: 1, y: 45, scale: 0.15 },
      { y: 14, scale: 1.15, duration: 0.35, ease: 'power3.out', onUpdate: applyDip },
      0.18,
    );
    // She draws back in a hurry.
    timeline.to(dip, { d: 0, duration: 0.5, ease: 'power2.out', onUpdate: applyDip }, 0.35);
    timeline.to(
      dipBird,
      { y: 50, scale: 0.2, duration: 0.6, ease: 'power2.in', onUpdate: applyDip },
      1.6,
    );
    timeline.set(dipBird, { k: 0, onComplete: applyDip });
  };
  dipButton.addEventListener('click', () => {
    if (dipLive()) {
      burstUp();
      shell.status(shell.ui.demoDipLeaves ?? '');
    }
  });
  let dragFrom: number | undefined;
  dipTarget.addEventListener('pointerdown', (event) => {
    if (!dipLive() || event.button > 0) {
      return;
    }
    dragFrom = event.clientY;
    dipTarget.setPointerCapture(event.pointerId);
    dipTimeline?.kill();
  });
  dipTarget.addEventListener('pointermove', (event) => {
    if (dragFrom === undefined) {
      return;
    }
    dip.d = clamp((event.clientY - dragFrom) / 160, 0, 1);
    applyDip();
    if (dip.d >= 1) {
      dragFrom = undefined;
      burstUp();
      shell.status(shell.ui.demoDipLeaves ?? '');
    }
  });
  const letGo = (): void => {
    if (dragFrom === undefined) {
      return;
    }
    dragFrom = undefined;
    gsap.to(dip, { d: 0, duration: reducedMotion ? 0 : 0.35, onUpdate: applyDip });
  };
  dipTarget.addEventListener('pointerup', letGo);
  dipTarget.addEventListener('pointercancel', letGo);
  master.call(dipShown, [], iBend);
  master.call(dipShown, [], iPigeon);

  // --- Back to her usual height, nibbling first at one and then at the other.
  resize(iBack + 0.05, 14, 0.3, 'power2.inOut', ABOVE_THE_TREES);
  resize(iBack + 0.4, 90, 0.25, 'power2.inOut', 14);
  resize(iBack + 0.7, USUAL, 0.28, 'power2.out', 90);
  tilt(iBack, -12, 1);
  // And she looks down at her feet: the mushroom by her shoe, a toy.
  master.fromTo(
    toy,
    { t: 0 },
    {
      t: 1,
      duration: reducedMotion ? 0.01 : 0.24,
      ease: 'power2.inOut',
      onUpdate: apply,
      immediateRender: false,
    },
    iBack + 0.75,
  );

  // --- Every frame: the neck follows the pointer, the leaves and grass lean with it.
  let bendX = 0;
  let bendY = 0;
  let neckDrawn = false;
  shell.onFrame((dt) => {
    // The neck is only drawn while it can be seen.
    if (Number(treetops.style.getPropertyValue('--fade') || 0) < 0.01 && neckDrawn) {
      return;
    }
    neckDrawn = true;
    const k = 1 - Math.exp(-dt * 4);
    const targetX = shell.pointer.active && !reducedMotion ? shell.pointer.x : 0;
    const targetY = shell.pointer.active && !reducedMotion ? shell.pointer.y : 0;
    bendX = mix(bendX, targetX, k);
    bendY = mix(bendY, targetY, k);
    const baseX = 500 + bendX * 260;
    const baseY = 620 + bendY * 90;
    const controlX = 500 + bendX * 420;
    const controlY = 900 - bendY * 60;
    neckPaths[0]?.setAttribute('d', neckPath(baseX, baseY, controlX, controlY, 116));
    neckPaths[1]?.setAttribute('d', neckPath(baseX, baseY, controlX, controlY, 100));
    shoulders?.setAttribute(
      'transform',
      `translate(${baseX.toFixed(1)} ${(baseY + 6).toFixed(1)}) rotate(${(bendX * 12).toFixed(1)})`,
    );
    leafGroup?.setAttribute(
      'transform',
      `translate(${(-bendX * 40).toFixed(1)} ${(-bendY * 20).toFixed(1)})`,
    );
    meadow.style.setProperty('--lean', (bendX * 6).toFixed(2));
    if (canopy) {
      canopy.style.setProperty('--sway', (bendX * 2).toFixed(2));
    }
  });

  // Test seam: the Caterpillar's own state, in one serialisable snapshot.
  window.__aliceCaterpillar = () => ({
    height: shownHeight(),
    story: size.h,
    toy: toy.t,
    dip: dip.d,
    dips,
    shooed,
    bitsShown,
    nodding: peek?.hasAttribute('data-nod') ?? false,
  });
}

declare global {
  interface Window {
    /** Test seam: the Caterpillar's own state. */
    __aliceCaterpillar?: () => {
      height: number;
      story: number;
      toy: number;
      dip: number;
      dips: number;
      shooed: number;
      bitsShown: boolean;
      nodding: boolean;
    };
  }
}

const shell = attachDemo({
  caption: (beat, master, reduced, beats) =>
    smokeCaption(beat, master, reduced, beat.index === beats.length - 1),
});
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
