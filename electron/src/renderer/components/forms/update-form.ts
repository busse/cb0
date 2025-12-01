import type { Update, UpdateRecord, UpdateType } from '@shared/types';

import { UPDATE_TYPES } from '../../constants';
import {
  ensureIdeas,
  ensureSprints,
  ensureStories,
  fetchUpdates,
  saveUpdate,
} from '../../api';
import { state } from '../../state';
import { renderUpdates } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { escapeHtml, today } from '../../utils/dom';
import { formatNotation } from '../../utils/format';
import { buildStoryOptions } from './helpers';

export async function openUpdateForm(mode: 'create' | 'edit', update?: UpdateRecord): Promise<void> {
  if (mode === 'edit' && !update) {
    showError('Unable to find that update.');
    return;
  }

  await ensureSprints();
  await ensureIdeas();
  await ensureStories();

  if (!state.sprints.length) {
    showError('Create a sprint before adding updates.');
    return;
  }
  if (!state.stories.length) {
    showError('Create a story before adding updates.');
    return;
  }

  const defaults = {
    sprint_id: update?.sprint_id ?? state.sprints[0].sprint_id,
    idea_number: update?.idea_number ?? state.stories[0].idea_number,
    story_number: update?.story_number ?? state.stories[0].story_number,
    type: update?.type ?? 'progress',
    date: update?.date ?? today(),
    body: update?.body ?? '',
  };

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

      const payload: Update = {
        layout: 'update',
        sprint_id: sprintId,
        idea_number: ideaNumber,
        story_number: storyNumber,
        type: formData.get('type') as UpdateType,
        date: formData.get('date') as string,
        notation: formatNotation(sprintId, ideaNumber, storyNumber),
      };

      const content = (formData.get('body') as string) ?? '';
      await saveUpdate(payload, content);
      await fetchUpdates();
      renderUpdates();
      showToast(mode === 'create' ? 'Update created' : 'Update updated');
      return true;
    },
  });
}


