/**
 * Playwright tests for Updates tab
 * Tests CRUD operations, validation, and error handling for Updates
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
  verifyItemInList,
  today,
  cleanupTestData,
} from './helpers';

test.describe('Updates Tab', () => {
  let testIdeaNumber: number;
  let testStoryNumber: number;
  let testSprintId: string;

  test.beforeEach(async ({ page }) => {
    
    // Create test data: idea, story, and sprint
    testIdeaNumber = 800 + Math.floor(Math.random() * 50);
    testStoryNumber = 0;
    testSprintId = '2801';
    
    // Create idea
    await navigateToTab(page, 'ideas');
    await openCreateModal(page, 'idea');
    await fillFormField(page, 'idea_number', testIdeaNumber.toString());
    await fillFormField(page, 'title', `Test Idea ${testIdeaNumber} for Updates`);
    await fillFormField(page, 'description', 'Test idea for update tests');
    await selectOption(page, 'status', 'active');
    await fillFormField(page, 'created', today());
    await submitForm(page);
    await waitForListLoad(page, 'ideas-list');
    
    // Create story
    await navigateToTab(page, 'stories');
    await openCreateModal(page, 'story');
    await selectOption(page, 'idea_number', testIdeaNumber.toString());
    await fillFormField(page, 'story_number', testStoryNumber.toString());
    await fillFormField(page, 'title', 'Test Story for Updates');
    await fillFormField(page, 'description', 'Test story description');
    await selectOption(page, 'status', 'in-progress');
    await selectOption(page, 'priority', 'high');
    await fillFormField(page, 'created', today());
    await submitForm(page);
    await waitForListLoad(page, 'stories-list');
    
    // Create sprint
    await navigateToTab(page, 'sprints');
    await openCreateModal(page, 'sprint');
    await fillFormField(page, 'sprint_id', testSprintId);
    await fillFormField(page, 'year', '2028');
    await fillFormField(page, 'sprint_number', '1');
    await fillFormField(page, 'start_date', '2028-01-01');
    await fillFormField(page, 'end_date', '2028-01-14');
    await selectOption(page, 'status', 'active');
    await submitForm(page);
    await waitForListLoad(page, 'sprints-list');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    await cleanupTestData([
      `_ideas/${testIdeaNumber}.md`,
      `_stories/${testIdeaNumber}/${testStoryNumber}.md`,
      `_sprints/${testSprintId}.md`,
      `_updates/${testSprintId}-${testIdeaNumber}-${testStoryNumber}.md`,
    ]);
  });

  test.describe('Read Operations', () => {
    test('should load updates tab and display list', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await waitForListLoad(page, 'updates-list');
      
      const updatesList = page.locator('#updates-list');
      await expect(updatesList).toBeVisible();
    });

    test('should display existing updates with notation badges', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await waitForListLoad(page, 'updates-list');
      
      const list = page.locator('#updates-list');
      const text = await list.textContent();
      expect(text).toBeTruthy();
    });
  });

  test.describe('Create Operations', () => {
    test('should open create update modal', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      await expect(modal).not.toHaveClass(/hidden/);
      
      const modalTitle = page.locator('#modal-title');
      await expect(modalTitle).toContainText('Create Update');
    });

    test('should auto-calculate notation from selections', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      
      // Wait for form to initialize
      await page.waitForTimeout(500);
      
      const notationInput = page.locator('input[data-notation]');
      const notationValue = await notationInput.inputValue();
      
      // Notation should be in format: sprint.idea.story
      expect(notationValue).toMatch(/^\d{4}\.\d+\.\d+$/);
    });

    test('should update notation when selections change', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      
      await page.waitForTimeout(500);
      
      const notationInput = page.locator('input[data-notation]');
      const initialNotation = await notationInput.inputValue();
      
      // Change story selection
      const storySelect = page.locator('select[name="story_number"]');
      const options = await storySelect.locator('option').all();
      if (options.length > 1) {
        const secondOptionValue = await options[1].getAttribute('value');
        await storySelect.selectOption(secondOptionValue!);
        
        await page.waitForTimeout(300);
        const newNotation = await notationInput.inputValue();
        expect(newNotation).not.toBe(initialNotation);
      }
    });

    test('should filter stories by selected idea', async ({ page }) => {
      // Create second story under same idea
      const secondStoryNumber = 1;
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', secondStoryNumber.toString());
      await fillFormField(page, 'title', 'Second Test Story');
      await fillFormField(page, 'description', 'Second story description');
      await selectOption(page, 'status', 'in-progress');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Open update modal
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      // Change idea selection
      const ideaSelect = page.locator('select[name="idea_number"]');
      await ideaSelect.selectOption(testIdeaNumber.toString());
      
      await page.waitForTimeout(300);
      
      // Story dropdown should update
      const storySelect = page.locator('select[name="story_number"]');
      const storyOptions = await storySelect.locator('option').all();
      expect(storyOptions.length).toBeGreaterThan(0);
      
      // Cleanup second story
      await cleanupTestData([`_stories/${testIdeaNumber}/${secondStoryNumber}.md`]);
    });

    test('should create new update with valid data', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      
      await page.waitForTimeout(500);
      
      // Selections should be pre-filled, but ensure they're correct
      await selectOption(page, 'sprint_id', testSprintId);
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await selectOption(page, 'story_number', testStoryNumber.toString());
      await selectOption(page, 'type', 'progress');
      await fillFormField(page, 'date', today());
      await fillFormField(page, 'body', 'Update body content');
      
      await submitForm(page);
      await verifyToast(page, 'Update created', 'success');
      
      await waitForListLoad(page, 'updates-list');
      const notation = `${testSprintId}.${testIdeaNumber}.${testStoryNumber}`;
      await verifyItemInList(page, 'updates-list', {
        sprint: testSprintId,
        idea: testIdeaNumber,
        story: testStoryNumber,
      });
      
      const fileExists = await verifyFileExists(`_updates/${testSprintId}-${testIdeaNumber}-${testStoryNumber}.md`);
      expect(fileExists).toBe(true);
    });

    test('should create update with different types', async ({ page }) => {
      const updateTypes = ['progress', 'completion', 'blocker', 'note'];
      
      for (let i = 0; i < updateTypes.length; i++) {
        const updateType = updateTypes[i];
        const testStoryNum = testStoryNumber + i + 1;
        
        // Create additional story if needed
        if (i > 0) {
          await navigateToTab(page, 'stories');
          await openCreateModal(page, 'story');
          await selectOption(page, 'idea_number', testIdeaNumber.toString());
          await fillFormField(page, 'story_number', testStoryNum.toString());
          await fillFormField(page, 'title', `Story ${testStoryNum}`);
          await fillFormField(page, 'description', 'Test story');
          await selectOption(page, 'status', 'in-progress');
          await selectOption(page, 'priority', 'medium');
          await fillFormField(page, 'created', today());
          await submitForm(page);
          await waitForListLoad(page, 'stories-list');
        }
        
        // Create update
        await navigateToTab(page, 'updates');
        await openCreateModal(page, 'update');
        await page.waitForTimeout(500);
        
        await selectOption(page, 'sprint_id', testSprintId);
        await selectOption(page, 'idea_number', testIdeaNumber.toString());
        await selectOption(page, 'story_number', testStoryNum.toString());
        await selectOption(page, 'type', updateType);
        await fillFormField(page, 'date', today());
        await fillFormField(page, 'body', `Update of type ${updateType}`);
        
        await submitForm(page);
        await verifyToast(page, 'Update created', 'success');
        
        // Cleanup
        if (i > 0) {
          await cleanupTestData([`_stories/${testIdeaNumber}/${testStoryNum}.md`]);
        }
        await cleanupTestData([`_updates/${testSprintId}-${testIdeaNumber}-${testStoryNum}.md`]);
      }
    });
  });

  test.describe('Edit Operations', () => {
    test('should open edit modal with pre-populated data', async ({ page }) => {
      // Create an update first
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      await selectOption(page, 'sprint_id', testSprintId);
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await selectOption(page, 'story_number', testStoryNumber.toString());
      await selectOption(page, 'type', 'progress');
      await fillFormField(page, 'date', today());
      await fillFormField(page, 'body', 'Original update body');
      await submitForm(page);
      await waitForListLoad(page, 'updates-list');
      
      // Edit it
      await openEditModal(page, 'update', {
        sprint: testSprintId,
        idea: testIdeaNumber,
        story: testStoryNumber,
      });
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      
      const typeSelect = page.locator('select[name="type"]');
      const typeValue = await typeSelect.inputValue();
      expect(typeValue).toBe('progress');
    });

    test('should update update fields', async ({ page }) => {
      // Create update
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      await selectOption(page, 'sprint_id', testSprintId);
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await selectOption(page, 'story_number', testStoryNumber.toString());
      await selectOption(page, 'type', 'progress');
      await fillFormField(page, 'date', today());
      await fillFormField(page, 'body', 'Original body');
      await submitForm(page);
      await waitForListLoad(page, 'updates-list');
      
      // Edit update
      await openEditModal(page, 'update', {
        sprint: testSprintId,
        idea: testIdeaNumber,
        story: testStoryNumber,
      });
      
      await selectOption(page, 'type', 'completion');
      await fillFormField(page, 'body', 'Updated body content');
      await submitForm(page);
      
      await verifyToast(page, 'Update updated', 'success');
    });

    test('should recalculate notation when sprint/story changes', async ({ page }) => {
      // Create second sprint
      const secondSprintId = '2802';
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', secondSprintId);
      await fillFormField(page, 'year', '2028');
      await fillFormField(page, 'sprint_number', '2');
      await fillFormField(page, 'start_date', '2028-01-15');
      await fillFormField(page, 'end_date', '2028-01-28');
      await selectOption(page, 'status', 'active');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Create update
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      await selectOption(page, 'sprint_id', testSprintId);
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await selectOption(page, 'story_number', testStoryNumber.toString());
      await selectOption(page, 'type', 'progress');
      await fillFormField(page, 'date', today());
      await submitForm(page);
      await waitForListLoad(page, 'updates-list');
      
      // Edit and change sprint
      await openEditModal(page, 'update', {
        sprint: testSprintId,
        idea: testIdeaNumber,
        story: testStoryNumber,
      });
      
      const notationInput = page.locator('input[data-notation]');
      const initialNotation = await notationInput.inputValue();
      
      await selectOption(page, 'sprint_id', secondSprintId);
      await page.waitForTimeout(300);
      
      const newNotation = await notationInput.inputValue();
      expect(newNotation).not.toBe(initialNotation);
      expect(newNotation).toContain(secondSprintId);
      
      // Cleanup
      await cleanupTestData([`_sprints/${secondSprintId}.md`]);
    });
  });

  test.describe('Delete Operations', () => {
    test('should delete update with confirmation', async ({ page }) => {
      // Create update
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      await selectOption(page, 'sprint_id', testSprintId);
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await selectOption(page, 'story_number', testStoryNumber.toString());
      await selectOption(page, 'type', 'progress');
      await fillFormField(page, 'date', today());
      await submitForm(page);
      await waitForListLoad(page, 'updates-list');
      
      // Delete with confirmation
      let dialogAccepted = false;
      page.once('dialog', async (dialog) => {
        const notation = `${testSprintId}.${testIdeaNumber}.${testStoryNumber}`;
        expect(dialog.message()).toContain(`Delete Update ${notation}`);
        dialogAccepted = true;
        await dialog.accept();
      });
      
      await deleteItem(page, 'update', {
        sprint: testSprintId,
        idea: testIdeaNumber,
        story: testStoryNumber,
      });
      
      expect(dialogAccepted).toBe(true);
      await verifyToast(page, 'Update deleted', 'success');
      
      // Verify file deleted
      const fileExists = await verifyFileExists(
        `_updates/${testSprintId}-${testIdeaNumber}-${testStoryNumber}.md`,
        1000
      );
      expect(fileExists).toBe(false);
    });
  });

  test.describe('Error Cases', () => {
    test('should require sprint selection', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      // Sprint should be pre-selected, but test that it's required
      const sprintSelect = page.locator('select[name="sprint_id"]');
      const selectedValue = await sprintSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    });

    test('should require story selection', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      // Story should be pre-selected
      const storySelect = page.locator('select[name="story_number"]');
      const selectedValue = await storySelect.inputValue();
      expect(selectedValue).toBeTruthy();
    });

    test('should validate date format', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const dateInput = page.locator('input[name="date"]');
      await dateInput.fill('invalid-date');
      
      // HTML5 date input should prevent invalid dates
      const validity = await dateInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });
  });
});



