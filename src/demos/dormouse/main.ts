/**
 * The Dormouse's tale: the concept demo.
 *
 * Carroll set the Mouse's tale in the shape of a tail, shrinking as it went. Here
 * the Dormouse's tale is written on the treacle at the bottom of a teacup, in a
 * spiral that shrinks toward the centre, and the camera turns and dives to keep
 * the sentence being told upright at the middle of the screen. The parallax is
 * rotation and zoom rather than depth. The others talk in bubbles around the rim.
 * Everything drawn is SVG; GSAP scrubs the camera.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import { BUCKET_INNER, M_PICTURES, TEAPOT_SVG } from './figures.ts';
import './dormouse.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CENTRE = 500;
const OUTER = 400;
const INNER = 48;
const TURNS = 5.5;
/** On-screen size the sentence being told is scaled to, in viewBox units. */
const READ_SIZE = 30;

interface Camera {
  x: number;
  y: number;
  angle: number;
  scale: number;
  /** Pointer nudge, applied on top. */
  nx: number;
  ny: number;
}

function spiralPath(): string {
  const steps = Math.round((TURNS * 360) / 3);
  const thetaMax = TURNS * Math.PI * 2;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * thetaMax;
    const r = mix(OUTER, INNER, i / steps);
    const x = CENTRE + Math.cos(theta - Math.PI / 2) * r;
    const y = CENTRE + Math.sin(theta - Math.PI / 2) * r;
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

/**
 * The letter the sisters drew everything with, read from the page: the capital
 * that stands alone, as a word of its own, most often in the given sentences (in
 * English the M of "an M"). A translation brings its own; none found, none shown.
 */
function lonelyCapital(lines: HTMLElement[]): string {
  const counts = new Map<string, number>();
  for (const line of lines) {
    for (const match of (line.textContent ?? '').matchAll(
      /(?<![\p{L}\p{N}])\p{Lu}(?![\p{L}\p{N}])/gu,
    )) {
      counts.set(match[0], (counts.get(match[0]) ?? 0) + 1);
    }
  }
  let best = '';
  let most = 0;
  for (const [letter, count] of counts) {
    if (count > most) {
      best = letter;
      most = count;
    }
  }
  return best;
}

function mount(shell: DemoShell): void {
  const { master, ambient, reducedMotion } = shell;
  const iSpiral = shell.cue('spiral');
  const iDraw = shell.cue('draw');
  const iDoze = shell.cue('doze');
  const iShriek = shell.cue('shriek');
  const iMuchness = shell.cue('muchness');
  const iTeapot = shell.cue('teapot');
  const iDoor = shell.cue('door');
  const random = seeded(31);
  /** Shows a prop while the timeline is inside [from, to). */
  const during = (prop: { show(): void; hide(): void }, from: number, to: number): void => {
    const set = (): void => {
      const t = master.time();
      if (t >= from && t < to) {
        prop.show();
      } else {
        prop.hide();
      }
    };
    master.call(set, [], from);
    master.call(set, [], to);
  };

  // --- Layers.
  const cloth = shell.layer('dm__cloth');
  const stage = shell.layer('dm__stage');
  // The cup is a fixed 1000 by 1000 box the SVG draws into once; the camera is a
  // CSS transform on the box, so the compositor moves a rasterised cup instead of
  // the SVG re-rendering its spiral of text every frame.
  const cup = document.createElement('div');
  cup.className = 'dm__cup';
  stage.append(cup);
  const svg = el('svg', {
    class: 'dm__svg',
    viewBox: '0 0 1000 1000',
    width: '1000',
    height: '1000',
  });
  cup.append(svg);

  const defs = el('defs');
  defs.innerHTML =
    '<radialGradient id="dm-treacle"><stop offset="0" stop-color="var(--dm-treacle-shine)"/>' +
    '<stop offset="0.55" stop-color="var(--dm-treacle)"/><stop offset="1" stop-color="var(--dm-treacle-deep)"/></radialGradient>';
  svg.append(defs);
  const spiral = el('path', { id: 'dm-spiral', d: spiralPath(), fill: 'none' });
  defs.append(spiral);

  const cameraGroup = el('g', { class: 'dm__camera' });
  svg.append(cameraGroup);
  // Saucer, cup, treacle.
  cameraGroup.append(
    el('circle', { cx: '500', cy: '500', r: '480', fill: 'var(--dm-china-shade)' }),
    el('circle', { cx: '500', cy: '500', r: '455', fill: 'var(--dm-china)' }),
    el('circle', { cx: '500', cy: '500', r: '425', fill: 'url(#dm-treacle)' }),
  );
  // Three little sisters at the bottom of the well, in an SVG of their own so
  // their slow turning never repaints the text.
  const sistersSvg = el('svg', {
    class: 'dm__svg dm__svg--sisters',
    viewBox: '0 0 1000 1000',
    width: '1000',
    height: '1000',
  });
  const sisters = el('g', { class: 'dm__sisters' });
  for (let i = 0; i < 3; i += 1) {
    const sister = el('g', { transform: `rotate(${i * 120} 500 500)` });
    sister.append(
      el('circle', { cx: '500', cy: '470', r: '9', fill: 'var(--dm-ink)', 'fill-opacity': '0.5' }),
      el('circle', { cx: '500', cy: '458', r: '5', fill: 'var(--dm-ink)', 'fill-opacity': '0.6' }),
    );
    sisters.append(sister);
  }
  sistersSvg.append(sisters);
  cup.append(sistersSvg);

  const wobbleGroup = el('g');
  const sleepGroup = el('g');
  svg.classList.add('dm__svg--text');
  const text = el('text', { class: 'dm__text' });
  const textPath = el('textPath', { href: '#dm-spiral' });
  text.append(textPath);
  sleepGroup.append(text);
  wobbleGroup.append(sleepGroup);
  cameraGroup.append(wobbleGroup);

  // --- The tale on the spiral: every sentence the Dormouse says, in order, each a
  // little smaller than the last.
  const told = shell.spokenBy('dormouse');
  const spans: { tspan: SVGTSpanElement; beat: number; size: number }[] = [];
  let sizeIndex = 0;
  for (const beat of told) {
    for (const line of beat.lines) {
      if (line.dataset.speaker !== 'dormouse') {
        continue;
      }
      const size = 44 * 0.945 ** sizeIndex;
      const tspan = el('tspan', { 'font-size': size.toFixed(2) });
      tspan.textContent = `${line.textContent ?? ''} `;
      textPath.append(tspan);
      spans.push({ tspan, beat: beat.index, size });
      sizeIndex += 1;
    }
  }
  // Fit: the tale must end before the spiral does. The text is laid out with
  // geometric precision (see the sheet), so what is measured here is what is drawn
  // at any zoom of the camera.
  const spiralLength = spiral.getTotalLength();
  const fitTale = (): void => {
    const room = spiralLength * 0.97;
    const used = text.getComputedTextLength();
    if (used > room) {
      const ratio = room / used;
      for (const span of spans) {
        span.size *= ratio;
        span.tspan.setAttribute('font-size', span.size.toFixed(2));
      }
    }
  };
  fitTale();

  // --- The camera. Where a sentence sits and which way it runs come from the
  // rendered text itself, so the layout and the camera cannot disagree.
  // It opens a little further out than it reads at: the tea-party's last frame
  // is this cup from above at this size, and the first half-beat settles in.
  const ARRIVE_SCALE = 0.8;
  const camera: Camera = { x: CENTRE, y: CENTRE, angle: 0, scale: ARRIVE_SCALE, nx: 0, ny: 0 };
  // The stage in px: the cup's 1000 units cover the longer side, as a sliced
  // viewBox would, and its centre sits on the stage's centre.
  const view = { w: 1, h: 1, k: 1 };
  const measure = (): void => {
    view.w = stage.clientWidth || 1;
    view.h = stage.clientHeight || 1;
    view.k = Math.max(view.w, view.h) / 1000;
  };
  measure();
  let lastTransform = '';
  const setCup = (x: number, y: number, angle: number, scale: number): void => {
    const { nx, ny } = camera;
    const next = `translate3d(${(view.w / 2 + nx * view.k).toFixed(2)}px, ${(view.h / 2 + (ny - 30) * view.k).toFixed(2)}px, 0) scale(${(scale * view.k).toFixed(5)}) rotate(${(-angle).toFixed(3)}deg) translate(${(-x).toFixed(2)}px, ${(-y).toFixed(2)}px)`;
    if (next !== lastTransform) {
      lastTransform = next;
      cup.style.setProperty('--cup-transform', next);
    }
  };
  // The reader's own turns of the cup, on top of the story's camera: a stir, and
  // a held finger reading ahead. Each is its own object; they meet here.
  const readAhead = { x: 0, y: 0, angle: 0, scale: 1, amount: 0 };
  let stir = 0;
  const apply = (): void => {
    const a = readAhead.amount;
    setCup(
      mix(camera.x, readAhead.x, a),
      mix(camera.y, readAhead.y, a),
      mix(camera.angle, readAhead.angle, a) - stir,
      mix(camera.scale, readAhead.scale, a),
    );
  };
  apply();
  window.addEventListener('resize', () => {
    measure();
    apply();
  });

  let charIndex = 0;
  let lastAngle = 0;
  const targets: {
    beat: number;
    at: number;
    x: number;
    y: number;
    angle: number;
    scale: number;
    /** How far along the spiral the sentence's middle is, in viewBox units. */
    along: number;
    size: number;
  }[] = [];
  const perBeat = new Map<number, number>();
  for (const span of spans) {
    perBeat.set(span.beat, (perBeat.get(span.beat) ?? 0) + 1);
  }
  const seen = new Map<number, number>();
  for (const span of spans) {
    const length = span.tspan.getNumberOfChars();
    const mid = charIndex + Math.floor(length / 2);
    const point = text.getStartPositionOfChar(mid);
    let angle = text.getRotationOfChar(mid);
    // Unwrap, so the camera keeps turning the way the spiral turns.
    while (angle < lastAngle - 180) {
      angle += 360;
    }
    lastAngle = angle;
    const order = seen.get(span.beat) ?? 0;
    seen.set(span.beat, order + 1);
    const count = perBeat.get(span.beat) ?? 1;
    targets.push({
      beat: span.beat,
      at: span.beat + (order / count) * 0.8,
      x: point.x,
      y: point.y,
      angle,
      scale: READ_SIZE / span.size,
      along: mid > 0 ? text.getSubStringLength(0, mid) : 0,
      size: span.size,
    });
    charIndex += length;
  }

  const first = targets[0];
  if (first) {
    // Before the tale, the whole cup; at the first word, dive in.
    master.set(camera, { x: CENTRE, y: CENTRE, angle: 0, scale: ARRIVE_SCALE }, 0);
    master.to(
      camera,
      { scale: 0.95, duration: reducedMotion ? 0.01 : 0.45, ease: 'power2.out' },
      0.02,
    );
    master.to(
      camera,
      {
        x: first.x,
        y: first.y,
        angle: first.angle,
        scale: first.scale,
        duration: reducedMotion ? 0.01 : 0.9,
        ease: 'power2.inOut',
      },
      iSpiral,
    );
  }
  for (const target of targets.slice(1)) {
    master.to(
      camera,
      {
        x: target.x,
        y: target.y,
        angle: target.angle,
        scale: target.scale,
        duration: reducedMotion ? 0.01 : 0.45,
        ease: 'power2.inOut',
      },
      target.at,
    );
  }
  // Tone: said sentences stay legible, the one being told is bright, the rest wait.
  spans.forEach((span, index) => {
    const target = targets[index];
    if (!target) {
      return;
    }
    master.fromTo(span.tspan, { '--tone': 0.22 }, { '--tone': 1, duration: 0.2 }, target.at);
    const next = targets[index + 1];
    if (next) {
      master.to(span.tspan, { '--tone': 0.6, duration: 0.3 }, next.at);
    }
  });
  if (reducedMotion) {
    // A step, not a glide: the treacle dips for a moment between sentences.
    for (const target of targets) {
      master.fromTo(text, { opacity: 0.2 }, { opacity: 1, duration: 0.25 }, target.at);
    }
  }
  master.eventCallback('onUpdate', apply);
  /** The sentence being told at the playhead, or the first before the tale. */
  const toldNow = (): (typeof targets)[number] | undefined => {
    const t = master.time();
    let current = targets[0];
    for (const target of targets) {
      if (target.at <= t + 0.05) {
        current = target;
      }
    }
    return current;
  };

  // --- Dozing: the treacle blurs, the telling slows; a shriek clears it. The
  // story's doze is the master's; the reader's pinch and a held finger are their
  // own object, combined here, so a pinch wakes it for a while and then it nods off
  // again, and the scroll stays the only owner of the story's state.
  const blur = { amount: 0, wobble: 0 };
  const wake = { clear: 0, held: 0, wobble: 0 };
  // The doze is a CSS blur on the whole text SVG and the shriek's wobble a CSS
  // skew on it, both done by the compositor; an SVG filter on the text would
  // re-render the whole spiral on every frame it changed.
  const applyEffects = (): void => {
    const sleep = blur.amount * (1 - Math.max(wake.clear, wake.held));
    svg.style.setProperty('--sleep', sleep.toFixed(2));
    svg.style.setProperty('--wobble', (blur.wobble + wake.wobble).toFixed(2));
    svg.toggleAttribute('data-dozing', sleep > 0.02);
  };
  master.to(
    blur,
    { amount: reducedMotion ? 1.2 : 3.5, duration: 1.4, ease: 'sine.in', onUpdate: applyEffects },
    iDoze,
  );
  master.to(blur, { amount: 0, duration: 0.15, onUpdate: applyEffects }, iShriek);
  if (!reducedMotion) {
    master.to(blur, { wobble: 26, duration: 0.1, onUpdate: applyEffects }, iShriek);
    master.to(
      blur,
      { wobble: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)', onUpdate: applyEffects },
      iShriek + 0.1,
    );
  }

  // --- The Dormouse itself, on the rim. Pinch it and it wakes with a shriek.
  const mouseLayer = shell.layer('dm__mouse-layer');
  mouseLayer.innerHTML = `<div class="dm__mouse">${figure('dormouse')}</div>`;
  const mouse = mouseLayer.querySelector<HTMLElement>('.dm__mouse');
  const pinchButton = shell.prop(shell.ui.demoPinch ?? '', 'dm__prop-pinch');
  // On the animation clock rather than a timer, so the wake and the nodding off
  // keep their order however slowly the frames come.
  let awakeTimer: gsap.core.Tween | undefined;
  const pinch = (): void => {
    if (!mouse) {
      return;
    }
    mouse.setAttribute('data-shriek', '');
    gsap.to(mouse, { '--pinched': 1, duration: 0.1 });
    gsap.to(wake, { clear: 1, duration: 0.2, onUpdate: applyEffects });
    if (!reducedMotion) {
      gsap.fromTo(
        wake,
        { wobble: 30 },
        { wobble: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)', onUpdate: applyEffects },
      );
    }
    awakeTimer?.kill();
    awakeTimer = gsap.delayedCall(2.6, () => {
      mouse.removeAttribute('data-shriek');
      gsap.to(mouse, { '--pinched': 0, duration: 0.8 });
      // Awake for a moment; if the story still has it dozing, it nods off again.
      gsap.to(wake, { clear: 0, duration: 2, ease: 'sine.in', onUpdate: applyEffects });
    });
  };
  mouse?.addEventListener('pointerdown', pinch);
  pinchButton.addEventListener('click', pinch);
  // The button is offered while the Dormouse is nodding off.
  during(pinchButton, iDoze, iShriek + 0.5);
  // The story's own pinch.
  master.call(() => (master.time() >= iShriek + 0.05 ? pinch() : undefined), [], iShriek + 0.05);
  master.fromTo(mouse, { '--awake': 0 }, { '--awake': 1, duration: 0.05 }, iSpiral - 0.9);
  master.to(mouse, { '--awake': 0, duration: 0.8 }, iDoze + 0.4);

  // --- Treacle drips down the screen; the three sisters drift round the well.
  const drips = shell.layer('dm__drips-layer');
  const dripBox = document.createElement('div');
  dripBox.className = 'dm__drips';
  dripBox.innerHTML = Array.from(
    { length: 6 },
    (_, i) =>
      `<div class="dm__drip" style="--dx: ${(8 + i * 15 + random() * 6).toFixed(1)}%; --delay: ${(-random() * 6).toFixed(2)}s"></div>`,
  ).join('');
  drips.append(dripBox);
  master.fromTo(dripBox, { '--drips': 0 }, { '--drips': 1, duration: 0.6 }, iSpiral + 0.5);
  master.to(dripBox, { '--drips': 0, duration: 0.5 }, iTeapot);
  if (!reducedMotion) {
    ambient.to(
      sistersSvg,
      { rotation: 360, transformOrigin: '50% 50%', duration: 40, ease: 'none', repeat: -1 },
      0,
    );
  }

  // --- Everything that begins with an M: the letter itself, taken from the page.
  // The letters float up through the cup at *muchness*; tap one, or press *Draw
  // something with an M*, and it becomes one of the things the sisters drew: a
  // mouse-trap, the moon, memory (a knot in a string). Pictures only.
  const letter = lonelyCapital(shell.beats[iDoze]?.lines ?? []);
  const letters = shell.layer('dm__letters');
  const sisterLetters = shell.layer('dm__sister-letters');
  const mButton = shell.prop(shell.ui.demoDrawM ?? '', 'dm__prop-left dm__prop-m');
  if (letter) {
    letters.innerHTML = Array.from(
      { length: 10 },
      (_, i) =>
        `<span class="dm__letter" style="--lx: ${6 + i * 9.5}%; --ly: ${random().toFixed(2)}; --delay: ${(-random() * 7).toFixed(2)}s">${letter}</span>`,
    ).join('');
    master.to(letters, { opacity: 1, duration: 0.3 }, iMuchness);
    master.to(letters, { opacity: 0, duration: 0.3 }, iTeapot);
    const lettersOn = (): void => {
      const t = master.time();
      letters.toggleAttribute('data-on', t >= iMuchness && t < iTeapot);
    };
    master.call(lettersOn, [], iMuchness);
    master.call(lettersOn, [], iTeapot);
    during(mButton, iMuchness, iTeapot);
    const floating = [...letters.querySelectorAll<HTMLElement>('.dm__letter')];
    let drawn = 0;
    const drawM = (span: HTMLElement): void => {
      span.innerHTML = M_PICTURES[drawn % M_PICTURES.length] ?? '';
      span.dataset.picture = String(drawn % M_PICTURES.length);
      drawn += 1;
      shell.sound.play('chime', 0.35);
    };
    for (const span of floating) {
      // Each time a letter rises out of the top and comes round again, it is a letter.
      span.addEventListener('animationiteration', () => {
        if (span.dataset.picture !== undefined) {
          span.textContent = letter;
          delete span.dataset.picture;
        }
      });
    }
    letters.addEventListener('click', (event) => {
      const span = (event.target as Element).closest<HTMLElement>('.dm__letter');
      if (span && letters.hasAttribute('data-on')) {
        drawM(span);
      }
    });
    mButton.addEventListener('click', () => {
      // The letter nearest the middle of the frame that is still a letter; if
      // every one in view is a picture already, the nearest picture changes.
      const box = shell.stage.getBoundingClientRect();
      const inView = floating
        .map((span) => ({ span, r: span.getBoundingClientRect() }))
        .filter(({ r }) => r.bottom > box.top && r.top < box.bottom);
      const distance = ({ r }: { r: DOMRect }): number =>
        Math.hypot(
          r.left + r.width / 2 - (box.left + box.width / 2),
          r.top + r.height / 2 - (box.top + box.height / 2),
        );
      const pick =
        inView
          .filter(({ span }) => span.dataset.picture === undefined)
          .sort((a, b) => distance(a) - distance(b))[0] ??
        inView.sort((a, b) => distance(a) - distance(b))[0];
      if (pick) {
        drawM(pick.span);
      }
    });
    // The three little sisters drew everything that begins with it: tap them and
    // a letter floats up out of the well, whatever the beat.
    sisters.addEventListener('click', (event) => {
      event.stopPropagation();
      const span = document.createElement('span');
      span.className = 'dm__letter dm__letter--once';
      span.textContent = letter;
      const box = shell.stage.getBoundingClientRect();
      span.style.setProperty(
        '--lx',
        `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`,
      );
      span.style.setProperty('--ly', random().toFixed(2));
      sisterLetters.append(span);
      span.addEventListener('animationend', () => span.remove());
      if (reducedMotion) {
        setTimeout(() => span.remove(), 2500);
      }
    });
  }

  // --- Drawing treacle: at *draw*, the sisters' little bucket is pulled up the
  // spiral out of the well, riding the lines of the tale through the sentence
  // being told and dripping treacle on the words as it goes. Its own SVG in the
  // cup, like the sisters, so its trip never repaints the text.
  const bucketSvg = el('svg', {
    class: 'dm__svg dm__svg--bucket',
    viewBox: '0 0 1000 1000',
    width: '1000',
    height: '1000',
  });
  const rope = el('path', { class: 'dm__rope', d: '' });
  const drops = el('g', { class: 'dm__drops' });
  const pail = el('g', { class: 'dm__bucket' });
  pail.innerHTML = BUCKET_INNER;
  bucketSvg.append(drops, rope, pail);
  cup.append(bucketSvg);
  const drawButton = shell.prop(shell.ui.demoDrawTreacle ?? '', 'dm__prop-left dm__prop-draw');
  during(drawButton, iDraw, iDoze);
  const trip = { on: false, t: 0, from: 0, to: 0, scale: 1, dropClock: 0 };
  const clampAlong = (s: number): number => Math.min(spiralLength, Math.max(0, s));
  /** Puts the bucket at a distance along the spiral; returns where its foot is. */
  const placeBucket = (s: number): { x: number; y: number } => {
    const p = spiral.getPointAtLength(clampAlong(s));
    const q = spiral.getPointAtLength(clampAlong(s + 2));
    const turn = Math.atan2(q.y - p.y, q.x - p.x);
    const angle = (turn * 180) / Math.PI;
    pail.setAttribute(
      'transform',
      `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${trip.scale.toFixed(3)}) translate(0 -6)`,
    );
    // The rope runs on up the spiral toward the rim, the way it is being pulled.
    const points: string[] = [];
    for (let i = 0; i <= 14; i += 1) {
      const r = spiral.getPointAtLength(clampAlong(s - 10 * trip.scale - i * 24));
      points.push(`${i === 0 ? 'M' : 'L'}${r.x.toFixed(1)} ${r.y.toFixed(1)}`);
    }
    rope.setAttribute('d', points.join(' '));
    // Its foot, a little below the line it rides: where the treacle drips.
    const foot = 12 * trip.scale;
    return { x: p.x - Math.sin(turn) * foot, y: p.y + Math.cos(turn) * foot };
  };
  const drip = (x: number, y: number, still = false): void => {
    const drop = el('circle', {
      class: still ? 'dm__drop dm__drop--still' : 'dm__drop',
      cx: (x + (random() - 0.5) * 8 * trip.scale).toFixed(1),
      cy: (y + (random() - 0.5) * 8 * trip.scale).toFixed(1),
      r: ((3 + random() * 3) * trip.scale).toFixed(1),
    });
    drops.append(drop);
    drop.addEventListener('animationend', () => drop.remove());
  };
  // Where along the spiral the middle of the frame is: sampled once, looked up
  // when the bucket sets off, so it rides through what the reader is looking at
  // even while the camera is still on its way to the next sentence.
  const samples = Array.from({ length: Math.ceil(spiralLength / 12) + 1 }, (_, i) => {
    const along = Math.min(spiralLength, i * 12);
    const p = spiral.getPointAtLength(along);
    return { along, x: p.x, y: p.y };
  });
  const inView = (): number => {
    let best = 0;
    let nearest = Number.POSITIVE_INFINITY;
    for (const sample of samples) {
      const d = Math.hypot(sample.x - camera.x, sample.y - camera.y);
      if (d < nearest) {
        nearest = d;
        best = sample.along;
      }
    }
    return best;
  };
  let tripTimer: ReturnType<typeof setTimeout> | undefined;
  const drawTreacle = (): void => {
    const now = toldNow();
    if (!now) {
      return;
    }
    clearTimeout(tripTimer);
    drops.replaceChildren();
    trip.scale = now.size / 20;
    const middle = inView();
    // Through the frame and out of it again: about as far either side of the
    // middle as the frame is wide, in the cup's units at the camera's zoom.
    const reach = Math.min(600, Math.max(200, (0.65 * view.w) / (view.k * camera.scale)));
    trip.from = clampAlong(middle + reach);
    trip.to = clampAlong(middle - reach);
    trip.t = 0;
    bucketSvg.setAttribute('data-on', '');
    shell.sound.play('splash', 0.25);
    if (reducedMotion) {
      // A still: the bucket is there on the sentence being told, brimming, with
      // treacle dripped on the words beneath it; then it is gone.
      const p = placeBucket(middle);
      for (let i = 0; i < 4; i += 1) {
        drip(p.x + (i - 1.5) * 12 * trip.scale, p.y + 8 * trip.scale, true);
      }
      tripTimer = setTimeout(() => {
        bucketSvg.removeAttribute('data-on');
        drops.replaceChildren();
      }, 2600);
      return;
    }
    trip.on = true;
    placeBucket(trip.from);
  };
  drawButton.addEventListener('click', drawTreacle);

  // --- Into the teapot: the whole cup spins down into the spout.
  const potLayer = shell.layer('dm__teapot-layer');
  potLayer.innerHTML = `<div class="dm__teapot">${TEAPOT_SVG}</div>`;
  const teapot = potLayer.querySelector<HTMLElement>('.dm__teapot');
  master.to(teapot, { opacity: 1, duration: 0.3 }, iTeapot);
  master.to(teapot, { '--lid': 1, duration: 0.3 }, iTeapot + 0.3);
  master.to(
    camera,
    reducedMotion
      ? { scale: 0.3, duration: 0.5, ease: 'power2.in' }
      : { scale: 0.02, angle: '+=720', duration: 0.7, ease: 'power3.in' },
    iTeapot + 0.35,
  );
  // Where the spout is, in the cup's own units, read when the dive starts.
  const spout = (axis: 'x' | 'y'): number => {
    const box = teapot?.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    if (!box) {
      return 0;
    }
    const sx = box.left + box.width * 0.78 - stageBox.left;
    const sy = box.top + box.height * 0.55 - stageBox.top;
    return axis === 'x' ? (sx - view.w / 2) / view.k : (sy - view.h / 2) / view.k + 30;
  };
  master.to(
    camera,
    { nx: () => spout('x'), ny: () => spout('y'), duration: 0.7, ease: 'power3.in' },
    iTeapot + 0.35,
  );
  master.to(teapot, { '--lid': 0, duration: 0.2 }, iTeapot + 0.95);
  if (!reducedMotion) {
    master.to(
      teapot,
      { scale: 1.06, yoyo: true, repeat: 1, duration: 0.05, transformOrigin: '50% 100%' },
      iTeapot + 0.95,
    );
  }
  master.to(mouse, { opacity: 0, duration: 0.3 }, iTeapot + 0.5);

  // --- The door in the tree. She walks off: the table pulls back and away, and a
  // tree with a door in its trunk opens. Through it, small and far, the warm hall
  // of doors, and at its centre the little door with the garden behind it; the
  // camera goes in toward the doorway, and the next chapter opens through it.
  const doorLayer = shell.layer('dm__wood');
  doorLayer.innerHTML =
    '<div class="dm__tree"><div class="dm__trunk"></div>' +
    '<div class="dm__tree-door"><div class="dm__hall"><div class="dm__hall-floor"></div>' +
    '<div class="dm__little-door"><div class="dm__garden"><div class="dm__rose-tree"></div></div></div></div>' +
    '<div class="dm__tree-leaf"></div></div></div>';
  const tree = doorLayer.querySelector<HTMLElement>('.dm__tree');
  const treeDoor = doorLayer.querySelector<HTMLElement>('.dm__tree-door');
  const leaving = [cloth, stage, potLayer];
  if (reducedMotion) {
    // Each beat is seen settled, and the door's beat is the last, seen as it
    // ends: the table gone, the tree standing with its door open and near. The
    // cuts sit inside the beat, so the teapot's own beat keeps its picture.
    master.to(leaving, { '--leave': 1, duration: 0.01 }, iDoor + 0.05);
    master.to(doorLayer, { opacity: 1, duration: 0.01 }, iDoor + 0.05);
    master.to(treeDoor, { '--open': 1, duration: 0.01 }, iDoor + 0.3);
    master.to(tree, { '--zoom': 1, duration: 0.01 }, iDoor + 0.6);
  } else {
    master.to(leaving, { '--leave': 1, duration: 0.45, ease: 'power2.in' }, iDoor);
    master.to(doorLayer, { opacity: 1, duration: 0.3 }, iDoor + 0.15);
    master.to(treeDoor, { '--open': 1, duration: 0.3, ease: 'power2.inOut' }, iDoor + 0.45);
    master.to(tree, { '--zoom': 1, duration: 0.4, ease: 'power2.in' }, iDoor + 0.6);
  }
  master.call(
    () => (master.time() >= iDoor + 0.45 ? shell.sound.play('whoosh', 0.4) : undefined),
    [],
    iDoor + 0.45,
  );

  // --- The join with the tea-party: its last frame is this cup, and the demo opens
  // under the same sepia it ended in, which lifts over the first half-beat.
  const arrive = shell.layer('dm__arrive');
  master.to(arrive, { opacity: 0, duration: reducedMotion ? 0.01 : 0.4 }, 0.05);
  master.call(() => shell.root.toggleAttribute('data-join', master.time() < 0.5), [], 0.5);
  shell.root.toggleAttribute('data-join', true);

  // --- The reader's hands on the cup. The first touch says what it can do. Drag
  // across it to stir: the treacle turns with your finger and swings back to the
  // sentence being told. A still, held finger reads ahead: the camera slides on
  // down the spiral to the next sentence, and while the Dormouse dozes the treacle
  // under the finger clears, as if scooped up; let go and it swings back.
  let holding = false;
  let ahead = 0;
  let stirVelocity = 0;
  let stirring = false;
  let stirLastX = 0;
  let touched = false;
  const nextTarget = (): (typeof targets)[number] | undefined => {
    const t = master.time();
    return targets.find((target) => target.at > t + 0.05);
  };
  stage.addEventListener('pointerdown', (event) => {
    holding = true;
    stirring = true;
    stirLastX = event.clientX;
    gsap.to(wake, { held: 1, duration: reducedMotion ? 0 : 0.25, onUpdate: applyEffects });
    if (!touched) {
      touched = true;
      shell.status(shell.ui.demoStirTreacle ?? '');
    }
  });
  // A lifted finger lets go; so does one the browser takes over to scroll the page.
  const letGo = (): void => {
    if (holding) {
      gsap.to(wake, { held: 0, duration: reducedMotion ? 0 : 0.6, onUpdate: applyEffects });
    }
    holding = false;
    stirring = false;
  };
  window.addEventListener('pointerup', letGo);
  window.addEventListener('pointercancel', letGo);
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!stirring || reducedMotion) {
        return;
      }
      stirVelocity += (event.clientX - stirLastX) * 0.25;
      stirLastX = event.clientX;
    },
    { passive: true },
  );
  // The stir's keyboard twin: a turn of the spoon. Under reduced motion it is a
  // still: the cup stands turned a little way round, then is back.
  const stirButton = shell.prop(shell.ui.demoStirTreacle ?? '', 'dm__prop-left dm__prop-stir');
  during(stirButton, iSpiral, iTeapot);
  let stirTimer: ReturnType<typeof setTimeout> | undefined;
  stirButton.addEventListener('click', () => {
    shell.sound.play('paper', 0.2);
    if (!reducedMotion) {
      stirVelocity += 240;
      return;
    }
    clearTimeout(stirTimer);
    stir = 40;
    apply();
    stirTimer = setTimeout(() => {
      stir = 0;
      apply();
    }, 1600);
  });

  // --- Pointer: the cloth and the cup lean a little toward it.
  shell.onFrame((dt) => {
    const now = master.time();
    shell.sound.level('drip', now >= iSpiral + 0.5 && now < iTeapot ? 0.6 : 0);
    if (reducedMotion) {
      return;
    }
    // The bucket's trip up the spiral, three seconds long, eased at both ends.
    if (trip.on) {
      trip.t = Math.min(1, trip.t + dt / 3.2);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * trip.t);
      const p = placeBucket(mix(trip.from, trip.to, eased));
      trip.dropClock += dt;
      if (trip.dropClock > 0.08 && trip.t < 0.94) {
        trip.dropClock = 0;
        drip(p.x, p.y);
      }
      if (trip.t >= 1) {
        trip.on = false;
        bucketSvg.removeAttribute('data-on');
      }
    }
    const k = Math.min(1, dt * 3);
    const targetX = shell.pointer.active ? shell.pointer.x : 0;
    const targetY = shell.pointer.active ? shell.pointer.y : 0;
    const px = mix(Number(cloth.style.getPropertyValue('--px') || 0), targetX, k);
    const py = mix(Number(cloth.style.getPropertyValue('--py') || 0), targetY, k);
    cloth.style.setProperty('--px', px.toFixed(3));
    cloth.style.setProperty('--py', py.toFixed(3));
    if (now < iTeapot + 0.35) {
      camera.nx = px * -10;
      camera.ny = py * -10;
    }
    // Reading ahead: a still, held finger (no stirring) eases the camera to the
    // next sentence; it swings back when the finger lifts.
    const wantAhead = holding && Math.abs(stirVelocity) < 0.5 && now < iTeapot;
    const next = wantAhead ? nextTarget() : undefined;
    if (next) {
      readAhead.x = next.x;
      readAhead.y = next.y;
      readAhead.angle = next.angle;
      readAhead.scale = next.scale;
    }
    ahead = mix(ahead, next ? 1 : 0, Math.min(1, dt * (next ? 1.5 : 3)));
    readAhead.amount = ahead;
    stir += stirVelocity * dt;
    stirVelocity *= 1 - Math.min(1, dt * 2);
    stir *= 1 - Math.min(1, dt * 1.2);
    if (Math.abs(stir) < 0.01 && Math.abs(stirVelocity) < 0.01) {
      stir = 0;
      stirVelocity = 0;
    }
    if (ahead < 0.001) {
      readAhead.amount = 0;
    }
    apply();
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
