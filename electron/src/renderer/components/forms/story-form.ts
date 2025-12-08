import type { Story, StoryRecord, StoryPriority, StoryStatus } from '@shared/types';

import { STORY_PRIORITIES, STORY_STATUSES } from '../../constants';
import {
  ensureIdeas,
  ensureSprints,
  ensureMaterials,
  ensureFigures,
  ensureUpdates,
  fetchIdeas,
  fetchSprints,
  fetchMaterials,
  fetchFigures,
  fetchUpdates,
  fetchStories,
  getNextStoryNumber,
  saveStory,
} from '../../api';
import { state } from '../../state';
import { renderStories } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { escapeAttr, escapeHtml, today } from '../../utils/dom';
import { createMultiSelect } from '../multi-select';
import { syncRelationships } from '../../utils/relationships';
import { refreshRelationshipsSidebar } from '../relationships';

export async function openStoryForm(mode: 'create' | 'edit', story?: StoryRecord): Promise<void> {
  if (mode === 'edit' && !story) {
    showError('Unable to find that story.');
    return;
  }

  await Promise.all([ensureIdeas(), ensureSprints(), ensureMaterials(), ensureFigures(), ensureUpdates()]);

  const ideaOptions = state.ideas;
  const materialOptions = state.materials;
  const figureOptions = state.figures;
  const updateOptions = state.updates;
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
    related_materials: story?.related_materials ?? [],
    related_figures: story?.related_figures ?? [],
    related_updates: story?.related_updates ?? [],
    body: story?.body ?? '',
  };

  // Create multi-select components
  const ideasMultiSelect = createMultiSelect({
    name: 'related_ideas',
    options: ideaOptions.map((idea) => ({
      value: String(idea.idea_number),
      label: `i${idea.idea_number} — ${idea.title}`,
    })),
    selected: defaults.related_ideas.map(String),
    placeholder: 'Search ideas...',
    required: true,
  });

  const sprintsMultiSelect = createMultiSelect({
    name: 'related_sprints',
    options: state.sprints.map((sprint) => ({
      value: sprint.sprint_id,
      label: `${sprint.sprint_id} (${sprint.start_date} → ${sprint.end_date})`,
    })),
    selected: defaults.related_sprints,
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
    selected: defaults.related_materials,
    placeholder: 'Search materials...',
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
    title: mode === 'create' ? 'Create Story' : `Edit Story s${story?.story_number}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Story' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Ideas</label>
          ${ideasMultiSelect.html}
          <div class="helper-text">Select one or more ideas.</div>
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
          ${sprintsMultiSelect.html}
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
      <section class="form-section">
        <h2 class="form-section__title">Relationships</h2>
        <div class="form-grid">
          <div class="form-field">
            <label>Materials</label>
            ${materialsMultiSelect.html}
            <div class="helper-text">Reference supporting materials.</div>
          </div>
          <div class="form-field">
            <label>Figures</label>
            ${figuresMultiSelect.html}
            <div class="helper-text">Link visual assets to this story.</div>
          </div>
          <div class="form-field">
            <label>Updates</label>
            ${updatesMultiSelect.html}
            <div class="helper-text">Attach updates beyond the canonical notation.</div>
          </div>
        </div>
      </section>
    `,
    onOpen: (form) => {
      ideasMultiSelect.init(form);
      sprintsMultiSelect.init(form);
      materialsMultiSelect.init(form);
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

      const relatedIdeas = getNumberSelections('related_ideas');
      const relatedSprints = getStringSelections('related_sprints');
      const relatedMaterials = getStringSelections('related_materials');
      const relatedFigures = getNumberSelections('related_figures');
      const relatedUpdates = getStringSelections('related_updates');
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
        related_materials: relatedMaterials.length ? relatedMaterials : undefined,
        related_figures: relatedFigures.length ? relatedFigures : undefined,
        related_updates: relatedUpdates.length ? relatedUpdates : undefined,
      };
      const content = (formData.get('body') as string) ?? '';

      await saveStory(payload, content);
      const storyRecord: StoryRecord = {
        ...payload,
        body: content,
      };
      await syncRelationships('story', storyRecord);
      await Promise.all([fetchIdeas(), fetchSprints(), fetchMaterials(), fetchFigures(), fetchUpdates()]);
      await fetchStories();
      renderStories();
      refreshRelationshipsSidebar('stories');
      // Also refresh sprints sidebar if a sprint card is selected (stories can be related to sprints)
      refreshRelationshipsSidebar('sprints');
      showToast(mode === 'create' ? 'Story created' : 'Story updated');
      return true;
    },
  });
}


