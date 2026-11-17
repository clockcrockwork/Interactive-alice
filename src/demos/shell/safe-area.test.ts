/**
 * The demo pages ask for the whole screen (`viewport-fit=cover`), so the fixed bar
 * must pad itself clear of a notch or a rounded corner. An inset cannot be stubbed
 * in a browser test, so this reads the stylesheet: every rule that sets the bar's
 * padding takes the insets, and the bar height the page starts from includes the
 * top one (the shell then measures the real height, padding included).
 * Confirming it on a real notched phone is still a person's job.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..', '..');
const css = readFileSync(join(import.meta.dirname, 'shell.css'), 'utf8');

/** The declaration blocks of every rule whose selector is exactly `.demo__bar`. */
const barRules = (): string[] =>
  [...css.matchAll(/(^|\n)\s*\.demo__bar\s*\{([^}]*)\}/g)].map((match) => match[2] ?? '');

describe('the bar under viewport-fit=cover', () => {
  it('is what the demo pages ask for', () => {
    const build = readFileSync(join(root, 'build', 'demos.ts'), 'utf8');
    expect(build).toContain('viewport-fit=cover');
  });

  it('pads itself clear of the top inset, and of the side insets in landscape', () => {
    const rules = barRules();
    expect(rules.length).toBeGreaterThanOrEqual(2);
    const [base] = rules;
    expect(base).toMatch(/padding-block-start:\s*env\(safe-area-inset-top/);
    expect(base).toMatch(/padding-left:[^;]*env\(safe-area-inset-left/);
    expect(base).toMatch(/padding-right:[^;]*env\(safe-area-inset-right/);
    expect(base).toMatch(/min-block-size:[^;]*env\(safe-area-inset-top/);
    // Every later rule that sets the bar's block padding keeps the top inset.
    for (const rule of rules) {
      const block = rule.match(/padding-block:\s*([^;]*);/);
      if (block) {
        expect(block[1]).toContain('env(safe-area-inset-top');
      }
      expect(rule).not.toMatch(/padding-inline:/);
      expect(rule).not.toMatch(/padding:\s/);
    }
  });

  it('starts the measured bar height with the top inset in it', () => {
    expect(css).toMatch(/--demo-bar-height:\s*calc\([^;]*env\(safe-area-inset-top/);
  });
});
