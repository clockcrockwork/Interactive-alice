import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generatedFlamingoSvg } from './generated-flamingo.ts';
import { FLAMINGO_SVG } from './vectors.ts';

const rig = (): string => generatedFlamingoSvg('flamingo', 'engraved', 'croquet') ?? '';

describe('generated croquet flamingo', () => {
  it('opts in only the supported identity, style and scene', () => {
    expect(rig()).toContain('data-generated-rig="flamingo"');
    for (const style of ['flat', 'paper'] as const) {
      expect(generatedFlamingoSvg('flamingo', style, 'croquet')).toBeUndefined();
    }
    for (const scene of [undefined, 'duchess', 'unknown']) {
      expect(generatedFlamingoSvg('flamingo', 'engraved', scene)).toBeUndefined();
    }
    expect(generatedFlamingoSvg('flamingo/tucked', 'engraved', 'duchess')).toBeUndefined();
    expect(generatedFlamingoSvg('hedgehog', 'engraved', 'croquet')).toBeUndefined();
  });

  it('keeps the exact original dress and hands live in both colour variants', () => {
    const html = rig();
    const originalHands = FLAMINGO_SVG.match(/ {2}<path[^\n]+alice-(?:dress|skin)[^\n]+/g) ?? [];
    expect(originalHands).toHaveLength(2);
    for (const path of originalHands) expect(html).toContain(path.trim());
    expect(html).toContain('viewBox="0 0 300 420"');
    expect(html).toContain('data-flamingo-hands=""');
    expect(html).not.toContain('data-variant="blue"');
    expect(html).not.toContain('data-variant="yellow"');
  });

  it('has one live body/head hook while the generated head rides with body breathing', () => {
    const html = rig();
    expect(html.match(/class="cq__flamingo-body"/g)).toHaveLength(1);
    expect(html.match(/class="cq__flamingo-head"/g)).toHaveLength(1);
    expect(html.match(/class="cq__flamingo-eye"/g)).toHaveLength(2);
    expect(html).toMatch(/<g class="cq__flamingo-body"[^>]*>[\s\S]*data-flamingo-head-mounted=""/);
    expect(html).toMatch(/data-flamingo-head-mounted=""><use href="#art-flamingo-head-\d+"\/>/);
    expect(html).toMatch(/data-flamingo-head-original=""><use href="#art-flamingo-head-\d+"\/>/);
  });

  it('does not reveal any generated paint until both same-canvas parts decode', () => {
    const html = rig();
    expect(html.match(/data-rig-image=""/g)).toHaveLength(2);
    expect(html.match(/data-rig-fallback=""/g)).toHaveLength(3);
    expect(html.match(/visibility="hidden" display="none"/g)).toHaveLength(3);
    expect(html).not.toContain('data-rig-ready');
    for (const part of ['body', 'head']) {
      expect(html).toContain(`flamingo~${part}.any.generated.webp`);
    }
    expect(html.match(/x="0" y="0" width="300" height="420"/g)).toHaveLength(2);
  });

  it('keeps the original vector geometry as the complete loading/error fallback', () => {
    const html = rig();
    for (const node of FLAMINGO_SVG.match(/<(?:ellipse|path|circle)[^>]*\/>/g) ?? []) {
      expect(html).toContain(node);
    }
    expect(html).toContain('--rig-origin: 170px 300px');
    const origin = html.match(/class="cq__flamingo-head"[^>]*--rig-origin: ([\d.]+)px ([\d.]+)px/);
    expect(Number(origin?.[1])).toBeCloseTo((650 * 300) / 1060, 8);
    expect(Number(origin?.[2])).toBeCloseTo((310 * 420) / 1484, 8);
  });

  it('gives repeated instances disjoint use references', () => {
    const a = rig();
    const b = rig();
    const ids = (markup: string): string[] =>
      [...markup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1] ?? '');
    expect(ids(a)).toHaveLength(2);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
    for (const html of [a, b]) {
      for (const match of html.matchAll(/<use href="#([^"]+)"/g)) {
        expect(ids(html)).toContain(match[1]);
      }
    }
  });

  it('retains live scene mood, pointer, swing and pause consumers', () => {
    const runtime = readFileSync(new URL('../croquet/main.ts', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../croquet/croquet.css', import.meta.url), 'utf8');
    expect(runtime).toContain("querySelector<SVGGElement>('.cq__flamingo-head')");
    expect(runtime).toContain("head.style.setProperty('--look-x'");
    expect(runtime).toContain("flamingo.style.setProperty('--mood'");
    expect(runtime).toContain("flamingo.style.setProperty('--nod'");
    expect(runtime).toContain('swing.to(flamingo');
    expect(css).toContain('.demo[data-paused] .cq__flamingo-body');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('uses ready-only joint rotation and retains three reduced-motion mood cuts', () => {
    const css = readFileSync(new URL('./generated-flamingo.css', import.meta.url), 'utf8');
    expect(css).toContain('svg[data-generated-rig="flamingo"][data-rig-ready]');
    expect(css).toContain('var(--sulk) * 52deg - var(--nod) * 6deg');
    expect(css).toContain('52deg + var(--look-x) * 1deg - var(--nod) * 6deg');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('data-mood="wary"');
    expect(css).toContain('data-mood="sulking"');
    expect(css).not.toContain('translate(');
    expect(css).not.toContain('skewY(');
    expect(css).not.toContain('150deg');
  });

  it('matches the recorded delivery hashes, dimensions and byte budget', () => {
    const provenance = JSON.parse(
      readFileSync(
        new URL('../../assets/images/generated-layers/flamingo-provenance.json', import.meta.url),
        'utf8',
      ),
    );
    expect(provenance.images).toHaveLength(2);
    for (const record of provenance.images) {
      const bytes = readFileSync(new URL(`../../../${record.file}`, import.meta.url));
      expect(bytes.length).toBe(record.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 16)).toBe('WEBPVP8X');
      expect(bytes.readUIntLE(24, 3) + 1).toBe(record.width);
      expect(bytes.readUIntLE(27, 3) + 1).toBe(record.height);
      expect(record.width).toBe(1060);
      expect(record.height).toBe(1484);
      expect(record.promptHash).toBeNull();
    }
  });
});
