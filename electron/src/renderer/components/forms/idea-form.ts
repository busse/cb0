import type { Idea, IdeaRecord, IdeaStatus } from '@shared/types';

import { IDEA_STATUSES } from '../../constants';
import {
  ensureStories,
  ensureSprints,
  ensureNotes,
  ensureFigures,
  ensureUpdates,
  fetchIdeas,
  fetchStories,
  fetchSprints,
  fetchNotes,
  fetchFigures,
  fetchUpdates,
  getNextIdeaNumber,
  saveIdea,
} from '../../api';
import { renderIdeas } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { state } from '../../state';
import { escapeAttr, escapeHtml, parseTags, today } from '../../utils/dom';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';
import { refreshRelationshipsSidebar } from '../relationships';

export async function openIdeaForm(mode: 'create' | 'edit', idea?: IdeaRecord): Promise<void> {
  if (mode === 'edit' && !idea) {
    showError('Unable to find that idea.');
    return;
  }

  let ideaNumber = idea?.idea_number;
  if (ideaNumber === undefined) {
    try {
      ideaNumber = await getNextIdeaNumber();
    } catch (error) {
      showError((error as Error).message);
      return;
    }
  }

  if (ideaNumber === undefined) {
    showError('Unable to determine next idea number.');
    return;
  }

  await Promise.all([ensureStories(), ensureSprints(), ensureNotes(), ensureFigures(), ensureUpdates()]);
  const storyOptions = state.stories;
  const sprintOptions = state.sprints;
  const noteOptions = state.notes;
  const figureOptions = state.figures;
  const updateOptions = state.updates;
  const resolvedIdeaNumber = ideaNumber as number;

  const derivedStorySelections =
    idea?.related_stories ??
    storyOptions
      .filter((story) => story.related_ideas.includes(resolvedIdeaNumber))
      .map((story) => story.story_number);

  const storiesMultiSelect = createMultiSelect({
    name: 'related_stories',
    options: storyOptions.map((story) => ({
      value: String(story.story_number),
      label: `s${story.story_number} — ${escapeHtml(story.title || 'Untitled')}`,
    })),
    selected: derivedStorySelections.map(String),
    placeholder: storyOptions.length ? 'Search stories...' : 'No stories available',
  });

  const sprintsMultiSelect = createMultiSelect({
    name: 'related_sprints',
    options: sprintOptions.map((sprint) => ({
      value: sprint.sprint_id,
      label: `${sprint.sprint_id} — Sprint ${sprint.sprint_number}`,
    })),
    selected: idea?.related_sprints ?? [],
    placeholder: 'Search sprints...',
  });

  const notesMultiSelect = createMultiSelect({
    name: 'related_notes',
    options: noteOptions
      .filter((note) => (note.slug ?? note.filename)?.length)
      .map((note) => {
        const value = note.slug ?? note.filename?.replace(/\.md$/, '') ?? '';
        return {
          value,
          label: `${note.title || value}`,
        };
      }),
    selected: idea?.related_notes ?? [],
    placeholder: 'Search notes...',
  });

  const figuresMultiSelect = createMultiSelect({
    name: 'related_figures',
    options: figureOptions.map((figure) => ({
      value: String(figure.figure_number),
      label: `fig_${figure.figure_number} — ${escapeHtml(figure.title || 'Untitled')}`,
    })),
    selected: idea?.related_figures?.map(String) ?? [],
    placeholder: 'Search figures...',
  });

  const updatesMultiSelect = createMultiSelect({
    name: 'related_updates',
    options: updateOptions.map((update) => ({
      value: update.notation,
      label: `${update.notation} (${update.type})`,
    })),
    selected: idea?.related_updates ?? [],
    placeholder: 'Search updates...',
  });

  const defaults = {
    title: idea?.title ?? '',
    description: idea?.description ?? '',
    status: idea?.status ?? 'planned',
    created: idea?.created ?? today(),
    tags: idea?.tags?.join(', ') ?? '',
    body: idea?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Idea' : `Edit Idea i${idea?.idea_number}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Idea' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Idea Number</label>
          <input type="number" name="idea_number" value="${ideaNumber}" ${
      mode === 'edit' ? 'readonly' : 'min="0"'
    } required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${IDEA_STATUSES.map(
              (status) => `<option value="${status}" ${status === defaults.status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${defaults.created}" required />
        </div>
        <div class="form-field">
          <label>Tags (comma separated)</label>
          <input type="text" name="tags" value="${escapeAttr(defaults.tags)}" placeholder="meta, design" />
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${escapeAttr(defaults.title)}" placeholder="Idea title" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" required placeholder="Describe the intent">${escapeHtml(
          defaults.description
        )}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" placeholder="Additional markdown content">${escapeHtml(defaults.body)}</textarea>
      </div>
      <section class="form-section">
        <h2 class="form-section__title">Relationships</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Stories</label>
            ${storiesMultiSelect.html}
            <div class="helper-text">Stories selected here will include this idea automatically.</div>
          </div>
          <div class="form-field">
            <label>Sprints</label>
            ${sprintsMultiSelect.html}
            <div class="helper-text">Link sprints that track this idea.</div>
          </div>
          <div class="form-field">
            <label>Notes</label>
            ${notesMultiSelect.html}
            <div class="helper-text">Attach research or planning notes.</div>
          </div>
          <div class="form-field">
            <label>Figures</label>
            ${figuresMultiSelect.html}
            <div class="helper-text">Reference supporting figures.</div>
          </div>
          <div class="form-field">
            <label>Updates</label>
            ${updatesMultiSelect.html}
            <div class="helper-text">Connect progress updates to this idea.</div>
          </div>
        </div>
      </section>
    `,
    onOpen: (form) => {
      storiesMultiSelect.init(form);
      sprintsMultiSelect.init(form);
      notesMultiSelect.init(form);
      figuresMultiSelect.init(form);
      updatesMultiSelect.init(form);
    },
    onSubmit: async (formData) => {
      const getNumberSelections = (name: string) =>
        Array.from(
          new Set(
            formData
              .getAll(name)
              .map((value) => Number(value))
              .filter((num) => !Number.isNaN(num))
          )
        );
      const getStringSelections = (name: string) =>
        Array.from(
          new Set(
            formData
              .getAll(name)
              .map((value) => String(value).trim())
              .filter(Boolean)
          )
        );

      const relatedStories = getNumberSelections('related_stories');
      const relatedFigures = getNumberSelections('related_figures');
      const relatedSprints = getStringSelections('related_sprints');
      const relatedNotes = getStringSelections('related_notes');
      const relatedUpdates = getStringSelections('related_updates');

      const payload: Idea = {
        layout: 'idea',
        idea_number: Number(formData.get('idea_number')),
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string).trim(),
        status: formData.get('status') as IdeaStatus,
        created: formData.get('created') as string,
        tags: parseTags(formData.get('tags') as string),
        related_stories: relatedStories.length ? relatedStories : undefined,
        related_figures: relatedFigures.length ? relatedFigures : undefined,
        related_sprints: relatedSprints.length ? relatedSprints : undefined,
        related_notes: relatedNotes.length ? relatedNotes : undefined,
        related_updates: relatedUpdates.length ? relatedUpdates : undefined,
      };

      const content = (formData.get('body') as string) ?? '';
      await saveIdea(payload, content);

      const ideaRecord: IdeaRecord = {
        ...payload,
        body: content,
      };

      await syncRelationships('idea', ideaRecord);
      await Promise.all([fetchStories(), fetchSprints(), fetchNotes(), fetchFigures(), fetchUpdates()]);
      await fetchIdeas();
      renderIdeas();
      refreshRelationshipsSidebar('ideas');
      // Also refresh related tabs' sidebars
      refreshRelationshipsSidebar('stories');
      refreshRelationshipsSidebar('sprints');
      showToast(mode === 'create' ? 'Idea created' : 'Idea updated');
      return true;
    },
  });
}


