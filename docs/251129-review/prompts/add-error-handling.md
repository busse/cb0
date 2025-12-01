# Prompt: Add Structured Error Handling

> **Purpose:** Implement consistent error handling patterns across the codebase
> **Target Files:** Electron main and renderer processes
> **Estimated Time:** 4 hours

---

## Context

Currently, errors are handled inconsistently:
- Type assertions for caught errors: `(error as Error).message`
- Generic error messages
- No structured error types
- Inconsistent error display to users

## Objective

Create a robust error handling system with:
1. Custom error types
2. Error type guards
3. User-friendly error messages
4. Proper error propagation

---

## Task 1: Create Error Types

### Create `electron/src/shared/errors.ts`:

```typescript
/**
 * Base error class for application errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation error with multiple validation messages
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  
  constructor(public readonly errors: string[]) {
    super(errors.join(', '));
  }
  
  get userMessage(): string {
    return this.errors.length === 1
      ? this.errors[0]
      : `Please fix the following issues:\n• ${this.errors.join('\n• ')}`;
  }
}

/**
 * File not found error
 */
export class FileNotFoundError extends AppError {
  readonly code = 'FILE_NOT_FOUND';
  
  constructor(public readonly filePath: string) {
    super(`File not found: ${filePath}`);
  }
  
  get userMessage(): string {
    return `The requested file could not be found. It may have been moved or deleted.`;
  }
}

/**
 * File operation error (read/write/delete)
 */
export class FileOperationError extends AppError {
  readonly code = 'FILE_OPERATION_ERROR';
  
  constructor(
    public readonly operation: 'read' | 'write' | 'delete',
    public readonly filePath: string,
    public readonly cause?: Error
  ) {
    super(`Failed to ${operation} file: ${filePath}`);
  }
  
  get userMessage(): string {
    return `Unable to ${this.operation} the file. Please try again or check file permissions.`;
  }
}

/**
 * Duplicate entity error
 */
export class DuplicateError extends AppError {
  readonly code = 'DUPLICATE_ERROR';
  
  constructor(
    public readonly entityType: string,
    public readonly identifier: string | number
  ) {
    super(`${entityType} ${identifier} already exists`);
  }
  
  get userMessage(): string {
    return `A ${this.entityType.toLowerCase()} with this identifier already exists. Please choose a different one.`;
  }
}

/**
 * Reference error (parent entity doesn't exist)
 */
export class ReferenceError extends AppError {
  readonly code = 'REFERENCE_ERROR';
  
  constructor(
    public readonly entityType: string,
    public readonly identifier: string | number
  ) {
    super(`Referenced ${entityType} ${identifier} does not exist`);
  }
  
  get userMessage(): string {
    return `The referenced ${this.entityType.toLowerCase()} could not be found.`;
  }
}

/**
 * Path security error
 */
export class PathSecurityError extends AppError {
  readonly code = 'PATH_SECURITY_ERROR';
  
  constructor() {
    super('Access denied: attempted path traversal');
  }
  
  get userMessage(): string {
    return 'Access denied. The requested path is not allowed.';
  }
}
```

---

## Task 2: Create Error Utilities

### Add to `electron/src/shared/errors.ts`:

```typescript
/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Get user-friendly error message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    // Common Node.js errors
    if (error.message.includes('ENOENT')) {
      return 'The requested file could not be found.';
    }
    if (error.message.includes('EACCES')) {
      return 'Permission denied. Check file access rights.';
    }
    if (error.message.includes('ENOSPC')) {
      return 'Disk space is full. Free up some space and try again.';
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get technical error message for logging
 */
export function getTechnicalMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return String(error);
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler: (error: unknown) => T
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorHandler(error);
    }
  };
}
```

---

## Task 3: Update Validation Functions

### Update `electron/src/shared/validation.ts`:

```typescript
import { ValidationError } from './errors';

/**
 * Validate and throw if invalid
 */
export function assertValidIdea(
  idea: Partial<Idea>,
  existingIdeas: Idea[],
  excludeIdeaNumber?: number
): void {
  const errors = validateIdea(idea, existingIdeas, excludeIdeaNumber);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/**
 * Validate and throw if invalid
 */
export function assertValidStory(
  story: Partial<Story>,
  existingStories: Story[],
  existingIdeas: Idea[],
  excludeIdeaNumber?: number,
  excludeStoryNumber?: number
): void {
  const errors = validateStory(story, existingStories, existingIdeas, excludeIdeaNumber, excludeStoryNumber);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

// Similar for validateSprint, validateFigure
```

---

## Task 4: Update IPC Handlers

### Update `electron/src/main/index.ts`:

```typescript
import { 
  getUserMessage, 
  getTechnicalMessage,
  isValidationError,
  ValidationError 
} from '../shared/errors';
import { assertValidIdea } from '../shared/validation';

// Updated handler pattern
ipcMain.handle('write-idea', async (_event, idea: Idea, content: string) => {
  try {
    const existingIdeas = await readIdeas();
    const ideaFilePath = path.join(PATHS.ideas, `${idea.idea_number}.md`);
    const isEditing = await fsPromises.access(ideaFilePath).then(() => true).catch(() => false);
    
    // Use assertValidIdea instead of returning errors
    assertValidIdea(idea, existingIdeas, isEditing ? idea.idea_number : undefined);
    
    await writeIdea(idea, content);
    return { success: true };
  } catch (error) {
    // Log technical details
    console.error('write-idea error:', getTechnicalMessage(error));
    
    // Return user-friendly message
    return { 
      success: false, 
      error: getUserMessage(error),
      code: isValidationError(error) ? 'VALIDATION_ERROR' : 'UNKNOWN_ERROR'
    };
  }
});
```

---

## Task 5: Update Renderer Error Display

### Update `electron/src/renderer/main.ts`:

```typescript
interface ApiError {
  error: string;
  code?: string;
}

function handleApiError(error: ApiError): void {
  // Different handling based on error type
  if (error.code === 'VALIDATION_ERROR') {
    showError(error.error);
    // Keep modal open for validation errors
    return;
  }
  
  showError(error.error);
  closeModal();
}

// In form submit handlers
async function submitIdeaForm(formData: FormData): Promise<boolean> {
  try {
    const payload = buildIdeaPayload(formData);
    const content = formData.get('body') as string;
    
    const result = await window.electronAPI.writeIdea(payload, content);
    
    if (!result.success) {
      handleApiError(result);
      return false; // Don't close modal
    }
    
    await fetchIdeas();
    renderIdeas();
    showToast('Idea saved');
    return true; // Close modal
  } catch (error) {
    showError('An unexpected error occurred');
    console.error(error);
    return false;
  }
}
```

---

## Task 6: Add ESLint No-Throw-Literal Rule

### Update/Create `.eslintrc.json`:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-throw-literal": "error",
    "@typescript-eslint/prefer-promise-reject-errors": "error"
  }
}
```

---

## Verification

1. **Test error messages:**
   ```typescript
   // Create duplicate idea
   await createIdea({ idea_number: 0 });
   await createIdea({ idea_number: 0 }); // Should show user-friendly duplicate error
   ```

2. **Test validation errors:**
   - Submit form with missing required fields
   - Verify error messages are helpful

3. **Test file errors:**
   - Delete a file manually, then try to edit it
   - Verify error message is user-friendly

4. **Run tests:**
   ```bash
   npm run test:electron
   ```

---

## Success Criteria

- [ ] All errors use structured error types
- [ ] No `(error as Error).message` type assertions
- [ ] User sees friendly error messages
- [ ] Technical errors are logged to console
- [ ] Validation errors keep modals open
- [ ] ESLint rule prevents throw literals
- [ ] All existing tests pass
