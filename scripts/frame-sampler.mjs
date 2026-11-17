#!/usr/bin/env node
/**
 * Frame time per beat for one concept demo, the measurement behind the demos'
 * numbers in docs/performance-budget.md ("Frame time for the demos").
 *
 *   npm run build
 *   npm run perf:frames -- <demo> [--locale ja] [--art engraved|flat|paper]
 *                                 [--throttle 4] [--frames 24] [--reduced]
 *                                 [--base http://localhost:4173/] [--json]
 *
 * Chromium, forced onto SwiftShader (no GPU, so a machine with one measures the
 * same renderer as CI), at 1280×760. For every beat the page is landed half-way
 * into it through the shell's seam (`seek`), left to settle, and then a
 * `requestAnimationFrame` sampler inside the page records the gaps between the
 * frames it paints; the first few are dropped as the landing's own. Reported per
 * beat: the mean and the worst frame, in milliseconds. `--throttle n` slows the CPU
 * n times through the DevTools protocol, as a phone; `--art` picks the drawing as
 * the index's picker would. Serves `dist/` with `vite preview` when nothing answers
 * at `--base`. Nothing beyond what the repository already installs.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const root = join(import.meta.dirname, '..');

const parse = (argv) => {
  const options = {
    demo: '',
    locale: '',
    art: '',
    throttle: 1,
    frames: 24,
    reduced: false,
    base: 'http://localhost:4173/',
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      i += 1;
      return argv[i] ?? '';
    };
    if (arg === '--locale') options.locale = value();
    else if (arg === '--art') options.art = value();
    else if (arg === '--throttle') options.throttle = Number(value()) || 1;
    else if (arg === '--frames') options.frames = Math.max(6, Number(value()) || 24);
    else if (arg === '--base') options.base = value();
    else if (arg === '--reduced') options.reduced = true;
    else if (arg === '--json') options.json = true;
    else if (!arg.startsWith('--') && !options.demo) options.demo = arg;
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!options.demo) {
    throw new Error('name a demo: npm run perf:frames -- rabbit-hole');
  }
  if (options.art && !['engraved', 'flat', 'paper'].includes(options.art)) {
    throw new Error(`--art is engraved, flat or paper, not ${options.art}`);
  }
  return options;
};

const answers = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

/** Serves dist/ unless something already answers; returns a stop function. */
const serve = async (base) => {
  if (await answers(base)) {
    return () => undefined;
  }
  if (!existsSync(join(root, 'dist', 'index.html'))) {
    throw new Error('no dist/: run npm run build first');
  }
  const port = new URL(base).port || '4173';
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [vite, 'preview', '--port', port, '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
  });
  for (let tries = 0; tries < 100; tries += 1) {
    if (await answers(base)) {
      return () => server.kill();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  server.kill();
  throw new Error(`vite preview did not answer at ${base}`);
};

/** The same Chromium the browser tests use (playwright.config.ts), else Playwright's own. */
const executablePath = [process.env.PW_CHROMIUM_PATH, '/opt/pw-browsers/chromium'].find(
  (path) => typeof path === 'string' && path.length > 0 && existsSync(path),
);

const main = async () => {
  const options = parse(process.argv.slice(2));
  const stop = await serve(options.base);
  const browser = await chromium.launch({
    executablePath,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 760 },
      reducedMotion: options.reduced ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    if (options.art) {
      await page.addInitScript((art) => {
        try {
          localStorage.setItem('alice-demos:art', art);
        } catch {}
      }, options.art);
    }
    if (options.throttle > 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: options.throttle });
    }
    const path = `demos/${options.locale ? `${options.locale}/` : ''}${options.demo}/`;
    await page.goto(new URL(path, options.base).href);
    await page.waitForFunction(() =>
      document.querySelector('.demo')?.hasAttribute('data-attached'),
    );
    const beats = await page.evaluate(() =>
      [...document.querySelectorAll('.demo__stage .demo-beat')].map((beat, index) => ({
        index,
        cue: beat.getAttribute('data-cue') ?? '',
      })),
    );
    const mode = await page.evaluate(() => window.__aliceDemo?.mode() ?? '');
    const rows = [];
    for (const beat of beats) {
      await page.evaluate(
        ([at, count]) => window.__aliceDemo?.seek((at + 0.5) / count),
        [beat.index, beats.length],
      );
      await page
        .waitForFunction(() => window.__aliceDemo?.settled() ?? true, undefined, {
          timeout: 30_000,
        })
        .catch(() => undefined);
      const gaps = await page.evaluate(
        (frames) =>
          new Promise((resolve) => {
            const seen = [];
            let last = 0;
            const step = (now) => {
              if (last) {
                seen.push(now - last);
              }
              last = now;
              if (seen.length < frames + 3) {
                requestAnimationFrame(step);
              } else {
                resolve(seen.slice(3));
              }
            };
            requestAnimationFrame(step);
          }),
        options.frames,
      );
      const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
      rows.push({ ...beat, mean: Math.round(mean), worst: Math.round(Math.max(...gaps)) });
    }
    const result = {
      demo: options.demo,
      locale: options.locale || 'base',
      art: options.art || 'engraved',
      throttle: options.throttle,
      reduced: options.reduced,
      mode,
      viewport: '1280x760',
      renderer: 'Chromium, SwiftShader',
      beats: rows,
      worstBeatMean: Math.max(...rows.map((row) => row.mean)),
      meanOfBeats: Math.round(rows.reduce((sum, row) => sum + row.mean, 0) / rows.length),
    };
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(
      `${result.demo} (${result.locale}, ${result.art}${mode ? `, ${mode}` : ''}, ` +
        `throttle ${result.throttle}x${result.reduced ? ', reduced motion' : ''}) ` +
        `${result.viewport}, ${result.renderer}`,
    );
    console.log('beat  cue                 mean ms  worst ms');
    for (const row of rows) {
      console.log(
        `${String(row.index).padStart(4)}  ${row.cue.padEnd(18)} ${String(row.mean).padStart(8)}  ${String(row.worst).padStart(8)}`,
      );
    }
    console.log(
      `worst beat mean ${result.worstBeatMean} ms, mean of beats ${result.meanOfBeats} ms`,
    );
  } finally {
    await browser.close();
    stop();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
