import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/demos/mock-turtle/');
await page.waitForTimeout(500);
const n = await page.evaluate(() => document.querySelectorAll('.demo__stage .demo-beat').length);
await page.evaluate((n) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * (3.5 / n)), n);
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(250);
  console.log(i, await page.evaluate((n) => [(window.__aliceDemo.progress() * n).toFixed(2), window.scrollY], n));
}
await browser.close();
