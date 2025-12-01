import type { Story, StoryRecord, StoryPriority, StoryStatus } from '@shared/types';

import {
  STORY_PRIORITIES,
  STORY_STATUSES,
} from '../../constants';
import {
  ensureIdeas,
  ensureSprints,
  fetchStories,
  getNextStoryNumber,
  saveStory,
} from '../../api';
import { state } from '../../state';
import { renderStories } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { escapeAttr, escapeHtml, today } from '../../utils/dom';

export async function openStoryForm(mode: 'create' | 'edit', story?: StoryRecord): Promise<void> {
  if (mode === 'edit' && !story) {
    showError('Unable to find that story.');
    return;
  }

  await ensureIdeas();
  await ensureSprints();

  const ideaOptions = state.ideas;
  if (!ideaOptions.length) {
    showError('Create an idea before adding stories.');
    return;
  }

  const defaultIdeaNumber = story?.idea_number ?? ideaOptions[0].idea_number;
  let storyNumber = story?.story_number;
  if (storyNumber === undefined) {
    try {
      storyNumber = await getNextStoryNumber(defaultIdeaNumber);
    } catch (error) {
      showError((error as Error).message);
      return;
    }
  }

  const defaults = {
    title: story?.title ?? '',
    description: story?.description ?? '',
    status: story?.status ?? 'backlog',
    priority: story?.priority ?? 'medium',
    created: story?.created ?? today(),
    assigned_sprint: story?.assigned_sprint ?? '',
    body: story?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Story' : `Edit Story ${story?.idea_number}.${story?.story_number}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Story' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${ideaOptions
              .map(
                (idea) =>
                  `<option value="${idea.idea_number}" ${
                    idea.idea_number === defaultIdeaNumber ? 'selected' : ''
                  }>i${idea.idea_number} — ${escapeHtml(idea.title)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Story Number</label>
          <input type="number" name="story_number" min="0" value="${storyNumber}" ${
            mode === 'edit' ? 'readonly' : ''
          } required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${STORY_STATUSES.map(
              (status) => `<option value="${status}" ${status === defaults.status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Priority</label>
          <select name="priority" required>
            ${STORY_PRIORITIES.map(
              (priority) =>
                `<option value="${priority}" ${priority === defaults.priority ? 'selected' : ''}>${priority}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${defaults.created}" required />
        </div>
        <div class="form-field">
          <label>Assigned Sprint</label>
          <select name="assigned_sprint">
            <option value="">Backlog</option>
            ${state.sprints
              .map(
                (sprint) =>
                  `<option value="${sprint.sprint_id}" ${
                    sprint.sprint_id === defaults.assigned_sprint ? 'selected' : ''
                  }>${sprint.sprint_id} (${sprint.start_date} → ${sprint.end_date})</option>`
              )
              .join('')}
          </select>
          <div class="helper-text">Leave blank to keep in backlog.</div>
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${escapeAttr(defaults.title)}" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" required placeholder="As a … I want … so that …">${escapeHtml(
          defaults.description
        )}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${escapeHtml(defaults.body)}</textarea>
      </div>
    `,
    onOpen: (form) => {
      if (mode === 'create') {
        const ideaSelect = form.querySelector<HTMLSelectElement>('select[name="idea_number"]');
        const storyNumberInput = form.querySelector<HTMLInputElement>('input[name="story_number"]');
        ideaSelect?.addEventListener('change', async () => {
          if (!storyNumberInput) return;
          storyNumberInput.value = '…';
          try {
            const next = await getNextStoryNumber(Number(ideaSelect.value));
            storyNumberInput.value = next.toString();
          } catch (error) {
            showError((error as Error).message);
            storyNumberInput.value = '';
          }
        });
      }
    },
    onSubmit: async (formData) => {
      const assignedSprintValue = (formData.get('assigned_sprint') as string) || '';
      const payload: Story = {
        layout: 'story',
        idea_number: Number(formData.get('idea_number')),
        story_number: Number(formData.get('story_number')),
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string).trim(),
        status: formData.get('status') as StoryStatus,
        priority: formData.get('priority') as StoryPriority,
        created: formData.get('created') as string,
        assigned_sprint: assignedSprintValue || undefined,
      };
      const content = (formData.get('body') as string) ?? '';

      await saveStory(payload, content);
      await fetchStories();
      renderStories();
      showToast(mode === 'create' ? 'Story created' : 'Story updated');
      return true;
    },
  });
}


