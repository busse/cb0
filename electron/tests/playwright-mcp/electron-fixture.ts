/**
 * Custom Playwright fixture for Electron app testing
 */

import { test as base, _electron as electron, ElectronApplication } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

const REPO_ROOT = path.resolve(__dirname, '../../..');
// From electron/tests/playwright-mcp -> electron/out/main/main/index.js
const ELECTRON_MAIN_PATH = path.resolve(__dirname, '../../out/main/main/index.js');

type ElectronFixtures = {
  electronApp: ElectronApplication;
  page: Awaited<ReturnType<ElectronApplication['firstWindow']>>;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // Ensure the main process is built
    const mainExists = await fs.access(ELECTRON_MAIN_PATH).then(() => true).catch(() => false);
    if (!mainExists) {
      throw new Error(`Electron main process not built. Run 'npm run build:once' first.`);
    }

    // Wait for Vite dev server to be ready (webServer in config should start it)
    // Give it a moment to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch Electron app
    const electronApp = await electron.launch({
      args: [ELECTRON_MAIN_PATH],
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    await use(electronApp);

    // Cleanup
    await electronApp.close();
  },

  page: async ({ electronApp }, use) => {
    // Get all windows and find the app window (not DevTools)
    const windows = electronApp.windows();
    let appWindow = windows.find(w => !w.url().includes('devtools://'));
    
    // If no app window found yet, wait for it
    if (!appWindow) {
      // Wait for a new window that's not DevTools
      appWindow = await electronApp.waitForEvent('window', {
        predicate: (window) => !window.url().includes('devtools://'),
        timeout: 30000,
      });
    }
    
    // Wait for the app to load
    await appWindow.waitForLoadState('domcontentloaded', { timeout: 30000 });
    
    // Wait for container
    await appWindow.waitForSelector('.container', { timeout: 30000 });

    await use(appWindow);
  },
});

export { expect } from '@playwright/test';

