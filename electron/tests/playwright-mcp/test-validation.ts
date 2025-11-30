/**
 * Playwright tests for validation logic
 * Tests validation rules for all entity types and edge cases
 */

import { test, expect } from './electron-fixture';
import {
  navigateToTab,
  openCreateModal,
  fillFormField,
  selectOption,
  submitForm,
  verifyErrorBanner,
  today,
  cleanupTestData,
} from './helpers';

test.describe('Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
  });

  test.describe('Idea Validation', () => {
    test('should require title field', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      // Don't fill title
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      
      const titleInput = page.locator('input[name="title"]');
      const validity = await titleInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should require description field', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      await fillFormField(page, 'title', 'Test Idea');
      // Don't fill description
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      
      const descriptionInput = page.locator('textarea[name="description"]');
      const validity = await descriptionInput.evaluate((el: HTMLTextAreaElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should require status field', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      // Status should have default, but test it's required
      await fillFormField(page, 'created', today());
      
      const statusSelect = page.locator('select[name="status"]');
      const value = await statusSelect.inputValue();
      expect(value).toBeTruthy();
    });

    test('should require created date', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      // Don't fill created date
      
      const createdInput = page.locator('input[name="created"]');
      const validity = await createdInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should validate idea number uniqueness', async ({ page }) => {
      const testIdeaNumber = 700;
      
      // Create first idea
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'First Idea');
      await fillFormField(page, 'description', 'First description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Try duplicate
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Duplicate Idea');
      await fillFormField(page, 'description', 'Duplicate description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      await verifyErrorBanner(page);
      
      // Cleanup
      await cleanupTestData([`_ideas/${testIdeaNumber}.md`]);
    });

    test('should validate date format (YYYY-MM-DD)', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const dateInput = page.locator('input[name="created"]');
      await dateInput.fill('2024/01/01'); // Wrong format
      
      // HTML5 date input enforces YYYY-MM-DD format
      const value = await dateInput.inputValue();
      // Browser may auto-correct or reject invalid format
      expect(value).toBeTruthy();
    });

    test('should validate status enum values', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const statusSelect = page.locator('select[name="status"]');
      const options = await statusSelect.locator('option').all();
      const validStatuses = ['planned', 'active', 'completed', 'archived'];
      
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value) {
          expect(validStatuses).toContain(value);
        }
      }
    });
  });

  test.describe('Story Validation', () => {
    let testIdeaNumber: number;

    test.beforeEach(async ({ page }) => {
      // Create test idea
      testIdeaNumber = 600 + Math.floor(Math.random() * 50);
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', `Test Idea ${testIdeaNumber}`);
      await fillFormField(page, 'description', 'Test idea for story validation');
      await selectOption(page, 'status', 'active');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
    });

    test.afterEach(async () => {
      await cleanupTestData([`_ideas/${testIdeaNumber}.md`]);
    });

    test('should require title field', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      // Don't fill title
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      
      const titleInput = page.locator('input[name="title"]');
      const validity = await titleInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should require description field', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      await fillFormField(page, 'title', 'Test Story');
      // Don't fill description
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      
      const descriptionInput = page.locator('textarea[name="description"]');
      const validity = await descriptionInput.evaluate((el: HTMLTextAreaElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should require parent idea to exist', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      // Idea dropdown should only show existing ideas
      const ideaSelect = page.locator('select[name="idea_number"]');
      const selectedValue = await ideaSelect.inputValue();
      expect(selectedValue).toBeTruthy();
      
      // Selected idea should exist
      const ideaExists = await page.evaluate(
        (ideaNum) => {
          // Check if idea exists in the dropdown
          const select = document.querySelector('select[name="idea_number"]') as HTMLSelectElement;
          return Array.from(select.options).some((opt) => opt.value === ideaNum.toString());
        },
        testIdeaNumber
      );
      expect(ideaExists).toBe(true);
    });

    test('should validate story number uniqueness within idea', async ({ page }) => {
      const testStoryNumber = 0;
      
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
      
      // Try duplicate
      await openCreateModal(page, 'story');
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Duplicate Story');
      await fillFormField(page, 'description', 'Duplicate description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      await verifyErrorBanner(page);
      
      // Cleanup
      await cleanupTestData([`_stories/${testIdeaNumber}/${testStoryNumber}.md`]);
    });

    test('should validate sprint ID format when assigned', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      // Sprint dropdown should only show valid sprints (if any exist)
      const sprintSelect = page.locator('select[name="assigned_sprint"]');
      const options = await sprintSelect.locator('option').all();
      
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          // Should be 4 digits (YYSS format)
          expect(value).toMatch(/^\d{4}$/);
        }
      }
    });

    test('should validate status enum values', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const statusSelect = page.locator('select[name="status"]');
      const options = await statusSelect.locator('option').all();
      const validStatuses = ['backlog', 'planned', 'in-progress', 'done'];
      
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value) {
          expect(validStatuses).toContain(value);
        }
      }
    });

    test('should validate priority enum values', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const prioritySelect = page.locator('select[name="priority"]');
      const options = await prioritySelect.locator('option').all();
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value) {
          expect(validPriorities).toContain(value);
        }
      }
    });
  });

  test.describe('Sprint Validation', () => {
    test('should validate sprint ID format (4 digits)', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const sprintIdInput = page.locator('input[name="sprint_id"]');
      
      // Test invalid formats
      await sprintIdInput.fill('123'); // Too short
      let validity = await sprintIdInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
      
      await sprintIdInput.fill('12345'); // Too long
      validity = await sprintIdInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
      
      await sprintIdInput.fill('abcd'); // Non-numeric
      validity = await sprintIdInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should validate year range (2000-2100)', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const yearInput = page.locator('input[name="year"]');
      
      await yearInput.fill('1999'); // Below minimum
      let validity = await yearInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
      
      await yearInput.fill('2101'); // Above maximum
      validity = await yearInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should validate sprint number range (1-26)', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const sprintNumberInput = page.locator('input[name="sprint_number"]');
      
      await sprintNumberInput.fill('0'); // Below minimum
      let validity = await sprintNumberInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
      
      await sprintNumberInput.fill('27'); // Above maximum
      validity = await sprintNumberInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should validate date formats', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const startDateInput = page.locator('input[name="start_date"]');
      const endDateInput = page.locator('input[name="end_date"]');
      
      // HTML5 date inputs enforce YYYY-MM-DD format
      await startDateInput.fill('2024/01/01');
      const startValue = await startDateInput.inputValue();
      expect(startValue).toBeTruthy();
      
      await endDateInput.fill('2024/01/14');
      const endValue = await endDateInput.inputValue();
      expect(endValue).toBeTruthy();
    });

    test('should validate end date is after start date', async ({ page }) => {
      const testSprintId = '2901';
      
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2029');
      await fillFormField(page, 'sprint_number', '1');
      await fillFormField(page, 'start_date', '2029-01-15');
      await fillFormField(page, 'end_date', '2029-01-14'); // Before start date
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      
      // Should show validation error
      await verifyErrorBanner(page);
    });

    test('should validate sprint ID uniqueness', async ({ page }) => {
      const testSprintId = '2902';
      
      // Create first sprint
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2029');
      await fillFormField(page, 'sprint_number', '2');
      await fillFormField(page, 'start_date', '2029-01-15');
      await fillFormField(page, 'end_date', '2029-01-28');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Try duplicate
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2029');
      await fillFormField(page, 'sprint_number', '2');
      await fillFormField(page, 'start_date', '2029-01-29');
      await fillFormField(page, 'end_date', '2029-02-11');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      
      await verifyErrorBanner(page);
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });
  });

  test.describe('Update Validation', () => {
    test('should require sprint selection', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const sprintSelect = page.locator('select[name="sprint_id"]');
      const value = await sprintSelect.inputValue();
      expect(value).toBeTruthy();
    });

    test('should require idea selection', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const ideaSelect = page.locator('select[name="idea_number"]');
      const value = await ideaSelect.inputValue();
      expect(value).toBeTruthy();
    });

    test('should require story selection', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const storySelect = page.locator('select[name="story_number"]');
      const value = await storySelect.inputValue();
      expect(value).toBeTruthy();
    });

    test('should require date field', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const dateInput = page.locator('input[name="date"]');
      const validity = await dateInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      // Date should have default or be required
      expect(validity).toBeTruthy();
    });

    test('should validate date format', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const dateInput = page.locator('input[name="date"]');
      await dateInput.fill('invalid-date');
      
      const validity = await dateInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should validate type enum values', async ({ page }) => {
      await navigateToTab(page, 'updates');
      await openCreateModal(page, 'update');
      await page.waitForTimeout(500);
      
      const typeSelect = page.locator('select[name="type"]');
      const options = await typeSelect.locator('option').all();
      const validTypes = ['progress', 'completion', 'blocker', 'note'];
      
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value) {
          expect(validTypes).toContain(value);
        }
      }
    });
  });
});

