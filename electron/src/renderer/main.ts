import type {
  Idea,
  IdeaRecord,
  IdeaStatus,
  Story,
  StoryRecord,
  StoryPriority,
  StoryStatus,
  Sprint,
  SprintRecord,
  SprintStatus,
  Update,
  UpdateRecord,
  UpdateType,
} from '@shared/types';
import { formatNotation } from '@shared/validation';

type Tab = 'ideas' | 'stories' | 'sprints' | 'updates';

type ModalOptions = {
  title: string;
  body: string;
  submitLabel?: string;
  width?: 'md' | 'lg';
  onSubmit: (formData: FormData, form: HTMLFormElement) => Promise<boolean | void>;
  onOpen?: (form: HTMLFormElement) => void;
};

type Action =
  | 'new-idea'
  | 'edit-idea'
  | 'delete-idea'
  | 'refresh-ideas'
  | 'new-story'
  | 'edit-story'
  | 'delete-story'
  | 'refresh-stories'
  | 'new-sprint'
  | 'edit-sprint'
  | 'delete-sprint'
  | 'refresh-sprints'
  | 'new-update'
  | 'edit-update'
  | 'delete-update'
  | 'refresh-updates';

const IDEA_STATUSES: IdeaStatus[] = ['planned', 'active', 'completed', 'archived'];
const STORY_STATUSES: StoryStatus[] = ['backlog', 'planned', 'in-progress', 'done'];
const STORY_PRIORITIES: StoryPriority[] = ['low', 'medium', 'high', 'critical'];
const SPRINT_STATUSES: SprintStatus[] = ['planned', 'active', 'completed'];
const UPDATE_TYPES: UpdateType[] = ['progress', 'completion', 'blocker', 'note'];

const state: {
  ideas: IdeaRecord[];
  stories: StoryRecord[];
  sprints: SprintRecord[];
  updates: UpdateRecord[];
} = {
  ideas: [],
  stories: [],
  sprints: [],
  updates: [],
};

let currentTab: Tab = 'ideas';
let activeSubmitHandler: ModalOptions['onSubmit'] | null = null;

const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab');
const panels = document.querySelectorAll<HTMLDivElement>('.panel');
const errorBanner = document.getElementById('error-message') as HTMLDivElement;
const modal = document.getElementById('modal') as HTMLDivElement;
const modalDialog = modal.querySelector<HTMLDivElement>('.modal__dialog')!;
const modalForm = document.getElementById('modal-form') as HTMLFormElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
const modalCloseButton = document.getElementById('modal-close') as HTMLButtonElement;
const toastContainer = document.getElementById('toast-container') as HTMLDivElement;

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const tab = button.dataset.tab as Tab;
    if (tab && tab !== currentTab) {
      switchTab(tab);
    }
  });
});

document.addEventListener('click', handleActionClick);
modalCloseButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

modalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeSubmitHandler) return;
  const submitButton = modalForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Saving…';
  }

  try {
    const shouldClose = await activeSubmitHandler(new FormData(modalForm), modalForm);
    if (shouldClose !== false) {
      closeModal();
    }
  } catch (error) {
    showError((error as Error).message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.defaultText || 'Save';
    }
  }
});

function switchTab(tab: Tab) {
  currentTab = tab;

  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `${tab}-panel`);
  });

  void loadTabData(tab);
}

async function loadTabData(tab: Tab) {
  setListLoading(tab);

  try {
    switch (tab) {
      case 'ideas':
        await fetchIdeas();
        renderIdeas();
        break;
      case 'stories':
        await fetchStories();
        renderStories();
        break;
      case 'sprints':
        await fetchSprints();
        renderSprints();
        break;
      case 'updates':
        await fetchUpdates();
        renderUpdates();
        break;
    }
  } catch (error) {
    showError((error as Error).message);
  }
}

function setListLoading(tab: Tab) {
  const list = document.getElementById(`${tab}-list`);
  if (list) {
    list.innerHTML = '<div class="loading">Loading…</div>';
  }
}

async function fetchIdeas() {
  const result = await window.electronAPI.readIdeas();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load ideas');
  }
  state.ideas = result.data;
}

async function fetchStories() {
  const result = await window.electronAPI.readStories();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load stories');
  }
  state.stories = result.data;
}

async function fetchSprints() {
  const result = await window.electronAPI.readSprints();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load sprints');
  }
  state.sprints = result.data;
}

async function fetchUpdates() {
  const result = await window.electronAPI.readUpdates();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load updates');
  }
  state.updates = result.data;
}

function renderIdeas() {
  const listElement = document.getElementById('ideas-list');
  if (!listElement) return;

  if (state.ideas.length === 0) {
    listElement.innerHTML = '<div class="loading">No ideas yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.ideas
    .map(
      (idea) => `
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${escapeHtml(idea.title || 'Untitled')}</span>
            <span class="item-badge">i${idea.idea_number}</span>
          </div>
          <div class="item-description">${escapeHtml(idea.description || '')}</div>
          <div class="item-meta">
            <span>Status: ${idea.status}</span>
            <span>Created: ${idea.created}</span>
            ${idea.tags && idea.tags.length ? `<span>Tags: ${idea.tags.join(', ')}</span>` : ''}
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-idea" data-idea="${idea.idea_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-idea" data-idea="${idea.idea_number}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

function renderStories() {
  const listElement = document.getElementById('stories-list');
  if (!listElement) return;

  if (state.stories.length === 0) {
    listElement.innerHTML = '<div class="loading">No stories yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.stories
    .map(
      (story) => `
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${escapeHtml(story.title || 'Untitled')}</span>
            <span class="item-badge">${story.idea_number}.${story.story_number}</span>
          </div>
          <div class="item-description">${escapeHtml(story.description || '')}</div>
          <div class="item-meta">
            <span>Status: ${story.status}</span>
            <span>Priority: ${story.priority}</span>
            ${story.assigned_sprint ? `<span>Sprint: ${story.assigned_sprint}</span>` : ''}
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-story" data-idea="${story.idea_number}" data-story="${story.story_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-story" data-idea="${story.idea_number}" data-story="${story.story_number}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

function renderSprints() {
  const listElement = document.getElementById('sprints-list');
  if (!listElement) return;

  if (state.sprints.length === 0) {
    listElement.innerHTML = '<div class="loading">No sprints yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.sprints
    .map(
      (sprint) => `
        <div class="item-card">
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
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-sprint" data-sprint="${sprint.sprint_id}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-sprint" data-sprint="${sprint.sprint_id}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
}

function renderUpdates() {
  const listElement = document.getElementById('updates-list');
  if (!listElement) return;

  if (state.updates.length === 0) {
    listElement.innerHTML = '<div class="loading">No updates yet. Create one to get started.</div>';
    return;
  }

  listElement.innerHTML = state.updates
    .map(
      (update) => `
        <div class="item-card">
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

function handleActionClick(event: Event) {
  const target = event.target as HTMLElement;
  const action = target.dataset.action as Action | undefined;
  if (!action) return;

  event.preventDefault();

  switch (action) {
    case 'new-idea':
      void openIdeaForm('create');
      break;
    case 'edit-idea':
      void openIdeaForm('edit', getIdeaFromDataset(target));
      break;
    case 'delete-idea':
      void deleteIdea(target.dataset.idea);
      break;
    case 'refresh-ideas':
      void loadTabData('ideas');
      break;
    case 'new-story':
      void openStoryForm('create');
      break;
    case 'edit-story':
      void openStoryForm('edit', getStoryFromDataset(target));
      break;
    case 'delete-story':
      void deleteStory(target.dataset.idea, target.dataset.story);
      break;
    case 'refresh-stories':
      void loadTabData('stories');
      break;
    case 'new-sprint':
      void openSprintForm('create');
      break;
    case 'edit-sprint':
      void openSprintForm('edit', getSprintFromDataset(target));
      break;
    case 'delete-sprint':
      void deleteSprint(target.dataset.sprint);
      break;
    case 'refresh-sprints':
      void loadTabData('sprints');
      break;
    case 'new-update':
      void openUpdateForm('create');
      break;
    case 'edit-update':
      void openUpdateForm('edit', getUpdateFromDataset(target));
      break;
    case 'delete-update':
      void deleteUpdate(target.dataset.sprint, target.dataset.idea, target.dataset.story);
      break;
    case 'refresh-updates':
      void loadTabData('updates');
      break;
  }
}

function getIdeaFromDataset(el: HTMLElement): IdeaRecord | undefined {
  const ideaNumber = Number(el.dataset.idea);
  if (Number.isNaN(ideaNumber)) return undefined;
  return state.ideas.find((idea) => idea.idea_number === ideaNumber);
}

function getStoryFromDataset(el: HTMLElement): StoryRecord | undefined {
  const ideaNumber = Number(el.dataset.idea);
  const storyNumber = Number(el.dataset.story);
  if (Number.isNaN(ideaNumber) || Number.isNaN(storyNumber)) return undefined;
  return state.stories.find(
    (story) => story.idea_number === ideaNumber && story.story_number === storyNumber
  );
}

function getSprintFromDataset(el: HTMLElement): SprintRecord | undefined {
  const sprintId = el.dataset.sprint;
  if (!sprintId) return undefined;
  return state.sprints.find((sprint) => sprint.sprint_id === sprintId);
}

function getUpdateFromDataset(el: HTMLElement): UpdateRecord | undefined {
  const sprintId = el.dataset.sprint;
  const ideaNumber = Number(el.dataset.idea);
  const storyNumber = Number(el.dataset.story);
  if (!sprintId || Number.isNaN(ideaNumber) || Number.isNaN(storyNumber)) return undefined;
  return state.updates.find(
    (update) =>
      update.sprint_id === sprintId &&
      update.idea_number === ideaNumber &&
      update.story_number === storyNumber
  );
}

async function openIdeaForm(mode: 'create' | 'edit', idea?: IdeaRecord) {
  if (mode === 'edit' && !idea) {
    showError('Unable to find that idea.');
    return;
  }

  const ideaNumber =
    idea?.idea_number ?? (await getNextIdeaNumber().catch((error) => showError(error.message)));
  if (ideaNumber === undefined || ideaNumber === null) return;

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
        <textarea name="body" placeholder="Additional markdown content">${escapeHtml(
          defaults.body
        )}</textarea>
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
      const result = await window.electronAPI.writeIdea(payload, content);
      if (!result.success) {
        throw new Error(result.error || 'Unable to save idea');
      }

      await fetchIdeas();
      renderIdeas();
      showToast(mode === 'create' ? 'Idea created' : 'Idea updated');
      return true;
    },
  });
}

async function openStoryForm(mode: 'create' | 'edit', story?: StoryRecord) {
  if (mode === 'edit' && !story) {
    showError('Unable to find that story.');
    return;
  }

  await ensureIdeas();
  await ensureSprints();
  const ideaOptions = state.ideas;
  if (!ideaOptions.length) {
    showError('Create an idea before adding stories.');
    return;
  }

  const defaultIdeaNumber = story?.idea_number ?? ideaOptions[0].idea_number;
  const storyNumber =
    story?.story_number ?? (await getNextStoryNumber(defaultIdeaNumber).catch((error) => showError(error.message)));
  if (storyNumber === undefined) return;

  const defaults = {
    title: story?.title ?? '',
    description: story?.description ?? '',
    status: story?.status ?? 'backlog',
    priority: story?.priority ?? 'medium',
    created: story?.created ?? today(),
    assigned_sprint: story?.assigned_sprint ?? '',
    body: story?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Story' : `Edit Story ${story?.idea_number}.${story?.story_number}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Story' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${ideaOptions
              .map(
                (idea) =>
                  `<option value="${idea.idea_number}" ${
                    idea.idea_number === defaultIdeaNumber ? 'selected' : ''
                  }>i${idea.idea_number} — ${escapeHtml(idea.title)}</option>`
              )
              .join('')}
          </select>
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
          <label>Assigned Sprint</label>
          <select name="assigned_sprint">
            <option value="">Backlog</option>
            ${state.sprints
              .map(
                (sprint) =>
                  `<option value="${sprint.sprint_id}" ${
                    sprint.sprint_id === defaults.assigned_sprint ? 'selected' : ''
                  }>${sprint.sprint_id} (${sprint.start_date} → ${sprint.end_date})</option>`
              )
              .join('')}
          </select>
          <div class="helper-text">Leave blank to keep in backlog.</div>
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
    `,
    onOpen: (form) => {
      if (mode === 'create') {
        const ideaSelect = form.querySelector<HTMLSelectElement>('select[name="idea_number"]');
        const storyNumberInput = form.querySelector<HTMLInputElement>('input[name="story_number"]');
        ideaSelect?.addEventListener('change', async () => {
          if (!storyNumberInput) return;
          storyNumberInput.value = '…';
          const next = await getNextStoryNumber(Number(ideaSelect.value));
          if (next !== undefined) {
            storyNumberInput.value = next.toString();
          }
        });
      }
    },
    onSubmit: async (formData) => {
      const assignedSprintValue = (formData.get('assigned_sprint') as string) || '';
      const payload: Story = {
        layout: 'story',
        idea_number: Number(formData.get('idea_number')),
        story_number: Number(formData.get('story_number')),
        title: (formData.get('title') as string).trim(),
        description: (formData.get('description') as string).trim(),
        status: formData.get('status') as StoryStatus,
        priority: formData.get('priority') as StoryPriority,
        created: formData.get('created') as string,
        assigned_sprint: assignedSprintValue || undefined,
      };
      const content = (formData.get('body') as string) ?? '';

      const result = await window.electronAPI.writeStory(payload, content);
      if (!result.success) {
        throw new Error(result.error || 'Unable to save story');
      }

      await fetchStories();
      renderStories();
      showToast(mode === 'create' ? 'Story created' : 'Story updated');
      return true;
    },
  });
}

async function openSprintForm(mode: 'create' | 'edit', sprint?: SprintRecord) {
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
      </div>
      <div class="form-grid">
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
        <textarea name="goals" placeholder="Initialize taxonomy\nShip MVP">${escapeHtml(defaults.goals)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${escapeHtml(defaults.body)}</textarea>
      </div>
    `,
    onOpen: (form) => {
      if (mode === 'create') {
        const sprintIdInput = form.querySelector<HTMLInputElement>('input[name="sprint_id"]');
        const yearInput = form.querySelector<HTMLInputElement>('input[name="year"]');
        const sprintNumberInput = form.querySelector<HTMLInputElement>('input[name="sprint_number"]');

        sprintIdInput?.addEventListener('input', () => {
          const value = sprintIdInput.value.trim();
          if (/^\\d{4}$/.test(value)) {
            const yy = Number(value.slice(0, 2));
            const ss = Number(value.slice(2));
            if (yearInput && (yearInput.value === '' || yearInput.value === '0')) {
              yearInput.value = (2000 + yy).toString();
            }
            if (sprintNumberInput && sprintNumberInput.value === '') {
              sprintNumberInput.value = ss.toString();
            }
          }
        });
      }
    },
    onSubmit: async (formData) => {
      const goals = parseLines(formData.get('goals') as string);
      const payload: Sprint = {
        layout: 'sprint',
        sprint_id: (formData.get('sprint_id') as string).trim(),
        year: Number(formData.get('year')),
        sprint_number: Number(formData.get('sprint_number')),
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        status: formData.get('status') as SprintStatus,
        goals: goals.length ? goals : undefined,
      };

      const content = (formData.get('body') as string) ?? '';
      const result = await window.electronAPI.writeSprint(payload, content);
      if (!result.success) {
        throw new Error(result.error || 'Unable to save sprint');
      }

      await fetchSprints();
      renderSprints();
      showToast(mode === 'create' ? 'Sprint created' : 'Sprint updated');
      return true;
    },
  });
}

async function openUpdateForm(mode: 'create' | 'edit', update?: UpdateRecord) {
  if (mode === 'edit' && !update) {
    showError('Unable to find that update.');
    return;
  }

  await ensureSprints();
  await ensureIdeas();
  await ensureStories();

  if (!state.sprints.length) {
    showError('Create a sprint before adding updates.');
    return;
  }
  if (!state.stories.length) {
    showError('Create a story before adding updates.');
    return;
  }

  const defaults = {
    sprint_id: update?.sprint_id ?? state.sprints[0].sprint_id,
    idea_number: update?.idea_number ?? state.stories[0].idea_number,
    story_number: update?.story_number ?? state.stories[0].story_number,
    type: update?.type ?? 'progress',
    date: update?.date ?? today(),
    body: update?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Update' : `Edit Update ${update?.notation}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Update' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint</label>
          <select name="sprint_id" required>
            ${state.sprints
              .map(
                (sprint) =>
                  `<option value="${sprint.sprint_id}" ${
                    sprint.sprint_id === defaults.sprint_id ? 'selected' : ''
                  }>${sprint.sprint_id} (${sprint.start_date} → ${sprint.end_date})</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${state.ideas
              .map(
                (idea) =>
                  `<option value="${idea.idea_number}" ${
                    idea.idea_number === defaults.idea_number ? 'selected' : ''
                  }>i${idea.idea_number} — ${escapeHtml(idea.title)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Story</label>
          <select name="story_number" required data-story-select>
            ${buildStoryOptions(defaults.idea_number, defaults.story_number)}
          </select>
        </div>
        <div class="form-field">
          <label>Type</label>
          <select name="type" required>
            ${UPDATE_TYPES.map(
              (type) => `<option value="${type}" ${type === defaults.type ? 'selected' : ''}>${type}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Date</label>
          <input type="date" name="date" value="${defaults.date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Notation</label>
        <input type="text" name="notation" value="${formatNotation(
          defaults.sprint_id,
          defaults.idea_number,
          defaults.story_number
        )}" readonly data-notation />
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${escapeHtml(defaults.body)}</textarea>
      </div>
    `,
    onOpen: (form) => {
      const sprintSelect = form.querySelector<HTMLSelectElement>('select[name="sprint_id"]');
      const ideaSelect = form.querySelector<HTMLSelectElement>('select[name="idea_number"]');
      const storySelect = form.querySelector<HTMLSelectElement>('select[name="story_number"]');
      const notationInput = form.querySelector<HTMLInputElement>('input[data-notation]');

      const updateStoryOptions = (preserveSelection: boolean) => {
        if (!ideaSelect || !storySelect) return;
        const ideaNumber = Number(ideaSelect.value);
        const selectedValue = preserveSelection ? Number(storySelect.value) : undefined;
        storySelect.innerHTML = buildStoryOptions(ideaNumber, selectedValue);
        if (!preserveSelection) {
          const firstOption = storySelect.querySelector('option');
          if (firstOption) {
            storySelect.value = firstOption.value;
          }
        }
      };

      const updateNotation = () => {
        if (!notationInput || !sprintSelect || !ideaSelect || !storySelect) return;
        notationInput.value = formatNotation(
          sprintSelect.value,
          Number(ideaSelect.value),
          Number(storySelect.value)
        );
      };

      ideaSelect?.addEventListener('change', () => {
        updateStoryOptions(false);
        updateNotation();
      });
      sprintSelect?.addEventListener('change', updateNotation);
      storySelect?.addEventListener('change', updateNotation);

      updateStoryOptions(true);
      updateNotation();
    },
    onSubmit: async (formData) => {
      const sprintId = formData.get('sprint_id') as string;
      const ideaValue = formData.get('idea_number') as string;
      const storyValue = formData.get('story_number') as string;
      if (!ideaValue) {
        throw new Error('Select an idea for this update.');
      }
      if (!storyValue) {
        throw new Error('Select a story for this update.');
      }

      const ideaNumber = Number(ideaValue);
      const storyNumber = Number(storyValue);

      const payload: Update = {
        layout: 'update',
        sprint_id: sprintId,
        idea_number: ideaNumber,
        story_number: storyNumber,
        type: formData.get('type') as UpdateType,
        date: formData.get('date') as string,
        notation: formatNotation(sprintId, ideaNumber, storyNumber),
      };

      const content = (formData.get('body') as string) ?? '';
      const result = await window.electronAPI.writeUpdate(payload, content);
      if (!result.success) {
        throw new Error(result.error || 'Unable to save update');
      }

      await fetchUpdates();
      renderUpdates();
      showToast(mode === 'create' ? 'Update created' : 'Update updated');
      return true;
    },
  });
}

async function deleteIdea(ideaNumber?: string) {
  if (!ideaNumber) return;
  const parsed = Number(ideaNumber);
  if (Number.isNaN(parsed)) return;
  if (!confirm(`Delete Idea i${ideaNumber}? This cannot be undone.`)) return;

  const result = await window.electronAPI.deleteIdea(parsed);
  if (!result.success) {
    showError(result.error || 'Unable to delete idea');
    return;
  }

  await fetchIdeas();
  renderIdeas();
  showToast('Idea deleted');
}

async function deleteStory(ideaNumber?: string, storyNumber?: string) {
  if (!ideaNumber || !storyNumber) return;
  const idea = Number(ideaNumber);
  const story = Number(storyNumber);
  if (Number.isNaN(idea) || Number.isNaN(story)) return;
  if (!confirm(`Delete Story ${idea}.${story}? This cannot be undone.`)) return;

  const result = await window.electronAPI.deleteStory(idea, story);
  if (!result.success) {
    showError(result.error || 'Unable to delete story');
    return;
  }

  await fetchStories();
  renderStories();
  showToast('Story deleted');
}

async function deleteSprint(sprintId?: string) {
  if (!sprintId) return;
  if (!confirm(`Delete Sprint ${sprintId}? This cannot be undone.`)) return;

  const result = await window.electronAPI.deleteSprint(sprintId);
  if (!result.success) {
    showError(result.error || 'Unable to delete sprint');
    return;
  }

  await fetchSprints();
  renderSprints();
  showToast('Sprint deleted');
}

async function deleteUpdate(sprintId?: string, ideaNumber?: string, storyNumber?: string) {
  if (!sprintId || !ideaNumber || !storyNumber) return;
  const idea = Number(ideaNumber);
  const story = Number(storyNumber);
  if (Number.isNaN(idea) || Number.isNaN(story)) return;

  if (!confirm(`Delete Update ${sprintId}.${idea}.${story}? This cannot be undone.`)) return;

  const result = await window.electronAPI.deleteUpdate(sprintId, idea, story);
  if (!result.success) {
    showError(result.error || 'Unable to delete update');
    return;
  }

  await fetchUpdates();
  renderUpdates();
  showToast('Update deleted');
}

function buildStoryOptions(ideaNumber: number, selectedStory?: number) {
  const stories = state.stories.filter((story) => story.idea_number === ideaNumber);
  if (!stories.length) {
    return '<option value="" disabled selected>No stories found</option>';
  }

  return stories
    .map(
      (story) =>
        `<option value="${story.story_number}" ${
          story.story_number === selectedStory ? 'selected' : ''
        }>${story.story_number} — ${escapeHtml(story.title)}</option>`
    )
    .join('');
}

function openModal(options: ModalOptions) {
  modalDialog.dataset.size = options.width ?? 'md';
  modalTitle.textContent = options.title;

  modalForm.innerHTML = `
    ${options.body}
    <div class="modal__actions">
      <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
      <button type="submit" class="btn btn-primary" data-default-text="${options.submitLabel ?? 'Save'}">${
        options.submitLabel ?? 'Save'
      }</button>
    </div>
  `;

  modalForm.querySelector('[data-modal-cancel]')?.addEventListener('click', closeModal);

  activeSubmitHandler = options.onSubmit;
  modal.classList.remove('hidden');
  options.onOpen?.(modalForm);
}

function closeModal() {
  modal.classList.add('hidden');
  modalForm.reset();
  modalForm.innerHTML = '';
  activeSubmitHandler = null;
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function showError(message: string) {
  if (errorBanner) {
    errorBanner.textContent = message;
    errorBanner.style.display = 'block';
    setTimeout(() => {
      errorBanner.style.display = 'none';
    }, 5000);
  }
  showToast(message, 'error');
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function escapeAttr(value: string): string {
  return (value ?? '').replace(/"/g, '&quot;');
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseLines(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureIdeas() {
  if (!state.ideas.length) {
    await fetchIdeas();
  }
}

async function ensureStories() {
  if (!state.stories.length) {
    await fetchStories();
  }
}

async function ensureSprints() {
  if (!state.sprints.length) {
    await fetchSprints();
  }
}

async function getNextIdeaNumber(): Promise<number> {
  const result = await window.electronAPI.getNextIdeaNumber();
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'Unable to determine next idea number');
  }
  return result.data;
}

async function getNextStoryNumber(ideaNumber: number): Promise<number> {
  const result = await window.electronAPI.getNextStoryNumber(ideaNumber);
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || 'Unable to determine next story number');
  }
  return result.data;
}

// Initial load
void loadTabData('ideas');

