import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planScene, type SceneMapping, type ScenePlan } from './pacing.ts';

const root = join(import.meta.dirname, '..', '..');
const read = (...parts: string[]): unknown =>
  JSON.parse(readFileSync(join(root, ...parts), 'utf8'));

const scene = read('experience', 'scenes', 'rabbit-hole.scene.json') as SceneMapping;
const fixture = read('tests', 'fixtures', 'rabbit-hole.plan.json') as ScenePlan[];

function textFor(locale: string): Record<string, string> {
  const chapter = read('text', 'locales', locale, 'ch01.json') as {
    segments: Record<string, string>;
  };
  return chapter.segments;
}

// Python and TypeScript both derive spans; the fixture is what keeps them one formula.
// Floating point order of operations differs, so compare to a tolerance far finer than
// a pixel of scroll rather than bit-for-bit.
const TOLERANCE = 1e-12;

describe('planScene', () => {
  for (const expected of fixture) {
    describe(expected.locale, () => {
      const actual = planScene(scene, expected.locale, textFor(expected.locale));

      it('matches the reference plan, shot for shot', () => {
        expect(actual.shots.map((shot) => shot.id)).toEqual(expected.shots.map((shot) => shot.id));
        for (const [index, shot] of actual.shots.entries()) {
          expect(shot.start).toBeCloseTo(expected.shots[index]?.start ?? -1, 12);
          expect(shot.end).toBeCloseTo(expected.shots[index]?.end ?? -1, 12);
        }
      });

      it('matches the reference plan, beat for beat', () => {
        expect(actual.beats.map((beat) => beat.id)).toEqual(expected.beats.map((beat) => beat.id));
        for (const [index, beat] of actual.beats.entries()) {
          expect(beat.start).toBeCloseTo(expected.beats[index]?.start ?? -1, 12);
          expect(beat.end).toBeCloseTo(expected.beats[index]?.end ?? -1, 12);
        }
      });

      it('reports the same text statistics', () => {
        expect(actual.characters).toBe(expected.characters);
        expect(actual.mean).toBeCloseTo(expected.mean, 12);
      });
    });
  }

  it('covers the whole scene without gaps', () => {
    const plan = planScene(scene, 'ja', textFor('ja'));
    expect(plan.shots[0]?.start).toBe(0);
    expect(plan.shots.at(-1)?.end).toBeCloseTo(1, 12);
    expect(plan.beats[0]?.start).toBe(0);
    expect(plan.beats.at(-1)?.end).toBeCloseTo(1, 12);

    for (const units of [plan.shots, plan.beats]) {
      for (const [index, unit] of units.entries()) {
        expect(unit.end).toBeGreaterThan(unit.start);
        if (index > 0) {
          expect(unit.start).toBeCloseTo(units[index - 1]?.end ?? -1, 12);
        }
      }
    }
  });

  it('holds a textless beat for at least one segment-equivalent', () => {
    const plan = planScene(scene, 'en-simple', textFor('en-simple'));
    const textless = scene.shots
      .flatMap((shot) => shot.beats.map((beat) => ({ shot, beat })))
      .filter((entry) => entry.beat.segments.length === 0);
    expect(textless.length).toBeGreaterThan(0);

    for (const { shot, beat } of textless) {
      const span = plan.beats.find((candidate) => candidate.id === beat.id);
      const width = (span?.end ?? 0) - (span?.start ?? 0);
      expect(width).toBeGreaterThan(TOLERANCE);
      // Its share reflects its own weight and its shot's, nothing else.
      expect(width).toBeLessThan((beat.weight ?? 1) * (shot.weight ?? 1));
    }
  });
});
