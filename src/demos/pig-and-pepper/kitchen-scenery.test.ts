import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { kitchenScenery } from './kitchen-scenery.ts';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('kitchen scenery planes', () => {
  for (const [plane, viewBox, alignment] of [
    ['wall', '0 0 2 1', 'xMidYMax'],
    ['floor', '5 54 2160 644', 'xMidYMin'],
  ] as const) {
    it(`${plane} is a decorative, atomically revealed cover plane`, () => {
      const markup = kitchenScenery(plane, 'engraved');
      expect(markup).toContain(`viewBox="${viewBox}"`);
      expect(markup).toContain(`preserveAspectRatio="${alignment} slice"`);
      expect(markup).toContain(`data-generated-rig="kitchen/${plane}"`);
      if (plane === 'floor') expect(markup).toContain('width="2172" height="724"');
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('focusable="false"');
      expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(1);
      expect(markup).not.toContain('data-rig-ready');
      expect(kitchenScenery(plane, 'flat')).toBe('');
      expect(kitchenScenery(plane, 'paper')).toBe('');
    });
  }

  it('keeps both decorative planes inside the moving room behind the furnishings', () => {
    const main = read('./main.ts');
    const room = main.indexOf('class="pp__room"');
    const wall = main.indexOf("kitchenScenery('wall')", room);
    const floor = main.indexOf("kitchenScenery('floor')", room);
    const hearth = main.indexOf('class="pp__hearth"', room);
    expect(room).toBeGreaterThan(-1);
    expect(wall).toBeGreaterThan(room);
    expect(floor).toBeGreaterThan(wall);
    expect(hearth).toBeGreaterThan(floor);
  });
  it('puts the shared mobile boundary before the existing elevated figure anchors', () => {
    for (const [width, height] of [
      [1280, 720],
      [390, 844],
      [360, 640],
      [844, 390],
    ] as const) {
      const mobile = width <= 700;
      const roomTop = -0.12 * height;
      const roomHeight = 1.24 * height;
      const boundary = roomTop + roomHeight * (mobile ? 0.48 : 0.62);
      const hearth = roomTop + roomHeight * (mobile ? 0.5 : 0.64);
      const duchess = roomTop + roomHeight * (mobile ? 0.58 : 0.74);
      expect(boundary).toBeLessThan(hearth);
      expect(hearth).toBeLessThan(duchess);
    }
    const css = read('./pig.css');
    expect(css).toMatch(/\.pp__hearth,\s*\.pp__cook\s*\{\s*inset-block-end: 50%;/);
    expect(css).toMatch(/\.pp__duchess\s*\{\s*inset-block-end: 42%;/);
  });
  it('retains gradient and stripes until each respective image is ready', () => {
    const css = read('./pig.css');
    expect(css).toContain('.pp__wall:has(> .pp__wall-art[data-rig-ready])');
    expect(css).toContain('.pp__floor:has(> .pp__floor-art[data-rig-ready])');
    expect(css).toContain('--pp-floor-height: 38%');
    expect(css).toMatch(
      /@media \(max-width: 700px\)\s*\{[^}]*\.pp__room\s*\{\s*--pp-floor-height: 52%;/,
    );
    expect(css).toContain('inset-block: 0 var(--pp-floor-height)');
    expect(css).toContain('block-size: var(--pp-floor-height)');
    expect(css).toContain('block-size: calc(100% - var(--pp-floor-height))');
    expect(css).toMatch(/\.pp__wall-art\s*\{[^}]*opacity: 0\.7;/);
    expect(css).toMatch(/\.pp__floor-art\s*\{[^}]*opacity: 0\.45;/);
    expect(css).toMatch(/\.pp__wall-art,\s*\.pp__floor-art\s*\{[^}]*overflow: hidden;/);
    expect(css).toContain('pointer-events: none');
    expect(css).toContain('linear-gradient(to bottom, var(--pp-floor), var(--pp-floor-deep))');
  });
});

describe('kitchen scenery delivery', () => {
  it('records the exact shipped files and route payload', () => {
    const record = JSON.parse(read('../../assets/images/kitchen-scenery-provenance.json')) as {
      assets: {
        asset: string;
        bytes: number;
        sha256: string;
        candidateToDeliveryAlphaExact: boolean;
      }[];
      routeBytes: { 'pig-and-pepper': number };
    };
    expect(record.assets).toHaveLength(2);
    let total = 0;
    for (const asset of record.assets) {
      const data = readFileSync(new URL(`../../assets/images/${asset.asset}`, import.meta.url));
      expect(data.length).toBe(asset.bytes);
      expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
      expect(asset.candidateToDeliveryAlphaExact).toBe(true);
      total += data.length;
    }
    expect(record.routeBytes['pig-and-pepper']).toBe(total);
  });
});
