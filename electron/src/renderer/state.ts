import type {
  FigureRecord,
  IdeaRecord,
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
};

export type Tab = 'ideas' | 'stories' | 'sprints' | 'updates' | 'figures';

export const state: AppState = {
  ideas: [],
  stories: [],
  sprints: [],
  updates: [],
  figures: [],
};

let currentTab: Tab = 'ideas';

export function getCurrentTab(): Tab {
  return currentTab;
}

export function setCurrentTab(tab: Tab): void {
  currentTab = tab;
}


