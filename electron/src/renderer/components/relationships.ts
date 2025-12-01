import type {
  FigureRecord,
  IdeaRecord,
  NoteRecord,
  SprintRecord,
  StoryRecord,
  UpdateRecord,
} from '@shared/types';

import { state, type Tab } from '../state';
import { escapeHtml } from '../utils/dom';
import { formatFigureNotation } from '../utils/format';

type RelationshipKind = 'ideas' | 'stories' | 'sprints' | 'notes' | 'figures' | 'updates';

type RecordMap = {
  ideas: IdeaRecord;
  notes: NoteRecord;
  stories: StoryRecord;
  sprints: SprintRecord;
  updates: UpdateRecord;
  figures: FigureRecord;
};

const RELATION_ORDER: RelationshipKind[] = ['ideas', 'stories', 'sprints', 'notes', 'figures', 'updates'];

export function clearRelationshipsSidebar(tab: Tab): void {
  const sidebar = document.getElementById(`${tab}-sidebar`);
  if (sidebar) {
    sidebar.innerHTML = '<div class="sidebar-placeholder">Select an item to see relationships.</div>';
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
    case 'notes': {
      const note = record as NoteRecord;
      return `<div class="panel-sidebar__header">
        <h3 class="panel-sidebar__title">Note ${escapeHtml(note.slug)}</h3>
        <p class="panel-sidebar__subtitle">${escapeHtml(note.title || '')}</p>
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
    case 'notes': {
      const note = record as NoteRecord;
      return extractIdsFromNote(note, kind);
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
    case 'notes':
      return idea.related_notes ?? [];
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
    case 'notes':
      return story.related_notes ?? [];
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
    case 'notes':
      return sprint.related_notes ?? [];
    case 'figures':
      return sprint.related_figures ?? [];
    case 'updates':
      return sprint.related_updates ?? [];
    default:
      return [];
  }
}

function extractIdsFromNote(note: NoteRecord, kind: RelationshipKind): Array<string | number> {
  switch (kind) {
    case 'ideas':
      return note.related_ideas ?? [];
    case 'stories':
      return note.related_stories ?? [];
    case 'sprints':
      return note.related_sprints ?? [];
    case 'figures':
      return note.related_figures ?? [];
    case 'updates':
      return note.related_updates ?? [];
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
    case 'notes':
      return figure.related_notes ?? [];
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
    case 'notes':
      return update.related_notes ?? [];
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
    case 'notes': {
      const slug = String(id);
      const note = state.notes.find((item) => item.slug === slug);
      return note ? `${escapeHtml(note.title || '')} (${escapeHtml(slug)})` : slug;
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

