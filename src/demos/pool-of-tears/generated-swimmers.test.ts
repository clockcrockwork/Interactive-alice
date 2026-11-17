import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Sea, Swimmer } from './sea.ts';

vi.mock('../shell/shell.ts', () => ({
  mix: (a: number, b: number, t: number) => a + (b - a) * t,
  seeded: () => () => 0.5,
}));

class TestImage {
  static instances: TestImage[] = [];
  src = '';
  decoding = '';
  naturalWidth = 1;
  naturalHeight = 1;
  onload?: () => void;
  onerror?: () => void;
  decode = vi.fn(() => Promise.resolve());
  constructor() {
    TestImage.instances.push(this);
  }
}

type Call = { name: string; args: unknown[]; alpha: number };
function scene() {
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
  const sea = createSea(canvas as unknown as HTMLCanvasElement, false);
  if (!sea) throw new Error('missing canvas fixture');
  sea.resize(900, 900);
  Object.assign(sea.state, { level: 0.5, swell: 0, hallDetail: 0 });
  const swimmer: Swimmer = { kind: 'mouse', x: 0.3, dir: 1, show: 1, jump: 0, bristle: 0 };
  sea.state.swimmers = [swimmer];
  const draw = () => {
    calls.length = 0;
    sea.draw();
    return calls.filter((call) => call.name === 'drawImage');
  };
  return { sea, swimmer, canvas, calls, draw };
}

let createSea: (canvas: HTMLCanvasElement, reduced: boolean) => Sea | undefined;
let root: { dataset: { art?: string; alice?: string } };
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

async function loadImages() {
  for (const image of TestImage.instances) image.onload?.();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('generated swimmers in the actual sea renderer', () => {
  it('starts immediately with procedural art, then paints a decoded image without per-frame loads', async () => {
    const { draw, calls } = scene();
    expect(TestImage.instances.length).toBeGreaterThanOrEqual(7);
    expect(draw()).toHaveLength(0);
    expect(calls.some((call) => call.name === 'ellipse' && call.args[0] === 28)).toBe(true);
    const loads = TestImage.instances.length;
    await loadImages();
    expect(draw().length).toBeGreaterThan(0);
    for (let i = 0; i < 20; i += 1) draw();
    expect(TestImage.instances).toHaveLength(loads);
    expect(TestImage.instances.every((image) => image.decode.mock.calls.length === 1)).toBe(true);
  });

  it('retains the procedural mouse after an image error and never retries that URL per frame', async () => {
    const { draw, calls } = scene();
    for (const image of TestImage.instances) image.onerror?.();
    await loadImages();
    const loads = TestImage.instances.length;
    expect(draw()).toHaveLength(0);
    expect(calls.some((call) => call.name === 'ellipse' && call.args[0] === 28)).toBe(true);
    for (let i = 0; i < 20; i += 1) draw();
    expect(TestImage.instances).toHaveLength(loads);
  });

  it('preserves direction, alpha, slope, zoom, homing and jump; the foreground remains after images', async () => {
    const { sea, swimmer, calls, draw } = scene();
    Object.assign(swimmer, {
      dir: -1,
      show: 0.6,
      jump: 0.5,
      offset: 0.1,
      drift: 0.05,
      home: 0.8,
      homing: 0.5,
    });
    Object.assign(sea.state, { lean: 5, zoom: 1.3 });
    await loadImages();
    const images = draw();
    expect(images.length).toBeGreaterThan(0);
    const x = (0.3 + 0.1 + 0.05 + 0.8) * 0.5 * 900;
    const surface = sea.surfaceAt(x);
    expect(calls).toContainEqual({ name: 'translate', args: [x, surface.y - 45 + 16], alpha: 0.6 });
    expect(calls).toContainEqual({
      name: 'rotate',
      args: [Math.atan(surface.slope) * 0.6],
      alpha: 0.6,
    });
    expect(calls).toContainEqual({ name: 'scale', args: [-1, 1], alpha: 0.6 });
    expect(calls).toContainEqual({ name: 'scale', args: [1.3, 1.3], alpha: 0.6 });
    expect(images[0]?.alpha).toBe(0.6);
    const lastImage =
      calls.length - 1 - [...calls].reverse().findIndex((call) => call.name === 'drawImage');
    expect(
      calls.slice(lastImage + 1).some((call) => call.name === 'fill' && call.alpha === 0.35),
    ).toBe(true);
  });

  it('keeps exactly nine dynamic bristles above the generated mouse and none when calm', async () => {
    const { swimmer, draw, calls } = scene();
    await loadImages();
    draw();
    const calm = calls.filter((call) => call.name === 'lineTo' && call.alpha === 1).length;
    swimmer.bristle = 0.7;
    draw();
    expect(calls.filter((call) => call.name === 'lineTo' && call.alpha === 1)).toHaveLength(
      calm + 9,
    );
    const firstImage = calls.findIndex((call) => call.name === 'drawImage');
    expect(
      calls.slice(firstImage + 1).filter((call) => call.name === 'stroke' && call.alpha === 1),
    ).toHaveLength(9);
  });

  it('leaves flat and paper unchanged and does not fetch generated illustrations in those styles', () => {
    for (const style of ['flat', 'paper']) {
      root.dataset.art = style;
      const { draw } = scene();
      expect(draw()).toHaveLength(0);
    }
    expect(TestImage.instances).toHaveLength(0);
  });

  it('does not publish a late image into a detached canvas', async () => {
    const { draw, canvas } = scene();
    canvas.isConnected = false;
    await loadImages();
    expect(draw()).toHaveLength(0);
  });

  it('uses the dedicated blue Alice and discards a late yellow image after changing appearance', async () => {
    const { swimmer, draw } = scene();
    swimmer.kind = 'alice';
    const yellow = TestImage.instances.find((image) => image.src.includes('swimming.yellow'));
    expect(yellow).toBeDefined();
    root.dataset.alice = 'blue';
    draw();
    const blue = TestImage.instances.find((image) => image.src.includes('swimming.blue'));
    expect(blue).toBeDefined();
    yellow?.onload?.();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(draw()).toHaveLength(0);
    await loadImages();
    expect(draw()[0]?.args[0]).toBe(blue);
  });

  it('waits for decode, and a rejected decode retains the original drawing', async () => {
    const { draw, calls } = scene();
    const mouse = TestImage.instances.find((image) => image.src.includes('runner--mouse'));
    expect(mouse).toBeDefined();
    let rejectDecode: (error: Error) => void = () => {};
    mouse?.decode.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectDecode = reject;
      }),
    );
    mouse?.onload?.();
    expect(draw()).toHaveLength(0);
    rejectDecode(new Error('decode failed'));
    await Promise.resolve();
    await Promise.resolve();
    expect(draw()).toHaveLength(0);
    expect(calls.some((call) => call.name === 'ellipse' && call.args[0] === 28)).toBe(true);
  });

  it('shares each URL across two seas and does not leak artwork into flat mode', async () => {
    const first = scene();
    const loads = TestImage.instances.length;
    const second = scene();
    expect(TestImage.instances).toHaveLength(loads);
    await loadImages();
    expect(first.draw().length).toBeGreaterThan(0);
    expect(second.draw().length).toBeGreaterThan(0);
    root.dataset.art = 'flat';
    expect(first.draw()).toHaveLength(0);
    expect(second.draw()).toHaveLength(0);
    root.dataset.art = 'engraved';
    first.draw();
    await Promise.resolve();
    expect(first.draw().length).toBeGreaterThan(0);
    expect(TestImage.instances).toHaveLength(loads);
  });

  it('paints all eight kinds with a uniform source scale and a four-unit submerged strip', async () => {
    const { swimmer, draw } = scene();
    const { swimmingComposition } = await import('./generated-swimmers.ts');
    await loadImages();
    for (const kind of [
      'alice',
      'mouse',
      'duck',
      'dodo',
      'lory',
      'eaglet',
      'crab',
      'magpie',
    ] as const) {
      swimmer.kind = kind;
      const composition = swimmingComposition(kind, 'engraved', 'yellow');
      expect(composition).toBeDefined();
      const images = draw();
      expect(images).toHaveLength(2);
      const top = images[0]?.args ?? [];
      expect(top[0]).toBe(
        TestImage.instances.find((image) => image.src === composition?.source.src),
      );
      expect(Number(top[7]) / Number(top[3])).toBeCloseTo(composition?.scale ?? 0, 8);
      expect(Number(top[8]) / Number(top[4])).toBeCloseTo(composition?.scale ?? 0, 8);
      expect(Number(top[6]) + Number(top[8])).toBeCloseTo(0, 8);
      expect(images[1]?.alpha).toBe(0.28);
      expect(images[1]?.args[8]).toBeCloseTo(4, 8);
    }
  });

  it('reveals the full mouse during its leap instead of lifting a sliced torso into the air', async () => {
    const { swimmer, draw } = scene();
    await loadImages();
    expect(draw()[0]?.args[4]).toBe(975);
    swimmer.jump = 1;
    expect(draw()).toHaveLength(1);
    expect(draw()[0]?.args[4]).toBe(1351);
  });
});
