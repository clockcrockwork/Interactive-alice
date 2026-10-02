// usage: node act.mjs <port> <demo> <stepsJSON> [--mobile] [--reduced]
// steps: [{go:"cue:within"}, {click:"selector"}, {clickText:"label"}, {key:"Tab"}, {wait:ms}, {shot:"path"}, {eval:"js"}, {hover:[x,y]}, {down:"sel"}, {up:true}, {move:[x,y]}]
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
const mobile = args.includes('--mobile'); const reduced = args.includes('--reduced');
const [port, demo, stepsJson] = args.filter((a) => !a.startsWith('--'));
const steps = JSON.parse(stepsJson);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 780 } : { width: 1280, height: 760 }, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/demos/${demo}/`);
await page.waitForTimeout(500);
const settle = async () => { await page.waitForFunction(() => window.__aliceDemo?.settled(), null, { timeout: 5000 }).catch(() => {}); };
for (const step of steps) {
  if (step.go) {
    const [cue, w] = step.go.split(':'); const within = w === undefined ? 0.5 : Number(w);
    await page.evaluate(([cue, within]) => {
      const beats = [...document.querySelectorAll('.demo__stage .demo-beat')];
      const index = cue === 'end' ? beats.length - 1 : beats.findIndex((b) => b.dataset.cue === cue || b.dataset.beat === cue);
      if (index < 0) throw new Error(`no cue ${cue}`);
      window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ((index + within) / beats.length));
    }, [cue, within]);
    await settle(); await page.waitForTimeout(300);
  }
  if (step.click) { const r = await page.locator(step.click).first().click({ timeout: 3000, force: !!step.force }).then(() => 'ok').catch((e) => 'FAIL ' + e.message.split('\n')[0]); console.log('click', step.click, r); }
  if (step.clickText) { const r = await page.getByRole('button', { name: step.clickText }).first().click({ timeout: 3000 }).then(() => 'ok').catch((e) => 'FAIL ' + e.message.split('\n')[0]); console.log('clickText', step.clickText, r); }
  if (step.key) { await page.keyboard.press(step.key); }
  if (step.keydown) { await page.keyboard.down(step.keydown); }
  if (step.keyup) { await page.keyboard.up(step.keyup); }
  if (step.hover) { await page.mouse.move(step.hover[0], step.hover[1]); }
  if (step.down) { const b = await page.locator(step.down).first().boundingBox(); if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); } else console.log('down FAIL no box', step.down); }
  if (step.move) { await page.mouse.move(step.move[0], step.move[1], { steps: 8 }); }
  if (step.up) { await page.mouse.up(); }
  if (step.wait) { await page.waitForTimeout(step.wait); }
  if (step.eval) { console.log('eval', JSON.stringify(await page.evaluate(step.eval))); }
  if (step.focus) { console.log('focused', await page.evaluate(() => { const a = document.activeElement; return a ? a.tagName + '.' + a.className + ' "' + (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30)) + '"' : null; })); }
  if (step.shot) { await page.screenshot({ path: step.shot }); }
}
console.log('status:', await page.evaluate(() => document.querySelector('.demo__status')?.textContent));
console.log('state', await page.evaluate(() => JSON.stringify({ p: window.__aliceDemo?.progress(), beat: window.__aliceDemo?.beat() })));
console.log('errors:', errors);
await browser.close();
