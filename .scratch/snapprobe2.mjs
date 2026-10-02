import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const wait of [0, 300, 1000]) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:4173/demos/mock-turtle/');
  await page.waitForSelector('.demo[data-motion="reduced"]');
  await page.waitForTimeout(wait);
  const n = await page.evaluate(() => document.querySelectorAll('.demo__stage .demo-beat').length);
  await page.evaluate((n) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * (3.5 / n)), n);
  const out = [];
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(250); out.push(await page.evaluate((n) => (window.__aliceDemo.progress() * n).toFixed(2), n)); }
  console.log('wait', wait, out.join(' '));
  await page.close();
}
await browser.close();
