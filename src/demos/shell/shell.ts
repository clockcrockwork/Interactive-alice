/**
 * What every concept demo shares: the pinned stage, the scroll-scrubbed master
 * timeline, the caption layer, the motion pause control, and the pointer.
 *
 * The page arrives as a readable document: a bar, then the story's sentences in
 * reading order inside `[data-demo-track]`. Attaching moves each beat into a stage
 * that stays pinned to the viewport, and turns the document's height into a master
 * timeline with one second of timeline time per beat. A demo composes against that
 * timeline and looks moments up by cue, never by index and never by id.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../../styles/base.css';
import '../art/art.css';
import './shell.css';
import { createSound, type DemoSound } from './sound.ts';
import { installTransitions } from './transitions.ts';

installTransitions();

gsap.registerPlugin(ScrollTrigger);

export interface Beat {
  index: number;
  el: HTMLElement;
  cue?: string;
  shot: string;
  lines: HTMLElement[];
}

export interface Pointer {
  /** Normalised viewport position, -1..1 on both axes, y down. */
  x: number;
  y: number;
  /** Whether a pointer has touched the page at all. */
  active: boolean;
  /** Whether the current pointer is a fine one (a mouse), so hover-style cues make sense. */
  fine: boolean;
  /** Whether the phone's tilt is steering the pointer instead. */
  tilt: boolean;
}

export interface DemoShell {
  root: HTMLElement;
  stage: HTMLElement;
  captions: HTMLElement;
  ui: Record<string, string>;
  beats: Beat[];
  /** The beat index a cue names; throws for a cue the composition does not have. */
  cue(name: string): number;
  /** Beat indices whose lines are said by this speaker. */
  spokenBy(speaker: string): Beat[];
  /** Scrubbed by the scroll; duration is the beat count, one unit of time per beat. */
  master: gsap.core.Timeline;
  /** Self-running motion: loops that the visitor can pause. */
  ambient: gsap.core.Timeline;
  reducedMotion: boolean;
  readonly paused: boolean;
  /** Runs every frame unless paused; `dt` in seconds. Returns a release function. */
  onFrame(fn: (dt: number, elapsed: number) => void): () => void;
  pointer: Pointer;
  /** Browser-synthesised sound; off until the visitor turns it on. */
  sound: DemoSound;
  /** A decorative layer inside the stage, under the captions. */
  layer(className: string): HTMLElement;
  /** A real button inside the stage; hidden until `show` is called. */
  prop(label: string, className: string): HTMLButtonElement & { show(): void; hide(): void };
  /** A polite live region for a state the visitor changed. */
  status(text: string): void;
  /** A one-line note in the bar area, for a degraded mode. */
  note(text: string): void;
  /** Current master progress, 0..1. */
  progress(): number;
  /** Remembers a thing the reader did in this demo, for a later one to show. */
  keep(kind: string): void;
  /** The things the reader kept across the demos, in the order they were kept. */
  kept(): string[];
}

const KEPT_KEY = 'alice-demos:kept';
const readKept = (): string[] => {
  try {
    const raw = localStorage.getItem(KEPT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
const keepKind = (kind: string): void => {
  const list = readKept();
  if (list.includes(kind)) {
    return;
  }
  list.push(kind);
  try {
    localStorage.setItem(KEPT_KEY, JSON.stringify(list));
  } catch {
    // A private window may refuse; the thing is kept for this page only.
  }
};

export interface ShellOptions {
  /** Custom caption behaviour: return true to take over a beat's caption tweens. */
  caption?: (beat: Beat, master: gsap.core.Timeline, reduced: boolean, beats: Beat[]) => boolean;
}

declare global {
  interface Window {
    /** Test seam for the demo pages: present on every demo page. */
    __aliceDemo?: {
      progress(): number;
      beat(): number;
      paused(): boolean;
      reduced(): boolean;
      mode(): string;
      /** The master timeline's length against the beat count: they must agree. */
      overrun(): number;
      /** Whether the scrubbed timeline has caught up with the scroll. */
      settled(): boolean;
    };
  }
}

function readUi(): Record<string, string> {
  const script = document.getElementById('demo-ui');
  if (!script?.textContent) {
    return {};
  }
  try {
    return JSON.parse(script.textContent) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * When a beat's sentences come in. Under reduced motion the page snaps to the
 * head of a beat, so they must already be there: the cut lands just before it,
 * and the first beat's are set at the head. A custom caption uses the same timing.
 */
export function captionEntry(reduced: boolean, t: number): { at: number; duration: number } {
  if (!reduced) {
    return { at: t + 0.05, duration: 0.3 };
  }
  return t === 0 ? { at: 0, duration: 0 } : { at: t - 0.02, duration: 0.02 };
}

export function attachDemo(options: ShellOptions = {}): DemoShell | undefined {
  const root = document.querySelector<HTMLElement>('.demo');
  const track = root?.querySelector<HTMLElement>('[data-demo-track]');
  if (!root || !track) {
    return undefined;
  }
  const ui = readUi();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stage first, captions on top; the beats move in keeping their order.
  const stage = document.createElement('div');
  stage.className = 'demo__stage';
  const captions = document.createElement('div');
  captions.className = 'demo__captions';
  const beats: Beat[] = [];
  for (const shot of track.querySelectorAll<HTMLElement>('.demo-shot')) {
    for (const el of shot.querySelectorAll<HTMLElement>('.demo-beat')) {
      beats.push({
        index: beats.length,
        el,
        cue: el.dataset.cue,
        shot: shot.dataset.shot ?? '',
        lines: [...el.querySelectorAll<HTMLElement>('.line')],
      });
      captions.append(el);
    }
  }
  stage.append(captions);
  track.before(stage);
  root.style.setProperty('--demo-beats', String(beats.length));
  root.dataset.attached = '';
  if (reducedMotion) {
    root.dataset.motion = 'reduced';
  }

  const cue = (name: string): number => {
    const beat = beats.find((candidate) => candidate.cue === name);
    if (!beat) {
      throw new Error(`no beat carries the cue ${name}`);
    }
    return beat.index;
  };

  const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  // Pin the duration to the beat count even before any tween is added, so a demo
  // can place tweens by beat index from the start.
  master.set({}, {}, beats.length);

  const ambient = gsap.timeline({ repeat: -1 });
  let paused = false;

  // Captions: each beat fades in over its first third and out over its last
  // sixth, except the last beat, which stays. A demo may take a beat over.
  for (const beat of beats) {
    if (options.caption?.(beat, master, reducedMotion, beats)) {
      continue;
    }
    const t = beat.index;
    const last = beat.index === beats.length - 1;
    const entry = captionEntry(reducedMotion, t);
    master.fromTo(
      beat.lines,
      { opacity: 0, y: reducedMotion ? 0 : 18 },
      { opacity: 1, y: 0, duration: entry.duration, stagger: reducedMotion ? 0 : 0.08 },
      entry.at,
    );
    if (!last) {
      master.to(beat.lines, { opacity: 0, duration: 0.14 }, t + 0.84);
    }
  }

  let activeIndex = -1;
  const setActive = (index: number): void => {
    if (index === activeIndex) {
      return;
    }
    activeIndex = index;
    for (const beat of beats) {
      if (beat.index === index) {
        beat.el.dataset.active = '';
        beat.el.dataset.reached = '';
      } else {
        delete beat.el.dataset.active;
      }
    }
    root.style.setProperty('--demo-hint-opacity', index > 0 ? '0' : '1');
    // On the last beat the captions make room for the link to the next demo.
    root.toggleAttribute('data-ending', index === beats.length - 1);
  };

  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    scrub: reducedMotion ? true : 0.6,
    animation: master,
    // Reduced motion steps from beat to beat rather than gliding: the snap is
    // instant, so the page lands on a whole beat and stays there.
    snap: reducedMotion ? { snapTo: 1 / beats.length, duration: 0, delay: 0 } : undefined,
    onUpdate: (self) =>
      setActive(Math.min(beats.length - 1, Math.floor(self.progress * beats.length))),
  });
  setActive(0);

  const frameFns = new Set<(dt: number, elapsed: number) => void>();
  gsap.ticker.add((time, deltaMs) => {
    if (paused) {
      return;
    }
    for (const fn of frameFns) {
      fn(deltaMs / 1000, time);
    }
  });

  const pointer: Pointer = {
    x: 0,
    y: 0,
    active: false,
    fine: matchMedia('(pointer: fine)').matches,
    tilt: false,
  };
  window.addEventListener(
    'pointermove',
    (event) => {
      if (pointer.tilt) {
        return;
      }
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    },
    { passive: true },
  );

  // --- Tilt: on a phone, the view can be steered by tilting it. Offered as a
  // button, since some browsers ask permission and all of them need a gesture.
  const bar = root.querySelector<HTMLElement>('.demo__bar');
  if (
    bar &&
    ui.demoTilt &&
    matchMedia('(pointer: coarse)').matches &&
    'DeviceOrientationEvent' in window &&
    !reducedMotion
  ) {
    const tiltButton = document.createElement('button');
    tiltButton.type = 'button';
    tiltButton.className = 'demo__tilt';
    tiltButton.textContent = ui.demoTilt;
    bar.append(tiltButton);
    tiltButton.addEventListener('click', async () => {
      const Orientation = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (Orientation.requestPermission) {
        try {
          if ((await Orientation.requestPermission()) !== 'granted') {
            return;
          }
        } catch {
          return;
        }
      }
      window.addEventListener('deviceorientation', (event) => {
        const gamma = event.gamma ?? 0;
        const beta = event.beta ?? 45;
        // Held upright at about 45°, level is the middle; ±25° reaches the edges.
        pointer.x = Math.max(-1, Math.min(1, gamma / 25));
        pointer.y = Math.max(-1, Math.min(1, (beta - 45) / 25));
        pointer.active = true;
        pointer.tilt = true;
      });
      tiltButton.remove();
      status(ui.demoTiltOn ?? '');
    });
  }

  // --- Sound: synthesised, off by default, and held while motion is paused.
  const sound = createSound();
  if (bar && ui.demoSoundOn) {
    const soundButton = document.createElement('button');
    soundButton.type = 'button';
    soundButton.className = 'demo__sound';
    soundButton.setAttribute('aria-pressed', 'false');
    soundButton.textContent = ui.demoSoundOn;
    bar.append(soundButton);
    soundButton.addEventListener('click', async () => {
      const on = await sound.toggle();
      soundButton.setAttribute('aria-pressed', String(on));
      soundButton.textContent = on ? (ui.demoSoundOff ?? '') : (ui.demoSoundOn ?? '');
    });
  }

  const button = root.querySelector<HTMLButtonElement>('.demo__motion');
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      paused = !paused;
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? (ui.demoResume ?? '') : (ui.demoPause ?? '');
      ambient.paused(paused);
      sound.hold(paused);
      root.toggleAttribute('data-paused', paused);
    });
  }

  let live: HTMLElement | undefined;
  let liveTimer = 0;
  const status = (text: string): void => {
    if (!live) {
      live = document.createElement('p');
      live.className = 'demo__status';
      live.setAttribute('aria-live', 'polite');
      stage.append(live);
    }
    live.textContent = text;
    // Read out at once; shown for a few seconds, then faded, the text kept.
    live.setAttribute('data-shown', '');
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => live?.removeAttribute('data-shown'), 4000);
  };

  const note = (text: string): void => {
    const p = document.createElement('p');
    p.className = 'demo__note';
    p.textContent = text;
    root.querySelector('.demo__bar')?.after(p);
  };
  if (reducedMotion && ui.demoReducedMotion) {
    note(ui.demoReducedMotion);
  }

  const shell: DemoShell = {
    root,
    stage,
    captions,
    ui,
    beats,
    cue,
    spokenBy: (speaker) =>
      beats.filter((beat) => beat.lines.some((line) => line.dataset.speaker === speaker)),
    master,
    ambient,
    reducedMotion,
    get paused() {
      return paused;
    },
    onFrame: (fn) => {
      frameFns.add(fn);
      return () => frameFns.delete(fn);
    },
    pointer,
    sound,
    layer: (className) => {
      const el = document.createElement('div');
      el.className = `demo__layer ${className}`;
      el.setAttribute('aria-hidden', 'true');
      captions.before(el);
      return el;
    },
    prop: (label, className) => {
      const el = document.createElement('button') as HTMLButtonElement & {
        show(): void;
        hide(): void;
      };
      el.type = 'button';
      el.className = `demo__prop ${className}`;
      el.textContent = label;
      el.show = () => {
        el.dataset.shown = '';
      };
      el.hide = () => {
        delete el.dataset.shown;
      };
      stage.append(el);
      return el;
    },
    status,
    note,
    progress: () => trigger.progress,
    keep: keepKind,
    kept: readKept,
  };

  window.__aliceDemo = {
    progress: () => trigger.progress,
    beat: () => activeIndex,
    paused: () => paused,
    reduced: () => reducedMotion,
    mode: () => root.dataset.mode ?? '',
    overrun: () => master.duration() - beats.length,
    settled: () => {
      // With a smoothed scrub this is the tween easing the timeline after the
      // scroll; with an instant one (reduced motion) there is none to wait for.
      const tween = trigger.getTween?.() as { isActive?: () => boolean } | undefined;
      const easing = typeof tween?.isActive === 'function' && tween.isActive();
      return !easing && Math.abs(master.progress() - trigger.progress) < 0.002;
    },
  };
  // A tween placed past the last beat stretches the timeline, and then the scroll
  // no longer lands each beat on its own unit of time. Say so once the demo has
  // composed, where the browser tests will see it.
  requestAnimationFrame(() => {
    if (master.duration() > beats.length + 1e-6) {
      console.error(`master timeline overruns the beats: ${master.duration()} > ${beats.length}`);
    }
  });

  return shell;
}

/** Linear interpolation, kept here because every demo wants it. */
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** A small deterministic random, so a composition looks the same on every load. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
