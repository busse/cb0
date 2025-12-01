/**
 * Shared TypeScript types for Ideas Taxonomy system
 */

export type IdeaStatus = 'planned' | 'active' | 'completed' | 'archived';
export type StoryStatus = 'backlog' | 'planned' | 'in-progress' | 'done';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type UpdateType = 'progress' | 'completion' | 'blocker' | 'note';
export type FigureStatus = 'active' | 'archived';

export interface Idea {
  layout: 'idea';
  idea_number: number;
  title: string;
  description: string;
  status: IdeaStatus;
  created: string; // ISO date
  tags?: string[];
  related_stories?: number[];
  related_sprints?: string[];
  related_notes?: string[];
  related_figures?: number[];
  related_updates?: string[];
}

export interface Story {
  layout: 'story';
  story_number: number;
  title: string;
  description: string;
  status: StoryStatus;
  priority: StoryPriority;
  created: string; // ISO date
  related_ideas: number[];
  related_sprints?: string[];
  related_notes?: string[];
  related_figures?: number[];
  related_updates?: string[];
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
  related_ideas?: number[];
  related_stories?: number[];
  related_notes?: string[];
  related_figures?: number[];
  related_updates?: string[];
}

export interface Update {
  layout: 'update';
  sprint_id: string; // YYSS format
  idea_number: number;
  story_number: number;
  notation: string; // e.g., "2609.5.56"
  date: string; // ISO date
  type: UpdateType;
  related_ideas?: number[];
  related_stories?: number[];
  related_figures?: number[];
  related_notes?: string[];
  related_sprints?: string[];
}

export interface Figure {
  layout: 'figure';
  figure_number: number;
  title: string;
  description?: string;
  image_path: string;
  alt_text?: string;
  related_ideas?: number[];
  related_stories?: string[];
  related_sprints?: string[];
  related_notes?: string[];
  related_updates?: string[];
  created: string;
  uploaded_date?: string;
  file_type?: string;
  status: FigureStatus;
  tags?: string[];
  dimensions?: string;
  file_size?: string;
}

export type MarkdownDocument = {
  body?: string;
};

export interface Note {
  layout: 'post';
  title: string;
  date: string; // YYYY-MM-DD
  author?: string;
  tags?: string[];
  excerpt?: string;
  slug?: string;
  related_ideas?: number[];
  related_stories?: number[];
  related_sprints?: string[];
  related_figures?: number[];
  related_updates?: string[];
}

export type IdeaRecord = Idea & MarkdownDocument;
export type StoryRecord = Story & MarkdownDocument;
export type SprintRecord = Sprint & MarkdownDocument;
export type UpdateRecord = Update & MarkdownDocument;
export type FigureRecord = Figure & MarkdownDocument;
export type NoteRecord = Note &
  MarkdownDocument & {
    filename: string;
    slug: string;
  };

export interface TaxonomyData {
  ideas: IdeaRecord[];
  stories: StoryRecord[];
  sprints: SprintRecord[];
  updates: UpdateRecord[];
  figures: FigureRecord[];
  notes: NoteRecord[];
}

