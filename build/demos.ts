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

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { figure } from '../src/demos/art/art.ts';
import type {
  ChapterStructureFile,
  ExperienceConceptDemoFile,
  LocaleChapterFile,
  LocaleRealia,
  LocaleRegistry,
  LocaleUIStrings,
} from '../src/types/schema.ts';
import { escapeHtml, type GeneratedPage, htmlOpen } from './pages.ts';
import type { LocaleSettings } from './project.ts';
import { assertValid } from './schema.ts';

const PROJECT_NAME = 'Interactive Alice';

/**
 * Which Alice the visitor chose, and which drawing (docs/art-trials.md), applied
 * before first paint so the figures never flash the other one. The keys are the
 * demos' own; the pickers on the index write them. The engraved drawing and the
 * yellow Alice are the defaults and set nothing; so does any other stored value,
 * such as the trial's `baked`, which was the engraved pictures.
 */
const ALICE_SCRIPT =
  '<script>try{var d=document.documentElement,a=localStorage.getItem("alice-demos:alice"),' +
  'r=localStorage.getItem("alice-demos:art");if(a==="blue")d.dataset.alice=a;' +
  'if(r==="flat"||r==="paper")d.dataset.art=r}catch(e){}</script>';

/** Order the index lists them in, and the order "next scene" follows. */
export const DEMO_ORDER = [
  'riverbank',
  'rabbit-hole',
  'drink-me',
  'pool-of-tears',
  'caucus-race',
  'mouse-tale',
  'rabbit-house',
  'bill-the-lizard',
  'caterpillar',
  'pig-and-pepper',
  'cheshire-cat',
  'tea-party',
  'dormouse',
  'croquet',
  'duchess',
  'mock-turtle',
  'lobster-quadrille',
  'witnesses',
  'trial',
] as const;

export interface DemoText {
  title: string;
  lines: Map<string, { text: string; kind: string; speaker?: string }>;
}

export interface DemoProject {
  locale: string;
  /** The locale's own name for itself, for the language switch. */
  nativeName: string;
  /** Whether this is the base locale, whose pages keep the plain `demos/` URLs. */
  base: boolean;
  /** The base locale's chapter and section titles, for a card this locale cannot show yet. */
  baseTitles?: {
    locale: string;
    dir: 'ltr' | 'rtl';
    titles: Map<number, string>;
    sectionTitles: Map<number, Record<string, string>>;
  };
  dir: 'ltr' | 'rtl';
  /** The locale's profile from the registry, written onto every page's root. */
  settings: LocaleSettings;
  /** The things this locale's text is about, which a stage draws or measures. */
  realia: LocaleRealia['realia'];
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

/**
 * One locale's demo data. In the base locale every sentence a demo stages must have
 * text, as in the story: there is nothing to translate from otherwise. In any other
 * locale a missing sentence, or a missing chapter file, only means that the demos
 * which stage it are not published in that language yet (`isPublishable`).
 */
export function loadDemoProject(root: string, locale?: string): DemoProject {
  const registry = read(root, 'text', 'locales.json') as LocaleRegistry;
  const chosen = locale ?? registry.baseLocale;
  const settings = registry.locales[chosen];
  if (!settings) {
    throw new Error(`unknown locale ${chosen}`);
  }
  const base = chosen === registry.baseLocale;
  const uiFile = read(root, 'text', 'locales', chosen, 'ui.json') as LocaleUIStrings;
  assertValid(uiFile, read(root, 'schema', 'ui-strings.schema.json'), `${chosen}/ui.json`);
  // Required for every locale in full, like the UI copy: a stage that reads a thing
  // must find it in every language (scripts/check-text.py checks the same).
  const realiaFile = read(root, 'text', 'locales', chosen, 'realia.json') as LocaleRealia;
  assertValid(realiaFile, read(root, 'schema', 'realia.schema.json'), `${chosen}/realia.json`);

  const demoDir = join(root, 'experience', 'demos');
  const schema = read(root, 'schema', 'experience-demo.schema.json');
  const byId = new Map<string, ExperienceConceptDemoFile>();
  for (const name of readdirSync(demoDir).filter((file) => file.endsWith('.demo.json'))) {
    const demo = JSON.parse(readFileSync(join(demoDir, name), 'utf8')) as ExperienceConceptDemoFile;
    assertValid(demo, schema, `experience/demos/${name}`);
    if (name !== `${demo.id}.demo.json`) {
      throw new Error(`experience/demos/${name} says id ${demo.id}`);
    }
    for (const id of demo.realia ?? []) {
      if (!(id in realiaFile.realia)) {
        throw new Error(`experience/demos/${name} reads realia ${id}, which ${chosen} lacks`);
      }
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

  const readTitles = (from: string) => {
    const titles = new Map<number, string>();
    const sectionTitles = new Map<number, Record<string, string>>();
    const lines: DemoText['lines'] = new Map();
    for (const chapter of chapters) {
      const name = chapterName(chapter);
      const structure = read(
        root,
        'text',
        'story',
        `${name}.structure.json`,
      ) as ChapterStructureFile;
      const file = join(root, 'text', 'locales', from, `${name}.json`);
      if (!existsSync(file)) {
        if (from === registry.baseLocale) {
          throw new Error(`${from}/${name}.json is missing`);
        }
        continue;
      }
      const text = JSON.parse(readFileSync(file, 'utf8')) as LocaleChapterFile;
      titles.set(chapter, text.title);
      sectionTitles.set(chapter, text.sections);
      for (const segment of structure.segments) {
        const sentence = text.segments[segment.id];
        if (sentence === undefined) {
          if (from === registry.baseLocale) {
            throw new Error(`${from}/${name}.json has no text for ${segment.id}`);
          }
          continue;
        }
        lines.set(segment.id, { text: sentence, kind: segment.kind, speaker: segment.speaker });
      }
    }
    return { titles, sectionTitles, lines };
  };
  const own = readTitles(chosen);
  const fallback = base ? undefined : readTitles(registry.baseLocale);

  return {
    locale: chosen,
    nativeName: settings.nativeName,
    base,
    baseTitles: fallback && {
      locale: registry.baseLocale,
      dir: registry.locales[registry.baseLocale]?.dir ?? 'ltr',
      titles: fallback.titles,
      sectionTitles: fallback.sectionTitles,
    },
    dir: settings.dir,
    settings,
    realia: realiaFile.realia,
    demos,
    ui: uiFile.strings,
    titles: own.titles,
    sectionTitles: own.sectionTitles,
    lines: own.lines,
  };
}

/** Every locale in the registry, the base locale first. */
export function loadDemoProjects(root: string): DemoProject[] {
  const registry = read(root, 'text', 'locales.json') as LocaleRegistry;
  const others = Object.keys(registry.locales).filter((name) => name !== registry.baseLocale);
  return [registry.baseLocale, ...others].map((name) => loadDemoProject(root, name));
}

/**
 * Publishability is derived, never declared (docs/text-pipeline.md): a demo has a
 * page in a locale when its title and every sentence it stages have text there.
 * Nothing falls back to the base locale's words.
 */
export function isPublishable(project: DemoProject, demo: ExperienceConceptDemoFile): boolean {
  return (
    titleIn(project, demo) !== undefined &&
    demo.shots.every((shot) =>
      shot.beats.every((beat) => beat.segments.every((id) => project.lines.has(id))),
    )
  );
}

/** Where a locale's demo pages live, relative to the generated root. */
export const demoDir = (project: DemoProject): string =>
  project.base ? 'demos' : `demos/${project.locale}`;

const UI_FOR_SCRIPT = [
  'demoTurnPage',
  'demoPickDaisy',
  'demoLookWatch',
  'demoPutBack',
  'demoJurorToggle',
  'demoSoundOn',
  'demoSoundOff',
  'demoTilt',
  'demoTiltOn',
  'demoTakeKey',
  'demoMyRunner',
  'demoFeed',
  'demoShakeHouse',
  'demoWayHatter',
  'demoWayHare',
  'demoCallCat',
  'demoTryDoor',
  'demoTeleportHint',
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
  'demoAuto',
  'demoLookMap',
  'demoLookAway',
  'demoPeekCurtain',
  'demoLeanLeft',
  'demoLeanRight',
  'demoPuffHold',
  'demoVanishTail',
  'demoVanishHead',
  'demoDirtySeat',
  'demoStrokeFlamingo',
  'demoFlamingoSulks',
  'demoDodgeLeft',
  'demoDodgeRight',
  'demoDodged',
  'demoFlingMoral',
  'demoSuppressGuineaPig',
  'demoRightLizard',
  'demoTurnBottle',
  'demoClimbLeg',
  'demoCryTear',
  'demoFan',
  'demoGiveComfit',
  'demoReadTail',
  'demoWiggleFoot',
  'demoHoldHead',
  'demoCatchBill',
  'demoDipLeaves',
  'demoHeight',
  'demoHeightUnit',
  'demoOpenLetter',
  'demoLookCat',
  'demoCallPig',
  'demoPig',
  'demoFig',
  'demoSingAlong',
  'demoAnswerRiddle',
  'demoStirTreacle',
  'demoDrawTreacle',
  'demoDrawM',
  'demoStirQuarrel',
  'demoTurnCard',
  'demoShrug',
  'demoClearThroat',
  'demoWakeEel',
  'demoKingsNotebook',
  'demoCloseEyes',
  'demoGiveChildren',
  'demoCallDinah',
  'demoPageEmpty',
  'demoChainLonger',
  'demoWatchSpins',
  'demoShrugged',
  'demoCardTurned',
  'demoStruck',
  'demoArtTitle',
  'demoArtFlat',
  'demoArtFlatNote',
  'demoArtEngraved',
  'demoArtEngravedNote',
  'demoArtPaper',
  'demoArtPaperNote',
  'demoGrabJar',
  'demoJarTucked',
  'demoPinch',
  'demoBeatOff',
  'demoFlatWell',
  'demoReducedMotion',
  'demoPuff',
  'demoNibbleLeft',
  'demoNibbleRight',
  'demoBendNeck',
  'demoShoo',
  'demoPaintRose',
  'demoStrike',
  'demoCatchFlamingo',
  'demoHideGardeners',
  'demoThrowLobster',
  'demoJoinDance',
  'demoSomersault',
  'demoOpenEyes',
  'demoSnail',
  'demoBow',
  'demoPepper',
  'demoDuck',
  'demoBatPan',
  'demoHoldTight',
  'demoPokeBaby',
  'demoComfort',
  'demoWash',
  'demoUglify',
  'demoPullTail',
  'demoUndoKnot',
  'demoKnotHolds',
  'demoBirdLeave',
  'demoLookForWine',
  'demoButterWatch',
  'demoWhisperTime',
  'demoMoveRound',
] as const;

const titleIn = (
  titles: Pick<DemoProject, 'titles' | 'sectionTitles'>,
  demo: ExperienceConceptDemoFile,
): string | undefined =>
  (demo.titleSection
    ? titles.sectionTitles.get(demo.titleChapter)?.[demo.titleSection]
    : titles.titles.get(demo.titleChapter)) || undefined;

export function titleOf(project: DemoProject, demo: ExperienceConceptDemoFile): string {
  const title = titleIn(project, demo);
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

/**
 * This locale's entries for just the realia ids a demo declares, for its page. The
 * stage reads them with `shell.realia(id)` and never learns which language it is in.
 */
export function realiaFor(
  project: DemoProject,
  demo: ExperienceConceptDemoFile,
): Partial<LocaleRealia['realia']> {
  const realia = project.realia as Record<string, unknown>;
  return Object.fromEntries(
    (demo.realia ?? []).map((id) => {
      if (!(id in realia)) {
        throw new Error(`${demo.id}: realia ${id} is missing in ${project.locale}`);
      }
      return [id, realia[id]];
    }),
  );
}

/**
 * The demo after this one that has a page in the same locale, so "Next scene" and
 * going on by itself never leave the reader's language. The ring closes on the first.
 */
export function nextDemo(project: DemoProject, id: string): string {
  const start = DEMO_ORDER.indexOf(id as (typeof DEMO_ORDER)[number]);
  for (let step = 1; step <= DEMO_ORDER.length; step += 1) {
    const candidate = DEMO_ORDER[(start + step) % DEMO_ORDER.length];
    const demo = project.demos.find((entry) => entry.id === candidate);
    if (demo && isPublishable(project, demo)) {
      return demo.id;
    }
  }
  return id;
}

function renderDemo(project: DemoProject, demo: ExperienceConceptDemoFile): string {
  const title = titleOf(project, demo);
  const next = nextDemo(project, demo.id);
  const ui = project.ui;
  const forScript = Object.fromEntries(UI_FOR_SCRIPT.map((key) => [key, ui[key]]));
  // demos/<id>/index.html, or demos/<locale>/<id>/index.html, and one more up out
  // of the generated tree to src/, where styles, assets and the demo code live.
  const root = up(demoDir(project).split('/').length + 2);
  // The things this locale's sentences are about, for the ids the demo reads (the
  // thing the Cat hears instead of a pig, the measure of her height).
  const realiaAttr = demo.realia?.length
    ? ` data-realia="${escapeHtml(JSON.stringify(realiaFor(project, demo)))}"`
    : '';
  return `<!doctype html>
${htmlOpen(project.locale, project.settings)}
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
  <body class="demo-body" data-demo="${demo.id}"${demo.ground ? ` data-ground="${demo.ground}"` : ''}>
    <main class="demo demo--${demo.id}" id="demo" data-demo="${demo.id}"${realiaAttr}>
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
        <button class="demo__auto" type="button" aria-pressed="false" hidden>${escapeHtml(ui.demoAuto)}</button>
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
  caterpillar: 'demoTechCaterpillar',
  croquet: 'demoTechCroquet',
  'lobster-quadrille': 'demoTechQuadrille',
  trial: 'demoTechTrial',
  'pig-and-pepper': 'demoTechPig',
  'mock-turtle': 'demoTechMockTurtle',
  riverbank: 'demoTechRiverbank',
  'mouse-tale': 'demoTechMouseTale',
  'tea-party': 'demoTechTeaParty',
  duchess: 'demoTechDuchess',
  witnesses: 'demoTechWitnesses',
} as const;

/**
 * The demos whose opening picks up the frame the one before it ended on (the
 * joins of docs/concept-demos.md §3). On the index their cards lie a little
 * over the card before, like a dealt run.
 */
/** A small tilt per card, alternating, so nineteen cards on the table all read. */
const CARD_TILT = [-4, 2, -1, 3, -2.5, 1, -3, 2.5, -1.5];

/** The figure each drawing choice on the index is previewed with. */
const ART_PREVIEW = 'white-rabbit/herald';

/**
 * A baked picture's URL, as the build sees it, is a file URL into src/assets/
 * (art/baked.ts resolves it against its own module). In a generated page it
 * becomes a path relative to the page, which Vite then hashes like any image.
 */
export const pageRelativeArt = (html: string, root: string): string =>
  html.replace(/file:\/\/[^"]*?\/src\/assets\//g, `${root}assets/`);

/** How the figures can be drawn, in the order the index offers them: the default first. */
const ART_CHOICES = [
  ['engraved', 'demoArtEngraved', 'demoArtEngravedNote'],
  ['flat', 'demoArtFlat', 'demoArtFlatNote'],
  ['paper', 'demoArtPaper', 'demoArtPaperNote'],
] as const;

const up = (depth: number): string => '../'.repeat(depth);

/** The URL of one locale's index from another's, relative to the page. */
function indexHref(from: DemoProject, to: DemoProject): string {
  if (from.locale === to.locale) {
    return './';
  }
  const back = from.base ? './' : '../';
  return to.base ? back : `${back}${to.locale}/`;
}

/**
 * The language switch: every locale's index, each named in its own language. A
 * link, not a stored preference: the URL is the choice.
 */
function renderLanguages(project: DemoProject, all: readonly DemoProject[]): string {
  if (all.length < 2) {
    return '';
  }
  const items = all
    .map((other) => {
      const current = other.locale === project.locale ? ' aria-current="page"' : '';
      return `          <li><a class="demos__language" href="${indexHref(project, other)}" lang="${other.locale}" dir="${other.dir}" hreflang="${other.locale}"${current}>${escapeHtml(other.nativeName)}</a></li>`;
    })
    .join('\n');
  return `      <nav class="demos__languages" aria-label="${escapeHtml(project.ui.demoLanguages)}">
        <ul>
${items}
        </ul>
      </nav>
`;
}

function renderIndex(project: DemoProject, all: readonly DemoProject[] = [project]): string {
  const root = up(demoDir(project).split('/').length + 1);
  const ui = project.ui;
  const cards = project.demos
    .map((demo, index) => {
      const id = demo.id as (typeof DEMO_ORDER)[number];
      const tilt = CARD_TILT[index % CARD_TILT.length] ?? 0;
      const joined = demo.joinsPrevious ? ' data-joined' : '';
      const open = `        <li class="demos__card" data-demo="${demo.id}"${joined} style="--i: ${index}; --tilt: ${tilt}deg">\n`;
      if (!isPublishable(project, demo)) {
        // Listed in its place, as the story's entry lists a part it cannot show
        // yet: the title in the base locale, with that language's own attributes,
        // and the reason in this one.
        const fallback = project.baseTitles;
        const baseTitle = fallback ? titleIn(fallback, demo) : undefined;
        return (
          open.replace('class="demos__card"', 'class="demos__card" data-available="false"') +
          `          <span class="demos__link">\n` +
          `            <span class="demos__pip" aria-hidden="true"></span>\n` +
          `            <span class="demos__name" lang="${fallback?.locale ?? project.locale}" dir="${fallback?.dir ?? project.dir}">${escapeHtml(baseTitle ?? demo.id)}</span>\n` +
          `            <span class="demos__tech">${escapeHtml(ui.partPending)}</span>\n` +
          `          </span>\n        </li>`
        );
      }
      return (
        open +
        `          <a class="demos__link" href="./${demo.id}/">\n` +
        `            <span class="demos__pip" aria-hidden="true"></span>\n` +
        `            <span class="demos__name">${escapeHtml(titleOf(project, demo))}</span>\n` +
        `            <span class="demos__tech">${escapeHtml(ui[TECH_KEY[id]])}</span>\n` +
        `          </a>\n        </li>`
      );
    })
    .join('\n');
  return `<!doctype html>
${htmlOpen(project.locale, project.settings)}
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
${renderLanguages(project, all)}      <h1 class="demos__title">${escapeHtml(ui.demosTitle)}</h1>
      <p class="demos__intro">${escapeHtml(ui.demosIntro)}</p>
      <fieldset class="demos__alice">
        <legend class="demos__alice-title">${escapeHtml(ui.demoAliceTitle)}</legend>
        <button class="demos__alice-choice" type="button" data-alice="yellow" aria-pressed="true">
          <span class="demos__alice-figure" data-alice="yellow" aria-hidden="true">${figure('alice/falling')}</span>
          <span class="demos__alice-name">${escapeHtml(ui.demoAliceYellow)}</span>
          <span class="demos__alice-note">${escapeHtml(ui.demoAliceYellowNote)}</span>
        </button>
        <button class="demos__alice-choice" type="button" data-alice="blue" aria-pressed="false">
          <span class="demos__alice-figure" data-alice="blue" aria-hidden="true">${figure('alice/falling')}</span>
          <span class="demos__alice-name">${escapeHtml(ui.demoAliceBlue)}</span>
          <span class="demos__alice-note">${escapeHtml(ui.demoAliceBlueNote)}</span>
        </button>
      </fieldset>
      <fieldset class="demos__alice demos__art">
        <legend class="demos__alice-title">${escapeHtml(ui.demoArtTitle)}</legend>
${ART_CHOICES.map(
  ([style, name, note]) =>
    `        <button class="demos__alice-choice demos__art-choice" type="button" data-art-style="${style}" aria-pressed="${style === 'engraved'}">
          <span class="demos__art-figure" data-art-style="${style}" aria-hidden="true">${pageRelativeArt(figure(ART_PREVIEW, '', style), root)}</span>
          <span class="demos__alice-name">${escapeHtml(ui[name])}</span>
          <span class="demos__alice-note">${escapeHtml(ui[note])}</span>
        </button>`,
).join('\n')}
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
  /** The locale the page is in. */
  locale: string;
  demo?: string;
  /** Beat cues in staging order, so a browser test can drive the page by them. */
  cues?: string[];
  /** Segment ids in reading order. */
  segments?: string[];
  /** On an index: the demos this locale publishes, in order. */
  published?: string[];
}

export interface DemoPageGraph {
  pages: GeneratedPage[];
  manifest: { pages: DemoPageEntry[] };
}

/** Every locale's demo pages: the base locale's under `demos/`, each other's under `demos/<locale>/`. */
export const generateDemoPages = (root: string): DemoPageGraph => {
  const projects = loadDemoProjects(root);
  const graphs = projects.map((project) => generateDemoPagesFrom(project, projects));
  return {
    pages: graphs.flatMap((graph) => graph.pages),
    manifest: { pages: graphs.flatMap((graph) => graph.manifest.pages) },
  };
};

/**
 * Builds one locale's demo pages from already-loaded data: its index, and a page
 * for every demo it can publish. In the base locale every demo must be publishable.
 */
export function generateDemoPagesFrom(
  project: DemoProject,
  all: readonly DemoProject[] = [project],
): DemoPageGraph {
  const dir = demoDir(project);
  const published = project.demos.filter((demo) => {
    if (isPublishable(project, demo)) {
      return true;
    }
    if (project.base) {
      const missing = demo.shots
        .flatMap((shot) => shot.beats.flatMap((beat) => beat.segments))
        .find((id) => !project.lines.has(id));
      throw new Error(
        `${demo.id}: ${missing ? `segment ${missing} has no text` : 'no title'} in ${project.locale}`,
      );
    }
    return false;
  });
  const pages: GeneratedPage[] = [{ path: `${dir}/index.html`, html: renderIndex(project, all) }];
  const manifest: DemoPageEntry[] = [
    {
      path: `${dir}/index.html`,
      url: `./${dir}/`,
      kind: 'demos',
      locale: project.locale,
      published: published.map((demo) => demo.id),
    },
  ];
  for (const demo of published) {
    pages.push({ path: `${dir}/${demo.id}/index.html`, html: renderDemo(project, demo) });
    manifest.push({
      path: `${dir}/${demo.id}/index.html`,
      url: `./${dir}/${demo.id}/`,
      kind: 'demo',
      locale: project.locale,
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
