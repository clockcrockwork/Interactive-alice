import { describe, expect, it } from 'vitest';
import { previewEnabled } from './generated-preview.ts';

describe('rabbit-hole generated master preview opt-in', () => {
  it('leaves ordinary pages and unknown query values alone', () => {
    expect(previewEnabled('')).toBe(false);
    expect(previewEnabled('?artPreview=other')).toBe(false);
  });
  it('opens only the explicit overhead comparison', () => {
    expect(previewEnabled('?artPreview=overhead')).toBe(true);
  });
});
