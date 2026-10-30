import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Sea } from './sea.ts';

vi.mock('../shell/shell.ts', () => ({
  mix: (a: number, b: number, t: number) => a + (b - a) * t,
  seeded: () => () => 0.5,
}));

class TestImage {
  static instances: TestImage[] = [];
  src = '';
  decoding = '';
  naturalWidth = 1254;
  naturalHeight = 1254;
  onload?: () => void;
  onerror?: () => void;
  decode = vi.fn(() => Promise.resolve());
  constructor() {
    TestImage.instances.push(this);
  }
}

type Call = { name: string; args: unknown[]; alpha: number };
let createSea: (canvas: HTMLCanvasElement, reduced: boolean) => Sea | undefined;
let root: { dataset: { art?: string } };

beforeEach(async () => {
  vi.resetModules();
  TestImage.instances = [];
  root = { dataset: {} };
  vi.stubGlobal('Image', TestImage);
  vi.stubGlobal('window', { devicePixelRatio: 1 });
  vi.stubGlobal('document', {
    documentElement: root,
    body: { append() {} },
    createElement: () => ({ style: { setProperty() {} }, remove() {} }),
  });
  vi.stubGlobal('getComputedStyle', () => ({ color: '#544538' }));
  ({ createSea } = await import('./sea.ts'));
});
afterEach(() => vi.unstubAllGlobals());

function scene(width = 1000, height = 1000, reduced = false) {
  const calls: Call[] = [];
  const alphas: number[] = [];
  const target = {
    globalAlpha: 1,
    save() {
      alphas.push(this.globalAlpha);
    },
    restore() {
      this.globalAlpha = alphas.pop() ?? 1;
    },
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  const ctx = new Proxy(target, {
    get(object, key) {
      if (key in object) return Reflect.get(object, key);
      return (...args: unknown[]) =>
        calls.push({ name: String(key), args, alpha: object.globalAlpha });
    },
  });
  const canvas = { getContext: () => ctx, isConnected: true };
  const sea = createSea(canvas as unknown as HTMLCanvasElement, reduced);
  if (!sea) throw new Error('missing canvas fixture');
  sea.resize(width, height);
  Object.assign(sea.state, { level: 0, swell: 0, horizon: 0.78, hallDetail: 0.7 });
  const draw = () => {
    calls.length = 0;
    sea.draw();
    return calls.filter((call) => call.name === 'drawImage');
  };
  const table = () => TestImage.instances.find((image) => image.src.includes('pool-glass-table'));
  const key = () => calls.find((call) => call.name === 'ellipse');
  return { sea, canvas, calls, draw, table, key };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function fallbackLegs(calls: Call[], width = 1000, height = 1000) {
  const unit = Math.min(width, height);
  const tx = width * 0.88;
  const ty = height * 0.78 + height * 0.22 * 0.26;
  return calls.filter(
    (call) =>
      call.name === 'lineTo' &&
      (call.args[0] === tx - unit * 0.11 * 0.46 ||
        call.args[0] === tx + unit * 0.11 * 0.46 ||
        call.args[0] === tx - unit * 0.11 * 0.38 ||
        call.args[0] === tx + unit * 0.11 * 0.38) &&
      (call.args[1] === ty || call.args[1] === ty + unit * 0.05),
  );
}

describe('generated glass table in the actual Pool Canvas', () => {
  it('retains all four original legs until decode, then replaces only the table body', async () => {
    const { table, draw, key, calls } = scene();
    expect(table()).toBeDefined();
    expect(draw()).toHaveLength(0);
    expect(fallbackLegs(calls)).toHaveLength(4);
    const originalKey = key();
    table()?.onload?.();
    await settle();
    expect(draw()).toHaveLength(1);
    expect(fallbackLegs(calls)).toHaveLength(0);
    expect(key()).toEqual(originalKey);
    expect(table()?.decode).toHaveBeenCalledTimes(1);
  });

  it.each(['flat', 'paper'])('leaves %s procedural and does not request the table', (style) => {
    root.dataset.art = style;
    const { table, draw, calls } = scene();
    expect(table()).toBeUndefined();
    expect(draw()).toHaveLength(0);
    expect(fallbackLegs(calls)).toHaveLength(4);
  });

  it.each(['load', 'decode', 'dimensions'])(
    'keeps the complete fallback after %s failure',
    async (failure) => {
      const { table, draw, calls, key } = scene();
      expect(table()).toBeDefined();
      const image = table();
      if (image) {
        if (failure === 'load') image.onerror?.();
        else {
          if (failure === 'decode') image.decode.mockRejectedValue(new Error('decode failed'));
          if (failure === 'dimensions') image.naturalWidth = 0;
          image.onload?.();
        }
      }
      await settle();
      const loads = TestImage.instances.length;
      for (let i = 0; i < 12; i += 1) expect(draw()).toHaveLength(0);
      expect(fallbackLegs(calls)).toHaveLength(4);
      expect(key()).toBeDefined();
      expect(TestImage.instances).toHaveLength(loads);
    },
  );

  it('does not draw a loaded image while decode is still pending', async () => {
    const { table, draw, calls } = scene();
    expect(table()).toBeDefined();
    let resolve: () => void = () => {};
    table()?.decode.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    table()?.onload?.();
    await settle();
    expect(draw()).toHaveLength(0);
    expect(fallbackLegs(calls)).toHaveLength(4);
    resolve();
    await settle();
    expect(draw()).toHaveLength(1);
  });

  it.each([
    [390, 780],
    [1280, 720],
    [768, 1024],
  ])(
    'maps the full source uniformly at %i × %i and keeps the original key on its top',
    async (width, height) => {
      const { table, draw, key } = scene(width, height);
      expect(table()).toBeDefined();
      table()?.onload?.();
      await settle();
      const image = draw()[0];
      if (!image) throw new Error('missing decoded table draw');
      expect(image.args).toHaveLength(5);
      expect(image?.args[0]).toBe(table());
      const [, x, y, drawWidth, drawHeight] = image.args as [
        unknown,
        number,
        number,
        number,
        number,
      ];
      const unit = Math.min(width, height);
      const scale = (unit * 0.11) / 1192;
      expect(drawWidth / 1254).toBeCloseTo(scale, 10);
      expect(drawHeight / 1254).toBeCloseTo(scale, 10);
      expect(x + 627 * scale).toBeCloseTo(width * 0.88, 10);
      expect(y + 366 * scale).toBeCloseTo(Number(key()?.args[1]), 10);
      expect(Number(key()?.args[0])).toBeCloseTo(width * 0.88 + unit * 0.11 * 0.08, 10);
      expect(x + 31 * scale).toBeGreaterThan(0);
      expect(x + 1223 * scale).toBeLessThan(width);
      expect(image?.alpha).toBe(0.7);
    },
  );

  it('preserves live key, hall fade, water clipping and the existing draw order', async () => {
    const { sea, table, draw, calls } = scene();
    expect(table()).toBeDefined();
    table()?.onload?.();
    await settle();
    Object.assign(sea.state, { level: 0.3, hallDetail: 0.35, lean: 4 });
    expect(draw()[0]?.alpha).toBe(0.35);
    const body = calls.findIndex((call) => call.name === 'drawImage');
    const key = calls.findIndex((call) => call.name === 'ellipse');
    const water = calls.findIndex((call, index) => index > key && call.name === 'clip');
    expect(body).toBeGreaterThan(-1);
    expect(key).toBeGreaterThan(body);
    expect(calls[key]?.alpha).toBe(0.35);
    expect(water).toBeGreaterThan(key);
    sea.state.hallDetail = 0;
    expect(draw()).toHaveLength(0);
    expect(calls.some((call) => call.name === 'ellipse')).toBe(false);
    sea.state.covered = true;
    expect(draw()).toHaveLength(0);
  });

  it('shares one decode across seas, responds to style changes and prevents stale publication', async () => {
    const first = scene();
    const second = scene();
    expect(first.table()).toBeDefined();
    expect(
      TestImage.instances.filter((image) => image.src.includes('pool-glass-table')),
    ).toHaveLength(1);
    root.dataset.art = 'flat';
    first.draw();
    second.draw();
    first.table()?.onload?.();
    await settle();
    expect(first.draw()).toHaveLength(0);
    expect(second.draw()).toHaveLength(0);
    root.dataset.art = 'engraved';
    first.draw();
    second.draw();
    await settle();
    expect(first.draw()).toHaveLength(1);
    expect(second.draw()).toHaveLength(1);
    for (let i = 0; i < 12; i += 1) first.draw();
    expect(first.table()?.decode).toHaveBeenCalledTimes(1);
    expect(
      TestImage.instances.filter((image) => image.src.includes('pool-glass-table')),
    ).toHaveLength(1);
  });

  it('does not publish late into a detached canvas', async () => {
    const { table, canvas, draw, calls } = scene();
    expect(table()).toBeDefined();
    canvas.isConnected = false;
    table()?.onload?.();
    await settle();
    expect(draw()).toHaveLength(0);
    expect(fallbackLegs(calls)).toHaveLength(4);
  });

  it('uses identical static placement in reduced motion and after resize/reverse', async () => {
    const { sea, table, draw } = scene(1000, 1000, true);
    expect(table()).toBeDefined();
    table()?.onload?.();
    await settle();
    const original = draw()[0];
    Object.assign(sea.state, { horizon: 0.86, hallDetail: 0 });
    expect(draw()).toHaveLength(0);
    sea.resize(390, 780);
    Object.assign(sea.state, { horizon: 0.78, hallDetail: 0.7 });
    expect(draw()).toHaveLength(1);
    sea.resize(1000, 1000);
    expect(draw()[0]).toEqual(original);
  });
});
