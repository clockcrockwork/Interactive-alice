import { describe, expect, it } from 'vitest';
import { TEAPOT_SVG, teapotMarkup } from './figures.ts';

describe('Dormouse teapot engraving', () => {
  it('uses the shared engraved body and lid while keeping the vector fallback', () => {
    const markup = teapotMarkup('engraved');
    expect(markup).toContain('data-generated-rig="dormouse/teapot"');
    expect(markup).toContain('data-rig-fallback="">');
    expect(markup).toContain('data-rig-generated="" visibility="hidden" display="none"');
    expect(markup).toContain('teapot-body.any.generated.webp');
    expect(markup).toContain('teapot-lid.any.generated.webp');
    expect(markup.match(/data-rig-image=""/g)).toHaveLength(2);
    expect(markup).toContain('class="dm__lid"');
  });

  it('keeps flat and paper art on the exact vector teapot', () => {
    expect(teapotMarkup('flat')).toBe(TEAPOT_SVG);
    expect(teapotMarkup('paper')).toBe(TEAPOT_SVG);
  });
});
