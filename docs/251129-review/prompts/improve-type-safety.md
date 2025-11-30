# Prompt: Improve TypeScript Type Safety

> **Purpose:** Enable strict TypeScript mode and eliminate type safety issues
> **Target Files:** All TypeScript files in `electron/`
> **Estimated Time:** 4-8 hours

---

## Context

The codebase has good type definitions but could benefit from stricter TypeScript configuration:
- Some `any` types in use
- Type assertions instead of type guards
- Implicit `any` in some places
- Unchecked indexed access

## Objective

1. Enable strict TypeScript mode
2. Add type guards for runtime checking
3. Replace type assertions with proper type narrowing
4. Ensure full type coverage

---

## Task 1: Update TypeScript Configuration

### Update `electron/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@main/*": ["./src/main/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out", "renderer-dist"]
}
```

### Update `electron/tsconfig.main.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "out/main",
    "declaration": false
  },
  "include": ["src/main/**/*", "src/shared/**/*"]
}
```

### Update `electron/tsconfig.preload.json`:

```json
{
  "extends": "./tsconfig.main.json",
  "compilerOptions": {
    "outDir": "out/main"
  },
  "include": ["src/main/preload.ts", "src/shared/types.ts"]
}
```

---

## Task 2: Create Type Guards

### Create `electron/src/shared/type-guards.ts`:

```typescript
/**
 * Type guards for runtime type checking
 */

import type { 
  Idea, 
  Story, 
  Sprint, 
  Update, 
  Figure,
  IdeaStatus,
  StoryStatus,
  StoryPriority,
  SprintStatus,
  UpdateType,
  FigureStatus
} from './types';

// Status validators
const IDEA_STATUSES: readonly IdeaStatus[] = ['planned', 'active', 'completed', 'archived'];
const STORY_STATUSES: readonly StoryStatus[] = ['backlog', 'planned', 'in-progress', 'done'];
const STORY_PRIORITIES: readonly StoryPriority[] = ['low', 'medium', 'high', 'critical'];
const SPRINT_STATUSES: readonly SprintStatus[] = ['planned', 'active', 'completed'];
const UPDATE_TYPES: readonly UpdateType[] = ['progress', 'completion', 'blocker', 'note'];
const FIGURE_STATUSES: readonly FigureStatus[] = ['active', 'archived'];

export function isIdeaStatus(value: unknown): value is IdeaStatus {
  return typeof value === 'string' && IDEA_STATUSES.includes(value as IdeaStatus);
}

export function isStoryStatus(value: unknown): value is StoryStatus {
  return typeof value === 'string' && STORY_STATUSES.includes(value as StoryStatus);
}

export function isStoryPriority(value: unknown): value is StoryPriority {
  return typeof value === 'string' && STORY_PRIORITIES.includes(value as StoryPriority);
}

export function isSprintStatus(value: unknown): value is SprintStatus {
  return typeof value === 'string' && SPRINT_STATUSES.includes(value as SprintStatus);
}

export function isUpdateType(value: unknown): value is UpdateType {
  return typeof value === 'string' && UPDATE_TYPES.includes(value as UpdateType);
}

export function isFigureStatus(value: unknown): value is FigureStatus {
  return typeof value === 'string' && FIGURE_STATUSES.includes(value as FigureStatus);
}

// Error type guard
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// NodeJS error type guard
export function isNodeError(value: unknown): value is NodeJS.ErrnoException {
  return isError(value) && 'code' in value;
}

// Object type guard
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// String type guard
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Number type guard
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

// Array type guard factory
export function isArrayOf<T>(guard: (item: unknown) => item is T) {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(guard);
  };
}

// Optional value accessor
export function getOptional<T>(
  value: T | undefined | null,
  defaultValue: T
): T {
  return value ?? defaultValue;
}

// Safe array access
export function getAt<T>(arr: T[], index: number): T | undefined {
  return arr[index];
}

// Safe object property access
export function getProp<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K
): T[K] | undefined {
  return obj?.[key];
}
```

---

## Task 3: Fix Type Assertions

### Update `electron/src/main/index.ts`:

Replace type assertions with type guards:

```typescript
// Before
return { success: false, error: (error as Error).message };

// After
import { isError } from '../shared/type-guards';
import { getErrorMessage } from '../shared/errors';

// In catch blocks
catch (error) {
  return { success: false, error: getErrorMessage(error) };
}
```

### Update error handling helper:

```typescript
// In shared/errors.ts or type-guards.ts
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
```

---

## Task 4: Fix Renderer Type Issues

### Update `electron/src/renderer/main.ts`:

**Fix event target handling:**
```typescript
// Before
function handleActionClick(event: Event) {
  const target = event.target as HTMLElement;
  const action = target.dataset.action as Action | undefined;
}

// After
function handleActionClick(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  
  const action = target.dataset.action;
  if (!isValidAction(action)) return;
  
  // Now action is typed as Action
}

const VALID_ACTIONS = [
  'new-idea', 'edit-idea', 'delete-idea', 'refresh-ideas',
  'new-story', 'edit-story', 'delete-story', 'refresh-stories',
  // ... etc
] as const;

type Action = typeof VALID_ACTIONS[number];

function isValidAction(value: unknown): value is Action {
  return typeof value === 'string' && VALID_ACTIONS.includes(value as Action);
}
```

**Fix form data extraction:**
```typescript
// Before
const payload: Idea = {
  idea_number: Number(formData.get('idea_number')),  // Could be NaN
  title: (formData.get('title') as string).trim(),   // Could be null
};

// After
function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    throw new Error(`Expected string for ${key}`);
  }
  return value.trim();
}

function getFormNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  if (Number.isNaN(value)) {
    throw new Error(`Expected number for ${key}`);
  }
  return value;
}

const payload: Idea = {
  layout: 'idea',
  idea_number: getFormNumber(formData, 'idea_number'),
  title: getFormString(formData, 'title'),
  // ...
};
```

**Fix array access:**
```typescript
// Before
const firstIdea = state.ideas[0];  // Could be undefined
firstIdea.title;  // Error with noUncheckedIndexedAccess

// After
const firstIdea = state.ideas[0];
if (firstIdea) {
  console.log(firstIdea.title);
}

// Or use helper
const firstIdea = getAt(state.ideas, 0);
const title = getProp(firstIdea, 'title') ?? 'Untitled';
```

---

## Task 5: Fix File Utils Type Issues

### Update `electron/src/shared/file-utils.ts`:

**Fix gray-matter parsing:**
```typescript
import matter from 'gray-matter';
import type { Idea, IdeaRecord } from './types';
import { isObject } from './type-guards';

function parseIdeaFrontMatter(data: unknown): Idea {
  if (!isObject(data)) {
    throw new Error('Invalid front matter');
  }
  
  return {
    layout: 'idea',
    idea_number: typeof data.idea_number === 'number' ? data.idea_number : 0,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    status: isIdeaStatus(data.status) ? data.status : 'planned',
    created: typeof data.created === 'string' ? data.created : '',
    tags: Array.isArray(data.tags) ? data.tags.filter(isString) : undefined,
  };
}

export async function readIdeas(): Promise<IdeaRecord[]> {
  const files = await fs.readdir(PATHS.ideas);
  const ideas: IdeaRecord[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(PATHS.ideas, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parseIdeaFrontMatter(parsed.data);
    ideas.push({
      ...data,
      body: parsed.content?.trim() ?? '',
    });
  }

  return ideas.sort((a, b) => a.idea_number - b.idea_number);
}
```

---

## Task 6: Create Result Type

### Add to `electron/src/shared/types.ts`:

```typescript
/**
 * Result type for operations that can fail
 */
export type Result<T, E = string> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Helper functions for Result type
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}
```

---

## Verification

1. **Run TypeScript compiler:**
   ```bash
   cd electron && npx tsc --noEmit
   ```
   
   Should complete with no errors.

2. **Run the application:**
   ```bash
   npm run dev
   ```
   
   Test all CRUD operations.

3. **Run tests:**
   ```bash
   npm run test:electron
   ```

4. **Check for any remaining `any` types:**
   ```bash
   grep -r "any" src/ --include="*.ts" | grep -v "node_modules"
   ```

---

## Success Criteria

- [ ] All tsconfig files have `strict: true`
- [ ] No TypeScript compilation errors
- [ ] No `any` types (except in third-party type definitions)
- [ ] No type assertions (`as Type`) without preceding type guard
- [ ] All array access is bounds-checked
- [ ] All FormData access is validated
- [ ] Type guards created for all domain types
- [ ] All tests pass
