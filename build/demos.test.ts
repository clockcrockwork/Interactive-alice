import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEMO_ORDER, generateDemoPages, generateDemoPagesFrom, loadDemoProject } from './demos.ts';

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

  it('names each demo after its chapter, in the demo locale, and links them in a ring', () => {
    const index = pages.find((page) => page.path === 'demos/index.html');
    for (const [position, demo] of project.demos.entries()) {
      const title = project.titles.get(demo.titleChapter) ?? '';
      expect(title).not.toBe('');
      expect(index?.html).toContain(`href="./${demo.id}/"`);
      expect(index?.html).toContain(title);
      const page = pages.find((candidate) => candidate.path === `demos/${demo.id}/index.html`);
      expect(page?.html).toContain(`<h1 class="demo__title">${title}</h1>`);
      const next = DEMO_ORDER[(position + 1) % DEMO_ORDER.length];
      expect(page?.html).toContain(`href="../${next}/"`);
    }
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
