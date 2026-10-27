import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figure } from './art.ts';

describe('Duchess-only carried-bird Alice', () => {
  for (const variant of ['yellow', 'blue'] as const) {
    it(`${variant} preserves the fixed outer box and atomic original fallback`, () => {
      const markup = figure('alice/falling', '', 'engraved', 'duchess', variant);
      expect(markup).toContain('data-generated-rig="alice/duchess-hold"');
      expect(markup).toContain('viewBox="0 0 120 200"');
      expect(markup).toContain(`alice--duchess-hold.${variant}.generated.webp`);
      expect(markup).toContain('data-rig-fallback=""');
      expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(1);
      expect(markup).not.toContain('data-rig-ready');
      expect(markup).not.toContain('dc__tucked-neck');
      const geometry = markup.match(
        /<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
      );
      expect(geometry).not.toBeNull();
      const [, x, y, width, height] = (geometry ?? []).map(Number);
      const pixels = variant === 'yellow' ? 1619 : 1620;
      const sole = variant === 'yellow' ? 1597 : 1609;
      expect((x ?? 0) + (width ?? 0) / 2).toBeCloseTo(60, 8);
      expect((y ?? 0) + ((height ?? 0) * sole) / pixels).toBeCloseTo(200, 8);
    });
  }
  it('leaves the live falling rig and other whole-card consumers unchanged', () => {
    for (const style of ['flat', 'paper'] as const)
      expect(figure('alice/falling', '', style, 'duchess', 'yellow')).not.toContain('duchess-hold');
    expect(figure('alice/falling', '', 'engraved', 'rabbit-hole', 'blue')).not.toContain(
      'duchess-hold',
    );
    for (const demo of ['drink-me', 'trial'])
      expect(figure('alice/falling', '', 'engraved', demo, 'yellow')).toContain(
        'alice/falling-card',
      );
  });
  it('keeps one original bird and adds only its whole-motion carrier', () => {
    const main = readFileSync(new URL('../duchess/main.ts', import.meta.url), 'utf8');
    expect(main).toContain('class="dc__flamingo-motion"');
    expect(main.match(/figure\('flamingo\/tucked'\)/g)).toHaveLength(1);
    expect(main).toContain("pair.querySelector<HTMLElement>('.dc__flamingo')");
  });
});

describe('Duchess asynchronous motion contract (static CSS wiring)', () => {
  const css = readFileSync(new URL('../duchess/duchess.css', import.meta.url), 'utf8');
  const blocks = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  it('starts both bob clocks from the same walking selector, not from readiness', () => {
    const shared = blocks.find(
      ([, selector, body]) =>
        selector?.includes('.dc__flamingo-motion') && body?.includes('animation: dc-step'),
    );
    expect(shared?.[1]).toContain('.dc__alice > .art');
    expect(shared?.[1]).not.toContain('data-rig-ready');
    expect(shared?.[2]).toContain('0.62s ease-in-out infinite alternate -0.31s');
    const gate = blocks.find(
      ([, selector, body]) =>
        selector?.includes('.dc__flamingo-motion') && body?.includes('!important'),
    );
    expect(gate?.[1]).toContain('alice/duchess-hold');
    expect(gate?.[1]).toContain(':not(:has(');
    expect(gate?.[2]).toContain('transform: none !important');
    expect(gate?.[2]).not.toMatch(/animation(?:-name|-delay|-play-state)?\s*:/);
  });
  it('shares the fixed motion box, pause switch and reduced-motion policy', () => {
    const carrier = blocks.find(([, selector]) => selector?.trim() === '.dc__flamingo-motion');
    expect(carrier?.[2]).toContain('position: absolute');
    expect(carrier?.[2]).toContain('inset: 0');
    expect(carrier?.[2]).toContain('transform-origin: 50% 100%');
    for (const declaration of ['animation-play-state: paused', 'animation: none']) {
      const rule = blocks.find(
        ([, selector, body]) =>
          selector?.includes('.dc__flamingo-motion') && body?.includes(declaration),
      );
      expect(rule?.[1]).toContain('.dc__alice > .art');
    }
  });
  it('keeps the whole bird size and all existing neck/head/jaw hooks live', () => {
    expect(css).toContain('inline-size: 110%');
    expect(css).toContain('rotate(calc(15deg + var(--bite) * -4deg))');
    expect(css).toContain('rotate(calc(var(--bite) * -58deg)) scaleY(calc(1 + var(--bite) * 1.4))');
    expect(css).toContain('rotate(calc(var(--bite) * (1 - var(--snap)) * 26deg))');
    expect(css).toContain('.dc__tucked-pupil');
  });
});

describe('Duchess whole-pose delivery records', () => {
  it('matches both shipped hashes and reports candidate-to-delivery alpha precisely', () => {
    const directory = new URL('../../assets/images/', import.meta.url);
    const record = JSON.parse(
      readFileSync(new URL('alice-duchess-provenance.json', directory), 'utf8'),
    );
    expect(record.assets).toHaveLength(2);
    let bytes = 0;
    for (const asset of record.assets) {
      const encoded = readFileSync(new URL(asset.asset, directory));
      expect(encoded.length).toBe(asset.bytes);
      expect(createHash('sha256').update(encoded).digest('hex')).toBe(asset.sha256);
      expect(asset.alphaPreservedExactly).toBe(true);
      expect(asset.width).toBe(971);
      expect(asset.wholeBirdPlacement.width).toBe(132);
      expect(asset.wholeBirdPlacement.baseRotationDegrees).toBe(15);
      bytes += encoded.length;
    }
    expect(bytes).toBe(701288);
    expect(record.budget.shippingBytes).toBe(bytes);
  });
});
