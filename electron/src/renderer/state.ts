import type {
  FigureRecord,
  IdeaRecord,
  NoteRecord,
  SprintRecord,
  StoryRecord,
  UpdateRecord,
} from '@shared/types';

export type AppState = {
  ideas: IdeaRecord[];
  stories: StoryRecord[];
  sprints: SprintRecord[];
  updates: UpdateRecord[];
  figures: FigureRecord[];
  notes: NoteRecord[];
};

export type Tab = 'ideas' | 'stories' | 'sprints' | 'updates' | 'figures' | 'notes';

export const state: AppState = {
  ideas: [],
  stories: [],
  sprints: [],
  updates: [],
  figures: [],
  notes: [],
};

let currentTab: Tab = 'ideas';

export function getCurrentTab(): Tab {
  return currentTab;
}

export function setCurrentTab(tab: Tab): void {
  currentTab = tab;
}


