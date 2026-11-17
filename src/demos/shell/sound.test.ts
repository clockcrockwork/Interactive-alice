import { describe, expect, it } from 'vitest';
import { createSound, type SoundHost } from './sound.ts';

/** An AudioParam that accepts every automation call and keeps nothing. */
const param = () => ({
  value: 0,
  setValueAtTime() {},
  linearRampToValueAtTime() {},
  exponentialRampToValueAtTime() {},
  setTargetAtTime() {},
});

/** Any audio node: connectable, startable, with the params the recipes touch. */
const node = () => {
  const made = {
    gain: param(),
    frequency: param(),
    Q: param(),
    type: '',
    loop: false,
    buffer: null as unknown,
    connect: (target: unknown) => target,
    start() {},
    stop() {},
  };
  return made;
};

class FakeContext {
  static made = 0;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  sampleRate = 100;
  destination = node();
  constructor() {
    FakeContext.made += 1;
  }
  createGain = node;
  createOscillator = node;
  createBiquadFilter = node;
  createBufferSource = node;
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

/**
 * A context that settles a suspend at once while a resume is still under way, and
 * says so through `onstatechange`, as Chromium was seen to under load.
 */
class EagerSuspendContext extends FakeContext {
  onstatechange: (() => void) | null = null;
  override resume() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.state = 'running';
        this.onstatechange?.();
        resolve();
      }, 5);
    });
  }
  override suspend() {
    if (this.state !== 'suspended') {
      this.state = 'suspended';
      this.onstatechange?.();
    }
    return Promise.resolve();
  }
}

/** A context whose resume and suspend take effect a moment later, in the order asked. */
class SlowContext extends FakeContext {
  override resume() {
    return Promise.resolve().then(() => {
      this.state = 'running';
    });
  }
  override suspend() {
    return Promise.resolve().then(() => {
      this.state = 'suspended';
    });
  }
}

/** A page: its timers on a manual clock, its window and document as event targets. */
function fakeHost(Context: typeof FakeContext = FakeContext) {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; fn: () => void }>();
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const win = new EventTarget();
  const host: SoundHost = {
    createContext: () => new Context() as unknown as AudioContext,
    setTimeout: (fn, ms) => {
      const id = nextId++;
      pending.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: (id) => {
      pending.delete(id);
    },
    window: win,
    document: doc,
  };
  /** Moves the clock on, running every timer that falls due on the way. */
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = [...pending.entries()]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) {
        break;
      }
      pending.delete(due[0]);
      now = due[1].at;
      due[1].fn();
    }
    now = end;
  };
  const hide = (hidden: boolean) => {
    doc.hidden = hidden;
    doc.dispatchEvent(new Event('visibilitychange'));
  };
  const transition = (type: 'pagehide' | 'pageshow', persisted: boolean) => {
    win.dispatchEvent(Object.assign(new Event(type), { persisted }));
  };
  return { host, advance, hide, transition, pending };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('sound off means off', () => {
  it('creates no context, source or timer for one-shots, levels or holds before it is turned on', () => {
    FakeContext.made = 0;
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    sound.play('thud');
    sound.play('chime', 0.5);
    sound.level('wind', 1);
    sound.level('drip', 1);
    sound.hold(true);
    sound.hold(false);
    page.advance(10_000);
    expect(FakeContext.made).toBe(0);
    expect(page.pending.size).toBe(0);
    expect(sound.state()).toEqual({ context: 'none', running: false, timers: 0, ticks: 0 });
  });

  it('makes its context and timers on the first turn on, and stops the timers on turning off', async () => {
    FakeContext.made = 0;
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    expect(sound.toggle()).toBe(true);
    await flush();
    expect(FakeContext.made).toBe(1);
    expect(sound.state().context).toBe('running');
    page.advance(2_000);
    const ticks = sound.state().ticks;
    expect(ticks).toBeGreaterThan(10);
    expect(sound.toggle()).toBe(false);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'suspended', running: false, timers: 0 });
    page.advance(5_000);
    expect(sound.state().ticks).toBe(ticks);
    // One-shots while off make nothing.
    sound.play('glass');
    expect(FakeContext.made).toBe(1);
  });
});

describe('recurring timers follow the page', () => {
  it('run no callback while the page is hidden, and resume when it is shown, sound still on', async () => {
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    sound.toggle();
    page.advance(1_000);
    page.hide(true);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'suspended', running: false, timers: 0 });
    const ticks = sound.state().ticks;
    page.advance(10_000);
    expect(sound.state().ticks).toBe(ticks);
    page.hide(false);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'running', running: true });
    page.advance(1_000);
    expect(sound.state().ticks).toBeGreaterThan(ticks);
  });

  it('stop on pagehide, and resume on a pageshow from the back-forward cache only if sound is on', async () => {
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    sound.toggle();
    page.transition('pagehide', true);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'suspended', running: false, timers: 0 });
    const ticks = sound.state().ticks;
    page.advance(5_000);
    expect(sound.state().ticks).toBe(ticks);
    page.transition('pageshow', true);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'running', running: true });
    page.advance(1_000);
    expect(sound.state().ticks).toBeGreaterThan(ticks);
    // Turned off, then away and back: it stays off.
    sound.toggle();
    page.transition('pagehide', true);
    page.transition('pageshow', true);
    await flush();
    expect(sound.state()).toMatchObject({ running: false, timers: 0 });
  });

  it('are held, with the context, while motion is paused', async () => {
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    sound.toggle();
    sound.hold(true);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'suspended', running: false, timers: 0 });
    sound.hold(false);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'running', running: true });
  });

  it('suspend a context hidden while it is still starting', async () => {
    const page = fakeHost(SlowContext);
    const sound = createSound(undefined, page.host);
    sound.toggle();
    // Hidden before the context has finished starting.
    page.hide(true);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'suspended', running: false, timers: 0 });
    page.hide(false);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'running', running: true });
  });

  it('puts down a context that comes up after the page asked it to stop', async () => {
    const page = fakeHost(EagerSuspendContext);
    const sound = createSound(undefined, page.host);
    sound.toggle();
    page.transition('pagehide', true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sound.state()).toMatchObject({ context: 'suspended', running: false, timers: 0 });
  });

  it('close the context when the page is unloaded rather than kept', async () => {
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    sound.toggle();
    page.transition('pagehide', false);
    await flush();
    expect(sound.state()).toMatchObject({ context: 'closed', running: false, timers: 0 });
  });

  it('release everything on dispose', async () => {
    const page = fakeHost();
    const sound = createSound(undefined, page.host);
    sound.toggle();
    sound.dispose();
    await flush();
    expect(sound.state()).toMatchObject({ context: 'closed', running: false, timers: 0 });
    page.transition('pageshow', true);
    expect(sound.state().running).toBe(false);
  });
});
