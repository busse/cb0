import type {
  FigureRecord,
  IdeaRecord,
  MaterialRecord,
  SprintRecord,
  StoryRecord,
  UpdateRecord,
} from '@shared/types';

import { state, type Tab } from '../state';
import { escapeHtml } from '../utils/dom';
import { formatFigureNotation } from '../utils/format';

type RelationshipKind = 'ideas' | 'stories' | 'sprints' | 'materials' | 'figures' | 'updates';

type RecordMap = {
  ideas: IdeaRecord;
  materials: MaterialRecord;
  stories: StoryRecord;
  sprints: SprintRecord;
  updates: UpdateRecord;
  figures: FigureRecord;
};

const RELATION_ORDER: RelationshipKind[] = ['ideas', 'stories', 'sprints', 'materials', 'figures', 'updates'];

export function clearRelationshipsSidebar(tab: Tab): void {
  const sidebar = document.getElementById(`${tab}-sidebar`);
  if (sidebar) {
    sidebar.innerHTML = '<div class="sidebar-placeholder">Select an item to see relationships.</div>';
  }
}

/**
 * Refresh the sidebar for the currently selected card in a tab
 */
export function refreshRelationshipsSidebar(tab: Tab): void {
  const panel = document.getElementById(`${tab}-panel`);
  if (!panel) return;
  
  const selectedCard = panel.querySelector<HTMLDivElement>('.item-card--selected');
  if (!selectedCard) return;
  
  // Get the record for the selected card
  const record = getRecordForSelectedCard(tab, selectedCard);
  if (record) {
    renderRelationshipsSidebar(tab, record);
  }
}

function getRecordForSelectedCard(tab: Tab, card: HTMLElement): RecordMap[Tab] | undefined {
  switch (tab) {
    case 'ideas': {
      const ideaNumber = Number(card.dataset.ideaNumber);
      return state.ideas.find((idea) => idea.idea_number === ideaNumber) as IdeaRecord | undefined;
    }
    case 'materials': {
      const slug = card.dataset.materialSlug;
      return state.materials.find((material) => material.slug === slug) as MaterialRecord | undefined;
    }
    case 'stories': {
      const storyNumber = Number(card.dataset.storyNumber);
      return state.stories.find((story) => story.story_number === storyNumber) as StoryRecord | undefined;
    }
    case 'sprints': {
      const sprintId = card.dataset.sprintId;
      return state.sprints.find((sprint) => sprint.sprint_id === sprintId) as SprintRecord | undefined;
    }
    case 'updates': {
      const sprintId = card.dataset.sprintId;
      const ideaNumber = Number(card.dataset.ideaNumber);
      const storyNumber = Number(card.dataset.storyNumber);
      return state.updates.find(
        (update) =>
          update.sprint_id === sprintId && update.idea_number === ideaNumber && update.story_number === storyNumber
      ) as UpdateRecord | undefined;
    }
    case 'figures': {
      const figureNumber = Number(card.dataset.figureNumber);
      return state.figures.find((figure) => figure.figure_number === figureNumber) as FigureRecord | undefined;
    }
    default:
      return undefined;
  }
}

export function renderRelationshipsSidebar(tab: Tab, record?: RecordMap[Tab]): void {
  const sidebar = document.getElementById(`${tab}-sidebar`);
  if (!sidebar) return;
  if (!record) {
    clearRelationshipsSidebar(tab);
    return;
  }

  const header = renderSidebarHeader(tab, record);
  const sections = RELATION_ORDER.map((kind) => renderRelationshipGroup(tab, kind, record)).filter(Boolean);

  sidebar.innerHTML =
    header +
    (sections.length
      ? sections.join('')
      : '<div class="sidebar-placeholder">No relationships documented for this record yet.</div>');
}

function renderSidebarHeader(tab: Tab, record: RecordMap[Tab]): string {
  switch (tab) {
    case 'ideas': {
      const idea = record as IdeaRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">Idea i${idea.idea_number}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(idea.title || '')}</p>
      </div>`;
    }
    case 'materials': {
      const material = record as MaterialRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">Material ${escapeHtml(material.slug)}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(material.title || '')}</p>
      </div>`;
    }
    case 'stories': {
      const story = record as StoryRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">Story s${story.story_number}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(story.title || '')}</p>
      </div>`;
    }
    case 'sprints': {
      const sprint = record as SprintRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">Sprint ${sprint.sprint_id}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(sprint.start_date)} → ${escapeHtml(sprint.end_date)}</p>
      </div>`;
    }
    case 'updates': {
      const update = record as UpdateRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">Update ${escapeHtml(update.notation)}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(update.type)}</p>
      </div>`;
    }
    case 'figures': {
      const figure = record as FigureRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">${formatFigureNotation(figure.figure_number)}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(figure.title || '')}</p>
      </div>`;
    }
  }
}

function renderRelationshipGroup(
  tab: Tab,
  kind: RelationshipKind,
  record: RecordMap[Tab]
): string | null {
  const items = getRelationshipItems(tab, kind, record);
  if (!items.length) {
    return null;
  }

  const label = kind.toUpperCase();
  return `<section class="relationships-group">
    <h4>${label}</h4>
    <ul class="relationships-list">
      ${items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </section>`;
}

function getRelationshipItems(tab: Tab, kind: RelationshipKind, record: RecordMap[Tab]): string[] {
  const ids = getRelationshipIds(tab, kind, record);
  const uniqueIds = Array.from(new Set(ids));
  return uniqueIds.map((id) => formatRelationship(kind, id)).filter((item): item is string => Boolean(item));
}

function getRelationshipIds(tab: Tab, kind: RelationshipKind, record: RecordMap[Tab]): Array<string | number> {
  switch (tab) {
    case 'ideas': {
      const idea = record as IdeaRecord;
      return extractIdsFromIdea(idea, kind);
    }
    case 'stories': {
      const story = record as StoryRecord;
      return extractIdsFromStory(story, kind);
    }
    case 'sprints': {
      const sprint = record as SprintRecord;
      return extractIdsFromSprint(sprint, kind);
    }
    case 'materials': {
      const material = record as MaterialRecord;
      return extractIdsFromMaterial(material, kind);
    }
    case 'figures': {
      const figure = record as FigureRecord;
      return extractIdsFromFigure(figure, kind);
    }
    case 'updates': {
      const update = record as UpdateRecord;
      return extractIdsFromUpdate(update, kind);
    }
  }
}

function extractIdsFromIdea(idea: IdeaRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'stories':
      return idea.related_stories ?? [];
    case 'sprints':
      return idea.related_sprints ?? [];
    case 'materials':
      return idea.related_materials ?? [];
    case 'figures':
      return idea.related_figures ?? [];
    case 'updates':
      return idea.related_updates ?? [];
    default:
      return [];
  }
}

function extractIdsFromStory(story: StoryRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'ideas':
      return story.related_ideas;
    case 'sprints':
      return story.related_sprints ?? [];
    case 'materials':
      return story.related_materials ?? [];
    case 'figures':
      return story.related_figures ?? [];
    case 'updates':
      return story.related_updates ?? [];
    default:
      return [];
  }
}

function extractIdsFromSprint(sprint: SprintRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'ideas':
      return sprint.related_ideas ?? [];
    case 'stories':
      return [
        ...(sprint.related_stories ?? []),
        ...state.stories
          .filter((story) => story.related_sprints?.includes(sprint.sprint_id))
          .map((story) => story.story_number),
      ];
    case 'materials':
      return sprint.related_materials ?? [];
    case 'figures':
      return sprint.related_figures ?? [];
    case 'updates':
      return sprint.related_updates ?? [];
    default:
      return [];
  }
}

function extractIdsFromMaterial(material: MaterialRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'ideas':
      return material.related_ideas ?? [];
    case 'stories':
      return material.related_stories ?? [];
    case 'sprints':
      return material.related_sprints ?? [];
    case 'figures':
      return material.related_figures ?? [];
    case 'updates':
      return material.related_updates ?? [];
    default:
      return [];
  }
}

function extractIdsFromFigure(figure: FigureRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'ideas':
      return figure.related_ideas ?? [];
    case 'stories':
      return (figure.related_stories ?? [])
        .map((ref) => parseStoryReference(ref)?.story)
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    case 'sprints':
      return figure.related_sprints ?? [];
    case 'materials':
      return figure.related_materials ?? [];
    case 'updates':
      return figure.related_updates ?? [];
    default:
      return [];
  }
}

function extractIdsFromUpdate(update: UpdateRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'ideas':
      return [update.idea_number, ...(update.related_ideas ?? [])];
    case 'stories':
      return [update.story_number, ...(update.related_stories ?? [])];
    case 'sprints':
      return [update.sprint_id, ...(update.related_sprints ?? [])];
    case 'materials':
      return update.related_materials ?? [];
    case 'figures':
      return update.related_figures ?? [];
    default:
      return [];
  }
}

function formatRelationship(kind: RelationshipKind, id: string | number): string | null {
  switch (kind) {
    case 'ideas': {
      const ideaNumber = Number(id);
      const idea = state.ideas.find((item) => item.idea_number === ideaNumber);
      return idea ? `i${idea.idea_number} — ${escapeHtml(idea.title || '')}` : `i${ideaNumber}`;
    }
    case 'stories': {
      const storyNumber = Number(id);
      const story = state.stories.find((item) => item.story_number === storyNumber);
      return story ? `s${story.story_number} — ${escapeHtml(story.title || '')}` : `s${storyNumber}`;
    }
    case 'sprints': {
      const sprintId = String(id);
      const sprint = state.sprints.find((item) => item.sprint_id === sprintId);
      return sprint
        ? `${sprint.sprint_id} — ${escapeHtml(sprint.start_date)} → ${escapeHtml(sprint.end_date)}`
        : sprintId;
    }
    case 'materials': {
      const slug = String(id);
      const material = state.materials.find((item) => item.slug === slug);
      return material ? `${escapeHtml(material.title || '')} (${escapeHtml(slug)})` : slug;
    }
    case 'figures': {
      const figureNumber = Number(id);
      const figure = state.figures.find((item) => item.figure_number === figureNumber);
      return figure
        ? `${formatFigureNotation(figure.figure_number)} — ${escapeHtml(figure.title || '')}`
        : formatFigureNotation(figureNumber);
    }
    case 'updates': {
      const notation = String(id);
      const update = state.updates.find((item) => item.notation === notation);
      return update ? `${escapeHtml(update.notation)} (${update.type})` : notation;
    }
    default:
      return null;
  }
}

function parseStoryReference(ref: string): { idea: number; story: number } | null {
  const [ideaPart, storyPart] = ref.split('.');
  if (ideaPart === undefined || storyPart === undefined) return null;
  const idea = Number(ideaPart);
  const story = Number(storyPart);
  if (Number.isNaN(idea) || Number.isNaN(story)) return null;
  return { idea, story };
}

