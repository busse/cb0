import type { Figure, FigureRecord, FigureStatus } from '@shared/types';

import { FIGURE_STATUSES } from '../../constants';
import {
  clearFigureCache,
  copyFigureImage,
  ensureFigures,
  ensureIdeas,
  ensureStories,
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

export async function openFigureForm(mode: 'create' | 'edit', figure?: FigureRecord): Promise<void> {
  if (mode === 'edit' && !figure) {
    showError('Unable to find that figure.');
    return;
  }

  await Promise.all([ensureIdeas(), ensureStories(), ensureFigures()]);

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
  };

  const selectedIdeaSet = new Set(figure?.related_ideas ?? []);
  const selectedStorySet = new Set(figure?.related_stories ?? []);

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
          <select name="related_ideas" multiple size="5">
            ${state.ideas
              .map(
                (idea) =>
                  `<option value="${idea.idea_number}" ${
                    selectedIdeaSet.has(idea.idea_number) ? 'selected' : ''
                  }>i${idea.idea_number} — ${escapeHtml(idea.title)}</option>`
              )
              .join('')}
          </select>
          <div class="helper-text">Hold Cmd/Ctrl to select multiple ideas.</div>
        </div>
        <div class="form-field">
          <label>Related Stories</label>
          <select name="related_stories" multiple size="6">
            ${state.stories
              .map((story) => {
                const ref = `${story.idea_number}.${story.story_number}`;
                return `<option value="${ref}" ${selectedStorySet.has(ref) ? 'selected' : ''}>${ref} — ${escapeHtml(
                  story.title
                )}</option>`;
              })
              .join('')}
          </select>
          <div class="helper-text">Format: idea.story (e.g., 5.2). Hold Cmd/Ctrl to select.</div>
        </div>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${escapeHtml(defaults.body)}</textarea>
      </div>
    `,
    onOpen: (form) => {
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

      const relatedStories = (formData.getAll('related_stories') as string[]).filter(Boolean);

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
      };

      const content = (formData.get('body') as string) ?? '';
      await saveFigure(payload, content);
      clearFigureCache();
      await fetchFigures();
      await renderFigures();
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


