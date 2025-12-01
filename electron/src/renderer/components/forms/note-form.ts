import type { Note, NoteRecord } from '@shared/types';
import { slugify } from '@shared/strings';

import {
  ensureIdeas,
  ensureStories,
  ensureSprints,
  ensureFigures,
  ensureUpdates,
  fetchIdeas,
  fetchStories,
  fetchSprints,
  fetchFigures,
  fetchUpdates,
  fetchNotes,
  saveNote,
} from '../../api';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { renderNotes } from '../lists';
import { escapeAttr, escapeHtml, parseTags, today } from '../../utils/dom';
import { state } from '../../state';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';
import { refreshRelationshipsSidebar } from '../relationships';

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
    related_ideas: note?.related_ideas ?? [],
    related_stories: note?.related_stories ?? [],
    related_sprints: note?.related_sprints ?? [],
    related_figures: note?.related_figures ?? [],
    related_updates: note?.related_updates ?? [],
  };

  await Promise.all([ensureIdeas(), ensureStories(), ensureSprints(), ensureFigures(), ensureUpdates()]);
  const ideaOptions = state.ideas;
  const storyOptions = state.stories;
  const sprintOptions = state.sprints;
  const figureOptions = state.figures;
  const updateOptions = state.updates;

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
    options: storyOptions.map((story) => ({
      value: String(story.story_number),
      label: `s${story.story_number} — ${story.title || 'Untitled'}`,
    })),
    selected: defaults.related_stories.map(String),
    placeholder: 'Search stories...',
    required: false,
  });

  const sprintsMultiSelect = createMultiSelect({
    name: 'related_sprints',
    options: sprintOptions.map((sprint) => ({
      value: sprint.sprint_id,
      label: `${sprint.sprint_id} — Sprint ${sprint.sprint_number}`,
    })),
    selected: defaults.related_sprints,
    placeholder: 'Search sprints...',
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
      <section class="form-section">
        <h2 class="form-section__title">Relationships</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Ideas</label>
            ${ideasMultiSelect.html}
            <div class="helper-text">Ideas that this note references.</div>
          </div>
          <div class="form-field">
            <label>Stories</label>
            ${storiesMultiSelect.html}
            <div class="helper-text">Stories informed by this note.</div>
          </div>
          <div class="form-field">
            <label>Sprints</label>
            ${sprintsMultiSelect.html}
            <div class="helper-text">Sprints where this note is relevant.</div>
          </div>
          <div class="form-field">
            <label>Figures</label>
            ${figuresMultiSelect.html}
            <div class="helper-text">Attach related figures.</div>
          </div>
          <div class="form-field">
            <label>Updates</label>
            ${updatesMultiSelect.html}
            <div class="helper-text">Connect any updates mentioned in this note.</div>
          </div>
        </div>
      </section>
      ${note?.filename ? `<input type="hidden" name="filename" value="${escapeAttr(note.filename)}" />` : ''}
    `,
    onOpen: (form) => {
      ideasMultiSelect.init(form);
      storiesMultiSelect.init(form);
      sprintsMultiSelect.init(form);
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

      const payload: Note & { filename?: string } = {
        layout: 'post',
        title: (formData.get('title') as string).trim(),
        slug: (formData.get('slug') as string).trim(),
        date: (formData.get('date') as string).trim(),
        author: (formData.get('author') as string)?.trim() || undefined,
        tags: parseTags(formData.get('tags') as string),
        excerpt: (formData.get('excerpt') as string)?.trim() || undefined,
        filename: note?.filename ?? ((formData.get('filename') as string) || undefined),
        related_ideas: getNumberSelections('related_ideas'),
        related_stories: getNumberSelections('related_stories'),
        related_sprints: getStringSelections('related_sprints'),
        related_figures: getNumberSelections('related_figures'),
        related_updates: getStringSelections('related_updates'),
      };

      const content = (formData.get('body') as string) ?? '';

      try {
        await saveNote(payload, content);
        const filenameGuess =
          payload.filename ??
          `${payload.date}-${payload.slug || slugify(payload.title || 'note')}.md`;
        const noteRecord: NoteRecord = {
          layout: 'post',
          title: payload.title,
          date: payload.date,
          author: payload.author,
          tags: payload.tags,
          excerpt: payload.excerpt,
          slug: payload.slug,
          filename: filenameGuess,
          body: content,
          related_ideas: payload.related_ideas,
          related_stories: payload.related_stories,
          related_sprints: payload.related_sprints,
          related_figures: payload.related_figures,
          related_updates: payload.related_updates,
        };

        await syncRelationships('note', noteRecord);
        await Promise.all([fetchIdeas(), fetchStories(), fetchSprints(), fetchFigures(), fetchUpdates(), fetchNotes()]);
        renderNotes();
        refreshRelationshipsSidebar('notes');
        showToast(mode === 'create' ? 'Note created' : 'Note updated');
        return true;
      } catch (error) {
        showError((error as Error).message);
        return false;
      }
    },
  });
}


