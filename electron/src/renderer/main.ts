import { setCurrentTab, state, type Tab } from './state';
import { Action } from './constants';
import {
  fetchFigures,
  fetchIdeas,
  fetchNotes,
  fetchSprints,
  fetchStories,
  fetchUpdates,
} from './api';
import {
  renderFigures,
  renderIdeas,
  renderNotes,
  renderSprints,
  renderStories,
  renderUpdates,
} from './components/lists';
import {
  openFigureForm,
  openIdeaForm,
  openNoteForm,
  openSprintForm,
  openStoryForm,
  openUpdateForm,
} from './components/forms';
import {
  deleteFigure,
  deleteIdea,
  deleteNote,
  deleteSprint,
  deleteStory,
  deleteUpdate,
} from './actions';
import {
  getFigureFromDataset,
  getIdeaFromDataset,
  getNoteFromDataset,
  getSprintFromDataset,
  getStoryFromDataset,
  getUpdateFromDataset,
} from './selectors';
import { showError } from './toast';
import { setupModalHandlers } from './modal';
import { clearRelationshipsSidebar, renderRelationshipsSidebar } from './components/relationships';

const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab');
const panels = document.querySelectorAll<HTMLDivElement>('.panel');
const listIdToTab: Record<string, Tab> = {
  'ideas-list': 'ideas',
  'notes-list': 'notes',
  'stories-list': 'stories',
  'sprints-list': 'sprints',
  'updates-list': 'updates',
  'figures-list': 'figures',
};

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
        clearRelationshipsSidebar('ideas');
        break;
      case 'notes':
        await fetchNotes();
        renderNotes();
        clearRelationshipsSidebar('notes');
        break;
      case 'stories':
        await fetchStories();
        renderStories();
        clearRelationshipsSidebar('stories');
        break;
      case 'sprints':
        await fetchSprints();
        if (!state.stories.length) {
          await fetchStories();
        }
        renderSprints();
        clearRelationshipsSidebar('sprints');
        break;
      case 'updates':
        await fetchUpdates();
        renderUpdates();
        clearRelationshipsSidebar('updates');
        break;
      case 'figures':
        await fetchFigures();
        await renderFigures();
        clearRelationshipsSidebar('figures');
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
    case 'new-note':
      void openNoteForm('create');
      break;
    case 'edit-note':
      void openNoteForm('edit', getNoteFromDataset(target));
      break;
    case 'delete-note':
      void deleteNote(target.dataset.note);
      break;
    case 'refresh-notes':
      void loadTabData('notes');
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
  setupCardSelection();
  document.addEventListener('click', handleActionClick);
  await loadTabData('ideas');
}

void init();

function setupCardSelection(): void {
  document.addEventListener('click', handleCardClick);
  document.addEventListener('keydown', handleCardKeydown);
}

function handleCardClick(event: Event): void {
  const target = event.target as HTMLElement;
  if (target.closest('[data-action]')) {
    return;
  }
  const card = target.closest<HTMLDivElement>('.item-card');
  if (!card) {
    return;
  }
  activateCard(card);
}

function handleCardKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement;
  if (!target.classList.contains('item-card')) {
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activateCard(target as HTMLDivElement);
  }
}

function activateCard(card: HTMLDivElement): void {
  const list = card.closest('.list');
  if (!list?.id) return;
  const tab = listIdToTab[list.id];
  if (!tab) return;

  list.querySelectorAll('.item-card--selected').forEach((element) => {
    element.classList.remove('item-card--selected');
  });
  card.classList.add('item-card--selected');

  const record = getRecordForCard(tab, card);
  if (record) {
    renderRelationshipsSidebar(tab, record);
  } else {
    clearRelationshipsSidebar(tab);
  }
}

function getRecordForCard(tab: Tab, card: HTMLElement): any | undefined {
  switch (tab) {
    case 'ideas': {
      const ideaNumber = Number(card.dataset.ideaNumber);
      return state.ideas.find((idea) => idea.idea_number === ideaNumber);
    }
    case 'notes': {
      const slug = card.dataset.noteSlug;
      return state.notes.find((note) => note.slug === slug);
    }
    case 'stories': {
      const storyNumber = Number(card.dataset.storyNumber);
      return state.stories.find((story) => story.story_number === storyNumber);
    }
    case 'sprints': {
      const sprintId = card.dataset.sprintId;
      return state.sprints.find((sprint) => sprint.sprint_id === sprintId);
    }
    case 'updates': {
      const sprintId = card.dataset.sprintId;
      const ideaNumber = Number(card.dataset.ideaNumber);
      const storyNumber = Number(card.dataset.storyNumber);
      return state.updates.find(
        (update) =>
          update.sprint_id === sprintId && update.idea_number === ideaNumber && update.story_number === storyNumber
      );
    }
    case 'figures': {
      const figureNumber = Number(card.dataset.figureNumber);
      return state.figures.find((figure) => figure.figure_number === figureNumber);
    }
    default:
      return undefined;
  }
}
