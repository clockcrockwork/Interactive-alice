import { describe, expect, it } from 'vitest';
import {
  clamp,
  composeShots,
  directionOf,
  localProgress,
  renderEnd,
  type ShotSpan,
  type Span,
  spanState,
  spanStates,
  VELOCITY_EPSILON,
  velocityOf,
} from './progress.ts';

const spans: Span[] = [
  { id: 'a', start: 0, end: 0.25 },
  { id: 'b', start: 0.25, end: 0.75 },
  { id: 'c', start: 0.75, end: 1 },
];

describe('clamp', () => {
  it('keeps a value inside its range', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(0.4)).toBe(0.4);
    expect(clamp(5, 1, 3)).toBe(3);
  });
});

describe('localProgress', () => {
  it('maps a span onto 0..1', () => {
    expect(localProgress(0.25, 0.25, 0.75)).toBe(0);
    expect(localProgress(0.5, 0.25, 0.75)).toBe(0.5);
    expect(localProgress(0.75, 0.25, 0.75)).toBe(1);
  });

  it('clamps outside the span', () => {
    expect(localProgress(0, 0.25, 0.75)).toBe(0);
    expect(localProgress(1, 0.25, 0.75)).toBe(1);
  });

  it('treats an empty span as passed once reached', () => {
    expect(localProgress(0.1, 0.5, 0.5)).toBe(0);
    expect(localProgress(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe('spanState', () => {
  it('reports where progress sits', () => {
    expect(spanState(0.1, spans[1] as Span).state).toBe('before');
    expect(spanState(0.5, spans[1] as Span).state).toBe('active');
    expect(spanState(0.9, spans[1] as Span).state).toBe('after');
  });

  it('gives a boundary to the span that starts there', () => {
    // 0.25 ends span a and starts span b; both must not claim it.
    expect(spanState(0.25, spans[0] as Span).state).toBe('after');
    expect(spanState(0.25, spans[1] as Span).state).toBe('active');
  });
});

describe('spanStates', () => {
  const activeOf = (progress: number) =>
    spanStates(progress, spans).find((span) => span.state === 'active')?.id;

  it('finds the span covering progress', () => {
    expect(activeOf(0)).toBe('a');
    expect(activeOf(0.25)).toBe('b');
    expect(activeOf(0.74)).toBe('b');
    expect(activeOf(0.75)).toBe('c');
  });

  it('holds the last span at the end, and the first before the start', () => {
    // A track's end is the last span's final frame, not a frame after it: the
    // last beat of a scene is still the one a reader is on at the bottom.
    expect(activeOf(1)).toBe('c');
    expect(activeOf(1.5)).toBe('c');
    expect(activeOf(-0.2)).toBe('a');
  });

  it('names exactly one active span at every progress', () => {
    for (let progress = -0.1; progress <= 1.1; progress += 0.01) {
      const active = spanStates(progress, spans).filter((span) => span.state === 'active');
      expect(active, `at ${progress}`).toHaveLength(1);
    }
  });

  it('agrees with spanState everywhere except the track’s own end', () => {
    for (const progress of [0, 0.1, 0.25, 0.5, 0.75, 0.99]) {
      const states = spanStates(progress, spans);
      for (const [index, span] of spans.entries()) {
        expect(states[index]?.state, `${span.id} at ${progress}`).toBe(
          spanState(progress, span).state,
        );
      }
    }
    // The one difference, and the reason this function exists.
    expect(spanState(1, spans[2] as Span).state).toBe('after');
    expect(spanStates(1, spans)[2]?.state).toBe('active');
  });

  it('reports local progress alongside the state', () => {
    expect(spanStates(0.5, spans)[1]?.local).toBeCloseTo(0.5, 12);
    expect(spanStates(1, spans)[2]?.local).toBe(1);
  });

  it('has nothing to return without spans', () => {
    expect(spanStates(0.5, [])).toEqual([]);
  });
});

describe('directionOf', () => {
  it('ignores jitter below the threshold', () => {
    expect(directionOf(0.01)).toBe(1);
    expect(directionOf(-0.01)).toBe(-1);
    expect(directionOf(0)).toBe(0);
    expect(directionOf(0.00001)).toBe(0);
  });
});

describe('velocityOf', () => {
  it('moves towards the instantaneous value, by a time constant in seconds', () => {
    // instant = 0.1 / 0.1 = 1; alpha = 1 - exp(-0.1 / 0.12)
    const expected = 1 - Math.exp(-0.1 / 0.12);
    expect(velocityOf(0, 0.1, 0.1)).toBeCloseTo(expected, 10);
  });

  it('follows closely with a short time constant and lags with a long one', () => {
    expect(velocityOf(0, 0.1, 0.1, 0.001)).toBeCloseTo(1, 6);
    expect(velocityOf(0, 0.1, 0.1, 10)).toBeLessThan(0.02);
  });

  it('settles at the same place whatever the frame rate', () => {
    // One 100 ms frame against four 25 ms frames, same scroll speed.
    const single = velocityOf(0, 0.1, 0.1);
    let stepped = 0;
    for (let i = 0; i < 4; i += 1) {
      stepped = velocityOf(stepped, 0.025, 0.025);
    }
    expect(stepped).toBeCloseTo(single, 2);
  });

  it('keeps the previous value when no time has passed', () => {
    expect(velocityOf(0.4, 0.2, 0)).toBe(0.4);
  });

  it('lets a tiny residue settle to zero rather than lingering', () => {
    expect(velocityOf(VELOCITY_EPSILON / 2, 0, 0.016)).toBe(0);
  });
});

/**
 * Shot overlap.
 *
 * Two spans of the same shape throughout, so the arithmetic stays readable: `one`
 * runs 0 to 0.4 and `two` runs 0.4 to 1, and an overlap of 0.25 keeps `one` drawing
 * for a quarter of `two`'s span, which is 0.4 + 0.25 × 0.6 = 0.55.
 */
const cut: ShotSpan[] = [
  { id: 'one', start: 0, end: 0.4, overlap: 0 },
  { id: 'two', start: 0.4, end: 1, overlap: 0 },
];
const handover: ShotSpan[] = [
  { id: 'one', start: 0, end: 0.4, overlap: 0.25 },
  { id: 'two', start: 0.4, end: 1, overlap: 0 },
];

const stateOf = (progress: number, shots: readonly ShotSpan[], id: string) =>
  composeShots(progress, shots).states.find((shot) => shot.id === id);

describe('renderEnd', () => {
  it('is the shot’s own end without an overlap', () => {
    expect(renderEnd(cut, 0)).toBe(0.4);
    expect(renderEnd(cut, 1)).toBe(1);
  });

  it('reaches a share of the next shot’s span, not of its own', () => {
    // A quarter of two's 0.6, not a quarter of one's 0.4.
    expect(renderEnd(handover, 0)).toBeCloseTo(0.55, 12);
  });

  it('has nowhere to reach from the last shot', () => {
    const trailing: ShotSpan[] = [{ id: 'only', start: 0, end: 1, overlap: 0.5 }];
    expect(renderEnd(trailing, 0)).toBe(1);
  });
});

describe('composeShots without overlap', () => {
  it('keeps exactly one shot on screen at a time', () => {
    for (const progress of [0, 0.1, 0.39, 0.4, 0.7, 0.99]) {
      const composition = composeShots(progress, cut);
      expect(composition.active, `at ${progress}`).toHaveLength(1);
      expect(composition.active[0]).toBe(composition.primary);
    }
  });

  it('gives a boundary to the shot that starts there, as a hard cut', () => {
    expect(stateOf(0.4, cut, 'one')?.state).toBe('after');
    expect(stateOf(0.4, cut, 'two')?.state).toBe('active');
    // Nothing is ever `outgoing` in a scene of hard cuts.
    for (const progress of [0, 0.2, 0.4, 0.6, 1]) {
      expect(composeShots(progress, cut).states.map((shot) => shot.state)).not.toContain(
        'outgoing',
      );
    }
  });

  it('reports a handoff of zero everywhere', () => {
    for (const progress of [0, 0.2, 0.4, 0.6, 1]) {
      for (const shot of composeShots(progress, cut).states) {
        expect(shot.handoff).toBe(0);
      }
    }
  });
});

describe('composeShots across an overlap', () => {
  it('has one shot on screen just before the boundary', () => {
    const composition = composeShots(0.39, handover);
    expect(composition.primary).toBe('one');
    expect(composition.active).toEqual(['one']);
    expect(stateOf(0.39, handover, 'one')?.handoff).toBe(0);
  });

  it('hands the scene over at the boundary while still drawing', () => {
    const composition = composeShots(0.4, handover);
    // The incoming shot owns the scene's progress the instant the span changes.
    expect(composition.primary).toBe('two');
    // The outgoing one is still on screen, and comes first: progression order.
    expect(composition.active).toEqual(['one', 'two']);
    expect(stateOf(0.4, handover, 'one')?.state).toBe('outgoing');
    expect(stateOf(0.4, handover, 'one')?.core).toBe(1);
    expect(stateOf(0.4, handover, 'one')?.handoff).toBe(0);
    expect(stateOf(0.4, handover, 'two')?.core).toBe(0);
  });

  it('runs the handoff from 0 to 1 across the tail alone', () => {
    // Halfway through the tail: 0.4 + 0.075 of the 0.15 the overlap is worth.
    expect(stateOf(0.475, handover, 'one')?.handoff).toBeCloseTo(0.5, 12);
    expect(composeShots(0.475, handover).active).toEqual(['one', 'two']);
    // The outgoing shot's core is pinned at 1 throughout; it owns no more scene.
    expect(stateOf(0.475, handover, 'one')?.core).toBe(1);
  });

  it('drops the outgoing shot when its tail ends', () => {
    expect(stateOf(0.55, handover, 'one')?.state).toBe('after');
    expect(composeShots(0.55, handover).active).toEqual(['two']);
    expect(stateOf(0.549, handover, 'one')?.state).toBe('outgoing');
  });

  it('never puts a third shot on screen, whatever the overlaps', () => {
    // Every shot overlapping the next by the maximum the schema allows.
    const chained: ShotSpan[] = [
      { id: 'one', start: 0, end: 0.25, overlap: 1 },
      { id: 'two', start: 0.25, end: 0.5, overlap: 1 },
      { id: 'three', start: 0.5, end: 0.75, overlap: 1 },
      { id: 'four', start: 0.75, end: 1, overlap: 0 },
    ];
    for (let progress = 0; progress <= 1; progress += 0.005) {
      const composition = composeShots(progress, chained);
      expect(composition.active.length, `at ${progress}`).toBeLessThanOrEqual(2);
      expect(composition.primary, `at ${progress}`).toBeDefined();
    }
  });
});

describe('composeShots at the ends of a scene', () => {
  it('opens on the first shot', () => {
    expect(composeShots(0, handover).primary).toBe('one');
    expect(composeShots(0, handover).active).toEqual(['one']);
  });

  it('holds the last shot at the scene’s end rather than emptying the stage', () => {
    // Progress 1 is the scene's final frame, not a frame after it.
    expect(composeShots(1, handover).primary).toBe('two');
    expect(stateOf(1, handover, 'two')?.state).toBe('active');
    expect(stateOf(1, handover, 'two')?.core).toBe(1);
  });

  it('is total: a value outside 0..1 reads as the end it is past', () => {
    expect(composeShots(-0.5, handover)).toEqual(composeShots(0, handover));
    expect(composeShots(1.5, handover)).toEqual(composeShots(1, handover));
  });

  it('always names exactly one primary', () => {
    for (let progress = -0.1; progress <= 1.1; progress += 0.01) {
      const active = composeShots(progress, handover).states.filter(
        (shot) => shot.state === 'active',
      );
      expect(active, `at ${progress}`).toHaveLength(1);
    }
  });
});

describe('composeShots is a pure function of progress', () => {
  const walk = (values: number[]) =>
    values.map((progress) => JSON.stringify(composeShots(progress, handover)));

  it('reconstructs the same state scrolling backwards as forwards', () => {
    const points = [0, 0.2, 0.39, 0.4, 0.475, 0.549, 0.55, 0.8, 1];
    const forwards = walk(points);
    const backwards = walk([...points].reverse()).reverse();
    expect(backwards).toEqual(forwards);
  });

  it('does not remember having been somewhere else first', () => {
    const direct = JSON.stringify(composeShots(0.475, handover));
    // Arrive from above, from below, and after a round trip through both ends.
    for (const before of [0, 1, 0.55, 0.39]) {
      composeShots(before, handover);
      expect(JSON.stringify(composeShots(0.475, handover))).toBe(direct);
    }
  });
});
