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
import { installArtTreatments } from '../art/treatments.ts';
import './shell.css';
import type { LocaleRealia } from '../../types/schema.ts';
import { cssPixels, FIT_MARGIN, FIT_STEPS, type FitStep, fitShift } from './fit.ts';
import { createKeepsakes } from './kept.ts';
import { createSound, type DemoSound, type SoundState } from './sound.ts';
import { tiltToPointer, validTilt } from './tilt.ts';
import { installTransitions } from './transitions.ts';
import { type LocaleProfile, pageProfile, quotedSpans } from './words.ts';

installTransitions();
installArtTreatments();

gsap.registerPlugin(ScrollTrigger);
// The clock follows real time on frames of up to a second. GSAP's default lag
// smoothing counts any frame over half a second as 33 ms, which keeps a tab's
// return from jumping but, on a machine whose frames are always that long (a
// renderer without a GPU under a filtered figure), runs every reaction at a
// twentieth of its speed: a two-second wink took forty. Past a second, a frame
// still counts as a quarter of one, so a hidden tab coming back does not leap.
gsap.ticker.lagSmoothing(1000, 250);

/** The realia a demo may read, by id. */
export type Realia = LocaleRealia['realia'];

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
  /**
   * The page's locale profile (`text/locales.json`, written on the root by the
   * build): how its language sets words apart, splits a line into units, sets
   * speech apart, how wide its glyphs are. Read this, never the language's name.
   */
  profile: LocaleProfile;
  /** The locale's Intl tag, and number formatting in it. */
  locale: { tag: string; numberFormat(options?: Intl.NumberFormatOptions): Intl.NumberFormat };
  /**
   * A thing this page's sentences are about (`text/locales/<locale>/realia.json`),
   * for an id the demo file declares under `realia`. Undefined when the page carries
   * none, so a stage falls back to its own default rather than drawing nothing.
   */
  realia<K extends keyof Realia>(id: K): Realia[K] | undefined;
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

const keepsakes = createKeepsakes();

/** How long, after permission, a first tilt reading may take before steering stays with the pointer, ms. */
const TILT_WAIT = 1000;

/** Going on by itself: remembered per visitor, off until the reader turns it on. */
const AUTO_KEY = 'alice-demos:auto';
/** Seconds at the very end before the next page comes by itself. */
const AUTO_DWELL = 4;
const readAuto = (): boolean => {
  try {
    return localStorage.getItem(AUTO_KEY) === '1';
  } catch {
    return false;
  }
};
const writeAuto = (on: boolean): void => {
  try {
    localStorage.setItem(AUTO_KEY, on ? '1' : '0');
  } catch {
    // A private window may refuse; the choice holds for this page only.
  }
};

export interface ShellOptions {
  /** Custom caption behaviour: return true to take over a beat's caption tweens. */
  caption?: (beat: Beat, master: gsap.core.Timeline, reduced: boolean, beats: Beat[]) => boolean;
  /**
   * The demo's staging, run once the shell has attached. If it throws, the error is
   * reported and the page goes back to the readable document it arrived as: the
   * sentences in the track, the links in the flow (docs/concept-demos.md §3).
   */
  mount?: (shell: DemoShell) => void;
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
      /** The page's locale, as its root element declares it. */
      locale(): string;
      /** The page's locale profile, as the shell read it from the root. */
      profile(): LocaleProfile;
      /** The realia the page carries, by id. */
      realia(): Partial<Realia>;
      /** The master timeline's length against the beat count: they must agree. */
      overrun(): number;
      /** Whether the scrubbed timeline has caught up with the scroll. */
      settled(): boolean;
      /**
       * Test seam: scrolls to a progress and lands the scrubbed timeline there at
       * once, so a test can sample many points without waiting for the ease.
       */
      seek(progress: number): void;
      /** The last caption fit step each beat needed, by beat index; beats that fit as placed are absent. */
      captionFit(): Record<number, FitStep>;
      auto(): boolean;
      /** The synthesiser's state: whether a context exists, and its timers. */
      sound(): SoundState;
      /** Where the shell's pointer is, and whether tilt is steering it. */
      pointer(): Pointer;
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

function readRealia(root: HTMLElement): Partial<Realia> {
  try {
    const parsed: unknown = JSON.parse(root.dataset.realia ?? '{}');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Partial<Realia>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Under reduced motion the timeline is not scrubbed: wherever the page rests
 * within a beat, it shows that beat as it has settled, this far into it, and the
 * last beat as it ends. Effects a demo places early in a beat are therefore seen
 * with their sentence, and nothing moves while the reader scrolls.
 */
export const REDUCED_SETTLE = 0.7;

/** Frames a timeline within a hair of the scroll must hold still to count as settled. */
const SETTLE_FRAMES = 3;

/** The time the timeline shows, under reduced motion, for a scroll progress. */
export function reducedTimeFor(progress: number, beats: number): number {
  const index = Math.min(beats - 1, Math.max(0, Math.floor(progress * beats + 1e-6)));
  return index === beats - 1 ? beats : index + REDUCED_SETTLE;
}

/**
 * When a beat's sentences come in. Under reduced motion they are there for the
 * whole of their beat: the cut lands just before its head, and the first beat's
 * are set at the head. A custom caption uses the same timing.
 */
export function captionEntry(reduced: boolean, t: number): { at: number; duration: number } {
  if (!reduced) {
    return { at: t + 0.05, duration: 0.3 };
  }
  return t === 0 ? { at: 0, duration: 0 } : { at: t - 0.02, duration: 0.02 };
}

/**
 * A quoted run in a caption is held together: a name or a word set apart (a race's
 * name, the words on a label) never breaks inside, in any language. The run, its
 * marks included, goes in a `.demo__held` span the stylesheet keeps on one line
 * where it fits; the line's text is unchanged.
 */
export function holdQuotedRuns(line: HTMLElement): void {
  const only = line.firstChild;
  if (line.childNodes.length !== 1 || only?.nodeType !== Node.TEXT_NODE) {
    return;
  }
  const value = only.textContent ?? '';
  const spans = quotedSpans(value);
  if (spans.length === 0) {
    return;
  }
  const nodes: Node[] = [];
  let at = 0;
  for (const [open, close] of spans) {
    if (open > at) {
      nodes.push(document.createTextNode(value.slice(at, open)));
    }
    const held = document.createElement('span');
    held.className = 'demo__held';
    held.textContent = value.slice(open, close + 1);
    nodes.push(held);
    at = close + 1;
  }
  if (at < value.length) {
    nodes.push(document.createTextNode(value.slice(at)));
  }
  line.replaceChildren(...nodes);
}

export function attachDemo(options: ShellOptions = {}): DemoShell | undefined {
  const root = document.querySelector<HTMLElement>('.demo');
  const track = root?.querySelector<HTMLElement>('[data-demo-track]');
  if (!root || !track) {
    return undefined;
  }
  const ui = readUi();
  const realia = readRealia(root);
  const profile = pageProfile();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Every listener the shell adds is released through this, should the demo fail
  // to mount and the page go back to the document it arrived as.
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const homes = new Map<HTMLElement, HTMLElement>();

  // Stage first, captions on top; the beats move in keeping their order.
  const stage = document.createElement('div');
  stage.className = 'demo__stage';
  // Focusable by script only: where focus goes when the control it was on leaves.
  stage.tabIndex = -1;
  const captions = document.createElement('div');
  captions.className = 'demo__captions';
  const beats: Beat[] = [];
  for (const shot of track.querySelectorAll<HTMLElement>('.demo-shot')) {
    for (const el of shot.querySelectorAll<HTMLElement>('.demo-beat')) {
      const lines = [...el.querySelectorAll<HTMLElement>('.line')];
      for (const line of lines) {
        holdQuotedRuns(line);
      }
      homes.set(el, shot);
      beats.push({
        index: beats.length,
        el,
        cue: el.dataset.cue,
        shot: shot.dataset.shot ?? '',
        lines,
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
    // On the last beat the captions make room for the link to the next demo. Until
    // then the link is out of the tab order: focusing it would scroll the reader
    // past the whole scene.
    const ending = index === beats.length - 1;
    root.toggleAttribute('data-ending', ending);
    root.querySelector<HTMLElement>('.demo__end')?.toggleAttribute('inert', !ending);
  };

  // The beat a progress falls in. The small allowance keeps a beat's own head in
  // that beat when the division comes out a hair under the whole number.
  const beatAt = (progress: number): number =>
    Math.min(beats.length - 1, Math.max(0, Math.floor(progress * beats.length + 1e-6)));

  // With motion, the timeline is scrubbed by the scroll, eased. Under reduced
  // motion it steps: every scroll position shows its beat as it has settled
  // (see reducedTimeFor), so a wheel notch or an arrow key moves on by as much
  // as it scrolls, and no picture is ever caught halfway.
  const showReduced = (progress: number): void => {
    const time = reducedTimeFor(progress, beats.length);
    if (Math.abs(master.time() - time) > 1e-6) {
      master.time(time);
    }
  };
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    scrub: reducedMotion ? false : 0.6,
    animation: reducedMotion ? undefined : master,
    onUpdate: (self) => {
      setActive(beatAt(self.progress));
      if (reducedMotion) {
        showReduced(self.progress);
      }
    },
  });
  setActive(0);

  const frameFns = new Set<(dt: number, elapsed: number) => void>();
  // How many frames in a row the scrubbed timeline has held still: the seam's
  // settled() accepts a timeline within a hair of the scroll that has stopped
  // moving, even where the scrub's ease has not formally ended (a loaded machine
  // stretches its last frames).
  let stillFrames = 0;
  let lastTime = Number.NaN;
  const tick = (time: number, deltaMs: number): void => {
    const now = master.time();
    stillFrames = Math.abs(now - lastTime) < 1e-4 ? stillFrames + 1 : 0;
    lastTime = now;
    if (paused) {
      return;
    }
    for (const fn of frameFns) {
      fn(deltaMs / 1000, time);
    }
  };
  gsap.ticker.add(tick);

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
    { passive: true, signal },
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
    tiltButton.addEventListener(
      'click',
      async () => {
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
        // On only once a reading arrives: a device may grant permission and still
        // send nothing, or only nulls. Until then the pointer steers as before; if
        // nothing comes in a second, the reader is told, and it stays that way.
        tiltButton.disabled = true;
        const listening = new AbortController();
        signal.addEventListener('abort', () => listening.abort(), { once: true });
        const giveUp = window.setTimeout(() => {
          listening.abort();
          tiltButton.remove();
          status(ui.demoTiltNone ?? '');
        }, TILT_WAIT);
        window.addEventListener(
          'deviceorientation',
          (event) => {
            if (!validTilt(event)) {
              return;
            }
            const steer = tiltToPointer(
              event.beta ?? 0,
              event.gamma ?? 0,
              screen.orientation?.angle ?? 0,
            );
            pointer.x = steer.x;
            pointer.y = steer.y;
            pointer.active = true;
            if (!pointer.tilt) {
              pointer.tilt = true;
              window.clearTimeout(giveUp);
              tiltButton.remove();
              status(ui.demoTiltOn ?? '');
            }
          },
          { signal: listening.signal },
        );
      },
      { signal },
    );
  }

  // --- Sound: synthesised, off by default, and held while motion is paused.
  // The button shows the visitor's choice at once; the audio device follows when
  // it can, and a browser that refuses outright turns the button back.
  let soundButton: HTMLButtonElement | undefined;
  const showSound = (on: boolean): void => {
    soundButton?.setAttribute('aria-pressed', String(on));
    if (soundButton) {
      soundButton.textContent = on ? (ui.demoSoundOff ?? '') : (ui.demoSoundOn ?? '');
    }
  };
  const sound = createSound(() => showSound(false));
  if (bar && ui.demoSoundOn) {
    soundButton = document.createElement('button');
    soundButton.type = 'button';
    soundButton.className = 'demo__sound';
    soundButton.setAttribute('aria-pressed', 'false');
    soundButton.textContent = ui.demoSoundOn;
    bar.append(soundButton);
    soundButton.addEventListener('click', () => showSound(sound.toggle()), { signal });
  }

  const button = root.querySelector<HTMLButtonElement>('.demo__motion');
  if (button) {
    button.hidden = false;
    button.addEventListener(
      'click',
      () => {
        paused = !paused;
        button.setAttribute('aria-pressed', String(paused));
        button.textContent = paused ? (ui.demoResume ?? '') : (ui.demoPause ?? '');
        ambient.paused(paused);
        sound.hold(paused);
        root.toggleAttribute('data-paused', paused);
      },
      { signal },
    );
  }

  // --- Going on by itself. Scroll remains the way forward: this only follows a
  // reader who asked for it, and only once the end has been reached and held.
  // The ring round the next link fills while it waits; scrolling back empties it,
  // and the motion pause holds it.
  const end = root.querySelector<HTMLElement>('.demo__end');
  const nextLink = root.querySelector<HTMLAnchorElement>('.demo__next');
  const autoButton = root.querySelector<HTMLButtonElement>('.demo__auto');
  // The last demo offers no going on by itself (its link goes back to the index),
  // so a choice remembered from the pages before it never fires here.
  let auto = autoButton ? readAuto() : false;
  let dwell = 0;
  let left = false;
  const showAuto = (): void => {
    autoButton?.setAttribute('aria-pressed', String(auto));
    end?.toggleAttribute('data-auto', auto);
  };
  if (autoButton) {
    autoButton.hidden = false;
    autoButton.addEventListener(
      'click',
      () => {
        auto = !auto;
        dwell = 0;
        writeAuto(auto);
        showAuto();
        nextLink?.style.setProperty('--demo-auto', '0');
      },
      { signal },
    );
  }
  showAuto();
  const stepDwell = (dt: number): void => {
    if (!auto || !nextLink || left) {
      return;
    }
    const atEnd = activeIndex === beats.length - 1 && trigger.progress > 0.995;
    dwell = atEnd ? Math.min(AUTO_DWELL, dwell + dt) : 0;
    const fill = dwell / AUTO_DWELL;
    // Reduced motion: the ring fills in quarters rather than sweeping.
    nextLink.style.setProperty(
      '--demo-auto',
      (reducedMotion ? Math.floor(fill * 4) / 4 : fill).toFixed(3),
    );
    if (dwell >= AUTO_DWELL) {
      left = true;
      location.assign(nextLink.href);
    }
  };
  frameFns.add(stepDwell);

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

  // --- The caption fit budget. Every beat's stack of slips must fit between the
  // bar and the frame's foot, in every language and at every width: the shell
  // measures each stack where its demo placed it and, where it does not fit, steps
  // its slips down a size, then another, then tightens their leading, then moves
  // the stack inside the frame; what still does not fit is reported, never clipped
  // in silence. Layout is read here, on attach, when the fonts arrive and on a
  // resize; never per frame.
  const fitted = new Map<number, FitStep>();
  const fitCaptions = (): void => {
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const captionStyle = getComputedStyle(captions);
    const em = Number.parseFloat(captionStyle.fontSize) || rem;
    const endLift = cssPixels(
      captionStyle.getPropertyValue('--demo-end-lift') || '4.25rem',
      rem,
      em,
    );
    // A demo whose captions move by themselves (riding a swell) keeps them further in.
    const margin = Math.max(
      FIT_MARGIN,
      cssPixels(captionStyle.getPropertyValue('--demo-fit-margin'), rem, em),
    );
    const top = (bar?.getBoundingClientRect().bottom ?? 0) + margin;
    const foot = stage.clientHeight - margin;
    // Where a stack sits in the stage, by layout: transforms (a line flying in, the
    // last beat lifting clear of the next link) are not part of the fit.
    const offsetIn = (el: HTMLElement): number => {
      let y = 0;
      for (let node: HTMLElement | null = el; node && node !== stage; ) {
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return y;
    };
    const extent = (beat: Beat): { top: number; bottom: number } | undefined => {
      // A beat drawn elsewhere keeps its sentences in a one-pixel box for assistive
      // technology only: nothing to fit.
      if (beat.el.offsetWidth <= 1 || beat.el.offsetHeight <= 1 || beat.lines.length === 0) {
        return undefined;
      }
      let first = Number.POSITIVE_INFINITY;
      let last = Number.NEGATIVE_INFINITY;
      for (const line of beat.lines) {
        if (line.offsetHeight === 0) {
          continue;
        }
        const y = offsetIn(line);
        first = Math.min(first, y);
        last = Math.max(last, y + line.offsetHeight);
      }
      if (!Number.isFinite(first)) {
        return undefined;
      }
      // The last beat is lifted clear of the next link: it must fit lifted. A
      // stack the fit has moved is where the move put it.
      const lift = beat.index === beats.length - 1 ? endLift : 0;
      const moved =
        beat.el.dataset.fitShift === undefined
          ? 0
          : Number.parseFloat(beat.el.style.getPropertyValue('--demo-fit-shift')) || 0;
      return { top: first - lift + moved, bottom: last - lift + moved };
    };
    // A beat may keep its stack inside a narrower band than the frame, to stay
    // clear of a figure it is about: `--demo-fit-top` and `--demo-fit-foot`, in
    // px, rem or a percentage of the frame.
    const frameHeight = stage.clientHeight;
    const band = new Map(
      beats.map((beat) => {
        const style = getComputedStyle(beat.el);
        const ownTop = cssPixels(style.getPropertyValue('--demo-fit-top'), rem, em, frameHeight);
        const ownFoot = cssPixels(style.getPropertyValue('--demo-fit-foot'), rem, em, frameHeight);
        return [
          beat.index,
          { top: Math.max(top, ownTop), foot: ownFoot > 0 ? Math.min(foot, ownFoot) : foot },
        ];
      }),
    );
    const overflows = (beat: Beat): boolean => {
      const box = extent(beat);
      const limits = band.get(beat.index) ?? { top, foot };
      return box !== undefined && (box.bottom > limits.foot || box.top < limits.top);
    };
    for (const beat of beats) {
      delete beat.el.dataset.fit;
      delete beat.el.dataset.fitShift;
      beat.el.style.removeProperty('--demo-fit-shift');
    }
    fitted.clear();
    const limitsOf = (beat: Beat) => band.get(beat.index) ?? { top, foot };
    const shiftInto = (beat: Beat): void => {
      const box = extent(beat);
      if (!box) {
        return;
      }
      const limits = limitsOf(beat);
      const shift = fitShift(box.top, box.bottom, limits.top, limits.foot);
      beat.el.style.setProperty('--demo-fit-shift', `${Math.round(shift)}px`);
      beat.el.dataset.fitShift = '';
      fitted.set(beat.index, 'shift');
    };
    const unshift = (beat: Beat): void => {
      delete beat.el.dataset.fitShift;
      beat.el.style.removeProperty('--demo-fit-shift');
    };
    const sizes = FIT_STEPS.filter((step) => step !== 'shift');
    // 1. Smaller, then smaller again, then tighter, for a stack that grows towards
    // the edge it crosses: each step pulls that edge in. A stack placed from the
    // very edge it crosses only gets shorter away from it; it is set aside.
    let pending = beats.filter(overflows);
    const anchored: Beat[] = [];
    const sized = new Map<number, FitStep>();
    for (const step of sizes) {
      if (pending.length === 0) {
        break;
      }
      const before = new Map(pending.map((beat) => [beat.index, extent(beat)]));
      for (const beat of pending) {
        beat.el.dataset.fit = step;
      }
      for (const beat of pending) {
        const was = before.get(beat.index);
        const now = extent(beat);
        const limits = limitsOf(beat);
        const helped =
          was !== undefined &&
          now !== undefined &&
          ((was.bottom > limits.foot && now.bottom < was.bottom - 0.5) ||
            (was.top < limits.top && now.top > was.top + 0.5));
        if (helped) {
          sized.set(beat.index, step);
          fitted.set(beat.index, step);
          continue;
        }
        const kept = sized.get(beat.index);
        if (kept) {
          beat.el.dataset.fit = kept;
        } else {
          delete beat.el.dataset.fit;
        }
        anchored.push(beat);
      }
      pending = pending.filter((beat) => !anchored.includes(beat) && overflows(beat));
    }
    // 2. What still crosses an edge is moved inside its band. A stack set aside is
    // moved at its own size where that is enough, and only otherwise set smaller
    // until it is no taller than its band, then moved.
    for (const beat of pending) {
      shiftInto(beat);
    }
    for (const beat of anchored) {
      shiftInto(beat);
      if (!overflows(beat)) {
        continue;
      }
      unshift(beat);
      for (const step of sizes) {
        beat.el.dataset.fit = step;
        fitted.set(beat.index, step);
        const box = extent(beat);
        const limits = limitsOf(beat);
        if (box && box.bottom - box.top <= limits.foot - limits.top) {
          break;
        }
      }
      shiftInto(beat);
    }
    pending = [...pending, ...anchored].filter(overflows);
    for (const beat of pending) {
      fitted.set(beat.index, 'over');
      beat.el.dataset.fit = 'over';
      console.warn(
        `captions of beat ${beat.index}${beat.cue ? ` (${beat.cue})` : ''} do not fit the frame`,
      );
    }
  };
  let fitQueued = 0;
  const queueFit = (): void => {
    if (signal.aborted) {
      return;
    }
    cancelAnimationFrame(fitQueued);
    fitQueued = requestAnimationFrame(fitCaptions);
  };
  // The bar may wrap to a second row rather than shrink its labels below the
  // chrome's floor: what sits under it reads the height it really has.
  let barHeight = 0;
  const watchSizes = new ResizeObserver(() => {
    const height = Math.ceil(bar?.getBoundingClientRect().height ?? 0);
    if (bar && height !== barHeight) {
      barHeight = height;
      root.style.setProperty('--demo-bar-height', `${height}px`);
    }
    queueFit();
  });
  watchSizes.observe(stage);
  if (bar) {
    watchSizes.observe(bar);
  }
  // A demo moves its captions by a state on the page (under the water, the words
  // on the sand): fit them again where that state puts them.
  const watchRoot = new MutationObserver((records) => {
    const changed = records.some(
      (record) =>
        record.attributeName !== 'style' &&
        record.attributeName !== null &&
        record.oldValue !== root.getAttribute(record.attributeName),
    );
    if (changed) {
      queueFit();
    }
  });
  watchRoot.observe(root, { attributes: true, attributeOldValue: true });
  document.fonts?.ready.then(queueFit, () => undefined);

  const shell: DemoShell = {
    root,
    stage,
    captions,
    ui,
    beats,
    cue,
    spokenBy: (speaker) =>
      beats.filter((beat) => beat.lines.some((line) => line.dataset.speaker === speaker)),
    profile,
    locale: {
      tag: profile.tag,
      numberFormat: (options) => {
        try {
          return new Intl.NumberFormat(profile.tag, options);
        } catch {
          // A tag the browser does not know formats in its own default rather than throwing.
          return new Intl.NumberFormat(undefined, options);
        }
      },
    },
    realia: (id) => realia[id],
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
      watchControls(el);
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
        // A keyboard reader whose control just left is not left on a hidden
        // button: focus moves to the next control still shown, else the stage.
        if (el.contains(document.activeElement)) {
          const next = [...stage.querySelectorAll<HTMLElement>('.demo__prop[data-shown]')].find(
            (other) => other !== el,
          );
          (next ?? stage).focus({ preventScroll: true });
        }
      };
      stage.append(el);
      return el;
    },
    status,
    note,
    progress: () => trigger.progress,
    keep: keepsakes.keep,
    kept: keepsakes.kept,
  };

  // A layer is decoration, hidden from assistive technology, until a demo puts a
  // control in it. Then only the branches without a control stay hidden, so the
  // control is reachable and announced by its own label.
  function exposeControls(layer: HTMLElement): void {
    const controls = layer.querySelectorAll('button, a[href], input, select, textarea, [tabindex]');
    if (controls.length === 0) {
      layer.setAttribute('aria-hidden', 'true');
      return;
    }
    layer.removeAttribute('aria-hidden');
    const hideBranches = (el: Element): void => {
      for (const child of el.children) {
        if (child.matches('button, a[href], input, select, textarea, [tabindex]')) {
          child.removeAttribute('aria-hidden');
          continue;
        }
        const holds = child.querySelector('button, a[href], input, select, textarea, [tabindex]');
        if (holds) {
          child.removeAttribute('aria-hidden');
          hideBranches(child);
        } else {
          child.setAttribute('aria-hidden', 'true');
        }
      }
    };
    hideBranches(layer);
  }
  function watchControls(layer: HTMLElement): void {
    let queued = false;
    const watch = new MutationObserver(() => {
      if (queued) {
        return;
      }
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        exposeControls(layer);
      });
    });
    watch.observe(layer, { childList: true, subtree: true });
    layerWatches.push(watch);
  }
  const layerWatches: MutationObserver[] = [];

  window.__aliceDemo = {
    progress: () => trigger.progress,
    beat: () => activeIndex,
    paused: () => paused,
    reduced: () => reducedMotion,
    mode: () => root.dataset.mode ?? '',
    locale: () => profile.lang,
    profile: () => ({ ...profile, setApart: [...profile.setApart] }),
    realia: () => realia,
    overrun: () => master.duration() - beats.length,
    auto: () => auto,
    sound: () => sound.state(),
    pointer: () => ({ ...pointer }),
    captionFit: () => Object.fromEntries(fitted),
    seek: (progress) => {
      const clamped = Math.min(1, Math.max(0, progress));
      window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * clamped);
      ScrollTrigger.update();
      if (reducedMotion) {
        showReduced(trigger.progress);
      } else {
        trigger.getTween?.()?.progress(1);
      }
    },
    settled: () => {
      if (reducedMotion) {
        return Math.abs(master.time() - reducedTimeFor(trigger.progress, beats.length)) < 1e-3;
      }
      // With a smoothed scrub this is the tween easing the timeline after the
      // scroll: settled once it is within a hair of the scroll and has either
      // finished or held still for a few frames.
      if (Math.abs(master.progress() - trigger.progress) >= 0.002) {
        return false;
      }
      const tween = trigger.getTween?.() as { isActive?: () => boolean } | undefined;
      const easing = typeof tween?.isActive === 'function' && tween.isActive();
      return !easing || stillFrames >= SETTLE_FRAMES;
    },
  };
  // A tween placed past the last beat stretches the timeline, and then the scroll
  // no longer lands each beat on its own unit of time. Say so once the demo has
  // composed, where the browser tests will see it.
  const composed = requestAnimationFrame(() => {
    if (reducedMotion) {
      showReduced(trigger.progress);
    }
    if (master.duration() > beats.length + 1e-6) {
      console.error(`master timeline overruns the beats: ${master.duration()} > ${beats.length}`);
    }
  });

  // A demo whose staging throws leaves no half-built stage: the page goes back
  // to the readable document it arrived as, sentences and links where a reader
  // finds them, and the error stays in the console.
  const detach = (): void => {
    lifetime.abort();
    cancelAnimationFrame(composed);
    cancelAnimationFrame(fitQueued);
    window.clearTimeout(liveTimer);
    gsap.ticker.remove(tick);
    frameFns.clear();
    trigger.kill();
    master.kill();
    ambient.kill();
    watchSizes.disconnect();
    watchRoot.disconnect();
    for (const watch of layerWatches) {
      watch.disconnect();
    }
    sound.dispose();
    for (const beat of beats) {
      gsap.killTweensOf(beat.lines);
      for (const el of [beat.el, ...beat.lines]) {
        el.removeAttribute('style');
      }
      for (const key of ['active', 'reached', 'fit', 'fitShift']) {
        delete beat.el.dataset[key];
      }
      homes.get(beat.el)?.append(beat.el);
    }
    stage.remove();
    for (const added of root.querySelectorAll('.demo__note, .demo__sound, .demo__tilt')) {
      added.remove();
    }
    if (button) {
      button.hidden = true;
    }
    if (autoButton) {
      autoButton.hidden = true;
    }
    end?.removeAttribute('inert');
    end?.removeAttribute('data-auto');
    nextLink?.removeAttribute('style');
    // Whatever state the shell or the demo wrote on the page goes with it; the
    // build's own attributes stay.
    root.removeAttribute('style');
    for (const name of root.getAttributeNames()) {
      if (name.startsWith('data-') && name !== 'data-demo' && name !== 'data-realia') {
        root.removeAttribute(name);
      }
    }
    delete window.__aliceDemo;
  };

  if (options.mount) {
    try {
      options.mount(shell);
    } catch (error) {
      console.error(error);
      detach();
      return undefined;
    }
  }
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
