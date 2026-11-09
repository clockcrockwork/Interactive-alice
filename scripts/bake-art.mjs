#!/usr/bin/env node
/**
 * Bakes registry figures into transparent pictures: the proof that raster cut-outs
 * drop into the art registry as planned (docs/art-trials.md, docs/concept-demos.md §2).
 *
 * Each figure in BAKE is drawn from its own vector through the engraved treatment
 * (src/demos/art/treatments.ts), in headless Chromium at twice its box, so the look
 * costs nothing at runtime. Each figure in CUT_OUTS (registry.ts) is also drawn as
 * cut-outs: once without its moving parts, and once per part alone, all in the same
 * box. A picture that shows any of Alice's colours gets one file per Alice variant,
 * anything else one `any` file. Pictures are WebP with alpha, encoded by the
 * browser's own canvas (no image library in the project); AVIF would need an
 * encoder dependency.
 *
 * Writes:
 *   src/assets/images/figures/<id>.<variant>.webp         the pictures
 *   src/assets/images/figures/<id>~<part>.<variant>.webp  the cut-outs (`base`, or a part)
 *   src/demos/art/baked.ts                                what the registry serves, by id
 *   src/assets/images/provenance.json                     one record per picture
 *
 * Usage (by hand; the build never runs it):
 *   npm run art:bake
 *   node --experimental-strip-types scripts/bake-art.mjs --sheet <flat|engraved|paper> <out.png> [id,id...]
 *       a contact sheet of every registry figure in one style, for review, written
 *       wherever you say (keep it out of the repository).
 *
 * Chromium: PW_CHROMIUM_PATH, else /opt/pw-browsers/chromium if present, else the one
 * Playwright resolves.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { ART, CUT_OUTS } from '../src/demos/art/registry.ts';
import { artFilterDefs } from '../src/demos/art/treatments.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIGURES = join(ROOT, 'src', 'assets', 'images', 'figures');
const PROVENANCE = join(ROOT, 'src', 'assets', 'images', 'provenance.json');
const MANIFEST = join(ROOT, 'src', 'demos', 'art', 'baked.ts');
const SCALE = 2;
const QUALITY = 0.86;

/**
 * The figures baked whole: the ones the demos show, and only those whose parts no
 * demo moves everywhere it appears (LIVE_PARTS in registry.ts lists the demos where
 * a baked figure is served as cut-outs or keeps its vector). Left as vectors, and
 * why, in docs/art-trials.md.
 */
export const BAKE = [
  'alice/falling',
  'alice/running-away',
  'alice/from-behind',
  'alice/looking-down',
  'alice/foot',
  'alice/hand-left',
  'alice/hand-right',
  'alice/standing',
  'alice/kneeling',
  'alice/filling',
  'white-rabbit/herald',
  'white-rabbit/garden',
  'queen-of-hearts',
  'king-of-hearts',
  'knave-of-hearts',
  'card-soldier',
  'card-arch',
  'duchess',
  'cook',
  'march-hare',
  'dormouse',
  'mock-turtle',
  'gryphon',
  'lobster',
  'alices-sister',
  'bill',
  'guinea-pigs',
  'rose-tree',
  'mushroom',
  'hedgehog',
  'pig-baby',
  'pig/trotting',
  'crab',
  'conger-eel',
  'dancer/seal',
  'dancer/turtle',
  'dancer/salmon',
  'dancer/whiting',
  'dancer/snail',
  'dancer/porpoise',
];

const isAlice = (id) => id.startsWith('alice/') || id === 'runner/alice';
const fileOf = (id, variant, part) =>
  `${id.replaceAll('/', '--')}${part ? `~${part}` : ''}.${variant}.webp`;

/** The drawing as a standalone SVG element filling its box. */
function drawing(id) {
  const entry = ART[id];
  if (entry?.kind !== 'vector') {
    throw new Error(`${id} is not a vector in the registry`);
  }
  const [w, h] = entry.box;
  return entry.markup.trim() || `<svg viewBox="0 0 ${w} ${h}">${entry.fragment ?? ''}</svg>`;
}

/** The page every figure is drawn on: the demos' tokens and art.css, nothing else. */
function pageHtml(style) {
  const css = ['src/styles/tokens.css', 'src/demos/shell/shell.css', 'src/demos/art/art.css']
    .map((file) => readFileSync(join(ROOT, file), 'utf8'))
    .join('\n');
  const filter = {
    flat: '',
    engraved: `.bake .art > svg { filter: url("#art-engraved"); }
      .bake .art[data-alice-figure] > svg { filter: url("#art-engraved-alice"); }`,
    paper: '.bake .art > svg { filter: url("#art-paper"); }',
  }[style];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}
    html, body { margin: 0; background: transparent; }
    .bake { position: relative; }
    .bake .art > svg { inline-size: 100%; block-size: 100%; }
    .sheet { display: flex; flex-wrap: wrap; gap: 24px; padding: 24px; inline-size: 1640px; align-items: end; background: var(--paper-warm); }
    .sheet .cell { display: grid; justify-items: center; gap: 4px; font: 11px system-ui; color: var(--ink-secondary); }
    ${filter}
  </style></head><body><div id="stage"></div>${artFilterDefs()}</body></html>`;
}

async function openPage(style) {
  const candidates = [process.env.PW_CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(Boolean);
  const executablePath = candidates.find((path) => existsSync(path));
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ deviceScaleFactor: SCALE });
  const dir = join(tmpdir(), `alice-bake-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'bake.html');
  writeFileSync(file, pageHtml(style));
  await page.goto(pathToFileURL(file).href);
  return { browser, page, done: () => rmSync(dir, { recursive: true, force: true }) };
}

const box = (id) => ART[id].box;

const figureHtml = (id) => {
  const [w, h] = box(id);
  const alice = isAlice(id) ? ' data-alice-figure' : '';
  return `<div class="bake" style="inline-size:${w}px;block-size:${h}px"><span class="art" data-art="${id}"${alice} style="block-size:100%">${drawing(id)}</span></div>`;
};

/** PNG bytes to WebP bytes, through the browser's canvas.toBlob. */
const toWebp = (page, png) =>
  page.evaluate(
    async ([b64, quality]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${b64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    },
    [png.toString('base64'), QUALITY],
  );

/**
 * What one picture shows: the whole figure, its drawing without the parts (`base`),
 * or one part alone. Returns whether that picture shows any of Alice's colours.
 */
const showOnly = (page, parts, part) =>
  page.evaluate(
    ([parts, part]) => {
      const svg = document.querySelector('#stage .art > svg');
      const found = parts.map((name) => {
        const element = svg.querySelector(`.${name}`);
        if (!element) {
          throw new Error(`no part .${name}`);
        }
        // A part's picture fills the drawing's box, so nothing above it may move it.
        for (let node = element; node && node !== svg; node = node.parentElement) {
          if (node.hasAttribute('transform')) {
            throw new Error(`.${name} sits under a transform; it cannot be cut out`);
          }
        }
        return element;
      });
      let shown = svg.outerHTML;
      if (part === 'base') {
        for (const element of found) {
          element.style.display = 'none';
        }
        const copy = svg.cloneNode(true);
        for (const name of parts) {
          copy.querySelector(`.${name}`)?.remove();
        }
        shown = copy.outerHTML;
      } else if (part) {
        svg.style.visibility = 'hidden';
        const element = found[parts.indexOf(part)];
        element.style.visibility = 'visible';
        shown = element.outerHTML;
      }
      return shown.includes('--alice-');
    },
    [parts, part],
  );

const sourceLines = (sources, indent) =>
  sources
    .map(
      ({ variant, file, w, h }) =>
        `${indent}${variant}: {\n${indent}  src: new URL('../../assets/images/figures/${file}', import.meta.url).href,\n${indent}  width: ${w * SCALE},\n${indent}  height: ${h * SCALE},\n${indent}},`,
    )
    .join('\n');

async function bake() {
  const { browser, page, done } = await openPage('engraved');
  mkdirSync(FIGURES, { recursive: true });
  for (const old of readdirSync(FIGURES)) {
    if (old.endsWith('.webp')) {
      rmSync(join(FIGURES, old));
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const records = [];

  /** Every picture of one figure, or of one of its cut-outs, per Alice variant. */
  async function picture(id, parts = [], part) {
    const [w, h] = box(id);
    if (/currentColor/.test(drawing(id))) {
      // Its colour comes from where a demo puts it; one picture cannot follow.
      throw new Error(`${id} takes its colour from its context (currentColor); it cannot be baked`);
    }
    await page.evaluate((html) => {
      document.querySelector('#stage').innerHTML = html;
    }, figureHtml(id));
    const alice = isAlice(id) || (await showOnly(page, parts, part));
    const sources = [];
    for (const variant of alice ? ['yellow', 'blue'] : ['any']) {
      await page.evaluate((blue) => {
        document.documentElement.toggleAttribute('data-alice', blue);
        if (blue) {
          document.documentElement.dataset.alice = 'blue';
        }
      }, variant === 'blue');
      const png = await page.locator('.bake').screenshot({ omitBackground: true });
      const webp = Buffer.from(await toWebp(page, png), 'base64');
      const file = fileOf(id, variant, part);
      writeFileSync(join(FIGURES, file), webp);
      sources.push({ variant, file, w, h });
      const what =
        part === 'base' ? ', without its moving parts' : part ? `, its part .${part}` : '';
      records.push({
        file: `figures/${file}`,
        what: `Registry figure ${id}${what}${variant === 'any' ? '' : ` (${variant} Alice)`}, engraved treatment, at ${SCALE}x its ${w}x${h} box.`,
        generator:
          'none: rendered by scripts/bake-art.mjs in headless Chromium from the project’s own vector in src/demos/art/vectors.ts',
        intent:
          'Deliver the engraved look as pictures, with the drawing the project already owns, so it costs nothing at runtime.',
        date: today,
        edits: 'none',
        bytes: webp.length,
      });
      console.log(`${file.padEnd(52)} ${(webp.length / 1024).toFixed(1).padStart(6)} KB`);
    }
    return sources;
  }

  const whole = [];
  for (const id of BAKE) {
    whole.push(`  '${id}': {\n${sourceLines(await picture(id), '    ')}\n  },`);
  }
  const cut = [];
  for (const [id, { parts }] of Object.entries(CUT_OUTS)) {
    const base = await picture(id, parts, 'base');
    const each = [];
    for (const part of parts) {
      each.push(
        `      '${part}': {\n${sourceLines(await picture(id, parts, part), '        ')}\n      },`,
      );
    }
    cut.push(
      `  '${id}': {\n    base: {\n${sourceLines(base, '      ')}\n    },\n    parts: {\n${each.join('\n')}\n    },\n  },`,
    );
  }
  await browser.close();
  done();

  writeFileSync(
    MANIFEST,
    `/**
 * Generated by scripts/bake-art.mjs (\`npm run art:bake\`); do not edit by hand.
 * The registry's vectors rendered through the engraved treatment: whole figures
 * (BAKED), and figures whose parts a demo moves as cut-outs, the drawing without the
 * parts and each part alone in the same box (BAKED_PARTS). A picture that shows
 * Alice's colours has one file per Alice variant. See docs/art-trials.md.
 */

import type { ImageSource } from './registry.ts';

type Sources = Partial<Record<'blue' | 'yellow' | 'any', ImageSource>>;

export const BAKED: Record<string, Sources> = {
${whole.join('\n')}
};

export const BAKED_PARTS: Record<string, { base: Sources; parts: Record<string, Sources> }> = {
${cut.join('\n')}
};
`,
  );
  writeFileSync(
    PROVENANCE,
    `${JSON.stringify(
      {
        $comment:
          'Every raster image in src/assets/images/, per docs/assets-and-audio.md §3: what it is, what made it, why, when, and any editing after.',
        images: records,
      },
      null,
      2,
    )}\n`,
  );
  const total = records.reduce((sum, record) => sum + record.bytes, 0);
  console.log(`${records.length} pictures, ${(total / 1024).toFixed(1)} KB`);
}

/** Every vector figure in one style on one sheet, labelled by id. */
async function sheet(style, out, only) {
  const { browser, page, done } = await openPage(style);
  const ids = Object.entries(ART)
    .filter(([, entry]) => entry.kind === 'vector' && (entry.markup.trim() || entry.fragment))
    .map(([id]) => id)
    .filter((id) => !only || only.includes(id));
  await page.setViewportSize({ width: 1690, height: 800 });
  await page.evaluate(
    (cells) => {
      document.querySelector('#stage').innerHTML = `<div class="sheet">${cells}</div>`;
    },
    ids.map((id) => `<div class="cell">${figureHtml(id)}<span>${id}</span></div>`).join(''),
  );
  await page.locator('.sheet').screenshot({ path: out });
  await browser.close();
  done();
  console.log(out);
}

const args = process.argv.slice(2);
if (args[0] === '--sheet') {
  await sheet(
    args[1] ?? 'engraved',
    args[2] ?? join(tmpdir(), `figures-${args[1]}.png`),
    args[3]?.split(','),
  );
} else {
  await bake();
}
