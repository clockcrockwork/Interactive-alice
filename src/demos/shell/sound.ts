/**
 * Sound, synthesised in the browser: no files, as docs/assets-and-audio.md wants
 * for effects. Off until the visitor turns it on (browsers require a gesture
 * anyway), silent while motion is paused, and every cue is a small recipe of
 * oscillators, noise and envelopes.
 *
 * Continuous cues (`wind`, `purr`, `drip`, and the places' own: `river`, `waves`,
 * `bubble`, `murmur`) are started once and levelled from a frame loop or a cue;
 * one-shot cues (`thud`, `paper`, `splash`, `chime`, `whoosh`, `glass`) play when
 * asked.
 *
 * Off means off: nothing creates an AudioContext, a source or a timer until the
 * visitor first turns sound on. While sound is off, held, the page hidden or put
 * away (`pagehide`, the back-forward cache), the recurring timers are cleared and
 * the context suspended; they come back when the page is shown again and only if
 * sound is still on. A page that is unloaded closes its context.
 */

export type ContinuousCue = 'wind' | 'purr' | 'drip' | 'river' | 'waves' | 'bubble' | 'murmur';
export type OneShotCue = 'thud' | 'paper' | 'splash' | 'chime' | 'whoosh' | 'glass';

export interface DemoSound {
  readonly enabled: boolean;
  /**
   * Turns sound on or off and returns the visitor's choice at once; on needs a user
   * gesture to have happened. The audio device may take its time to start, or
   * never start (a machine with no output): the choice does not wait for it.
   * Where the browser refuses outright, sound goes off again and `onRefused`
   * (given to `createSound`) says so.
   */
  toggle(): boolean;
  /** Mutes without turning off, for the motion pause. */
  hold(muted: boolean): void;
  play(cue: OneShotCue, strength?: number): void;
  /** Sets a continuous cue's level, 0..1. */
  level(cue: ContinuousCue, value: number): void;
  /** Test seam: the audio's state, serialisable. */
  state(): SoundState;
  /** Releases the context, its timers and the page listeners. */
  dispose(): void;
}

export interface SoundState {
  /** `none` until sound is first turned on. */
  context: 'none' | AudioContextState;
  /** Whether the recurring timers are scheduled. */
  running: boolean;
  /** Timers pending now. */
  timers: number;
  /** Timer callbacks run since the page loaded. */
  ticks: number;
}

/** What the synthesiser needs from the page; replaced in the unit tests. */
export interface SoundHost {
  createContext(): AudioContext;
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
  /** Where `pagehide` and `pageshow` arrive. */
  window: EventTarget;
  /** Where `visibilitychange` arrives, and whether the page is hidden. */
  document: EventTarget & { readonly hidden: boolean };
}

const browserHost = (): SoundHost => ({
  createContext: () => new AudioContext(),
  setTimeout: (fn, ms) => window.setTimeout(fn, ms),
  clearTimeout: (id) => window.clearTimeout(id),
  window,
  document,
});

function noiseBuffer(context: AudioContext): AudioBuffer {
  const seconds = 2;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    // Brown-ish noise: softer than white, closer to wind and paper.
    last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export function createSound(
  onRefused: () => void = () => undefined,
  host: SoundHost = browserHost(),
): DemoSound {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let enabled = false;
  let held = false;
  let hidden = host.document.hidden;
  let away = false;
  let closed = false;
  const continuous = new Map<ContinuousCue, { gain: GainNode; target: number }>();
  /** The recurring timers: how each runs, and when it first runs once started. */
  const loops: { run: () => void; first: number; next: () => number }[] = [];
  const timers = new Set<number>();
  let running = false;
  let ticks = 0;

  const schedule = (loop: (typeof loops)[number], ms: number): void => {
    const id = host.setTimeout(() => {
      timers.delete(id);
      if (!running) {
        return;
      }
      ticks += 1;
      loop.run();
      schedule(loop, loop.next());
    }, ms);
    timers.add(id);
  };

  const ensure = (): AudioContext | undefined => {
    if (context) {
      return context;
    }
    if (closed) {
      return undefined;
    }
    try {
      context = host.createContext();
    } catch {
      return undefined;
    }
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    const noise = noiseBuffer(context);

    // Wind: filtered noise whose cutoff rises with its level.
    const windSource = context.createBufferSource();
    windSource.buffer = noise;
    windSource.loop = true;
    const windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 300;
    const windGain = context.createGain();
    windGain.gain.value = 0;
    windSource.connect(windFilter).connect(windGain).connect(master);
    windSource.start();
    continuous.set('wind', { gain: windGain, target: 0 });

    // Purr: a low tone shaped by a fast tremolo.
    const purr = context.createOscillator();
    purr.type = 'sawtooth';
    purr.frequency.value = 28;
    const purrFilter = context.createBiquadFilter();
    purrFilter.type = 'lowpass';
    purrFilter.frequency.value = 120;
    const purrGain = context.createGain();
    purrGain.gain.value = 0;
    const tremolo = context.createOscillator();
    tremolo.frequency.value = 24;
    const tremoloGain = context.createGain();
    tremoloGain.gain.value = 0.5;
    tremolo.connect(tremoloGain).connect(purrGain.gain);
    purr.connect(purrFilter).connect(purrGain).connect(master);
    purr.start();
    tremolo.start();
    continuous.set('purr', { gain: purrGain, target: 0 });

    // Drip: a slow, irregular run of little plinks whose level sets how often.
    const dripGain = context.createGain();
    dripGain.gain.value = 0;
    dripGain.connect(master);
    continuous.set('drip', { gain: dripGain, target: 0 });
    const plink = (): void => {
      const entry = continuous.get('drip');
      if (context && entry && entry.target > 0.01 && !held) {
        const osc = context.createOscillator();
        osc.type = 'sine';
        const now = context.currentTime;
        osc.frequency.setValueAtTime(900 + Math.random() * 500, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.18);
        const env = context.createGain();
        env.gain.setValueAtTime(0.35, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(env).connect(dripGain);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    };
    loops.push({ run: plink, first: 600, next: () => 400 + Math.random() * 1600 });

    // River: a bright band of noise, and now and then a bird over it.
    const riverSource = context.createBufferSource();
    riverSource.buffer = noise;
    riverSource.loop = true;
    const riverFilter = context.createBiquadFilter();
    riverFilter.type = 'bandpass';
    riverFilter.frequency.value = 1400;
    riverFilter.Q.value = 0.7;
    const riverGain = context.createGain();
    riverGain.gain.value = 0;
    riverSource.connect(riverFilter).connect(riverGain).connect(master);
    riverSource.start();
    continuous.set('river', { gain: riverGain, target: 0 });
    const chirp = (): void => {
      const entry = continuous.get('river');
      if (context && entry && entry.target > 0.05 && !held) {
        const osc = context.createOscillator();
        osc.type = 'sine';
        const now = context.currentTime;
        const base = 2200 + Math.random() * 1200;
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.linearRampToValueAtTime(base * 1.3, now + 0.08);
        osc.frequency.linearRampToValueAtTime(base * 0.9, now + 0.18);
        const env = context.createGain();
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(0.5, now + 0.03);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(env).connect(riverGain);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    };
    loops.push({ run: chirp, first: 1200, next: () => 1800 + Math.random() * 4200 });

    // Waves: low noise that swells and falls on a slow breath.
    const wavesSource = context.createBufferSource();
    wavesSource.buffer = noise;
    wavesSource.loop = true;
    const wavesFilter = context.createBiquadFilter();
    wavesFilter.type = 'lowpass';
    wavesFilter.frequency.value = 520;
    const wavesGain = context.createGain();
    wavesGain.gain.value = 0;
    const breath = context.createGain();
    breath.gain.value = 0.55;
    const breathLfo = context.createOscillator();
    breathLfo.frequency.value = 0.11;
    const breathDepth = context.createGain();
    breathDepth.gain.value = 0.45;
    breathLfo.connect(breathDepth).connect(breath.gain);
    wavesSource.connect(wavesFilter).connect(breath).connect(wavesGain).connect(master);
    wavesSource.start();
    breathLfo.start();
    continuous.set('waves', { gain: wavesGain, target: 0 });

    // Bubble: a pot on the fire, low plops at a quick irregular rate.
    const bubbleGain = context.createGain();
    bubbleGain.gain.value = 0;
    bubbleGain.connect(master);
    continuous.set('bubble', { gain: bubbleGain, target: 0 });
    const plop = (): void => {
      const entry = continuous.get('bubble');
      if (context && entry && entry.target > 0.01 && !held) {
        const osc = context.createOscillator();
        osc.type = 'sine';
        const now = context.currentTime;
        const base = 160 + Math.random() * 180;
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 2.2, now + 0.09);
        const env = context.createGain();
        env.gain.setValueAtTime(0.4, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(env).connect(bubbleGain);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    };
    loops.push({ run: plop, first: 500, next: () => 140 + Math.random() * 500 });

    // Murmur: a crowd, a middle band of noise that wavers.
    const murmurSource = context.createBufferSource();
    murmurSource.buffer = noise;
    murmurSource.loop = true;
    const murmurFilter = context.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 480;
    murmurFilter.Q.value = 1.2;
    const murmurGain = context.createGain();
    murmurGain.gain.value = 0;
    murmurSource.connect(murmurFilter).connect(murmurGain).connect(master);
    murmurSource.start();
    continuous.set('murmur', { gain: murmurGain, target: 0 });

    // Levels follow their targets smoothly, from one place.
    const follow = (): void => {
      if (!context) {
        return;
      }
      const now = context.currentTime;
      for (const [name, entry] of continuous) {
        const waver = name === 'murmur' ? 0.55 + Math.random() * 0.45 : 1;
        entry.gain.gain.setTargetAtTime(held ? 0 : entry.target * waver, now, 0.15);
        if (name === 'wind') {
          windFilter.frequency.setTargetAtTime(300 + entry.target * 1800, now, 0.2);
        }
      }
    };
    loops.push({ run: follow, first: 0, next: () => 100 });
    return context;
  };

  /**
   * Runs the timers and the context only while sound is on, not held, and the page
   * is shown; stops both otherwise. The one place that decides.
   */
  const sync = (): void => {
    const ctx = context;
    const live = enabled && !held && !hidden && !away && ctx !== undefined && !closed;
    if (live === running) {
      return;
    }
    running = live;
    if (!ctx) {
      return;
    }
    if (live) {
      for (const loop of loops) {
        schedule(loop, loop.first);
      }
      master?.gain.setTargetAtTime(0.8, ctx.currentTime, 0.1);
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
          enabled = false;
          sync();
          onRefused();
        });
      }
      return;
    }
    for (const id of timers) {
      host.clearTimeout(id);
    }
    timers.clear();
    master?.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    if (ctx.state === 'running') {
      ctx.suspend().catch(() => undefined);
    }
  };

  const lifetime = new AbortController();
  const { signal } = lifetime;
  host.document.addEventListener(
    'visibilitychange',
    () => {
      hidden = host.document.hidden;
      sync();
    },
    { signal },
  );
  host.window.addEventListener(
    'pagehide',
    (event) => {
      away = true;
      sync();
      // Not kept for a return: the context goes with the page.
      if (!(event as PageTransitionEvent).persisted && context) {
        closed = true;
        context.close().catch(() => undefined);
      }
    },
    { signal },
  );
  host.window.addEventListener(
    'pageshow',
    () => {
      away = false;
      hidden = host.document.hidden;
      sync();
    },
    { signal },
  );

  const oneShot = (cue: OneShotCue, strength: number): void => {
    // Checked before anything is made: sound off creates nothing.
    if (!enabled || !running) {
      return;
    }
    const ctx = context;
    if (!ctx || !master) {
      return;
    }
    const now = ctx.currentTime;
    const env = ctx.createGain();
    env.connect(master);
    const s = Math.max(0.05, Math.min(1, strength));
    switch (cue) {
      case 'thud': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        env.gain.setValueAtTime(0.9 * s, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(env);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'paper':
      case 'whoosh':
      case 'splash': {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = cue === 'splash' ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(cue === 'paper' ? 2400 : 600, now);
        filter.frequency.exponentialRampToValueAtTime(
          cue === 'whoosh' ? 3000 : 200,
          now + (cue === 'whoosh' ? 0.6 : 0.25),
        );
        const length = cue === 'paper' ? 0.12 : cue === 'whoosh' ? 0.7 : 0.4;
        env.gain.setValueAtTime(0.001, now);
        env.gain.exponentialRampToValueAtTime(0.7 * s, now + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, now + length);
        source.connect(filter).connect(env);
        source.start(now);
        source.stop(now + length + 0.05);
        break;
      }
      case 'chime': {
        for (const [i, ratio] of [1, 1.5, 2.01].entries()) {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = 660 * ratio;
          const partial = ctx.createGain();
          partial.gain.setValueAtTime(0.25 * s * (1 - i * 0.3), now);
          partial.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(partial).connect(env);
          osc.start(now);
          osc.stop(now + 1);
        }
        env.gain.value = 1;
        break;
      }
      case 'glass': {
        for (let i = 0; i < 6; i += 1) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = 1800 + Math.random() * 2600;
          const partial = ctx.createGain();
          const at = now + Math.random() * 0.15;
          partial.gain.setValueAtTime(0.18 * s, at);
          partial.gain.exponentialRampToValueAtTime(0.001, at + 0.3 + Math.random() * 0.3);
          osc.connect(partial).connect(env);
          osc.start(at);
          osc.stop(at + 0.7);
        }
        env.gain.value = 1;
        break;
      }
    }
  };

  return {
    get enabled() {
      return enabled;
    },
    toggle() {
      enabled = !enabled;
      if (enabled && !ensure()) {
        enabled = false;
      }
      sync();
      return enabled;
    },
    hold(muted) {
      held = muted;
      sync();
    },
    play(cue, strength = 1) {
      oneShot(cue, strength);
    },
    level(cue, value) {
      // Only a context the visitor asked for has levels to set.
      const entry = continuous.get(cue);
      if (entry) {
        entry.target = Math.max(0, Math.min(1, value));
      }
    },
    state: () => ({
      context: context ? context.state : 'none',
      running,
      timers: timers.size,
      ticks,
    }),
    dispose() {
      lifetime.abort();
      enabled = false;
      sync();
      if (context && !closed) {
        closed = true;
        context.close().catch(() => undefined);
      }
    },
  };
}
