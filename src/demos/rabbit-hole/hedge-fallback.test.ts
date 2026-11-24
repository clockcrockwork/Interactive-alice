import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('Rabbit Hole opening hedge fallback', () => {
  it('keeps the shared Riverbank hedge and scopes leaf texture to a pending Rabbit Hole rig', () => {
    const sharedField = read('../riverbank/field.css');
    const riverbank = read('../riverbank/main.ts');
    const rabbitHole = read('./rabbit-hole.css');
    const sharedCss = sharedField.replace(/\s+/g, '');
    const rabbitHoleCss = rabbitHole.replace(/\s+/g, '');

    expect(sharedCss).toContain('radial-gradient(circle,var(--field-hedge-light)4.6vh,transparent');
    expect(sharedField).not.toContain('ellipse 0.78vh 0.34vh');
    expect(riverbank).toContain('field.innerHTML = fieldHtml()');
    expect(rabbitHoleCss).toContain(
      '.demo--rabbit-hole.rh__surface.field__hedge:has(svg[data-generated-rig="scenery/hedge"]:not([data-rig-ready]))',
    );
    expect(rabbitHoleCss).toContain('calc(50vw-0.8vh)4.65vh');
    expect(rabbitHoleCss).toContain('calc(50vw-0.2vh)5.75vh');
    expect(rabbitHoleCss).toContain('calc(50vw-1.1vh)6.85vh');
    expect(rabbitHoleCss).toContain('transparent23%');
  });
});
