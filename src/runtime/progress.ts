/**
 * Progress arithmetic: the pure half of the runtime.
 *
 * Everything here is a function of values, so it can be tested without a document
 * and reasoned about without a browser. Scene progress is normalized 0..1 and is the
 * authoritative narrative input; shots and beats remap their slice of it into their
 * own 0..1. See docs/scene-shot-model.md §3.
 */

export type Direction = -1 | 0 | 1;

export interface Span {
  id: string;
  start: number;
  end: number;
}

export interface SpanState {
  /** Where this span sits relative to the current progress. */
  state: 'before' | 'active' | 'after';
  /** 0..1 inside the span: 0 before it starts, 1 once it has ended. */
  local: number;
}

export const clamp = (value: number, low = 0, high = 1): number =>
  value < low ? low : value > high ? high : value;

/** Maps a value in [start, end] onto 0..1, clamped, with an empty span reading as 1. */
export function localProgress(progress: number, start: number, end: number): number {
  if (end <= start) {
    return progress < start ? 0 : 1;
  }
  return clamp((progress - start) / (end - start));
}

export function spanState(progress: number, span: Span): SpanState {
  const local = localProgress(progress, span.start, span.end);
  if (progress < span.start) {
    return { state: 'before', local };
  }
  // The end of one span is the start of the next, so the boundary belongs forward.
  if (progress >= span.end) {
    return { state: 'after', local };
  }
  return { state: 'active', local };
}

/**
 * The span covering this progress, or the last one at the very end.
 *
 * Spans are contiguous and ordered, which `check-experience.py` enforces, so a
 * linear scan is both correct and cheap at this size.
 */
export function activeSpan(progress: number, spans: readonly Span[]): Span | undefined {
  const found = spans.find((span) => progress >= span.start && progress < span.end);
  return found ?? (progress >= 1 ? spans.at(-1) : spans[0]);
}

export function directionOf(delta: number, threshold = 0.0001): Direction {
  if (delta > threshold) {
    return 1;
  }
  if (delta < -threshold) {
    return -1;
  }
  return 0;
}

/**
 * Smoothed progress per second, so a scene can react to speed without chasing the
 * jitter of a single frame.
 */
export function velocityOf(
  previous: number,
  delta: number,
  seconds: number,
  smoothing = 0.2,
): number {
  if (seconds <= 0) {
    return previous;
  }
  const instant = delta / seconds;
  return previous + (instant - previous) * clamp(smoothing);
}
