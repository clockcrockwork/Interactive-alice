// usage: node probe.mjs <port> <demo> <cue[:within]> <selector,selector...> [--mobile] [--reduced]
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
const mobile = args.includes('--mobile'); const reduced = args.includes('--reduced');
const [port, demo, spec, sels] = args.filter((a) => !a.startsWith('--'));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 780 } : { width: 1280, height: 760 }, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/demos/${demo}/`);
await page.waitForTimeout(500);
const [cue, w] = spec.split(':'); const within = w === undefined ? 0.5 : Number(w);
await page.evaluate(([cue, within]) => {
  const beats = [...document.querySelectorAll('.demo__stage .demo-beat')];
  const index = cue === 'end' ? beats.length - 1 : beats.findIndex((b) => b.dataset.cue === cue || b.dataset.beat === cue);
  if (index < 0) throw new Error(`no cue ${cue}`);
  window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ((index + within) / beats.length));
}, [cue, within]);
await page.waitForTimeout(1400);
const out = await page.evaluate((sels) => sels.split(',').map((s) => [...document.querySelectorAll(s)].map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { s, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), op: cs.opacity, vis: cs.visibility, disp: cs.display, text: (el.textContent || '').trim().slice(0, 40) }; })), sels);
console.log(JSON.stringify(out, null, 0));
console.log('errors:', errors);
await browser.close();
