import type { Sprint, SprintRecord, SprintStatus } from '@shared/types';

import { SPRINT_STATUSES } from '../../constants';
import {
  ensureIdeas,
  ensureStories,
  ensureNotes,
  ensureFigures,
  ensureUpdates,
  fetchIdeas,
  fetchSprints,
  fetchStories,
  fetchNotes,
  fetchFigures,
  fetchUpdates,
  saveSprint,
} from '../../api';
import { renderSprints } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { state } from '../../state';
import { escapeAttr, escapeHtml, parseLines, today } from '../../utils/dom';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';

export async function openSprintForm(mode: 'create' | 'edit', sprint?: SprintRecord): Promise<void> {
  if (mode === 'edit' && !sprint) {
    showError('Unable to find that sprint.');
    return;
  }

  const defaults = {
    sprint_id: sprint?.sprint_id ?? '',
    year: sprint?.year ?? new Date().getFullYear(),
    sprint_number: sprint?.sprint_number ?? 1,
    status: sprint?.status ?? 'planned',
    start_date: sprint?.start_date ?? today(),
    end_date: sprint?.end_date ?? today(),
    goals: sprint?.goals?.join('\n') ?? '',
    related_ideas: sprint?.related_ideas ?? [],
    related_stories: sprint?.related_stories ?? [],
    related_notes: sprint?.related_notes ?? [],
    related_figures: sprint?.related_figures ?? [],
    related_updates: sprint?.related_updates ?? [],
    body: sprint?.body ?? '',
  };

  await Promise.all([ensureIdeas(), ensureStories(), ensureNotes(), ensureFigures(), ensureUpdates()]);
  const ideaOptions = state.ideas;
  const storyOptions = state.stories;
  const noteOptions = state.notes;
  const figureOptions = state.figures;
  const updateOptions = state.updates;
  const relatedStoryNumbers =
    defaults.related_stories.length
      ? defaults.related_stories
      : defaults.sprint_id
        ? storyOptions
            .filter((story) => (story.related_sprints ?? []).includes(defaults.sprint_id))
            .map((story) => story.story_number)
        : [];

  const ideasMultiSelect = createMultiSelect({
    name: 'related_ideas',
    options: ideaOptions.map((idea) => ({
      value: String(idea.idea_number),
      label: `i${idea.idea_number} — ${idea.title}`,
    })),
    selected: defaults.related_ideas.map(String),
    placeholder: 'Search ideas...',
    required: false,
  });

  const storiesMultiSelect = createMultiSelect({
    name: 'related_stories',
    options: storyOptions.map((story) => {
      const ideasLabel = (story.related_ideas ?? []).map((id) => `i${id}`).join(', ');
      return {
        value: String(story.story_number),
        label: `s${story.story_number} — ${story.title || 'Untitled'}${ideasLabel ? ` (${ideasLabel})` : ''}`,
      };
    }),
    selected: relatedStoryNumbers.map(String),
    placeholder: storyOptions.length ? 'Search stories...' : 'No stories available',
    required: false,
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
    selected: defaults.related_notes,
    placeholder: 'Search notes...',
    required: false,
  });

  const figuresMultiSelect = createMultiSelect({
    name: 'related_figures',
    options: figureOptions.map((figure) => ({
      value: String(figure.figure_number),
      label: `fig_${figure.figure_number} — ${figure.title || 'Untitled'}`,
    })),
    selected: defaults.related_figures.map((figure) => String(figure)),
    placeholder: 'Search figures...',
    required: false,
  });

  const updatesMultiSelect = createMultiSelect({
    name: 'related_updates',
    options: updateOptions.map((update) => ({
      value: update.notation,
      label: `${update.notation} (${update.type})`,
    })),
    selected: defaults.related_updates,
    placeholder: 'Search updates...',
    required: false,
  });

  openModal({
    title: mode === 'create' ? 'Create Sprint' : `Edit Sprint ${sprint?.sprint_id}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Sprint' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint ID (YYSS)</label>
          <input type="text" name="sprint_id" value="${escapeAttr(defaults.sprint_id)}" pattern="\\d{4}" required />
        </div>
        <div class="form-field">
          <label>Year</label>
          <input type="number" name="year" value="${defaults.year}" min="2000" max="2100" required />
        </div>
        <div class="form-field">
          <label>Sprint Number (1-26)</label>
          <input type="number" name="sprint_number" value="${defaults.sprint_number}" min="1" max="26" required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${SPRINT_STATUSES.map(
              (status) => `<option value="${status}" ${status === defaults.status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Start Date</label>
          <input type="date" name="start_date" value="${defaults.start_date}" required />
        </div>
        <div class="form-field">
          <label>End Date</label>
          <input type="date" name="end_date" value="${defaults.end_date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Goals (one per line)</label>
        <textarea name="goals" rows="4">${escapeHtml(defaults.goals)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" rows="6">${escapeHtml(defaults.body)}</textarea>
      </div>
      <section class="form-section">
        <h2 class="form-section__title">Relationships</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Ideas</label>
            ${ideasMultiSelect.html}
            <div class="helper-text">Ideas influenced or delivered in this sprint.</div>
          </div>
          <div class="form-field">
            <label>Stories</label>
            ${storiesMultiSelect.html}
            <div class="helper-text">Assign stories to this sprint.</div>
          </div>
          <div class="form-field">
            <label>Notes</label>
            ${notesMultiSelect.html}
            <div class="helper-text">Link sprint notes or planning docs.</div>
          </div>
          <div class="form-field">
            <label>Figures</label>
            ${figuresMultiSelect.html}
            <div class="helper-text">Reference supporting figures.</div>
          </div>
          <div class="form-field">
            <label>Updates</label>
            ${updatesMultiSelect.html}
            <div class="helper-text">Connect progress updates to this sprint.</div>
          </div>
        </div>
      </section>
    `,
    onOpen: (form) => {
      ideasMultiSelect.init(form);
      storiesMultiSelect.init(form);
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

      const payload: Sprint = {
        layout: 'sprint',
        sprint_id: (formData.get('sprint_id') as string).trim(),
        year: Number(formData.get('year')),
        sprint_number: Number(formData.get('sprint_number')),
        status: formData.get('status') as SprintStatus,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        goals: parseLines(formData.get('goals') as string),
        related_ideas: getNumberSelections('related_ideas'),
        related_stories: getNumberSelections('related_stories'),
        related_notes: getStringSelections('related_notes'),
        related_figures: getNumberSelections('related_figures'),
        related_updates: getStringSelections('related_updates'),
      };
      const content = (formData.get('body') as string) ?? '';

      await saveSprint(payload, content);

      const sprintRecord: SprintRecord = {
        ...payload,
        body: content,
      };

      await syncRelationships('sprint', sprintRecord);
      await Promise.all([fetchIdeas(), fetchStories(), fetchNotes(), fetchFigures(), fetchUpdates()]);
      await fetchSprints();
      renderSprints();
      showToast(mode === 'create' ? 'Sprint created' : 'Sprint updated');
      return true;
    },
  });
}


