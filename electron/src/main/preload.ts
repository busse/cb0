import { contextBridge, ipcRenderer } from 'electron';
import type { Idea, Story, Sprint, Update, Figure } from '../shared/types';
import type { IpcResult } from './ipc-factory';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Read operations
  readIdeas: () => ipcRenderer.invoke('read-ideas'),
  readStories: () => ipcRenderer.invoke('read-stories'),
  readSprints: () => ipcRenderer.invoke('read-sprints'),
  readUpdates: () => ipcRenderer.invoke('read-updates'),
  readFigures: () => ipcRenderer.invoke('read-figures'),

  // Write operations
  writeIdea: (idea: Idea, content: string) => ipcRenderer.invoke('write-idea', idea, content),
  writeStory: (story: Story, content: string) => ipcRenderer.invoke('write-story', story, content),
  writeSprint: (sprint: Sprint, content: string) => ipcRenderer.invoke('write-sprint', sprint, content),
  writeUpdate: (update: Update, content: string) => ipcRenderer.invoke('write-update', update, content),
  writeFigure: (figure: Figure, content: string) => ipcRenderer.invoke('write-figure', figure, content),

  // Delete operations
  deleteIdea: (ideaNumber: number) => ipcRenderer.invoke('delete-idea', ideaNumber),
  deleteStory: (storyNumber: number) => ipcRenderer.invoke('delete-story', storyNumber),
  deleteSprint: (sprintId: string) => ipcRenderer.invoke('delete-sprint', sprintId),
  deleteUpdate: (sprintId: string, ideaNumber: number, storyNumber: number) =>
    ipcRenderer.invoke('delete-update', sprintId, ideaNumber, storyNumber),
  deleteFigure: (figureNumber: number) => ipcRenderer.invoke('delete-figure', figureNumber),

  // Utility operations
  getNextIdeaNumber: () => ipcRenderer.invoke('get-next-idea-number'),
  getNextStoryNumber: () => ipcRenderer.invoke('get-next-story-number'),
  getNextFigureNumber: () => ipcRenderer.invoke('get-next-figure-number'),
  selectFigureImage: () => ipcRenderer.invoke('select-figure-image'),
  copyFigureImage: (sourcePath: string, figureNumber: number) =>
    ipcRenderer.invoke('copy-figure-image', sourcePath, figureNumber),
  resolveAssetPath: (assetPath: string) => ipcRenderer.invoke('resolve-asset-path', assetPath),
  getFigureImage: (assetPath: string) => ipcRenderer.invoke('get-figure-image', assetPath),
});

type FigureImageMetadata = {
  relativePath: string;
  absolutePath: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
};

type FigureSelection = {
  path?: string;
  canceled: boolean;
};

type ElectronAPI = {
  readIdeas: () => Promise<IpcResult<Idea[]>>;
  readStories: () => Promise<IpcResult<Story[]>>;
  readSprints: () => Promise<IpcResult<Sprint[]>>;
  readUpdates: () => Promise<IpcResult<Update[]>>;
  readFigures: () => Promise<IpcResult<Figure[]>>;
  writeIdea: (idea: Idea, content: string) => Promise<IpcResult<void>>;
  writeStory: (story: Story, content: string) => Promise<IpcResult<void>>;
  writeSprint: (sprint: Sprint, content: string) => Promise<IpcResult<void>>;
  writeUpdate: (update: Update, content: string) => Promise<IpcResult<void>>;
  writeFigure: (figure: Figure, content: string) => Promise<IpcResult<void>>;
  deleteIdea: (ideaNumber: number) => Promise<IpcResult<void>>;
  deleteStory: (storyNumber: number) => Promise<IpcResult<void>>;
  deleteSprint: (sprintId: string) => Promise<IpcResult<void>>;
  deleteUpdate: (sprintId: string, ideaNumber: number, storyNumber: number) => Promise<IpcResult<void>>;
  deleteFigure: (figureNumber: number) => Promise<IpcResult<void>>;
  getNextIdeaNumber: () => Promise<IpcResult<number>>;
  getNextStoryNumber: () => Promise<IpcResult<number>>;
  getNextFigureNumber: () => Promise<IpcResult<number>>;
  selectFigureImage: () => Promise<IpcResult<FigureSelection>>;
  copyFigureImage: (sourcePath: string, figureNumber: number) => Promise<IpcResult<FigureImageMetadata>>;
  resolveAssetPath: (assetPath: string) => Promise<IpcResult<{ absolutePath: string; fileUrl: string }>>;
  getFigureImage: (assetPath: string) => Promise<IpcResult<string>>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}



