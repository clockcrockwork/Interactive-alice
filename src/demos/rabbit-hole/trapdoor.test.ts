import { describe, expect, it } from 'vitest';
import { trapdoorHtml } from './trapdoor.ts';

describe('engraved trapdoor', () => {
  it('keeps the live hinge and light while adding a decorative generated leaf', () => {
    const engraved = trapdoorHtml(5, 'rh__door', 'engraved');
    expect(engraved).toContain('class="trapdoor__light"');
    expect(engraved).toContain('class="trapdoor__floor"');
    expect(engraved).toContain('class="trapdoor__leaf-art"');
    expect(engraved).toContain('trapdoor-room.any.generated.webp');
    expect(engraved).toContain('aria-hidden="true"');
    expect(engraved).toContain('--turn: 19');
  });

  it('keeps the CSS fallback in flat and paper styles', () => {
    for (const style of ['flat', 'paper'] as const) {
      const markup = trapdoorHtml(0, 'rh__door', style);
      expect(markup).toContain('class="trapdoor__leaf"></div>');
      expect(markup).not.toContain('trapdoor-room.any.generated.webp');
    }
  });
});
