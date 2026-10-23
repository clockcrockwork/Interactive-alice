import { describe, expect, it } from 'vitest';
import { HANDS, runnerAnchor } from './figures.ts';

const READY = 'svg[data-generated-rig="runner/alice"][data-rig-ready]';
function runner(ready: boolean, metadata: Record<string, string> = {}) {
  return {
    querySelector: (selector: string) =>
      ready && selector === READY
        ? { getAttribute: (name: string) => metadata[name] ?? null }
        : null,
  } as unknown as HTMLElement;
}
const metadata = {
  'data-runner-hand-u': '76.8',
  'data-runner-hand-v': '54.8',
  'data-runner-pocket-u': '62.5',
  'data-runner-pocket-v': '61.5',
  'data-runner-hand-rim-offset': '9.36',
};

const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
function transformedRunner(root: typeof identity | null, figure: typeof identity | null) {
  return {
    querySelector: () => ({
      getAttribute: (key: string) => metadata[key as keyof typeof metadata] ?? null,
      getCTM: () => root,
      querySelector: () => ({ getCTM: () => figure }),
    }),
  } as unknown as HTMLElement;
}

describe('runner attachment anchors', () => {
  it('uses both measured coordinates only on the ready Alice rig', () => {
    expect(runnerAnchor(runner(true, metadata), 'hand', HANDS.aliceHand)).toEqual({
      u: 76.8,
      v: 54.8,
    });
    expect(runnerAnchor(runner(true, metadata), 'pocket', HANDS.alicePocket)).toEqual({
      u: 62.5,
      v: 61.5,
    });
  });

  it('retains exact original fallbacks for pending, failed, blue and absent rigs', () => {
    const screenPocket = { u: 62, v: 0.74 * 116 };
    for (const el of [undefined, runner(false, metadata), runner(true)]) {
      expect(runnerAnchor(el, 'hand', HANDS.aliceHand)).toBe(HANDS.aliceHand);
      expect(runnerAnchor(el, 'pocket', HANDS.alicePocket)).toBe(HANDS.alicePocket);
      expect(runnerAnchor(el, 'pocket', screenPocket)).toBe(screenPocket);
    }
    expect(HANDS.aliceHand).toEqual({ u: 77, v: 84 });
    expect(HANDS.alicePocket).toEqual({ u: 60, v: 88 });
    expect(HANDS.dodoHand).toEqual({ u: 88, v: 36 });
    expect(HANDS.dodoRaised).toEqual({ u: 88, v: 22 });
  });

  it('rejects partial, non-finite, blank and out-of-box metadata as one pair', () => {
    for (const value of ['', ' ', 'NaN', 'Infinity', '-1', '117']) {
      expect(
        runnerAnchor(
          runner(true, { ...metadata, 'data-runner-hand-v': value }),
          'hand',
          HANDS.aliceHand,
        ),
      ).toBe(HANDS.aliceHand);
    }
    expect(
      runnerAnchor(runner(true, { 'data-runner-hand-u': '77' }), 'hand', HANDS.aliceHand),
    ).toBe(HANDS.aliceHand);
    expect(
      runnerAnchor(
        runner(true, { ...metadata, 'data-runner-hand-u': '101' }),
        'hand',
        HANDS.aliceHand,
      ),
    ).toBe(HANDS.aliceHand);
  });

  it('tracks the palm through the current bow without scaling the separate thimble', () => {
    const cosine = Math.cos(Math.PI / 6);
    const move = 116 * (1 - cosine) + 4.64 * cosine;
    const root = { ...identity, a: 3, d: 3, e: 10, f: 20 };
    const figure = { ...root, d: 3 * cosine, f: 20 + 3 * move };
    const el = transformedRunner(root, figure);
    const hand = runnerAnchor(el, 'hand', HANDS.aliceHand);
    expect(hand.u).toBeCloseTo(76.8, 9);
    expect(hand.v + 9.36).toBeCloseTo((54.8 + 9.36) * cosine + move, 9);
    // The prop itself stays upright and retains its 9.36-unit lower-rim offset.
    expect(hand.v).not.toBeCloseTo(54.8 * cosine + move, 4);
    const pocket = runnerAnchor(el, 'pocket', HANDS.alicePocket);
    expect(pocket.u).toBeCloseTo(62.5, 9);
    expect(pocket.v).toBeCloseTo(61.5 * cosine + move, 9);
  });

  it('cancels viewport translation and shear and can reconstruct a later unbowed state', () => {
    const root = { a: 2, b: 0.25, c: 0.5, d: 3, e: 50, f: -30 };
    expect(runnerAnchor(transformedRunner(root, root), 'hand', HANDS.aliceHand)).toEqual({
      u: 76.8,
      v: 54.8,
    });
    expect(
      runnerAnchor(transformedRunner(identity, identity), 'pocket', HANDS.alicePocket),
    ).toEqual({
      u: 62.5,
      v: 61.5,
    });
  });

  it('keeps finite metadata contacts if a CTM is unavailable, singular or invalid', () => {
    for (const [root, figure] of [
      [null, identity],
      [identity, null],
      [{ ...identity, a: 0, d: 0 }, identity],
      [identity, { ...identity, f: Number.NaN }],
      [{ ...identity, d: Number.POSITIVE_INFINITY }, identity],
    ]) {
      const hand = runnerAnchor(
        transformedRunner(root ?? null, figure ?? null),
        'hand',
        HANDS.aliceHand,
      );
      expect(hand).toEqual({ u: 76.8, v: 54.8 });
    }
  });
});
