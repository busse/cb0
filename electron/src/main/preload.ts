import { contextBridge, ipcRenderer } from 'electron';
import type { Idea, Story, Sprint, Update } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Read operations
  readIdeas: () => ipcRenderer.invoke('read-ideas'),
  readStories: () => ipcRenderer.invoke('read-stories'),
  readSprints: () => ipcRenderer.invoke('read-sprints'),
  readUpdates: () => ipcRenderer.invoke('read-updates'),

  // Write operations
  writeIdea: (idea: Idea, content: string) => ipcRenderer.invoke('write-idea', idea, content),
  writeStory: (story: Story, content: string) => ipcRenderer.invoke('write-story', story, content),
  writeSprint: (sprint: Sprint, content: string) => ipcRenderer.invoke('write-sprint', sprint, content),
  writeUpdate: (update: Update, content: string) => ipcRenderer.invoke('write-update', update, content),

  // Delete operations
  deleteIdea: (ideaNumber: number) => ipcRenderer.invoke('delete-idea', ideaNumber),
  deleteStory: (ideaNumber: number, storyNumber: number) =>
    ipcRenderer.invoke('delete-story', ideaNumber, storyNumber),
  deleteSprint: (sprintId: string) => ipcRenderer.invoke('delete-sprint', sprintId),
  deleteUpdate: (sprintId: string, ideaNumber: number, storyNumber: number) =>
    ipcRenderer.invoke('delete-update', sprintId, ideaNumber, storyNumber),

  // Utility operations
  getNextIdeaNumber: () => ipcRenderer.invoke('get-next-idea-number'),
  getNextStoryNumber: (ideaNumber: number) => ipcRenderer.invoke('get-next-story-number', ideaNumber),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      readIdeas: () => Promise<{ success: boolean; data?: Idea[]; error?: string }>;
      readStories: () => Promise<{ success: boolean; data?: Story[]; error?: string }>;
      readSprints: () => Promise<{ success: boolean; data?: Sprint[]; error?: string }>;
      readUpdates: () => Promise<{ success: boolean; data?: Update[]; error?: string }>;
      writeIdea: (idea: Idea, content: string) => Promise<{ success: boolean; error?: string }>;
      writeStory: (story: Story, content: string) => Promise<{ success: boolean; error?: string }>;
      writeSprint: (sprint: Sprint, content: string) => Promise<{ success: boolean; error?: string }>;
      writeUpdate: (update: Update, content: string) => Promise<{ success: boolean; error?: string }>;
      deleteIdea: (ideaNumber: number) => Promise<{ success: boolean; error?: string }>;
      deleteStory: (ideaNumber: number, storyNumber: number) => Promise<{ success: boolean; error?: string }>;
      deleteSprint: (sprintId: string) => Promise<{ success: boolean; error?: string }>;
      deleteUpdate: (sprintId: string, ideaNumber: number, storyNumber: number) => Promise<{ success: boolean; error?: string }>;
      getNextIdeaNumber: () => Promise<{ success: boolean; data?: number; error?: string }>;
      getNextStoryNumber: (ideaNumber: number) => Promise<{ success: boolean; data?: number; error?: string }>;
    };
  }
}



