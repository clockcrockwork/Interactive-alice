import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { pythonCommand } from '../../build/python.mjs';
import { overlapsOf, planScene, type SceneMapping, type ScenePlan } from './pacing.ts';

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

/**
 * Overlap is a rendering fact, not a pacing one.
 *
 * The claim is that adding an overlap to a mapping cannot move a boundary, change
 * what a beat owns, or lengthen a scene. That is worth asserting rather than
 * assuming, because the two are read from the same file and a future change could
 * quietly couple them.
 */
describe('overlap and the pacing plan', () => {
  const mapping: SceneMapping = {
    id: 'paced',
    shots: [
      { id: 'first', weight: 2, beats: [{ id: 'a', segments: [] }] },
      { id: 'middle', beats: [{ id: 'b', weight: 3, segments: [] }] },
      { id: 'last', beats: [{ id: 'c', segments: [] }] },
    ],
  } as SceneMapping;

  /** A copy with overlaps set by position; the schema shape is a tuple, not a list. */
  const withOverlap = (values: (number | undefined)[]): SceneMapping => {
    const copy = JSON.parse(JSON.stringify(mapping)) as SceneMapping;
    for (const [index, value] of values.entries()) {
      const shot = copy.shots[index];
      if (shot && value !== undefined) {
        shot.overlap = value;
      }
    }
    return copy;
  };

  const overlapped = withOverlap([0.6, 1]);

  it('leaves every span exactly where it was', () => {
    expect(planScene(overlapped, 'en-simple', {})).toEqual(planScene(mapping, 'en-simple', {}));
  });

  it('reads back the overlaps it was given, and zero for a shot without one', () => {
    expect(overlapsOf(overlapped)).toEqual([0.6, 1, 0]);
    expect(overlapsOf(mapping)).toEqual([0, 0, 0]);
  });

  it('refuses an overlap on the shot that has nothing to hand over to', () => {
    expect(() => overlapsOf(withOverlap([undefined, undefined, 0.1]))).toThrow(
      /no following shot to hand over to/,
    );
  });

  it('refuses an explicit zero there too, on the same terms as the checker', () => {
    // Presence, not value. A shot with nothing after it should not be talking
    // about handing over at all, and the data checker already reads it that way.
    expect(() => overlapsOf(withOverlap([undefined, undefined, 0]))).toThrow(
      /no following shot to hand over to/,
    );
  });

  it('refuses a value the runtime could not honour', () => {
    expect(() => overlapsOf(withOverlap([1.5]))).toThrow(/outside 0\.\.1/);
    expect(() => overlapsOf(withOverlap([-0.1]))).toThrow(/outside 0\.\.1/);
  });

  it('refuses anything that is not a number, rather than coercing it', () => {
    // Nothing validates a scene file against its schema at build time, so a
    // non-number reaching here is possible. `null`, `false` and a numeric string
    // all survive a comparison against 0 and 1; none of them is an overlap.
    for (const value of [null, false, true, '0.5', Number.NaN, []]) {
      expect(
        () => overlapsOf(withOverlap([value as unknown as number])),
        `${JSON.stringify(value)} was accepted`,
      ).toThrow(/not a number|outside 0\.\.1/);
    }
  });
});

/**
 * The positional rule, as the data gate itself states it.
 *
 * The schema owns the type and the range; "the last shot may not declare one" is
 * not expressible in JSON Schema, so it lives in `check-experience.py` and in
 * `overlapsOf`. This calls the checker's own function rather than paraphrasing the
 * rule, because a paraphrase cannot catch the two drifting apart — which is
 * exactly what happened when the build accepted an explicit zero the checker
 * rejected.
 */
describe('the data checker and the build agree on overlap', () => {
  const shots = (...overlaps: (number | undefined)[]) => ({
    shots: overlaps.map((overlap, index) => ({
      id: `s${index}`,
      ...(overlap === undefined ? {} : { overlap }),
      beats: [{ id: `b${index}`, segments: [] }],
    })),
  });

  /** Errors the real `check_shots` reports for a scene. */
  const checkerErrors = (scene: unknown): string[] => {
    const [python, ...args] = pythonCommand();
    if (!python) {
      throw new Error('no Python interpreter');
    }
    const directory = mkdtempSync(join(tmpdir(), 'alice-overlap-'));
    try {
      const file = join(directory, 'scene.json');
      writeFileSync(file, JSON.stringify(scene), 'utf8');
      return JSON.parse(
        execFileSync(
          python,
          [
            ...args,
            '-c',
            [
              'import importlib.util, json, sys',
              'spec = importlib.util.spec_from_file_location("chk", sys.argv[1])',
              'chk = importlib.util.module_from_spec(spec)',
              'spec.loader.exec_module(chk)',
              'scene = json.load(open(sys.argv[2], encoding="utf-8"))',
              'errors = []',
              'chk.check_shots(scene, "scene.json", errors)',
              'print(json.dumps(errors))',
            ].join('\n'),
            join(root, 'scripts', 'check-experience.py'),
            file,
          ],
          { encoding: 'utf8' },
        ),
      ) as string[];
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  };

  /** Whether the build's half of the same rule rejects a scene. */
  const buildRejects = (scene: { shots: unknown[] }): boolean => {
    try {
      overlapsOf({ id: 'checked', ...scene } as unknown as SceneMapping);
      return false;
    } catch {
      return true;
    }
  };

  const cases: { label: string; scene: ReturnType<typeof shots>; rejected: boolean }[] = [
    { label: 'no overlap anywhere', scene: shots(undefined, undefined), rejected: false },
    {
      label: 'an overlap on a shot that has a next one',
      scene: shots(0.5, undefined),
      rejected: false,
    },
    {
      label: 'the maximum on a shot that has a next one',
      scene: shots(1, undefined),
      rejected: false,
    },
    { label: 'an overlap on the last shot', scene: shots(undefined, 0.5), rejected: true },
    { label: 'an explicit zero on the last shot', scene: shots(undefined, 0), rejected: true },
    { label: 'an overlap on the only shot', scene: shots(0.5), rejected: true },
  ];

  for (const { label, scene, rejected } of cases) {
    it(`${rejected ? 'rejects' : 'accepts'} ${label}, on both sides`, () => {
      expect(checkerErrors(scene).length > 0, 'the data checker').toBe(rejected);
      expect(buildRejects(scene), 'the build').toBe(rejected);
    });
  }

  it('leaves the story’s own mappings valid', () => {
    for (const [id, scene] of scenes) {
      expect(checkerErrors(scene), id).toEqual([]);
      expect(() => overlapsOf(scene), id).not.toThrow();
    }
  });
});
