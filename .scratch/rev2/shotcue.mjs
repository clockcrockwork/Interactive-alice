// usage: SCR=<outdir> node shotcue.mjs <port> <demo-id> <name> cue[:within] ... [--mobile] [--reduced]
// Scrolls to a beat by its `cue` name (within = fraction inside the beat, default 0.5) and screenshots.
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const reduced = args.includes('--reduced');
const [port, demo, name, ...cues] = args.filter((a) => !a.startsWith('--'));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 780 } : { width: 1280, height: 760 },
  deviceScaleFactor: 1,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
  isMobile: mobile, hasTouch: mobile,
});
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/demos/${demo}/`);
await page.waitForTimeout(600);
for (const spec of cues) {
  const [cue, w] = spec.split(':');
  const within = w === undefined ? 0.5 : Number(w);
  await page.evaluate(([cue, within]) => {
    const beats = [...document.querySelectorAll('.demo__stage .demo-beat')];
    const index = cue === 'end' ? beats.length - 1 : beats.findIndex((b) => b.dataset.cue === cue);
    if (index < 0) throw new Error(`no cue ${cue}`);
    window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ((index + within) / beats.length));
  }, [cue, within]);
  await page.waitForTimeout(1400);
  const out = `${process.env.SCR}/${name}-${cue}_${within}${mobile ? '-m' : ''}${reduced ? '-r' : ''}.png`;
  await page.screenshot({ path: out });
  console.log(out, await page.evaluate(() => JSON.stringify({ p: window.__aliceDemo?.progress(), beat: window.__aliceDemo?.beat() })));
}
console.log('errors:', errors);
await browser.close();
