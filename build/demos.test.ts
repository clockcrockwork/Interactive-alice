import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEMO_ORDER,
  generateDemoPages,
  generateDemoPagesFrom,
  isPublishable,
  loadDemoProject,
  loadDemoProjects,
  nextDemo,
  pageRelativeArt,
  titleOf,
} from './demos.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const project = loadDemoProject(root);
const all = generateDemoPages(root);
// The base locale's pages, at the plain demos/ URLs; the other locales' are below.
const manifest = { pages: all.manifest.pages.filter((page) => page.locale === project.locale) };
const basePaths = new Set(manifest.pages.map((page) => page.path));
const pages = all.pages.filter((page) => basePaths.has(page.path));

const segmentIds = (html: string): string[] =>
  [...html.matchAll(/data-segment="([^"]+)"/g)].map((match) => match[1] ?? '');

describe('the concept-demo pages', () => {
  it('generates the index and one page per demo, in the fixed order', () => {
    expect(pages.map((page) => page.path)).toEqual([
      'demos/index.html',
      ...DEMO_ORDER.map((id) => `demos/${id}/index.html`),
    ]);
    expect(manifest.pages.map((page) => page.demo ?? page.kind)).toEqual(['demos', ...DEMO_ORDER]);
  });

  it('reads the joins from the demos themselves, and deals each joined card over the one before', () => {
    const index = pages.find((page) => page.path === 'demos/index.html')?.html ?? '';
    const joined = project.demos.filter((demo) => demo.joinsPrevious).map((demo) => demo.id);
    // The first demo joins nothing; every joined one follows a demo in the order.
    expect(project.demos[0]?.joinsPrevious).toBeFalsy();
    expect(joined.length).toBeGreaterThan(10);
    for (const demo of project.demos) {
      const card = new RegExp(`data-demo="${demo.id}"( data-joined)?`).exec(index);
      expect(Boolean(card?.[1]), demo.id).toBe(Boolean(demo.joinsPrevious));
    }
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

  it('names each demo after its chapter or section, in the demo locale, and links them in a ring', () => {
    const index = pages.find((page) => page.path === 'demos/index.html');
    for (const [position, demo] of project.demos.entries()) {
      const title = titleOf(project, demo);
      expect(title).not.toBe('');
      // A second demo from the same chapter takes its name from a section instead.
      if (demo.titleSection) {
        expect(title).not.toBe(project.titles.get(demo.titleChapter));
      }
      expect(index?.html).toContain(`href="./${demo.id}/"`);
      expect(index?.html).toContain(title);
      const page = pages.find((candidate) => candidate.path === `demos/${demo.id}/index.html`);
      expect(page?.html).toContain(`<h1 class="demo__title">${title}</h1>`);
      const next = DEMO_ORDER[(position + 1) % DEMO_ORDER.length];
      expect(page?.html).toContain(`href="../${next}/"`);
    }
  });

  it('applies the remembered drawing before first paint and offers the three, engraved pressed', () => {
    for (const page of pages) {
      expect(page.html, page.path).toContain('localStorage.getItem("alice-demos:art")');
      // Only flat and cut paper are written to the root; engraved, and the trial's
      // old `baked`, leave it absent, which is engraved.
      expect(page.html, page.path).toContain('if(r==="flat"||r==="paper")d.dataset.art=r');
      expect(page.html, page.path).not.toContain('"baked"');
    }
    const index = pages.find((page) => page.path === 'demos/index.html')?.html ?? '';
    const styles = [
      ...index.matchAll(/<button[^>]*data-art-style="([a-z]+)" aria-pressed="(\w+)"/g),
    ];
    expect(styles.map((match) => [match[1], match[2]])).toEqual([
      ['engraved', 'true'],
      ['flat', 'false'],
      ['paper', 'false'],
    ]);
    // The engraved preview carries its baked image, relative to the page, never a file URL.
    expect(index).toMatch(
      /<img class="art__image art__image--baked"[^>]*src="\.\.\/\.\.\/assets\/images\/figures\//,
    );
    expect(index).not.toContain('file:');
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
      expect(entries.map((entry) => entry.path)).toEqual([
        `demos/${other.locale}/index.html`,
        ...published.map((demo) => `demos/${other.locale}/${demo.id}/index.html`),
      ]);
      expect(entries[0]?.url).toBe(`./demos/${other.locale}/`);
      expect(entries[0]?.published).toEqual(published.map((demo) => demo.id));
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
      expect(html, demo.id).toContain(
        '<html lang="ja" dir="ltr" data-line-break="strict" data-significant-spaces="true">',
      );
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
        // A sibling of this page's own directory: demos/<locale>/<next>/.
        expect(html).toContain(`<a class="demo__next" href="../${next}/">`);
        expect(
          all.pages.some((page) => page.path === `demos/${other.locale}/${next}/index.html`),
        ).toBe(true);
        expect(html).toContain(`<a class="demo__back" href="../">`);
      }
    }
  });

  it('links each index to the others, each named in its own language, as a link', () => {
    for (const from of projects) {
      const html = pageAt(from.base ? 'demos/index.html' : `demos/${from.locale}/index.html`);
      expect(html).toContain(`aria-label="${from.ui.demoLanguages}"`);
      for (const to of projects) {
        const href =
          from.locale === to.locale
            ? './'
            : from.base
              ? to.base
                ? './'
                : `./${to.locale}/`
              : to.base
                ? '../'
                : `../${to.locale}/`;
        const current = to.locale === from.locale ? ' aria-current="page"' : '';
        expect(html, `${from.locale} -> ${to.locale}`).toContain(
          `href="${href}" lang="${to.locale}" dir="${to.dir}" hreflang="${to.locale}"${current}>${to.nativeName}</a>`,
        );
      }
    }
  });

  it('titles and describes the cards in the locale, with every label from its ui.json', () => {
    const ja = others.find((other) => other.locale === 'ja');
    const html = pageAt('demos/ja/index.html');
    expect(html).toContain('<html lang="ja"');
    for (const key of ['demosTitle', 'demosIntro', 'demoAliceTitle', 'demoArtTitle'] as const) {
      expect(html).toContain(ja?.ui[key] ?? '-');
    }
    for (const demo of ja?.demos ?? []) {
      expect(html).toContain(`<span class="demos__name">${ja ? titleOf(ja, demo) : ''}</span>`);
    }
    expect(html).not.toContain(project.ui.demosTitle);
    // The engraved preview's baked image, one level deeper than the base index.
    expect(html).toMatch(/src="\.\.\/\.\.\/\.\.\/assets\/images\/figures\//);
  });

  it('leaves out a demo a locale cannot show yet, lists its card as pending, and skips it in the ring', () => {
    const ja = loadDemoProject(root, 'ja');
    ja.lines.delete('ch09.s0700');
    const graph = generateDemoPagesFrom(ja, projects);
    const paths = graph.pages.map((page) => page.path);
    expect(paths).not.toContain('demos/ja/mock-turtle/index.html');
    expect(paths).toContain('demos/ja/duchess/index.html');
    const duchess = graph.pages.find((page) => page.path === 'demos/ja/duchess/index.html');
    expect(duchess?.html).toContain('<a class="demo__next" href="../lobster-quadrille/">');
    const index = graph.pages.find((page) => page.path === 'demos/ja/index.html')?.html ?? '';
    const card =
      /<li class="demos__card" data-available="false" data-demo="mock-turtle"[\s\S]*?<\/li>/.exec(
        index,
      )?.[0];
    expect(card).toBeDefined();
    expect(card).not.toContain('href=');
    const turtle = project.demos.find((demo) => demo.id === 'mock-turtle');
    expect(card).toContain(`lang="${project.locale}"`);
    expect(card).toContain(turtle ? titleOf(project, turtle) : '-');
    expect(card).toContain(ja.ui.partPending);
  });

  it("writes a locale's own pictures onto its page, and none where it has none", () => {
    const cat = project.demos.find((demo) => demo.id === 'cheshire-cat');
    expect(cat?.pictures?.ja).toEqual({ fig: 'lid' });
    expect(pageAt('demos/ja/cheshire-cat/index.html')).toContain(
      'data-pictures="{&quot;fig&quot;:&quot;lid&quot;}"',
    );
    expect(pageAt('demos/cheshire-cat/index.html')).not.toContain('data-pictures');
  });
});
