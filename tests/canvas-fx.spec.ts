/**
 * Rabbit Hole's Canvas FX layer, and the per-shot renderer seam under it.
 *
 * Every assertion here is about behaviour rather than about an element existing,
 * because "there is a canvas in the markup" is compatible with a canvas that never
 * draws, draws at the wrong resolution, keeps drawing off screen, or never recovers
 * from a tap. Two techniques carry most of that weight:
 *
 *   - **the renderer's own report**, through `window.__alice.fx(scene)`: a monotonic
 *     count of frames it has painted, the backing-buffer and CSS sizes it is using,
 *     whether it holds a frame request of its own, and how much impulse is left.
 *     Frozen counters over a real wait are what proves suspension, as against
 *     inferring it from a lifecycle label that nothing checks;
 *   - **the rendered pixels**, hashed off the canvas itself. That is how the
 *     interaction and the reverse-scroll tests are written: the composition really
 *     changes when a visitor taps, and really returns to the pixel-for-pixel
 *     composition that progress alone describes.
 *
 * What is still not established here is whether the dust looks like dust. That is a
 * perceptual judgement made by looking at the running scene; see the PR's visual
 * evidence.
 */

import { expect, type Page, test } from '@playwright/test';
import {
  expectProgress,
  focusScene,
  geometryOf,
  holdAt,
  scrollBy,
  scrollToProgress,
  stateOf,
} from './drive.ts';
import { pageGraph } from './manifest.ts';

const SCENE = 'rabbit-hole';

const parts = pageGraph().filter(
  (page) => page.kind === 'part' && (page.scenes ?? []).includes(SCENE),
);

interface FxReport {
  shot: string;
  state: string;
  failed: boolean;
  detail: {
    buffer: { width: number; height: number };
    css: { width: number; height: number };
    dpr: number;
    draws: number;
    drawn: number;
    streak: number;
    impulse: number;
    looping: boolean;
  };
}

const fxOf = (page: Page): Promise<FxReport[]> =>
  page.evaluate(
    (scene) => (window.__alice?.fx(scene) ?? []) as unknown as FxReport[],
    SCENE,
  ) as Promise<FxReport[]>;

async function fxOne(page: Page): Promise<FxReport> {
  const reports = await fxOf(page);
  const first = reports[0];
  if (!first) {
    throw new Error(`${SCENE} reported no renderers; the FX seam is not wired`);
  }
  return first;
}

/**
 * The span the renderer's own shot occupies, read from the markup the build wrote.
 *
 * Never a literal: the mapping owns the shot list and the pacing formula owns the
 * ranges, so a test that pasted them would be the second list CLAUDE.md forbids and
 * would break the day a weight or a sentence changed.
 */
async function shotSpan(page: Page, shot: string) {
  return page.evaluate((id) => {
    const element = document.querySelector<HTMLElement>(
      `.scene[data-scene="rabbit-hole"] .shot[data-shot="${id}"]`,
    );
    if (!element) {
      throw new Error(`no shot ${id} in the markup`);
    }
    const start = Number(element.dataset.start);
    const end = Number(element.dataset.end);
    const overlap = Number(element.dataset.overlap ?? 0);
    return { start, end, overlap };
  }, shot);
}

/**
 * Installs `window.__dust()`, a cheap hash of what the canvas actually painted.
 *
 * Installed into the page rather than run across the bridge, because the interaction
 * tests have to sample it **once per animation frame while an impulse is decaying**.
 * A round trip per sample would take longer than the impulse lives, and asserting
 * once after a tap is a race: the tap only schedules the frame that draws it, so a
 * single reading can legitimately catch the canvas one frame before it changes.
 *
 * Sampled rather than compared byte for byte: a full buffer is megabytes, and every
 * mote covers dozens of pixels, so a stride far finer than one mote catches any
 * change a reader could see. The count of non-transparent samples comes back too, so
 * a test can tell "a different composition" from "nothing was drawn at all".
 */
async function withSignature(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__dust', {
      value: (): { hash: number; ink: number } => {
        const canvas = document.querySelector<HTMLCanvasElement>('.scene-rabbit-hole__dust');
        if (!canvas) {
          throw new Error('no FX canvas in the document');
        }
        const context = canvas.getContext('2d');
        if (!context || canvas.width === 0) {
          throw new Error('the FX canvas has no context or no buffer');
        }
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        let hash = 0x811c9dc5;
        let ink = 0;
        // Every 41st pixel, on the alpha and red channels: a prime stride, so the
        // sample cannot align with the row width and miss a column of the field.
        for (let at = 0; at < data.length; at += 4 * 41) {
          const alpha = data[at + 3] ?? 0;
          if (alpha > 0) {
            ink += 1;
          }
          hash = Math.imul(hash ^ alpha, 0x01000193) >>> 0;
          hash = Math.imul(hash ^ (data[at] ?? 0), 0x01000193) >>> 0;
        }
        return { hash, ink };
      },
    });
  });
}

interface Signature {
  hash: number;
  ink: number;
}

const canvasSignature = (page: Page): Promise<Signature> =>
  page.evaluate(() => (window as unknown as { __dust: () => Signature }).__dust());

/**
 * Watches one impulse out, frame by frame, from inside the page.
 *
 * Returns whether the pixels ever differed from the resting composition while the
 * impulse was alive, whether the renderer really held a frame request of its own to
 * animate it, and how many frames that took — so a test can tell a decay that ran
 * from one that was never observed at all.
 */
function watchImpulse(page: Page, resting: number) {
  return page.evaluate(async (restingHash) => {
    const dust = (window as unknown as { __dust: () => Signature }).__dust;
    const read = () =>
      window.__alice?.fx('rabbit-hole')[0]?.detail as
        | { impulse: number; looping: boolean }
        | undefined;
    let moved = false;
    let looped = false;
    let frames = 0;
    // A full-motion impulse lives 700 ms and a calm one 1100 ms, so this bound is
    // generously past either; the loop leaves as soon as the impulse is spent.
    while (frames < 150) {
      const detail = read();
      if (!detail || detail.impulse <= 0) {
        break;
      }
      looped ||= detail.looping;
      moved ||= dust().hash !== restingHash;
      frames += 1;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return { moved, looped, frames };
  }, resting);
}

/** Lets several animation frames pass, without asking for one on the page's behalf. */
const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);

for (const entry of parts) {
  const url = `${entry.url}?probe=1`;

  test.describe(`${entry.url} ${SCENE} FX`, () => {
    test('sizes its backing buffer from the CSS box and the capped DPR', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { start, end } = await shotSpan(page, (await mount(page)).shot);
      await holdAt(page, SCENE, (start + end) / 2);
      await settle(page);

      const { detail } = await fxOne(page);
      const device = await page.evaluate(() => devicePixelRatio);

      // The clamp is the policy, not the device's opinion: docs/performance-budget.md
      // §4 caps Canvas buffers rather than following DPR wherever it goes.
      expect(detail.dpr).toBe(Math.min(device, 2));
      // A CSS box the size of the stage, and a buffer that is that box in device
      // pixels. Asserting both is the point: one number could be right by accident.
      expect(detail.css.width).toBeGreaterThan(100);
      expect(detail.buffer.width).toBe(Math.round(detail.css.width * detail.dpr));
      expect(detail.buffer.height).toBe(Math.round(detail.css.height * detail.dpr));

      const painted = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('.scene-rabbit-hole__dust');
        const box = canvas?.getBoundingClientRect();
        return {
          attribute: { width: canvas?.width ?? 0, height: canvas?.height ?? 0 },
          box: { width: box?.width ?? 0, height: box?.height ?? 0 },
        };
      });
      expect(painted.attribute.width).toBe(detail.buffer.width);
      expect(painted.box.width).toBeCloseTo(detail.css.width, 0);
    });

    test('draws while its shot owns the frame, and stops when another does', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);

      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);
      const active = await fxOne(page);
      expect(active.state).toBe('active');
      expect(active.detail.drawn).toBeGreaterThan(20);
      expect(active.detail.looping, 'an idle renderer holds no frame request').toBe(false);
      const { ink } = await canvasSignature(page);
      expect(ink, 'the canvas has something on it').toBeGreaterThan(0);

      // A different shot of the same, still-active scene. Progress 1 is the last
      // shot's, and the renderer's own shot cannot reach it: the seam is per shot,
      // not per scene.
      await holdAt(page, SCENE, 1);
      await settle(page);
      const away = await fxOne(page);
      expect(away.state).toBe('suspended');
      expect(await stateOf(page, SCENE), 'the scene itself is still running').toBe('active');
      expect((await canvasSignature(page)).ink, 'a suspended renderer leaves nothing').toBe(0);

      const before = away.detail.draws;
      await settle(page, 600);
      expect((await fxOne(page)).detail.draws, 'no drawing while suspended').toBe(before);
    });

    test('stops entirely once the scene leaves the viewport', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);
      expect((await fxOne(page)).state).toBe('active');

      // Past the whole scene, so the stage really leaves the viewport and the
      // coordinator suspends the driver, exactly as a reader scrolling on would.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect.poll(() => stateOf(page, SCENE), { timeout: 5000 }).toBe('suspended');

      const at = (await fxOne(page)).detail;
      expect(at.looping).toBe(false);
      await settle(page, 600);
      const after = (await fxOne(page)).detail;
      expect(after.draws, 'an off-screen scene draws no FX frames').toBe(at.draws);
      expect((await fxOne(page)).state).toBe('suspended');
    });

    test('keeps drawing while two shots are render-active', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      if (own.overlap <= 0) {
        throw new Error(`${shot} declares no overlap; this test has nothing to cover`);
      }

      // Inside this shot's own handover tail: it is `outgoing`, the next shot is the
      // primary, and both are painting. The renderer must not treat losing the
      // primary role as leaving the screen.
      const tail = await page.evaluate((id) => {
        const shots = [
          ...document.querySelectorAll<HTMLElement>('.scene[data-scene="rabbit-hole"] .shot'),
        ];
        const index = shots.findIndex((element) => element.dataset.shot === id);
        const next = shots[index + 1];
        const self = shots[index];
        if (!self || !next) {
          throw new Error('no shot after the renderer’s own');
        }
        const end = Number(self.dataset.end);
        const stop =
          end +
          Number(self.dataset.overlap ?? 0) *
            (Number(next.dataset.end) - Number(next.dataset.start));
        return { end, stop };
      }, shot);

      await holdAt(page, SCENE, (tail.end + tail.stop) / 2);
      await settle(page);

      const during = await fxOne(page);
      const shots = await page.evaluate(
        (id) => window.__alice?.snapshot(id)[0]?.shots ?? [],
        SCENE,
      );
      expect(shots.length, 'two shots on screen').toBe(2);
      expect(shots).toContain(shot);
      expect(during.state).toBe('active');
      expect(during.detail.drawn).toBeGreaterThan(20);
      expect((await canvasSignature(page)).ink).toBeGreaterThan(0);

      // ...and the handover's own transform did not move the buffer. An outgoing
      // shot is scaled up as it leaves, so a buffer sized from the element's visual
      // rect would grow with `--handoff` and the field would be drawn into a space
      // a few per cent larger than the box it lands in.
      const settled = await fxOne(page);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);
      const middle = await fxOne(page);
      expect(during.detail.buffer, 'a handover is not a resize').toEqual(middle.detail.buffer);
      expect(settled.detail.css).toEqual(middle.detail.css);
    });

    test('a renderer that cannot start leaves the scene untouched', async ({ page }) => {
      await withSignature(page);
      // The one failure a Canvas layer really has: the context is refused. Injected
      // before the page's own script, so the renderer meets it at mount, where the
      // seam's guard is supposed to retire it and let the document carry on.
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function refuse(
          this: HTMLCanvasElement,
          ...args: unknown[]
        ) {
          // Only the scene's own layer; the tests' own reads are not what is broken.
          return this.className.includes('scene-rabbit-hole__dust')
            ? null
            : (original as unknown as (...rest: unknown[]) => unknown).apply(this, args);
        } as typeof HTMLCanvasElement.prototype.getContext;
      });
      await page.goto(url);
      await focusScene(page, SCENE);

      const report = await fxOne(page);
      expect(report.failed, 'the renderer retired itself').toBe(true);
      expect(
        await page.locator(`.scene[data-scene="${SCENE}"]`).getAttribute('data-fx'),
        'and said so on the scene',
      ).toBe('failed');

      // The whole of what a reader loses is the dust.
      const story = page.locator('.story');
      expect(await story.getAttribute('data-mode'), 'still a staged scene').toBe('scene');
      expect(await story.getAttribute('data-ready')).toBe('true');
      expect(await story.getAttribute('data-degraded'), 'not a degraded document').toBeNull();
      await scrollToProgress(page, SCENE, 0.5);
      await expectProgress(page, SCENE, 0.5);
      await expect(
        page.locator(`.scene[data-scene="${SCENE}"] .beat[data-state="active"] .line`).first(),
      ).toHaveText(/\S/);
      await scrollToProgress(page, SCENE, 1);
      await expectProgress(page, SCENE, 1);
    });

    test('reconstructs the same composition when scrolled back to a progress', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      const here = own.start + (own.end - own.start) * 0.35;
      const later = own.start + (own.end - own.start) * 0.8;

      await holdAt(page, SCENE, here);
      await settle(page);
      const first = await canvasSignature(page);

      await holdAt(page, SCENE, later);
      await settle(page);
      const moved = await canvasSignature(page);
      expect(moved.hash, 'a different progress is a different field').not.toBe(first.hash);

      await holdAt(page, SCENE, here);
      await settle(page);
      // Pixel for pixel, not "roughly the same". The field is a pure function of
      // progress, so coming back is not a rewind; it is the same computation again.
      expect((await canvasSignature(page)).hash).toBe(first.hash);
    });

    test('a tap stirs the dust and the dust settles back into the scroll state', async ({
      page,
    }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);

      const resting = await canvasSignature(page);
      expect((await fxOne(page)).detail.impulse).toBe(0);

      const box = await page.locator('.scene-rabbit-hole__dust').boundingBox();
      if (!box) {
        throw new Error('the FX canvas has no box to tap');
      }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.45);

      // Watched out frame by frame: the pixels really move, and the renderer really
      // drives its own frames to animate the recovery while the reader holds still.
      const stirred = await watchImpulse(page, resting.hash);
      expect(stirred.frames, 'the impulse lived for some frames').toBeGreaterThan(4);
      expect(stirred.moved, 'the tap changed what is on the canvas').toBe(true);
      expect(stirred.looped, 'the decay drives its own frames').toBe(true);

      // ...and then it is gone: no impulse, no frame request, and the canonical
      // composition back to the pixel. This is the recovery rule, observed rather
      // than asserted from the source.
      await expect.poll(async () => (await fxOne(page)).detail.impulse, { timeout: 5000 }).toBe(0);
      await expect
        .poll(async () => (await fxOne(page)).detail.looping, { timeout: 5000 })
        .toBe(false);
      expect((await canvasSignature(page)).hash).toBe(resting.hash);
    });

    test('scrolling still drives the scene after a tap', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      const middle = (own.start + own.end) / 2;

      await scrollToProgress(page, SCENE, middle);
      await expectProgress(page, SCENE, middle);

      const box = await page.locator('.scene-rabbit-hole__dust').boundingBox();
      if (!box) {
        throw new Error('the FX canvas has no box to tap');
      }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

      // Forwards, then backwards, both while the impulse is still alive: the
      // interaction is a decoration on top of progress and owns none of it.
      await scrollBy(page, SCENE, middle, own.end);
      await expectProgress(page, SCENE, own.end);
      await scrollBy(page, SCENE, own.end, own.start);
      await expectProgress(page, SCENE, own.start);

      await expect.poll(async () => (await fxOne(page)).detail.impulse, { timeout: 5000 }).toBe(0);
    });

    test('resizing across a shot boundary re-sizes the buffer and keeps the field', async ({
      page,
    }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      // Just inside the boundary this shot hands over at: the moment a stale buffer
      // or a stale CSS box would show as a stretched or cropped field.
      await holdAt(page, SCENE, own.end - (own.end - own.start) * 0.02);
      await settle(page);
      const before = (await fxOne(page)).detail;

      // Narrower than `--measure`, so the staged column itself changes width rather
      // than only the window around it: on a wide desktop the stage is a fixed
      // reading column, and resizing 1280 to 900 would move nothing the canvas sees.
      await page.setViewportSize({ width: 420, height: 620 });
      await settle(page, 400);

      const resized = await fxOne(page);
      const after = resized.detail;
      expect(after.css.width, 'the CSS box followed the viewport').not.toBeCloseTo(
        before.css.width,
        0,
      );
      expect(after.buffer.width).toBe(Math.round(after.css.width * after.dpr));
      expect(after.buffer.height).toBe(Math.round(after.css.height * after.dpr));
      expect(resized.state, 'still the shot that owns the frame').toBe('active');
      expect(after.drawn).toBeGreaterThan(20);
      expect((await canvasSignature(page)).ink, 'still painting after the resize').toBeGreaterThan(
        0,
      );
    });

    test('turning effects off leaves a complete, readable, scrollable scene', async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);
      expect((await canvasSignature(page)).ink).toBeGreaterThan(0);

      await page.evaluate((scene) => window.__alice?.setFlags({ effects: false }, scene), SCENE);
      await settle(page);

      const off = await fxOne(page);
      expect(off.state).toBe('suspended');
      expect(off.failed, 'switched off, not broken').toBe(false);
      expect((await canvasSignature(page)).ink, 'nothing left painted').toBe(0);

      const frozen = off.detail.draws;
      await settle(page, 500);
      expect((await fxOne(page)).detail.draws).toBe(frozen);

      // The scene is untouched by any of that: still the same shots, still readable,
      // and scroll still carries a reader from one end of it to the other.
      await page.evaluate((scene) => window.__alice?.releaseProgress(scene), SCENE);
      await scrollToProgress(page, SCENE, 0.5);
      await expectProgress(page, SCENE, 0.5);
      const mid = await page.evaluate((scene) => window.__alice?.snapshot(scene)[0], SCENE);
      expect(mid?.shot, 'a shot still owns the middle of the scene').toBeTruthy();
      expect(mid?.beat, 'a beat is still on screen').toBeTruthy();
      await expect(
        page.locator(`.scene[data-scene="${SCENE}"] .beat[data-state="active"] .line`).first(),
      ).toHaveText(/\S/);

      await scrollToProgress(page, SCENE, 1);
      await expectProgress(page, SCENE, 1);
    });
  });
}

/**
 * Puts the reader in front of the scene and returns which shot owns the renderer.
 *
 * Read from the renderer rather than named here, so this file holds no shot id of
 * its own and the FX layer can move to another shot without editing a test.
 */
async function mount(page: Page): Promise<{ shot: string }> {
  await focusScene(page, SCENE);
  const report = await fxOne(page);
  expect(report.failed, 'the renderer retired itself at mount').toBe(false);
  return { shot: report.shot };
}

test.describe('at a dense device pixel ratio', () => {
  test.use({ deviceScaleFactor: 3 });

  for (const entry of parts.slice(0, 1)) {
    test(`${entry.url} renders at the capped ratio, not the device's`, async ({ page }) => {
      await withSignature(page);
      await page.goto(`${entry.url}?probe=1`);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);

      const { detail } = await fxOne(page);
      expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
      expect(detail.dpr, 'capped at 2, per the budget').toBe(2);
      expect(detail.buffer.width).toBe(Math.round(detail.css.width * 2));
      expect((await canvasSignature(page)).ink).toBeGreaterThan(0);
    });
  }
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const entry of parts.slice(0, 1)) {
    const url = `${entry.url}?probe=1`;

    test(`${entry.url} draws a calmer field rather than no field`, async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);

      const calm = await fxOne(page);
      expect(calm.state, 'reduced motion is a different design, not an absent one').toBe('active');
      expect(calm.detail.drawn, 'there is still dust in the shaft').toBeGreaterThan(5);
      expect((await canvasSignature(page)).ink).toBeGreaterThan(0);

      // The comparison that makes this a real assertion: the same page, the same
      // progress, without the preference.
      const full = await withFullMotion(page, url, shot);
      expect(calm.detail.drawn, 'fewer motes than the full-motion field').toBeLessThan(full.drawn);
    });

    test(`${entry.url} never streaks, however fast the reader scrolls`, async ({ page }) => {
      await withSignature(page);
      await page.goto(url);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      const calm = await fastest(page, own.start, own.end);
      // Streaking is the vestibular part of this effect, and it is the part the
      // comfortable version removes outright. Sampled while the reader is actually
      // moving, because at rest even the full-motion field draws none.
      expect(calm, 'no streaks under reduced motion').toBe(0);
    });
  }
});

test.describe('at full motion', () => {
  for (const entry of parts.slice(0, 1)) {
    test(`${entry.url} streaks the dust while the reader is moving`, async ({ page }) => {
      await withSignature(page);
      await page.goto(`${entry.url}?probe=1`);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      expect(await fastest(page, own.start, own.end), 'streaks while scrolling').toBeGreaterThan(0);
    });
  }
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true });

  for (const entry of parts.slice(0, 1)) {
    test(`${entry.url} sizes and stirs correctly from a tap`, async ({ page }) => {
      await withSignature(page);
      await page.goto(`${entry.url}?probe=1`);
      const { shot } = await mount(page);
      const own = await shotSpan(page, shot);
      await holdAt(page, SCENE, (own.start + own.end) / 2);
      await settle(page);

      const { detail } = await fxOne(page);
      const box = await page.locator('.scene-rabbit-hole__dust').boundingBox();
      // The CSS box is the staged column, which is narrower than the window; what
      // matters is that the renderer is using the box the canvas actually occupies.
      expect(detail.css.width).toBeCloseTo(box?.width ?? 0, 0);
      expect(detail.css.width).toBeGreaterThan(300);
      expect(detail.buffer.width).toBe(Math.round(detail.css.width * detail.dpr));

      const resting = await canvasSignature(page);
      await page.touchscreen.tap(195, 340);
      const stirred = await watchImpulse(page, resting.hash);
      expect(stirred.moved, 'a tap works exactly like a click').toBe(true);

      await expect.poll(async () => (await fxOne(page)).detail.impulse, { timeout: 5000 }).toBe(0);
      expect((await canvasSignature(page)).hash).toBe(resting.hash);
    });
  }
});

/**
 * The longest streak the renderer drew while the reader crossed the shot.
 *
 * Sampled inside the page, one reading per animation frame, because a streak is a
 * function of *speed*: velocity decays to zero within a couple of hundred
 * milliseconds of the last scroll, so a reading taken after a round trip through the
 * test bridge would always find the field at rest and always report no streak —
 * which would pass the reduced-motion assertion for entirely the wrong reason.
 */
async function fastest(page: Page, from: number, to: number): Promise<number> {
  const { top, travel } = await geometryOf(page, SCENE);
  return page.evaluate(
    async ({ top, travel, from, to }) => {
      const read = (): number => {
        const detail = window.__alice?.fx('rabbit-hole')[0]?.detail as
          | { streak?: number }
          | undefined;
        return detail?.streak ?? 0;
      };
      let longest = 0;
      for (let step = 0; step <= 24; step += 1) {
        window.scrollTo(0, top + travel * (from + ((to - from) * step) / 24));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        longest = Math.max(longest, read());
      }
      return longest;
    },
    { top, travel, from, to },
  );
}

/** The same page and progress without the reduced-motion preference, for comparison. */
async function withFullMotion(page: Page, url: string, shot: string) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(url);
  await mount(page);
  const own = await shotSpan(page, shot);
  await holdAt(page, SCENE, (own.start + own.end) / 2);
  await settle(page);
  return (await fxOne(page)).detail;
}
