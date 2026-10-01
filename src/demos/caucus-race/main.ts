/**
 * The Caucus-race: the concept demo.
 *
 * The party stands in a ring on the bank, in CSS 3D, and the camera walks round
 * the ring as the story goes on: rotation is the parallax, the near runner sweeps
 * past and the far one crawls. When the race begins everyone runs round the
 * course, each at their own pace, starting and stopping when they like; the
 * reader may tap any of them to make them rest or run, since that is the rule.
 * When the Dodo calls it over they crowd round, then round Alice, and the comfits
 * come down.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './caucus.css';
import { RUNNERS, type RunnerKind, THIMBLE_SVG } from './figures.ts';

interface Runner {
  kind: RunnerKind;
  el: HTMLButtonElement;
  /** Angle round the course, degrees, and how fast this one runs. */
  angle: number;
  pace: number;
  running: boolean;
}

function mount(shell: DemoShell): void {
  const { master, reducedMotion } = shell;
  const cue = shell.cue;
  const iBank = cue('bank');
  const iProposal = cue('proposal');
  const iCourse = cue('course');
  const iRunning = cue('running');
  const iOver = cue('over');
  const iThinking = cue('thinking');
  const iShe = cue('she');
  const iComfits = cue('comfits');
  const iThimble = cue('thimble');
  const iBow = cue('bow');

  shell.layer('cr__sky');
  const world = shell.layer('cr__world');
  const ring = document.createElement('div');
  ring.className = 'cr__ring';
  ring.innerHTML =
    '<svg class="cr__course" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" pathLength="1"/></svg>';
  world.append(ring);
  const course = ring.querySelector<SVGCircleElement>('.cr__course circle');
  // The pool's water in the foreground: the party has just swum to this bank and
  // we see them from the water, until the camera rises onto the bank with them.
  const water = shell.layer('cr__water');

  // --- The runners, evenly round the ring. Each is a real button.
  const random = seeded(3);
  const runners: Runner[] = RUNNERS.map((kind, index) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'cr__runner';
    el.dataset.kind = kind;
    el.setAttribute('aria-label', shell.ui.demoRunToggle ?? '');
    el.setAttribute('aria-pressed', 'false');
    el.setAttribute('data-drip', '');
    el.style.setProperty('--i', String(index));
    el.innerHTML = figure(`runner/${kind}`);
    ring.append(el);
    return {
      kind,
      el,
      angle: (index / RUNNERS.length) * 360,
      pace: 28 + random() * 26,
      running: false,
    };
  });
  const dodo = runners.find((runner) => runner.kind === 'dodo');
  const alice = runners.find((runner) => runner.kind === 'alice');
  const setRunning = (runner: Runner, running: boolean): void => {
    runner.running = running;
    runner.el.setAttribute('aria-pressed', String(running));
  };
  // Pick a runner as your own: it wears a mark, runs a little faster, and every
  // tap on it gives it a spurt. Any other runner still rests or runs on a tap.
  let mine: Runner | undefined;
  for (const runner of runners) {
    runner.el.addEventListener('click', () => {
      if (racing && mine === runner) {
        runner.pace += 14;
        setRunning(runner, true);
        runner.el.removeAttribute('data-spurt');
        void runner.el.offsetWidth;
        runner.el.setAttribute('data-spurt', '');
        return;
      }
      if (racing && !mine) {
        mine = runner;
        runner.el.setAttribute('data-mine', '');
        runner.el.setAttribute(
          'aria-label',
          `${shell.ui.demoRunToggle ?? ''} (${shell.ui.demoMyRunner ?? ''})`,
        );
        setRunning(runner, true);
        return;
      }
      setRunning(runner, !runner.running);
    });
  }
  const runButton = shell.prop(shell.ui.demoRaceStart ?? '', 'cr__prop');
  runButton.addEventListener('click', () => {
    for (const runner of runners) {
      setRunning(runner, true);
    }
  });

  // --- The gathering: 0 is the ring, 1 is a huddle round `centre`.
  const gather = { amount: 0, centre: 0, spread: 60 };
  // --- The arrival: 1 is the party as the pool left it, a loose two-row group
  // along the water's edge on the near side of the ring, feet still in the
  // water; 0 is the ring. Each place is a point on the bank turned into the
  // ring's own angle and radius, so the same transform draws both.
  const arrive = { amount: 1 };
  const landed = runners.map((_, index) => {
    const across = (index / (runners.length - 1)) * 2 - 1;
    const x = across * 0.95;
    const z = 0.1 + (index % 2) * 0.3;
    return {
      angle: (Math.atan2(x, z) * 180) / Math.PI,
      radius: Math.hypot(x, z),
      sink: 92 - (index % 2) * 22,
    };
  });
  let racing = false;
  const apply = (): void => {
    runners.forEach((runner, index) => {
      const offset = ((index / runners.length) * 2 - 1) * gather.spread;
      let angle = mix(runner.angle, gather.centre + offset, gather.amount);
      let radius = mix(1, 0.5, gather.amount);
      const place = landed[index];
      if (place && arrive.amount > 0.0001) {
        angle = mix(angle, place.angle, arrive.amount);
        radius = mix(radius, place.radius, arrive.amount);
      }
      runner.el.style.setProperty('--a', angle.toFixed(2));
      runner.el.style.setProperty('--r', radius.toFixed(3));
      runner.el.style.setProperty('--y', ((place?.sink ?? 0) * arrive.amount).toFixed(1));
    });
  };
  apply();

  // --- The camera, cue by cue: a walk round the party, then round the course.
  // It starts low, at the water, and rises onto the bank during the first beat.
  const camera = { spin: 0, tilt: 1, dolly: -200, lift: -36 };
  // While your runner runs, the camera runs with it: this offset turns the ring
  // so your runner stays in front, and eases away again after the race.
  let follow = 0;
  const applyCamera = (): void => {
    ring.style.setProperty('--spin', (camera.spin + follow).toFixed(2));
    ring.style.setProperty('--tilt', camera.tilt.toFixed(2));
    ring.style.setProperty('--dolly', camera.dolly.toFixed(1));
    ring.style.setProperty('--lift', camera.lift.toFixed(1));
  };
  applyCamera();
  const look = (
    at: number,
    to: Partial<typeof camera>,
    duration = 0.8,
    ease = 'power2.inOut',
  ): void => {
    master.to(
      camera,
      { ...to, duration: reducedMotion ? 0.01 : duration, ease, onUpdate: applyCamera },
      at,
    );
  };
  // Out of the water and into the ring: the party un-gathers from the bank's edge
  // as the camera comes up to its walking height and the water drops out of the
  // frame. Under reduced motion the water dissolves and the ring is a cut.
  master.to(
    arrive,
    { amount: 0, duration: reducedMotion ? 0.01 : 0.8, ease: 'power2.inOut', onUpdate: apply },
    iBank + (reducedMotion ? 0.5 : 0.15),
  );
  look(iBank + 0.15, { tilt: -8, lift: 0 }, 0.8);
  master.to(
    water,
    reducedMotion
      ? { opacity: 0, duration: 0.3 }
      : { yPercent: 100, opacity: 0, duration: 0.8, ease: 'power2.in' },
    iBank + (reducedMotion ? 0.4 : 0.15),
  );
  look(0, { spin: 40 }, 1.5, 'none');
  look(iProposal, { spin: 0, dolly: 140, tilt: -6 });
  look(iCourse, { tilt: -34, dolly: -420, lift: -40 });
  master.to(course, { '--drawn': 1, duration: 0.6, ease: 'power1.inOut' }, iCourse + 0.1);
  look(iRunning, { tilt: -14, dolly: -120, lift: 0 }, 0.6);
  master.to(
    camera,
    {
      spin: reducedMotion ? 180 : 400,
      duration: iOver - iRunning + 0.6,
      ease: 'none',
      onUpdate: applyCamera,
    },
    iRunning + 0.3,
  );
  master.call(
    () => {
      racing = master.time() >= iRunning + 0.05 && master.time() < iOver;
      for (const runner of runners) {
        runner.el.removeAttribute('data-drip');
        setRunning(runner, racing);
      }
      if (racing) {
        runButton.show();
      } else {
        runButton.hide();
      }
    },
    [],
    iRunning + 0.05,
  );
  master.call(
    () => {
      racing = master.time() >= iRunning + 0.05 && master.time() < iOver;
      runButton.hide();
      if (!racing) {
        for (const runner of runners) {
          setRunning(runner, false);
        }
      } else {
        runButton.show();
      }
    },
    [],
    iOver,
  );
  // Crowding round the Dodo, then round Alice.
  const dodoAngle = (): number => dodo?.angle ?? 0;
  const aliceAngle = (): number => alice?.angle ?? 180;
  master.to(
    gather,
    {
      amount: 1,
      centre: dodoAngle,
      spread: 110,
      duration: 0.7,
      ease: 'power2.inOut',
      onUpdate: apply,
    },
    iOver + 0.3,
  );
  master.to(
    camera,
    {
      spin: () => -dodoAngle(),
      dolly: 60,
      tilt: -10,
      duration: reducedMotion ? 0.01 : 0.8,
      ease: 'power2.inOut',
      onUpdate: applyCamera,
    },
    iOver + 0.3,
  );
  look(iThinking, { dolly: 220 }, 0.6);
  master.to(
    gather,
    { centre: aliceAngle, spread: 120, duration: 0.8, ease: 'power2.inOut', onUpdate: apply },
    iShe + 0.2,
  );
  master.to(
    camera,
    {
      spin: () => -aliceAngle(),
      dolly: 80,
      duration: reducedMotion ? 0.01 : 0.8,
      ease: 'power2.inOut',
      onUpdate: applyCamera,
    },
    iShe + 0.2,
  );

  // --- Prizes.
  const comfits = shell.layer('cr__comfits');
  // The comfits, in the interaction colours: they fall while the prizes are
  // handed round and are gone with the thimble.
  const colours = ['var(--ix-pink)', 'var(--ix-gold)', 'var(--ix-mint)', 'var(--ix-coral)'];
  comfits.innerHTML = Array.from(
    { length: 40 },
    (_, i) =>
      `<div class="cr__comfit" style="--x: ${(random() * 100).toFixed(1)}%; --c: ${colours[i % 4]}; --delay: ${(-random() * 2.6).toFixed(2)}s; --ly: ${random().toFixed(2)}"></div>`,
  ).join('');
  master.to(comfits, { opacity: 1, duration: 0.3 }, iComfits + 0.2);
  master.to(comfits, { opacity: 0, duration: 0.4 }, iThimble + 0.3);
  // Prizes are handed round: drag a comfit onto a runner and it eats it.
  const feedHint = document.createElement('p');
  feedHint.className = 'cr__hint';
  feedHint.textContent = shell.ui.demoFeed ?? '';
  shell.stage.append(feedHint);
  master.call(
    () =>
      feedHint.toggleAttribute(
        'data-shown',
        master.time() >= iComfits + 0.2 && master.time() < iThimble + 0.3,
      ),
    [],
    iComfits + 0.2,
  );
  master.call(
    () =>
      feedHint.toggleAttribute(
        'data-shown',
        master.time() >= iComfits + 0.2 && master.time() < iThimble + 0.3,
      ),
    [],
    iThimble + 0.3,
  );
  // Tap the sky while the prizes fall and a handful bursts from your finger.
  shell.stage.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button, .cr__comfit')) {
      return;
    }
    if (master.time() < iComfits + 0.2 || master.time() >= iThimble + 0.3) {
      return;
    }
    const box = shell.stage.getBoundingClientRect();
    for (let i = 0; i < 10; i += 1) {
      const el = document.createElement('div');
      el.className = 'cr__comfit cr__comfit--burst';
      el.style.setProperty('--c', colours[i % 4] ?? '');
      gsap.set(el, { x: event.clientX - box.left, y: event.clientY - box.top });
      comfits.append(el);
      gsap.to(el, {
        x: `+=${(random() - 0.5) * 240}`,
        y: `+=${140 + random() * 260}`,
        rotation: (random() - 0.5) * 300,
        duration: reducedMotion ? 0 : 1.2 + random() * 0.6,
        ease: 'power1.in',
        onComplete: () => el.remove(),
      });
    }
    shell.sound.play('chime', 0.4);
  });
  let carried: HTMLElement | undefined;
  comfits.addEventListener('pointerdown', (event) => {
    const comfit = (event.target as HTMLElement).closest<HTMLElement>('.cr__comfit');
    if (!comfit) {
      return;
    }
    carried = comfit;
    comfit.setAttribute('data-carried', '');
    const box = shell.stage.getBoundingClientRect();
    gsap.set(comfit, { x: event.clientX - box.left, y: event.clientY - box.top });
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!carried) {
        return;
      }
      const box = shell.stage.getBoundingClientRect();
      gsap.set(carried, { x: event.clientX - box.left, y: event.clientY - box.top });
    },
    { passive: true },
  );
  window.addEventListener('pointerup', (event) => {
    if (!carried) {
      return;
    }
    const comfit = carried;
    carried = undefined;
    const fed = runners.find((runner) => {
      const r = runner.el.getBoundingClientRect();
      return (
        event.clientX >= r.left &&
        event.clientX <= r.right &&
        event.clientY >= r.top &&
        event.clientY <= r.bottom
      );
    });
    if (fed) {
      shell.keep('comfit');
      comfit.remove();
      shell.sound.play('chime', 0.6);
      fed.el.removeAttribute('data-spurt');
      void fed.el.offsetWidth;
      fed.el.setAttribute('data-spurt', '');
    } else {
      comfit.removeAttribute('data-carried');
      gsap.set(comfit, { clearProps: 'transform' });
    }
  });
  const thimbleLayer = shell.layer('cr__thimble-layer');
  thimbleLayer.innerHTML = `<div class="cr__thimble">${THIMBLE_SVG}</div>`;
  const thimble = thimbleLayer.querySelector<HTMLElement>('.cr__thimble');
  master.to(
    thimble,
    { scale: 1, duration: reducedMotion ? 0.01 : 0.6, ease: 'back.out(2)' },
    iThimble + 0.4,
  );
  if (!reducedMotion) {
    master.to(thimble, { rotation: 360, duration: 1.2, ease: 'none' }, iThimble + 0.4);
  }
  master.call(
    () => alice?.el.toggleAttribute('data-bow', master.time() >= iBow + 0.1),
    [],
    iBow + 0.1,
  );
  master.to(thimble, { y: '20vh', scale: 0.5, duration: 0.6, ease: 'power2.in' }, iBow + 0.1);

  // --- Dust under running feet, and panting after.
  const dust = shell.layer('cr__dust');
  let dustClock = 0;
  const puff = (runner: Runner): void => {
    const r = runner.el.getBoundingClientRect();
    const box = shell.stage.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'cr__puff';
    gsap.set(el, {
      x: r.left - box.left + r.width / 2 + (random() - 0.5) * r.width * 0.4,
      y: r.bottom - box.top - 4,
    });
    dust.append(el);
    el.addEventListener('animationend', () => el.remove());
  };
  master.call(
    () => {
      const panting = master.time() >= iOver && master.time() < cue('she');
      for (const runner of runners) {
        runner.el.toggleAttribute('data-panting', panting);
      }
    },
    [],
    iOver,
  );
  master.call(
    () => {
      const panting = master.time() >= iOver && master.time() < cue('she');
      for (const runner of runners) {
        runner.el.toggleAttribute('data-panting', panting);
      }
    },
    [],
    cue('she'),
  );

  // --- Per frame: whoever is running, runs.
  shell.onFrame((dt) => {
    if (reducedMotion) {
      return;
    }
    // The camera keeps your runner in front while it runs.
    const wantFollow = racing && mine ? -mine.angle - camera.spin : 0;
    let delta = ((wantFollow - follow) % 360) + 360;
    delta = ((delta + 180) % 360) - 180;
    follow += delta * Math.min(1, dt * (racing && mine ? 3 : 1.2));
    applyCamera();
    dustClock += dt;
    let moved = false;
    for (const runner of runners) {
      if (racing && runner.running) {
        runner.angle = (runner.angle + runner.pace * dt) % 360;
        if (dustClock > 0.12 && random() < 0.5) {
          puff(runner);
        }
        // A spurt wears off; the others start and stop as they like.
        if (runner === mine && runner.pace > 60) {
          runner.pace -= dt * 20;
        }
        moved = true;
      }
      if (racing && runner !== mine && random() < dt * 0.08) {
        setRunning(runner, !runner.running);
      }
    }
    if (dustClock > 0.12) {
      dustClock = 0;
    }
    if (moved) {
      apply();
    }
  });
  gsap.ticker.add(apply);
}

const shell = attachDemo();
if (shell) {
  try {
    mount(shell);
  } catch (error) {
    console.error(error);
  }
}
