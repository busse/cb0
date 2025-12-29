import type { Material, MaterialRecord } from '@shared/types';
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
  fetchMaterials,
  saveMaterial,
} from '../../api';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { renderMaterials } from '../lists';
import { escapeAttr, escapeHtml, parseTags, today } from '../../utils/dom';
import { state } from '../../state';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';
import { refreshRelationshipsSidebar } from '../relationships';

export async function openMaterialForm(mode: 'create' | 'edit', material?: MaterialRecord): Promise<void> {
  if (mode === 'edit' && !material) {
    showError('Unable to find that material.');
    return;
  }

  const defaults = {
    title: material?.title ?? '',
    slug: material?.slug ?? slugify(material?.title ?? ''),
    date: material?.date ?? today(),
    author: material?.author ?? '',
    tags: material?.tags?.join(', ') ?? '',
    excerpt: material?.excerpt ?? '',
    canonical_source_url: material?.canonical_source_url ?? '',
    body: material?.body ?? '',
    related_ideas: material?.related_ideas ?? [],
    related_stories: material?.related_stories ?? [],
    related_sprints: material?.related_sprints ?? [],
    related_figures: material?.related_figures ?? [],
    related_updates: material?.related_updates ?? [],
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
    title: mode === 'create' ? 'Create Material' : `Edit Material ${material?.slug}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Material' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Title</label>
          <input type="text" name="title" value="${escapeAttr(defaults.title)}" required />
        </div>
        <div class="form-field">
          <label>Slug</label>
          <input type="text" name="slug" value="${escapeAttr(defaults.slug)}" required placeholder="material-title" />
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
        <label>Canonical Source URL</label>
        <input type="url" name="canonical_source_url" value="${escapeAttr(defaults.canonical_source_url)}" placeholder="https://example.com/source" />
        <div class="helper-text">Optional URL to the original source of this material.</div>
      </div>
      <div class="form-field">
        <label>Tags (comma separated)</label>
        <input type="text" name="tags" value="${escapeAttr(defaults.tags)}" placeholder="material, design" />
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
            <div class="helper-text">Ideas that this material references.</div>
          </div>
          <div class="form-field">
            <label>Stories</label>
            ${storiesMultiSelect.html}
            <div class="helper-text">Stories informed by this material.</div>
          </div>
          <div class="form-field">
            <label>Sprints</label>
            ${sprintsMultiSelect.html}
            <div class="helper-text">Sprints where this material is relevant.</div>
          </div>
          <div class="form-field">
            <label>Figures</label>
            ${figuresMultiSelect.html}
            <div class="helper-text">Attach related figures.</div>
          </div>
          <div class="form-field">
            <label>Updates</label>
            ${updatesMultiSelect.html}
            <div class="helper-text">Connect any updates mentioned in this material.</div>
          </div>
        </div>
      </section>
      ${material?.filename ? `<input type="hidden" name="filename" value="${escapeAttr(material.filename)}" />` : ''}
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

      const payload: Material & { filename?: string } = {
        layout: 'post',
        title: (formData.get('title') as string).trim(),
        slug: (formData.get('slug') as string).trim(),
        date: (formData.get('date') as string).trim(),
        author: (formData.get('author') as string)?.trim() || undefined,
        tags: parseTags(formData.get('tags') as string),
        excerpt: (formData.get('excerpt') as string)?.trim() || undefined,
        canonical_source_url: (formData.get('canonical_source_url') as string)?.trim() || undefined,
        filename: material?.filename ?? ((formData.get('filename') as string) || undefined),
        related_ideas: getNumberSelections('related_ideas'),
        related_stories: getNumberSelections('related_stories'),
        related_sprints: getStringSelections('related_sprints'),
        related_figures: getNumberSelections('related_figures'),
        related_updates: getStringSelections('related_updates'),
      };

      const content = (formData.get('body') as string) ?? '';

      try {
        await saveMaterial(payload, content);
        const filenameGuess =
          payload.filename ??
          `${payload.date}-${payload.slug || slugify(payload.title || 'material')}.md`;
        const materialRecord: MaterialRecord = {
          layout: 'post',
          title: payload.title,
          date: payload.date,
          author: payload.author,
          tags: payload.tags,
          excerpt: payload.excerpt,
          slug: payload.slug,
          canonical_source_url: payload.canonical_source_url,
          filename: filenameGuess,
          body: content,
          related_ideas: payload.related_ideas,
          related_stories: payload.related_stories,
          related_sprints: payload.related_sprints,
          related_figures: payload.related_figures,
          related_updates: payload.related_updates,
        };

        await syncRelationships('material', materialRecord);
        await Promise.all([fetchIdeas(), fetchStories(), fetchSprints(), fetchFigures(), fetchUpdates(), fetchMaterials()]);
        renderMaterials();
        refreshRelationshipsSidebar('materials');
        showToast(mode === 'create' ? 'Material created' : 'Material updated');
        return true;
      } catch (error) {
        showError((error as Error).message);
        return false;
      }
    },
  });
}



