import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const wrapper = fileURLToPath(new URL('python.mjs', import.meta.url));

describe('the Python launcher', () => {
  it('runs when it is the command, even from a path with a space in it', () => {
    // A module URL escapes what a path does not, so comparing the two as text used
    // to fail here and the wrapper exited 0 without running anything: every checker
    // would have passed by doing nothing.
    const directory = mkdtempSync(join(tmpdir(), 'alice launcher '));
    const copy = join(directory, 'python.mjs');
    copyFileSync(wrapper, copy);

    const output = execFileSync(process.execPath, [copy, '-c', 'print("ran")'], {
      encoding: 'utf8',
    });
    expect(output.trim()).toBe('ran');
  });

  it('passes the exit code through', () => {
    const run = spawnSync(process.execPath, [wrapper, '-c', 'raise SystemExit(3)'], {
      stdio: 'ignore',
    });
    expect(run.status).toBe(3);
  });

  it('fails rather than falling back when PYTHON is set to something that will not run', () => {
    const run = spawnSync(process.execPath, [wrapper, '-c', 'print("ran")'], {
      encoding: 'utf8',
      env: { ...process.env, PYTHON: 'definitely-not-a-python' },
    });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('PYTHON is set to definitely-not-a-python');
  });
});
