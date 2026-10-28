import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scenery } from './generated-scenery.ts';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('outdoor engraved scenery', () => {
  for (const asset of [
    'tree',
    'edge-left',
    'edge-right',
    'ground',
    'hedge',
    'night-trunk',
    'night-wood',
  ] as const) {
    it(`${asset} is decorative and only becomes visible after the existing rig decoder`, () => {
      const markup = scenery(asset, 'engraved');
      expect(markup).toContain(`data-generated-rig="scenery/${asset}"`);
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('focusable="false"');
      expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
      expect(markup.match(/data-rig-image=""/g)).toHaveLength(1);
      expect(markup).not.toContain('data-rig-ready');
      expect(markup).not.toContain('<button');
      expect(markup).not.toContain('tabindex');
    });
    it(`${asset} does not load pictures for flat/paper styles`, () => {
      expect(scenery(asset, 'flat')).toBe('');
      expect(scenery(asset, 'paper')).toBe('');
    });
  }
  it('keeps both chapter joins on the shared field and decorates the existing moving land', () => {
    const field = read('../riverbank/field.ts');
    expect(field).toContain("scenery('tree')");
    for (const id of ['ground', 'edge-left', 'edge-right']) {
      expect(field).toContain(`scenery('${id}')`);
      expect(field.indexOf(`scenery('${id}')`)).toBeLessThan(
        field.indexOf('class="field__burrow"'),
      );
    }
    expect(read('../riverbank/main.ts')).toContain('field.innerHTML = fieldHtml()');
    expect(read('../rabbit-hole/main.ts')).toContain('fieldHtml()}');
  });
  it('keeps Tea Party scenery inside the pitched horizon, behind its table', () => {
    const main = read('../tea-party/main.ts');
    expect(main).toContain('tp__scenery-ground');
    expect(main).toContain('tp__tree-original');
    expect(main).toContain("scenery('tree')}");
    expect(main.indexOf('tp__scenery-ground')).toBeLessThan(main.indexOf('const sun ='));
    const css = read('./generated-scenery.css');
    expect(css).toContain('aspect-ratio: 3 / 4');
    expect(css).toContain('> .tp__tree-original');
    expect(read('../tea-party/tea-party.css')).toContain('tan(var(--pitch) * 1deg)');
  });
  it('gives all inset-positioned decorations absolute layout, with separate near-ground geometry', () => {
    const css = read('./generated-scenery.css');
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    for (const name of ['.rb__scenery-ground', '.field__scenery-ground', '.scenery-edge']) {
      const absolute = rules.find(
        ([, selector, body]) =>
          selector
            ?.split(',')
            .map((s) => s.trim())
            .includes(name) && body?.includes('position: absolute'),
      );
      expect(absolute, name).toBeDefined();
      expect(absolute?.[2]).toContain('pointer-events: none');
    }
    const near = rules.find(([, selector]) => selector?.trim() === '.rb__scenery-ground--near');
    expect(near?.[2]).toContain('inset-inline: 35% 4%');
    expect(near?.[2]).toContain('inset-block-start: auto');
    for (const [name, top, height] of [
      ['.rb__scenery-ground', '42%', '26%'],
      ['.field__scenery-ground', '47%', '32%'],
    ]) {
      const rule = rules.find(([, selector]) => selector?.trim() === name);
      expect(rule?.[2]).toContain(`inset-block-start: ${top}`);
      expect(rule?.[2]).toContain(`block-size: ${height}`);
    }
  });
  it('retains tree fallback until readiness and preserves a narrower mobile edge budget', () => {
    const css = read('./generated-scenery.css');
    expect(css).toContain('[data-rig-ready]');
    expect(css).toContain('background: none');
    expect(css).toContain('pointer-events: none');
    expect(css).toContain('inline-size: 24vmin');
    expect(css).toContain('.scenery-edge--left > .scenery');
    expect(css).toContain('.scenery-edge__mobile');
    expect(css).not.toContain('mask-image');
    expect(css).not.toMatch(/animation\s*:|transition\s*:|z-index\s*:/);
    const code = read('./generated-scenery.ts');
    expect(code).not.toMatch(/setInterval|requestAnimationFrame|MutationObserver/);
  });
});

describe('night woodland and shared hedge planes', () => {
  it('keeps nighttime images in existing mid/near planes and leaves cat contact untouched', () => {
    const main = read('../cheshire-cat/main.ts');
    expect(main).toContain("scenery('night-wood')}");
    expect(main.match(/scenery\('night-trunk'\)/g)).toHaveLength(2);
    expect(main).toContain("figure('cheshire-cat/on-bough')");
    expect(main).toContain('direction * 6');
    expect(main.indexOf('cc__scenery-near-plane')).toBeLessThan(main.indexOf('cc__bough-layer'));
    expect(main.indexOf('cc__trees cc__trees--near')).toBeGreaterThan(main.indexOf('cc__mist'));
    const css = read('./generated-scenery.css');
    expect(css).toContain('calc(20vw + var(--trunk) * 0.6 - 12.2vh)');
    expect(css).toContain('calc(120vw - var(--trunk) * 0.6 - 100vh / 3 + 12.2vh)');
    expect(css.replace(/\s+/g, '')).toContain(':has(.cc__scenery-near--right[data-rig-ready])');
    expect(read('../cheshire-cat/cheshire.css')).toContain('--rate: 11');
    expect(read('../cheshire-cat/cheshire.css')).toContain('--rate: 5');
  });
  it('tiles the hedge at the original horizon height only after readiness', () => {
    const css = read('./generated-scenery.css');
    expect(css).toContain('[data-generated-rig="scenery/hedge"][data-rig-ready]');
    expect(css).toContain('background-size: 57vh 19vh');
    expect(css).toContain('background-position: calc(50vw - 28.5vh) bottom');
    expect(read('../riverbank/field.ts')).toContain("scenery('hedge')");
    expect(read('../riverbank/field.css')).toContain('inset-inline: 0 -40vw');
    expect(read('../riverbank/field.css')).toContain('--field-foot: 61%');
  });
});

describe('scenery delivery records', () => {
  it('accounts for the two reused Caterpillar meadow sources once each', () => {
    const record = JSON.parse(read('../../assets/images/scenery-provenance.json'));
    const bytes = ['ground', 'edge-right'].reduce(
      (sum, id) =>
        sum +
        readFileSync(new URL(`../../assets/images/scenery/${id}.generated.webp`, import.meta.url))
          .length,
      0,
    );
    expect(record.routeBytes.caterpillar).toBe(bytes);
  });
  it('matches seven shipped images and accounts for only each route’s used sources', () => {
    const record = JSON.parse(read('../../assets/images/scenery-provenance.json'));
    expect(record.assets).toHaveLength(7);
    let total = 0;
    let tea = 0;
    let night = 0;
    for (const asset of record.assets) {
      const bytes = readFileSync(new URL(`../../assets/images/${asset.asset}`, import.meta.url));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.candidateToDeliveryAlphaExact).toBe(true);
      if (!asset.id.startsWith('night-')) total += bytes.length;
      else night += bytes.length;
      if (asset.id === 'tree' || asset.id === 'ground') tea += bytes.length;
    }
    expect(record.routeBytes.riverbank).toBe(total);
    expect(record.routeBytes['rabbit-hole']).toBe(total);
    expect(record.routeBytes['tea-party']).toBe(tea);
    expect(tea).toBeLessThan(total);
    expect(record.routeBytes['cheshire-cat']).toBe(night);
  });
});

describe('Caterpillar meadow scenery ownership', () => {
  it('puts only low vegetation in the scaling meadow, behind the mushroom and near blades', () => {
    const main = read('../caterpillar/main.ts');
    const start = main.indexOf('meadow.innerHTML =');
    const end = main.indexOf('const mushroom =', start);
    const meadow = main.slice(start, end);
    expect(meadow.match(/scenery\('ground'\)/g)).toHaveLength(1);
    expect(meadow.match(/scenery\('edge-right'\)/g)).toHaveLength(2);
    expect(meadow.match(/scenery\(/g)).toHaveLength(3);
    expect(meadow.indexOf('ct__scenery-ground')).toBeLessThan(meadow.indexOf('ct__mushroom'));
    expect(meadow.indexOf('ct__scenery-edge--right')).toBeLessThan(meadow.indexOf('ct__mushroom'));
    expect(main.slice(0, start)).not.toContain("scenery('");
    expect(main.slice(end)).not.toContain("scenery('");
  });
  it('anchors the decoration to the meadow base without a competing scale or fade', () => {
    const css = read('../caterpillar/caterpillar.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    for (const name of ['.ct__scenery-ground', '.ct__scenery-edge']) {
      const anchor = rules.find(
        ([, selector, body]) =>
          selector
            ?.split(',')
            .map((s) => s.trim())
            .includes(name) && body?.includes('position: absolute'),
      );
      expect(anchor, name).toBeDefined();
      expect(anchor?.[2]).toContain('inset-block-start: calc(var(--base) * 1%)');
      expect(anchor?.[2]).toContain('pointer-events: none');
    }
    const additions = rules.filter(([, selector]) => selector?.includes('.ct__scenery-'));
    for (const [, , body] of additions) {
      expect(body).not.toMatch(/position:\s*fixed|animation:|transition:|--s:|--fade:|z-index:/);
    }
    expect(css).toContain('transform-origin: 50% calc(var(--base) * 1%)');
    expect(css).toContain('opacity: var(--fade)');
  });
});
