import { BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import * as fsPromises from 'fs/promises';
import { pathToFileURL } from 'url';

import { handleAsync, handleAsyncWithArgs } from '../ipc-factory';
import { repoRoot } from '../environment';
import { getMainWindow } from '../window-manager';
import {
  copyImageFile,
  readFigures,
  readIdeas,
  readStories,
} from '../../shared/file-utils';
import {
  getNextFigureNumber,
  getNextIdeaNumber,
  getNextStoryNumber,
} from '../../shared/validation';

type FigureSelectionResult = { path?: string; canceled: boolean };

export function registerUtilityHandlers(): void {
  handleAsync('get-next-idea-number', async () => {
    const existingIdeas = await readIdeas();
    return getNextIdeaNumber(existingIdeas);
  });

  handleAsyncWithArgs('get-next-story-number', async (ideaNumber: number) => {
    const existingStories = await readStories();
    return getNextStoryNumber(ideaNumber, existingStories);
  });

  handleAsync('get-next-figure-number', async () => {
    const existingFigures = await readFigures();
    return getNextFigureNumber(existingFigures);
  });

  handleAsync<FigureSelectionResult>('select-figure-image', async () => {
    const window = BrowserWindow.getFocusedWindow() ?? getMainWindow();
    if (!window) {
      throw new Error('No active window available');
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
      return { canceled: true };
    }

    return { path: result.filePaths[0], canceled: false };
  });

  handleAsyncWithArgs('copy-figure-image', copyImageFile);
  handleAsyncWithArgs('resolve-asset-path', async (assetPath: string) => resolveAssetPath(assetPath));

  handleAsyncWithArgs('get-figure-image', async (assetPath: string) => {
    const { absolutePath } = resolveAssetPath(assetPath);
    const buffer = await fsPromises.readFile(absolutePath);
    const mimeType = getMimeType(absolutePath);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  });
}

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


