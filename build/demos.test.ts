import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEMO_ORDER,
  generateDemoPages,
  generateDemoPagesFrom,
  loadDemoProject,
  pageRelativeArt,
  titleOf,
} from './demos.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const project = loadDemoProject(root);
const { pages, manifest } = generateDemoPages(root);

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
