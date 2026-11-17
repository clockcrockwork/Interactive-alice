import { describe, expect, it } from 'vitest';
import * as mapArt from '../rabbit-hole/figures.ts';
import { figure } from './art.ts';
import { ART } from './registry.ts';
import type { ArtStyle } from './treatments.ts';

const props = [
  ['runner/dodo', 'caucus-race', 100, 116],
  ['runner/magpie', 'caucus-race', 100, 116],

  ['runner/duck', 'caucus-race', 100, 116],
  ['runner/eaglet', 'caucus-race', 100, 116],
  ['runner/lory', 'caucus-race', 100, 116],
  ['runner/mouse', 'caucus-race', 100, 116],

  ['rose-tree', 'croquet', 320, 360],
  ['card-arch', 'croquet', 200, 140],
  ['alices-sister', 'riverbank', 300, 200],
  ['dancer/salmon', 'lobster-quadrille', 140, 140],
  ['dancer/whiting', 'lobster-quadrille', 140, 140],
  ['king-of-hearts', 'trial', 160, 240],
  ['knave-of-hearts', 'trial', 140, 220],
  ['card-soldier', 'trial', 120, 220],

  ['lobster', 'lobster-quadrille', 160, 120],
  ['crab', 'mock-turtle', 200, 120],
  ['conger-eel', 'mock-turtle', 300, 200],
  ['march-hare', 'tea-party', 160, 260],
  ['dancer/seal', 'lobster-quadrille', 140, 140],
  ['dancer/turtle', 'lobster-quadrille', 140, 140],
  ['dancer/snail', 'lobster-quadrille', 140, 140],
  ['dancer/porpoise', 'lobster-quadrille', 140, 140],
] as const;

// Removing a generated registry source must fail these behavior checks. The
// original vectors must remain selectable without introducing an image request.
describe('generated whole-prop cut-outs', () => {
  for (const [id, scene, w, h] of props) {
    it(`uses one ${id} image in its original logical box, uniformly grounded`, () => {
      const markup = figure(id, '', 'engraved', scene, 'yellow');
      expect(markup).toContain('data-generated=""');
      expect(markup).toContain(`viewBox="0 0 ${w} ${h}"`);
      expect(markup).toContain(`${id.replaceAll('/', '--')}.any.generated.webp`);
      expect(markup).toBe(figure(id, '', 'engraved', scene, 'blue'));
      const entry = ART[id];
      expect(entry?.kind).toBe('vector');
      if (entry?.kind !== 'vector') return;
      const source = entry.generated?.any;
      expect(source).toBeDefined();
      if (!source) return;
      const image = markup.match(
        /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
      );
      expect(image).not.toBeNull();
      if (!image) return;
      const [, x = 0, y = 0, width = 0, height = 0] = image.map(Number);
      expect(width / height).toBeCloseTo(source.width / source.height, 8);
      expect(x + width / 2).toBeCloseTo(w / 2, 8);
      expect(y + (height * source.footY) / source.height).toBeCloseTo(h, 8);
      expect(markup.match(/<image /g)).toHaveLength(1);
    });

    it(`retains the ${id} vector for both alternative styles`, () => {
      for (const style of ['flat', 'paper'] as const) {
        const markup = figure(id, '', style, scene);
        expect(markup).not.toContain('data-generated');
        expect(markup).not.toContain('.generated.webp');
        expect(markup).toContain(`viewBox="0 0 ${w} ${h}"`);
        expect(markup).toContain('<path');
      }
    });
  }

  it('keeps the remaining unsupported candidates on their original routes', () => {
    for (const [id, scene] of [
      ['mushroom', 'caterpillar'],
      ['duchess', 'trial'],
    ]) {
      expect(figure(id ?? '', '', 'engraved', scene)).not.toContain('data-generated');
    }
    expect(figure('runner/alice', '', 'engraved', 'caucus-race', 'blue')).toContain(
      'data-generated-rig="runner/alice"',
    );
  });
});

describe('the opened map only', () => {
  it('selects a sheet-centred image for engraved without grounding it as a figure', () => {
    const render = (mapArt as unknown as { mapSheetMarkup?: (style: ArtStyle) => string })
      .mapSheetMarkup;
    expect(render).toBeTypeOf('function');
    if (!render) return;
    const markup = render('engraved');
    expect(markup).toContain('data-generated-map=""');
    expect(markup).toContain('viewBox="0 0 400 300"');
    expect(markup).toContain('wall-map.any.generated.webp');
    expect(markup).toContain('width="400" height="300"');
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(markup).toContain(
      '<rect x="10" y="15" width="381" height="270" fill="var(--rh-paper)"/>',
    );
    expect(markup.indexOf('<rect')).toBeLessThan(markup.indexOf('<image'));
    expect(render('flat')).toBe(mapArt.MAP_SVG);
    expect(render('paper')).toBe(mapArt.MAP_SVG);
    expect(mapArt.heldSvg('map')).not.toContain('.generated.webp');
  });
});

describe('reused generated runner crab', () => {
  it('keeps the runner logical box and motion group without duplicating the source', () => {
    const markup = figure('runner/crab', '', 'engraved', 'caucus-race');
    expect(markup).toContain('viewBox="0 0 100 116"');
    expect(markup).toContain('class="cr__figure"');
    expect(markup).toContain('crab.any.generated.webp');
    expect(markup).not.toContain('runner--crab.any.generated.webp');
    for (const style of ['flat', 'paper'] as const) {
      expect(figure('runner/crab', '', style, 'caucus-race')).not.toContain('data-generated');
    }
  });
});
