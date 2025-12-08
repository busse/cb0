import * as path from 'path';
import * as fsPromises from 'fs/promises';

import { handleAsyncWithArgs } from '../ipc-factory';
import {
  PATHS,
  readFigures,
  readIdeas,
  readMaterials,
  readSprints,
  readStories,
  writeFigure,
  writeIdea,
  writeMaterial,
  writeSprint,
  writeStory,
  writeUpdate,
} from '../../shared/file-utils';
import {
  validateFigure,
  validateIdea,
  validateMaterial,
  validateSprint,
  validateStory,
} from '../../shared/validation';
import type { Figure, Idea, Material, Sprint, Story, Update } from '../../shared/types';

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
    const [existingStories, existingIdeas, existingSprints] = await Promise.all([
      readStories(),
      readIdeas(),
      readSprints(),
    ]);
    const existingStory = existingStories.find((s) => s.story_number === story.story_number);
    const errors = validateStory(
      story,
      existingStories,
      existingIdeas,
      existingSprints,
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

  handleAsyncWithArgs('write-material', async (material: Material & { filename?: string }, content: string) => {
    const existingMaterials = await readMaterials();
    const errors = validateMaterial(material, existingMaterials, material.filename);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    await writeMaterial(material, content);
  });
}


