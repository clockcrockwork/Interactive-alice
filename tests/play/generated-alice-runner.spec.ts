/** Prepared contracts; browser execution remains a separate checkpoint. */
import { expect, type Page, test } from '@playwright/test';
import { atCue, collectErrors, customProperty } from '../demo-helpers.ts';

const selector = 'svg[data-generated-rig="runner/alice"]';
const alice = '.cr__runner[data-kind="alice"]';
const scenes = ['pool-of-tears', 'caucus-race', 'mouse-tale'] as const;

async function setup(page: Page, variant: 'yellow' | 'blue' = 'yellow') {
  await page.addInitScript((colour) => {
    localStorage.setItem('alice-demos:art', 'engraved');
    localStorage.setItem('alice-demos:alice', colour);
  }, variant);
}

async function contactDistance(page: Page): Promise<number> {
  return page.evaluate(() => {
    const rig = document.querySelector<SVGSVGElement>('svg[data-generated-rig="runner/alice"]');
    const figure = rig?.querySelector<SVGGraphicsElement>('.cr__figure');
    const thimble = document.querySelector<SVGSVGElement>('.cr__carry .cr__thimble svg');
    const handMap = figure?.getScreenCTM();
    const propMap = thimble?.getScreenCTM();
    if (!rig || !handMap || !propMap) return Number.POSITIVE_INFINITY;
    const u = Number(rig.getAttribute('data-runner-hand-u'));
    const v = Number(rig.getAttribute('data-runner-hand-v'));
    const rim = Number(rig.getAttribute('data-runner-hand-rim-offset'));
    const palm = new DOMPoint(u, v + rim).matrixTransform(handMap);
    const bottom = new DOMPoint(40, 84).matrixTransform(propMap);
    return Math.hypot(palm.x / palm.w - bottom.x / bottom.w, palm.y / palm.w - bottom.y / bottom.w);
  });
}

for (const scene of scenes) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`yellow runner retains one moving body: ${scene}, ${motion}`, async ({ page }) => {
      const errors = collectErrors(page);
      await setup(page);
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto(`/demos/${scene}/`);
      const rig = page.locator(selector);
      await expect(rig).toHaveAttribute('data-rig-ready', '');
      await expect(rig.locator('.cr__figure')).toHaveCount(1);
      await expect(rig.locator('[data-rig-fallback]')).toHaveCSS('display', 'none');
      await expect(rig.locator('.cr__arm--hold')).toHaveCSS('display', 'none');
      const parent = page.locator(alice);
      for (const holding of [false, true, false]) {
        await parent.evaluate(
          (node, value) => node.toggleAttribute('data-holding', value),
          holding,
        );
        await expect(rig.locator('[data-runner-pose="rest"]')).toHaveCSS(
          'display',
          holding ? 'none' : 'inline',
        );
        await expect(rig.locator('[data-runner-pose="carry"]')).toHaveCSS(
          'display',
          holding ? 'inline' : 'none',
        );
      }
      await page.locator('.demo__motion').click();
      await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
      if (motion === 'reduce')
        await expect(rig.locator('.cr__figure')).toHaveCSS('animation-name', 'none');
      else await expect(rig.locator('.cr__figure')).toHaveCSS('animation-play-state', 'paused');
      expect(errors).toEqual([]);
    });
  }

  test(`blue runner keeps its original drawing and requests no yellow poses: ${scene}`, async ({
    page,
  }) => {
    await setup(page, 'blue');
    const requests: string[] = [];
    page.on('request', (request) => {
      if (/runner--alice~(?:rest|carry)/.test(request.url())) requests.push(request.url());
    });
    await page.goto(`/demos/${scene}/`);
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await expect(page.locator(selector)).toHaveCount(0);
    await expect(page.locator(`${alice} .cr__figure`)).toHaveCount(1);
    await expect(page.locator(`${alice} .cr__arm--hold`)).toHaveCount(1);
    expect(requests).toEqual([]);
  });
}

for (const motion of ['no-preference', 'reduce'] as const) {
  for (const scene of ['caucus-race', 'mouse-tale'] as const) {
    test(`late carry decode synchronizes paused ${scene} hand: ${motion}`, async ({ page }) => {
      await setup(page);
      await page.emulateMedia({ reducedMotion: motion });
      let release = (): void => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(/runner--alice~carry\.yellow\.generated.*\.webp/, async (route) => {
        await held;
        await route.continue();
      });
      try {
        await page.goto(`/demos/${scene}/`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
        if (scene === 'caucus-race') await atCue(page, 'bow', 0.9);
        const rig = page.locator(selector);
        await expect(page.locator(alice)).toHaveAttribute('data-holding', '');
        await page.locator('.demo__motion').click();
        await expect(page.locator('.demo')).toHaveAttribute('data-paused', '');
        await expect(rig).not.toHaveAttribute('data-rig-ready');
        await expect(rig.locator('[data-rig-generated]')).toHaveCSS('display', 'none');
        await expect.poll(() => customProperty(page, '.cr__carry', '--u')).toBeCloseTo(77, 1);
        await expect.poll(() => customProperty(page, '.cr__carry', '--v')).toBeCloseTo(84, 1);
        release();
        await expect(rig).toHaveAttribute('data-rig-ready', '');
        await expect(rig.locator('[data-runner-pose="carry"]')).toHaveCSS('display', 'inline');
        await expect(rig.locator('[data-runner-pose="rest"]')).toHaveCSS('display', 'none');
        await expect(rig.locator('.cr__arm--hold')).toHaveCSS('display', 'none');
        // Compare actual screen-space palm/rim contacts, including the paused
        // current bow and the reduced-motion static bow, not just base metadata.
        await expect.poll(() => contactDistance(page)).toBeLessThan(3);
      } finally {
        release();
      }
    });
  }
}

for (const motion of ['no-preference', 'reduce'] as const) {
  test(`generated palm keeps its thimble through the existing bow: ${motion}`, async ({ page }) => {
    await setup(page);
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto('/demos/caucus-race/');
    await expect(page.locator(selector)).toHaveAttribute('data-rig-ready', '');
    await atCue(page, 'bow', 0.9);
    await page.locator('.demo__motion').click();
    const figure = page.locator(`${selector} .cr__figure`);
    if (motion === 'no-preference') {
      for (const time of [600, 300, 1200]) {
        await figure.evaluate((node, position) => {
          const bow = node
            .getAnimations()
            .find(
              (animation) =>
                animation instanceof CSSAnimation && animation.animationName === 'cr-bow',
            );
          if (!bow) throw new Error('bow animation missing');
          bow.pause();
          bow.currentTime = position;
        }, time);
        await expect.poll(() => contactDistance(page)).toBeLessThan(3);
      }
    } else {
      await expect(figure).toHaveCSS('animation-name', 'none');
      await expect.poll(() => contactDistance(page)).toBeLessThan(3);
    }
  });
}

for (const failed of ['rest', 'carry']) {
  test(`failed ${failed} retains vector hand and original Mouse Tale contact`, async ({ page }) => {
    await setup(page);
    await page.route(new RegExp(`runner--alice~${failed}\\.yellow\\.generated.*\\.webp`), (route) =>
      route.abort(),
    );
    await page.goto('/demos/mouse-tale/');
    const rig = page.locator(selector);
    await expect(rig).toHaveAttribute('data-rig-failed', '');
    await expect(rig).not.toHaveAttribute('data-rig-ready');
    await expect(rig.locator('[data-rig-generated]')).toHaveCSS('display', 'none');
    await expect(rig.locator('[data-rig-fallback]')).not.toHaveCSS('display', 'none');
    await expect(rig.locator('.cr__arm--hold')).not.toHaveCSS('display', 'none');
    await expect(rig.locator('.cr__arm--hold')).toHaveCSS('opacity', '1');
    await expect.poll(() => customProperty(page, '.cr__carry', '--u')).toBe(77);
    await expect.poll(() => customProperty(page, '.cr__carry', '--v')).toBe(84);
  });
}

test('late decode after scene removal does not reposition the detached carry', async ({ page }) => {
  await setup(page);
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/runner--alice~carry\.yellow\.generated.*\.webp/, async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto('/demos/mouse-tale/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.demo')).toHaveAttribute('data-attached', '');
    await page.evaluate(() => {
      const rig = document.querySelector('svg[data-generated-rig="runner/alice"]');
      const carry = document.querySelector('.cr__carry');
      if (!rig || !carry) throw new Error('runner fixture missing');
      (
        window as unknown as {
          runnerRemoval: { rig: Element; carry: Element; style: string | null };
        }
      ).runnerRemoval = {
        rig,
        carry,
        style: carry.getAttribute('style'),
      };
      document.querySelector('.demo')?.remove();
    });
    release();
    await page.waitForFunction(() =>
      (window as unknown as { runnerRemoval: { rig: Element } }).runnerRemoval.rig.hasAttribute(
        'data-rig-ready',
      ),
    );
    expect(
      await page.evaluate(() => {
        const saved = (
          window as unknown as { runnerRemoval: { carry: Element; style: string | null } }
        ).runnerRemoval;
        return saved.carry.getAttribute('style') === saved.style;
      }),
    ).toBe(true);
  } finally {
    release();
  }
});
