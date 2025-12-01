import type {
  Figure,
  FigureRecord,
  Idea,
  IdeaRecord,
  Note,
  NoteRecord,
  Sprint,
  SprintRecord,
  Story,
  StoryRecord,
  Update,
  UpdateRecord,
} from '@shared/types';

import {
  saveFigure,
  saveIdea,
  saveNote,
  saveSprint,
  saveStory,
  saveUpdate,
} from '../api';
import { state } from '../state';

type EntityKind = 'idea' | 'story' | 'sprint' | 'note' | 'figure' | 'update';

type EntityRecordMap = {
  idea: IdeaRecord;
  story: StoryRecord;
  sprint: SprintRecord;
  note: NoteRecord;
  figure: FigureRecord;
  update: UpdateRecord;
};

type AnyRecord = EntityRecordMap[EntityKind];

type RelationRule = {
  source: EntityKind;
  target: EntityKind;
  sourceField: string;
  targetField: string;
  mapSourceValueToTargetId: (value: unknown, source: AnyRecord) => string | null;
  targetValueForSource: (source: AnyRecord, target: AnyRecord) => unknown;
  valueEquals?: (existing: unknown, next: unknown) => boolean;
};

const RELATION_RULES: RelationRule[] = [
  // IDEA → *
  {
    source: 'idea',
    target: 'story',
    sourceField: 'related_stories',
    targetField: 'related_ideas',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Idea).idea_number,
    valueEquals: numberEquals,
  },
  {
    source: 'idea',
    target: 'sprint',
    sourceField: 'related_sprints',
    targetField: 'related_ideas',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Idea).idea_number,
    valueEquals: numberEquals,
  },
  {
    source: 'idea',
    target: 'note',
    sourceField: 'related_notes',
    targetField: 'related_ideas',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Idea).idea_number,
    valueEquals: numberEquals,
  },
  {
    source: 'idea',
    target: 'figure',
    sourceField: 'related_figures',
    targetField: 'related_ideas',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Idea).idea_number,
    valueEquals: numberEquals,
  },
  {
    source: 'idea',
    target: 'update',
    sourceField: 'related_updates',
    targetField: 'related_ideas',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Idea).idea_number,
    valueEquals: numberEquals,
  },
  // STORY → *
  {
    source: 'story',
    target: 'idea',
    sourceField: 'related_ideas',
    targetField: 'related_stories',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Story).story_number,
    valueEquals: numberEquals,
  },
  {
    source: 'story',
    target: 'sprint',
    sourceField: 'related_sprints',
    targetField: 'related_stories',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Story).story_number,
    valueEquals: numberEquals,
  },
  {
    source: 'story',
    target: 'note',
    sourceField: 'related_notes',
    targetField: 'related_stories',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Story).story_number,
    valueEquals: numberEquals,
  },
  {
    source: 'story',
    target: 'figure',
    sourceField: 'related_figures',
    targetField: 'related_stories',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => formatStoryReference(source as Story),
    valueEquals: storyReferenceEquals,
  },
  {
    source: 'story',
    target: 'update',
    sourceField: 'related_updates',
    targetField: 'related_stories',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Story).story_number,
    valueEquals: numberEquals,
  },
  // SPRINT → *
  {
    source: 'sprint',
    target: 'idea',
    sourceField: 'related_ideas',
    targetField: 'related_sprints',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Sprint).sprint_id,
  },
  {
    source: 'sprint',
    target: 'story',
    sourceField: 'related_stories',
    targetField: 'related_sprints',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Sprint).sprint_id,
  },
  {
    source: 'sprint',
    target: 'note',
    sourceField: 'related_notes',
    targetField: 'related_sprints',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Sprint).sprint_id,
  },
  {
    source: 'sprint',
    target: 'figure',
    sourceField: 'related_figures',
    targetField: 'related_sprints',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Sprint).sprint_id,
  },
  {
    source: 'sprint',
    target: 'update',
    sourceField: 'related_updates',
    targetField: 'related_sprints',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Sprint).sprint_id,
  },
  // NOTE → *
  {
    source: 'note',
    target: 'idea',
    sourceField: 'related_ideas',
    targetField: 'related_notes',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => getNoteSlug(source as NoteRecord),
  },
  {
    source: 'note',
    target: 'story',
    sourceField: 'related_stories',
    targetField: 'related_notes',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => getNoteSlug(source as NoteRecord),
  },
  {
    source: 'note',
    target: 'sprint',
    sourceField: 'related_sprints',
    targetField: 'related_notes',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => getNoteSlug(source as NoteRecord),
  },
  {
    source: 'note',
    target: 'figure',
    sourceField: 'related_figures',
    targetField: 'related_notes',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => getNoteSlug(source as NoteRecord),
  },
  {
    source: 'note',
    target: 'update',
    sourceField: 'related_updates',
    targetField: 'related_notes',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => getNoteSlug(source as NoteRecord),
  },
  // FIGURE → *
  {
    source: 'figure',
    target: 'idea',
    sourceField: 'related_ideas',
    targetField: 'related_figures',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Figure).figure_number,
    valueEquals: numberEquals,
  },
  {
    source: 'figure',
    target: 'story',
    sourceField: 'related_stories',
    targetField: 'related_figures',
    mapSourceValueToTargetId: (value) => mapStoryRefToStoryId(value),
    targetValueForSource: (source) => (source as Figure).figure_number,
    valueEquals: numberEquals,
  },
  {
    source: 'figure',
    target: 'sprint',
    sourceField: 'related_sprints',
    targetField: 'related_figures',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Figure).figure_number,
    valueEquals: numberEquals,
  },
  {
    source: 'figure',
    target: 'note',
    sourceField: 'related_notes',
    targetField: 'related_figures',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Figure).figure_number,
    valueEquals: numberEquals,
  },
  {
    source: 'figure',
    target: 'update',
    sourceField: 'related_updates',
    targetField: 'related_figures',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => (source as Figure).figure_number,
    valueEquals: numberEquals,
  },
  // UPDATE → *
  {
    source: 'update',
    target: 'idea',
    sourceField: 'related_ideas',
    targetField: 'related_updates',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => formatUpdateId(source as Update),
  },
  {
    source: 'update',
    target: 'story',
    sourceField: 'related_stories',
    targetField: 'related_updates',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => formatUpdateId(source as Update),
  },
  {
    source: 'update',
    target: 'sprint',
    sourceField: 'related_sprints',
    targetField: 'related_updates',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => formatUpdateId(source as Update),
  },
  {
    source: 'update',
    target: 'note',
    sourceField: 'related_notes',
    targetField: 'related_updates',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => formatUpdateId(source as Update),
  },
  {
    source: 'update',
    target: 'figure',
    sourceField: 'related_figures',
    targetField: 'related_updates',
    mapSourceValueToTargetId: (value) => normalizeId(value),
    targetValueForSource: (source) => formatUpdateId(source as Update),
  },
];

export async function syncRelationships(kind: EntityKind, record: AnyRecord): Promise<void> {
  const matchingRules = RELATION_RULES.filter((rule) => rule.source === kind);
  for (const rule of matchingRules) {
    await applyRule(rule, record);
  }
}

async function applyRule(rule: RelationRule, sourceRecord: AnyRecord): Promise<void> {
  const sourceValues = getArrayValues((sourceRecord as any)[rule.sourceField]);
  const selectedIds = new Set(
    sourceValues
      .map((value) => rule.mapSourceValueToTargetId(value, sourceRecord))
      .filter((value): value is string => Boolean(value))
  );
  const targets = getCollection(rule.target);
  const updates: Promise<void>[] = [];
  for (const target of targets) {
    const targetId = getRecordId(rule.target, target);
    if (!targetId) continue;
    const shouldLink = selectedIds.has(targetId);
    const linkValue = rule.targetValueForSource(sourceRecord, target);
    if (linkValue === undefined || linkValue === null) {
      continue;
    }
    const currentValues = getArrayValues((target as any)[rule.targetField]);
    const hasLink = currentValues.some((existing) =>
      rule.valueEquals ? rule.valueEquals(existing, linkValue) : existing === linkValue
    );
    if (shouldLink && !hasLink) {
      const nextValues = addRelationshipValue(currentValues, linkValue, rule.valueEquals);
      setFieldValues(target, rule.targetField, nextValues);
      updates.push(persistRecord(rule.target, target));
    } else if (!shouldLink && hasLink) {
      const nextValues = removeRelationshipValue(currentValues, linkValue, rule.valueEquals);
      setFieldValues(target, rule.targetField, nextValues);
      updates.push(persistRecord(rule.target, target));
    }
  }
  if (updates.length) {
    await Promise.all(updates);
  }
}

function getCollection(kind: EntityKind): AnyRecord[] {
  switch (kind) {
    case 'idea':
      return state.ideas;
    case 'story':
      return state.stories;
    case 'sprint':
      return state.sprints;
    case 'note':
      return state.notes;
    case 'figure':
      return state.figures;
    case 'update':
      return state.updates;
    default:
      return [];
  }
}

function getRecordId(kind: EntityKind, record: AnyRecord): string | null {
  switch (kind) {
    case 'idea':
      return String((record as IdeaRecord).idea_number);
    case 'story':
      return String((record as StoryRecord).story_number);
    case 'sprint':
      return String((record as SprintRecord).sprint_id);
    case 'note':
      return getNoteSlug(record as NoteRecord);
    case 'figure':
      return String((record as FigureRecord).figure_number);
    case 'update':
      return formatUpdateId(record as UpdateRecord);
    default:
      return null;
  }
}

function setFieldValues(record: AnyRecord, field: string, values: unknown[]): void {
  if (values.length) {
    (record as any)[field] = values;
  } else {
    delete (record as any)[field];
  }
}

function getArrayValues(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...value];
}

function addRelationshipValue(
  values: unknown[],
  nextValue: unknown,
  equals?: (existing: unknown, next: unknown) => boolean
): unknown[] {
  const filtered = values.filter((existing) =>
    equals ? !equals(existing, nextValue) : existing !== nextValue
  );
  filtered.push(nextValue);
  return filtered;
}

function removeRelationshipValue(
  values: unknown[],
  removeValue: unknown,
  equals?: (existing: unknown, next: unknown) => boolean
): unknown[] {
  return values.filter((existing) =>
    equals ? !equals(existing, removeValue) : existing !== removeValue
  );
}

async function persistRecord(kind: EntityKind, record: AnyRecord): Promise<void> {
  switch (kind) {
    case 'idea': {
      const { body = '', ...data } = record as IdeaRecord;
      await saveIdea(data as Idea, body);
      break;
    }
    case 'story': {
      const { body = '', ...data } = record as StoryRecord;
      await saveStory(data as Story, body);
      break;
    }
    case 'sprint': {
      const { body = '', ...data } = record as SprintRecord;
      await saveSprint(data as Sprint, body);
      break;
    }
    case 'note': {
      const { body = '', ...data } = record as NoteRecord;
      await saveNote(data as Note & { filename?: string }, body);
      break;
    }
    case 'figure': {
      const { body = '', ...data } = record as FigureRecord;
      await saveFigure(data as Figure, body);
      break;
    }
    case 'update': {
      const { body = '', ...data } = record as UpdateRecord;
      await saveUpdate(data as Update, body);
      break;
    }
    default:
      break;
  }
}

function normalizeId(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const stringValue = String(value).trim();
  return stringValue.length ? stringValue : null;
}

function numberEquals(a: unknown, b: unknown): boolean {
  return Number(a) === Number(b);
}

function formatStoryReference(story: Story): string {
  const ideaNumber = Array.isArray(story.related_ideas) && story.related_ideas.length
    ? story.related_ideas[0]
    : 0;
  return `${ideaNumber}.${story.story_number}`;
}

function storyReferenceEquals(a: unknown, b: unknown): boolean {
  const parsedA = parseStoryReference(String(a));
  const parsedB = parseStoryReference(String(b));
  if (!parsedA || !parsedB) {
    return String(a) === String(b);
  }
  return parsedA.story === parsedB.story;
}

function mapStoryRefToStoryId(value: unknown): string | null {
  const parsed = parseStoryReference(String(value));
  if (!parsed) return null;
  return String(parsed.story);
}

function parseStoryReference(ref: string): { idea: number; story: number } | null {
  const [ideaPart, storyPart] = ref.split('.');
  if (ideaPart === undefined || storyPart === undefined) return null;
  const idea = Number(ideaPart);
  const story = Number(storyPart);
  if (Number.isNaN(idea) || Number.isNaN(story)) return null;
  return { idea, story };
}

function formatUpdateId(update: Update | UpdateRecord): string {
  if (update.notation && update.notation.trim().length) {
    return update.notation;
  }
  return `${update.sprint_id}.${update.idea_number}.${update.story_number}`;
}

function getNoteSlug(note: NoteRecord): string {
  if (note.slug?.trim()) {
    return note.slug.trim();
  }
  if (note.filename?.trim()) {
    return note.filename.replace(/\.md$/, '');
  }
  if (note.title?.trim()) {
    return note.title.trim().toLowerCase().replace(/\s+/g, '-');
  }
  return `note-${note.date ?? Date.now()}`;
}

