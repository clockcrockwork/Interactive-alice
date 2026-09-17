/**
 * Generates the concept-demo pages under `/demos/`.
 *
 * A demo is a standalone, ambitious staging of one moment of the book. It is not a
 * story Scene: it has no pacing plan and no part, and the story runtime never sees
 * it. What it shares with the story is the text layer — every sentence on a demo
 * page is resolved by segment id from `text/locales/<locale>/`, and its shots and
 * beats come from `experience/demos/<id>.demo.json`, never from code.
 * See docs/concept-demos.md.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { figure } from '../src/demos/art/art.ts';
import type {
  ChapterStructureFile,
  ExperienceConceptDemoFile,
  LocaleChapterFile,
  LocaleRegistry,
  LocaleUIStrings,
} from '../src/types/schema.ts';
import { escapeHtml, type GeneratedPage } from './pages.ts';
import { assertValid } from './schema.ts';

const PROJECT_NAME = 'Interactive Alice';

/**
 * Which Alice the visitor chose, applied before first paint so the figures never
 * flash the other one. The key is the demos' own; the picker on the index writes it.
 */
const ALICE_SCRIPT =
  '<script>try{var a=localStorage.getItem("alice-demos:alice");' +
  'if(a==="yellow")document.documentElement.dataset.alice=a}catch(e){}</script>';

/** Order the index lists them in, and the order "next scene" follows. */
export const DEMO_ORDER = [
  'rabbit-hole',
  'drink-me',
  'pool-of-tears',
  'caucus-race',
  'rabbit-house',
  'bill-the-lizard',
  'dormouse',
  'cheshire-cat',
  'trial',
] as const;

export interface DemoText {
  title: string;
  lines: Map<string, { text: string; kind: string; speaker?: string }>;
}

export interface DemoProject {
  locale: string;
  dir: 'ltr' | 'rtl';
  demos: ExperienceConceptDemoFile[];
  ui: LocaleUIStrings['strings'];
  /** Chapter title by number, in the demo locale. */
  titles: Map<number, string>;
  /** Section titles by chapter number, in the demo locale. */
  sectionTitles: Map<number, Record<string, string>>;
  /** Sentence and metadata by segment id, in the demo locale. */
  lines: DemoText['lines'];
}

const read = (root: string, ...parts: string[]): unknown =>
  JSON.parse(readFileSync(join(root, ...parts), 'utf8'));

const chapterOf = (segmentId: string): number => Number(segmentId.slice(2, 4));
const chapterName = (chapter: number): string => `ch${String(chapter).padStart(2, '0')}`;

/** The demos are staged in the base locale for now; a locale switch is a later step. */
export function loadDemoProject(root: string, locale?: string): DemoProject {
  const registry = read(root, 'text', 'locales.json') as LocaleRegistry;
  const chosen = locale ?? registry.baseLocale;
  const settings = registry.locales[chosen];
  if (!settings) {
    throw new Error(`unknown locale ${chosen}`);
  }
  const uiFile = read(root, 'text', 'locales', chosen, 'ui.json') as LocaleUIStrings;
  assertValid(uiFile, read(root, 'schema', 'ui-strings.schema.json'), `${chosen}/ui.json`);

  const demoDir = join(root, 'experience', 'demos');
  const schema = read(root, 'schema', 'experience-demo.schema.json');
  const byId = new Map<string, ExperienceConceptDemoFile>();
  for (const name of readdirSync(demoDir).filter((file) => file.endsWith('.demo.json'))) {
    const demo = JSON.parse(readFileSync(join(demoDir, name), 'utf8')) as ExperienceConceptDemoFile;
    assertValid(demo, schema, `experience/demos/${name}`);
    if (name !== `${demo.id}.demo.json`) {
      throw new Error(`experience/demos/${name} says id ${demo.id}`);
    }
    byId.set(demo.id, demo);
  }
  const demos = DEMO_ORDER.map((id) => {
    const demo = byId.get(id);
    if (!demo) {
      throw new Error(`experience/demos/${id}.demo.json is missing`);
    }
    return demo;
  });
  for (const id of byId.keys()) {
    if (!DEMO_ORDER.includes(id as (typeof DEMO_ORDER)[number])) {
      throw new Error(`experience/demos/${id}.demo.json is not in DEMO_ORDER`);
    }
  }

  const chapters = new Set<number>();
  for (const demo of demos) {
    chapters.add(demo.titleChapter);
    for (const shot of demo.shots) {
      for (const beat of shot.beats) {
        for (const id of beat.segments) {
          chapters.add(chapterOf(id));
        }
      }
    }
  }

  const titles = new Map<number, string>();
  const sectionTitles = new Map<number, Record<string, string>>();
  const lines: DemoText['lines'] = new Map();
  for (const chapter of chapters) {
    const name = chapterName(chapter);
    const structure = read(root, 'text', 'story', `${name}.structure.json`) as ChapterStructureFile;
    const text = read(root, 'text', 'locales', chosen, `${name}.json`) as LocaleChapterFile;
    titles.set(chapter, text.title);
    sectionTitles.set(chapter, text.sections);
    for (const segment of structure.segments) {
      const sentence = text.segments[segment.id];
      if (sentence === undefined) {
        throw new Error(`${chosen}/${name}.json has no text for ${segment.id}`);
      }
      lines.set(segment.id, { text: sentence, kind: segment.kind, speaker: segment.speaker });
    }
  }

  return {
    locale: chosen,
    dir: settings.dir,
    demos,
    ui: uiFile.strings,
    titles,
    sectionTitles,
    lines,
  };
}

const UI_FOR_SCRIPT = [
  'demoSnatch',
  'demoKick',
  'demoVanish',
  'demoDrink',
  'demoEat',
  'demoRipple',
  'demoRunToggle',
  'demoRaceStart',
  'demoPause',
  'demoResume',
  'demoGrabJar',
  'demoJarTucked',
  'demoPinch',
  'demoBeatOff',
  'demoFlatWell',
  'demoReducedMotion',
] as const;

export function titleOf(project: DemoProject, demo: ExperienceConceptDemoFile): string {
  const title = demo.titleSection
    ? project.sectionTitles.get(demo.titleChapter)?.[demo.titleSection]
    : project.titles.get(demo.titleChapter);
  if (!title) {
    throw new Error(
      `no title for chapter ${demo.titleChapter}${demo.titleSection ? ` section ${demo.titleSection}` : ''}`,
    );
  }
  return title;
}

function renderTrack(project: DemoProject, demo: ExperienceConceptDemoFile): string {
  return demo.shots
    .map((shot) => {
      const beats = shot.beats
        .map((beat) => {
          const cue = beat.cue ? ` data-cue="${beat.cue}"` : '';
          const body = beat.segments
            .map((id) => {
              const line = project.lines.get(id);
              if (!line) {
                throw new Error(`${demo.id}: segment ${id} has no text in ${project.locale}`);
              }
              const speaker = line.speaker ? ` data-speaker="${line.speaker}"` : '';
              return `          <p class="line" data-segment="${id}" data-kind="${line.kind}"${speaker}>${escapeHtml(line.text)}</p>`;
            })
            .join('\n');
          return `        <div class="demo-beat" data-beat="${beat.id}"${cue}>\n${body}\n        </div>`;
        })
        .join('\n');
      return `      <section class="demo-shot" data-shot="${shot.id}">\n${beats}\n      </section>`;
    })
    .join('\n');
}

function renderDemo(project: DemoProject, demo: ExperienceConceptDemoFile): string {
  const title = titleOf(project, demo);
  const index = DEMO_ORDER.indexOf(demo.id as (typeof DEMO_ORDER)[number]);
  const next = DEMO_ORDER[(index + 1) % DEMO_ORDER.length];
  const ui = project.ui;
  const forScript = Object.fromEntries(UI_FOR_SCRIPT.map((key) => [key, ui[key]]));
  // Two directories deep: demos/<id>/index.html, and one more up out of the
  // generated tree to src/, where styles, assets and the demo code live.
  const root = '../../../';
  return `<!doctype html>
<html lang="${project.locale}" dir="${project.dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${escapeHtml(title)} · ${PROJECT_NAME}</title>
    <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${root}styles/base.css" />
    ${ALICE_SCRIPT}
    <script type="module" src="${root}demos/${demo.id}/main.ts"></script>
    <script type="application/json" id="demo-ui">${escapeHtml(JSON.stringify(forScript)).replace(/&quot;/g, '"')}</script>
  </head>
  <body class="demo-body" data-demo="${demo.id}">
    <main class="demo demo--${demo.id}" id="demo" data-demo="${demo.id}">
      <header class="demo__bar">
        <a class="demo__back" href="../">${escapeHtml(ui.demoBack)}</a>
        <h1 class="demo__title">${escapeHtml(title)}</h1>
        <button class="demo__motion" type="button" aria-pressed="false" hidden>${escapeHtml(ui.demoPause)}</button>
      </header>
      <p class="demo__hint" data-demo-hint>${escapeHtml(ui.demoScrollHint)}</p>
      <div class="demo__track" data-demo-track>
${renderTrack(project, demo)}
      </div>
      <footer class="demo__end">
        <a class="demo__next" href="../${next}/">${escapeHtml(ui.demoNext)}</a>
      </footer>
    </main>
  </body>
</html>
`;
}

const TECH_KEY = {
  'rabbit-hole': 'demoTechRabbitHole',
  'drink-me': 'demoTechDrinkMe',
  'pool-of-tears': 'demoTechPool',
  'caucus-race': 'demoTechCaucus',
  'rabbit-house': 'demoTechRabbitHouse',
  'bill-the-lizard': 'demoTechBill',
  'cheshire-cat': 'demoTechCheshire',
  dormouse: 'demoTechDormouse',
  trial: 'demoTechTrial',
} as const;

function renderIndex(project: DemoProject): string {
  const root = '../../';
  const ui = project.ui;
  const cards = project.demos
    .map((demo, index) => {
      const id = demo.id as (typeof DEMO_ORDER)[number];
      return (
        `        <li class="demos__card" data-demo="${demo.id}" style="--i: ${index}">\n` +
        `          <a class="demos__link" href="./${demo.id}/">\n` +
        `            <span class="demos__pip" aria-hidden="true"></span>\n` +
        `            <span class="demos__name">${escapeHtml(titleOf(project, demo))}</span>\n` +
        `            <span class="demos__tech">${escapeHtml(ui[TECH_KEY[id]])}</span>\n` +
        `          </a>\n        </li>`
      );
    })
    .join('\n');
  return `<!doctype html>
<html lang="${project.locale}" dir="${project.dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${escapeHtml(ui.demosTitle)} · ${PROJECT_NAME}</title>
    <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${root}styles/base.css" />
    ${ALICE_SCRIPT}
    <script type="module" src="${root}demos/index/main.ts"></script>
  </head>
  <body class="demo-body">
    <main class="demos" id="demos">
      <h1 class="demos__title">${escapeHtml(ui.demosTitle)}</h1>
      <p class="demos__intro">${escapeHtml(ui.demosIntro)}</p>
      <fieldset class="demos__alice">
        <legend class="demos__alice-title">${escapeHtml(ui.demoAliceTitle)}</legend>
        <button class="demos__alice-choice" type="button" data-alice="blue" aria-pressed="true">
          <span class="demos__alice-figure" data-alice="blue" aria-hidden="true">${figure('alice/falling')}</span>
          <span class="demos__alice-name">${escapeHtml(ui.demoAliceBlue)}</span>
          <span class="demos__alice-note">${escapeHtml(ui.demoAliceBlueNote)}</span>
        </button>
        <button class="demos__alice-choice" type="button" data-alice="yellow" aria-pressed="false">
          <span class="demos__alice-figure" data-alice="yellow" aria-hidden="true">${figure('alice/falling')}</span>
          <span class="demos__alice-name">${escapeHtml(ui.demoAliceYellow)}</span>
          <span class="demos__alice-note">${escapeHtml(ui.demoAliceYellowNote)}</span>
        </button>
      </fieldset>
      <ul class="demos__cards">
${cards}
      </ul>
    </main>
  </body>
</html>
`;
}

export interface DemoPageEntry {
  path: string;
  url: string;
  kind: 'demos' | 'demo';
  demo?: string;
  /** Beat cues in staging order, so a browser test can drive the page by them. */
  cues?: string[];
  /** Segment ids in reading order. */
  segments?: string[];
}

export interface DemoPageGraph {
  pages: GeneratedPage[];
  manifest: { pages: DemoPageEntry[] };
}

export const generateDemoPages = (root: string): DemoPageGraph =>
  generateDemoPagesFrom(loadDemoProject(root));

/** Builds the demo page graph from already-loaded data. */
export function generateDemoPagesFrom(project: DemoProject): DemoPageGraph {
  const pages: GeneratedPage[] = [{ path: 'demos/index.html', html: renderIndex(project) }];
  const manifest: DemoPageEntry[] = [{ path: 'demos/index.html', url: './demos/', kind: 'demos' }];
  for (const demo of project.demos) {
    pages.push({ path: `demos/${demo.id}/index.html`, html: renderDemo(project, demo) });
    manifest.push({
      path: `demos/${demo.id}/index.html`,
      url: `./demos/${demo.id}/`,
      kind: 'demo',
      demo: demo.id,
      cues: demo.shots.flatMap((shot) =>
        shot.beats.flatMap((beat) => (beat.cue ? [beat.cue] : [])),
      ),
      segments: demo.shots.flatMap((shot) => shot.beats.flatMap((beat) => [...beat.segments])),
    });
  }
  return { pages, manifest: { pages: manifest } };
}

/** Writes the demo pages under `outDir` and returns their absolute paths. */
export function writeDemoPages(root: string, outDir: string): string[] {
  const { pages, manifest } = generateDemoPages(root);
  const files: string[] = [];
  for (const page of pages) {
    const file = join(outDir, page.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page.html);
    files.push(file);
  }
  writeFileSync(join(outDir, 'demos-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return files;
}
