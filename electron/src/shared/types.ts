/**
 * Shared TypeScript types for Ideas Taxonomy system
 */

export type IdeaStatus = 'planned' | 'active' | 'completed' | 'archived';
export type StoryStatus = 'backlog' | 'planned' | 'in-progress' | 'done';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type UpdateType = 'progress' | 'completion' | 'blocker' | 'note';

export interface Idea {
  layout: 'idea';
  idea_number: number;
  title: string;
  description: string;
  status: IdeaStatus;
  created: string; // ISO date
  tags?: string[];
}

export interface Story {
  layout: 'story';
  idea_number: number;
  story_number: number;
  title: string;
  description: string;
  status: StoryStatus;
  priority: StoryPriority;
  created: string; // ISO date
  assigned_sprint?: string; // YYSS format
}

export interface Sprint {
  layout: 'sprint';
  sprint_id: string; // YYSS format
  year: number;
  sprint_number: number;
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: SprintStatus;
  goals?: string[];
}

export interface Update {
  layout: 'update';
  sprint_id: string; // YYSS format
  idea_number: number;
  story_number: number;
  notation: string; // e.g., "2609.5.56"
  date: string; // ISO date
  type: UpdateType;
}

export type MarkdownDocument = {
  body?: string;
};

export type IdeaRecord = Idea & MarkdownDocument;
export type StoryRecord = Story & MarkdownDocument;
export type SprintRecord = Sprint & MarkdownDocument;
export type UpdateRecord = Update & MarkdownDocument;

export interface TaxonomyData {
  ideas: IdeaRecord[];
  stories: StoryRecord[];
  sprints: SprintRecord[];
  updates: UpdateRecord[];
}

