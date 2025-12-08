import type { Figure, FigureRecord, FigureStatus } from '@shared/types';

import { FIGURE_STATUSES } from '../../constants';
import {
  clearFigureCache,
  copyFigureImage,
  ensureFigures,
  ensureIdeas,
  ensureStories,
  ensureSprints,
  ensureMaterials,
  ensureUpdates,
  fetchIdeas,
  fetchStories,
  fetchSprints,
  fetchMaterials,
  fetchUpdates,
  fetchFigures,
  getNextFigureNumber,
  resolveAssetUrl,
  saveFigure,
  selectFigureImage,
} from '../../api';
import { state } from '../../state';
import { renderFigures } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { escapeAttr, escapeHtml, parseTags, today } from '../../utils/dom';
import { formatFigureNotation } from '../../utils/format';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';
import { refreshRelationshipsSidebar } from '../relationships';

export async function openFigureForm(mode: 'create' | 'edit', figure?: FigureRecord): Promise<void> {
  if (mode === 'edit' && !figure) {
    showError('Unable to find that figure.');
    return;
  }

  await Promise.all([ensureIdeas(), ensureStories(), ensureFigures(), ensureSprints(), ensureMaterials(), ensureUpdates()]);

  const figureNumber =
    figure?.figure_number ??
    (await getNextFigureNumber().catch((error) => {
      showError(error.message);
      return undefined;
    }));
  if (figureNumber === undefined) return;

  const defaults = {
    title: figure?.title ?? '',
    description: figure?.description ?? '',
    image_path: figure?.image_path ?? '',
    alt_text: figure?.alt_text ?? '',
    status: figure?.status ?? 'active',
    created: figure?.created ?? today(),
    uploaded_date: figure?.uploaded_date ?? '',
    file_type: figure?.file_type ?? '',
    dimensions: figure?.dimensions ?? '',
    file_size: figure?.file_size ?? '',
    tags: figure?.tags?.join(', ') ?? '',
    body: figure?.body ?? '',
    related_sprints: figure?.related_sprints ?? [],
    related_materials: figure?.related_materials ?? [],
    related_updates: figure?.related_updates ?? [],
  };

  const selectedIdeaSet = new Set(figure?.related_ideas ?? []);
  const selectedStorySet = new Set(figure?.related_stories ?? []);
  const selectedSprintSet = new Set(figure?.related_sprints ?? []);
  const selectedMaterialSet = new Set(figure?.related_materials ?? []);
  const selectedUpdateSet = new Set(figure?.related_updates ?? []);
  const sprintOptions = state.sprints;
  const materialOptions = state.materials;
  const updateOptions = state.updates;

  // Create multi-select components
  const ideasMultiSelect = createMultiSelect({
    name: 'related_ideas',
    options: state.ideas.map((idea) => ({
      value: String(idea.idea_number),
      label: `i${idea.idea_number} — ${idea.title}`,
    })),
    selected: Array.from(selectedIdeaSet).map(String),
    placeholder: 'Search ideas...',
    required: false,
  });

  const storiesMultiSelect = createMultiSelect({
    name: 'related_stories',
    options: state.stories.flatMap((story) =>
      story.related_ideas.map((ideaNumber) => {
        const ref = `${ideaNumber}.${story.story_number}`;
        return {
          value: ref,
          label: `i${ideaNumber} · s${story.story_number} — ${story.title}`,
        };
      })
    ),
    selected: Array.from(selectedStorySet),
    placeholder: 'Search stories...',
    required: false,
  });

  const sprintsMultiSelect = createMultiSelect({
    name: 'related_sprints',
    options: sprintOptions.map((sprint) => ({
      value: sprint.sprint_id,
      label: `${sprint.sprint_id} — Sprint ${sprint.sprint_number}`,
    })),
    selected: Array.from(selectedSprintSet),
    placeholder: 'Search sprints...',
    required: false,
  });

  const materialsMultiSelect = createMultiSelect({
    name: 'related_materials',
    options: materialOptions
      .filter((material) => (material.slug ?? material.filename)?.length)
      .map((material) => {
        const value = material.slug ?? material.filename?.replace(/\.md$/, '') ?? '';
        return {
          value,
          label: `${material.title || value}`,
        };
      }),
    selected: Array.from(selectedMaterialSet),
    placeholder: 'Search materials...',
    required: false,
  });

  const updatesMultiSelect = createMultiSelect({
    name: 'related_updates',
    options: updateOptions.map((update) => ({
      value: update.notation,
      label: `${update.notation} (${update.type})`,
    })),
    selected: Array.from(selectedUpdateSet),
    placeholder: 'Search updates...',
    required: false,
  });

  openModal({
    title:
      mode === 'create'
        ? 'Create Figure'
        : `Edit ${formatFigureNotation(figure!.figure_number)}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Figure' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Figure Number</label>
          <input type="number" name="figure_number" value="${figureNumber}" ${
            mode === 'edit' ? 'readonly' : 'min="0"'
          } required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${FIGURE_STATUSES.map(
              (status) => `<option value="${status}" ${status === defaults.status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${defaults.created}" required />
        </div>
        <div class="form-field">
          <label>Uploaded Date</label>
          <input type="date" name="uploaded_date" value="${defaults.uploaded_date}" />
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${escapeAttr(defaults.title)}" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" placeholder="Describe the figure">${escapeHtml(defaults.description)}</textarea>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Image Path</label>
          <div class="figure-input-group">
            <input type="text" name="image_path" value="${escapeAttr(defaults.image_path)}" required data-image-path />
            <button type="button" class="btn btn-secondary" data-image-browse>Select</button>
          </div>
          <div class="helper-text">Images are copied to /assets/figures/</div>
        </div>
        <div class="form-field">
          <label>Alt Text</label>
          <input type="text" name="alt_text" value="${escapeAttr(defaults.alt_text)}" />
        </div>
      </div>
      <div class="figure-preview" data-figure-preview>
        ${
          defaults.image_path
            ? `<img src="${escapeAttr(defaults.image_path)}" alt="${escapeAttr(
                defaults.alt_text || defaults.title || 'Figure preview'
              )}" />`
            : '<div class="helper-text">No image selected</div>'
        }
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>File Type</label>
          <input type="text" name="file_type" value="${escapeAttr(defaults.file_type)}" placeholder="png" />
        </div>
        <div class="form-field">
          <label>File Size</label>
          <input type="text" name="file_size" value="${escapeAttr(defaults.file_size)}" placeholder="245KB" />
        </div>
        <div class="form-field">
          <label>Dimensions</label>
          <input type="text" name="dimensions" value="${escapeAttr(defaults.dimensions)}" placeholder="1920x1080" />
        </div>
      </div>
      <div class="form-field">
        <label>Tags (comma separated)</label>
        <input type="text" name="tags" value="${escapeAttr(defaults.tags)}" />
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Related Ideas</label>
          ${ideasMultiSelect.html}
          <div class="helper-text">Select one or more ideas.</div>
        </div>
        <div class="form-field">
          <label>Related Stories</label>
          ${storiesMultiSelect.html}
          <div class="helper-text">Format: idea.story (e.g., 5.2).</div>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Sprints</label>
          ${sprintsMultiSelect.html}
          <div class="helper-text">Link sprints where this figure appears.</div>
        </div>
        <div class="form-field">
          <label>Materials</label>
          ${materialsMultiSelect.html}
          <div class="helper-text">Attach supporting notes or research.</div>
        </div>
        <div class="form-field">
          <label>Updates</label>
          ${updatesMultiSelect.html}
          <div class="helper-text">Associate relevant updates.</div>
        </div>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${escapeHtml(defaults.body)}</textarea>
      </div>
    `,
    onOpen: (form) => {
      // Initialize multi-select components
      ideasMultiSelect.init(form);
      storiesMultiSelect.init(form);
      sprintsMultiSelect.init(form);
      materialsMultiSelect.init(form);
      updatesMultiSelect.init(form);

      const browseButton = form.querySelector<HTMLButtonElement>('[data-image-browse]');
      const imagePathInput = form.querySelector<HTMLInputElement>('input[name="image_path"]');
      const figureNumberInput = form.querySelector<HTMLInputElement>('input[name="figure_number"]');
      const altInput = form.querySelector<HTMLInputElement>('input[name="alt_text"]');

      browseButton?.addEventListener('click', async () => {
        if (!imagePathInput || !figureNumberInput) return;
        const figureValue = Number(figureNumberInput.value);
        if (Number.isNaN(figureValue)) {
          showError('Enter a figure number before selecting an image.');
          return;
        }

        try {
          const selection = await selectFigureImage();
          if (selection.canceled || !selection.path) {
            return;
          }

          const copyResult = await copyFigureImage(selection.path, figureValue);
          clearFigureCache();
          imagePathInput.value = copyResult.relativePath;
          const fileTypeInput = form.querySelector<HTMLInputElement>('input[name="file_type"]');
          if (fileTypeInput && !fileTypeInput.value) {
            fileTypeInput.value = copyResult.fileType;
          }
          const fileSizeInput = form.querySelector<HTMLInputElement>('input[name="file_size"]');
          if (fileSizeInput) {
            fileSizeInput.value = copyResult.fileSize;
          }
          const previewSrc = await resolveAssetUrl(copyResult.relativePath);
          void updateFigurePreview(
            form,
            copyResult.relativePath,
            altInput?.value || defaults.alt_text,
            previewSrc
          );
        } catch (error) {
          showError((error as Error).message);
        }
      });

      imagePathInput?.addEventListener('change', () => {
        void updateFigurePreview(form, imagePathInput.value, altInput?.value || defaults.alt_text);
      });

      altInput?.addEventListener('input', () => {
        if (!imagePathInput) return;
        void updateFigurePreview(form, imagePathInput.value, altInput.value || defaults.alt_text);
      });

      void updateFigurePreview(form, defaults.image_path, defaults.alt_text);
    },
    onSubmit: async (formData) => {
      const figureValue = Number(formData.get('figure_number'));
      if (Number.isNaN(figureValue)) {
        throw new Error('Figure number is invalid.');
      }
      const imagePath = (formData.get('image_path') as string)?.trim();
      if (!imagePath) {
        throw new Error('Select an image for this figure.');
      }

      const relatedIdeaValues = formData.getAll('related_ideas') as string[];
      const relatedIdeas = relatedIdeaValues
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));

      const relatedStories = Array.from(new Set((formData.getAll('related_stories') as string[]).filter(Boolean)));
      const relatedSprints = Array.from(new Set((formData.getAll('related_sprints') as string[]).filter(Boolean)));
      const relatedMaterials = Array.from(new Set((formData.getAll('related_materials') as string[]).filter(Boolean)));
      const relatedUpdates = Array.from(new Set((formData.getAll('related_updates') as string[]).filter(Boolean)));

      const payload: Figure = {
        layout: 'figure',
        figure_number: figureValue,
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string)?.trim() || undefined,
        image_path: imagePath,
        alt_text: ((formData.get('alt_text') as string) || '').trim() || undefined,
        status: formData.get('status') as FigureStatus,
        created: formData.get('created') as string,
        uploaded_date: ((formData.get('uploaded_date') as string) || '').trim() || undefined,
        file_type: ((formData.get('file_type') as string) || '').trim() || undefined,
        file_size: ((formData.get('file_size') as string) || '').trim() || undefined,
        dimensions: ((formData.get('dimensions') as string) || '').trim() || undefined,
        tags: parseTags(formData.get('tags') as string),
        related_ideas: relatedIdeas.length ? relatedIdeas : undefined,
        related_stories: relatedStories.length ? relatedStories : undefined,
        related_sprints: relatedSprints.length ? relatedSprints : undefined,
        related_materials: relatedMaterials.length ? relatedMaterials : undefined,
        related_updates: relatedUpdates.length ? relatedUpdates : undefined,
      };

      const content = (formData.get('body') as string) ?? '';
      await saveFigure(payload, content);
      const figureRecord: FigureRecord = {
        ...payload,
        body: content,
      };
      await syncRelationships('figure', figureRecord);
      await Promise.all([fetchIdeas(), fetchStories(), fetchSprints(), fetchMaterials(), fetchUpdates(), fetchFigures()]);
      clearFigureCache();
      await renderFigures();
      refreshRelationshipsSidebar('figures');
      showToast(mode === 'create' ? 'Figure created' : 'Figure updated');
      return true;
    },
  });
}

async function updateFigurePreview(
  form: HTMLFormElement,
  imagePath?: string,
  altText?: string,
  directUrl?: string
): Promise<void> {
  const preview = form.querySelector<HTMLDivElement>('[data-figure-preview]');
  if (!preview) return;
  if (!imagePath && !directUrl) {
    preview.innerHTML = '<div class="helper-text">No image selected</div>';
    return;
  }

  const resolvedSrc = directUrl ?? (imagePath ? await resolveAssetUrl(imagePath) : undefined);
  if (!resolvedSrc) {
    preview.innerHTML = '<div class="helper-text">Image not found</div>';
    return;
  }

  preview.innerHTML = `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(
    altText || 'Figure preview'
  )}" />`;
}


