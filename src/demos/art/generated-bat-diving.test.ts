import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure, svgFigure } from './art.ts';
import { generatedBatDivingSvg } from './generated-bat-diving.ts';
import { BAT_SVG, RABBIT_DIVING_SVG } from './vectors.ts';

const svg = (id = 'bat', demo = 'rabbit-hole'): string =>
  generatedBatDivingSvg(id, 'engraved', demo) ?? '';

describe('generated bat and diving rabbit', () => {
  it('opts into only the supported identities, styles and scenes', () => {
    expect(svg()).toContain('data-generated-rig="bat"');
    expect(svg('bat', 'tea-party')).toContain('data-generated-rig="bat"');
    expect(svg('white-rabbit/diving', 'riverbank')).toContain('data-generated-rig="diving-rabbit"');
    for (const style of ['flat', 'paper'] as const) {
      expect(generatedBatDivingSvg('bat', style, 'rabbit-hole')).toBeUndefined();
      expect(generatedBatDivingSvg('white-rabbit/diving', style, 'riverbank')).toBeUndefined();
    }
    for (const demo of [undefined, 'unknown', 'trial']) {
      expect(generatedBatDivingSvg('bat', 'engraved', demo)).toBeUndefined();
      expect(generatedBatDivingSvg('white-rabbit/diving', 'engraved', demo)).toBeUndefined();
    }
    expect(svg('white-rabbit/running')).toBe('');
    expect(svg('white-rabbit/diving', 'tea-party')).toBe('');
  });

  it('is routed through both shared renderers without losing its SVG layout box', () => {
    for (const [id, scene, rig, height] of [
      ['bat', 'rabbit-hole', 'bat', 50],
      ['bat', 'tea-party', 'bat', 50],
      ['white-rabbit/diving', 'riverbank', 'diving-rabbit', 100],
    ] as const) {
      expect(figure(id, '', 'engraved', scene)).toContain(`data-generated-rig="${rig}"`);
      const nested = svgFigure(id, 3, 4, 200, height * 2, '', 'engraved', scene);
      expect(nested).toContain('transform="translate(3 4)"');
      expect(nested).toContain('transform="scale(2 2)"');
      expect(nested).toContain(`width="100" height="${height}" viewBox="0 0 100 ${height}"`);
      expect(nested).toContain(`data-generated-rig="${rig}"`);
    }
  });

  it('keeps exact shape geometry behind one copy of each motion hook', () => {
    const bat = svg();
    const diving = svg('white-rabbit/diving', 'riverbank');
    expect(bat.match(/class="rh__wing"/g)).toHaveLength(1);
    expect(bat.match(/class="rh__wing rh__wing--right"/g)).toHaveLength(1);
    expect(diving.match(/data-part="foot-left"/g)).toHaveLength(1);
    expect(diving.match(/data-part="foot-right"/g)).toHaveLength(1);
    for (const [markup, original] of [
      [bat, BAT_SVG],
      [diving, RABBIT_DIVING_SVG],
    ]) {
      for (const node of original?.match(/<(?:ellipse|path)[^>]*\/>/g) ?? []) {
        expect(markup).toContain(node.replace(/ class="[^"]*"/, ''));
      }
      expect(markup?.match(/data-rig-image=""/g)).toHaveLength(3);
      expect(markup?.match(/visibility="hidden" display="none"/g)).toHaveLength(3);
      expect(markup?.match(/data-rig-fallback=""/g)).toHaveLength(3);
      expect(markup).not.toContain('data-rig-ready');
    }
  });

  it('keeps original root dimensions and scene-specific bat pivots', () => {
    expect(svg()).toContain('width="100" height="50" viewBox="0 0 100 50"');
    expect(svg('white-rabbit/diving', 'riverbank')).toContain(
      'width="100" height="100" viewBox="0 0 100 100"',
    );
    expect(svg().match(/--rig-origin: 50px 25px/g)).toHaveLength(2);
    const tea = svg('bat', 'tea-party');
    expect(tea).toContain('--rig-origin: 49.3px 20.8px');
    expect(tea).toContain('--rig-origin: 50px 20.8px');
    expect(tea).not.toContain('tp__tray');
  });

  it('maps independently generated canvases explicitly without changing their pixels', () => {
    const bat = svg();
    for (const map of [
      'matrix(0.05 0 0 0.05 2 0)',
      'matrix(0.044 0 0 0.044 21 1)',
      'matrix(0.0385 0 0 0.0385 15.8505 5.8)',
    ]) {
      expect(bat).toContain(map);
    }
    const diving = svg('white-rabbit/diving', 'riverbank');
    for (const map of [
      'matrix(0.065 0 0 0.065 1 20)',
      'matrix(0.075 0 0 0.075 6 10)',
      'matrix(0.07 0 0 0.07 4.15 32)',
    ]) {
      expect(diving).toContain(map);
    }
    expect(diving).toContain('--rig-origin: 22px 91.97221010748488px');
    expect(diving).toContain('--rig-origin: 78px 91.97221010748488px');
  });

  it('preserves the original foot translation distance after switching to a view-box origin', () => {
    const css = readFileSync(new URL('./generated-bat-diving.css', import.meta.url), 'utf8');
    expect(css).toContain('svg[data-generated-rig="diving-rabbit"][data-rig-ready]');
    expect(css).toContain('animation-name: generated-diving-kick');
    expect(css).toContain('rotate(-10deg) translateY(1.1972210107484877px)');
    expect(css).toContain('rotate(12deg) translateY(-1.7958315161227316px)');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('animation: none');
    expect(css).toContain('[data-paused]');
    expect(css).toContain('animation-play-state: paused');
  });

  it('retains the burrow crop, tray overlays, delays and motion consumers', () => {
    const field = readFileSync(new URL('../riverbank/field.css', import.meta.url), 'utf8');
    const tea = readFileSync(new URL('../tea-party/main.ts', import.meta.url), 'utf8');
    const rabbit = readFileSync(new URL('../rabbit-hole/rabbit-hole.css', import.meta.url), 'utf8');
    expect(field).toMatch(/\.field__burrow\s*\{[^}]*overflow: hidden;/);
    expect(field).toContain('inset-block-end: -6%');
    expect(field).toContain('animation-delay: -0.21s');
    expect(tea.match(/figure\('bat'\)[^\n]+tp__tray/g)).toHaveLength(2);
    expect(rabbit).toContain('animation-delay: 0.05s');
    expect(rabbit).toContain('.demo[data-paused] .rh__wing');
  });

  it('has reproducible encoded assets and separate provenance rather than invented prompts', () => {
    const provenance = JSON.parse(
      readFileSync(
        new URL('../../assets/images/generated-layers/bat-diving-provenance.json', import.meta.url),
        'utf8',
      ),
    );
    expect(provenance.images).toHaveLength(6);
    for (const record of provenance.images) {
      const bytes = readFileSync(new URL(`../../../${record.file}`, import.meta.url));
      expect(bytes.length).toBe(record.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.readUIntLE(24, 3) + 1).toBe(record.width);
      expect(bytes.readUIntLE(27, 3) + 1).toBe(record.height);
      expect(record.deliveryAlphaVerifiedEqualToSource).toBe(true);
      expect(record.promptHash).toBeNull();
    }
  });
});
