# Electron CMS Playwright Tests

Comprehensive test suite for the Electron CMS application using Playwright.

## Overview

This test suite provides end-to-end testing for all features of the Electron CMS app, including:

- CRUD operations for Ideas, Stories, Sprints, and Updates
- Validation logic and error handling
- UI interactions (tabs, modals, forms, toasts)
- File system operations
- IPC communication

## Prerequisites

- Node.js 18+
- Electron app dependencies installed
- Electron dev server can run on http://localhost:5173

## Running Tests

### Run All Tests

```bash
# From project root
npm run test:electron

# Or from electron directory
cd electron
npx playwright test tests/playwright-mcp
```

### Run Specific Test Suite

```bash
# Test Ideas only
npx playwright test tests/playwright-mcp/test-ideas.ts

# Test Stories only
npx playwright test tests/playwright-mcp/test-stories.ts

# Test Sprints only
npx playwright test tests/playwright-mcp/test-sprints.ts

# Test Updates only
npx playwright test tests/playwright-mcp/test-updates.ts

# Test Validation only
npx playwright test tests/playwright-mcp/test-validation.ts

# Test UI interactions only
npx playwright test tests/playwright-mcp/test-ui.ts

# Test Error handling only
npx playwright test tests/playwright-mcp/test-error-handling.ts
```

### Run in UI Mode

```bash
npx playwright test --ui
```

### Run with Debugging

```bash
npx playwright test --debug
```

## Test Structure

- `helpers.ts` - Shared utility functions for test setup and assertions
- `test-ideas.ts` - Tests for Ideas tab (CRUD operations)
- `test-stories.ts` - Tests for Stories tab (CRUD operations)
- `test-sprints.ts` - Tests for Sprints tab (CRUD operations)
- `test-updates.ts` - Tests for Updates tab (CRUD operations)
- `test-validation.ts` - Validation tests for all entity types
- `test-ui.ts` - UI interaction tests (tabs, modals, forms, toasts)
- `test-error-handling.ts` - Error handling and edge case tests
- `ERRORS.md` - Documented errors found during testing
- `RESULTS.md` - Test execution results and statistics

## Test Data

Tests create temporary test data files in the content directories:
- `_ideas/` - Test idea files
- `_stories/{idea}/` - Test story files
- `_sprints/` - Test sprint files
- `_updates/` - Test update files

Test files are cleaned up after tests complete. If tests fail, you may need to manually clean up test files.

## Writing New Tests

When adding new tests, follow these patterns:

1. Import helpers from `helpers.ts`
2. Use `waitForElectronApp()` to ensure the app is ready
3. Use helper functions for common operations (navigate, fill forms, etc.)
4. Clean up test data after each test
5. Use descriptive test names that explain what is being tested

Example:

```typescript
import { test, expect } from '@playwright/test';
import { waitForElectronApp, navigateToTab, openCreateModal, fillFormField, submitForm, verifyToast } from './helpers';

test('should create a new idea', async ({ page }) => {
  await waitForElectronApp(page);
  await openCreateModal(page, 'idea');
  await fillFormField(page, 'title', 'Test Idea');
  await fillFormField(page, 'description', 'Test description');
  await submitForm(page);
  await verifyToast(page, 'Idea created', 'success');
});
```

## Troubleshooting

### Tests fail with "Electron app not ready"

- Ensure the Electron dev server is running on http://localhost:5173
- Check that port 5173 is not in use by another process
- Increase timeout in `waitForElectronApp()` if needed

### Tests fail with file system errors

- Ensure you have write permissions in the repository root
- Check that content directories (`_ideas`, `_stories`, etc.) exist
- Manually clean up any leftover test files

### Modal doesn't open

- Check that the tab is active before clicking the button
- Verify the button selector is correct
- Add a wait for the modal to appear

### Form submission fails

- Check browser console for errors
- Verify all required fields are filled
- Check validation error messages

## CI/CD Integration

Tests can be run in CI/CD pipelines. Set the `CI` environment variable:

```bash
CI=true npx playwright test
```

This will:
- Run tests in a single worker (sequential)
- Retry failed tests twice
- Generate HTML reports





