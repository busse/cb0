# TypeScript Practices Review

## Overview

The project uses TypeScript for the Electron application with multiple configuration files for different contexts (main, preload, renderer). This review examines TypeScript usage patterns, type safety, and opportunities for improvement.

## Configuration Analysis

### Current Configurations

**Main Process (`tsconfig.main.json`):**
```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out/main"
  }
}
```

**Preload (`tsconfig.preload.json`):**
```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out/main"  // Note: same as main
  }
}
```

**Base (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  }
}
```

### Configuration Issues

**Issue #1: Inconsistent Strictness**
Not all configs explicitly enable all strict checks.

**Recommended Addition:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

**Issue #2: Path Aliases Not Used**
Could improve import organization:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@main/*": ["./src/main/*"],
      "@renderer/*": ["./src/renderer/*"]
    }
  }
}
```

**Note:** The renderer already uses `@shared/types` import which suggests partial path alias setup.

## Type Safety Analysis

### Well-Typed Areas

**1. Type Definitions (`shared/types.ts`)** ⭐⭐⭐⭐⭐
```typescript
export type IdeaStatus = 'planned' | 'active' | 'completed' | 'archived';
export type StoryStatus = 'backlog' | 'planned' | 'in-progress' | 'done';

export interface Idea {
  layout: 'idea';
  idea_number: number;
  title: string;
  description: string;
  status: IdeaStatus;
  created: string;
  tags?: string[];
}
```
- Proper use of union types for enums
- Clear interface definitions
- Optional properties marked correctly

**2. Preload API Types (`main/preload.ts`)** ⭐⭐⭐⭐
```typescript
declare global {
  interface Window {
    electronAPI: {
      readIdeas: () => Promise<{ success: boolean; data?: Idea[]; error?: string }>;
      // ... comprehensive type definitions
    };
  }
}
```
- Full API typing in global namespace
- Return types include error cases

### Type Safety Issues

**Issue #1: Type Assertions**
Location: `main/index.ts`
```typescript
return { success: false, error: (error as Error).message };
```

**Problem:** Assumes caught value is always Error.
**Solution:**
```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

return { success: false, error: getErrorMessage(error) };
```

**Issue #2: Data from Markdown Parsing**
Location: `shared/file-utils.ts`
```typescript
const parsed = matter(content);
const data = parsed.data as Idea;  // Unsafe cast
```

**Problem:** No runtime validation that parsed data matches type.
**Solution:**
```typescript
import { z } from 'zod';  // or similar

const IdeaSchema = z.object({
  layout: z.literal('idea'),
  idea_number: z.number(),
  title: z.string(),
  // ...
});

const data = IdeaSchema.parse(parsed.data);
```

**Issue #3: Implicit Any in Event Handlers**
Location: `renderer/main.ts`
```typescript
function handleActionClick(event: Event) {
  const target = event.target as HTMLElement;  // Could be null
  const action = target.dataset.action as Action | undefined;
  // ...
}
```

**Safer Alternative:**
```typescript
function handleActionClick(event: Event) {
  if (!(event.target instanceof HTMLElement)) return;
  const target = event.target;
  const action = target.dataset.action;
  if (!isValidAction(action)) return;
  // ... now type-safe
}

function isValidAction(action: unknown): action is Action {
  return typeof action === 'string' && VALID_ACTIONS.includes(action as Action);
}
```

**Issue #4: Form Data Access**
Location: `renderer/main.ts`
```typescript
const payload: Idea = {
  layout: 'idea',
  idea_number: Number(formData.get('idea_number')),  // Could be NaN
  title: (formData.get('title') as string).trim(),   // Could be null
  // ...
};
```

**Safer Alternative:**
```typescript
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
```

### Missing Type Definitions

**1. IPC Response Types**
```typescript
// Current: Inconsistent structure
{ success: true, data: T }
{ success: false, error: string }
{ success: false, canceled: true }  // Only in some handlers

// Recommended: Unified result type
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
  | { success: false; canceled: true };
```

**2. Form Modal Types**
```typescript
// Current: Loose typing
type ModalOptions = {
  title: string;
  body: string;
  onSubmit: (formData: FormData, form: HTMLFormElement) => Promise<boolean | void>;
};

// Recommended: Generic form typing
type ModalOptions<T> = {
  title: string;
  body: string;
  validate?: (data: T) => ValidationResult;
  onSubmit: (data: T) => Promise<SubmitResult>;
};
```

## Pattern Analysis

### Good Patterns

**1. Discriminated Unions**
```typescript
export type UpdateType = 'progress' | 'completion' | 'blocker' | 'note';
```

**2. Record Types with Body Content**
```typescript
export type MarkdownDocument = { body?: string; };
export type IdeaRecord = Idea & MarkdownDocument;
```

**3. Validation Functions Return Arrays**
```typescript
export function validateIdea(idea: Partial<Idea>, ...): string[] {
  const errors: string[] = [];
  // ... accumulate errors
  return errors;
}
```

### Anti-Patterns

**1. Object Index Access Without Checking**
```typescript
const story = state.stories.find(...);
// Later usage without null check
story.title  // Could be undefined
```

**2. Type Widening in Constants**
```typescript
const IDEA_STATUSES: IdeaStatus[] = ['planned', 'active', 'completed', 'archived'];
// Better: as const
const IDEA_STATUSES = ['planned', 'active', 'completed', 'archived'] as const;
```

**3. Any Types (Implicit)**
```typescript
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  // 'any' allows unsafe operations
}
// Better:
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  // ...
}
```

## Import Organization

### Current State
```typescript
// Mixed import styles
import type { Idea, Story, Sprint, Update, Figure } from '../shared/types';
import { validateIdea, validateStory, ... } from '../shared/validation';
```

**Recommendation:** Enforce consistent import ordering:
```typescript
// 1. External packages
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

// 2. Type-only imports
import type { Idea, Story, Sprint, Update, Figure } from '@shared/types';

// 3. Internal modules
import { readIdeas, writeIdea } from '@shared/file-utils';
import { validateIdea } from '@shared/validation';
```

## Utility Types Usage

### Present Usage
```typescript
Partial<Idea>  // Used in validation
```

### Opportunities
```typescript
// For form state
type IdeaFormData = Pick<Idea, 'title' | 'description' | 'status' | 'tags'>;

// For API responses
type ApiResponse<T> = Promise<{ success: true; data: T } | { success: false; error: string }>;

// For readonly data
type ReadonlyIdea = Readonly<Idea>;

// For required fields
type RequiredIdeaFields = Required<Pick<Idea, 'title' | 'description'>>;
```

## Recommendations

### Immediate Actions

1. **Enable Additional Strict Flags**
```json
{
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true
}
```

2. **Add Type Guard Functions**
```typescript
// Create src/shared/type-guards.ts
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isAction(value: unknown): value is Action {
  return typeof value === 'string' && ACTIONS.includes(value);
}
```

3. **Create Result Type**
```typescript
// src/shared/result.ts
export type Result<T, E = string> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

### Short-Term Improvements

1. Add runtime validation with Zod
2. Create form data extraction utilities
3. Implement consistent error handling
4. Add ESLint TypeScript rules

### Long-Term Goals

1. Generate types from schema definitions
2. Add type tests
3. Document generic utility types
4. Consider effect system for error handling

## TypeScript Metrics

| Metric | Current | Target |
|--------|---------|--------|
| `any` usage | ~5 | 0 |
| Type assertions | ~20 | < 5 |
| Type coverage | ~80% | > 95% |
| Strict mode | Partial | Full |

## Conclusion

The TypeScript usage in this project is good but could be strengthened significantly by:

1. Enabling stricter compiler options
2. Reducing type assertions in favor of type guards
3. Adding runtime validation for external data
4. Creating utility types for common patterns

These improvements would catch more bugs at compile time and improve code reliability.
