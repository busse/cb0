import { contextBridge, ipcRenderer } from 'electron';
import type { Idea, Story, Sprint, Update, Figure } from '../shared/types';

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
  deleteStory: (ideaNumber: number, storyNumber: number) =>
    ipcRenderer.invoke('delete-story', ideaNumber, storyNumber),
  deleteSprint: (sprintId: string) => ipcRenderer.invoke('delete-sprint', sprintId),
  deleteUpdate: (sprintId: string, ideaNumber: number, storyNumber: number) =>
    ipcRenderer.invoke('delete-update', sprintId, ideaNumber, storyNumber),
  deleteFigure: (figureNumber: number) => ipcRenderer.invoke('delete-figure', figureNumber),

  // Utility operations
  getNextIdeaNumber: () => ipcRenderer.invoke('get-next-idea-number'),
  getNextStoryNumber: (ideaNumber: number) => ipcRenderer.invoke('get-next-story-number', ideaNumber),
  getNextFigureNumber: () => ipcRenderer.invoke('get-next-figure-number'),
  selectFigureImage: () => ipcRenderer.invoke('select-figure-image'),
  copyFigureImage: (sourcePath: string, figureNumber: number) =>
    ipcRenderer.invoke('copy-figure-image', sourcePath, figureNumber),
  resolveAssetPath: (assetPath: string) => ipcRenderer.invoke('resolve-asset-path', assetPath),
  getFigureImage: (assetPath: string) => ipcRenderer.invoke('get-figure-image', assetPath),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      readIdeas: () => Promise<{ success: boolean; data?: Idea[]; error?: string }>;
      readStories: () => Promise<{ success: boolean; data?: Story[]; error?: string }>;
      readSprints: () => Promise<{ success: boolean; data?: Sprint[]; error?: string }>;
      readUpdates: () => Promise<{ success: boolean; data?: Update[]; error?: string }>;
      readFigures: () => Promise<{ success: boolean; data?: Figure[]; error?: string }>;
      writeIdea: (idea: Idea, content: string) => Promise<{ success: boolean; error?: string }>;
      writeStory: (story: Story, content: string) => Promise<{ success: boolean; error?: string }>;
      writeSprint: (sprint: Sprint, content: string) => Promise<{ success: boolean; error?: string }>;
      writeUpdate: (update: Update, content: string) => Promise<{ success: boolean; error?: string }>;
      writeFigure: (figure: Figure, content: string) => Promise<{ success: boolean; error?: string }>;
      deleteIdea: (ideaNumber: number) => Promise<{ success: boolean; error?: string }>;
      deleteStory: (ideaNumber: number, storyNumber: number) => Promise<{ success: boolean; error?: string }>;
      deleteSprint: (sprintId: string) => Promise<{ success: boolean; error?: string }>;
      deleteUpdate: (sprintId: string, ideaNumber: number, storyNumber: number) => Promise<{ success: boolean; error?: string }>;
      deleteFigure: (figureNumber: number) => Promise<{ success: boolean; error?: string }>;
      getNextIdeaNumber: () => Promise<{ success: boolean; data?: number; error?: string }>;
      getNextStoryNumber: (ideaNumber: number) => Promise<{ success: boolean; data?: number; error?: string }>;
      getNextFigureNumber: () => Promise<{ success: boolean; data?: number; error?: string }>;
      selectFigureImage: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
      copyFigureImage: (
        sourcePath: string,
        figureNumber: number
      ) => Promise<{
        success: boolean;
        data?: {
          relativePath: string;
          absolutePath: string;
          fileType: string;
          fileSize: string;
          fileUrl: string;
        };
        error?: string;
      }>;
      resolveAssetPath: (
        assetPath: string
      ) => Promise<{
        success: boolean;
        data?: { absolutePath: string; fileUrl: string };
        error?: string;
      }>;
      getFigureImage: (
        assetPath: string
      ) => Promise<{
        success: boolean;
        data?: string;
        error?: string;
      }>;
    };
  }
}



