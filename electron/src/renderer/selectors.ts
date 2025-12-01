import type {
  FigureRecord,
  IdeaRecord,
  SprintRecord,
  StoryRecord,
  UpdateRecord,
} from '@shared/types';

import { state } from './state';

export function getIdeaFromDataset(el: HTMLElement): IdeaRecord | undefined {
  const ideaNumber = Number(el.dataset.idea);
  if (Number.isNaN(ideaNumber)) return undefined;
  return state.ideas.find((idea) => idea.idea_number === ideaNumber);
}

export function getStoryFromDataset(el: HTMLElement): StoryRecord | undefined {
  const ideaNumber = Number(el.dataset.idea);
  const storyNumber = Number(el.dataset.story);
  if (Number.isNaN(ideaNumber) || Number.isNaN(storyNumber)) return undefined;
  return state.stories.find(
    (story) => story.idea_number === ideaNumber && story.story_number === storyNumber
  );
}

export function getSprintFromDataset(el: HTMLElement): SprintRecord | undefined {
  const sprintId = el.dataset.sprint;
  if (!sprintId) return undefined;
  return state.sprints.find((sprint) => sprint.sprint_id === sprintId);
}

export function getUpdateFromDataset(el: HTMLElement): UpdateRecord | undefined {
  const sprintId = el.dataset.sprint;
  const ideaNumber = Number(el.dataset.idea);
  const storyNumber = Number(el.dataset.story);
  if (!sprintId || Number.isNaN(ideaNumber) || Number.isNaN(storyNumber)) return undefined;
  return state.updates.find(
    (update) =>
      update.sprint_id === sprintId &&
      update.idea_number === ideaNumber &&
      update.story_number === storyNumber
  );
}

export function getFigureFromDataset(el: HTMLElement): FigureRecord | undefined {
  const figureNumber = Number(el.dataset.figure);
  if (Number.isNaN(figureNumber)) return undefined;
  return state.figures.find((figure) => figure.figure_number === figureNumber);
}


