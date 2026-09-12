/**
 * Derives how much of a scene's progress each shot and beat occupies.
 *
 * The mapping file carries staging weights; the text carries reading load. This
 * module is the only implementation of the formula in the browser, and
 * `scripts/show-scene.py --plan --json` produces the fixture that proves it still
 * agrees with the reference. See docs/text-experience-binding.md §4.
 */

/** A beat is held at least this long, in segment-equivalents, so a textless beat still reads. */
export const MINIMUM_HOLD = 1;

export interface BeatMapping {
  id: string;
  weight?: number;
  segments: string[];
}

export interface ShotMapping {
  id: string;
  devLabel?: string;
  weight?: number;
  beats: BeatMapping[];
}

export interface SceneMapping {
  id: string;
  devLabel?: string;
  shots: ShotMapping[];
}

export interface Span {
  id: string;
  start: number;
  end: number;
}

export interface ScenePlan {
  scene: string;
  locale: string;
  shots: Span[];
  beats: Span[];
  /** Characters of staged text in this locale. An authoring statistic, never a scroll multiplier. */
  characters: number;
  /** Mean staged sentence length in this locale: one segment-equivalent. */
  mean: number;
}

const weightOf = (unit: { weight?: number }): number => unit.weight ?? 1;

function stagedSegments(scene: SceneMapping): string[] {
  return scene.shots.flatMap((shot) => shot.beats.flatMap((beat) => beat.segments));
}

function lengthOf(segments: string[], text: Readonly<Record<string, string>>): number {
  return segments.reduce((total, id) => {
    const sentence = text[id];
    if (sentence === undefined) {
      throw new Error(`segment ${id} has no text in this locale`);
    }
    return total + [...sentence].length;
  }, 0);
}

function spansFrom(costs: { id: string; cost: number }[], total: number): Span[] {
  let start = 0;
  return costs.map(({ id, cost }) => {
    const end = start + cost / total;
    const span = { id, start, end };
    start = end;
    return span;
  });
}

/**
 * Shot and beat spans for one locale.
 *
 * Normalizing by this locale's own mean sentence length keeps the shape of the
 * plan comparable between languages. Absolute length stays out of it: total scroll
 * distance is art-directed, not derived from a character count.
 */
export function planScene(
  scene: SceneMapping,
  locale: string,
  text: Readonly<Record<string, string>>,
): ScenePlan {
  const staged = stagedSegments(scene);
  if (staged.length === 0) {
    throw new Error(`scene ${scene.id} stages no segments`);
  }
  const characters = lengthOf(staged, text);
  const mean = characters / staged.length;

  const beatCosts: { id: string; cost: number }[] = [];
  const shotCosts: { id: string; cost: number }[] = [];

  for (const shot of scene.shots) {
    let shotTotal = 0;
    for (const beat of shot.beats) {
      const load = lengthOf(beat.segments, text) / mean;
      const cost = weightOf(beat) * Math.max(load, MINIMUM_HOLD);
      beatCosts.push({ id: beat.id, cost });
      shotTotal += cost;
    }
    shotCosts.push({ id: shot.id, cost: weightOf(shot) * shotTotal });
  }

  const total = shotCosts.reduce((sum, shot) => sum + shot.cost, 0);
  // Beats divide their own shot's span, so scale each beat cost by its shot's weight.
  const scaledBeats = scene.shots.flatMap((shot) =>
    shot.beats.map((beat) => {
      const cost = beatCosts.find((entry) => entry.id === beat.id)?.cost ?? 0;
      return { id: beat.id, cost: cost * weightOf(shot) };
    }),
  );

  return {
    scene: scene.id,
    locale,
    shots: spansFrom(shotCosts, total),
    beats: spansFrom(scaledBeats, total),
    characters,
    mean,
  };
}
