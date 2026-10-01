import { chromium } from '@playwright/test';

const out = process.env.SCR;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const mobile of [false, true]) {
  const page = await (
    await browser.newContext({
      viewport: mobile ? { width: 390, height: 740 } : { width: 1280, height: 760 },
      deviceScaleFactor: 1,
    })
  ).newPage();
  await page.goto('http://localhost:4173/demos/mock-turtle/');
  await page.locator('.demo__auto').click();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}/auto-${mobile ? 'phone' : 'desktop'}.png` });
  await page.close();
}
await browser.close();
