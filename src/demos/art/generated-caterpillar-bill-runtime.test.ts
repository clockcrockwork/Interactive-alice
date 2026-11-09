import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  caterpillarHosePath,
  createCaterpillarHoseSync,
  generatedBillFragment,
  generatedBillHeadAnchor,
  generatedCaterpillarBillSvg,
} from './generated-caterpillar-bill.ts';

const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const points = (path: string): number[] => (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

describe('articulated geometry and readiness', () => {
  it('synchronizes a late ready hose and direct scroll poses even when ambient motion is paused', () => {
    const source = readFileSync(new URL('../caterpillar/main.ts', import.meta.url), 'utf8');
    expect(source).toContain('if (ready && rig.isConnected) syncGeneratedHoses();');
    expect(source.match(/onUpdate: syncGeneratedHoses/g)).toHaveLength(5);
    const module = readFileSync(
      new URL('./generated-caterpillar-bill.ts', import.meta.url),
      'utf8',
    );
    expect(module).not.toMatch(/requestAnimationFrame|setInterval|setTimeout/);
  });

  it('keeps the Caterpillar hookah endpoint fixed while its mouth follows the head matrix', () => {
    const neutral = points(caterpillarHosePath());
    const moved = points(caterpillarHosePath({ ...identity, e: -6, f: 8 }));
    expect(moved[0]).toBeCloseTo((neutral[0] ?? 0) - 6, 3);
    expect(moved[1]).toBeCloseTo((neutral[1] ?? 0) + 8, 3);
    expect(moved.slice(-2)).toEqual(neutral.slice(-2));
    const scaled = points(caterpillarHosePath({ ...identity, a: 1.3, d: 1.3, e: -60, f: -16 }));
    expect(scaled[0]).toBeCloseTo((neutral[0] ?? 0) * 1.3 - 60, 2);
    expect(scaled[1]).toBeCloseTo((neutral[1] ?? 0) * 1.3 - 16, 2);
    expect(scaled.slice(-2)).toEqual(neutral.slice(-2));
  });

  it('preserves the original head motion box without changing pending vector origins', () => {
    const markup = generatedCaterpillarBillSvg('caterpillar', 'engraved', 'caterpillar') ?? '';
    expect(markup).toContain(
      'data-caterpillar-head-box="" x="173.5" y="-2.5" width="85.5" height="103.5"',
    );
    expect(markup).toContain('patternUnits="userSpaceOnUse"');
    expect(markup).not.toContain('data-rig-part');
    expect(markup).not.toContain('--rig-origin');
    const source = readFileSync(new URL('../caterpillar/main.ts', import.meta.url), 'utf8');
    expect(source).toContain("transformOrigin: '30% 80%'");
    const css = readFileSync(new URL('../caterpillar/caterpillar.css', import.meta.url), 'utf8');
    expect(css).toContain('transform-origin: 20% 90%');
  });

  it('only reads connected ready head matrices, updating all hose strokes atomically and only on change', () => {
    let ready = false;
    let connected = true;
    let matrix = { ...identity };
    const paths = [{ setAttribute: vi.fn() }, { setAttribute: vi.fn() }, { setAttribute: vi.fn() }];
    const headMatrix = vi.fn(() => matrix);
    const relative = vi.fn((m: typeof identity) => m);
    const rootMatrix = vi.fn(() => ({ inverse: () => ({ multiply: relative }) }));
    const svg = {
      get isConnected() {
        return connected;
      },
      hasAttribute: () => ready,
      getCTM: rootMatrix,
      querySelector: () => ({ getCTM: headMatrix }),
      querySelectorAll: () => paths,
    };
    const root = { querySelectorAll: () => [svg] } as unknown as ParentNode;
    const sync = createCaterpillarHoseSync(root);
    sync();
    expect(rootMatrix).not.toHaveBeenCalled();
    ready = true;
    sync();
    for (const p of paths)
      expect(p.setAttribute).toHaveBeenCalledExactlyOnceWith('d', caterpillarHosePath());
    sync();
    for (const p of paths) expect(p.setAttribute).toHaveBeenCalledTimes(1);
    matrix = { ...identity, e: 4 };
    sync();
    for (const p of paths) expect(p.setAttribute).toHaveBeenCalledTimes(2);
    connected = false;
    rootMatrix.mockClear();
    sync();
    expect(rootMatrix).not.toHaveBeenCalled();
  });

  it('ignores a temporarily singular scene matrix instead of breaking the scene frame', () => {
    const path = { setAttribute: vi.fn() };
    const svg = {
      isConnected: true,
      hasAttribute: () => true,
      getCTM: () => ({
        inverse: () => {
          throw new Error('singular');
        },
      }),
      querySelector: () => ({ getCTM: () => identity }),
      querySelectorAll: () => [path],
    };
    const sync = createCaterpillarHoseSync({
      querySelectorAll: () => [svg],
    } as unknown as ParentNode);
    expect(sync).not.toThrow();
    expect(path.setAttribute).not.toHaveBeenCalled();
  });

  it('keeps Bill original prop anchors until ready, then follows the verified neck pivot', () => {
    expect(generatedBillHeadAnchor(false, 40)).toBeUndefined();
    const s = 115 / 1374,
      top = 100 - 1065 * s;
    const neutral = generatedBillHeadAnchor(true, 0);
    expect(neutral?.x).toBeCloseTo(1 + 1185 * s, 9);
    expect(neutral?.y).toBeCloseTo(top + 503 * s, 9);
    const a = (40 * Math.PI) / 180;
    const turned = generatedBillHeadAnchor(true, 40);
    expect(turned?.x).toBeCloseTo(1 + 900 * s + 285 * s * Math.cos(a) + 217 * s * Math.sin(a), 9);
    expect(turned?.y).toBeCloseTo(top + 720 * s + 285 * s * Math.sin(a) - 217 * s * Math.cos(a), 9);
  });

  it('gives Bill fragments an explicit viewport and a fixed paint box, preserving the scene color', () => {
    const markup = generatedBillFragment('engraved', 'rabbit-house') ?? '';
    expect(markup).toContain(
      '<svg width="120" height="100" overflow="visible" viewBox="0 0 120 100"',
    );
    expect(markup).toContain('data-bill-paint-box="" width="120" height="100"');
    expect(markup.match(/class="bill__head"/g)).toHaveLength(1);
    expect(markup.match(/data-rig-image=""/g)).toHaveLength(2);
    expect(markup).toContain('var(--bl-lizard, #9c9169)');
    expect(generatedBillFragment('flat', 'rabbit-house')).toBeUndefined();
    expect(generatedBillFragment('engraved', 'unknown')).toBeUndefined();
  });
});
