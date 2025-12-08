/**
 * Validation utilities for taxonomy system
 */

import type { Idea, Story, Sprint, Update, Figure, Material, MaterialRecord, StoryStatus } from './types';

/**
 * Validate sprint ID format (YYSS)
 */
export function isValidSprintId(sprintId: string): boolean {
  return /^\d{4}$/.test(sprintId);
}

/**
 * Validate idea number (must be unique, non-negative integer)
 */
export function isValidIdeaNumber(ideaNumber: number): boolean {
  return Number.isInteger(ideaNumber) && ideaNumber >= 0;
}

/**
 * Validate story number (must be non-negative integer)
 */
export function isValidStoryNumber(storyNumber: number): boolean {
  return Number.isInteger(storyNumber) && storyNumber >= 0;
}

/**
 * Validate figure number (must be non-negative integer)
 */
export function isValidFigureNumber(figureNumber: number): boolean {
  return Number.isInteger(figureNumber) && figureNumber >= 0;
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Check if idea number is unique
 */
export function isUniqueIdeaNumber(
  ideaNumber: number,
  existingIdeas: Idea[],
  excludeIdeaNumber?: number
): boolean {
  return !existingIdeas.some(
    (idea) => idea.idea_number === ideaNumber && (excludeIdeaNumber === undefined || idea.idea_number !== excludeIdeaNumber)
  );
}

/**
 * Check if story number is unique within an idea
 */
export function isUniqueStoryNumber(
  storyNumber: number,
  existingStories: Story[],
  excludeStoryNumber?: number
): boolean {
  return !existingStories.some(
    (story) =>
      story.story_number === storyNumber &&
      (excludeStoryNumber === undefined || story.story_number !== excludeStoryNumber)
  );
}

/**
 * Check if figure number is unique
 */
export function isUniqueFigureNumber(
  figureNumber: number,
  existingFigures: Figure[],
  excludeFigureNumber?: number
): boolean {
  return !existingFigures.some(
    (figure) =>
      figure.figure_number === figureNumber &&
      (excludeFigureNumber === undefined || figure.figure_number !== excludeFigureNumber)
  );
}

/**
 * Validate notation format
 */
export function isValidNotation(notation: string): boolean {
  // Format: {sprint}.{idea}.{story} or {idea}.{story} or i{n} or s{n}
  const patterns = [
    /^\d{4}\.\d+\.\d+$/, // 2609.5.56
    /^\d+\.\d+$/, // 5.56
    /^i\d+$/, // i5
    /^s\d+$/, // s56
    /^fig_\d+$/, // fig_32
  ];
  return patterns.some((pattern) => pattern.test(notation));
}

/**
 * Format notation
 */
export function formatNotation(
  sprintId?: string,
  ideaNumber?: number,
  storyNumber?: number
): string {
  if (sprintId && ideaNumber !== undefined && storyNumber !== undefined) {
    return `${sprintId}.${ideaNumber}.${storyNumber}`;
  }
  if (ideaNumber !== undefined && storyNumber !== undefined) {
    return `${ideaNumber}.${storyNumber}`;
  }
  if (ideaNumber !== undefined) {
    return `i${ideaNumber}`;
  }
  if (storyNumber !== undefined) {
    return `s${storyNumber}`;
  }
  return '';
}

/**
 * Format figure notation
 */
export function formatFigureNotation(figureNumber: number): string {
  return `fig_${figureNumber}`;
}

/**
 * Parse notation
 */
export function parseNotation(notation: string): {
  sprintId?: string;
  ideaNumber?: number;
  storyNumber?: number;
  figureNumber?: number;
} {
  const fullMatch = notation.match(/^(\d{4})\.(\d+)\.(\d+)$/);
  if (fullMatch) {
    return {
      sprintId: fullMatch[1],
      ideaNumber: parseInt(fullMatch[2], 10),
      storyNumber: parseInt(fullMatch[3], 10),
    };
  }

  const ideaStoryMatch = notation.match(/^(\d+)\.(\d+)$/);
  if (ideaStoryMatch) {
    return {
      ideaNumber: parseInt(ideaStoryMatch[1], 10),
      storyNumber: parseInt(ideaStoryMatch[2], 10),
    };
  }

  const ideaMatch = notation.match(/^i(\d+)$/);
  if (ideaMatch) {
    return { ideaNumber: parseInt(ideaMatch[1], 10) };
  }

  const storyMatch = notation.match(/^s(\d+)$/);
  if (storyMatch) {
    return { storyNumber: parseInt(storyMatch[1], 10) };
  }

  const figureMatch = notation.match(/^fig_(\d+)$/);
  if (figureMatch) {
    return { figureNumber: parseInt(figureMatch[1], 10) };
  }

  return {};
}

/**
 * Get next available idea number
 */
export function getNextIdeaNumber(existingIdeas: Idea[]): number {
  if (existingIdeas.length === 0) return 0;
  const maxNumber = Math.max(...existingIdeas.map((idea) => idea.idea_number));
  return maxNumber + 1;
}

/**
 * Get next available story number (global)
 */
export function getNextStoryNumber(existingStories: Story[]): number {
  if (existingStories.length === 0) return 0;
  const maxNumber = Math.max(...existingStories.map((story) => story.story_number));
  return maxNumber + 1;
}

/**
 * Get next available figure number
 */
export function getNextFigureNumber(existingFigures: Figure[]): number {
  if (existingFigures.length === 0) return 0;
  const maxNumber = Math.max(...existingFigures.map((figure) => figure.figure_number));
  return maxNumber + 1;
}

/**
 * Validate idea front matter
 */
export function validateIdea(idea: Partial<Idea>, existingIdeas: Idea[], excludeIdeaNumber?: number): string[] {
  const errors: string[] = [];

  if (idea.idea_number === undefined) {
    errors.push('idea_number is required');
  } else if (!isValidIdeaNumber(idea.idea_number)) {
    errors.push('idea_number must be a non-negative integer');
  } else if (!isUniqueIdeaNumber(idea.idea_number, existingIdeas, excludeIdeaNumber)) {
    errors.push(`Idea number ${idea.idea_number} already exists`);
  }

  if (!idea.title || idea.title.trim() === '') {
    errors.push('title is required');
  }

  if (!idea.description || idea.description.trim() === '') {
    errors.push('description is required');
  }

  if (!idea.status) {
    errors.push('status is required');
  } else if (!['planned', 'active', 'completed', 'archived'].includes(idea.status)) {
    errors.push('status must be one of: planned, active, completed, archived');
  }

  if (!idea.created) {
    errors.push('created date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(idea.created)) {
    errors.push('created must be in YYYY-MM-DD format');
  }

  return errors;
}

/**
 * Validate story front matter
 */
export function validateStory(
  story: Partial<Story>,
  existingStories: Story[],
  existingIdeas: Idea[],
  existingSprints: Sprint[],
  excludeStoryNumber?: number
): string[] {
  const errors: string[] = [];

  if (story.story_number === undefined) {
    errors.push('story_number is required');
  } else if (!isValidStoryNumber(story.story_number)) {
    errors.push('story_number must be a non-negative integer');
  } else if (!isUniqueStoryNumber(story.story_number, existingStories, excludeStoryNumber)) {
    errors.push(`Story number ${story.story_number} already exists`);
  }

  const relatedIdeas = Array.isArray(story.related_ideas) ? story.related_ideas : [];

  if (relatedIdeas.length > 0) {
    const invalidIdeas = relatedIdeas.filter((ideaNumber) => !isValidIdeaNumber(ideaNumber));
    if (invalidIdeas.length) {
      errors.push(`Invalid idea numbers: ${invalidIdeas.join(', ')}`);
    }

    const missingIdeas = relatedIdeas.filter(
      (ideaNumber) => !existingIdeas.some((idea) => idea.idea_number === ideaNumber)
    );
    if (missingIdeas.length) {
      errors.push(`Related ideas not found: ${missingIdeas.join(', ')}`);
    }
  }

  if (!story.title || story.title.trim() === '') {
    errors.push('title is required');
  }

  if (!story.status) {
    errors.push('status is required');
  } else {
    const normalizedStatus = story.status.replace(/_/g, '-');
    if (!['backlog', 'planned', 'in-progress', 'done'].includes(normalizedStatus)) {
      errors.push('status must be one of: backlog, planned, in-progress, done');
    } else if (normalizedStatus !== story.status) {
      story.status = normalizedStatus as StoryStatus;
    }
  }

  if (!story.priority) {
    errors.push('priority is required');
  } else if (!['low', 'medium', 'high', 'critical'].includes(story.priority)) {
    errors.push('priority must be one of: low, medium, high, critical');
  }

  if (story.related_sprints) {
    const invalidSprints = story.related_sprints.filter((sprintId) => !isValidSprintId(sprintId));
    if (invalidSprints.length) {
      errors.push(
        `related_sprints must be YYSS format (e.g., 2609). Invalid: ${invalidSprints.join(', ')}`
      );
    }

    const missingSprints = story.related_sprints.filter(
      (sprintId) => !existingSprints.some((sprint) => String(sprint.sprint_id) === sprintId)
    );

    if (missingSprints.length) {
      errors.push(`Related sprints not found: ${missingSprints.join(', ')}`);
    }
  }

  return errors;
}

/**
 * Validate figure front matter
 */
export function validateFigure(
  figure: Partial<Figure>,
  existingFigures: Figure[],
  existingIdeas: Idea[],
  existingStories: Story[],
  excludeFigureNumber?: number
): string[] {
  const errors: string[] = [];

  if (figure.figure_number === undefined) {
    errors.push('figure_number is required');
  } else if (!isValidFigureNumber(figure.figure_number)) {
    errors.push('figure_number must be a non-negative integer');
  } else if (!isUniqueFigureNumber(figure.figure_number, existingFigures, excludeFigureNumber)) {
    errors.push(`Figure number ${figure.figure_number} already exists`);
  }

  if (!figure.title || figure.title.trim() === '') {
    errors.push('title is required');
  }

  if (!figure.image_path || figure.image_path.trim() === '') {
    errors.push('image_path is required');
  }

  if (!figure.status) {
    errors.push('status is required');
  } else if (!['active', 'archived'].includes(figure.status)) {
    errors.push('status must be one of: active, archived');
  }

  if (!figure.created) {
    errors.push('created date is required');
  } else if (!isValidDateString(figure.created)) {
    errors.push('created must be in YYYY-MM-DD format');
  }

  if (figure.uploaded_date && !/^\d{4}-\d{2}-\d{2}$/.test(figure.uploaded_date)) {
    errors.push('uploaded_date must be in YYYY-MM-DD format');
  }

  if (figure.related_ideas) {
    const missingIdeas = figure.related_ideas.filter(
      (ideaNumber) => !existingIdeas.some((idea) => idea.idea_number === ideaNumber)
    );
    if (missingIdeas.length) {
      errors.push(`Related ideas not found: ${missingIdeas.join(', ')}`);
    }
  }

  if (figure.related_stories) {
    const missingStories: string[] = [];
    for (const ref of figure.related_stories) {
      if (!isValidStoryReference(ref, existingStories)) {
        missingStories.push(ref);
      }
    }
    if (missingStories.length) {
      errors.push(`Related stories not found: ${missingStories.join(', ')}`);
    }
  }

  return errors;
}

function isValidStoryReference(reference: string, existingStories: Story[]): boolean {
  const [ideaPart, storyPart] = reference.split('.');
  if (!ideaPart || !storyPart) return false;
  const ideaNumber = Number(ideaPart);
  const storyNumber = Number(storyPart);
  if (Number.isNaN(ideaNumber) || Number.isNaN(storyNumber)) return false;
  return existingStories.some(
    (story) => story.story_number === storyNumber && story.related_ideas?.includes(ideaNumber)
  );
}

/**
 * Validate sprint front matter
 */
export function validateSprint(sprint: Partial<Sprint>, existingSprints: Sprint[], excludeSprintId?: string): string[] {
  const errors: string[] = [];

  if (!sprint.sprint_id) {
    errors.push('sprint_id is required');
  } else if (!isValidSprintId(sprint.sprint_id)) {
    errors.push('sprint_id must be in YYSS format (e.g., 2609)');
  } else if (existingSprints.some((s) => s.sprint_id === sprint.sprint_id && (excludeSprintId === undefined || s.sprint_id !== excludeSprintId))) {
    errors.push(`Sprint ${sprint.sprint_id} already exists`);
  }

  if (sprint.year === undefined) {
    errors.push('year is required');
  } else if (!Number.isInteger(sprint.year) || sprint.year < 2000 || sprint.year > 2100) {
    errors.push('year must be a valid 4-digit year');
  }

  if (sprint.sprint_number === undefined) {
    errors.push('sprint_number is required');
  } else if (!Number.isInteger(sprint.sprint_number) || sprint.sprint_number < 1 || sprint.sprint_number > 26) {
    errors.push('sprint_number must be between 1 and 26');
  }

  if (!sprint.start_date) {
    errors.push('start_date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(sprint.start_date)) {
    errors.push('start_date must be in YYYY-MM-DD format');
  }

  if (!sprint.end_date) {
    errors.push('end_date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(sprint.end_date)) {
    errors.push('end_date must be in YYYY-MM-DD format');
  }

  if (sprint.start_date && sprint.end_date) {
    const start = new Date(sprint.start_date);
    const end = new Date(sprint.end_date);
    if (end <= start) {
      errors.push('end_date must be after start_date');
    }
  }

  return errors;
}

/**
 * Validate material front matter
 */
export function validateMaterial(
  material: Partial<Material> & { filename?: string },
  existingMaterials: MaterialRecord[],
  currentFilename?: string
): string[] {
  const errors: string[] = [];

  if (!material.title || material.title.trim() === '') {
    errors.push('title is required');
  }

  if (!material.date) {
    errors.push('date is required');
  } else if (!isValidDateString(material.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  const slugValue = material.slug?.trim();
  if (!slugValue || slugValue.length === 0) {
    errors.push('slug is required');
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue)) {
    errors.push('slug must contain lowercase letters, numbers, and dashes only');
  }

  const targetFilename = material.date && slugValue ? `${material.date}-${slugValue}.md` : undefined;
  if (targetFilename) {
    const collision = existingMaterials.find(
      (existing) => existing.filename === targetFilename && existing.filename !== currentFilename
    );
    if (collision) {
      errors.push(`A material already exists for ${material.date} with slug "${slugValue}"`);
    }
  }

  return errors;
}



