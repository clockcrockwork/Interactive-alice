/**
 * The Cheshire Cat: the concept demo.
 *
 * A night wood in layers that slide at their own rates with the pointer, mist
 * below, a moon above. The Cat sits on one of three boughs and grins; its eyes
 * follow the pointer and the grin widens as you come near. Tap anywhere in the
 * wood and it vanishes and appears on the bough nearest your finger, so the
 * reader is the one who makes it giddy. The wood answers a pointer with fireflies.
 * Two signposts point the ways to the Hatter and the March Hare, and press one to
 * walk that way. At *we're all mad here* the wood tilts, turns a madder colour,
 * and every tree grins. The Cat's own vanishings are through an SVG mask, a
 * gradient slid along its body: quick, or slow, tail first and grin last, the
 * grin staying on and finally rising into the moon.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './cheshire.css';
import { BARE_BOUGH_SVG, closeBough, GRIN_SVG, signSvg } from './figures.ts';

/** Where the boughs are, as a share of the stage; the Cat starts on the middle one. */
const BOUGHS = [
  { x: 24, y: 34, s: 0.8 },
  { x: 50, y: 26, s: 1 },
  { x: 78, y: 18, s: 0.7 },
];

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iBough = cue('bough');
  const iPuss = cue('puss');
  const iSigns = cue('signs');
  const iMad = cue('mad');
  const iCroquet = cue('croquet');
  const iVanish1 = cue('vanish-1');
  const iBaby = cue('baby');
  const iAgain = cue('again');
  const iSlowly = cue('slowly');
  const iGrin = cue('grin');

  const wood = shell.layer('cc__wood');
  const random = seeded(29);
  const starCount = 36;
  wood.innerHTML =
    '<div class="cc__moon"></div>' +
    `<div class="cc__stars">${Array.from(
      { length: starCount },
      (_, i) =>
        `<div class="cc__star" style="--i: ${i}; --sx: ${(random() * 100).toFixed(1)}%; --sy: ${(3 + random() * 40).toFixed(1)}%"></div>`,
    ).join('')}</div>` +
    '<div class="cc__trees cc__trees--far"></div>' +
    '<div class="cc__trees cc__trees--mid"></div>' +
    `<div class="cc__tree-grins">${Array.from(
      { length: 7 },
      (_, i) =>
        `<div class="cc__tree-grin" style="--x: ${(8 + i * 14 + random() * 4).toFixed(1)}%; --y: ${(30 + random() * 30).toFixed(1)}%">${GRIN_SVG}</div>`,
    ).join('')}</div>` +
    `<div class="cc__bough-layer">${BOUGHS.map(
      (b, i) =>
        `<div class="cc__bough" data-bough="${i}" style="--bx: ${b.x}%; --by: ${b.y}%; --bs: ${b.s}">` +
        `<div class="cc__bough-bare">${BARE_BOUGH_SVG}</div>${i === 1 ? figure('cheshire-cat/on-bough') : ''}</div>`,
    ).join('')}</div>` +
    '<div class="cc__mist"></div>' +
    '<div class="cc__trees cc__trees--near"></div>' +
    `<div class="cc__alice">${figure('alice/silhouette')}</div>` +
    `<div class="cc__moon-grin">${GRIN_SVG}</div>`;
  const boughs = [...wood.querySelectorAll<HTMLElement>('.cc__bough')];
  const catBox = wood.querySelector<HTMLElement>('.art[data-art="cheshire-cat/on-bough"]');
  const slide = wood.querySelector<SVGRectElement>('.cc__mask-slide');
  const grin = wood.querySelector<SVGGElement>('.cc__grin');
  const cat = wood.querySelector<SVGGElement>('.cc__cat');
  const pupils = wood.querySelector<SVGGElement>('.cc__pupils');
  const moon = wood.querySelector<HTMLElement>('.cc__moon');
  const moonGrin = wood.querySelector<HTMLElement>('.cc__moon-grin');
  const treeGrins = wood.querySelector<HTMLElement>('.cc__tree-grins');
  const fireflies = shell.layer('cc__fireflies');
  const chalk = shell.layer('cc__chalk');
  chalk.innerHTML = '<svg aria-hidden="true"><path d=""/></svg>';
  const chalkPath = chalk.querySelector<SVGPathElement>('path');
  const aliceBox = wood.querySelector<HTMLElement>('.cc__alice');
  const stars = [...wood.querySelectorAll<HTMLElement>('.cc__star')];
  // The join from Pig and Pepper: it ended looking up at this bough, close, with
  // the grin just arrived on it. The first beat settles from that look into the
  // wood's own framing, and the Cat is there under it.
  const join = shell.layer('cc__join');
  join.innerHTML = closeBough('cc__close');
  const close = join.querySelector<HTMLElement>('.cc__close');
  if (reducedMotion) {
    gsap.set(close, { scale: 1.8 });
    master.fromTo(join, { opacity: 1 }, { opacity: 0, duration: 0.3 }, iBough + 0.25);
  } else {
    master.fromTo(
      close,
      { scale: 1.8, y: 0 },
      { scale: 1, y: 0, duration: 0.7, ease: 'power2.inOut' },
      iBough + 0.05,
    );
    master.fromTo(join, { opacity: 1 }, { opacity: 0, duration: 0.35 }, iBough + 0.4);
  }
  const signs = shell.layer('cc__signs');
  signs.innerHTML =
    `<button type="button" class="cc__sign cc__sign--left" aria-label="${shell.ui.demoWayHatter ?? ''}">${signSvg('left')}</button>` +
    `<button type="button" class="cc__sign cc__sign--right" aria-label="${shell.ui.demoWayHare ?? ''}">${signSvg('right')}</button>`;
  const signLeft = signs.querySelector<HTMLButtonElement>('.cc__sign--left');
  const signRight = signs.querySelector<HTMLButtonElement>('.cc__sign--right');
  const hint = document.createElement('p');
  hint.className = 'cc__hint';
  hint.textContent = shell.ui.demoTeleportHint ?? '';
  shell.stage.append(hint);

  // --- Presence, as numbers: 1 is all there, 0 is gone. The mask's gradient sits
  // along the body; sliding it hides tail first.
  const presence = { body: 1, grin: 1 };
  const apply = (): void => {
    slide?.setAttribute('x', String(-780 + (1 - presence.body) * 530));
    grin?.setAttribute('opacity', presence.grin.toFixed(3));
  };
  apply();
  const show = (at: number, to: number, duration: number, ease = 'power2.inOut'): void => {
    master.to(
      presence,
      { body: to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: apply },
      at,
    );
    if (reducedMotion) {
      master.fromTo(
        cat,
        { opacity: to === 1 ? 0 : 1 },
        { opacity: to === 1 ? 1 : 0, duration: 0.3 },
        at,
      );
    }
  };

  // --- The story's own moments.
  if (!reducedMotion) {
    master.to(grin, { '--wide': 0.4, duration: 0.3 }, iPuss + 0.3);
    master.to(grin, { '--wide': 0, duration: 0.5 }, iPuss + 0.9);
  }
  master.to(wood, { '--px': -1.5, duration: 0.4 }, iSigns + 0.15);
  master.to(wood, { '--px': 1.5, duration: 0.4 }, iSigns + 0.5);
  master.to(wood, { '--px': 0, duration: 0.4 }, iSigns + 0.9);
  master.to(
    wood,
    { '--mad': 1, '--tilt': reducedMotion ? 0 : 2.5, duration: 0.8, ease: 'sine.inOut' },
    iMad,
  );
  master.to(treeGrins, { opacity: 1, duration: 0.6 }, iMad + 0.3);
  master.to(wood, { '--mad': 0, '--tilt': 0, duration: 0.8 }, iCroquet + 0.5);
  master.to(treeGrins, { opacity: 0, duration: 0.5 }, iCroquet + 0.5);
  show(iVanish1, 0, 0.25, 'power3.in');
  master.to(presence, { grin: 0, duration: 0.15, onUpdate: apply }, iVanish1 + 0.2);
  show(iBaby, 1, 0.2, 'power3.out');
  master.to(presence, { grin: 1, duration: 0.15, onUpdate: apply }, iBaby);
  show(iAgain - 0.3, 0, 0.2, 'power3.in');
  master.to(presence, { grin: 0, duration: 0.15, onUpdate: apply }, iAgain - 0.15);
  show(iAgain + 0.3, 1, 0.2, 'power3.out');
  master.to(presence, { grin: 1, duration: 0.1, onUpdate: apply }, iAgain + 0.3);
  show(iSlowly + 0.1, 0, 0.85, 'sine.inOut');
  // The grin stays, then goes up to the moon, and the moon keeps the smile.
  master.to(presence, { grin: 0, duration: 0.3, onUpdate: apply }, iGrin + 0.4);
  master.fromTo(
    moonGrin,
    { opacity: 0, y: '30vh', scale: 2.4 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.inOut' },
    iGrin + 0.25,
  );
  master.to(moon, { '--crescent': 1, duration: 0.5, ease: 'power2.inOut' }, iGrin + 0.5);
  // The stars gather into a grin under the moon as the Cat's own goes out.
  stars.forEach((star, i) => {
    const t = i / (starCount - 1);
    const sx = 62 + t * 24;
    const sy = 30 + Math.sin(t * Math.PI) * 9;
    master.to(
      star,
      {
        '--sx': `${sx.toFixed(1)}%`,
        '--sy': `${sy.toFixed(1)}%`,
        duration: reducedMotion ? 0.01 : 0.6,
        ease: 'power2.inOut',
      },
      iGrin + 0.3 + (reducedMotion ? 0 : (i % 6) * 0.015),
    );
  });

  // --- The reader's Cat: it looks at you, grins wider as you come near, and goes
  // wherever you tap.
  const currentBough = (): HTMLElement | undefined =>
    boughs.find((b) => b.contains(catBox as Node));
  let teleporting = false;
  const nearestBough = (clientX: number, clientY: number): HTMLElement | undefined => {
    let best: HTMLElement | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const bough of boughs) {
      const box = bough.getBoundingClientRect();
      const d = Math.hypot(box.left + box.width / 2 - clientX, box.top + box.height / 2 - clientY);
      if (d < bestDistance) {
        bestDistance = d;
        best = bough;
      }
    }
    return best;
  };
  // A tap while the Cat is still travelling is kept, and honoured when it lands.
  let pendingBough: HTMLElement | undefined;
  const sendTo = (bough: HTMLElement | undefined): void => {
    if (!bough || !catBox || bough === currentBough()) {
      return;
    }
    if (teleporting) {
      pendingBough = bough;
      return;
    }
    teleporting = true;
    const vanishTime = reducedMotion ? 0 : 0.35;
    gsap.to(presence, {
      body: 0,
      grin: 0,
      duration: vanishTime,
      ease: 'power3.in',
      onUpdate: apply,
    });
    gsap.delayedCall(vanishTime + 0.15, () => {
      bough.append(catBox);
      gsap.to(presence, {
        body: 1,
        grin: 1,
        duration: reducedMotion ? 0 : 0.4,
        ease: 'power3.out',
        onUpdate: apply,
        onComplete: () => {
          teleporting = false;
          const next = pendingBough;
          pendingBough = undefined;
          sendTo(next);
        },
      });
    });
  };
  wood.addEventListener('click', (event) => {
    if (master.time() >= iVanish1) {
      return;
    }
    sendTo(nearestBough(event.clientX, event.clientY));
  });
  catBox?.addEventListener('click', (event) => {
    event.stopPropagation();
    // A tap on the Cat itself sends it somewhere else: you make it giddy.
    const others = boughs.filter((b) => b !== currentBough());
    sendTo(others[Math.floor(random() * others.length)]);
  });
  const callButton = shell.prop(shell.ui.demoCallCat ?? '', 'cc__prop cc__prop--call');
  callButton.addEventListener('click', () => {
    const others = boughs.filter((b) => b !== currentBough());
    sendTo(others[Math.floor(random() * others.length)]);
  });
  master.call(
    () => {
      const inside = master.time() < iVanish1;
      if (inside) {
        callButton.show();
        hint.dataset.shown = '';
      } else {
        callButton.hide();
        delete hint.dataset.shown;
      }
    },
    [],
    0.02,
  );
  callButton.show();
  hint.dataset.shown = '';
  master.call(
    () => {
      callButton.hide();
      delete hint.dataset.shown;
      if (master.time() >= iVanish1 && currentBough() !== boughs[1]) {
        boughs[1]?.append(catBox as Node);
      }
    },
    [],
    iVanish1,
  );

  // --- Signposts: press one and the wood walks that way for a moment.
  const walk = (direction: number): void => {
    gsap.to(wood, {
      '--px': direction * 6,
      duration: reducedMotion ? 0 : 0.9,
      ease: 'power2.inOut',
    });
    gsap.to(wood, {
      '--px': 0,
      duration: reducedMotion ? 0 : 1.2,
      delay: 1.1,
      ease: 'power2.inOut',
    });
    for (let i = 0; i < 12; i += 1) {
      spawnFirefly(
        shell.stage.clientWidth * (direction < 0 ? 0.1 + random() * 0.3 : 0.6 + random() * 0.3),
        shell.stage.clientHeight * (0.4 + random() * 0.4),
      );
    }
  };
  signLeft?.addEventListener('click', () => walk(-1));
  signRight?.addEventListener('click', () => walk(1));
  master.call(
    () => {
      const inside = master.time() >= iSigns && master.time() < iVanish1;
      signLeft?.toggleAttribute('data-shown', inside);
      signRight?.toggleAttribute('data-shown', inside);
    },
    [],
    iSigns,
  );
  master.call(
    () => {
      const inside = master.time() >= iSigns && master.time() < iVanish1;
      signLeft?.toggleAttribute('data-shown', inside);
      signRight?.toggleAttribute('data-shown', inside);
    },
    [],
    iVanish1,
  );

  // --- A way in the mist: draw with a finger across the lower wood and a chalk
  // line glows there, and the fireflies take that way for a while.
  let drawing: { x: number; y: number }[] | undefined;
  const stagePoint = (event: PointerEvent): { x: number; y: number } => {
    const box = shell.stage.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  const chalkD = (points: { x: number; y: number }[]): string =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  let followPath: { x: number; y: number }[] = [];
  let followClock = 0;
  shell.stage.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button, .art') || reducedMotion) {
      return;
    }
    const p = stagePoint(event);
    if (p.y < shell.stage.clientHeight * 0.55) {
      return;
    }
    drawing = [p];
    gsap.killTweensOf(chalk);
    gsap.set(chalk, { opacity: 1 });
    chalkPath?.setAttribute('d', chalkD(drawing));
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!drawing) {
        return;
      }
      const p = stagePoint(event);
      const last = drawing[drawing.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) > 6) {
        drawing.push(p);
        chalkPath?.setAttribute('d', chalkD(drawing));
      }
    },
    { passive: true },
  );
  window.addEventListener('pointerup', () => {
    if (!drawing) {
      return;
    }
    if (drawing.length > 4) {
      followPath = drawing;
      followClock = 6;
    }
    drawing = undefined;
    gsap.to(chalk, { opacity: 0, duration: 5, ease: 'power2.in' });
  });

  // --- Fireflies, wherever the pointer goes.
  let flies = 0;
  function spawnFirefly(x: number, y: number): void {
    if (flies > 60 || reducedMotion) {
      return;
    }
    flies += 1;
    const fly = document.createElement('div');
    fly.className = 'cc__firefly';
    fly.style.setProperty('--dx', ((random() - 0.5) * 120).toFixed(1));
    fly.style.setProperty('--dy', (-40 - random() * 120).toFixed(1));
    gsap.set(fly, { x, y });
    fireflies.append(fly);
    fly.addEventListener('animationend', () => {
      fly.remove();
      flies -= 1;
    });
  }
  let lastFly = 0;
  window.addEventListener(
    'pointermove',
    (event) => {
      const now = performance.now();
      if (now - lastFly < 70 || shell.paused) {
        return;
      }
      lastFly = now;
      const box = shell.stage.getBoundingClientRect();
      spawnFirefly(event.clientX - box.left, event.clientY - box.top);
    },
    { passive: true },
  );

  // --- Per frame: the eyes and the grin answer the pointer; the wood has depth.
  let px = 0;
  let wide = 0;
  let flyClock = 0;
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    // Alice looks toward whichever bough the Cat is on.
    const on = currentBough();
    if (on && aliceBox) {
      const bx = on.getBoundingClientRect().left + on.getBoundingClientRect().width / 2;
      const ax = aliceBox.getBoundingClientRect().left + aliceBox.getBoundingClientRect().width / 2;
      aliceBox.style.setProperty('--face', bx >= ax ? '1' : '-1');
    }
    // Fireflies take the drawn way while it lasts.
    if (followClock > 0 && followPath.length > 1) {
      followClock -= dt;
      flyClock += dt;
      if (flyClock > 0.09) {
        flyClock = 0;
        const point = followPath[Math.floor(random() * followPath.length)];
        if (point) {
          spawnFirefly(point.x + (random() - 0.5) * 12, point.y + (random() - 0.5) * 12);
        }
      }
    }
    const target = shell.pointer.active ? shell.pointer.x * 2 : 0;
    px = mix(px, target, Math.min(1, dt * 2.5));
    if (master.time() < iSigns || master.time() > iSigns + 1.3) {
      wood.style.setProperty('--px', px.toFixed(3));
    }
    if (catBox && pupils && shell.pointer.active) {
      const box = catBox.getBoundingClientRect();
      const cx = box.left + box.width * 0.75;
      const cy = box.top + box.height * 0.37;
      const pointerX = ((shell.pointer.x + 1) / 2) * window.innerWidth;
      const pointerY = ((shell.pointer.y + 1) / 2) * window.innerHeight;
      const dx = pointerX - cx;
      const dy = pointerY - cy;
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, distance / 300) * 5;
      pupils.style.setProperty('--look-x', ((dx / distance) * reach).toFixed(2));
      pupils.style.setProperty('--look-y', ((dy / distance) * reach).toFixed(2));
      const near = Math.max(0, 1 - distance / 260);
      wide = mix(wide, near, Math.min(1, dt * 4));
      shell.sound.level('purr', presence.body > 0.5 ? wide * 0.8 : 0);
      if (master.time() < iVanish1) {
        grin?.style.setProperty('--wide', wide.toFixed(3));
      }
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
