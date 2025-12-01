import {
  deleteFigureRemote,
  deleteIdeaRemote,
  deleteSprintRemote,
  deleteStoryRemote,
  deleteUpdateRemote,
  fetchFigures,
  fetchIdeas,
  fetchSprints,
  fetchStories,
  fetchUpdates,
} from './api';
import { renderFigures, renderIdeas, renderSprints, renderStories, renderUpdates } from './components/lists';
import { showError, showToast } from './toast';

export async function deleteIdea(ideaNumber?: string): Promise<void> {
  if (!ideaNumber) return;
  const parsed = Number(ideaNumber);
  if (Number.isNaN(parsed)) return;
  if (!confirm(`Delete Idea i${ideaNumber}? This cannot be undone.`)) return;

  try {
    await deleteIdeaRemote(parsed);
    await fetchIdeas();
    renderIdeas();
    showToast('Idea deleted');
  } catch (error) {
    showError((error as Error).message);
  }
}

export async function deleteStory(storyNumber?: string): Promise<void> {
  if (!storyNumber) return;
  const story = Number(storyNumber);
  if (Number.isNaN(story)) return;
  if (!confirm(`Delete Story s${story}? This cannot be undone.`)) return;

  try {
    await deleteStoryRemote(story);
    await fetchStories();
    renderStories();
    showToast('Story deleted');
  } catch (error) {
    showError((error as Error).message);
  }
}

export async function deleteSprint(sprintId?: string): Promise<void> {
  if (!sprintId) return;
  if (!confirm(`Delete Sprint ${sprintId}? This cannot be undone.`)) return;

  try {
    await deleteSprintRemote(sprintId);
    await fetchSprints();
    renderSprints();
    showToast('Sprint deleted');
  } catch (error) {
    showError((error as Error).message);
  }
}

export async function deleteUpdate(sprintId?: string, ideaNumber?: string, storyNumber?: string): Promise<void> {
  if (!sprintId || !ideaNumber || !storyNumber) return;
  const idea = Number(ideaNumber);
  const story = Number(storyNumber);
  if (Number.isNaN(idea) || Number.isNaN(story)) return;

  if (!confirm(`Delete Update ${sprintId}.${idea}.${story}? This cannot be undone.`)) return;

  try {
    await deleteUpdateRemote(sprintId, idea, story);
    await fetchUpdates();
    renderUpdates();
    showToast('Update deleted');
  } catch (error) {
    showError((error as Error).message);
  }
}

export async function deleteFigure(figureNumber?: string): Promise<void> {
  if (!figureNumber) return;
  const parsed = Number(figureNumber);
  if (Number.isNaN(parsed)) return;

  if (!confirm(`Delete Figure ${figureNumber}? This cannot be undone.`)) return;

  try {
    await deleteFigureRemote(parsed);
    await fetchFigures();
    await renderFigures();
    showToast('Figure deleted');
  } catch (error) {
    showError((error as Error).message);
  }
}


