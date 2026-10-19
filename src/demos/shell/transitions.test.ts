import { afterEach, describe, expect, it, vi } from 'vitest';
import { installTransitions, transitionKindFor } from './transitions.ts';

describe('which way the screen turns between demo pages', () => {
  it('swallows the screen into a hole for the well, the hall and the chimney', () => {
    expect(transitionKindFor('https://x/demos/rabbit-hole/')).toBe('hole');
    expect(transitionKindFor('/sub/dir/demos/drink-me/')).toBe('hole');
    expect(transitionKindFor('https://x/demos/bill-the-lizard/?probe=1')).toBe('hole');
  });

  it('whirls it for the spiral, the pool and the wood', () => {
    expect(transitionKindFor('https://x/demos/dormouse/')).toBe('whirl');
    expect(transitionKindFor('https://x/demos/mock-turtle/')).toBe('whirl');
    expect(transitionKindFor('https://x/demos/pig-and-pepper/')).toBe('cards');
    expect(transitionKindFor('https://x/demos/pool-of-tears/')).toBe('whirl');
    expect(transitionKindFor('https://x/demos/cheshire-cat/')).toBe('whirl');
  });

  it('deals it like a card everywhere else, the index included', () => {
    expect(transitionKindFor('https://x/demos/trial/')).toBe('cards');
    expect(transitionKindFor('https://x/demos/')).toBe('cards');
    expect(transitionKindFor('https://x/')).toBe('cards');
    expect(transitionKindFor('https://x/demos/ja/')).toBe('cards');
  });

  it("turns a locale's own page the way it turns the base locale's", () => {
    expect(transitionKindFor('https://x/demos/ja/rabbit-hole/')).toBe('hole');
    expect(transitionKindFor('/sub/demos/ja/dormouse/?probe=1')).toBe('whirl');
    expect(transitionKindFor('https://x/demos/ja/trial/')).toBe('cards');
  });
});

describe('a cross-document transition the browser skips', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is not an error: its rejected promises are handled, on leaving and on arriving', async () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    vi.stubGlobal('location', { href: 'https://x/demos/ja/riverbank/' });
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
    try {
      installTransitions();
      for (const type of ['pageswap', 'pagereveal']) {
        const skipped = new Error('Transition was aborted because of invalid state');
        const event = Object.assign(new Event(type), {
          viewTransition: {
            types: new Set<string>(),
            ready: Promise.reject(skipped),
            finished: Promise.reject(skipped),
          },
          activation: { entry: { url: 'https://x/demos/ja/riverbank/' } },
        });
        target.dispatchEvent(event);
        expect([...event.viewTransition.types]).toEqual([
          transitionKindFor('https://x/demos/ja/riverbank/'),
        ]);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });
});
