/**
 * The language-differences standard is enforced by the gate, not by screenshots:
 * a locale that stops giving a stage what it reads, or loses a realia id, fails the
 * checkers. Each case copies the data layers into a scratch directory, breaks one
 * thing there, and runs the real checker against the copy; the repository's own
 * files are never touched. See docs/text-experience-binding.md, Language differences.
 */

import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { ExperienceConceptDemoFile, LocaleRegistry } from '../src/types/schema.ts';
import { pythonCommand } from './python.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const registry = JSON.parse(
  readFileSync(join(root, 'text', 'locales.json'), 'utf8'),
) as LocaleRegistry;
const translation = Object.keys(registry.locales).find((name) => name !== registry.baseLocale);
const scratch: string[] = [];

/** The data layers and the checkers, copied where they can be broken. */
function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'alice-standard-'));
  scratch.push(dir);
  for (const part of ['text', 'experience', 'schema']) {
    cpSync(join(root, part), join(dir, part), { recursive: true });
  }
  for (const file of ['check-text.py', 'check-experience.py', 'jsonschema_lite.py']) {
    cpSync(join(root, 'scripts', file), join(dir, 'scripts', file));
  }
  return dir;
}

function check(dir: string, script: string): { status: number | null; output: string } {
  const [python, ...args] = pythonCommand();
  if (!python) {
    throw new Error('no Python interpreter');
  }
  const run = spawnSync(python, [...args, join(dir, 'scripts', script), '--quiet'], {
    encoding: 'utf8',
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const QUOTES = /[「」『』“”‘’«»‹›„"]/gu;

afterEach(() => {
  for (const dir of scratch.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('the gate enforces the language standard', () => {
  it('passes on the repository as it is', () => {
    const dir = fixture();
    expect(check(dir, 'check-text.py').status).toBe(0);
    expect(check(dir, 'check-experience.py').status).toBe(0);
  });

  it('fails when a translation stops setting apart a word a stage reads', () => {
    expect(translation).toBeDefined();
    const dir = fixture();
    const demo = readJson<ExperienceConceptDemoFile>(
      join(dir, 'experience', 'demos', 'mock-turtle.demo.json'),
    );
    const id = demo.reads?.setApart?.[0] ?? '';
    const file = join(dir, 'text', 'locales', translation ?? '', `${id.slice(0, 4)}.json`);
    const chapter = readJson<{ segments: Record<string, string> }>(file);
    const before = chapter.segments[id] ?? '';
    // Take away its quotation marks, and its capitals if it has any.
    chapter.segments[id] = before.replace(QUOTES, '').toLowerCase();
    writeFileSync(file, JSON.stringify(chapter, null, 2));
    const result = check(dir, 'check-experience.py');
    expect(result.status).toBe(1);
    expect(result.output).toContain(`${translation} ${id}: mock-turtle reads it as setApart`);
  });

  it('fails when a letter, a moral or a cry a stage reads is gone', () => {
    const dir = fixture();
    const base = registry.baseLocale;
    const cases: [string, keyof NonNullable<ExperienceConceptDemoFile['reads']>][] = [
      ['dormouse', 'letter'],
      ['duchess', 'moral'],
      ['mock-turtle', 'sound'],
    ];
    for (const [name, kind] of cases) {
      const demo = readJson<ExperienceConceptDemoFile>(
        join(dir, 'experience', 'demos', `${name}.demo.json`),
      );
      const id = demo.reads?.[kind]?.[0] ?? '';
      const file = join(dir, 'text', 'locales', base, `${id.slice(0, 4)}.json`);
      const chapter = readJson<{ segments: Record<string, string> }>(file);
      chapter.segments[id] = kind === 'sound' ? (chapter.segments[id] ?? '') : 'it was quiet.';
      writeFileSync(file, JSON.stringify(chapter, null, 2));
      if (kind === 'sound') {
        // A cry is a noise by the structure: say it is narration instead.
        const structurePath = join(dir, 'text', 'story', `${id.slice(0, 4)}.structure.json`);
        const structure = readJson<{ segments: { id: string; kind: string }[] }>(structurePath);
        for (const segment of structure.segments) {
          if (segment.id === id) {
            segment.kind = 'narration';
          }
        }
        writeFileSync(structurePath, JSON.stringify(structure, null, 2));
      }
    }
    const result = check(dir, 'check-experience.py');
    expect(result.status).toBe(1);
    for (const [name, kind] of cases) {
      expect(result.output).toContain(`${name} reads it as ${kind}`);
    }
  });

  it('fails when a demo reads a sentence it does not stage, or realia nobody defines', () => {
    const dir = fixture();
    const path = join(dir, 'experience', 'demos', 'caterpillar.demo.json');
    const demo = readJson<ExperienceConceptDemoFile>(path);
    writeFileSync(
      path,
      JSON.stringify({ ...demo, reads: { moral: ['ch01.s0200'] }, realia: ['height', 'money'] }),
    );
    const result = check(dir, 'check-experience.py');
    expect(result.status).toBe(1);
    expect(result.output).toContain('reads.moral names ch01.s0200, which this demo does not stage');
    expect(result.output).toContain("reads realia 'money'");
  });

  it('fails when a locale loses its realia, or changes one’s shape', () => {
    expect(translation).toBeDefined();
    const dir = fixture();
    const path = join(dir, 'text', 'locales', translation ?? '', 'realia.json');
    const file = readJson<{ realia: Record<string, unknown> }>(path);
    file.realia['m-things'] = { picture: 'trap' };
    writeFileSync(path, JSON.stringify(file));
    const shaped = check(dir, 'check-text.py');
    expect(shaped.status).toBe(1);
    expect(shaped.output).toContain(`${translation}/realia.json`);
    rmSync(path);
    const missing = check(dir, 'check-text.py');
    expect(missing.status).toBe(1);
    expect(missing.output).toContain(`${translation}/realia.json is missing`);
  });

  it('fails when the locale profile is incomplete', () => {
    const dir = fixture();
    const path = join(dir, 'text', 'locales.json');
    const file = readJson<{ locales: Record<string, Record<string, unknown>> }>(path);
    for (const settings of Object.values(file.locales)) {
      delete settings.wordUnit;
    }
    writeFileSync(path, JSON.stringify(file));
    const result = check(dir, 'check-text.py');
    expect(result.status).toBe(1);
    expect(result.output).toContain('wordUnit');
  });
});
