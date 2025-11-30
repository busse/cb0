/**
 * Validation utilities for taxonomy system
 */

import type { Idea, Story, Sprint, Update } from './types';

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
  ideaNumber: number,
  storyNumber: number,
  existingStories: Story[],
  excludeStoryNumber?: number
): boolean {
  return !existingStories.some(
    (story) =>
      story.idea_number === ideaNumber &&
      story.story_number === storyNumber &&
      story.story_number !== excludeStoryNumber
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
 * Parse notation
 */
export function parseNotation(notation: string): {
  sprintId?: string;
  ideaNumber?: number;
  storyNumber?: number;
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
 * Get next available story number for an idea
 */
export function getNextStoryNumber(ideaNumber: number, existingStories: Story[]): number {
  const ideaStories = existingStories.filter((story) => story.idea_number === ideaNumber);
  if (ideaStories.length === 0) return 0;
  const maxNumber = Math.max(...ideaStories.map((story) => story.story_number));
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
  excludeIdeaNumber?: number,
  excludeStoryNumber?: number
): string[] {
  const errors: string[] = [];

  if (story.idea_number === undefined) {
    errors.push('idea_number is required');
  } else if (!isValidIdeaNumber(story.idea_number)) {
    errors.push('idea_number must be a non-negative integer');
  } else if (!existingIdeas.some((idea) => idea.idea_number === story.idea_number)) {
    errors.push(`Parent idea ${story.idea_number} does not exist`);
  }

  if (story.story_number === undefined) {
    errors.push('story_number is required');
  } else if (!isValidStoryNumber(story.story_number)) {
    errors.push('story_number must be a non-negative integer');
  } else if (
    story.idea_number !== undefined &&
    !isUniqueStoryNumber(story.idea_number, story.story_number, existingStories, excludeStoryNumber)
  ) {
    errors.push(
      `Story number ${story.story_number} already exists for idea ${story.idea_number}`
    );
  }

  if (!story.title || story.title.trim() === '') {
    errors.push('title is required');
  }

  if (!story.status) {
    errors.push('status is required');
  } else if (!['backlog', 'planned', 'in-progress', 'done'].includes(story.status)) {
    errors.push('status must be one of: backlog, planned, in-progress, done');
  }

  if (!story.priority) {
    errors.push('priority is required');
  } else if (!['low', 'medium', 'high', 'critical'].includes(story.priority)) {
    errors.push('priority must be one of: low, medium, high, critical');
  }

  if (story.assigned_sprint && !isValidSprintId(story.assigned_sprint)) {
    errors.push('assigned_sprint must be in YYSS format (e.g., 2609)');
  }

  return errors;
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



