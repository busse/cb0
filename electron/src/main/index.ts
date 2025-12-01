import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import { registerAllHandlers } from './handlers';
import { repoRoot } from './environment';
import { setMainWindow } from './window-manager';

let mainWindow: BrowserWindow | null = null;

// Verify content directories exist on startup
function verifyContentDirectories() {
  const contentDirs = ['_ideas', '_stories', '_sprints', '_updates', '_figures', path.join('assets', 'figures')];
  for (const dir of contentDirs) {
    const dirPath = path.join(repoRoot, dir);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        console.warn(`Unable to create content directory ${dirPath}: ${(error as Error).message}`);
      }
    }
  }
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  setMainWindow(mainWindow);

  // Load the renderer
  // Check if we're in development by looking for the Vite dev server or checking if renderer-dist doesn't exist
  const rendererDistPath = path.join(__dirname, '../../renderer-dist/index.html');
  const isDev = !app.isPackaged && !fs.existsSync(rendererDistPath);
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Only open DevTools if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(rendererDistPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    setMainWindow(null);
  });
}

app.whenReady().then(() => {
  verifyContentDirectories();
  registerAllHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

