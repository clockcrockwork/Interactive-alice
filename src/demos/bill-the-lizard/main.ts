/**
 * Bill the Lizard: the concept demo.
 *
 * The reader is Bill. Sent down the chimney, the camera descends through
 * layers that move at their own rates: clouds hardly at all, the roof slowly, the
 * brick shaft rushing past. Then a foot rises from below, waits, and the kick
 * sends the camera up like a sky-rocket, spinning, past the roof and into the
 * clouds, to come down by the hedge, dazed, among the others with the brandy.
 * The parallax is vertical, and the screen itself takes the kick.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, seeded } from '../shell/shell.ts';
import './bill.css';

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iDescend = cue('descend');
  const iFoot = cue('foot');
  const iKick = cue('kick');
  const iLaunch = cue('launch');
  const iLand = cue('land');
  const iBrandy = cue('brandy');

  const world = shell.layer('bl__world');
  const random = seeded(17);
  world.innerHTML =
    '<div class="bl__layer bl__clouds"></div>' +
    '<div class="bl__layer bl__house"><div class="bl__roof"></div><div class="bl__stack"></div><div class="bl__hedge"></div>' +
    `<div class="bl__crowd">${figure('guinea-pigs')}</div></div>` +
    `<div class="bl__layer bl__chimney">${Array.from(
      { length: 18 },
      () =>
        `<div class="bl__soot" style="--x: ${(35 + random() * 30).toFixed(1)}%; --y: ${(50 + random() * 40).toFixed(1)}%; --delay: ${(-random() * 2.6).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
    ).join('')}</div>` +
    `<div class="bl__foot">${figure('alice/foot')}</div>` +
    `<div class="bl__bill">${figure('bill')}</div>`;
  const chimney = world.querySelector<HTMLElement>('.bl__chimney');
  const foot = world.querySelector<HTMLElement>('.bl__foot');
  const bill = world.querySelector<HTMLElement>('.bl__bill');
  const crowd = world.querySelector<HTMLElement>('.bl__crowd');
  const flash = shell.layer('bl__flash');

  // --- The camera: height in px above the roof line, spin, and daze.
  const camera = { y: 0, spin: 0, daze: 0 };
  const apply = (): void => {
    world.style.setProperty('--cam', camera.y.toFixed(1));
    world.style.setProperty('--spin', camera.spin.toFixed(2));
    world.style.setProperty('--daze', camera.daze.toFixed(3));
  };
  apply();

  // Down the chimney: the shaft fades in around the camera as it sinks.
  master.to(camera, { y: -300, duration: 1, ease: 'power1.in', onUpdate: apply }, iDescend - 0.4);
  master.to(chimney, { opacity: 1, duration: 0.5 }, iDescend);
  master.to(
    camera,
    { y: -1500, duration: iFoot - iDescend + 0.5, ease: 'none', onUpdate: apply },
    iDescend + 0.2,
  );
  master.fromTo(
    foot,
    { y: '30vh' },
    { y: '-32vh', duration: 0.8, ease: 'power2.out' },
    iFoot + 0.2,
  );
  if (!reducedMotion) {
    master.to(
      foot,
      { rotation: 6, duration: 0.15, yoyo: true, repeat: 3, transformOrigin: '50% 100%' },
      iFoot + 1,
    );
  }

  // --- The kick: a burst in time. The reader gives it, or the story does.
  let kicked = false;
  const kickButton = shell.prop(shell.ui.demoKick ?? '', 'bl__prop');
  const target = document.createElement('button');
  target.type = 'button';
  target.className = 'bl__kick-target';
  target.setAttribute('aria-label', shell.ui.demoKick ?? '');
  shell.stage.append(target);
  const kick = (): void => {
    if (kicked) {
      return;
    }
    kicked = true;
    kickButton.hide();
    shell.sound.play('whoosh');
    delete target.dataset.shown;
    const burst = gsap.timeline();
    burst.to(foot, { y: '-70vh', duration: reducedMotion ? 0 : 0.12, ease: 'power4.in' }, 0);
    burst.fromTo(flash, { opacity: 0 }, { opacity: 0.8, duration: 0.05 }, 0.1);
    burst.to(flash, { opacity: 0, duration: 0.4 }, 0.15);
    burst.to(foot, { opacity: 0, duration: 0.2 }, 0.3);
    burst.to(chimney, { opacity: 0, duration: 0.5 }, 0.2);
    if (reducedMotion) {
      burst.set(camera, { y: 1600, onUpdate: apply }, 0.1);
    } else {
      burst.to(camera, { y: 1600, duration: 1.4, ease: 'power3.out', onUpdate: apply }, 0.1);
      burst.to(camera, { spin: 720, duration: 1.6, ease: 'power2.out', onUpdate: apply }, 0.1);
    }
  };
  kickButton.addEventListener('click', kick);
  target.addEventListener('click', kick);
  master.call(
    () => {
      const inside = master.time() >= iKick && master.time() < iKick + 0.8;
      if (inside && !kicked) {
        kickButton.show();
        target.dataset.shown = '';
      } else {
        kickButton.hide();
        delete target.dataset.shown;
      }
    },
    [],
    iKick,
  );
  master.call(() => (master.time() >= iKick + 0.8 ? kick() : undefined), [], iKick + 0.8);
  master.call(
    () => {
      // Scrolling back above the kick puts everything back for another go.
      if (master.time() < iKick + 0.8 && kicked) {
        kicked = false;
        gsap.set(camera, { spin: 0, daze: 0 });
        gsap.set(foot, { opacity: 1 });
        gsap.set(chimney, { opacity: 1 });
        master.invalidate();
      }
    },
    [],
    iKick + 0.79,
  );

  // --- Up, then down by the hedge.
  master.to([chimney, foot], { opacity: 0, duration: 0.3 }, iLaunch);
  master.to(camera, { y: 2200, duration: 0.8, ease: 'power1.out', onUpdate: apply }, iLaunch + 0.2);
  // Down past the roof to the hedge on the ground.
  master.to(
    camera,
    { y: -1300, spin: reducedMotion ? 0 : 1080, duration: 0.9, ease: 'power2.in', onUpdate: apply },
    iLand,
  );
  master.to(
    camera,
    { spin: reducedMotion ? 0 : 1080, daze: 1, duration: 0.3, onUpdate: apply },
    iLand + 0.85,
  );
  master.to(crowd, { opacity: 1, duration: 0.3 }, iLand + 0.7);
  master.to(bill, { opacity: 1, y: -10, duration: 0.4 }, iBrandy);
  master.to(
    camera,
    { daze: 0.25, duration: 0.8, ease: 'sine.inOut', onUpdate: apply },
    iBrandy + 0.2,
  );
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
