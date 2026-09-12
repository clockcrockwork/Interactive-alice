/**
 * Finds the Python interpreter, once, for the tests that compare the two
 * implementations of the pacing formula.
 *
 * The name is not the same everywhere: `python3` on Linux and macOS, `py -3` or
 * `python` on a Windows install, and a virtual environment or CI image may pin its
 * own. Hard-coding one would make `npm test` pass or fail by operating system, which
 * is what docs/code-conventions.md means by keeping the toolchain portable. Set
 * `PYTHON` to override.
 */

import { spawnSync } from 'node:child_process';

const CANDIDATES: readonly (readonly string[])[] = [['python3'], ['python'], ['py', '-3']];

let resolved: readonly string[] | undefined;

export function pythonCommand(): readonly string[] {
  if (resolved) {
    return resolved;
  }
  const override = process.env.PYTHON?.trim();
  const candidates = override ? [override.split(/\s+/), ...CANDIDATES] : CANDIDATES;
  for (const candidate of candidates) {
    const [command, ...args] = candidate;
    if (!command) {
      continue;
    }
    const probe = spawnSync(command, [...args, '--version'], { stdio: 'ignore' });
    if (probe.status === 0) {
      resolved = candidate;
      return resolved;
    }
  }
  throw new Error(
    'no Python interpreter found: tried PYTHON, python3, python and py -3. ' +
      'Python runs the reference implementation of the pacing formula; see docs/testing.md.',
  );
}
