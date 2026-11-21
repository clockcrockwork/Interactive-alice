import { describe, expect, it } from 'vitest';
import { strideFrameForPhase } from './field.ts';

describe('two-frame rear-facing chase sprite', () => {
  it('selects a stable first frame at rest and alternates on the established stride phase', () => {
    expect(strideFrameForPhase(0)).toBe(0);
    expect(strideFrameForPhase(Math.PI / 2)).toBe(0);
    expect(strideFrameForPhase((3 * Math.PI) / 2)).toBe(1);
    expect(strideFrameForPhase(2 * Math.PI)).toBe(0);
  });
});
