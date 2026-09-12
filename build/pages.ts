/**
 * Generates the page graph from the data layers.
 *
 * Pages are derived, never maintained by hand: adding a locale or a part adds
 * documents without anyone editing a file tree, so the pages cannot drift from the
 * mapping. See docs/frontend-architecture.md §3.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { planScene, type ScenePlan } from '../src/runtime/pacing.ts';
import {
  chaptersOf,
  type LocaleSettings,
  loadProject,
  type Part,
  type Project,
  type SegmentMeta,
} from './project.ts';

export interface GeneratedPage {
  /** Path relative to the generated root, e.g. "ja/rabbit-hole/index.html". */
  path: string;
  html: string;
}

const PROJECT_NAME = 'Interactive Alice';

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Progress values are derived once at build time; six decimals is finer than a pixel. */
const span = (value: number): string => value.toFixed(6);

const up = (depth: number): string => '../'.repeat(depth);

/** Chapters a part's scenes stage, in order. */
function chaptersOfPart(project: Project, scenes: readonly string[]): number[] {
  const chapters = new Set<number>();
  for (const sceneId of scenes) {
    const scene = project.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`unknown scene ${sceneId}`);
    }
    for (const chapter of chaptersOf(scene)) {
      chapters.add(chapter);
    }
  }
  return [...chapters].sort((a, b) => a - b);
}

/**
 * Chapters this locale has no text for yet.
 *
 * Translations are authored chapter by chapter, so a locale being behind is normal.
 * The base locale being behind is not: nothing can be translated from text that does
 * not exist.
 */
function untranslated(project: Project, locale: string, scenes: readonly string[]): number[] {
  const byChapter = project.text.get(locale);
  return chaptersOfPart(project, scenes).filter((chapter) => !byChapter?.has(chapter));
}

function segmentMeta(project: Project): Map<string, SegmentMeta> {
  const all = new Map<string, SegmentMeta>();
  for (const segments of project.structure.values()) {
    for (const segment of segments) {
      all.set(segment.id, segment);
    }
  }
  return all;
}

function sentences(project: Project, locale: string): Map<string, string> {
  const lines = new Map<string, string>();
  for (const chapter of project.text.get(locale)?.values() ?? []) {
    for (const [id, sentence] of Object.entries(chapter.segments)) {
      lines.set(id, sentence);
    }
  }
  return lines;
}

function renderScene(
  project: Project,
  sceneId: string,
  plan: ScenePlan,
  lines: Map<string, string>,
  meta: Map<string, SegmentMeta>,
): string {
  const scene = project.scenes.get(sceneId);
  if (!scene) {
    throw new Error(`unknown scene ${sceneId}`);
  }
  const spanOf = (units: ScenePlan['shots'], id: string) => {
    const found = units.find((unit) => unit.id === id);
    if (!found) {
      throw new Error(`no span for ${id}`);
    }
    return found;
  };

  const shots = scene.shots.map((shot) => {
    const shotSpan = spanOf(plan.shots, shot.id);
    const beats = shot.beats.map((beat) => {
      const beatSpan = spanOf(plan.beats, beat.id);
      const body = beat.segments
        .map((id) => {
          const sentence = lines.get(id);
          const info = meta.get(id);
          if (sentence === undefined || info === undefined) {
            throw new Error(`segment ${id} is missing text or structure`);
          }
          const speaker = info.speaker ? ` data-speaker="${info.speaker}"` : '';
          return `          <p class="line" data-segment="${id}" data-kind="${info.kind}"${speaker}>${escapeHtml(sentence)}</p>`;
        })
        .join('\n');
      const open =
        `        <div class="beat" data-beat="${beat.id}"` +
        ` data-start="${span(beatSpan.start)}" data-end="${span(beatSpan.end)}">`;
      return body ? `${open}\n${body}\n        </div>` : `${open}</div>`;
    });
    return (
      `      <section class="shot" data-shot="${shot.id}"` +
      ` data-start="${span(shotSpan.start)}" data-end="${span(shotSpan.end)}">\n` +
      `${beats.join('\n')}\n      </section>`
    );
  });

  // The track gives the scene its scroll distance; the stage holds the composition in
  // the viewport. Both are inert until the runtime attaches.
  return [
    `    <div class="scene" data-scene="${sceneId}">`,
    '      <div class="scene__track" data-scene-track>',
    '        <div class="scene__stage" data-scene-stage>',
    shots.join('\n'),
    '        </div>',
    '      </div>',
    '    </div>',
  ].join('\n');
}

function renderPart(project: Project, partId: string, locale: string, scenes: string[]): string {
  const settings = project.locales[locale];
  if (!settings) {
    throw new Error(`unknown locale ${locale}`);
  }
  const lines = sentences(project, locale);
  const meta = segmentMeta(project);

  const heading = partHeading(project, locale, scenes);

  const body = scenes
    .map((sceneId) => {
      const scene = project.scenes.get(sceneId);
      if (!scene) {
        throw new Error(`unknown scene ${sceneId}`);
      }
      const plan = planScene(scene, locale, Object.fromEntries(lines));
      return renderScene(project, sceneId, plan, lines, meta);
    })
    .join('\n');

  // Two directories deep: <locale>/<part>/index.html
  const root = up(3);
  return `<!doctype html>
<html lang="${locale}" dir="${settings.dir}" data-line-break="${settings.lineBreak}" data-significant-spaces="${settings.significantSpaces}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)} · ${PROJECT_NAME}</title>
    <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${root}styles/base.css" />
    <script type="module" src="${root}entry/story.ts"></script>
  </head>
  <body>
    <main class="story" id="story" data-part="${partId}" data-locale="${locale}">
      <h1 class="story__title">${escapeHtml(heading)}</h1>
${body}
    </main>
  </body>
</html>
`;
}

function partHeading(project: Project, locale: string, scenes: string[]): string {
  const scene = project.scenes.get(scenes[0] ?? '');
  const chapter = scene ? chaptersOf(scene)[0] : undefined;
  const text = chapter ? project.text.get(locale)?.get(chapter) : undefined;
  return text?.title ?? PROJECT_NAME;
}

/** `/<locale>/`: the story entry for one language, listing the documents it has. */
function renderLocaleEntry(project: Project, locale: string, parts: readonly Part[]): string {
  const settings = project.locales[locale];
  if (!settings) {
    throw new Error(`unknown locale ${locale}`);
  }
  const root = up(2);
  const links = parts
    .map(
      (part) =>
        `        <li><a href="./${part.id}/">${escapeHtml(partHeading(project, locale, part.scenes))}</a></li>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="${locale}" dir="${settings.dir}" data-line-break="${settings.lineBreak}" data-significant-spaces="${settings.significantSpaces}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${PROJECT_NAME}</title>
    <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${root}styles/base.css" />
  </head>
  <body>
    <main class="entry" id="entry" data-locale="${locale}">
      <h1 class="entry__title">${escapeHtml(settings.nativeName)}</h1>
      <ul class="entry__parts">
${links}
      </ul>
    </main>
  </body>
</html>
`;
}

function renderHome(project: Project, locales: readonly string[]): string {
  // One directory up from the generated root to the shared stylesheet.
  const root = up(1);
  const links = locales
    .map((locale) => [locale, project.locales[locale]] as const)
    .filter((pair): pair is [string, LocaleSettings] => pair[1] !== undefined)
    .map(
      ([locale, settings]) =>
        `        <li><a href="./${locale}/" lang="${locale}" dir="${settings.dir}">${escapeHtml(settings.nativeName)}</a></li>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${PROJECT_NAME}</title>
    <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${root}styles/base.css" />
  </head>
  <body>
    <main class="home" id="home">
      <h1 class="home__title">${PROJECT_NAME}</h1>
      <ul class="home__locales">
${links}
      </ul>
    </main>
  </body>
</html>
`;
}

export interface PageEntry {
  path: string;
  url: string;
  kind: 'home' | 'locale' | 'part';
  locale?: string;
  part?: string;
  scenes?: string[];
  shots?: number;
  beats?: number;
  /** Segment ids in the order the page must present them. */
  segments?: string[];
}

export interface PageGraph {
  pages: GeneratedPage[];
  manifest: { pages: PageEntry[] };
  /** Part pages a translation is not ready for yet, for the build log. */
  skipped: { locale: string; part: string; chapters: number[] }[];
}

export function generatePages(root: string): PageGraph {
  return generatePagesFrom(loadProject(root));
}

/**
 * Builds the page graph from already-loaded data.
 *
 * Publishability is derived from the text layer rather than from a flag: a part is
 * generated for a locale when every chapter it stages has text in that locale. A
 * translation that is behind simply has fewer pages, and the locale entry links only
 * what exists. The base locale is different: missing text there is a hard error,
 * because there is nothing to translate from.
 */
export function generatePagesFrom(project: Project): PageGraph {
  const pages: GeneratedPage[] = [];
  const manifest: PageEntry[] = [];
  const skipped: PageGraph['skipped'] = [];
  const entries: { locale: string; parts: Part[] }[] = [];

  for (const locale of Object.keys(project.locales)) {
    const available: Part[] = [];

    for (const part of project.parts) {
      const missing = untranslated(project, locale, part.scenes);
      if (missing.length > 0) {
        if (locale === project.baseLocale) {
          throw new Error(
            `the base locale ${locale} has no text for chapter(s) ${missing.join(', ')}, ` +
              `which ${part.id} stages`,
          );
        }
        skipped.push({ locale, part: part.id, chapters: missing });
        continue;
      }
      available.push(part);
    }

    if (available.length === 0) {
      // Nothing to read in this language yet, so it gets no entry and no link home.
      continue;
    }
    entries.push({ locale, parts: available });
  }

  pages.push({
    path: 'index.html',
    html: renderHome(
      project,
      entries.map((e) => e.locale),
    ),
  });
  manifest.push({ path: 'index.html', url: './', kind: 'home' });

  for (const { locale, parts } of entries) {
    pages.push({
      path: `${locale}/index.html`,
      html: renderLocaleEntry(project, locale, parts),
    });
    manifest.push({ path: `${locale}/index.html`, url: `./${locale}/`, kind: 'locale', locale });

    for (const part of parts) {
      pages.push({
        path: `${locale}/${part.id}/index.html`,
        html: renderPart(project, part.id, locale, part.scenes),
      });

      const scenes = part.scenes.map((sceneId) => {
        const scene = project.scenes.get(sceneId);
        if (!scene) {
          throw new Error(`unknown scene ${sceneId}`);
        }
        return scene;
      });
      manifest.push({
        path: `${locale}/${part.id}/index.html`,
        url: `./${locale}/${part.id}/`,
        kind: 'part',
        locale,
        part: part.id,
        scenes: [...part.scenes],
        shots: scenes.reduce((count, scene) => count + scene.shots.length, 0),
        beats: scenes.reduce(
          (count, scene) =>
            count + scene.shots.reduce((inner, shot) => inner + shot.beats.length, 0),
          0,
        ),
        segments: scenes.flatMap((scene) =>
          scene.shots.flatMap((shot) => shot.beats.flatMap((beat) => [...beat.segments])),
        ),
      });
    }
  }

  return { pages, manifest: { pages: manifest }, skipped };
}

/**
 * Writes the pages under `outDir` and returns their absolute paths, for rollup inputs.
 *
 * Also writes `manifest.json` beside them: what pages exist and what each must
 * contain, so the browser tests cover the real page graph instead of a second list.
 */
export function writePages(root: string, outDir: string): string[] {
  const { pages, manifest, skipped } = generatePages(root);
  for (const entry of skipped) {
    console.info(
      `pages: ${entry.locale} has no page for ${entry.part}; chapter(s) ${entry.chapters.join(', ')} are untranslated`,
    );
  }
  // Nothing but generated output lives here, so clearing it first is what keeps a
  // removed locale or part from leaving a page behind that the dev server still serves.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const page of pages) {
    const file = join(outDir, page.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page.html, 'utf8');
    written.push(file);
  }
  // Build-time metadata, not an entry point, so it never reaches dist/.
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  // The repository .gitignore already keeps this tree out of git.
  return written;
}
