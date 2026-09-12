/**
 * The lifecycle a scene moves through, and the moves that are not allowed.
 *
 * Keeping this explicit is what lets a shot suspend its renderer without anyone
 * guessing whether it is safe to draw. See docs/implementation-charter.md §7.
 */

export type LifecycleState = 'idle' | 'mounted' | 'active' | 'suspended' | 'destroyed';

const ALLOWED: Record<LifecycleState, LifecycleState[]> = {
  idle: ['mounted', 'destroyed'],
  mounted: ['active', 'suspended', 'destroyed'],
  active: ['suspended', 'destroyed'],
  suspended: ['active', 'destroyed'],
  destroyed: [],
};

export class Lifecycle {
  #state: LifecycleState = 'idle';

  get state(): LifecycleState {
    return this.#state;
  }

  /** True while the scene should be doing per-frame work. */
  get running(): boolean {
    return this.#state === 'active';
  }

  can(next: LifecycleState): boolean {
    return ALLOWED[this.#state].includes(next);
  }

  to(next: LifecycleState): LifecycleState {
    if (!this.can(next)) {
      throw new Error(`a scene cannot go from ${this.#state} to ${next}`);
    }
    this.#state = next;
    return next;
  }
}
