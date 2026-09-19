import { describe, expect, it } from 'vitest';
import { transitionKindFor } from './transitions.ts';

describe('which way the screen turns between demo pages', () => {
  it('swallows the screen into a hole for the well, the hall and the chimney', () => {
    expect(transitionKindFor('https://x/demos/rabbit-hole/')).toBe('hole');
    expect(transitionKindFor('/sub/dir/demos/drink-me/')).toBe('hole');
    expect(transitionKindFor('https://x/demos/bill-the-lizard/?probe=1')).toBe('hole');
  });

  it('whirls it for the spiral, the pool and the wood', () => {
    expect(transitionKindFor('https://x/demos/dormouse/')).toBe('whirl');
    expect(transitionKindFor('https://x/demos/pool-of-tears/')).toBe('whirl');
    expect(transitionKindFor('https://x/demos/cheshire-cat/')).toBe('whirl');
  });

  it('deals it like a card everywhere else, the index included', () => {
    expect(transitionKindFor('https://x/demos/trial/')).toBe('cards');
    expect(transitionKindFor('https://x/demos/')).toBe('cards');
    expect(transitionKindFor('https://x/')).toBe('cards');
  });
});
