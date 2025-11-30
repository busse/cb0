# Testing Infrastructure Review

## Overview

The project includes Playwright tests for the Electron application, with comprehensive E2E test coverage for CRUD operations. This review examines the testing infrastructure, coverage, and opportunities for improvement.

## Current Test Structure

```
electron/tests/
└── playwright-mcp/
    ├── electron-fixture.ts    # Custom Playwright fixture
    ├── helpers.ts             # Test utilities
    ├── test-ideas.ts          # Ideas CRUD tests
    ├── test-stories.ts        # Stories CRUD tests
    ├── test-sprints.ts        # Sprints CRUD tests
    ├── test-updates.ts        # Updates CRUD tests
    ├── test-ui.ts             # UI interaction tests
    ├── test-validation.ts     # Validation tests
    ├── test-error-handling.ts # Error case tests
    ├── RESULTS.md             # Test results documentation
    ├── ERRORS.md              # Known errors documentation
    └── README.md              # Test documentation
```

## Test Quality Assessment

### Electron Fixture (`electron-fixture.ts`)

**Expected Pattern:**
```typescript
import { test as base, ElectronApplication, Page } from '@playwright/test';

export const test = base.extend<{ electronApp: ElectronApplication; page: Page }>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({ args: ['./out/main/main/index.js'] });
    await use(app);
    await app.close();
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await use(page);
  },
});
```

### Helper Functions (`helpers.ts`)

**Good Patterns:**
- Reusable navigation functions
- Form filling utilities
- Verification helpers
- Cleanup functions

**Expected Interface:**
```typescript
export async function navigateToTab(page: Page, tab: string): Promise<void>;
export async function openCreateModal(page: Page, type: string): Promise<void>;
export async function fillFormField(page: Page, name: string, value: string): Promise<void>;
export async function submitForm(page: Page): Promise<void>;
export async function verifyToast(page: Page, message: string, type: 'success' | 'error'): Promise<void>;
export async function cleanupTestData(files: string[]): Promise<void>;
```

### Test Cases (`test-ideas.ts`)

**Comprehensive Coverage:**
```typescript
test.describe('Ideas Tab', () => {
  test.describe('Read Operations', () => {
    test('should load ideas tab and display list', ...);
    test('should display existing ideas with correct data', ...);
    test('should show empty state message when no ideas exist', ...);
    test('should refresh ideas list when refresh button clicked', ...);
  });

  test.describe('Create Operations', () => {
    test('should open create idea modal when New Idea button clicked', ...);
    test('should auto-generate idea number', ...);
    test('should create new idea with valid data', ...);
    test('should create idea with tags', ...);
    test('should create idea with body content', ...);
  });

  test.describe('Edit Operations', () => {
    test('should open edit modal with pre-populated data', ...);
    test('should update idea fields', ...);
  });

  test.describe('Delete Operations', () => {
    test('should show confirmation dialog when delete clicked', ...);
    test('should cancel deletion when dialog cancelled', ...);
  });

  test.describe('Error Cases', () => {
    test('should prevent creating idea with duplicate number', ...);
    test('should validate required fields', ...);
    test('should validate date format', ...);
  });
});
```

## Test Coverage Analysis

### Covered Areas ✅

| Component | Test Type | Coverage |
|-----------|-----------|----------|
| Ideas CRUD | E2E | High |
| Stories CRUD | E2E | High |
| Sprints CRUD | E2E | High |
| Updates CRUD | E2E | High |
| Form Validation | E2E | Medium |
| Error Handling | E2E | Medium |
| UI Interactions | E2E | Medium |

### Missing Test Coverage ⚠️

| Area | Test Type Needed | Priority |
|------|------------------|----------|
| `shared/file-utils.ts` | Unit | High |
| `shared/validation.ts` | Unit | High |
| `shared/types.ts` | Type tests | Medium |
| Main process handlers | Integration | Medium |
| Jekyll templates | Integration | Low |
| CSS regression | Visual | Low |

## Issues Found

### Issue #1: Test Cleanup in Test Body

**Current:**
```typescript
test('should create new idea with valid data', async ({ page }) => {
  const testIdeaNumber = 999;
  
  // ... test logic
  
  // Cleanup at end of test
  await cleanupTestData([`_ideas/${testIdeaNumber}.md`]);
});
```

**Problem:** Cleanup may not run if test fails.

**Recommended:**
```typescript
test.describe('Ideas CRUD', () => {
  const testIdeaNumber = 999;
  
  test.afterEach(async () => {
    await cleanupTestData([`_ideas/${testIdeaNumber}.md`]);
  });
  
  test('should create new idea with valid data', async ({ page }) => {
    // ... test logic (no cleanup needed here)
  });
});
```

### Issue #2: Flaky Test Patterns

**Current:**
```typescript
await page.waitForTimeout(1000);
await verifyToast(page, 'Idea deleted', 'success');
```

**Problem:** Fixed timeouts can cause flaky tests.

**Recommended:**
```typescript
// Wait for specific conditions
await expect(page.locator('.toast--success')).toContainText('Idea deleted');
// or
await page.waitForSelector('.toast--success:has-text("Idea deleted")');
```

### Issue #3: Duplicate Dialog Handler Setup

**Current:**
```typescript
const dialogPromise = new Promise<void>((resolve) => {
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain(`Delete Idea i${testIdeaNumber}`);
    dialogAccepted = true;
    await dialog.accept();
    resolve();
  });
});

const deleteButton = page.locator(`button[data-action="delete-idea"]`);
await deleteButton.click();
await dialogPromise;
```

**Simplified:**
```typescript
page.on('dialog', dialog => dialog.accept());
await page.click(`button[data-action="delete-idea"][data-idea="${testIdeaNumber}"]`);
await expect(page.locator('.toast--success')).toBeVisible();
```

### Issue #4: Test Data Isolation

Tests share the same file system, which can cause conflicts:
- Tests use specific idea numbers (999, 998, etc.)
- Parallel test execution could conflict
- Previous test failures can pollute state

**Recommended:**
```typescript
test.beforeAll(async () => {
  // Backup _ideas directory
  await backupContentDir('_ideas');
});

test.afterAll(async () => {
  // Restore from backup
  await restoreContentDir('_ideas');
});

test.beforeEach(async () => {
  // Use unique identifiers
  const testId = Date.now();
  // ...
});
```

## Missing Test Types

### Unit Tests for Shared Modules

**`shared/validation.ts` tests needed:**
```typescript
// tests/unit/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isValidSprintId, validateIdea, getNextIdeaNumber } from '../src/shared/validation';

describe('isValidSprintId', () => {
  it('accepts valid 4-digit sprint IDs', () => {
    expect(isValidSprintId('2501')).toBe(true);
    expect(isValidSprintId('2526')).toBe(true);
  });
  
  it('rejects invalid formats', () => {
    expect(isValidSprintId('250')).toBe(false);
    expect(isValidSprintId('25001')).toBe(false);
    expect(isValidSprintId('abcd')).toBe(false);
  });
});

describe('validateIdea', () => {
  it('requires idea_number', () => {
    const errors = validateIdea({}, []);
    expect(errors).toContain('idea_number is required');
  });
  
  it('validates unique idea numbers', () => {
    const existing = [{ idea_number: 1, title: 'Test' } as Idea];
    const errors = validateIdea({ idea_number: 1 }, existing);
    expect(errors).toContain('Idea number 1 already exists');
  });
});
```

**`shared/file-utils.ts` tests needed:**
```typescript
// tests/unit/file-utils.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readIdeas, writeIdea } from '../src/shared/file-utils';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('readIdeas', () => {
  const testDir = path.join(__dirname, 'fixtures/_ideas');
  
  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(testDir, { recursive: true });
  });
  
  it('reads and parses idea markdown files', async () => {
    await fs.writeFile(
      path.join(testDir, '0.md'),
      '---\nlayout: idea\nidea_number: 0\ntitle: Test\n---\n'
    );
    
    const ideas = await readIdeas();
    expect(ideas).toHaveLength(1);
    expect(ideas[0].title).toBe('Test');
  });
});
```

### Integration Tests for Jekyll

**Jekyll template tests:**
```ruby
# Using jekyll-test-plugin or custom rake task
describe 'Ideas collection' do
  it 'renders idea pages' do
    site = Jekyll::Site.new(config)
    site.process
    
    idea_page = site.pages.find { |p| p.url == '/i/0/' }
    expect(idea_page).not_to be_nil
    expect(idea_page.content).to include('busse.io')
  end
end
```

### Visual Regression Tests

**Playwright screenshot comparison:**
```typescript
test('ideas page matches snapshot', async ({ page }) => {
  await page.goto('/ideas/');
  await expect(page).toHaveScreenshot('ideas-page.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

## Configuration Review

### `playwright.config.ts`

**Expected Configuration:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright-mcp',
  fullyParallel: false,  // Electron tests need sequential
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,  // Single worker for Electron
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## Recommendations

### High Priority

1. **Add Unit Tests for Shared Modules**
   - Use Vitest for fast, TypeScript-native testing
   - Cover validation logic thoroughly
   - Test file utilities with mock filesystem

2. **Fix Test Cleanup Patterns**
   - Move cleanup to `afterEach` hooks
   - Use test fixtures for data management
   - Implement backup/restore for integration tests

3. **Reduce Test Flakiness**
   - Replace `waitForTimeout` with conditional waits
   - Use Playwright's built-in assertions
   - Add proper error handling in tests

### Medium Priority

1. **Add CI Integration**
   - GitHub Actions workflow for tests
   - Run on pull requests
   - Publish test reports

2. **Add Visual Regression Testing**
   - Screenshot comparison for key pages
   - Threshold for acceptable differences
   - Visual review workflow

3. **Improve Test Documentation**
   - Document test patterns
   - Create test writing guide
   - Add JSDoc to helper functions

### Low Priority

1. **Add Performance Testing**
   - Measure page load times
   - Track bundle sizes
   - Monitor build performance

2. **Add Accessibility Testing**
   - axe-core integration
   - Keyboard navigation tests
   - Screen reader testing

## Proposed Test Suite Setup

### Package Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-c8": "^0.33.0"
  },
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

### Directory Structure

```
tests/
├── unit/
│   ├── validation.test.ts
│   ├── file-utils.test.ts
│   └── setup.ts
├── integration/
│   └── ipc-handlers.test.ts
├── e2e/
│   └── (existing playwright tests)
├── fixtures/
│   ├── _ideas/
│   └── _stories/
└── utils/
    └── test-helpers.ts
```

## Conclusion

The existing Playwright test suite provides good E2E coverage for the Electron app. The main opportunities are:

1. **Add unit tests** for shared modules (validation, file utilities)
2. **Improve test reliability** with proper cleanup and wait conditions
3. **Add CI integration** for automated testing
4. **Consider visual regression** for UI consistency

The testing infrastructure is well-started and needs expansion to cover the full application.
