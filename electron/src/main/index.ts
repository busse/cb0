import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { pathToFileURL } from 'url';
import {
  readIdeas,
  readStories,
  readSprints,
  readUpdates,
  readFigures,
  writeIdea,
  writeStory,
  writeSprint,
  writeUpdate,
  writeFigure,
  deleteIdea,
  deleteStory,
  deleteSprint,
  deleteUpdate,
  deleteFigure,
  copyImageFile,
  PATHS,
} from '../shared/file-utils';
import {
  validateIdea,
  validateStory,
  validateSprint,
  validateFigure,
  getNextIdeaNumber,
  getNextStoryNumber,
  getNextFigureNumber,
} from '../shared/validation';
import type { Idea, Story, Sprint, Update, Figure } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
const repoRoot = app.isPackaged
  ? path.resolve(process.resourcesPath, '..', '..')
  : path.resolve(__dirname, '../..');

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

  // Load the renderer
  // Check if we're in development by looking for the Vite dev server or checking if renderer-dist doesn't exist
  const rendererDistPath = path.join(__dirname, '../../renderer-dist/index.html');
  const isDev = !app.isPackaged && !require('fs').existsSync(rendererDistPath);
  
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
  });
}

app.whenReady().then(() => {
  verifyContentDirectories();
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

// IPC Handlers

// Read operations
ipcMain.handle('read-ideas', async () => {
  try {
    return { success: true, data: await readIdeas() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-stories', async () => {
  try {
    return { success: true, data: await readStories() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-sprints', async () => {
  try {
    return { success: true, data: await readSprints() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-updates', async () => {
  try {
    return { success: true, data: await readUpdates() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-figures', async () => {
  try {
    return { success: true, data: await readFigures() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Write operations
ipcMain.handle('write-idea', async (_event, idea: Idea, content: string) => {
  try {
    const existingIdeas = await readIdeas();
    // Check if this idea already exists (editing vs creating)
    // We need to check if the file exists to determine if we're editing
    const ideaFilePath = path.join(PATHS.ideas, `${idea.idea_number}.md`);
    const isEditing = await fsPromises.access(ideaFilePath).then(() => true).catch(() => false);
    const errors = validateIdea(idea, existingIdeas, isEditing ? idea.idea_number : undefined);
    if (errors.length > 0) {
      return { success: false, error: errors.join(', ') };
    }
    await writeIdea(idea, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('write-story', async (_event, story: Story, content: string) => {
  try {
    const existingStories = await readStories();
    const existingIdeas = await readIdeas();
    // Check if this story already exists (editing vs creating)
    const existingStory = existingStories.find(
      (s) => s.idea_number === story.idea_number && s.story_number === story.story_number
    );
    const errors = validateStory(
      story,
      existingStories,
      existingIdeas,
      existingStory ? story.idea_number : undefined,
      existingStory ? story.story_number : undefined
    );
    if (errors.length > 0) {
      return { success: false, error: errors.join(', ') };
    }
    await writeStory(story, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('write-sprint', async (_event, sprint: Sprint, content: string) => {
  try {
    const existingSprints = await readSprints();
    // Check if this sprint already exists (editing vs creating)
    const existingSprint = existingSprints.find((s) => s.sprint_id === sprint.sprint_id);
    const errors = validateSprint(sprint, existingSprints, existingSprint ? sprint.sprint_id : undefined);
    if (errors.length > 0) {
      return { success: false, error: errors.join(', ') };
    }
    await writeSprint(sprint, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('write-update', async (_event, update: Update, content: string) => {
  try {
    await writeUpdate(update, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('write-figure', async (_event, figure: Figure, content: string) => {
  try {
    const [existingFigures, existingIdeas, existingStories] = await Promise.all([
      readFigures(),
      readIdeas(),
      readStories(),
    ]);
    const figureFilePath = path.join(PATHS.figures, `${figure.figure_number}.md`);
    const isEditing = await fsPromises
      .access(figureFilePath)
      .then(() => true)
      .catch(() => false);
    const errors = validateFigure(
      figure,
      existingFigures,
      existingIdeas,
      existingStories,
      isEditing ? figure.figure_number : undefined
    );
    if (errors.length > 0) {
      return { success: false, error: errors.join(', ') };
    }
    await writeFigure(figure, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Delete operations
ipcMain.handle('delete-idea', async (_event, ideaNumber: number) => {
  try {
    await deleteIdea(ideaNumber);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('delete-story', async (_event, ideaNumber: number, storyNumber: number) => {
  try {
    await deleteStory(ideaNumber, storyNumber);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('delete-sprint', async (_event, sprintId: string) => {
  try {
    await deleteSprint(sprintId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('delete-update', async (
  _event,
  sprintId: string,
  ideaNumber: number,
  storyNumber: number
) => {
  try {
    await deleteUpdate(sprintId, ideaNumber, storyNumber);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('delete-figure', async (_event, figureNumber: number) => {
  try {
    await deleteFigure(figureNumber);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Utility operations
ipcMain.handle('get-next-idea-number', async () => {
  try {
    const existingIdeas = await readIdeas();
    return { success: true, data: getNextIdeaNumber(existingIdeas) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-next-story-number', async (_event, ideaNumber: number) => {
  try {
    const existingStories = await readStories();
    return { success: true, data: getNextStoryNumber(ideaNumber, existingStories) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-next-figure-number', async () => {
  try {
    const existingFigures = await readFigures();
    return { success: true, data: getNextFigureNumber(existingFigures) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('select-figure-image', async () => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow;
  if (!window) {
    return { success: false, error: 'No active window available' };
  }

  const result = await dialog.showOpenDialog(window, {
    title: 'Select Figure Image',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePaths.length) {
    return { success: false, canceled: true };
  }

  return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('copy-figure-image', async (_event, sourcePath: string, figureNumber: number) => {
  try {
    const result = await copyImageFile(sourcePath, figureNumber);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('resolve-asset-path', async (_event, assetPath: string) => {
  try {
    const resolved = resolveAssetPath(assetPath);
    return { success: true, data: resolved };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-figure-image', async (_event, assetPath: string) => {
  try {
    const { absolutePath } = resolveAssetPath(assetPath);
    const buffer = await fsPromises.readFile(absolutePath);
    const mimeType = getMimeType(absolutePath);
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { success: true, data: dataUrl };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

function resolveAssetPath(assetPath: string): { absolutePath: string; fileUrl: string } {
  if (!assetPath) {
    throw new Error('No path provided');
  }

  if (/^(https?:|file:|data:)/i.test(assetPath)) {
    return { absolutePath: assetPath, fileUrl: assetPath };
  }

  const sanitized = assetPath.replace(/^\/+/, '');
  const absolutePath = path.isAbsolute(assetPath) ? assetPath : path.join(repoRoot, sanitized);
  const fileUrl = pathToFileURL(absolutePath).href;
  return { absolutePath, fileUrl };
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

