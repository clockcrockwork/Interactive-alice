import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { pythonCommand } from '../../build/python.ts';
import { planScene, type SceneMapping, type ScenePlan } from './pacing.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = (...parts: string[]): unknown =>
  JSON.parse(readFileSync(join(root, ...parts), 'utf8'));

const story = read('experience', 'story.json') as { scenes: { id: string; file: string }[] };
const fixture = read('tests', 'fixtures', 'plans.json') as ScenePlan[];

const scenes = new Map(
  story.scenes.map((entry) => [entry.id, read(entry.file) as SceneMapping] as const),
);

/** The chapters a scene stages, collected from its own ids rather than assumed. */
function chaptersOf(scene: SceneMapping): string[] {
  const chapters = new Set<string>();
  for (const shot of scene.shots) {
    for (const beat of shot.beats) {
      for (const id of beat.segments) {
        chapters.add(id.slice(2, 4));
      }
    }
  }
  return [...chapters].sort();
}

function textFor(scene: SceneMapping, locale: string): Record<string, string> {
  const segments: Record<string, string> = {};
  for (const chapter of chaptersOf(scene)) {
    const file = read('text', 'locales', locale, `ch${chapter}.json`) as {
      segments: Record<string, string>;
    };
    Object.assign(segments, file.segments);
  }
  return segments;
}

describe('planScene', () => {
  it('has a fixture for every scene the story lists', () => {
    for (const sceneId of scenes.keys()) {
      expect(
        fixture.some((entry) => entry.scene === sceneId),
        `no reference plan for ${sceneId}`,
      ).toBe(true);
    }
  });

  // Python and TypeScript both derive spans; the fixture is what keeps them one
  // formula. Floating point order of operations differs, so compare to a tolerance far
  // finer than a pixel of scroll rather than bit-for-bit.
  for (const expected of fixture) {
    describe(`${expected.scene} · ${expected.locale}`, () => {
      const scene = scenes.get(expected.scene);
      if (!scene) {
        throw new Error(`the fixture names an unknown scene ${expected.scene}`);
      }
      const actual = planScene(scene, expected.locale, textFor(scene, expected.locale));

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
        if (expected.mean === null) {
          // A scene that stages no text has no mean sentence length to report.
          expect(actual.mean).toBeNull();
        } else {
          expect(actual.mean).toBeCloseTo(expected.mean, 12);
        }
      });

      it('covers the whole scene without gaps', () => {
        expect(actual.shots[0]?.start).toBe(0);
        expect(actual.shots.at(-1)?.end).toBeCloseTo(1, 12);
        expect(actual.beats[0]?.start).toBe(0);
        expect(actual.beats.at(-1)?.end).toBeCloseTo(1, 12);

        for (const units of [actual.shots, actual.beats]) {
          for (const [index, unit] of units.entries()) {
            expect(unit.end).toBeGreaterThan(unit.start);
            if (index > 0) {
              expect(unit.start).toBeCloseTo(units[index - 1]?.end ?? -1, 12);
            }
          }
        }
      });

      it('holds a textless beat for at least one segment-equivalent', () => {
        const textless = scene.shots
          .flatMap((shot) => shot.beats.map((beat) => ({ shot, beat })))
          .filter((entry) => entry.beat.segments.length === 0);

        for (const { shot, beat } of textless) {
          const span = actual.beats.find((candidate) => candidate.id === beat.id);
          const width = (span?.end ?? 0) - (span?.start ?? 0);
          expect(width).toBeGreaterThan(0);
          // Its share reflects its own weight and its shot's, nothing else.
          expect(width).toBeLessThan((beat.weight ?? 1) * (shot.weight ?? 1));
        }
      });
    });
  }
});

/**
 * A scene may legitimately stage no text: the model lets a beat hold zero segments,
 * and a purely visual scene is that all the way through. No such scene exists in the
 * story yet, so the golden fixture cannot cover this case; the Python reference is
 * called directly instead, which keeps the rule that the formula exists once.
 */
describe('a scene that stages no text', () => {
  const scene: SceneMapping = {
    id: 'textless',
    shots: [
      {
        id: 'first',
        weight: 2,
        beats: [
          { id: 'a', segments: [] },
          { id: 'b', weight: 3, segments: [] },
        ],
      },
      { id: 'second', beats: [{ id: 'c', segments: [] }] },
    ],
  } as SceneMapping;

  const plan = planScene(scene, 'en-simple', {});

  it('has no mean sentence length to report', () => {
    expect(plan.characters).toBe(0);
    expect(plan.mean).toBeNull();
  });

  it('divides the scene by weight alone, with every beat held for the minimum', () => {
    // first: 2 × (1 + 3) = 8, second: 1 × 1 = 1, so the first shot takes 8/9.
    expect(plan.shots[0]?.end).toBeCloseTo(8 / 9, 12);
    expect(plan.shots.at(-1)?.end).toBeCloseTo(1, 12);
    expect(plan.beats[0]?.end).toBeCloseTo(2 / 9, 12);
    expect(plan.beats[1]?.end).toBeCloseTo(8 / 9, 12);
  });

  it('agrees with the Python reference', () => {
    const [python, ...pythonArgs] = pythonCommand();
    if (!python) {
      throw new Error('no Python interpreter');
    }

    const reference = JSON.parse(
      execFileSync(
        python,
        [
          ...pythonArgs,
          '-c',
          [
            'import importlib.util, json, sys',
            'spec = importlib.util.spec_from_file_location("ref", sys.argv[1])',
            'ref = importlib.util.module_from_spec(spec)',
            'spec.loader.exec_module(ref)',
            'ref.locale_text = lambda locale, chapters: {}',
            'print(json.dumps(ref.plan(json.loads(sys.argv[2]), "en-simple")))',
          ].join('\n'),
          join(root, 'scripts', 'show-scene.py'),
          JSON.stringify(scene),
        ],
        { encoding: 'utf8' },
      ),
    ) as ScenePlan;

    expect(reference.mean).toBeNull();
    expect(reference.characters).toBe(0);
    for (const key of ['shots', 'beats'] as const) {
      expect(reference[key].map((span) => span.id)).toEqual(plan[key].map((span) => span.id));
      for (const [index, span] of reference[key].entries()) {
        expect(plan[key][index]?.start).toBeCloseTo(span.start, 12);
        expect(plan[key][index]?.end).toBeCloseTo(span.end, 12);
      }
    }
  });
});
