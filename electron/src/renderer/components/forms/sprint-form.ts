import type { Sprint, SprintRecord, SprintStatus, Story } from '@shared/types';

import { SPRINT_STATUSES } from '../../constants';
import {
  ensureStories,
  fetchSprints,
  fetchStories,
  saveSprint,
  saveStory,
} from '../../api';
import { renderSprints } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { state } from '../../state';
import { escapeAttr, escapeHtml, parseLines, today } from '../../utils/dom';

export async function openSprintForm(mode: 'create' | 'edit', sprint?: SprintRecord): Promise<void> {
  if (mode === 'edit' && !sprint) {
    showError('Unable to find that sprint.');
    return;
  }

  const defaults = {
    sprint_id: sprint?.sprint_id ?? '',
    year: sprint?.year ?? new Date().getFullYear(),
    sprint_number: sprint?.sprint_number ?? 1,
    status: sprint?.status ?? 'planned',
    start_date: sprint?.start_date ?? today(),
    end_date: sprint?.end_date ?? today(),
    goals: sprint?.goals?.join('\n') ?? '',
    body: sprint?.body ?? '',
  };

  await ensureStories();
  const storyOptions = state.stories;
  const relatedStoryNumbers = defaults.sprint_id
    ? storyOptions
        .filter((story) => (story.related_sprints ?? []).includes(defaults.sprint_id))
        .map((story) => story.story_number)
    : [];

  const relatedStoriesField = `
    <div class="form-field">
      <label>Related Stories</label>
      ${
        storyOptions.length
          ? `<select name="related_stories" multiple size="6">
              ${storyOptions
                .map((story) => {
                  const ideasLabel = (story.related_ideas ?? []).map((id) => `i${id}`).join(', ');
                  return `<option value="${story.story_number}" ${
                    relatedStoryNumbers.includes(story.story_number) ? 'selected' : ''
                  }>s${story.story_number} — ${escapeHtml(story.title || 'Untitled')} ${
                    ideasLabel ? `(${ideasLabel})` : ''
                  }</option>`;
                })
                .join('')}
            </select>
            <div class="helper-text">Assign stories to this sprint (Cmd/Ctrl-click for multi-select).</div>`
          : '<div class="helper-text">No stories available yet. Create a story to assign it here.</div>'
      }
    </div>
  `;

  openModal({
    title: mode === 'create' ? 'Create Sprint' : `Edit Sprint ${sprint?.sprint_id}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Sprint' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint ID (YYSS)</label>
          <input type="text" name="sprint_id" value="${escapeAttr(defaults.sprint_id)}" pattern="\\d{4}" required />
        </div>
        <div class="form-field">
          <label>Year</label>
          <input type="number" name="year" value="${defaults.year}" min="2000" max="2100" required />
        </div>
        <div class="form-field">
          <label>Sprint Number (1-26)</label>
          <input type="number" name="sprint_number" value="${defaults.sprint_number}" min="1" max="26" required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${SPRINT_STATUSES.map(
              (status) => `<option value="${status}" ${status === defaults.status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Start Date</label>
          <input type="date" name="start_date" value="${defaults.start_date}" required />
        </div>
        <div class="form-field">
          <label>End Date</label>
          <input type="date" name="end_date" value="${defaults.end_date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Goals (one per line)</label>
        <textarea name="goals" rows="4">${escapeHtml(defaults.goals)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" rows="6">${escapeHtml(defaults.body)}</textarea>
      </div>
      ${relatedStoriesField}
    `,
    onSubmit: async (formData) => {
      const payload: Sprint = {
        layout: 'sprint',
        sprint_id: (formData.get('sprint_id') as string).trim(),
        year: Number(formData.get('year')),
        sprint_number: Number(formData.get('sprint_number')),
        status: formData.get('status') as SprintStatus,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        goals: parseLines(formData.get('goals') as string),
      };
      const content = (formData.get('body') as string) ?? '';

      await saveSprint(payload, content);
      const selectedStoryNumbers = new Set<number>(
        formData
          .getAll('related_stories')
          .filter((value): value is string => typeof value === 'string')
          .map((value) => Number(value))
      );

      const storyUpdatePromises: Promise<void>[] = [];
      for (const storyRecord of state.stories) {
        const hasSprint = storyRecord.related_sprints?.includes(payload.sprint_id) ?? false;
        const shouldHave = selectedStoryNumbers.has(storyRecord.story_number);
        if (hasSprint === shouldHave) continue;

        const baseSprints = storyRecord.related_sprints ?? [];
        const nextRelatedSprints = shouldHave
          ? Array.from(new Set([...baseSprints, payload.sprint_id]))
          : baseSprints.filter((id) => id !== payload.sprint_id);

        const relatedIdeas = Array.isArray(storyRecord.related_ideas)
          ? storyRecord.related_ideas
          : [];

        const updatedStory: Story = {
          layout: 'story',
          story_number: storyRecord.story_number,
          title: storyRecord.title,
          description: storyRecord.description,
          status: storyRecord.status,
          priority: storyRecord.priority,
          created: storyRecord.created,
          related_ideas: relatedIdeas,
          related_sprints: nextRelatedSprints.length ? nextRelatedSprints : undefined,
        };

        storyUpdatePromises.push(saveStory(updatedStory, storyRecord.body ?? ''));
      }

      if (storyUpdatePromises.length) {
        await Promise.all(storyUpdatePromises);
        await fetchStories();
      }

      await fetchSprints();
      renderSprints();
      showToast(mode === 'create' ? 'Sprint created' : 'Sprint updated');
      return true;
    },
  });
}


