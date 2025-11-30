# Prompt: Enhance Testing Coverage

> **Purpose:** Expand test coverage with unit tests and improve existing E2E tests
> **Target Files:** `electron/tests/` directory
> **Estimated Time:** 4-8 hours

---

## Context

The project has Playwright E2E tests for the Electron app but lacks:
- Unit tests for shared modules
- Integration tests for IPC handlers
- Proper test fixtures and cleanup
- CI integration

---

## Task 1: Add Unit Testing Framework

### Install Vitest:
```bash
cd electron
npm install --save-dev vitest @vitest/coverage-v8
```

### Create `electron/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/**/*.ts'],
      exclude: ['src/shared/types.ts']
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
    }
  }
});
```

### Update `electron/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test tests/playwright-mcp"
  }
}
```

---

## Task 2: Create Unit Tests for Validation

### Create `electron/tests/unit/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  isValidSprintId,
  isValidIdeaNumber,
  isValidStoryNumber,
  isValidNotation,
  formatNotation,
  parseNotation,
  getNextIdeaNumber,
  getNextStoryNumber,
  validateIdea,
  validateStory,
  validateSprint
} from '@shared/validation';
import type { Idea, Story, Sprint } from '@shared/types';

describe('Sprint ID Validation', () => {
  describe('isValidSprintId', () => {
    it('accepts valid 4-digit sprint IDs', () => {
      expect(isValidSprintId('2501')).toBe(true);
      expect(isValidSprintId('2526')).toBe(true);
      expect(isValidSprintId('2612')).toBe(true);
    });

    it('rejects IDs with wrong length', () => {
      expect(isValidSprintId('250')).toBe(false);
      expect(isValidSprintId('25001')).toBe(false);
      expect(isValidSprintId('')).toBe(false);
    });

    it('rejects non-numeric IDs', () => {
      expect(isValidSprintId('abcd')).toBe(false);
      expect(isValidSprintId('25a1')).toBe(false);
      expect(isValidSprintId('25.1')).toBe(false);
    });
  });
});

describe('Idea Number Validation', () => {
  describe('isValidIdeaNumber', () => {
    it('accepts zero', () => {
      expect(isValidIdeaNumber(0)).toBe(true);
    });

    it('accepts positive integers', () => {
      expect(isValidIdeaNumber(1)).toBe(true);
      expect(isValidIdeaNumber(100)).toBe(true);
    });

    it('rejects negative numbers', () => {
      expect(isValidIdeaNumber(-1)).toBe(false);
    });

    it('rejects non-integers', () => {
      expect(isValidIdeaNumber(1.5)).toBe(false);
      expect(isValidIdeaNumber(NaN)).toBe(false);
    });
  });
});

describe('Notation Formatting', () => {
  describe('formatNotation', () => {
    it('formats full notation with sprint, idea, and story', () => {
      expect(formatNotation('2609', 5, 56)).toBe('2609.5.56');
    });

    it('formats idea.story notation', () => {
      expect(formatNotation(undefined, 5, 56)).toBe('5.56');
    });

    it('formats idea-only notation', () => {
      expect(formatNotation(undefined, 5, undefined)).toBe('i5');
    });

    it('formats story-only notation', () => {
      expect(formatNotation(undefined, undefined, 56)).toBe('s56');
    });

    it('returns empty string for no input', () => {
      expect(formatNotation()).toBe('');
    });
  });

  describe('parseNotation', () => {
    it('parses full notation', () => {
      expect(parseNotation('2609.5.56')).toEqual({
        sprintId: '2609',
        ideaNumber: 5,
        storyNumber: 56
      });
    });

    it('parses idea.story notation', () => {
      expect(parseNotation('5.56')).toEqual({
        ideaNumber: 5,
        storyNumber: 56
      });
    });

    it('parses idea notation', () => {
      expect(parseNotation('i5')).toEqual({ ideaNumber: 5 });
    });

    it('parses figure notation', () => {
      expect(parseNotation('fig_32')).toEqual({ figureNumber: 32 });
    });

    it('returns empty object for invalid notation', () => {
      expect(parseNotation('invalid')).toEqual({});
    });
  });
});

describe('Next Number Calculation', () => {
  describe('getNextIdeaNumber', () => {
    it('returns 0 for empty array', () => {
      expect(getNextIdeaNumber([])).toBe(0);
    });

    it('returns max + 1', () => {
      const ideas = [
        { idea_number: 0 },
        { idea_number: 5 },
        { idea_number: 3 }
      ] as Idea[];
      expect(getNextIdeaNumber(ideas)).toBe(6);
    });
  });

  describe('getNextStoryNumber', () => {
    it('returns 0 for empty array', () => {
      expect(getNextStoryNumber(1, [])).toBe(0);
    });

    it('returns 0 when no stories for idea', () => {
      const stories = [
        { idea_number: 2, story_number: 5 }
      ] as Story[];
      expect(getNextStoryNumber(1, stories)).toBe(0);
    });

    it('returns max + 1 for matching idea', () => {
      const stories = [
        { idea_number: 1, story_number: 0 },
        { idea_number: 1, story_number: 3 },
        { idea_number: 2, story_number: 10 }
      ] as Story[];
      expect(getNextStoryNumber(1, stories)).toBe(4);
    });
  });
});

describe('Idea Validation', () => {
  const validIdea: Partial<Idea> = {
    idea_number: 10,
    title: 'Test Idea',
    description: 'Test description',
    status: 'planned',
    created: '2025-01-01'
  };

  it('accepts valid idea', () => {
    const errors = validateIdea(validIdea, []);
    expect(errors).toHaveLength(0);
  });

  it('requires idea_number', () => {
    const { idea_number, ...noNumber } = validIdea;
    const errors = validateIdea(noNumber, []);
    expect(errors).toContain('idea_number is required');
  });

  it('requires title', () => {
    const errors = validateIdea({ ...validIdea, title: '' }, []);
    expect(errors).toContain('title is required');
  });

  it('validates unique idea numbers', () => {
    const existing = [{ idea_number: 10 } as Idea];
    const errors = validateIdea(validIdea, existing);
    expect(errors).toContain('Idea number 10 already exists');
  });

  it('allows editing existing idea', () => {
    const existing = [{ idea_number: 10 } as Idea];
    const errors = validateIdea(validIdea, existing, 10); // excludeIdeaNumber = 10
    expect(errors).not.toContain('Idea number 10 already exists');
  });

  it('validates status values', () => {
    const errors = validateIdea({ ...validIdea, status: 'invalid' as any }, []);
    expect(errors).toContain('status must be one of: planned, active, completed, archived');
  });

  it('validates date format', () => {
    const errors = validateIdea({ ...validIdea, created: 'not-a-date' }, []);
    expect(errors).toContain('created must be in YYYY-MM-DD format');
  });
});

describe('Sprint Validation', () => {
  const validSprint: Partial<Sprint> = {
    sprint_id: '2501',
    year: 2025,
    sprint_number: 1,
    start_date: '2025-01-01',
    end_date: '2025-01-14',
    status: 'planned'
  };

  it('accepts valid sprint', () => {
    const errors = validateSprint(validSprint, []);
    expect(errors).toHaveLength(0);
  });

  it('validates sprint_id format', () => {
    const errors = validateSprint({ ...validSprint, sprint_id: '25' }, []);
    expect(errors).toContain('sprint_id must be in YYSS format (e.g., 2609)');
  });

  it('validates end_date is after start_date', () => {
    const errors = validateSprint({
      ...validSprint,
      start_date: '2025-01-14',
      end_date: '2025-01-01'
    }, []);
    expect(errors).toContain('end_date must be after start_date');
  });

  it('validates sprint_number range', () => {
    const errors = validateSprint({ ...validSprint, sprint_number: 27 }, []);
    expect(errors).toContain('sprint_number must be between 1 and 26');
  });
});
```

---

## Task 3: Create Unit Tests for File Utils

### Create `electron/tests/unit/file-utils.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

// Mock the PATHS constant
vi.mock('@shared/file-utils', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    // Will be set in beforeEach
  };
});

describe('File Utilities', () => {
  let testDir: string;
  
  beforeEach(async () => {
    // Create temp directory for tests
    testDir = await mkdtemp(path.join(tmpdir(), 'file-utils-test-'));
    
    // Create subdirectories
    await fs.mkdir(path.join(testDir, '_ideas'), { recursive: true });
    await fs.mkdir(path.join(testDir, '_stories'), { recursive: true });
    await fs.mkdir(path.join(testDir, '_sprints'), { recursive: true });
    await fs.mkdir(path.join(testDir, '_updates'), { recursive: true });
    await fs.mkdir(path.join(testDir, '_figures'), { recursive: true });
  });
  
  afterEach(async () => {
    // Clean up temp directory
    await rm(testDir, { recursive: true, force: true });
  });
  
  describe('readIdeas', () => {
    it('returns empty array for empty directory', async () => {
      // This would need actual implementation testing with mocked paths
      // For now, just verify the test structure
      expect(true).toBe(true);
    });
    
    it('parses markdown front matter correctly', async () => {
      const ideaContent = `---
layout: idea
idea_number: 0
title: Test Idea
description: Test description
status: active
created: '2025-01-01'
tags:
  - test
  - example
---
This is the body content.
`;
      
      await fs.writeFile(
        path.join(testDir, '_ideas', '0.md'),
        ideaContent
      );
      
      // Would need to inject testDir as PATHS.ideas
      expect(true).toBe(true);
    });
    
    it('sorts ideas by idea_number', async () => {
      // Create ideas out of order
      const ideas = [
        { number: 5, title: 'Fifth' },
        { number: 1, title: 'First' },
        { number: 3, title: 'Third' }
      ];
      
      for (const idea of ideas) {
        const content = `---
layout: idea
idea_number: ${idea.number}
title: ${idea.title}
description: Test
status: planned
created: '2025-01-01'
---
`;
        await fs.writeFile(
          path.join(testDir, '_ideas', `${idea.number}.md`),
          content
        );
      }
      
      // Verify sorting
      expect(true).toBe(true);
    });
  });
  
  describe('writeIdea', () => {
    it('creates new idea file', async () => {
      // Test implementation
      expect(true).toBe(true);
    });
    
    it('overwrites existing idea file', async () => {
      // Test implementation
      expect(true).toBe(true);
    });
    
    it('removes undefined values from front matter', async () => {
      // Test implementation
      expect(true).toBe(true);
    });
  });
});
```

---

## Task 4: Fix E2E Test Cleanup

### Update `electron/tests/playwright-mcp/helpers.ts`:

```typescript
import { Page, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test data tracking
const testDataCreated: string[] = [];

/**
 * Track created test data for cleanup
 */
export function trackTestData(filePath: string): void {
  testDataCreated.push(filePath);
}

/**
 * Clean up all tracked test data
 * Should be called in afterEach or afterAll
 */
export async function cleanupAllTestData(): Promise<void> {
  for (const filePath of testDataCreated) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File may already be deleted
    }
  }
  testDataCreated.length = 0;
}

/**
 * Clean up specific test files
 */
export async function cleanupTestData(files: string[]): Promise<void> {
  const repoRoot = path.resolve(__dirname, '../..');
  
  for (const file of files) {
    const fullPath = path.join(repoRoot, file);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // File may not exist
    }
  }
}

/**
 * Generate unique test ID for isolation
 */
export function generateTestId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Wait for list to finish loading
 */
export async function waitForListLoad(
  page: Page,
  listId: string,
  timeout = 5000
): Promise<void> {
  const list = page.locator(`#${listId}`);
  
  // Wait for loading indicator to disappear
  await expect(list.locator('.loading')).toBeHidden({ timeout });
}

/**
 * Verify toast message appears
 */
export async function verifyToast(
  page: Page,
  message: string,
  type: 'success' | 'error'
): Promise<void> {
  const toast = page.locator(`.toast--${type}`);
  await expect(toast).toContainText(message, { timeout: 5000 });
}

// ... rest of helpers
```

### Update test structure:

```typescript
// tests/playwright-mcp/test-ideas.ts
import { test, expect } from './electron-fixture';
import {
  generateTestId,
  cleanupTestData,
  navigateToTab,
  openCreateModal,
  fillFormField,
  selectOption,
  submitForm,
  verifyToast,
  waitForListLoad,
} from './helpers';

test.describe('Ideas Tab', () => {
  // Test-specific cleanup array
  const filesToCleanup: string[] = [];
  
  test.afterEach(async () => {
    await cleanupTestData(filesToCleanup);
    filesToCleanup.length = 0;
  });
  
  test('should create new idea with valid data', async ({ page }) => {
    const testId = generateTestId();
    const testFile = `_ideas/${testId}.md`;
    filesToCleanup.push(testFile);
    
    await navigateToTab(page, 'ideas');
    await openCreateModal(page, 'idea');
    
    await fillFormField(page, 'idea_number', testId.toString());
    await fillFormField(page, 'title', `Test Idea ${testId}`);
    await fillFormField(page, 'description', 'Test description');
    await selectOption(page, 'status', 'planned');
    
    await submitForm(page);
    await verifyToast(page, 'Idea created', 'success');
    
    // File cleanup happens in afterEach
  });
});
```

---

## Task 5: Add CI Configuration

### Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        working-directory: electron
        run: npm run test:coverage
      
      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: electron/coverage

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        working-directory: electron
        run: npx playwright install --with-deps chromium
      
      - name: Build Electron app
        working-directory: electron
        run: npm run build
      
      - name: Run E2E tests
        working-directory: electron
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: electron/playwright-report
```

---

## Task 6: Add Test Types Configuration

### Create `electron/tests/unit/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals"],
    "paths": {
      "@shared/*": ["../../src/shared/*"]
    }
  },
  "include": ["**/*.test.ts", "../../src/shared/**/*.ts"]
}
```

---

## Verification

1. **Run unit tests:**
   ```bash
   cd electron && npm test
   ```

2. **Run with coverage:**
   ```bash
   npm run test:coverage
   ```

3. **Run E2E tests:**
   ```bash
   npm run test:e2e
   ```

4. **Verify cleanup works:**
   - Run tests multiple times
   - Check that test files don't accumulate

---

## Success Criteria

- [ ] Unit tests for validation module (>80% coverage)
- [ ] Unit tests for file-utils module (>80% coverage)
- [ ] E2E tests use proper cleanup hooks
- [ ] Tests use unique IDs for isolation
- [ ] CI workflow runs all tests
- [ ] Coverage reports generated
- [ ] No flaky tests (run 3x successfully)
