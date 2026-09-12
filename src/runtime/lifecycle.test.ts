import { describe, expect, it } from 'vitest';
import { Lifecycle } from './lifecycle.ts';

describe('Lifecycle', () => {
  it('runs only while active', () => {
    const life = new Lifecycle();
    expect(life.state).toBe('idle');
    expect(life.running).toBe(false);

    life.to('mounted');
    expect(life.running).toBe(false);
    life.to('active');
    expect(life.running).toBe(true);
    life.to('suspended');
    expect(life.running).toBe(false);
    life.to('active');
    expect(life.running).toBe(true);
    life.to('destroyed');
    expect(life.running).toBe(false);
  });

  it('refuses a move that would skip mounting', () => {
    const life = new Lifecycle();
    expect(life.can('active')).toBe(false);
    expect(() => life.to('active')).toThrow(/cannot go from idle to active/);
  });

  it('is final once destroyed', () => {
    const life = new Lifecycle();
    life.to('destroyed');
    for (const state of ['idle', 'mounted', 'active', 'suspended'] as const) {
      expect(life.can(state)).toBe(false);
      expect(() => life.to(state)).toThrow();
    }
  });
});
