# Prompt: Refactor Electron Main Process

> **Purpose:** Split large files and improve main process architecture
> **Target Files:** `electron/src/main/index.ts`, `electron/src/renderer/main.ts`
> **Estimated Time:** 4-8 hours

---

## Context

The Electron application has two large files that should be refactored:
1. `main/index.ts` (411 lines) - Main process with 15+ similar IPC handlers
2. `renderer/main.ts` (1577 lines) - Renderer with mixed concerns

## Objective

Refactor these files into smaller, focused modules while maintaining functionality.

---

## Task 1: Create IPC Handler Factory

### Current Pattern (repeated 15+ times):
```typescript
ipcMain.handle('read-ideas', async () => {
  try {
    return { success: true, data: await readIdeas() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
```

### Create `electron/src/main/ipc-factory.ts`:
```typescript
import { ipcMain, IpcMainInvokeEvent } from 'electron';

export type IpcResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function handleAsync<T>(
  channel: string,
  handler: () => Promise<T>
): void {
  ipcMain.handle(channel, async (): Promise<IpcResult<T>> => {
    try {
      return { success: true, data: await handler() };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export function handleAsyncWithArgs<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (...args: TArgs) => Promise<TResult>
): void {
  ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, ...args: TArgs): Promise<IpcResult<TResult>> => {
    try {
      return { success: true, data: await handler(...args) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  });
}
```

### Refactor handlers to use factory:
```typescript
// Before
ipcMain.handle('read-ideas', async () => {
  try {
    return { success: true, data: await readIdeas() };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// After
handleAsync('read-ideas', readIdeas);
handleAsync('read-stories', readStories);
handleAsync('read-sprints', readSprints);
```

---

## Task 2: Split Main Process Handlers

### Create `electron/src/main/handlers/index.ts`:
```typescript
import { registerReadHandlers } from './read-handlers';
import { registerWriteHandlers } from './write-handlers';
import { registerDeleteHandlers } from './delete-handlers';
import { registerUtilityHandlers } from './utility-handlers';

export function registerAllHandlers(): void {
  registerReadHandlers();
  registerWriteHandlers();
  registerDeleteHandlers();
  registerUtilityHandlers();
}
```

### Create `electron/src/main/handlers/read-handlers.ts`:
```typescript
import { handleAsync } from '../ipc-factory';
import { readIdeas, readStories, readSprints, readUpdates, readFigures } from '../../shared/file-utils';

export function registerReadHandlers(): void {
  handleAsync('read-ideas', readIdeas);
  handleAsync('read-stories', readStories);
  handleAsync('read-sprints', readSprints);
  handleAsync('read-updates', readUpdates);
  handleAsync('read-figures', readFigures);
}
```

### Similar files for:
- `write-handlers.ts`
- `delete-handlers.ts`
- `utility-handlers.ts`

---

## Task 3: Split Renderer into Modules

### Create module structure:
```
electron/src/renderer/
├── main.ts              # Entry point, initialization
├── state.ts             # Application state
├── api.ts               # IPC communication wrapper
├── modal.ts             # Modal management
├── toast.ts             # Toast notifications
├── components/
│   └── forms/
│       ├── index.ts     # Form exports
│       ├── idea-form.ts
│       ├── story-form.ts
│       ├── sprint-form.ts
│       ├── update-form.ts
│       └── figure-form.ts
└── utils/
    ├── dom.ts           # DOM utilities
    └── format.ts        # Formatting helpers
```

### `renderer/state.ts`:
```typescript
import type { IdeaRecord, StoryRecord, SprintRecord, UpdateRecord, FigureRecord } from '@shared/types';

export type AppState = {
  ideas: IdeaRecord[];
  stories: StoryRecord[];
  sprints: SprintRecord[];
  updates: UpdateRecord[];
  figures: FigureRecord[];
};

export type Tab = 'ideas' | 'stories' | 'sprints' | 'updates' | 'figures';

export const state: AppState = {
  ideas: [],
  stories: [],
  sprints: [],
  updates: [],
  figures: [],
};

export let currentTab: Tab = 'ideas';

export function setCurrentTab(tab: Tab): void {
  currentTab = tab;
}
```

### `renderer/api.ts`:
```typescript
import type { Idea, Story, Sprint, Update, Figure } from '@shared/types';
import { state } from './state';

export async function fetchIdeas(): Promise<void> {
  const result = await window.electronAPI.readIdeas();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to load ideas');
  }
  state.ideas = result.data;
}

export async function saveIdea(idea: Idea, content: string): Promise<void> {
  const result = await window.electronAPI.writeIdea(idea, content);
  if (!result.success) {
    throw new Error(result.error || 'Failed to save idea');
  }
}

// ... similar for other entities
```

### `renderer/utils/dom.ts`:
```typescript
export function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

export function escapeAttr(value: string): string {
  return (value ?? '').replace(/"/g, '&quot;');
}

export function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
```

### `renderer/modal.ts`:
```typescript
export type ModalOptions = {
  title: string;
  body: string;
  submitLabel?: string;
  width?: 'md' | 'lg';
  onSubmit: (formData: FormData, form: HTMLFormElement) => Promise<boolean | void>;
  onOpen?: (form: HTMLFormElement) => void;
};

let activeSubmitHandler: ModalOptions['onSubmit'] | null = null;

const modal = document.getElementById('modal') as HTMLDivElement;
const modalDialog = modal.querySelector<HTMLDivElement>('.modal__dialog')!;
const modalForm = document.getElementById('modal-form') as HTMLFormElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;

export function openModal(options: ModalOptions): void {
  modalDialog.dataset.size = options.width ?? 'md';
  modalTitle.textContent = options.title;
  // ... rest of implementation
}

export function closeModal(): void {
  modal.classList.add('hidden');
  modalForm.reset();
  modalForm.innerHTML = '';
  activeSubmitHandler = null;
}
```

### Refactored `renderer/main.ts`:
```typescript
import { state, setCurrentTab, type Tab } from './state';
import { fetchIdeas, fetchStories, fetchSprints, fetchUpdates, fetchFigures } from './api';
import { openModal, closeModal } from './modal';
import { showToast, showError } from './toast';
import { openIdeaForm } from './components/forms/idea-form';
import { openStoryForm } from './components/forms/story-form';
// ... other imports

// Initialization
async function init(): Promise<void> {
  setupTabNavigation();
  setupModalHandlers();
  await loadTabData('ideas');
}

function setupTabNavigation(): void {
  const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab');
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab as Tab;
      if (tab) switchTab(tab);
    });
  });
}

// Start application
init().catch(console.error);
```

---

## Verification

After refactoring:

1. **Run the application:**
   ```bash
   cd electron && npm run dev
   ```

2. **Test all CRUD operations:**
   - Create, edit, delete ideas
   - Create, edit, delete stories
   - Same for sprints, updates, figures

3. **Run existing tests:**
   ```bash
   npm run test:electron
   ```

4. **Check file sizes:**
   - `main/index.ts` should be < 200 lines
   - All renderer files should be < 500 lines

---

## Success Criteria

- [ ] All existing functionality works
- [ ] No file exceeds 500 lines
- [ ] IPC handlers use factory pattern
- [ ] Renderer is split into focused modules
- [ ] All tests pass
- [ ] No new TypeScript errors
