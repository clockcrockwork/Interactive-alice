import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { ART } from './registry.ts';

describe('generated hedgehog state poses', () => {
  it('retains two unique state hooks and atomic vector fallback in the original box', () => {
    const html = figure('hedgehog', '', 'engraved', 'croquet');
    expect(html).toContain('viewBox="0 0 140 110"');
    expect(html).toContain('data-generated-rig="hedgehog"');
    for (const pose of ['ball', 'walk']) {
      expect(html.match(new RegExp(`class="cq__hedgehog-${pose}"`, 'g'))).toHaveLength(1);
      expect(html).toContain(`hedgehog~${pose}.any.generated.webp`);
    }
    expect(html.match(/data-rig-image=""/g)).toHaveLength(2);
    expect(html.match(/data-rig-fallback=""/g)).toHaveLength(2);
    expect(html.match(/visibility="hidden" display="none"/g)).toHaveLength(2);
    expect(html.match(/--rig-origin: 70px 110px/g)).toHaveLength(2);
    expect(html).not.toContain('data-rig-ready');
  });

  it('does not replace flat, paper or other-scene originals', () => {
    const entry = ART.hedgehog;
    if (entry?.kind !== 'vector') throw Error('original vector missing');
    for (const style of ['flat', 'paper'] as const) {
      expect(figure('hedgehog', '', style, 'croquet')).toContain(entry.markup);
    }
    for (const scene of [undefined, 'trial']) {
      expect(figure('hedgehog', '', 'engraved', scene)).not.toContain('data-generated-rig');
    }
  });

  it('keeps existing walking, pause and reduced-motion controls', () => {
    const css = readFileSync(new URL('../croquet/croquet.css', import.meta.url), 'utf8');
    expect(css).toContain('.cq__hedgehog[data-walking] .cq__hedgehog-ball');
    expect(css).toContain('.cq__hedgehog[data-walking] .cq__hedgehog-walk');
    expect(css).toContain('.demo[data-paused] .cq__hedgehog-walk');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('matches recorded delivery bytes and hashes', () => {
    const manifest = JSON.parse(
      readFileSync(
        new URL('../../assets/images/generated-layers/hedgehog-provenance.json', import.meta.url),
        'utf8',
      ),
    );
    for (const record of manifest.images) {
      const bytes = readFileSync(new URL(`../../../${record.file}`, import.meta.url));
      expect(bytes.length).toBe(record.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
    }
  });
});
