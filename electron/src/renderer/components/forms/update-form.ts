import type { Update, UpdateRecord, UpdateType } from '@shared/types';

import { UPDATE_TYPES } from '../../constants';
import {
  ensureIdeas,
  ensureSprints,
  ensureStories,
  ensureNotes,
  ensureFigures,
  fetchIdeas,
  fetchSprints,
  fetchStories,
  fetchNotes,
  fetchFigures,
  fetchUpdates,
  saveUpdate,
} from '../../api';
import { state } from '../../state';
import { renderUpdates } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { escapeHtml, today } from '../../utils/dom';
import { formatNotation } from '../../utils/format';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';
import { buildStoryOptions } from './helpers';

export async function openUpdateForm(mode: 'create' | 'edit', update?: UpdateRecord): Promise<void> {
  if (mode === 'edit' && !update) {
    showError('Unable to find that update.');
    return;
  }

  await ensureSprints();
  await ensureIdeas();
  await ensureStories();
  await ensureNotes();
  await ensureFigures();

  if (!state.sprints.length) {
    showError('Create a sprint before adding updates.');
    return;
  }
  if (!state.stories.length) {
    showError('Create a story before adding updates.');
    return;
  }

  const fallbackIdeaFromStory = state.stories[0]?.related_ideas[0];
  const defaultIdeaNumber =
    update?.idea_number ?? fallbackIdeaFromStory ?? state.ideas[0].idea_number;
  const defaultStoryNumber =
    update?.story_number ??
    state.stories.find((story) => story.related_ideas.includes(defaultIdeaNumber))?.story_number ??
    state.stories[0].story_number;

  const defaults = {
    sprint_id: update?.sprint_id ?? state.sprints[0].sprint_id,
    idea_number: defaultIdeaNumber,
    story_number: defaultStoryNumber,
    type: update?.type ?? 'progress',
    date: update?.date ?? today(),
    body: update?.body ?? '',
    related_ideas: update?.related_ideas ?? [],
    related_stories: update?.related_stories ?? [],
    related_sprints: update?.related_sprints ?? [],
    related_notes: update?.related_notes ?? [],
    related_figures: update?.related_figures ?? [],
  };

  const ideaOptions = state.ideas;
  const storyOptions = state.stories;
  const sprintOptions = state.sprints;
  const noteOptions = state.notes;
  const figureOptions = state.figures;

  const relatedIdeasMultiSelect = createMultiSelect({
    name: 'related_ideas',
    options: ideaOptions.map((idea) => ({
      value: String(idea.idea_number),
      label: `i${idea.idea_number} — ${idea.title}`,
    })),
    selected: defaults.related_ideas.map(String),
    placeholder: 'Additional ideas...',
    required: false,
  });

  const relatedStoriesMultiSelect = createMultiSelect({
    name: 'related_stories',
    options: storyOptions.map((story) => ({
      value: String(story.story_number),
      label: `s${story.story_number} — ${story.title || 'Untitled'}`,
    })),
    selected: defaults.related_stories.map(String),
    placeholder: 'Additional stories...',
    required: false,
  });

  const relatedSprintsMultiSelect = createMultiSelect({
    name: 'related_sprints',
    options: sprintOptions.map((sprint) => ({
      value: sprint.sprint_id,
      label: `${sprint.sprint_id} — Sprint ${sprint.sprint_number}`,
    })),
    selected: defaults.related_sprints,
    placeholder: 'Additional sprints...',
    required: false,
  });

  const relatedNotesMultiSelect = createMultiSelect({
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
    selected: defaults.related_notes,
    placeholder: 'Attach notes...',
    required: false,
  });

  const relatedFiguresMultiSelect = createMultiSelect({
    name: 'related_figures',
    options: figureOptions.map((figure) => ({
      value: String(figure.figure_number),
      label: `fig_${figure.figure_number} — ${figure.title || 'Untitled'}`,
    })),
    selected: defaults.related_figures.map((figure) => String(figure)),
    placeholder: 'Attach figures...',
    required: false,
  });

  openModal({
    title: mode === 'create' ? 'Create Update' : `Edit Update ${update?.notation}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Update' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint</label>
          <select name="sprint_id" required>
            ${state.sprints
              .map(
                (sprint) =>
                  `<option value="${sprint.sprint_id}" ${
                    sprint.sprint_id === defaults.sprint_id ? 'selected' : ''
                  }>${sprint.sprint_id} (${sprint.start_date} → ${sprint.end_date})</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${state.ideas
              .map(
                (idea) =>
                  `<option value="${idea.idea_number}" ${
                    idea.idea_number === defaults.idea_number ? 'selected' : ''
                  }>i${idea.idea_number} — ${escapeHtml(idea.title)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Story</label>
          <select name="story_number" required data-story-select>
            ${buildStoryOptions(defaults.idea_number, defaults.story_number)}
          </select>
        </div>
        <div class="form-field">
          <label>Type</label>
          <select name="type" required>
            ${UPDATE_TYPES.map(
              (type) => `<option value="${type}" ${type === defaults.type ? 'selected' : ''}>${type}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Date</label>
          <input type="date" name="date" value="${defaults.date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Notation</label>
        <input type="text" name="notation" value="${formatNotation(
          defaults.sprint_id,
          defaults.idea_number,
          defaults.story_number
        )}" readonly data-notation />
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${escapeHtml(defaults.body)}</textarea>
      </div>
      <section class="form-section">
        <h2 class="form-section__title">Additional Relationships</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Ideas</label>
            ${relatedIdeasMultiSelect.html}
          </div>
          <div class="form-field">
            <label>Stories</label>
            ${relatedStoriesMultiSelect.html}
          </div>
          <div class="form-field">
            <label>Sprints</label>
            ${relatedSprintsMultiSelect.html}
          </div>
          <div class="form-field">
            <label>Notes</label>
            ${relatedNotesMultiSelect.html}
          </div>
          <div class="form-field">
            <label>Figures</label>
            ${relatedFiguresMultiSelect.html}
          </div>
        </div>
      </section>
    `,
    onOpen: (form) => {
      const sprintSelect = form.querySelector<HTMLSelectElement>('select[name="sprint_id"]');
      const ideaSelect = form.querySelector<HTMLSelectElement>('select[name="idea_number"]');
      const storySelect = form.querySelector<HTMLSelectElement>('select[name="story_number"]');
      const notationInput = form.querySelector<HTMLInputElement>('input[data-notation]');

      const updateStoryOptions = (preserveSelection: boolean) => {
        if (!ideaSelect || !storySelect) return;
        const ideaNumber = Number(ideaSelect.value);
        const selectedValue = preserveSelection ? Number(storySelect.value) : undefined;
        storySelect.innerHTML = buildStoryOptions(ideaNumber, selectedValue);
        if (!preserveSelection) {
          const firstOption = storySelect.querySelector('option');
          if (firstOption) {
            storySelect.value = firstOption.value;
          }
        }
      };

      const updateNotation = () => {
        if (!notationInput || !sprintSelect || !ideaSelect || !storySelect) return;
        notationInput.value = formatNotation(
          sprintSelect.value,
          Number(ideaSelect.value),
          Number(storySelect.value)
        );
      };

      ideaSelect?.addEventListener('change', () => {
        updateStoryOptions(false);
        updateNotation();
      });
      sprintSelect?.addEventListener('change', updateNotation);
      storySelect?.addEventListener('change', updateNotation);

      updateStoryOptions(true);
      updateNotation();
      relatedIdeasMultiSelect.init(form);
      relatedStoriesMultiSelect.init(form);
      relatedSprintsMultiSelect.init(form);
      relatedNotesMultiSelect.init(form);
      relatedFiguresMultiSelect.init(form);
    },
    onSubmit: async (formData) => {
      const sprintId = formData.get('sprint_id') as string;
      const ideaValue = formData.get('idea_number') as string;
      const storyValue = formData.get('story_number') as string;

      if (!ideaValue) {
        throw new Error('Select an idea for this update.');
      }
      if (!storyValue) {
        throw new Error('Select a story for this update.');
      }

      const ideaNumber = Number(ideaValue);
      const storyNumber = Number(storyValue);

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

      const payload: Update = {
        layout: 'update',
        sprint_id: sprintId,
        idea_number: ideaNumber,
        story_number: storyNumber,
        type: formData.get('type') as UpdateType,
        date: formData.get('date') as string,
        notation: formatNotation(sprintId, ideaNumber, storyNumber),
        related_ideas: getNumberSelections('related_ideas'),
        related_stories: getNumberSelections('related_stories'),
        related_sprints: getStringSelections('related_sprints'),
        related_notes: getStringSelections('related_notes'),
        related_figures: getNumberSelections('related_figures'),
      };

      const content = (formData.get('body') as string) ?? '';
      await saveUpdate(payload, content);
      const updateRecord: UpdateRecord = {
        ...payload,
        body: content,
      };
      await syncRelationships('update', updateRecord);
      await Promise.all([fetchIdeas(), fetchStories(), fetchSprints(), fetchNotes(), fetchFigures(), fetchUpdates()]);
      renderUpdates();
      showToast(mode === 'create' ? 'Update created' : 'Update updated');
      return true;
    },
  });
}


