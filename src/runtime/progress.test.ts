import { describe, expect, it } from 'vitest';
import {
  activeSpan,
  clamp,
  directionOf,
  localProgress,
  type Span,
  spanState,
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
  it('smooths towards the instantaneous value', () => {
    const first = velocityOf(0, 0.1, 0.1, 1);
    expect(first).toBeCloseTo(1, 10);
    const eased = velocityOf(0, 0.1, 0.1, 0.5);
    expect(eased).toBeCloseTo(0.5, 10);
  });

  it('keeps the previous value when no time has passed', () => {
    expect(velocityOf(0.4, 0.2, 0)).toBe(0.4);
  });
});
