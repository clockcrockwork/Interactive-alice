/**
 * Sound, synthesised in the browser: no files, as docs/assets-and-audio.md wants
 * for effects. Off until the visitor turns it on (browsers require a gesture
 * anyway), silent while motion is paused, and every cue is a small recipe of
 * oscillators, noise and envelopes.
 *
 * Continuous cues (`wind`, `purr`, `drip`) are started once and levelled from a
 * frame loop; one-shot cues (`thud`, `paper`, `splash`, `chime`, `whoosh`, `glass`)
 * play when asked.
 */

export type ContinuousCue = 'wind' | 'purr' | 'drip';
export type OneShotCue = 'thud' | 'paper' | 'splash' | 'chime' | 'whoosh' | 'glass';

export interface DemoSound {
  readonly enabled: boolean;
  /** Turns sound on or off; on needs a user gesture to have happened. */
  toggle(): Promise<boolean>;
  /** Mutes without turning off, for the motion pause. */
  hold(muted: boolean): void;
  play(cue: OneShotCue, strength?: number): void;
  /** Sets a continuous cue's level, 0..1. */
  level(cue: ContinuousCue, value: number): void;
}

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

export function createSound(): DemoSound {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let enabled = false;
  let held = false;
  const continuous = new Map<ContinuousCue, { gain: GainNode; target: number }>();

  const ensure = (): AudioContext | undefined => {
    if (context) {
      return context;
    }
    try {
      context = new AudioContext();
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
      setTimeout(plink, 400 + Math.random() * 1600);
    };
    setTimeout(plink, 600);

    // Levels follow their targets smoothly, from one place.
    const follow = (): void => {
      if (!context) {
        return;
      }
      const now = context.currentTime;
      for (const [name, entry] of continuous) {
        entry.gain.gain.setTargetAtTime(held ? 0 : entry.target, now, 0.15);
        if (name === 'wind') {
          windFilter.frequency.setTargetAtTime(300 + entry.target * 1800, now, 0.2);
        }
      }
      setTimeout(follow, 100);
    };
    follow();
    return context;
  };

  const oneShot = (cue: OneShotCue, strength: number): void => {
    const ctx = ensure();
    if (!ctx || !master || !enabled || held) {
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
    async toggle() {
      enabled = !enabled;
      const ctx = ensure();
      if (!ctx || !master) {
        enabled = false;
        return false;
      }
      if (enabled && ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          enabled = false;
        }
      }
      master.gain.setTargetAtTime(enabled ? 0.8 : 0, ctx.currentTime, 0.1);
      return enabled;
    },
    hold(muted) {
      held = muted;
    },
    play(cue, strength = 1) {
      oneShot(cue, strength);
    },
    level(cue, value) {
      const entry = continuous.get(cue);
      if (entry) {
        entry.target = Math.max(0, Math.min(1, value));
      } else if (enabled) {
        ensure();
        const made = continuous.get(cue);
        if (made) {
          made.target = Math.max(0, Math.min(1, value));
        }
      }
    },
  };
}
