import type { Note, NoteRecord } from '@shared/types';
import { slugify } from '@shared/strings';

import { fetchNotes, saveNote } from '../../api';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { renderNotes } from '../lists';
import { escapeAttr, escapeHtml, parseTags, today } from '../../utils/dom';

export async function openNoteForm(mode: 'create' | 'edit', note?: NoteRecord): Promise<void> {
  if (mode === 'edit' && !note) {
    showError('Unable to find that note.');
    return;
  }

  const defaults = {
    title: note?.title ?? '',
    slug: note?.slug ?? slugify(note?.title ?? ''),
    date: note?.date ?? today(),
    author: note?.author ?? '',
    tags: note?.tags?.join(', ') ?? '',
    excerpt: note?.excerpt ?? '',
    body: note?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Note' : `Edit Note ${note?.slug}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Note' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Title</label>
          <input type="text" name="title" value="${escapeAttr(defaults.title)}" required />
        </div>
        <div class="form-field">
          <label>Slug</label>
          <input type="text" name="slug" value="${escapeAttr(defaults.slug)}" required placeholder="note-title" />
          <div class="helper-text">Lowercase letters, numbers, and dashes only.</div>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Date</label>
          <input type="date" name="date" value="${defaults.date}" required />
        </div>
        <div class="form-field">
          <label>Author</label>
          <input type="text" name="author" value="${escapeAttr(defaults.author)}" placeholder="Optional" />
        </div>
      </div>
      <div class="form-field">
        <label>Tags (comma separated)</label>
        <input type="text" name="tags" value="${escapeAttr(defaults.tags)}" placeholder="note, design" />
      </div>
      <div class="form-field">
        <label>Excerpt</label>
        <textarea name="excerpt" placeholder="Short summary (optional)">${escapeHtml(defaults.excerpt)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" placeholder="Long-form markdown content">${escapeHtml(defaults.body)}</textarea>
      </div>
      ${note?.filename ? `<input type="hidden" name="filename" value="${escapeAttr(note.filename)}" />` : ''}
    `,
    onSubmit: async (formData) => {
      const payload: Note & { filename?: string } = {
        layout: 'post',
        title: (formData.get('title') as string).trim(),
        slug: (formData.get('slug') as string).trim(),
        date: (formData.get('date') as string).trim(),
        author: (formData.get('author') as string)?.trim() || undefined,
        tags: parseTags(formData.get('tags') as string),
        excerpt: (formData.get('excerpt') as string)?.trim() || undefined,
        filename: note?.filename ?? ((formData.get('filename') as string) || undefined),
      };

      const content = (formData.get('body') as string) ?? '';

      try {
        await saveNote(payload, content);
        await fetchNotes();
        renderNotes();
        showToast(mode === 'create' ? 'Note created' : 'Note updated');
        return true;
      } catch (error) {
        showError((error as Error).message);
        return false;
      }
    },
  });
}


