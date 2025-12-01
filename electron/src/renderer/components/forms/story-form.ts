import type { Story, StoryRecord, StoryPriority, StoryStatus } from '@shared/types';

import {
  STORY_PRIORITIES,
  STORY_STATUSES,
} from '../../constants';
import { ensureIdeas, ensureSprints, fetchStories, getNextStoryNumber, saveStory } from '../../api';
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

  let storyNumber = story?.story_number;
  if (storyNumber === undefined) {
    try {
      storyNumber = await getNextStoryNumber();
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
    related_ideas:
      story?.related_ideas && story.related_ideas.length
        ? story.related_ideas
        : [ideaOptions[0].idea_number],
    related_sprints: story?.related_sprints ?? [],
    body: story?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Story' : `Edit Story s${story?.story_number}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Story' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Ideas</label>
          <select name="related_ideas" multiple size="5" required>
            ${ideaOptions
              .map(
                (idea) =>
                  `<option value="${idea.idea_number}" ${
                    defaults.related_ideas.includes(idea.idea_number) ? 'selected' : ''
                  }>i${idea.idea_number} — ${escapeHtml(idea.title)}</option>`
              )
              .join('')}
          </select>
          <div class="helper-text">Select one or more ideas (Cmd/Ctrl-click for multi-select).</div>
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
          <label>Sprints</label>
          <select name="related_sprints" multiple size="5">
            ${state.sprints
              .map(
                (sprint) =>
                  `<option value="${sprint.sprint_id}" ${
                    defaults.related_sprints.includes(sprint.sprint_id) ? 'selected' : ''
                  }>${sprint.sprint_id} (${sprint.start_date} → ${sprint.end_date})</option>`
              )
              .join('')}
          </select>
          <div class="helper-text">Select sprints to associate (leave empty for backlog).</div>
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
    onOpen: () => undefined,
    onSubmit: async (formData) => {
      const relatedIdeas = formData.getAll('related_ideas').map((value) => Number(value));
      const relatedSprints = formData.getAll('related_sprints').map((value) => String(value));
      const payload: Story = {
        layout: 'story',
        story_number: Number(formData.get('story_number')),
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string).trim(),
        status: formData.get('status') as StoryStatus,
        priority: formData.get('priority') as StoryPriority,
        created: formData.get('created') as string,
        related_ideas: relatedIdeas,
        related_sprints: relatedSprints.length ? relatedSprints : undefined,
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


