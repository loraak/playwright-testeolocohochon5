const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000, // varias pruebas recorren el juego completo (página 1 -> 2 -> 3)
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: 1,
  workers: 3,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: 'https://userinyerface.com',
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 25_000,
    acceptDownloads: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
