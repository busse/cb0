import type { Figure, Idea, Note, Sprint, Story, Update } from '@shared/types';

import { state } from './state';

export type FigureImageMetadata = {
  relativePath: string;
  absolutePath: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
};

export type FigureSelectionResult = {
  path?: string;
  canceled: boolean;
};

const figureImageCache = new Map<string, string>();

export async function fetchIdeas(): Promise<void> {
  const result = await window.electronAPI.readIdeas();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load ideas');
  }
  state.ideas = result.data;
}

export async function fetchStories(): Promise<void> {
  const result = await window.electronAPI.readStories();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load stories');
  }
  state.stories = result.data;
}

export async function fetchSprints(): Promise<void> {
  const result = await window.electronAPI.readSprints();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load sprints');
  }
  state.sprints = result.data;
}

export async function fetchUpdates(): Promise<void> {
  const result = await window.electronAPI.readUpdates();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load updates');
  }
  state.updates = result.data;
}

export async function fetchFigures(): Promise<void> {
  const result = await window.electronAPI.readFigures();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load figures');
  }
  state.figures = result.data;
}

export async function fetchNotes(): Promise<void> {
  const result = await window.electronAPI.readNotes();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load notes');
  }
  state.notes = result.data;
}

export async function ensureIdeas(): Promise<void> {
  if (!state.ideas.length) {
    await fetchIdeas();
  }
}

export async function ensureStories(): Promise<void> {
  if (!state.stories.length) {
    await fetchStories();
  }
}

export async function ensureSprints(): Promise<void> {
  if (!state.sprints.length) {
    await fetchSprints();
  }
}

export async function ensureFigures(): Promise<void> {
  if (!state.figures.length) {
    await fetchFigures();
  }
}

export async function ensureNotes(): Promise<void> {
  if (!state.notes.length) {
    await fetchNotes();
  }
}

export async function ensureUpdates(): Promise<void> {
  if (!state.updates.length) {
    await fetchUpdates();
  }
}

export async function saveIdea(idea: Idea, content: string): Promise<void> {
  const result = await window.electronAPI.writeIdea(idea, content);
  if (!result.success) {
    throw new Error(result.error || 'Unable to save idea');
  }
}

export async function saveStory(story: Story, content: string): Promise<void> {
  const result = await window.electronAPI.writeStory(story, content);
  if (!result.success) {
    throw new Error(result.error || 'Unable to save story');
  }
}

export async function saveSprint(sprint: Sprint, content: string): Promise<void> {
  const result = await window.electronAPI.writeSprint(sprint, content);
  if (!result.success) {
    throw new Error(result.error || 'Unable to save sprint');
  }
}

export async function saveUpdate(update: Update, content: string): Promise<void> {
  const result = await window.electronAPI.writeUpdate(update, content);
  if (!result.success) {
    throw new Error(result.error || 'Unable to save update');
  }
}

export async function saveFigure(figure: Figure, content: string): Promise<void> {
  const result = await window.electronAPI.writeFigure(figure, content);
  if (!result.success) {
    throw new Error(result.error || 'Unable to save figure');
  }
}

export async function saveNote(note: Note & { filename?: string }, content: string): Promise<void> {
  const result = await window.electronAPI.writeNote(note, content);
  if (!result.success) {
    throw new Error(result.error || 'Unable to save note');
  }
}

export async function deleteIdeaRemote(ideaNumber: number): Promise<void> {
  const result = await window.electronAPI.deleteIdea(ideaNumber);
  if (!result.success) {
    throw new Error(result.error || 'Unable to delete idea');
  }
}

export async function deleteStoryRemote(storyNumber: number): Promise<void> {
  const result = await window.electronAPI.deleteStory(storyNumber);
  if (!result.success) {
    throw new Error(result.error || 'Unable to delete story');
  }
}

export async function deleteSprintRemote(sprintId: string): Promise<void> {
  const result = await window.electronAPI.deleteSprint(sprintId);
  if (!result.success) {
    throw new Error(result.error || 'Unable to delete sprint');
  }
}

export async function deleteUpdateRemote(sprintId: string, ideaNumber: number, storyNumber: number): Promise<void> {
  const result = await window.electronAPI.deleteUpdate(sprintId, ideaNumber, storyNumber);
  if (!result.success) {
    throw new Error(result.error || 'Unable to delete update');
  }
}

export async function deleteFigureRemote(figureNumber: number): Promise<void> {
  const result = await window.electronAPI.deleteFigure(figureNumber);
  if (!result.success) {
    throw new Error(result.error || 'Unable to delete figure');
  }
}

export async function deleteNoteRemote(filename: string): Promise<void> {
  const result = await window.electronAPI.deleteNote(filename);
  if (!result.success) {
    throw new Error(result.error || 'Unable to delete note');
  }
}

export async function getNextIdeaNumber(): Promise<number> {
  const result = await window.electronAPI.getNextIdeaNumber();
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'Unable to determine next idea number');
  }
  return result.data;
}

export async function getNextStoryNumber(): Promise<number> {
  const result = await window.electronAPI.getNextStoryNumber();
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'Unable to determine next story number');
  }
  return result.data;
}

export async function getNextFigureNumber(): Promise<number> {
  const result = await window.electronAPI.getNextFigureNumber();
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'Unable to determine next figure number');
  }
  return result.data;
}

export async function selectFigureImage(): Promise<FigureSelectionResult> {
  const result = await window.electronAPI.selectFigureImage();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Unable to select image');
  }
  return result.data;
}

export async function copyFigureImage(sourcePath: string, figureNumber: number): Promise<FigureImageMetadata> {
  const result = await window.electronAPI.copyFigureImage(sourcePath, figureNumber);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Unable to copy image');
  }
  return result.data;
}

export async function resolveAssetUrl(assetPath: string): Promise<string | undefined> {
  if (!assetPath) return undefined;
  if (figureImageCache.has(assetPath)) {
    return figureImageCache.get(assetPath);
  }
  if (/^(https?:|file:|data:)/i.test(assetPath)) {
    figureImageCache.set(assetPath, assetPath);
    return assetPath;
  }
  const result = await window.electronAPI.getFigureImage(assetPath);
  if (result.success && result.data) {
    figureImageCache.set(assetPath, result.data);
    return result.data;
  }
  return undefined;
}

export function clearFigureCache(): void {
  figureImageCache.clear();
}


