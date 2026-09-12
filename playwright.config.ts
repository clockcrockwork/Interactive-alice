import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// A sandbox may ship one Chromium build while this pinned Playwright version looks
// for another. Use an already-installed binary when there is one; on CI, where
// `playwright install` runs, none of these exist and Playwright resolves its own.
const candidates = [
  process.env.PW_CHROMIUM_PATH,
  '/opt/pw-browsers/chromium',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].filter((path): path is string => typeof path === 'string' && path.length > 0);
const executablePath = candidates.find((path) => existsSync(path));

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173/',
    launchOptions: executablePath ? { executablePath } : {},
    trace: 'retain-on-failure',
  },
  // All projects are always defined; which ones run is a CLI filter, so the scripts
  // work the same in cmd.exe as in a POSIX shell. Per pull request:
  // `npm run test:e2e` (desktop Chromium). At milestones: `npm run test:e2e:full`.
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-phone', use: { ...devices['Pixel 7'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // Serves the existing dist/. Build first: npm run build && npm run test:e2e.
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
