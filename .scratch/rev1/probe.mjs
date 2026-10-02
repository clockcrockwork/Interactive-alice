// usage: node probe.mjs <port> <demo> <beatIndex:within>...  prints each active beat's line opacity/rect
import { chromium } from '@playwright/test';
const [port, demo, ...specs] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/demos/${demo}/`);
await page.waitForTimeout(600);
for (const spec of specs) {
  const [i, w] = spec.split(':').map(Number);
  await page.evaluate(([i, w]) => { const n = document.querySelectorAll('.demo__stage .demo-beat').length; window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ((i + w) / n)); }, [i, w]);
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    const b = document.querySelector('.demo__stage .demo-beat[data-active]');
    return { beat: window.__aliceDemo.beat(), settled: window.__aliceDemo.settled(), overrun: window.__aliceDemo.overrun(), lines: [...b.querySelectorAll('.line')].map((l) => { const r = l.getBoundingClientRect(); const cs = getComputedStyle(l); return { t: l.textContent.slice(0, 30), op: cs.opacity, vis: cs.visibility, tf: cs.transform, y: Math.round(r.top), h: Math.round(r.height) }; }) };
  });
  console.log(spec, JSON.stringify(out));
}
console.log('errors:', errors);
await browser.close();
