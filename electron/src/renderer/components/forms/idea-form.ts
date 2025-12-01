import type { Idea, IdeaRecord, IdeaStatus } from '@shared/types';

import { IDEA_STATUSES } from '../../constants';
import { fetchIdeas, getNextIdeaNumber, saveIdea } from '../../api';
import { renderIdeas } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
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
          <input type="number" name="idea_number" value="${ideaNumber}" ${mode === 'edit' ? 'readonly' : 'min="0"'} required />
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
      await fetchIdeas();
      renderIdeas();
      showToast(mode === 'create' ? 'Idea created' : 'Idea updated');
      return true;
    },
  });
}


