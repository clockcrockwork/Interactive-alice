import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { escapeHtml, generatePages, generatePagesFrom, writePages } from './pages.ts';
import { loadProject } from './project.ts';

// A URL pathname is not a filesystem path on Windows; go through the helper.
const root = fileURLToPath(new URL('..', import.meta.url));
const project = loadProject(root);
const { pages, manifest } = generatePages(root);
const locales = Object.keys(project.locales);

/** The same project, with one locale's chapter text taken away. */
function withoutText(locale: string, chapter: number) {
  const project = loadProject(root);
  project.text.get(locale)?.delete(chapter);
  return project;
}

describe('publishability', () => {
  it('keeps the locale entry when a part is not translated yet, without linking it', () => {
    const { pages, manifest, skipped } = generatePagesFrom(withoutText('ja', 1));

    // The language keeps its place in the site: only the document it cannot serve
    // goes away. Dropping the entry too would break every bookmark to /ja/ the
    // moment a new chapter is staged ahead of its translation.
    const entry = pages.find((page) => page.path === 'ja/index.html');
    expect(entry).toBeDefined();
    expect(pages.some((page) => page.path === 'ja/rabbit-hole/index.html')).toBe(false);
    expect(entry?.html).not.toContain('href="./rabbit-hole/"');
    expect(entry?.html).toContain('data-part="rabbit-hole" data-available="false"');

    // The manifest says the same thing, so a test or a later index does not have to
    // parse HTML to find out what a language can be read in.
    const record = manifest.pages.find((page) => page.path === 'ja/index.html');
    expect(record?.parts).toEqual([]);
    expect(record?.pending).toEqual(['rabbit-hole']);
    expect(manifest.pages.some((page) => page.kind === 'part' && page.locale === 'ja')).toBe(false);
    expect(skipped).toEqual([{ locale: 'ja', part: 'rabbit-hole', chapters: [1] }]);

    const home = pages.find((page) => page.path === 'index.html');
    expect(home?.html).toContain('href="./ja/"');
    // The language that does have text is unaffected.
    expect(home?.html).toContain('href="./en-simple/"');
    expect(pages.some((page) => page.path === 'en-simple/rabbit-hole/index.html')).toBe(true);
  });

  it('marks a readable part as available and links it', () => {
    const entry = pages.find((page) => page.path === 'ja/index.html');
    expect(entry?.html).toContain('data-part="rabbit-hole" data-available="true"');
    expect(entry?.html).toContain('href="./rabbit-hole/"');
  });

  it('refuses to build when the base locale is missing text', () => {
    expect(() => generatePagesFrom(withoutText('en-simple', 1))).toThrow(
      /base locale en-simple has no text for chapter\(s\) 1/,
    );
  });

  it('refuses to build when baseLocale does not name a locale in the registry', () => {
    const broken = loadProject(root);
    broken.baseLocale = 'en-simpel';
    expect(() => generatePagesFrom(broken)).toThrow(/baseLocale en-simpel is not in/);
  });

  it('refuses to build when baseLocale names a locale that is not the base', () => {
    const broken = loadProject(root);
    broken.baseLocale = 'ja';
    expect(() => generatePagesFrom(broken)).toThrow(/baseLocale ja has role translation/);
  });
});

describe('the page graph', () => {
  it('has the three levels the architecture specifies', () => {
    const kinds = manifest.pages.map((page) => page.kind);
    expect(kinds.filter((kind) => kind === 'home')).toHaveLength(1);
    expect(kinds.filter((kind) => kind === 'locale')).toHaveLength(locales.length);
    expect(kinds.filter((kind) => kind === 'part')).toHaveLength(
      locales.length * project.parts.length,
    );
  });

  it('writes one file per manifest entry', () => {
    expect(pages.map((page) => page.path).sort()).toEqual(
      manifest.pages.map((page) => page.path).sort(),
    );
  });

  it('links the home page to locale entries, not straight to a document', () => {
    const home = pages.find((page) => page.path === 'index.html');
    for (const locale of locales) {
      expect(home?.html).toContain(`href="./${locale}/"`);
    }
    for (const part of project.parts) {
      expect(home?.html).not.toContain(`/${part.id}/"`);
    }
  });

  it('carries every staged segment of a part, in reading order', () => {
    for (const entry of manifest.pages.filter((page) => page.kind === 'part')) {
      const page = pages.find((candidate) => candidate.path === entry.path);
      const rendered = [...(page?.html.matchAll(/data-segment="([^"]+)"/g) ?? [])].map(
        (match) => match[1],
      );
      expect(rendered).toEqual(entry.segments);
    }
  });

  it('marks each page with the locale it was rendered for', () => {
    for (const entry of manifest.pages.filter((page) => page.kind === 'part')) {
      const page = pages.find((candidate) => candidate.path === entry.path);
      expect(page?.html).toContain(`data-locale="${entry.locale}"`);
      expect(page?.html).toContain(`lang="${entry.locale}"`);
    }
  });

  it('materializes the whole tree and leaves nothing stale behind', () => {
    const out = mkdtempSync(join(tmpdir(), 'alice-pages-'));
    writePages(root, out);
    const before = readdirSync(out).sort();

    // A page from an earlier run, for a locale or part that no longer exists.
    const stale = join(out, 'xx-old');
    writeFileSync(join(out, 'stale.html'), '<!doctype html>', 'utf8');
    writePages(root, out);

    expect(existsSync(join(out, 'stale.html'))).toBe(false);
    expect(existsSync(stale)).toBe(false);
    expect(readdirSync(out).sort()).toEqual(before);
  });

  it('escapes text before inlining it, so a sentence cannot close a tag', () => {
    expect(escapeHtml('a < b & c > d "e"')).toBe('a &lt; b &amp; c &gt; d &quot;e&quot;');
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
