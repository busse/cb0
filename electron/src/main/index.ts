import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import {
  readIdeas,
  readStories,
  readSprints,
  readUpdates,
  writeIdea,
  writeStory,
  writeSprint,
  writeUpdate,
  deleteIdea,
  deleteStory,
  deleteSprint,
  deleteUpdate,
  PATHS,
} from '../shared/file-utils';
import {
  validateIdea,
  validateStory,
  validateSprint,
  getNextIdeaNumber,
  getNextStoryNumber,
} from '../shared/validation';
import type { Idea, Story, Sprint, Update } from '../shared/types';

let mainWindow: BrowserWindow | null = null;

// Verify content directories exist on startup
function verifyContentDirectories() {
  const repoRoot = app.isPackaged
    ? path.resolve(process.resourcesPath, '..', '..')
    : path.resolve(__dirname, '../..');
  
  const contentDirs = ['_ideas', '_stories', '_sprints', '_updates'];
  for (const dir of contentDirs) {
    const dirPath = path.join(repoRoot, dir);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Content directory ${dirPath} does not exist`);
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

