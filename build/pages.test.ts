import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SceneMapping } from '../src/runtime/pacing.ts';
import { escapeHtml, generatePages, generatePagesFrom, htmlOpen, writePages } from './pages.ts';
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

/**
 * The real project with a second part added ahead of the first in story order, which
 * only the base locale has text for. The repository has one part today, so the order
 * a mixed entry list comes out in cannot be observed without staging one.
 */
function withPendingFirstPart() {
  const project = loadProject(root);
  const scene: SceneMapping = {
    id: 'later',
    shots: [{ id: 'only', beats: [{ id: 'first', segments: ['ch02.s0010'] }] }],
  };
  project.scenes.set('later', scene);
  project.structure.set(2, [{ id: 'ch02.s0010', section: 'pool', kind: 'narration' }]);
  project.text.get('en-simple')?.set(2, {
    locale: 'en-simple',
    chapter: 2,
    title: 'The Pool of Tears',
    sections: { pool: 'The pool' },
    segments: { 'ch02.s0010': 'Alice cried a great pool of tears.' },
  } as never);
  project.parts = [{ id: 'later', scenes: ['later'] }, ...project.parts] as typeof project.parts;
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
    expect(record?.parts).toEqual([{ id: 'rabbit-hole', available: false }]);
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

  it('lists parts in story order whether or not they are available', () => {
    const { pages } = generatePagesFrom(withPendingFirstPart());
    const entry = pages.find((page) => page.path === 'ja/index.html')?.html ?? '';

    // Translations do not advance front to back, so a language that has the second
    // part but not the first must still present them in the story's order.
    expect(entry.indexOf('data-part="later"')).toBeLessThan(
      entry.indexOf('data-part="rabbit-hole"'),
    );
    expect(entry).toContain('data-part="later" data-available="false"');
    expect(entry).toContain('data-part="rabbit-hole" data-available="true"');

    const record = generatePagesFrom(withPendingFirstPart()).manifest.pages.find(
      (page) => page.path === 'ja/index.html',
    );
    // Story order, availability alongside it, in one list.
    expect(record?.parts).toEqual([
      { id: 'later', available: false },
      { id: 'rabbit-hole', available: true },
    ]);
  });

  it('gives an untranslated title the base locale own direction', () => {
    const entry =
      generatePagesFrom(withPendingFirstPart()).pages.find((page) => page.path === 'ja/index.html')
        ?.html ?? '';

    // An English title inside a right-to-left page must not inherit that direction.
    expect(entry).toContain('<span class="entry__part-title" lang="en-simple" dir="ltr">');
  });

  it('says in this language why a part cannot be read', () => {
    const project = withPendingFirstPart();
    const entry =
      generatePagesFrom(project).pages.find((page) => page.path === 'ja/index.html')?.html ?? '';
    const strings = project.ui.get('ja');

    // A data attribute is for a machine. A reader needs words, in their language.
    expect(strings?.partPending).toBeTruthy();
    expect(entry).toContain(`<span class="entry__part-status">${strings?.partPending}</span>`);
  });

  it('tells the home page which languages can be read', () => {
    const partial = withPendingFirstPart();
    const home =
      generatePagesFrom(partial).pages.find((page) => page.path === 'index.html')?.html ?? '';

    // Derived from the text, never from the registry's own status field. The words
    // come from the locale's own file, so this cannot drift from what ships.
    expect(home).toContain('data-locale="en-simple" data-availability="full"');
    expect(home).toContain('data-locale="ja" data-availability="partial"');
    expect(home).toContain(partial.ui.get('ja')?.localePartial ?? '');
  });

  it('says none at all when a language has no readable part', () => {
    const none = withoutText('ja', 1);
    const home =
      generatePagesFrom(none).pages.find((page) => page.path === 'index.html')?.html ?? '';
    expect(home).toContain('data-locale="ja" data-availability="none"');
    expect(home).toContain(none.ui.get('ja')?.localeNone ?? '');
    // Still linked: the entry exists and explains itself.
    expect(home).toContain('href="./ja/"');
  });

  it('refuses to build when a locale has no UI copy', () => {
    const broken = loadProject(root);
    broken.ui.delete('ja');
    expect(() => generatePagesFrom(broken)).toThrow(/no UI strings for ja/);
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

  it('refuses to build when two locales claim to be the base', () => {
    // A remote build runs this and not the Python checkers, so the rule holds here.
    const broken = loadProject(root);
    const ja = broken.locales.ja;
    if (ja) {
      broken.locales = { ...broken.locales, ja: { ...ja, role: 'base' } };
    }
    expect(() => generatePagesFrom(broken)).toThrow(/exactly one locale may have role base/);
  });
});

describe('naming a part', () => {
  it('uses the first chapter any of its scenes reads, not only the first scene', () => {
    // A scene that stages no text is a legal composition, and a part that opens with
    // one still has a name.
    const project = loadProject(root);
    const staging: SceneMapping = {
      id: 'overture',
      shots: [{ id: 'only', beats: [{ id: 'hold', segments: [] }] }],
    };
    project.scenes.set('overture', staging);
    project.parts = [{ id: 'rabbit-hole', scenes: ['overture', 'rabbit-hole'] }];

    const entry =
      generatePagesFrom(project).pages.find((page) => page.path === 'ja/index.html')?.html ?? '';
    const title = project.text.get('ja')?.get(1)?.title ?? '';

    expect(title).toBeTruthy();
    expect(entry).toContain(title);
  });
});

describe("rabbit hole's temporary depth staging", () => {
  const rabbitHole =
    pages.find((page) => page.path === 'en-simple/rabbit-hole/index.html')?.html ?? '';
  const scene = project.scenes.get('rabbit-hole');
  const shotIds = scene?.shots.map((shot) => shot.id) ?? [];

  it('gives every rabbit-hole shot an Alice anchor and its depth bands', () => {
    expect(shotIds.length).toBeGreaterThan(0);
    for (const shotId of shotIds) {
      const shotMarkup = rabbitHole
        .split(`data-shot="${shotId}"`)[1]
        ?.split('<section class="shot"')[0];
      expect(shotMarkup, `shot ${shotId}`).toContain('scene-rabbit-hole__alice');
      expect(shotMarkup, `shot ${shotId}`).toContain('scene-rabbit-hole__depth--mid');
      expect(shotMarkup, `shot ${shotId}`).toContain('scene-rabbit-hole__depth--near');
      // Decorative, so it must not reach the accessibility tree or the segment list.
      expect(shotMarkup, `shot ${shotId}`).toContain('aria-hidden="true"');
    }
  });

  it("leaves hall of doors' shots without any of it", () => {
    // Both scenes share one part page (docs/frontend-architecture.md §3), so the
    // scoping has to be by scene, not by document.
    const hallSection = rabbitHole.split('data-scene="hall-of-doors"')[1] ?? '';
    expect(hallSection).not.toContain('scene-rabbit-hole__alice');
    expect(hallSection).not.toContain('scene-rabbit-hole__depth');
  });

  it('names no other scene, so a second scene never inherits this staging by accident', () => {
    // A future scene reusing `.shot`/`.beat` must not silently pick up Rabbit Hole's
    // decorative markup: the generator gates it by this scene's own id.
    const overture = generatePagesFrom(
      (() => {
        const withOverture = loadProject(root);
        const staging: SceneMapping = {
          id: 'overture',
          shots: [{ id: 'only', beats: [{ id: 'hold', segments: [] }] }],
        };
        withOverture.scenes.set('overture', staging);
        withOverture.parts = [{ id: 'rabbit-hole', scenes: ['overture', 'rabbit-hole'] }];
        return withOverture;
      })(),
    ).pages.find((page) => page.path === 'en-simple/rabbit-hole/index.html')?.html;
    const overtureSection =
      overture?.split('data-scene="overture"')[1]?.split('data-scene="rabbit-hole"')[0] ?? '';
    expect(overtureSection).not.toContain('scene-rabbit-hole__alice');
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

  it("carries its locale's profile on the root of every page, the home page the base locale's", () => {
    for (const entry of manifest.pages) {
      const page = pages.find((candidate) => candidate.path === entry.path);
      const locale = entry.locale ?? project.baseLocale;
      const settings = project.locales[locale];
      expect(settings, entry.path).toBeDefined();
      if (settings) {
        expect(page?.html, entry.path).toContain(htmlOpen(locale, settings));
      }
    }
    // The profile is written whole: every field the registry declares.
    for (const [locale, settings] of Object.entries(project.locales)) {
      expect(htmlOpen(locale, settings)).toMatch(
        /data-set-apart="[a-z ]+" data-word-unit="[a-z]+" data-emphasis="[a-z]+" data-glyph-width="[a-z]+" data-numbers="[\w-]+"/,
      );
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
