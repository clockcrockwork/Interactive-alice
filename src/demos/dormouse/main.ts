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
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './dormouse.css';
import { MOUSE_SVG, TEAPOT_SVG } from './figures.ts';

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

function mount(shell: DemoShell): void {
  const { master, ambient, reducedMotion } = shell;
  const iSpiral = shell.cue('spiral');
  const iDoze = shell.cue('doze');
  const iShriek = shell.cue('shriek');
  const iMuchness = shell.cue('muchness');
  const iTeapot = shell.cue('teapot');

  // --- Layers.
  const cloth = shell.layer('dm__cloth');
  const stage = shell.layer('dm__stage');
  const svg = el('svg', {
    class: 'dm__svg',
    viewBox: '0 0 1000 1000',
    preserveAspectRatio: 'xMidYMid slice',
  });
  stage.append(svg);

  const defs = el('defs');
  defs.innerHTML =
    '<filter id="dm-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>' +
    '<feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"/></filter>' +
    '<filter id="dm-sleep" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0"/></filter>' +
    '<filter id="dm-wobble" x="-10%" y="-10%" width="120%" height="120%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="4" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>' +
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
  // Three little sisters at the bottom of the well.
  const sisters = el('g', { class: 'dm__sisters' });
  for (let i = 0; i < 3; i += 1) {
    const sister = el('g', { transform: `rotate(${i * 120} 500 500)` });
    sister.append(
      el('circle', { cx: '500', cy: '470', r: '9', fill: 'var(--dm-ink)', 'fill-opacity': '0.5' }),
      el('circle', { cx: '500', cy: '458', r: '5', fill: 'var(--dm-ink)', 'fill-opacity': '0.6' }),
    );
    sisters.append(sister);
  }
  cameraGroup.append(sisters);

  const wobbleGroup = el('g', { filter: 'url(#dm-wobble)' });
  const sleepGroup = el('g', { filter: 'url(#dm-sleep)' });
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
  // Fit: the tale must end before the spiral does.
  const fitTale = (): void => {
    const room = spiral.getTotalLength() * 0.97;
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
  const camera: Camera = { x: CENTRE, y: CENTRE, angle: 0, scale: 0.95, nx: 0, ny: 0 };
  const apply = (): void => {
    const { x, y, angle, scale, nx, ny } = camera;
    cameraGroup.setAttribute(
      'transform',
      `translate(${CENTRE + nx} ${CENTRE - 30 + ny}) scale(${scale}) rotate(${-angle}) translate(${-x} ${-y})`,
    );
  };
  apply();

  let charIndex = 0;
  let lastAngle = 0;
  const targets: {
    beat: number;
    at: number;
    x: number;
    y: number;
    angle: number;
    scale: number;
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
    });
    charIndex += length;
  }

  const first = targets[0];
  if (first) {
    // Before the tale, the whole cup; at the first word, dive in.
    master.set(camera, { x: CENTRE, y: CENTRE, angle: 0, scale: 0.95 }, 0);
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

  // --- Dozing: the treacle blurs, the telling slows; a shriek clears it.
  const sleepBlur = defs.querySelector('#dm-sleep feGaussianBlur');
  const wobble = defs.querySelector('#dm-wobble feDisplacementMap');
  const blur = { amount: 0, wobble: 0 };
  const applyEffects = (): void => {
    sleepBlur?.setAttribute('stdDeviation', blur.amount.toFixed(2));
    wobble?.setAttribute('scale', blur.wobble.toFixed(1));
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
  mouseLayer.innerHTML = `<div class="dm__mouse">${MOUSE_SVG}</div>`;
  const mouse = mouseLayer.querySelector<HTMLElement>('.dm__mouse');
  const pinchButton = shell.prop(shell.ui.demoPinch ?? '', 'dm__prop-pinch');
  let awakeTimer: ReturnType<typeof setTimeout> | undefined;
  const pinch = (): void => {
    if (!mouse) {
      return;
    }
    mouse.setAttribute('data-shriek', '');
    gsap.to(mouse, { '--awake': 1, duration: 0.1 });
    gsap.to(blur, { amount: 0, duration: 0.2, onUpdate: applyEffects });
    if (!reducedMotion) {
      gsap.fromTo(
        blur,
        { wobble: 30 },
        { wobble: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)', onUpdate: applyEffects },
      );
    }
    clearTimeout(awakeTimer);
    awakeTimer = setTimeout(() => {
      mouse.removeAttribute('data-shriek');
      gsap.to(mouse, { '--awake': 0, duration: 0.8 });
    }, 2600);
  };
  mouse?.addEventListener('pointerdown', pinch);
  pinchButton.addEventListener('click', pinch);
  // The button is offered while the Dormouse is nodding off.
  master.call(() => (master.time() >= iDoze ? pinchButton.show() : pinchButton.hide()), [], iDoze);
  master.call(
    () => (master.time() >= iShriek + 0.5 ? pinchButton.hide() : pinchButton.show()),
    [],
    iShriek + 0.5,
  );
  // The story's own pinch.
  master.call(() => (master.time() >= iShriek + 0.05 ? pinch() : undefined), [], iShriek + 0.05);
  master.fromTo(mouse, { '--awake': 0 }, { '--awake': 1, duration: 0.05 }, iSpiral - 0.9);
  master.to(mouse, { '--awake': 0, duration: 0.8 }, iDoze + 0.4);

  // --- Treacle drips, in the goo filter; the three sisters drift round the well.
  const drips = shell.layer('dm__drips-layer');
  const dripBox = document.createElement('div');
  dripBox.className = 'dm__drips';
  const random = seeded(31);
  dripBox.innerHTML = Array.from(
    { length: 6 },
    (_, i) =>
      `<div class="dm__drip" style="left: ${8 + i * 15 + random() * 6}%; --delay: ${(-random() * 6).toFixed(2)}s"></div>`,
  ).join('');
  drips.append(dripBox);
  master.fromTo(dripBox, { '--drips': 0 }, { '--drips': 1, duration: 0.6 }, iSpiral + 0.5);
  master.to(dripBox, { '--drips': 0, duration: 0.5 }, iTeapot);
  if (!reducedMotion) {
    ambient.to(
      sisters,
      { rotation: 360, svgOrigin: '500 500', duration: 40, ease: 'none', repeat: -1 },
      0,
    );
  }

  // --- Everything that begins with an M: the letter itself, taken from the line.
  const letters = shell.layer('dm__letters');
  const source = shell.beats
    .flatMap((beat) => beat.lines)
    .find((line) => /\b[A-Z]\.$/.test(line.textContent?.trim() ?? ''));
  const letter = source?.textContent?.trim().slice(-2, -1) ?? '';
  if (letter) {
    letters.innerHTML = Array.from(
      { length: 10 },
      (_, i) =>
        `<span class="dm__letter" style="--lx: ${6 + i * 9.5}%; --ly: ${random().toFixed(2)}; --delay: ${(-random() * 7).toFixed(2)}s">${letter}</span>`,
    ).join('');
    master.to(letters, { opacity: 1, duration: 0.3 }, iMuchness);
    master.to(letters, { opacity: 0, duration: 0.3 }, iTeapot);
  }

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
    const ctm = svg.getScreenCTM();
    if (!box || !ctm) {
      return 0;
    }
    const point = new DOMPoint(
      box.left + box.width * 0.78,
      box.top + box.height * 0.55,
    ).matrixTransform(ctm.inverse());
    return axis === 'x' ? point.x - CENTRE : point.y - (CENTRE - 30);
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

  // --- Pointer: the cloth and the cup lean a little toward it.
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const k = Math.min(1, dt * 3);
    const targetX = shell.pointer.active ? shell.pointer.x : 0;
    const targetY = shell.pointer.active ? shell.pointer.y : 0;
    const px = mix(Number(cloth.style.getPropertyValue('--px') || 0), targetX, k);
    const py = mix(Number(cloth.style.getPropertyValue('--py') || 0), targetY, k);
    cloth.style.setProperty('--px', px.toFixed(3));
    cloth.style.setProperty('--py', py.toFixed(3));
    if (master.time() < iTeapot + 0.35) {
      camera.nx = px * -10;
      camera.ny = py * -10;
      apply();
    }
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
