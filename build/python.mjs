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
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/** Tried in order. Only these may carry arguments; an override never does. */
const CANDIDATES = [['python3'], ['python'], ['py', '-3']];

let resolved;

export function pythonCommand() {
  if (resolved) {
    return resolved;
  }
  const override = process.env.PYTHON?.trim();
  if (override) {
    // An override is a decision, not a hint: if it does not run, say so rather than
    // quietly using a different interpreter than the one that was asked for.
    const probe = spawnSync(override, ['--version'], { stdio: 'ignore' });
    if (probe.status !== 0) {
      throw new Error(`PYTHON is set to ${override}, which did not run`);
    }
    resolved = [override];
    return resolved;
  }
  for (const candidate of CANDIDATES) {
    const [command, ...args] = candidate;
    const probe = spawnSync(command, [...args, '--version'], { stdio: 'ignore' });
    if (probe.status === 0) {
      resolved = candidate;
      return resolved;
    }
  }
  throw new Error(
    'no Python interpreter found: tried python3, python and py -3, and PYTHON is not ' +
      'set. Python runs the checkers and the reference pacing implementation; see ' +
      'docs/testing.md.',
  );
}

/**
 * Whether this file was run as the command, rather than imported.
 *
 * Comparing the module URL with `process.argv[1]` as text is wrong: a URL escapes
 * what a path does not, so a repository under a directory with a space in its name
 * would never match, and the wrapper would exit 0 without running anything. A
 * checker that silently does nothing is worse than one that fails.
 */
function runDirectly() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  const self = fileURLToPath(import.meta.url);
  const resolved = resolve(entry);
  if (self === resolved) {
    return true;
  }
  try {
    return realpathSync(self) === realpathSync(resolved);
  } catch {
    return false;
  }
}

// Run as a command: pass everything through, including the exit code, so this is
// invisible in a pipeline.
if (runDirectly()) {
  const [command, ...args] = pythonCommand();
  const run = spawnSync(command, [...args, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(run.status ?? 1);
}
