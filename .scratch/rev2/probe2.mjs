// usage: node probe2.mjs <port> <demo> <cue[:within]> <jsExpr> [--mobile] [--reduced] [--shot path]
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
const mobile = args.includes('--mobile'); const reduced = args.includes('--reduced');
const shotIdx = args.indexOf('--shot'); const shot = shotIdx >= 0 ? args[shotIdx + 1] : undefined;
const pos = args.filter((a, i) => !a.startsWith('--') && (shotIdx < 0 || i !== shotIdx + 1));
const [port, demo, spec, expr] = pos;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 780 } : { width: 1280, height: 760 }, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/demos/${demo}/`);
await page.waitForTimeout(500);
for (const s of spec.split(',')) {
  const [cue, w] = s.split(':'); const within = w === undefined ? 0.5 : Number(w);
  await page.evaluate(([cue, within]) => {
    const beats = [...document.querySelectorAll('.demo__stage .demo-beat')];
    const index = cue === 'end' ? beats.length - 1 : beats.findIndex((b) => b.dataset.cue === cue || b.dataset.beat === cue);
    if (index < 0) throw new Error(`no cue ${cue}`);
    window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ((index + within) / beats.length));
  }, [cue, within]);
  await page.waitForFunction(() => window.__aliceDemo?.settled(), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}
const out = await page.evaluate(expr);
console.log(JSON.stringify(out));
console.log('state', await page.evaluate(() => JSON.stringify({ p: window.__aliceDemo?.progress(), beat: window.__aliceDemo?.beat(), settled: window.__aliceDemo?.settled(), overrun: window.__aliceDemo?.overrun() })));
if (shot) await page.screenshot({ path: shot });
console.log('errors:', errors);
await browser.close();
