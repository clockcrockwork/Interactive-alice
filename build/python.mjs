/**
 * Finds the Python interpreter once, and runs a script with it.
 *
 * Python owns the checkers and the reference implementation of the pacing formula,
 * but its executable is not called the same thing everywhere: `python3` on Linux and
 * macOS, `python` or the `py` launcher on Windows, and a virtual environment or CI
 * image may have its own. Naming one in a script would make the gate pass or fail by
 * operating system, so everything that needs Python comes through here.
 *
 * As a module: `pythonCommand()` returns the command and any arguments it needs.
 * As a command: `node build/python.mjs scripts/check-text.py --quiet`.
 *
 * `PYTHON` overrides the search, and is a path to an executable, not a command line:
 * an installation directory may well have a space in it.
 */

import { spawnSync } from 'node:child_process';
import process from 'node:process';

/** Tried in order. Only these may carry arguments; an override never does. */
const CANDIDATES = [['python3'], ['python'], ['py', '-3']];

let resolved;

export function pythonCommand() {
  if (resolved) {
    return resolved;
  }
  const override = process.env.PYTHON?.trim();
  const candidates = override ? [[override], ...CANDIDATES] : CANDIDATES;
  for (const candidate of candidates) {
    const [command, ...args] = candidate;
    const probe = spawnSync(command, [...args, '--version'], { stdio: 'ignore' });
    if (probe.status === 0) {
      resolved = candidate;
      return resolved;
    }
  }
  throw new Error(
    'no Python interpreter found: tried PYTHON, python3, python and py -3. ' +
      'Python runs the checkers and the reference pacing implementation; see docs/testing.md.',
  );
}

// Run as a command: pass everything through, including the exit code, so this is
// invisible in a pipeline.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const [command, ...args] = pythonCommand();
  const run = spawnSync(command, [...args, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(run.status ?? 1);
}
