import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';
import { FLAMINGO_TUCKED_SVG } from './vectors.ts';

describe('tucked Flamingo hybrid rejection checkpoint', () => {
  it('keeps the complete original actor rather than revealing an incoherent partial hybrid', () => {
    for (const style of ['engraved', 'flat', 'paper'] as const) {
      const markup = figure('flamingo/tucked', '', style, 'duchess');
      expect(markup).toContain(FLAMINGO_TUCKED_SVG);
      expect(markup).not.toContain('data-generated-rig');
      expect(markup).not.toContain('data-rig-image');
      expect(markup).not.toContain('data-rig-ready');
      expect(markup).toContain('viewBox="0 0 200 160"');
      for (const part of ['reach', 'neck', 'head', 'jaw', 'pupil']) {
        expect(markup.match(new RegExp(`class="dc__tucked-${part}"`, 'g'))).toHaveLength(1);
      }
    }
  });

  it('retains the original neck path and nested head, jaw and pupil without replacement paint', () => {
    const markup = figure('flamingo/tucked', '', 'engraved', 'duchess');
    const originalNeck = FLAMINGO_TUCKED_SVG.match(/<path class="dc__tucked-neck"[^>]*\/>/);
    expect(originalNeck).not.toBeNull();
    expect(markup).toContain(originalNeck?.[0]);
    expect(markup).toMatch(
      /<g class="dc__tucked-reach">[\s\S]*<g class="dc__tucked-head">[\s\S]*class="dc__tucked-jaw"[\s\S]*class="dc__tucked-pupil"[\s\S]*<\/g>\s*<\/g>/,
    );
    expect(markup).not.toContain('<image');
  });

  it('records the rejected source experiment without claiming shipping or browser verification', () => {
    const provenance = JSON.parse(
      readFileSync(
        new URL(
          '../../../docs/generated-assets-review/tucked-flamingo-candidate-provenance.json',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    expect(provenance.sources).toHaveLength(4);
    expect(provenance.shippingBytesAdded).toBe(0);
    expect(provenance.diagnostic.browserScreenshot).toBe(false);
    expect(provenance.diagnostic.states).toHaveLength(6);
    const bytes = readFileSync(new URL(`../../../${provenance.diagnostic.file}`, import.meta.url));
    expect(bytes.length).toBe(provenance.diagnostic.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(provenance.diagnostic.sha256);
    expect(bytes.readUInt32BE(16)).toBe(provenance.diagnostic.width);
    expect(bytes.readUInt32BE(20)).toBe(provenance.diagnostic.height);
  });
});
