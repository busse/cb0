import { setCurrentTab, state, type Tab } from './state';
import { Action } from './constants';
import {
  fetchFigures,
  fetchIdeas,
  fetchSprints,
  fetchStories,
  fetchUpdates,
} from './api';
import {
  renderFigures,
  renderIdeas,
  renderSprints,
  renderStories,
  renderUpdates,
} from './components/lists';
import {
  openFigureForm,
  openIdeaForm,
  openSprintForm,
  openStoryForm,
  openUpdateForm,
} from './components/forms';
import {
  deleteFigure,
  deleteIdea,
  deleteSprint,
  deleteStory,
  deleteUpdate,
} from './actions';
import {
  getFigureFromDataset,
  getIdeaFromDataset,
  getSprintFromDataset,
  getStoryFromDataset,
  getUpdateFromDataset,
} from './selectors';
import { showError } from './toast';
import { setupModalHandlers } from './modal';

const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab');
const panels = document.querySelectorAll<HTMLDivElement>('.panel');

function setupTabNavigation(): void {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab as Tab | undefined;
      if (tab) {
        switchTab(tab);
      }
    });
  });
}

function switchTab(tab: Tab): void {
  setCurrentTab(tab);

  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `${tab}-panel`);
  });

  void loadTabData(tab);
}

async function loadTabData(tab: Tab): Promise<void> {
  setListLoading(tab);

  try {
    switch (tab) {
      case 'ideas':
        await fetchIdeas();
        if (!state.stories.length) {
          await fetchStories();
        }
        renderIdeas();
        break;
      case 'stories':
        await fetchStories();
        renderStories();
        break;
      case 'sprints':
        await fetchSprints();
        if (!state.stories.length) {
          await fetchStories();
        }
        renderSprints();
        break;
      case 'updates':
        await fetchUpdates();
        renderUpdates();
        break;
      case 'figures':
        await fetchFigures();
        await renderFigures();
        break;
    }
  } catch (error) {
    showError((error as Error).message);
  }
}

function setListLoading(tab: Tab): void {
  const list = document.getElementById(`${tab}-list`);
  if (list) {
    list.innerHTML = '<div class="loading">Loading…</div>';
  }
}

function handleActionClick(event: Event): void {
  const target = event.target as HTMLElement;
  const action = target.dataset.action as Action | undefined;
  if (!action) return;

  event.preventDefault();

  switch (action) {
    case 'new-idea':
      void openIdeaForm('create');
      break;
    case 'edit-idea':
      void openIdeaForm('edit', getIdeaFromDataset(target));
      break;
    case 'delete-idea':
      void deleteIdea(target.dataset.idea);
      break;
    case 'refresh-ideas':
      void loadTabData('ideas');
      break;
    case 'new-story':
      void openStoryForm('create');
      break;
    case 'edit-story':
      void openStoryForm('edit', getStoryFromDataset(target));
      break;
    case 'delete-story':
      void deleteStory(target.dataset.story);
      break;
    case 'refresh-stories':
      void loadTabData('stories');
      break;
    case 'new-sprint':
      void openSprintForm('create');
      break;
    case 'edit-sprint':
      void openSprintForm('edit', getSprintFromDataset(target));
      break;
    case 'delete-sprint':
      void deleteSprint(target.dataset.sprint);
      break;
    case 'refresh-sprints':
      void loadTabData('sprints');
      break;
    case 'new-update':
      void openUpdateForm('create');
      break;
    case 'edit-update':
      void openUpdateForm('edit', getUpdateFromDataset(target));
      break;
    case 'delete-update':
      void deleteUpdate(target.dataset.sprint, target.dataset.idea, target.dataset.story);
      break;
    case 'refresh-updates':
      void loadTabData('updates');
      break;
    case 'new-figure':
      void openFigureForm('create');
      break;
    case 'edit-figure':
      void openFigureForm('edit', getFigureFromDataset(target));
      break;
    case 'delete-figure':
      void deleteFigure(target.dataset.figure);
      break;
    case 'refresh-figures':
      void loadTabData('figures');
      break;
  }
}

async function init(): Promise<void> {
  setupModalHandlers();
  setupTabNavigation();
  document.addEventListener('click', handleActionClick);
  await loadTabData('ideas');
}

void init();
