import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron CMS tests
 * Uses Playwright's Electron support to test the full Electron app
 */
export default defineConfig({
  testDir: './tests/playwright-mcp',
  testMatch: /test-.*\.ts$/,
  fullyParallel: false, // Electron apps should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run Electron tests sequentially
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron',
      // No browser-specific config needed for Electron
    },
  ],
  webServer: {
    command: 'npm run test:server',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

