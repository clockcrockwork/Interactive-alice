/**
 * The caption fit budget (docs/text-experience-binding.md §9.6): wherever a beat is
 * read, at desktop and at a 390-pixel phone, in every locale, every sentence on
 * screen lies inside the stage, below the bar, and clear of the props that beat
 * shows. One page load per demo and viewport; every beat is sampled at three
 * points through the seam's `seek`, and the rects are read in the page, so a
 * failure lists every line that does not fit rather than the first.
 */

import { expect, test } from '@playwright/test';
import { demos } from './demo-helpers.ts';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'phone', width: 390, height: 780 },
] as const;
const POINTS = [0.3, 0.6, 0.9] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`captions fit at ${viewport.name}`, () => {
    // Each width's pages one after another in a single worker: the sampling renders
    // without pause, and spread over every worker it would starve the suite's
    // time-based tests running beside it.
    test.describe.configure({ mode: 'default' });
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const entry of demos) {
      test(`${entry.locale} ${entry.demo}`, async ({ page }) => {
        // Many beats, each sampled three times; the well's frames are slow in
        // software, so a page is given minutes, not seconds.
        test.setTimeout(240_000);
        await page.goto(entry.url);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
        const count = await page.locator('.demo__stage .demo-beat').count();
        expect(count).toBeGreaterThan(0);
        const failures: string[] = [];
        for (let beat = 0; beat < count; beat += 1) {
          for (const within of POINTS) {
            failures.push(
              ...(await page.evaluate(
                async ([index, at, total]) => {
                  const seam = window.__aliceDemo;
                  seam?.seek((index + at) / total);
                  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
                  // A playful motion that runs by time (the sea's somersault turns the
                  // whole frame) is let finish: the lines are read once the stage is
                  // square and they move less than two pixels a frame, or after two
                  // seconds, whichever comes first.
                  const square = () => {
                    const stage = document.querySelector('.demo__stage');
                    const matrix = stage ? getComputedStyle(stage).transform : 'none';
                    return matrix === 'none' || matrix === 'matrix(1, 0, 0, 1, 0, 0)';
                  };
                  const where = () =>
                    [
                      ...document.querySelectorAll<HTMLElement>(
                        '.demo__stage .demo-beat[data-active] .line',
                      ),
                    ].map((line) => {
                      const r = line.getBoundingClientRect();
                      return [r.left, r.top, r.right, r.bottom];
                    });
                  await frame();
                  let before = where();
                  const until = performance.now() + 2000;
                  for (;;) {
                    await frame();
                    const now = where();
                    const still = now.every((box, i) =>
                      box.every((v, k) => Math.abs(v - (before[i]?.[k] ?? v)) < 2),
                    );
                    if ((still && square()) || performance.now() > until) {
                      break;
                    }
                    before = now;
                  }
                  const shown = (el: Element): boolean => {
                    const style = getComputedStyle(el);
                    return style.visibility === 'visible' && style.display !== 'none';
                  };
                  const opacity = (el: Element): number => {
                    let value = 1;
                    for (let node: Element | null = el; node; node = node.parentElement) {
                      value *= Number(getComputedStyle(node).opacity);
                    }
                    return value;
                  };
                  const bar = document.querySelector('.demo__bar')?.getBoundingClientRect();
                  const stage = document.querySelector('.demo__stage')?.getBoundingClientRect();
                  if (!bar || !stage) {
                    return ['no bar or stage'];
                  }
                  const top = Math.max(stage.top, bar.bottom);
                  const props = [
                    ...document.querySelectorAll<HTMLElement>('.demo__prop[data-shown]'),
                  ]
                    .filter((el) => !el.hidden && shown(el))
                    .map((el) => ({ el, r: el.getBoundingClientRect() }))
                    .filter(({ r }) => r.width > 0 && r.height > 0);
                  const place = `beat ${index} (${
                    document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')[index]
                      ?.dataset.cue ?? '-'
                  }) at ${at}`;
                  const out: string[] = [];
                  // What the shell's own fit could not fit (a beat's own band
                  // included), it reports; none may be left.
                  if (seam?.captionFit()[index] === 'over') {
                    out.push(`${place}: the shell reports its captions do not fit`);
                  }
                  // A beat drawn elsewhere (the tale's verses, down the tail) keeps its
                  // sentences in a one-pixel box for assistive technology; what is on
                  // screen is the drawing, every sentence of it shown so far, and that
                  // is held to the same frame.
                  const active = document.querySelector<HTMLElement>(
                    '.demo__stage .demo-beat[data-active]',
                  );
                  const drawnElsewhere = (active?.offsetWidth ?? 0) <= 1;
                  const targets: Element[] = drawnElsewhere
                    ? [...document.querySelectorAll('.demo__stage [data-segment]')].filter(
                        (el) => !el.closest('.demo__captions'),
                      )
                    : [...(active?.querySelectorAll('.line') ?? [])];
                  for (const line of targets as HTMLElement[]) {
                    if (!shown(line) || opacity(line) < 0.2) {
                      continue;
                    }
                    const r = line.getBoundingClientRect();
                    if (r.width === 0 || r.height === 0) {
                      continue;
                    }
                    const id = line.dataset.segment ?? '?';
                    const slack = 1;
                    if (r.top < top - slack) {
                      out.push(`${place}: ${id} is ${Math.round(top - r.top)}px under the bar`);
                    }
                    if (r.bottom > stage.bottom + slack) {
                      out.push(
                        `${place}: ${id} is ${Math.round(r.bottom - stage.bottom)}px below the frame`,
                      );
                    }
                    if (r.left < stage.left - slack || r.right > stage.right + slack) {
                      out.push(`${place}: ${id} runs off the side`);
                    }
                    for (const { el, r: p } of props) {
                      const overlapX = Math.min(r.right, p.right) - Math.max(r.left, p.left);
                      const overlapY = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
                      if (overlapX > slack && overlapY > slack) {
                        out.push(`${place}: ${id} is under the button ${el.className}`);
                      }
                    }
                  }
                  return out;
                },
                [beat, within, count] as const,
              )),
            );
          }
        }
        expect(failures).toEqual([]);
      });
    }
  });
}
