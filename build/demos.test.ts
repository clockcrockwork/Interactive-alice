import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { transitionKindFor } from '../src/demos/shell/transitions.ts';
import {
  arrivalScript,
  DEMO_INDEX,
  DEMO_ORDER,
  demoBootScript,
  demoDir,
  generateDemoPages,
  generateDemoPagesFrom,
  isPublishable,
  loadDemoProject,
  loadDemoProjects,
  nextDemo,
  pageRelativeArt,
  realiaFor,
  titleOf,
} from './demos.ts';
import { htmlOpen } from './pages.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const project = loadDemoProject(root);
const all = generateDemoPages(root);
// The public Riverbank entry and the base locale's direct scene routes.
const manifest = { pages: all.manifest.pages.filter((page) => page.locale === project.locale) };
const basePaths = new Set(manifest.pages.map((page) => page.path));
const pages = all.pages.filter((page) => basePaths.has(page.path));

const segmentIds = (html: string): string[] =>
  [...html.matchAll(/data-segment="([^"]+)"/g)].map((match) => match[1] ?? '');

describe('the concept-demo pages', () => {
  it('keeps the full text fallback hidden until the scene attaches without hiding no-script pages', () => {
    for (const page of pages.filter((candidate) =>
      /(?:^|\/)demos\/[^/]+\/index\.html$/.test(candidate.path),
    )) {
      expect(page.html, page.path).toContain(demoBootScript);
      expect(page.html.indexOf(demoBootScript), page.path).toBeLessThan(
        page.html.indexOf('<script type="module"'),
      );
      expect(page.html, page.path).not.toContain('data-demo-booting=""');
    }
    expect(demoBootScript).toContain('data-demo-booting');
    expect(demoBootScript).toContain('unhandledrejection');
  });

  it('generates one Riverbank entry and one route per demo without a public index', () => {
    expect(pages.map((page) => page.path)).toEqual([
      'index.html',
      ...DEMO_ORDER.map((id) => `demos/${id}/index.html`),
    ]);
    expect(manifest.pages.map((page) => page.demo ?? page.kind)).toEqual([
      'riverbank',
      ...DEMO_ORDER,
    ]);
    expect(manifest.pages[0]?.kind).toBe('entry');
    expect(pages.some((page) => page.path === 'demos/index.html')).toBe(false);
  });

  it('keeps the story order and adjacent scene links derived from the canonical order', () => {
    const joined = project.demos.filter((demo) => demo.joinsPrevious).map((demo) => demo.id);
    expect(project.demos[0]?.joinsPrevious).toBeFalsy();
    expect(joined.length).toBeGreaterThan(10);
    expect(project.demos.map((demo) => demo.id)).toEqual([...DEMO_ORDER]);
  });

  it('carries every segment of the composition, in composition order, with its text', () => {
    for (const demo of project.demos) {
      const page = pages.find((candidate) => candidate.path === `demos/${demo.id}/index.html`);
      const entry = manifest.pages.find((candidate) => candidate.demo === demo.id);
      expect(page).toBeDefined();
      expect(entry).toBeDefined();
      const expected = demo.shots.flatMap((shot) =>
        shot.beats.flatMap((beat) => [...beat.segments]),
      );
      expect(segmentIds(page?.html ?? '')).toEqual(expected);
      expect(entry?.segments).toEqual(expected);
      for (const id of expected) {
        const line = project.lines.get(id);
        expect(line).toBeDefined();
        expect(page?.html).toContain(`>${line?.text.replace(/&/g, '&amp;')}</p>`);
      }
    }
  });

  it('writes each beat with its cue, so code can address moments without an index', () => {
    for (const demo of project.demos) {
      const page = pages.find((candidate) => candidate.path === `demos/${demo.id}/index.html`);
      const entry = manifest.pages.find((candidate) => candidate.demo === demo.id);
      const cues = demo.shots.flatMap((shot) =>
        shot.beats.flatMap((beat) => (beat.cue ? [beat.cue] : [])),
      );
      expect(entry?.cues).toEqual(cues);
      for (const cue of cues) {
        expect(page?.html).toContain(`data-cue="${cue}"`);
      }
    }
  });

  it('names each demo after its chapter or section and links scenes in order', () => {
    for (const [position, demo] of project.demos.entries()) {
      const title = titleOf(project, demo);
      expect(title).not.toBe('');
      // A second demo from the same chapter takes its name from a section instead.
      if (demo.titleSection) {
        expect(title).not.toBe(project.titles.get(demo.titleChapter));
      }
      const page = pages.find((candidate) => candidate.path === `demos/${demo.id}/index.html`);
      expect(page?.html).toContain(`<h1 class="demo__title">${title}</h1>`);
      const next = DEMO_ORDER[position + 1];
      expect(page?.html).toContain(
        `<a class="demo__next" href="${next ? `../${next}/` : '../../'}">`,
      );
    }
  });

  it('takes its half of the turn between pages in the head, before any module runs', () => {
    for (const page of pages) {
      const id =
        page.path === 'index.html'
          ? 'riverbank'
          : /^demos\/(?:[^/]+\/)?([^/]+)\/index\.html$/.exec(page.path)?.[1];
      const kind = transitionKindFor(`/demos/${id ?? 'riverbank'}/`);
      const script = arrivalScript(kind);
      expect(page.html, page.path).toContain(script);
      expect(page.html.indexOf(script), page.path).toBeLessThan(
        page.html.indexOf('<script type="module"'),
      );
    }
    expect(arrivalScript('hole')).toContain('t.types.add("hole")');
    expect(arrivalScript('hole')).toContain('data-arriving');
  });

  it('keeps test pickers out of visitor pages and uses the engraved yellow defaults', () => {
    for (const page of pages) {
      expect(page.html, page.path).not.toContain('demos__alice-choice');
      expect(page.html, page.path).not.toContain('data-art-style=');
      expect(page.html, page.path).toContain('location.hostname');
      expect(page.html, page.path).toContain('localhost|127\\.0\\.0\\.1|\\[::1\\]');
    }
    const entry = pages.find((page) => page.path === 'index.html')?.html ?? '';
    expect(entry).toContain('data-demo="riverbank"');
    expect(entry).not.toContain('file:');
  });

  it('marks a dark ground on the page when the demo file says so', () => {
    for (const demo of project.demos) {
      const page = pages.find((candidate) => candidate.path === `demos/${demo.id}/index.html`);
      const body = page?.html.match(/<body[^>]*>/)?.[0] ?? '';
      expect(body.includes('data-ground="dark"'), demo.id).toBe(demo.ground === 'dark');
    }
    const dark = project.demos.filter((demo) => demo.ground === 'dark').map((demo) => demo.id);
    expect(dark).toEqual(expect.arrayContaining(['cheshire-cat', 'witnesses', 'trial']));
  });

  it('turns a baked picture file URL into a path relative to the page', () => {
    const html = '<img src="file:///work/repo/src/assets/images/figures/x.any.webp" />';
    expect(pageRelativeArt(html, '../../')).toBe(
      '<img src="../../assets/images/figures/x.any.webp" />',
    );
  });

  it('keeps every URL relative, so the build runs in a subdirectory', () => {
    for (const page of pages) {
      expect(page.html).not.toMatch(/(?:src|href)="\//);
    }
  });

  it('refuses a demo whose segment has no text in the demo locale', () => {
    const broken = loadDemoProject(root);
    broken.lines.delete('ch07.s0480');
    expect(() => generateDemoPagesFrom(broken)).toThrow(/ch07\.s0480 has no text/);
  });
});

describe('the concept-demo pages in every other locale', () => {
  const projects = loadDemoProjects(root);
  const others = projects.filter((other) => !other.base);
  const pageAt = (path: string): string =>
    all.pages.find((candidate) => candidate.path === path)?.html ?? '';

  it('has at least one other locale, and puts its pages under demos/<locale>/', () => {
    expect(others.length).toBeGreaterThan(0);
    for (const other of others) {
      const entries = all.manifest.pages.filter((page) => page.locale === other.locale);
      const published = other.demos.filter((demo) => isPublishable(other, demo));
      expect(entries.map((entry) => entry.path)).toEqual(
        published.map((demo) => `demos/${other.locale}/${demo.id}/index.html`),
      );
      expect(entries[0]?.url).toBe(`./demos/${other.locale}/riverbank/`);
    }
  });

  it('publishes all nineteen in Japanese, each page in its own language with its own sentences', () => {
    const ja = others.find((other) => other.locale === 'ja');
    expect(ja).toBeDefined();
    if (!ja) {
      return;
    }
    expect(ja.demos.filter((demo) => isPublishable(ja, demo)).map((demo) => demo.id)).toEqual([
      ...DEMO_ORDER,
    ]);
    for (const demo of ja.demos) {
      const html = pageAt(`demos/ja/${demo.id}/index.html`);
      expect(html, demo.id).toContain(htmlOpen('ja', ja.settings));
      expect(html).toContain(`<h1 class="demo__title">${titleOf(ja, demo)}</h1>`);
      expect(titleOf(ja, demo)).not.toBe(titleOf(project, demo));
      for (const id of demo.shots.flatMap((shot) => shot.beats.flatMap((beat) => beat.segments))) {
        const text = ja.lines.get(id)?.text ?? '';
        expect(text, id).not.toBe('');
        expect(html).toContain(`data-segment="${id}"`);
        expect(html).toContain(`>${text.replace(/&/g, '&amp;')}</p>`);
        // Never the base locale's sentence instead.
        expect(text).not.toBe(project.lines.get(id)?.text);
      }
      // One more directory deep, so one more step up to the shared code.
      expect(html).toContain(`src="../../../../demos/${demo.id}/main.ts"`);
      expect(html).toContain(`"demoPause":"${ja.ui.demoPause}"`);
    }
  });

  it('keeps "Next scene" and going on by itself inside the same locale', () => {
    for (const other of others) {
      for (const demo of other.demos.filter((candidate) => isPublishable(other, candidate))) {
        const html = pageAt(`demos/${other.locale}/${demo.id}/index.html`);
        const next = nextDemo(other, demo.id);
        if (demo.id !== 'riverbank')
          expect(html).toContain(
            `<a class="demo__back" href="../${DEMO_ORDER[DEMO_ORDER.indexOf(demo.id as (typeof DEMO_ORDER)[number]) - 1]}/">`,
          );
        if (next === DEMO_INDEX) {
          expect(html).toContain(`<a class="demo__next" href="../riverbank/">`);
          continue;
        }
        // A sibling of this page's own directory: demos/<locale>/<next>/.
        expect(html).toContain(`<a class="demo__next" href="../${next}/">`);
        expect(
          all.pages.some((page) => page.path === `demos/${other.locale}/${next}/index.html`),
        ).toBe(true);
      }
    }
  });

  it('ends the walk at the trial: its next link is the index, labelled so, with nothing going on by itself', () => {
    for (const from of projects) {
      const order = from.demos.filter((demo) => isPublishable(from, demo)).map((demo) => demo.id);
      const last = order.at(-1);
      expect(last, from.locale).toBe('trial');
      expect(nextDemo(from, 'trial')).toBe(DEMO_INDEX);
      // Every other demo goes on to the one after it, never round to the first.
      for (const [i, id] of order.slice(0, -1).entries()) {
        expect(nextDemo(from, id)).toBe(order[i + 1]);
      }
      const html = pageAt(
        from.base ? 'demos/trial/index.html' : `demos/${from.locale}/trial/index.html`,
      );
      expect(html).toContain(`<footer class="demo__end" data-last>`);
      expect(html).toContain(
        `<a class="demo__next" href="${from.base ? '../../' : '../riverbank/'}">${from.ui.demoStart}</a>`,
      );
      expect(html).not.toContain('class="demo__auto"');
      expect(html).not.toContain(`>${from.ui.demoNext}</a>`);
      const before = pageAt(
        from.base ? 'demos/witnesses/index.html' : `demos/${from.locale}/witnesses/index.html`,
      );
      expect(before).toContain('class="demo__auto"');
      expect(before).toContain(`<a class="demo__next" href="../trial/">${from.ui.demoNext}</a>`);
    }
  });

  it('keeps a quiet language switch on every scene without a language picker page', () => {
    for (const from of projects) {
      const html = pageAt(
        from.base ? 'demos/riverbank/index.html' : `demos/${from.locale}/riverbank/index.html`,
      );
      for (const to of projects) {
        expect(html, `${from.locale} has ${to.locale}`).toContain(`lang="${to.locale}"`);
        expect(html, `${from.locale} has ${to.locale}`).toContain(to.nativeName);
        if (from.locale === to.locale) expect(html).toContain(`aria-current="page"`);
      }
    }
    expect(all.pages.some((page) => /demos\/(?:ja\/)?index\.html$/.test(page.path))).toBe(false);
  });

  it('keeps visitor pages in their locale without exposing comparison UI', () => {
    const ja = others.find((other) => other.locale === 'ja');
    const html = pageAt('demos/ja/riverbank/index.html');
    expect(html).toContain('<html lang="ja"');
    const riverbank = ja?.demos.find((demo) => demo.id === 'riverbank');
    expect(riverbank).toBeDefined();
    if (ja && riverbank) {
      expect(html).toContain(`<h1 class="demo__title">${titleOf(ja, riverbank)}</h1>`);
    }
    expect(html).not.toContain('demos__alice-choice');
    expect(html).not.toContain('data-art-style=');
  });

  it('leaves out a demo a locale cannot show yet, lists its card as pending, and skips it in the walk', () => {
    const ja = loadDemoProject(root, 'ja');
    ja.lines.delete('ch09.s0700');
    const graph = generateDemoPagesFrom(ja, projects);
    const paths = graph.pages.map((page) => page.path);
    expect(paths).not.toContain('demos/ja/mock-turtle/index.html');
    expect(paths).toContain('demos/ja/duchess/index.html');
    const duchess = graph.pages.find((page) => page.path === 'demos/ja/duchess/index.html');
    expect(duchess?.html).toContain('<a class="demo__next" href="../lobster-quadrille/">');
    expect(paths).not.toContain('demos/ja/index.html');
  });

  it("writes each locale's realia for just the ids a demo reads, and none where it reads none", () => {
    for (const each of projects) {
      for (const demo of each.demos) {
        if (!isPublishable(each, demo)) {
          continue;
        }
        const html = pageAt(`${demoDir(each)}/${demo.id}/index.html`);
        const attr = /data-realia="([^"]*)"/.exec(html)?.[1];
        if (!demo.realia?.length) {
          expect(attr, `${each.locale} ${demo.id}`).toBeUndefined();
          continue;
        }
        const carried = JSON.parse((attr ?? '{}').replaceAll('&quot;', '"')) as Record<
          string,
          unknown
        >;
        expect(Object.keys(carried)).toEqual(demo.realia);
        expect(carried).toEqual(realiaFor(each, demo));
        for (const id of demo.realia) {
          expect(carried[id]).toEqual((each.realia as Record<string, unknown>)[id]);
        }
      }
    }
    // Not one demo file says which locale draws what: the pictures field is gone.
    for (const demo of project.demos) {
      expect(Object.keys(demo)).not.toContain('pictures');
    }
  });

  it("writes every page's locale profile on its root, from the registry, never inferred", () => {
    for (const each of projects) {
      const own = all.pages.filter((page) => page.path.startsWith(`${demoDir(each)}/`));
      const pagesOf = each.base
        ? own.filter((page) => !others.some((other) => page.path.startsWith(`${demoDir(other)}/`)))
        : own;
      expect(pagesOf.length).toBeGreaterThan(0);
      for (const page of pagesOf) {
        expect(page.html, page.path).toContain(htmlOpen(each.locale, each.settings));
      }
      const open = htmlOpen(each.locale, each.settings);
      expect(open).toContain(`data-set-apart="${each.settings.setApart.join(' ')}"`);
      expect(open).toContain(`data-word-unit="${each.settings.wordUnit}"`);
      expect(open).toContain(`data-emphasis="${each.settings.emphasis}"`);
      expect(open).toContain(`data-glyph-width="${each.settings.glyphWidth}"`);
      expect(open).toContain(`data-numbers="${each.settings.numbers}"`);
    }
  });
});
