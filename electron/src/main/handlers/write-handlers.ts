import * as path from 'path';
import * as fsPromises from 'fs/promises';

import { handleAsyncWithArgs } from '../ipc-factory';
import {
  PATHS,
  readFigures,
  readIdeas,
  readSprints,
  readStories,
  writeFigure,
  writeIdea,
  writeSprint,
  writeStory,
  writeUpdate,
} from '../../shared/file-utils';
import {
  validateFigure,
  validateIdea,
  validateSprint,
  validateStory,
} from '../../shared/validation';
import type { Figure, Idea, Sprint, Story, Update } from '../../shared/types';

export function registerWriteHandlers(): void {
  handleAsyncWithArgs('write-idea', async (idea: Idea, content: string) => {
    const existingIdeas = await readIdeas();
    const ideaFilePath = path.join(PATHS.ideas, `${idea.idea_number}.md`);
    const isEditing = await fsPromises
      .access(ideaFilePath)
      .then(() => true)
      .catch(() => false);
    const errors = validateIdea(idea, existingIdeas, isEditing ? idea.idea_number : undefined);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    await writeIdea(idea, content);
  });

  handleAsyncWithArgs('write-story', async (story: Story, content: string) => {
    const [existingStories, existingIdeas] = await Promise.all([readStories(), readIdeas()]);
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
      throw new Error(errors.join(', '));
    }
    await writeStory(story, content);
  });

  handleAsyncWithArgs('write-sprint', async (sprint: Sprint, content: string) => {
    const existingSprints = await readSprints();
    const existingSprint = existingSprints.find((s) => s.sprint_id === sprint.sprint_id);
    const errors = validateSprint(sprint, existingSprints, existingSprint ? sprint.sprint_id : undefined);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    await writeSprint(sprint, content);
  });

  handleAsyncWithArgs('write-update', async (update: Update, content: string) => {
    await writeUpdate(update, content);
  });

  handleAsyncWithArgs('write-figure', async (figure: Figure, content: string) => {
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
      throw new Error(errors.join(', '));
    }
    await writeFigure(figure, content);
  });
}


