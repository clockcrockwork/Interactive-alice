import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

type CaptionSample = {
  mode: string;
  progress: number;
  stage: { top: number; bottom: number };
  lines: Array<{
    id: string;
    text: string;
    opacity: number;
    y: number;
    bottom: number;
    textTop: number;
    textBottom: number;
  }>;
  paperOverlaps: Array<[string, string]>;
  textOverlaps: Array<[string, string]>;
};

const sampleCaptions = (page: Page): Promise<CaptionSample> =>
  page.evaluate(() => {
    const beat = document.querySelector<HTMLElement>('.demo-beat[data-beat="deep-or-slow"]');
    if (!beat) throw new Error('deep-or-slow beat is missing');
    const stage = document.querySelector<HTMLElement>('.demo__stage');
    if (!stage) throw new Error('demo stage is missing');
    const stageBox = stage.getBoundingClientRect();
    const lines = [...beat.querySelectorAll<HTMLElement>('.line')].map((line) => {
      const box = line.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(line);
      const textRects = [...range.getClientRects()];
      return {
        id: line.dataset.segment ?? '',
        text: line.innerText,
        opacity: Number(getComputedStyle(line).opacity),
        x: box.x,
        y: box.y,
        right: box.right,
        bottom: box.bottom,
        textTop: textRects.length ? Math.min(...textRects.map((rect) => rect.top)) : box.top,
        textBottom: textRects.length
          ? Math.max(...textRects.map((rect) => rect.bottom))
          : box.bottom,
        textRects: textRects.map((rect) => ({
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
        })),
      };
    });
    const intersects = (
      a: { x: number; y: number; right: number; bottom: number },
      b: { x: number; y: number; right: number; bottom: number },
    ) =>
      Math.min(a.right, b.right) > Math.max(a.x, b.x) &&
      Math.min(a.bottom, b.bottom) > Math.max(a.y, b.y);
    const paperOverlaps: Array<[string, string]> = [];
    const textOverlaps: Array<[string, string]> = [];
    for (let i = 0; i < lines.length; i += 1) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const a = lines[i];
        const b = lines[j];
        if (!a || !b) continue;
        if (intersects(a, b)) paperOverlaps.push([a.id, b.id]);
        if (a.textRects.some((left) => b.textRects.some((right) => intersects(left, right)))) {
          textOverlaps.push([a.id, b.id]);
        }
      }
    }
    return {
      mode: window.__aliceDemo?.mode() ?? '',
      progress: window.__aliceDemo?.progress() ?? 0,
      stage: { top: stageBox.top, bottom: stageBox.bottom },
      lines: lines.map(({ id, text, opacity, y, bottom, textTop, textBottom }) => ({
        id,
        text,
        opacity,
        y,
        bottom,
        textTop,
        textBottom,
      })),
      paperOverlaps,
      textOverlaps,
    };
  });

const seekTo = async (page: Page, fraction: number) => {
  await page.evaluate((f) => {
    const beats = [...document.querySelectorAll<HTMLElement>('.demo__stage .demo-beat')];
    const index = beats.findIndex((beat) => beat.dataset.beat === 'deep-or-slow');
    window.__aliceDemo?.seek((index + f) / beats.length);
  }, fraction);
  await page.waitForFunction(() => window.__aliceDemo?.settled());
};

const expectVisibleCaptionsInsideStage = (sample: CaptionSample, context: string): void => {
  for (const line of sample.lines) {
    if (line.opacity <= 0.05) continue;
    expect(line.y, `${context}/${line.id} paper top`).toBeGreaterThanOrEqual(sample.stage.top - 1);
    expect(line.bottom, `${context}/${line.id} paper bottom`).toBeLessThanOrEqual(
      sample.stage.bottom + 1,
    );
    expect(line.textTop, `${context}/${line.id} text top`).toBeGreaterThanOrEqual(
      sample.stage.top - 1,
    );
    expect(line.textBottom, `${context}/${line.id} text bottom`).toBeLessThanOrEqual(
      sample.stage.bottom + 1,
    );
  }
};

test('deep-or-slow entry, hold, and exit keep the printed lines separate', async ({ browser }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    for (const locale of ['ja', 'en-simple']) {
      for (const mode of ['webgl', 'flat']) {
        const context = await browser.newContext({
          baseURL: test.info().project.use.baseURL,
          viewport,
          reducedMotion: 'no-preference',
        });
        const page = await context.newPage();
        if (mode === 'flat') {
          await page.addInitScript(() => {
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (
              this: HTMLCanvasElement,
              type,
              ...args
            ) {
              if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
              return original.call(this, type, ...args);
            } as HTMLCanvasElement['getContext'];
          });
        }
        try {
          await page.goto(locale === 'ja' ? '/demos/ja/rabbit-hole/' : '/demos/rabbit-hole/');
          await page.waitForFunction(
            () =>
              Boolean(window.__aliceDemo) &&
              document.querySelector('.demo')?.hasAttribute('data-attached'),
          );
          const expectedMode = mode;
          expect(await page.evaluate(() => window.__aliceDemo?.mode())).toBe(expectedMode);

          for (const fraction of [0.2, 0.4, 0.62, 0.65, 0.75, 0.8, 0.9]) {
            await seekTo(page, fraction);
            const sample = await sampleCaptions(page);
            expect(
              sample.paperOverlaps,
              `${mode}/${locale}/${viewport.width} paper overlap at ${fraction}`,
            ).toEqual([]);
            expect(
              sample.textOverlaps,
              `${mode}/${locale}/${viewport.width} text overlap at ${fraction}`,
            ).toEqual([]);
            expect(sample.lines.map((line) => line.text)).toHaveLength(3);
            if (fraction >= 0.65 && fraction <= 0.75) {
              expect(sample.lines.map((line) => line.opacity)).toEqual([1, 1, 1]);
              expect(sample.lines[0]?.y).toBeLessThan(sample.lines[1]?.y ?? 0);
              expect(sample.lines[1]?.y).toBeLessThan(sample.lines[2]?.y ?? 0);
            }
          }
        } finally {
          await context.close();
        }
      }
    }
  }
});

test('reduced motion lands on the readable three-line still', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demos/ja/rabbit-hole/');
  await page.waitForFunction(() => window.__aliceDemo?.reduced());
  await seekTo(page, 0.2);
  const sample = await sampleCaptions(page);
  expect(sample.textOverlaps).toEqual([]);
  expect(sample.lines.map((line) => line.opacity)).toEqual([1, 1, 1]);
});

test('flat-mode notice never covers the active caption text on short screens', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('alice-opening-seen', '1');
    localStorage.setItem('alice-demos:art', 'engraved');
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, ...args) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
      return original.call(this, type, ...args);
    } as HTMLCanvasElement['getContext'];
  });

  for (const sampleCase of [
    { viewport: { width: 390, height: 667 }, locale: 'ja' },
    { viewport: { width: 320, height: 568 }, locale: 'en-simple' },
  ]) {
    for (const reducedMotion of [false, true]) {
      await page.setViewportSize(sampleCase.viewport);
      await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
      await page.goto(
        sampleCase.locale === 'ja' ? '/demos/ja/rabbit-hole/' : '/demos/rabbit-hole/',
      );
      await page.waitForFunction(
        () =>
          Boolean(window.__aliceDemo) &&
          document.querySelector('.demo')?.hasAttribute('data-attached'),
      );
      await seekTo(page, 0.65);
      const collision = await page.evaluate(() => {
        const notes = [...document.querySelectorAll<HTMLElement>('.demo__note')].map((note) => ({
          note,
          box: note.getBoundingClientRect(),
        }));
        const flatNote = notes.find(({ note }) =>
          note.classList.contains('demo__note--flat-well'),
        )?.note;
        if (!flatNote) throw new Error('flat-mode note is missing');
        const intersects = (box: DOMRect, other: DOMRect) =>
          Math.min(box.right, other.right) > Math.max(box.left, other.left) &&
          Math.min(box.bottom, other.bottom) > Math.max(box.top, other.top);
        const lines = [
          ...document.querySelectorAll<HTMLElement>('.demo-beat[data-beat="deep-or-slow"] .line'),
        ];
        const overlapsCaption = lines.some((line) => {
          if (Number(getComputedStyle(line).opacity) <= 0.05) return false;
          const paper = line.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(line);
          const textBoxes = [...range.getClientRects()];
          return notes.some(
            ({ box }) =>
              intersects(box, paper) || textBoxes.some((textBox) => intersects(box, textBox)),
          );
        });
        const noticesOverlap = notes.some(({ box }, index) =>
          notes.slice(index + 1).some(({ box: other }) => intersects(box, other)),
        );
        return {
          overlapsCaption,
          noticesOverlap,
          color: getComputedStyle(flatNote).color,
          background: getComputedStyle(flatNote).backgroundColor,
        };
      });
      const context = `${sampleCase.locale}/${sampleCase.viewport.height}/reduced=${reducedMotion}`;
      expect(collision.overlapsCaption, context).toBe(false);
      expect(collision.noticesOverlap, context).toBe(false);
      expect(collision.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(collision.background).not.toBe('rgba(0, 0, 0, 0)');
    }
  }
});

test('short stages keep transformed paper and readable text inside the frame', async ({
  browser,
}) => {
  // 390x667 is a compact phone viewport; 320x568 is a separate stress case.
  // The root font scale is installed before app startup so the real fit observer
  // measures the enlarged text, rather than changing CSS after its fit pass.
  for (const viewport of [
    { width: 390, height: 667 },
    { width: 320, height: 568 },
  ]) {
    for (const locale of ['ja', 'en-simple']) {
      for (const mode of ['webgl', 'flat']) {
        const context = await browser.newContext({
          baseURL: test.info().project.use.baseURL,
          viewport,
          reducedMotion: 'no-preference',
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          const style = document.createElement('style');
          style.textContent = 'html { font-size: 125%; }';
          document.head.append(style);
        });
        if (mode === 'flat') {
          await page.addInitScript(() => {
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (
              this: HTMLCanvasElement,
              type,
              ...args
            ) {
              if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
              return original.call(this, type, ...args);
            } as HTMLCanvasElement['getContext'];
          });
        }
        try {
          await page.goto(locale === 'ja' ? '/demos/ja/rabbit-hole/' : '/demos/rabbit-hole/');
          await page.waitForFunction(
            () =>
              Boolean(window.__aliceDemo) &&
              document.querySelector('.demo')?.hasAttribute('data-attached'),
          );
          expect(await page.evaluate(() => window.__aliceDemo?.mode())).toBe(mode);

          for (const fraction of [0.04, 0.2, 0.4, 0.62, 0.65, 0.75, 0.8, 0.9]) {
            await seekTo(page, fraction);
            const sample = await sampleCaptions(page);
            expect(
              sample.paperOverlaps,
              `${mode}/${locale}/${viewport.width} paper overlap at ${fraction}`,
            ).toEqual([]);
            expect(
              sample.textOverlaps,
              `${mode}/${locale}/${viewport.width} text overlap at ${fraction}`,
            ).toEqual([]);
            expectVisibleCaptionsInsideStage(
              sample,
              `${mode}/${locale}/${viewport.width} at ${fraction}`,
            );
            expect(sample.lines.map((line) => line.text)).toHaveLength(3);
          }
        } finally {
          await context.close();
        }
      }
    }
  }
});

test('real forward and reverse wheel input keeps entry captions readable', async ({ page }) => {
  for (const sampleCase of [
    { viewport: { width: 390, height: 667 }, locale: 'ja' },
    { viewport: { width: 320, height: 568 }, locale: 'en-simple' },
  ]) {
    await page.setViewportSize(sampleCase.viewport);
    await page.goto(sampleCase.locale === 'ja' ? '/demos/ja/rabbit-hole/' : '/demos/rabbit-hole/');
    await page.waitForFunction(
      () =>
        Boolean(window.__aliceDemo) &&
        document.querySelector('.demo')?.hasAttribute('data-attached'),
    );
    const { index, count } = await page.evaluate(() => ({
      index: [...document.querySelectorAll<HTMLElement>('.demo-beat')].findIndex(
        (beat) => beat.dataset.beat === 'deep-or-slow',
      ),
      count: document.querySelectorAll('.demo-beat').length,
    }));
    const forward: CaptionSample[] = [];
    const backward: CaptionSample[] = [];
    const record = async (into: CaptionSample[]) => {
      const sample = await sampleCaptions(page);
      if ((await page.evaluate(() => window.__aliceDemo?.beat())) === index) {
        expect(sample.paperOverlaps).toEqual([]);
        expect(sample.textOverlaps).toEqual([]);
        expectVisibleCaptionsInsideStage(
          sample,
          `${sampleCase.locale}/${sampleCase.viewport.height}`,
        );
        into.push(sample);
      }
    };

    await page.mouse.move(Math.min(190, sampleCase.viewport.width / 2), 420);
    for (let step = 0; step < 100; step += 1) {
      await page.mouse.wheel(0, 50);
      await page.waitForTimeout(50);
      await record(forward);
      if (
        (await page.evaluate(() => window.__aliceDemo?.progress() ?? 0)) >=
        (index + 0.92) / count
      ) {
        break;
      }
    }
    expect(forward.length).toBeGreaterThan(3);

    for (let step = 0; step < 100; step += 1) {
      await page.mouse.wheel(0, -50);
      await page.waitForTimeout(50);
      await record(backward);
      if (
        (await page.evaluate(() => window.__aliceDemo?.progress() ?? 0)) <=
        (index + 0.03) / count
      ) {
        break;
      }
    }
    expect(backward.length).toBeGreaterThan(3);
  }
});
