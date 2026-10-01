import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
await page.goto('http://localhost:4173/demos/mock-turtle/');
await page.locator('.demo__auto').click();
await page.waitForTimeout(300);
console.log(
  await page.evaluate(() => {
    const a = document.querySelector('.demo__auto');
    const n = document.querySelector('.demo__next');
    const cs = getComputedStyle(a);
    const cn = getComputedStyle(n);
    return {
      pressed: a.getAttribute('aria-pressed'),
      autoBg: cs.backgroundColor,
      autoColor: cs.color,
      nextBg: cn.backgroundImage.slice(0, 80),
      nextBorder: cn.borderTopColor,
      glass: getComputedStyle(document.documentElement).getPropertyValue('--demo-glass'),
    };
  }),
);
await browser.close();
