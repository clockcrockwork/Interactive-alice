/**
 * The Cheshire Cat: the concept demo.
 *
 * A night wood in layers, trunks near and far that slide at their own rates as the
 * pointer moves, mist below, a moon above. The Cat sits on a bough and grins. It
 * vanishes and appears through an SVG mask: a gradient slid along its body, so it
 * can go quickly, or slowly, tail first and grin last, the grin staying on when
 * the rest has gone. At *we're all mad here* the wood itself tilts and turns a
 * madder colour. The reader can make it vanish and appear whenever they like.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix } from '../shell/shell.ts';
import './cheshire.css';

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
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
  wood.innerHTML =
    '<div class="cc__moon"></div>' +
    '<div class="cc__trees cc__trees--far"></div>' +
    '<div class="cc__trees cc__trees--mid"></div>' +
    `<div class="cc__bough-layer"><div class="cc__bough">${figure('cheshire-cat/on-bough')}</div></div>` +
    '<div class="cc__mist"></div>' +
    '<div class="cc__trees cc__trees--near"></div>' +
    `<div class="cc__alice">${figure('alice/silhouette')}</div>`;
  const bough = wood.querySelector<HTMLElement>('.cc__bough');
  const slide = wood.querySelector<SVGRectElement>('.cc__mask-slide');
  const grin = wood.querySelector<SVGGElement>('.cc__grin');
  const cat = wood.querySelector<SVGGElement>('.cc__cat');

  // --- Visibility, as one number: 1 is all there, 0 is gone. The mask's
  // gradient sits along the body; sliding it left hides tail first.
  const presence = { body: 1, grin: 1 };
  const apply = (): void => {
    // The body spans x 60..350. At 1 the gradient's white half covers it all; at 0
    // the black half has slid across it from the tail end.
    slide?.setAttribute('x', String(-780 + (1 - presence.body) * 530));
    grin?.setAttribute('opacity', presence.grin.toFixed(3));
  };
  presence.body = 1;
  apply();
  const show = (at: number, to: number, duration: number, ease = 'power2.inOut'): void => {
    master.to(
      presence,
      { body: to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: apply },
      at,
    );
    if (reducedMotion) {
      // A cross-fade of the whole cat rather than a sweep.
      master.fromTo(
        cat,
        { opacity: to === 1 ? 0 : 1 },
        { opacity: to === 1 ? 1 : 0, duration: 0.3 },
        at,
      );
    }
  };

  // A little wider grin at *Cheshire Puss*.
  if (!reducedMotion) {
    master.to(grin, { scale: 1.12, transformOrigin: '50% 50%', duration: 0.3 }, iPuss + 0.3);
  }
  // The paws point: the bough layer nudges left, then right.
  master.to(wood, { '--px': -1.5, duration: 0.4 }, iSigns + 0.15);
  master.to(wood, { '--px': 1.5, duration: 0.4 }, iSigns + 0.5);
  master.to(wood, { '--px': 0, duration: 0.4 }, iSigns + 0.9);
  // All mad here.
  master.to(
    wood,
    { '--mad': 1, '--tilt': reducedMotion ? 0 : 2.5, duration: 0.8, ease: 'sine.inOut' },
    iMad,
  );
  master.to(wood, { '--mad': 0, '--tilt': 0, duration: 0.8 }, iCroquet + 0.5);
  // Vanishings.
  show(iVanish1, 0, 0.25, 'power3.in');
  master.to(presence, { grin: 0, duration: 0.15, onUpdate: apply }, iVanish1 + 0.2);
  show(iBaby, 1, 0.2, 'power3.out');
  master.to(presence, { grin: 1, duration: 0.15, onUpdate: apply }, iBaby);
  show(iAgain - 0.3, 0, 0.2, 'power3.in');
  master.to(presence, { grin: 0, duration: 0.15, onUpdate: apply }, iAgain - 0.15);
  show(iAgain + 0.3, 1, 0.2, 'power3.out');
  master.to(presence, { grin: 1, duration: 0.1, onUpdate: apply }, iAgain + 0.3);
  // Slowly, tail first; the grin remains.
  show(iSlowly + 0.1, 0, 0.85, 'sine.inOut');
  master.to(presence, { grin: 0, duration: 0.5, onUpdate: apply }, iGrin + 0.45);
  if (!reducedMotion) {
    master.to(bough, { y: -40, scale: 1.08, duration: 0.8, ease: 'sine.inOut' }, iGrin);
  }

  // --- The reader's own vanishings.
  const vanishButton = shell.prop(shell.ui.demoVanish ?? '', 'cc__prop');
  let gone = false;
  const toggle = (): void => {
    gone = !gone;
    gsap.to(presence, {
      body: gone ? 0 : 1,
      duration: reducedMotion ? 0 : 0.7,
      ease: 'sine.inOut',
      onUpdate: apply,
    });
    gsap.to(presence, {
      grin: gone ? 0 : 1,
      duration: reducedMotion ? 0 : 0.4,
      delay: gone ? 0.6 : 0,
      onUpdate: apply,
    });
    if (reducedMotion) {
      gsap.set(cat, { opacity: gone ? 0 : 1 });
    }
  };
  vanishButton.addEventListener('click', toggle);
  bough?.addEventListener('click', toggle);
  master.call(
    () =>
      master.time() >= 0.5 && master.time() < iVanish1 ? vanishButton.show() : vanishButton.hide(),
    [],
    0.5,
  );
  master.call(() => vanishButton.hide(), [], iVanish1);
  // Scrolling into a story vanishing takes over from the reader's.
  master.call(
    () => {
      gone = false;
    },
    [],
    iVanish1 - 0.05,
  );

  // --- Pointer: the wood in depth.
  let px = 0;
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    const target = shell.pointer.active ? shell.pointer.x * 2 : 0;
    px = mix(px, target, Math.min(1, dt * 2.5));
    if (master.time() < iSigns || master.time() > iSigns + 1.3) {
      wood.style.setProperty('--px', px.toFixed(3));
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
