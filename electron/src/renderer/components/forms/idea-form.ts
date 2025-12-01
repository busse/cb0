import type { Idea, IdeaRecord, IdeaStatus, Story } from '@shared/types';

import { IDEA_STATUSES } from '../../constants';
import {
  ensureStories,
  fetchIdeas,
  fetchStories,
  getNextIdeaNumber,
  saveIdea,
  saveStory,
} from '../../api';
import { renderIdeas } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { state } from '../../state';
import { escapeAttr, escapeHtml, parseTags, today } from '../../utils/dom';

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

  await ensureStories();
  const storyOptions = state.stories;
  const relatedStoryNumbers = storyOptions
    .filter((story) => (story.related_ideas ?? []).includes(ideaNumber as number))
    .map((story) => story.story_number);

  const relatedStoriesField = `
    <div class="form-field">
      <label>Related Stories</label>
      ${
        storyOptions.length
          ? `<select name="related_stories" multiple size="6">
              ${storyOptions
                .map((story) => {
                  const labelIdeas = (story.related_ideas ?? [])
                    .map((id) => `i${id}`)
                    .join(', ');
                  return `<option value="${story.story_number}" ${
                    relatedStoryNumbers.includes(story.story_number) ? 'selected' : ''
                  }>s${story.story_number} — ${escapeHtml(story.title || 'Untitled')} ${
                    labelIdeas ? `(${labelIdeas})` : ''
                  }</option>`;
                })
                .join('')}
            </select>
            <div class="helper-text">Stories selected here will include this idea relationship.</div>`
          : '<div class="helper-text">No stories available yet. Create a story to link it to this idea.</div>'
      }
    </div>
  `;

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
      ${relatedStoriesField}
    `,
    onSubmit: async (formData) => {
      const payload: Idea = {
        layout: 'idea',
        idea_number: Number(formData.get('idea_number')),
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string).trim(),
        status: formData.get('status') as IdeaStatus,
        created: formData.get('created') as string,
        tags: parseTags(formData.get('tags') as string),
      };

      const content = (formData.get('body') as string) ?? '';
      await saveIdea(payload, content);
      const selectedStoryNumbers = new Set<number>(
        formData
          .getAll('related_stories')
          .filter((value): value is string => typeof value === 'string')
          .map((value) => Number(value))
      );

      const storyUpdatePromises: Promise<void>[] = [];
      for (const storyRecord of state.stories) {
        const currentIdeas = Array.isArray(storyRecord.related_ideas)
          ? storyRecord.related_ideas
          : [];
        const hasIdea = currentIdeas.includes(payload.idea_number);
        const shouldHave = selectedStoryNumbers.has(storyRecord.story_number);
        if (hasIdea === shouldHave) {
          continue;
        }

        const nextRelatedIdeas = shouldHave
          ? Array.from(new Set([...currentIdeas, payload.idea_number]))
          : currentIdeas.filter((id) => id !== payload.idea_number);

        const updatedStory: Story = {
          layout: 'story',
          story_number: storyRecord.story_number,
          title: storyRecord.title,
          description: storyRecord.description,
          status: storyRecord.status,
          priority: storyRecord.priority,
          created: storyRecord.created,
          related_ideas: nextRelatedIdeas,
          related_sprints: storyRecord.related_sprints,
        };

        storyUpdatePromises.push(saveStory(updatedStory, storyRecord.body ?? ''));
      }

      if (storyUpdatePromises.length) {
        await Promise.all(storyUpdatePromises);
        await fetchStories();
      }

      await fetchIdeas();
      renderIdeas();
      showToast(mode === 'create' ? 'Idea created' : 'Idea updated');
      return true;
    },
  });
}


