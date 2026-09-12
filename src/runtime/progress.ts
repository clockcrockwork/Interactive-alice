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

/** A span's state, carrying which span it belongs to. */
export interface TrackState extends SpanState {
  id: string;
}

/**
 * Every span's state across one contiguous, ordered track.
 *
 * Differs from `spanState` in one place, and it is the place that matters: the
 * last span holds the end of the track. Progress 1 is a track's final frame, not
 * a frame after it, so the last beat of a scene is still the beat a reader is on
 * when they reach the bottom, rather than one the document has already finished
 * with. Without that, a scene ends on an empty stage while its sticky stage is
 * still in the viewport.
 */
export function spanStates(progress: number, spans: readonly Span[]): TrackState[] {
  const here = clamp(progress);
  const last = spans.length - 1;
  return spans.map((span, index) => {
    const local = localProgress(here, span.start, span.end);
    // The first span owns everything before the track, the last everything after.
    if ((index === 0 && here < span.start) || (index === last && here >= span.end)) {
      return { id: span.id, state: 'active', local };
    }
    return { id: span.id, ...spanState(here, span) };
  });
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

export function directionOf(delta: number, threshold = 0.0001): Direction {
  if (delta > threshold) {
    return 1;
  }
  if (delta < -threshold) {
    return -1;
  }
  return 0;
}

/** Below this, velocity is noise and the runtime lets it settle to zero. */
export const VELOCITY_EPSILON = 0.0005;

/**
 * Smoothed progress per second, so a scene can react to speed without chasing the
 * jitter of a single frame.
 *
 * Smoothing is a time constant in seconds, not a per-frame factor, so a 120 Hz
 * display and a 60 Hz one settle at the same rate.
 */
export function velocityOf(previous: number, delta: number, seconds: number, tau = 0.12): number {
  if (seconds <= 0) {
    return previous;
  }
  const instant = delta / seconds;
  const alpha = 1 - Math.exp(-seconds / Math.max(tau, 1e-6));
  const next = previous + (instant - previous) * alpha;
  return Math.abs(next) < VELOCITY_EPSILON ? 0 : next;
}

/**
 * A shot's span, plus how far it stays on screen after handing over.
 *
 * `overlap` is a fraction of the *next* shot's span, not of this one's, because
 * what a handover is measured against is the composition taking over. It moves no
 * boundary: `start` and `end` are the shot's core span exactly as the pacing
 * formula derived them, and a scene's scroll distance is the same whether its
 * shots overlap or not. See docs/scene-shot-model.md §4.
 */
export interface ShotSpan extends Span {
  /** 0..1 of the next shot's span. 0 is a hard cut; the last shot is always 0. */
  overlap: number;
}

/**
 * `outgoing` is the state overlap adds: still drawing, no longer the primary.
 * A shot with no overlap never reaches it, so existing scenes are unaffected.
 */
export type ShotRenderState = 'before' | 'active' | 'outgoing' | 'after';

export interface ShotState {
  id: string;
  state: ShotRenderState;
  /** 0..1 across the shot's core span: the part of the scene this shot owns. */
  core: number;
  /**
   * 0..1 across the overlap tail alone: 0 where the shot hands over, 1 where it
   * stops drawing. Always 0 for a shot with no overlap, and 0 until this shot's
   * core span has ended, so it is only ever non-zero while the state is
   * `outgoing`.
   *
   * Separate from `core` rather than folded into it, because what an outgoing
   * composition needs is a value that runs the length of the handover: a
   * stylesheet can write `calc(1 - var(--handoff))` without knowing how long the
   * tail is relative to the shot. `core` keeps the meaning it already had, which
   * is what makes a scene without overlap render exactly as it did before.
   */
  handoff: number;
}

export interface ShotComposition {
  /**
   * The shot that owns the scene's progress here. Always exactly one, for any
   * progress value and any non-empty shot list.
   */
  primary: string | undefined;
  /**
   * Render-active shot ids in **progression order**, which during a handover means
   * the outgoing shot first and the primary second. Said explicitly because the
   * order is the document's, not a ranking: a renderer must not read position 0 as
   * "the important one".
   */
  active: string[];
  /** Every shot's state, in the order the shots were given. */
  states: ShotState[];
}

/**
 * Where a shot stops drawing: its own end, plus its share of the next shot's span.
 *
 * The last shot has nothing to hand over to, so it ends where it ends; the schema
 * and `check-experience.py` refuse an overlap on it rather than ignoring one.
 */
export function renderEnd(shots: readonly ShotSpan[], index: number): number {
  const shot = shots[index];
  if (!shot) {
    return 0;
  }
  const next = shots[index + 1];
  if (!next || shot.overlap <= 0) {
    return shot.end;
  }
  return shot.end + shot.overlap * (next.end - next.start);
}

/**
 * Which shots are on screen at this progress, and how far through each one is.
 *
 * A pure function of progress and the spans: nothing here remembers that progress
 * was once higher or lower, so scrolling backwards through an overlap reconstructs
 * the same set and the same values as scrolling forwards did. That is the whole
 * point of deriving it rather than driving it from events.
 *
 * At most two shots are ever render-active. An overlap may not exceed 1, so a
 * shot's render span cannot reach past the end of the next shot's span, and a
 * third composition can never join the other two.
 */
export function shotStates(progress: number, shots: readonly ShotSpan[]): ShotState[] {
  // Progress outside 0..1 is not a position a reader can be in; the driver clamps
  // for the same reason. Clamping here keeps this total, so exactly one shot is
  // the primary for every input rather than only for the ones the driver produces.
  const here = clamp(progress);
  const last = shots.length - 1;

  return shots.map((shot, index): ShotState => {
    const stop = renderEnd(shots, index);
    const core = localProgress(here, shot.start, shot.end);
    const handoff = stop > shot.end ? localProgress(here, shot.end, stop) : 0;
    // The first shot owns everything before it, and the last owns the scene's end:
    // progress 1 is the scene's final frame, not a frame after it, so the closing
    // framing stays on screen there instead of the composition emptying out.
    const holds = (index === 0 && here < shot.start) || (index === last && here >= shot.end);
    let state: ShotRenderState;
    if (here < shot.start && !holds) {
      state = 'before';
    } else if (here < shot.end || holds) {
      state = 'active';
    } else if (here < stop) {
      state = 'outgoing';
    } else {
      state = 'after';
    }
    return { id: shot.id, state, core, handoff };
  });
}

/**
 * The same states, plus the summary of them a snapshot reports.
 *
 * Kept apart from `shotStates` because the summary allocates two arrays and a
 * scan that the per-frame path never looks at: the stage only needs each shot's
 * own state, and the cost of building a summary it discards would grow with
 * shots times scenes on every frame.
 */
export function composeShots(progress: number, shots: readonly ShotSpan[]): ShotComposition {
  const states = shotStates(progress, shots);
  return {
    primary: states.find((shot) => shot.state === 'active')?.id,
    active: states
      .filter((shot) => shot.state === 'active' || shot.state === 'outgoing')
      .map((shot) => shot.id),
    states,
  };
}
