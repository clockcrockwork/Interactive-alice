import type { Page } from '@playwright/test';

/** Opt-in observation only: never awaits or catches a ViewTransition promise. */
export async function observeTransitions(page: Page): Promise<void> {
  if (process.env.ALICE_TRANSITION_DIAGNOSTICS !== '1') return;
  page.on('console', (message) => {
    console.log(`[transition-console:${message.type()}] ${message.text()}`);
  });
  page.on('pageerror', (error) => console.log(`[transition-pageerror] ${error.message}`));
  page.on('response', (response) => {
    if (response.request().resourceType() === 'stylesheet') {
      console.log(`[transition-stylesheet] ${response.status()} ${response.url()}`);
    }
  });
  await page.addInitScript(() => {
    const record = (event: Event): void => {
      const rules: string[] = [];
      const visit = (list: CSSRuleList): void => {
        for (const rule of list) {
          if (rule.cssText.startsWith('@view-transition')) rules.push(rule.cssText);
          if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules);
        }
      };
      const sheets = [...document.styleSheets].map((sheet) => {
        try {
          visit(sheet.cssRules);
          return { href: sheet.href, disabled: sheet.disabled, readable: true };
        } catch {
          return { href: sheet.href, disabled: sheet.disabled, readable: false };
        }
      });
      console.log(
        '[transition-state] ' +
          JSON.stringify({
            event: event.type,
            time: performance.now(),
            url: location.href,
            readyState: document.readyState,
            reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
            transition: 'viewTransition' in event && !!event.viewTransition,
            sheets,
            rules,
          }),
      );
    };
    for (const name of ['pageswap', 'pagereveal', 'pageshow', 'pagehide', 'load']) {
      addEventListener(name, record);
    }
    document.addEventListener('DOMContentLoaded', record);
  });
}
