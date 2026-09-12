import { describe, expect, it } from 'vitest';
import {
  activeSpan,
  clamp,
  directionOf,
  localProgress,
  type Span,
  spanState,
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

describe('activeSpan', () => {
  it('finds the span covering progress', () => {
    expect(activeSpan(0, spans)?.id).toBe('a');
    expect(activeSpan(0.25, spans)?.id).toBe('b');
    expect(activeSpan(0.74, spans)?.id).toBe('b');
    expect(activeSpan(0.75, spans)?.id).toBe('c');
  });

  it('holds the last span at the end, and the first before the start', () => {
    expect(activeSpan(1, spans)?.id).toBe('c');
    expect(activeSpan(1.5, spans)?.id).toBe('c');
    expect(activeSpan(-0.2, spans)?.id).toBe('a');
  });

  it('has nothing to return without spans', () => {
    expect(activeSpan(0.5, [])).toBeUndefined();
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
