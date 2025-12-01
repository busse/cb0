import { state } from '../state';
import { escapeAttr, escapeHtml } from '../utils/dom';
import { formatFigureNotation } from '../utils/format';
import { resolveAssetUrl } from '../api';

export function renderIdeas(): void {
  const listElement = document.getElementById('ideas-list');
  if (!listElement) return;

  if (state.ideas.length === 0) {
    listElement.innerHTML = '<div class="loading">No ideas yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.ideas
    .map(
      (idea) => {
        const relatedStoryCount = state.stories.filter((story) =>
          (story.related_ideas ?? []).includes(idea.idea_number)
        ).length;
        return `
        <div class="item-card" data-card-type="ideas" data-idea-number="${idea.idea_number}" tabindex="0">
          <div class="item-header">
            <span class="item-title">${escapeHtml(idea.title || 'Untitled')}</span>
            <span class="item-badge">i${idea.idea_number}</span>
          </div>
          <div class="item-description">${escapeHtml(idea.description || '')}</div>
          <div class="item-meta">
            <span>Status: ${idea.status}</span>
            <span>Created: ${idea.created}</span>
            ${idea.tags && idea.tags.length ? `<span>Tags: ${idea.tags.join(', ')}</span>` : ''}
            <span>Stories: ${relatedStoryCount}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-idea" data-idea="${idea.idea_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-idea" data-idea="${idea.idea_number}">Delete</button>
          </div>
        </div>
      `;
      }
    )
    .join('');
}

export function renderStories(): void {
  const listElement = document.getElementById('stories-list');
  if (!listElement) return;

  if (state.stories.length === 0) {
    listElement.innerHTML = '<div class="loading">No stories yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.stories
    .map((story) => {
      const ideaList = story.related_ideas ?? [];
      const ideaLabels = ideaList.length ? ideaList.map((ideaNumber) => `i${ideaNumber}`).join(', ') : 'None';
      const sprintLabels = story.related_sprints?.length
        ? story.related_sprints.join(', ')
        : 'Backlog';
      return `
        <div class="item-card" data-card-type="stories" data-story-number="${story.story_number}" tabindex="0">
          <div class="item-header">
            <span class="item-title">${escapeHtml(story.title || 'Untitled')}</span>
            <span class="item-badge">s${story.story_number}</span>
          </div>
          <div class="item-description">${escapeHtml(story.description || '')}</div>
          <div class="item-meta">
            <span>Status: ${story.status}</span>
            <span>Priority: ${story.priority}</span>
          </div>
          <div class="item-meta">
            <span>Ideas: ${ideaLabels}</span>
            <span>Sprints: ${sprintLabels}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-story" data-story="${story.story_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-story" data-story="${story.story_number}">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderSprints(): void {
  const listElement = document.getElementById('sprints-list');
  if (!listElement) return;

  if (state.sprints.length === 0) {
    listElement.innerHTML = '<div class="loading">No sprints yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.sprints
    .map((sprint) => {
      const relatedStoryCount = state.stories.filter((story) =>
        story.related_sprints?.includes(sprint.sprint_id)
      ).length;
      return `
        <div class="item-card" data-card-type="sprints" data-sprint-id="${escapeAttr(sprint.sprint_id)}" tabindex="0">
          <div class="item-header">
            <span class="item-title">Sprint ${sprint.sprint_id}</span>
            <span class="item-badge">${sprint.sprint_id}</span>
          </div>
          <div class="item-description">
            ${sprint.start_date} – ${sprint.end_date}
          </div>
          <div class="item-meta">
            <span>Status: ${sprint.status}</span>
            <span>Year: ${sprint.year}</span>
            <span>Sprint #${sprint.sprint_number}</span>
            <span>Stories: ${relatedStoryCount}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-sprint" data-sprint="${sprint.sprint_id}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-sprint" data-sprint="${sprint.sprint_id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderUpdates(): void {
  const listElement = document.getElementById('updates-list');
  if (!listElement) return;

  if (state.updates.length === 0) {
    listElement.innerHTML = '<div class="loading">No updates yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.updates
    .map(
      (update) => `
        <div class="item-card" data-card-type="updates" data-sprint-id="${escapeAttr(update.sprint_id)}" data-idea-number="${update.idea_number}" data-story-number="${update.story_number}" tabindex="0">
          <div class="item-header">
            <span class="item-title">Update ${update.notation}</span>
            <span class="item-badge">${update.notation}</span>
          </div>
          <div class="item-meta">
            <span>Type: ${update.type}</span>
            <span>Date: ${update.date}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-update" data-sprint="${update.sprint_id}" data-idea="${update.idea_number}" data-story="${update.story_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-update" data-sprint="${update.sprint_id}" data-idea="${update.idea_number}" data-story="${update.story_number}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

export async function renderFigures(): Promise<void> {
  const listElement = document.getElementById('figures-list');
  if (!listElement) return;

  if (state.figures.length === 0) {
    listElement.innerHTML = '<div class="loading">No figures yet. Add one to document your work.</div>';
    return;
  }

  const figuresWithSrc = await Promise.all(
    state.figures.map(async (figure) => ({
      figure,
      imageSrc: figure.image_path ? await resolveAssetUrl(figure.image_path) : undefined,
    }))
  );

  listElement.innerHTML = figuresWithSrc
    .map(({ figure, imageSrc }) => {
      const ideaCount = figure.related_ideas?.length ?? 0;
      const storyCount = figure.related_stories?.length ?? 0;
      const relationshipText = [
        ideaCount ? `${ideaCount} ${ideaCount === 1 ? 'idea' : 'ideas'}` : '',
        storyCount ? `${storyCount} ${storyCount === 1 ? 'story' : 'stories'}` : '',
      ]
        .filter(Boolean)
        .join(' • ');

      return `
        <div class="item-card" data-card-type="figures" data-figure-number="${figure.figure_number}" tabindex="0">
          <div class="item-header">
            <span class="item-title">${escapeHtml(figure.title || 'Untitled figure')}</span>
            <span class="item-badge">${formatFigureNotation(figure.figure_number)}</span>
          </div>
          <div class="figure-card__preview">
            ${
              imageSrc
                ? `<img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(
                    figure.alt_text || figure.title || 'Figure preview'
                  )}" />`
                : '<div class="helper-text">No image selected</div>'
            }
          </div>
          <div class="item-description">${escapeHtml(figure.description || '')}</div>
          <div class="item-meta">
            <span>Status: ${figure.status}</span>
            <span>Created: ${figure.created}</span>
            ${relationshipText ? `<span>${relationshipText}</span>` : ''}
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-figure" data-figure="${figure.figure_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-figure" data-figure="${figure.figure_number}">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderNotes(): void {
  const listElement = document.getElementById('notes-list');
  if (!listElement) return;

  if (state.notes.length === 0) {
    listElement.innerHTML = '<div class="loading">No notes yet. Create one to share updates.</div>';
    return;
  }

  listElement.innerHTML = state.notes
    .map(
      (note) => `
        <div class="item-card" data-card-type="notes" data-note-slug="${escapeAttr(note.slug)}" tabindex="0">
          <div class="item-header">
            <span class="item-title">${escapeHtml(note.title || 'Untitled note')}</span>
            <span class="item-badge">${escapeHtml(note.slug)}</span>
          </div>
          <div class="item-meta">
            <span>Date: ${note.date}</span>
            ${note.author ? `<span>Author: ${escapeHtml(note.author)}</span>` : ''}
            ${
              note.tags?.length
                ? `<span>Tags: ${note.tags.map((tag) => escapeHtml(tag)).join(', ')}</span>`
                : ''
            }
          </div>
          <div class="item-description">${escapeHtml(note.excerpt || note.body?.slice(0, 140) || '')}</div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-note" data-note="${escapeAttr(
              note.filename
            )}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-note" data-note="${escapeAttr(
              note.filename
            )}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}


