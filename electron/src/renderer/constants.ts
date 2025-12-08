import type {
  FigureStatus,
  IdeaStatus,
  SprintStatus,
  StoryPriority,
  StoryStatus,
  UpdateType,
} from '@shared/types';

export type Action =
  | 'new-idea'
  | 'edit-idea'
  | 'delete-idea'
  | 'refresh-ideas'
  | 'new-material'
  | 'edit-material'
  | 'delete-material'
  | 'refresh-materials'
  | 'new-story'
  | 'edit-story'
  | 'delete-story'
  | 'refresh-stories'
  | 'new-sprint'
  | 'edit-sprint'
  | 'delete-sprint'
  | 'refresh-sprints'
  | 'new-update'
  | 'edit-update'
  | 'delete-update'
  | 'refresh-updates'
  | 'new-figure'
  | 'edit-figure'
  | 'delete-figure'
  | 'refresh-figures';

export const IDEA_STATUSES: IdeaStatus[] = ['planned', 'active', 'completed', 'archived'];
export const STORY_STATUSES: StoryStatus[] = ['backlog', 'planned', 'in-progress', 'done'];
export const STORY_PRIORITIES: StoryPriority[] = ['low', 'medium', 'high', 'critical'];
export const SPRINT_STATUSES: SprintStatus[] = ['planned', 'active', 'completed'];
export const UPDATE_TYPES: UpdateType[] = ['progress', 'completion', 'blocker', 'note'];
export const FIGURE_STATUSES: FigureStatus[] = ['active', 'archived'];


