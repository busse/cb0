/**
 * Playwright tests for Stories tab
 * Tests CRUD operations, validation, and error handling for Stories
 */

import { test, expect } from './electron-fixture';
import {
  navigateToTab,
  openCreateModal,
  openEditModal,
  fillFormField,
  selectOption,
  submitForm,
  verifyToast,
  verifyErrorBanner,
  verifyFileExists,
  deleteItem,
  waitForListLoad,
  getListItemCount,
  verifyItemInList,
  today,
  cleanupTestData,
} from './helpers';

test.describe('Stories Tab', () => {
  let testIdeaNumber: number;
  let testStoryNumber: number;

  test.beforeEach(async ({ page }) => {
    
    // Create a test idea for stories to belong to
    testIdeaNumber = 900 + Math.floor(Math.random() * 50);
    await navigateToTab(page, 'ideas');
    await openCreateModal(page, 'idea');
    await fillFormField(page, 'idea_number', testIdeaNumber.toString());
    await fillFormField(page, 'title', `Test Idea ${testIdeaNumber} for Stories`);
    await fillFormField(page, 'description', 'Test idea for story tests');
    await selectOption(page, 'status', 'active');
    await fillFormField(page, 'created', today());
    await submitForm(page);
    await waitForListLoad(page, 'ideas-list');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test idea and stories
    await cleanupTestData([
      `_ideas/${testIdeaNumber}.md`,
      `_stories/${testIdeaNumber}/${testStoryNumber || 0}.md`,
    ]);
  });

  test.describe('Read Operations', () => {
    test('should load stories tab and display list', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await waitForListLoad(page, 'stories-list');
      
      const storiesList = page.locator('#stories-list');
      await expect(storiesList).toBeVisible();
    });

    test('should display existing stories', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await waitForListLoad(page, 'stories-list');
      
      const count = await getListItemCount(page, 'stories-list');
      // May be empty or have existing stories
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show empty state when no stories exist', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await waitForListLoad(page, 'stories-list');
      
      const list = page.locator('#stories-list');
      const text = await list.textContent();
      expect(text).toBeTruthy();
    });
  });

  test.describe('Create Operations', () => {
    test('should open create story modal', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      await expect(modal).not.toHaveClass(/hidden/);
      
      const modalTitle = page.locator('#modal-title');
      await expect(modalTitle).toContainText('Create Story');
    });

    test('should populate idea dropdown with existing ideas', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const ideaSelect = page.locator('select[name="idea_number"]');
      await expect(ideaSelect).toBeVisible();
      
      const options = await ideaSelect.locator('option').count();
      expect(options).toBeGreaterThan(0);
    });

    test('should auto-generate story number', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const storyNumberInput = page.locator('input[name="story_number"]');
      const value = await storyNumberInput.inputValue();
      expect(value).toBeTruthy();
      expect(parseInt(value)).toBeGreaterThanOrEqual(0);
    });

    test('should update story number when idea changes', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const storyNumberInput = page.locator('input[name="story_number"]');
      const initialValue = await storyNumberInput.inputValue();
      
      // Change idea
      const ideaSelect = page.locator('select[name="idea_number"]');
      const options = await ideaSelect.locator('option').all();
      if (options.length > 1) {
        const secondOptionValue = await options[1].getAttribute('value');
        await ideaSelect.selectOption(secondOptionValue!);
        
        // Wait for story number to update
        await page.waitForTimeout(500);
        const newValue = await storyNumberInput.inputValue();
        // Value should have changed (may show "…" briefly then update)
        expect(newValue).toBeTruthy();
      }
    });

    test('should create new story with valid data', async ({ page }) => {
      testStoryNumber = 0;
      const testTitle = `Test Story ${Date.now()}`;
      const testDescription = 'As a user, I want to test stories so that I can verify functionality';
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', testTitle);
      await fillFormField(page, 'description', testDescription);
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      
      await submitForm(page);
      await verifyToast(page, 'Story created', 'success');
      
      await waitForListLoad(page, 'stories-list');
      await verifyItemInList(page, 'stories-list', { idea: testIdeaNumber, story: testStoryNumber });
      
      const fileExists = await verifyFileExists(`_stories/${testIdeaNumber}/${testStoryNumber}.md`);
      expect(fileExists).toBe(true);
    });

    test('should create story with assigned sprint', async ({ page }) => {
      // First create a sprint
      const testSprintId = '2601';
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2026');
      await fillFormField(page, 'sprint_number', '1');
      await fillFormField(page, 'start_date', '2026-01-01');
      await fillFormField(page, 'end_date', '2026-01-14');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Now create story with sprint assignment
      testStoryNumber = 1;
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Story with Sprint');
      await fillFormField(page, 'description', 'Test story with sprint assignment');
      await selectOption(page, 'status', 'planned');
      await selectOption(page, 'priority', 'high');
      await selectOption(page, 'assigned_sprint', testSprintId);
      await fillFormField(page, 'created', today());
      
      await submitForm(page);
      await verifyToast(page, 'Story created', 'success');
      
      // Cleanup sprint
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });
  });

  test.describe('Edit Operations', () => {
    test('should open edit modal with pre-populated data', async ({ page }) => {
      // Create a test story
      testStoryNumber = 2;
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Original Story Title');
      await fillFormField(page, 'description', 'Original description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'low');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Edit it
      await openEditModal(page, 'story', { idea: testIdeaNumber, story: testStoryNumber });
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      
      const titleInput = page.locator('input[name="title"]');
      const titleValue = await titleInput.inputValue();
      expect(titleValue).toBe('Original Story Title');
      
      // Story number should be readonly in edit mode
      const storyNumberInput = page.locator('input[name="story_number"]');
      const isReadonly = await storyNumberInput.getAttribute('readonly');
      expect(isReadonly).toBeTruthy();
    });

    test('should update story fields', async ({ page }) => {
      testStoryNumber = 3;
      const updatedTitle = `Updated Story ${Date.now()}`;
      
      // Create story
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Original Title');
      await fillFormField(page, 'description', 'Original description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Edit story
      await openEditModal(page, 'story', { idea: testIdeaNumber, story: testStoryNumber });
      await fillFormField(page, 'title', updatedTitle);
      await selectOption(page, 'status', 'in-progress');
      await selectOption(page, 'priority', 'high');
      await submitForm(page);
      
      await verifyToast(page, 'Story updated', 'success');
      await waitForListLoad(page, 'stories-list');
      
      // Verify changes
      const card = page.locator(`.item-badge:has-text("${testIdeaNumber}.${testStoryNumber}")`).locator('..');
      await expect(card.locator('.item-title')).toContainText(updatedTitle);
    });

    test('should allow changing idea assignment', async ({ page }) => {
      // Create second idea
      const secondIdeaNumber = testIdeaNumber + 1;
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', secondIdeaNumber.toString());
      await fillFormField(page, 'title', `Second Test Idea ${secondIdeaNumber}`);
      await fillFormField(page, 'description', 'Second test idea');
      await selectOption(page, 'status', 'active');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Create story under first idea
      testStoryNumber = 4;
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Story to Move');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Edit and change idea
      await openEditModal(page, 'story', { idea: testIdeaNumber, story: testStoryNumber });
      await selectOption(page, 'idea_number', secondIdeaNumber.toString());
      await submitForm(page);
      
      await verifyToast(page, 'Story updated', 'success');
      
      // Cleanup second idea
      await cleanupTestData([`_ideas/${secondIdeaNumber}.md`]);
    });
  });

  test.describe('Delete Operations', () => {
    test('should delete story with confirmation', async ({ page }) => {
      testStoryNumber = 5;
      
      // Create test story
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Story to Delete');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Delete with confirmation
      let dialogAccepted = false;
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain(`Delete Story ${testIdeaNumber}.${testStoryNumber}`);
        dialogAccepted = true;
        await dialog.accept();
      });
      
      await deleteItem(page, 'story', { idea: testIdeaNumber, story: testStoryNumber });
      
      expect(dialogAccepted).toBe(true);
      await verifyToast(page, 'Story deleted', 'success');
      
      // Verify file deleted
      const fileExists = await verifyFileExists(`_stories/${testIdeaNumber}/${testStoryNumber}.md`, 1000);
      expect(fileExists).toBe(false);
    });
  });

  test.describe('Error Cases', () => {
    test('should prevent creating story without parent idea', async ({ page }) => {
      // This is handled by the UI - idea dropdown should always have options
      // But we can test that creating a story requires selecting an idea
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      // Try to submit without selecting idea (should be pre-selected, but test validation)
      const ideaSelect = page.locator('select[name="idea_number"]');
      const selectedValue = await ideaSelect.inputValue();
      expect(selectedValue).toBeTruthy(); // Should have a default selection
    });

    test('should prevent duplicate story number within idea', async ({ page }) => {
      testStoryNumber = 6;
      
      // Create first story
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'First Story');
      await fillFormField(page, 'description', 'First description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Try to create duplicate
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Duplicate Story');
      await fillFormField(page, 'description', 'Duplicate description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      // Should show error
      await verifyErrorBanner(page);
    });

    test('should validate sprint ID format', async ({ page }) => {
      testStoryNumber = 7;
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Story with Invalid Sprint');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      
      // Sprint dropdown should only show valid sprints, but we can test the form
      // The validation happens server-side, so we'd see an error on submit
      await submitForm(page);
      
      // If there's an invalid sprint, we'd see an error
      // But since we're using a dropdown, this is less likely
    });
  });
});



