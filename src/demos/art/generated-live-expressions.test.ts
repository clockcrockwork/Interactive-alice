import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';

const rigs = [
  ['hatter', 'tea-party', '160 260', ['tp__hatter-body', 'tp__hatter-eyes', 'hatter__hat']],
  ['dormouse', 'dormouse', '140 110', ['dm__body', 'dm__eye-open', 'dm__eye-shut']],
  ['queen-of-hearts', 'trial', '160 240', ['tr__queen-mouth']],
  ['cook', 'pig-and-pepper', '200 260', ['pp__cook-arm']],
] as const;

describe('generated live-expression characters', () => {
  for (const [id, demo, box, hooks] of rigs) {
    it(`keeps one live motion hook and a complete vector fallback for ${id}`, () => {
      const markup = figure(id, '', 'engraved', demo);
      expect(markup).toContain(`data-generated-rig="${id}"`);
      expect(markup).toContain(`viewBox="0 0 ${box}"`);
      expect(markup).toContain('data-rig-fallback');
      expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
      expect(markup).not.toContain('data-rig-ready');
      for (const hook of hooks)
        expect(markup.match(new RegExp(`class="${hook}"`, 'g'))).toHaveLength(1);
    });
    it(`does not request generated ${id} layers in flat or paper styles`, () => {
      for (const style of ['flat', 'paper'] as const) {
        const markup = figure(id, '', style, demo);
        expect(markup).not.toContain('data-generated-rig');
        expect(markup).not.toContain('.generated.webp');
      }
    });
  }

  it('keeps no-demo and unrelated stage rendering on the existing path', () => {
    for (const [id] of rigs) {
      expect(figure(id, '', 'engraved')).not.toContain('data-generated-rig');
      expect(figure(id, '', 'engraved', 'riverbank')).not.toContain('data-generated-rig');
    }
  });

  it('covers every verified secondary consumer of the four shared characters', () => {
    for (const [id, demos] of [
      ['hatter', ['witnesses']],
      ['dormouse', ['tea-party', 'witnesses']],
      ['queen-of-hearts', ['witnesses', 'croquet', 'mock-turtle', 'duchess']],
      ['cook', ['witnesses']],
    ] as const) {
      for (const demo of demos)
        expect(figure(id, '', 'engraved', demo)).toContain(`data-generated-rig="${id}"`);
    }
  });

  it('preserves the Queen GSAP mouth path and all Dormouse z text nodes', () => {
    expect(figure('queen-of-hearts', '', 'engraved', 'trial')).toContain('d="M66 86 q14 -8 28 0"');
    expect(
      figure('dormouse', '', 'engraved', 'tea-party').match(/<text class="dm__zzz/g),
    ).toHaveLength(3);
  });

  it('keeps the fallback cook arm behind her original head, as in the source vector', () => {
    const markup = figure('cook', '', 'engraved', 'pig-and-pepper');
    expect(markup.indexOf('class="pp__cook-arm"')).toBeLessThan(
      markup.indexOf('<circle cx="80" cy="104"'),
    );
  });

  it('ships only six encoded layers with traceable exact-alpha provenance', () => {
    const directory = new URL('../../assets/images/generated-layers/', import.meta.url);
    const provenance = JSON.parse(
      readFileSync(new URL('live-expressions-provenance.json', directory), 'utf8'),
    ) as {
      budget: { shippingBytes: number };
      assets: { asset: string; bytes: number; sha256: string; alphaPreservedExactly: boolean }[];
    };
    expect(provenance.assets).toHaveLength(6);
    let total = 0;
    for (const asset of provenance.assets) {
      const bytes = readFileSync(new URL(asset.asset, directory));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaPreservedExactly).toBe(true);
      total += bytes.length;
    }
    expect(total).toBe(provenance.budget.shippingBytes);
  });
});
