/**
 * The Caucus-race: the concept demo.
 *
 * The party stands in a ring on the bank, in CSS 3D, and the camera walks round
 * the ring as the story goes on: rotation is the parallax, the near runner sweeps
 * past and the far one crawls. When the race begins everyone runs round the
 * course, each at their own pace, starting and stopping when they like; the
 * reader may tap any of them to make them rest or run, since that is the rule.
 * When the Dodo calls it over they crowd round him, and the camera pushes in as
 * he sits, finger to forehead; then round Alice, and the comfits come down, one
 * each, handed round by the reader; and the thimble goes from her pocket to the
 * Dodo, is presented, and ends in her hand.
 */

import gsap from 'gsap';
import { figure } from '../art/art.ts';
import { DISTANT_HOUSE, HOUSE_FRONT_SVG } from '../rabbit-house/front.ts';
import { attachDemo, type DemoShell, mix, seeded } from '../shell/shell.ts';
import './caucus.css';
import '../rabbit-house/front.css';
import {
  dressRunner,
  HANDS,
  huddleSlot,
  OPENING,
  RUNNERS,
  type RunnerKind,
  THIMBLE_SVG,
} from './figures.ts';

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
    dressRunner(el, kind);
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
      if (prizes) {
        feed(runner);
        return;
      }
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

  // --- The gathering: 0 is the ring, 1 is a huddle round `centre`. Who is in
  // the middle of it is `toAlice`: 0 round the Dodo, 1 round Alice. `focus`
  // pushes in on the Dodo: the others step back from him.
  const gather = { amount: 0, centre: 0, spread: 60, toAlice: 0, focus: 0 };
  // --- The arrival: 1 is the party as the pool left it (OPENING), 0 is the ring.
  const arrive = { amount: 1 };
  const landed = OPENING.places;
  let racing = false;
  let prizes = false;
  /** Where each runner stands this frame, for the thimble to be carried between them. */
  const placed = runners.map(() => ({ angle: 0, radius: 1 }));

  // --- The thimble is carried in the ring itself, from hand to hand, so it is in
  // the picture wherever the camera is: out of Alice's pocket, over to the Dodo,
  // held up as he presents it, and into her hand when she takes it. `leg` runs
  // through the holds, 0 to 3; between two holds it is in the air between them.
  const carry = document.createElement('div');
  carry.className = 'cr__carry';
  carry.innerHTML = `<div class="cr__thimble">${THIMBLE_SVG}</div>`;
  ring.append(carry);
  const thimble = { show: 0, leg: 0, spin: 0 };
  const holds = [
    { who: alice, hand: HANDS.alicePocket, size: 0.75 },
    { who: dodo, hand: HANDS.dodoHand, size: 0.85 },
    { who: dodo, hand: HANDS.dodoRaised, size: 1.5 },
    { who: alice, hand: HANDS.aliceHand, size: 0.8 },
  ];
  const holdAt = (index: number) => {
    const hold = holds[index] ?? holds[0];
    const at = (hold?.who && placed[runners.indexOf(hold.who)]) || placed[0];
    return { hold, at };
  };
  const placeThimble = (): void => {
    const leg = Math.min(holds.length - 1, Math.max(0, thimble.leg));
    const index = Math.min(holds.length - 2, Math.floor(leg));
    const f = leg - index;
    const a = holdAt(index);
    const b = holdAt(index + 1);
    if (!a.hold || !b.hold || !a.at || !b.at) {
      return;
    }
    // The shorter way round the ring, and a little arc through the air.
    const turn = ((((b.at.angle - a.at.angle) % 360) + 540) % 360) - 180;
    carry.style.setProperty('--a', (a.at.angle + turn * f).toFixed(2));
    carry.style.setProperty('--r', mix(a.at.radius, b.at.radius, f).toFixed(3));
    carry.style.setProperty('--u', mix(a.hold.hand.u, b.hold.hand.u, f).toFixed(1));
    carry.style.setProperty(
      '--v',
      (mix(a.hold.hand.v, b.hold.hand.v, f) - Math.sin(Math.PI * f) * 30).toFixed(1),
    );
    carry.style.setProperty('--s', (mix(a.hold.size, b.hold.size, f) * thimble.show).toFixed(3));
    carry.style.setProperty('--rot', thimble.spin.toFixed(1));
  };

  const apply = (): void => {
    runners.forEach((runner, index) => {
      const slot = mix(
        huddleSlot(runner.kind, 'dodo'),
        huddleSlot(runner.kind, 'alice'),
        gather.toAlice,
      );
      const offset = (slot * gather.spread) / 4;
      let angle = mix(runner.angle, gather.centre + offset, gather.amount);
      let radius = mix(1, 0.5, gather.amount);
      if (gather.focus > 0) {
        // The front of the ring is nearest the camera: the Dodo comes forward,
        // the others draw back and aside.
        radius += gather.focus * (runner === dodo ? 0.3 : -0.12);
        angle += gather.focus * Math.sign(slot) * 34;
      }
      const place = landed[index];
      if (place && arrive.amount > 0.0001) {
        angle = mix(angle, place.angle, arrive.amount);
        radius = mix(radius, place.radius, arrive.amount);
      }
      const at = placed[index];
      if (at) {
        at.angle = angle;
        at.radius = radius;
      }
      runner.el.style.setProperty('--a', angle.toFixed(2));
      runner.el.style.setProperty('--r', radius.toFixed(3));
      runner.el.style.setProperty('--y', ((place?.sink ?? 0) * arrive.amount).toFixed(1));
    });
    placeThimble();
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
  // The Dodo sat for a long time with one finger pressed upon its forehead: the
  // camera pushes in on him, the others step back, and his thoughts rise slowly.
  look(iThinking, { dolly: 330, lift: -40, tilt: -3 }, 0.7);
  master.to(
    gather,
    { focus: 1, duration: reducedMotion ? 0.01 : 0.7, ease: 'power2.inOut', onUpdate: apply },
    iThinking,
  );
  const think = { v: 0 };
  master.to(
    think,
    {
      v: 1,
      duration: reducedMotion ? 0.01 : 0.75,
      ease: 'none',
      onUpdate: () => dodo?.el.style.setProperty('--think', think.v.toFixed(3)),
    },
    iThinking + 0.1,
  );
  master.to(
    gather,
    {
      centre: aliceAngle,
      toAlice: 1,
      focus: 0,
      spread: 120,
      duration: reducedMotion ? 0.01 : 0.8,
      ease: 'power2.inOut',
      onUpdate: apply,
    },
    iShe + 0.2,
  );
  master.to(
    camera,
    {
      spin: () => -aliceAngle(),
      dolly: 80,
      lift: 0,
      tilt: -10,
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
  const feedHint = document.createElement('p');
  feedHint.className = 'cr__hint';
  feedHint.textContent = shell.ui.demoFeed ?? '';
  shell.stage.append(feedHint);

  // Exactly one each, all round. A tap on a runner gives it its comfit, and since
  // every runner is a button that is the keyboard's way too; so is *Give it a
  // comfit*, which hands the next one round, and so is a tap on Alice, who is
  // the one giving. Dragging a falling comfit onto a runner feeds it as well.
  const fed = new Set<Runner>();
  const hungry = (): Runner | undefined =>
    runners
      .filter((runner) => runner !== alice && !fed.has(runner))
      .sort(
        (a, b) => Math.abs(huddleSlot(a.kind, 'alice')) - Math.abs(huddleSlot(b.kind, 'alice')),
      )[0];
  const hop = (runner: Runner): void => {
    runner.el.removeAttribute('data-spurt');
    void runner.el.offsetWidth;
    runner.el.setAttribute('data-spurt', '');
  };
  const eat = (runner: Runner): void => {
    fed.add(runner);
    runner.el.setAttribute('data-fed', '');
    shell.keep('comfit');
    shell.sound.play('chime', 0.6);
    hop(runner);
  };
  /** A comfit from her pocket to the runner's beak, in an arc; a still under reduced motion. */
  const handOver = (runner: Runner): void => {
    const box = shell.stage.getBoundingClientRect();
    const from = alice?.el.getBoundingClientRect();
    const to = runner.el.getBoundingClientRect();
    const sx = from ? from.left - box.left + from.width * 0.62 : box.width / 2;
    const sy = from ? from.top - box.top + from.height * 0.74 : box.height / 2;
    const ex = to.left - box.left + to.width * 0.8;
    const ey = to.top - box.top + to.height * 0.42;
    const sweet = document.createElement('div');
    sweet.className = 'cr__comfit cr__comfit--burst cr__comfit--given';
    comfits.append(sweet);
    if (reducedMotion) {
      gsap.set(sweet, { x: ex, y: ey });
      eat(runner);
      window.setTimeout(() => sweet.remove(), 700);
      return;
    }
    const path = { t: 0 };
    gsap.set(sweet, { x: sx, y: sy });
    gsap.to(path, {
      t: 1,
      duration: 0.55,
      ease: 'power1.inOut',
      onUpdate: () =>
        gsap.set(sweet, {
          x: mix(sx, ex, path.t),
          y: mix(sy, ey, path.t) - Math.sin(Math.PI * path.t) * 90,
        }),
      onComplete: () => {
        sweet.remove();
        eat(runner);
      },
    });
  };
  const feed = (runner: Runner): void => {
    if (runner === alice) {
      const next = hungry();
      if (next) {
        handOver(next);
      }
      return;
    }
    if (fed.has(runner)) {
      // One each: it has had its comfit, and hops for joy all the same.
      hop(runner);
      return;
    }
    handOver(runner);
  };
  const giveButton = shell.prop(shell.ui.demoGiveComfit ?? '', 'cr__prop cr__prop--give');
  giveButton.addEventListener('click', () => {
    if (alice) {
      feed(alice);
    }
  });
  const runLabel = (runner: Runner): string =>
    runner === mine
      ? `${shell.ui.demoRunToggle ?? ''} (${shell.ui.demoMyRunner ?? ''})`
      : (shell.ui.demoRunToggle ?? '');
  const openPrizes = (): void => {
    prizes = master.time() >= iComfits + 0.2 && master.time() < iThimble + 0.3;
    comfits.toggleAttribute('data-open', prizes);
    feedHint.toggleAttribute('data-shown', prizes);
    if (prizes) {
      giveButton.show();
    } else {
      giveButton.hide();
    }
    for (const runner of runners) {
      if (prizes) {
        runner.el.setAttribute('aria-label', shell.ui.demoGiveComfit ?? '');
        runner.el.removeAttribute('aria-pressed');
      } else {
        runner.el.setAttribute('aria-label', runLabel(runner));
        runner.el.setAttribute('aria-pressed', String(runner.running));
      }
    }
  };
  master.call(openPrizes, [], iComfits + 0.2);
  master.call(openPrizes, [], iThimble + 0.3);
  // Tap the sky while the prizes fall and a handful bursts from your finger.
  shell.stage.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button, .cr__comfit')) {
      return;
    }
    if (!prizes) {
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
    if (!comfit || !prizes) {
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
    const onto = runners.find((runner) => {
      const r = runner.el.getBoundingClientRect();
      return (
        runner !== alice &&
        event.clientX >= r.left &&
        event.clientX <= r.right &&
        event.clientY >= r.top &&
        event.clientY <= r.bottom
      );
    });
    if (onto) {
      comfit.remove();
      eat(onto);
    } else {
      comfit.removeAttribute('data-carried');
      gsap.set(comfit, { clearProps: 'transform' });
    }
  });

  // --- The thimble: "Only a thimble" out of her pocket; "Hand it over here" to
  // the Dodo; "We beg your acceptance" held up, turning, catching the light; and
  // when she bows, into her hand. Each hold is in place before the beat settles.
  const carryTo = (leg: number, at: number, duration: number): void => {
    master.to(
      thimble,
      {
        leg,
        duration: reducedMotion ? 0.01 : duration,
        ease: 'power2.inOut',
        onUpdate: placeThimble,
      },
      at,
    );
  };
  master.to(
    thimble,
    { show: 1, duration: reducedMotion ? 0.01 : 0.12, onUpdate: placeThimble },
    iThimble + 0.3,
  );
  // Close on her and the Dodo for the presentation; the race ends there.
  look(iThimble + 0.2, { dolly: 300, lift: -70, tilt: -6 }, 0.6);
  carryTo(1, iThimble + 0.42, 0.18);
  carryTo(2, iThimble + 0.58, 0.18);
  if (!reducedMotion) {
    master.to(
      thimble,
      { spin: 360, duration: 0.5, ease: 'none', onUpdate: placeThimble },
      iThimble + 0.6,
    );
  }
  carryTo(3, iBow + 0.1, 0.45);
  const poses = (): void => {
    const t = master.time();
    dodo?.el.toggleAttribute('data-thinking', t >= iThinking + 0.05 && t < iShe);
    dodo?.el.toggleAttribute('data-present', t >= iThimble + 0.42 && t < iBow + 0.1);
    alice?.el.toggleAttribute(
      'data-holding',
      (t >= iThimble + 0.3 && t < iThimble + 0.42) || t >= iBow + 0.1,
    );
    carry.toggleAttribute('data-gleam', t >= iThimble + 0.58 && t < iBow + 0.1);
  };
  for (const at of [
    iThinking + 0.05,
    iShe,
    iThimble + 0.3,
    iThimble + 0.42,
    iThimble + 0.58,
    iBow + 0.1,
  ]) {
    master.call(poses, [], at);
  }
  master.call(
    () => alice?.el.toggleAttribute('data-bow', master.time() >= iBow + 0.1),
    [],
    iBow + 0.1,
  );

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

  // --- The Rabbit's house, small in the bank's distance as the thimble is given:
  // the walk the Mouse's tale ends on starts here. The same front, in the same
  // place, as the tale's first frame.
  const distant = shell.layer('hs__arrival');
  distant.innerHTML = HOUSE_FRONT_SVG;
  const spot = DISTANT_HOUSE(matchMedia('(max-width: 700px)').matches);
  distant.style.setProperty('--hx', spot.hx.toFixed(2));
  distant.style.setProperty('--hy', spot.hy.toFixed(2));
  distant.style.setProperty('--hz', spot.hz.toFixed(4));
  gsap.set(distant, { opacity: 0 });
  master.fromTo(
    distant,
    { opacity: 0 },
    { opacity: 1, duration: reducedMotion ? 0.01 : 0.4, immediateRender: false },
    iBow + 0.3,
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
