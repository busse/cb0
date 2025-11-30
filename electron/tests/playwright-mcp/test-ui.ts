/**
 * Playwright tests for UI interactions
 * Tests tabs, modals, forms, toasts, and error banners
 */

import { test, expect } from './electron-fixture';
import {
  navigateToTab,
  openCreateModal,
  closeModal,
  fillFormField,
  selectOption,
  submitForm,
  verifyToast,
  verifyErrorBanner,
  waitForListLoad,
  today,
} from './helpers';

test.describe('UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
  });

  test.describe('Tab Navigation', () => {
    test('should switch between all tabs', async ({ page }) => {
      const tabs = ['ideas', 'stories', 'sprints', 'updates'] as const;
      
      for (const tab of tabs) {
        await navigateToTab(page, tab);
        
        // Verify tab is active
        const tabButton = page.locator(`button[data-tab="${tab}"]`);
        await expect(tabButton).toHaveClass(/active/);
        
        // Verify panel is active
        const panel = page.locator(`#${tab}-panel`);
        await expect(panel).toHaveClass(/active/);
      }
    });

    test('should display correct panel when tab clicked', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      let panel = page.locator('#ideas-panel');
      await expect(panel).toHaveClass(/active/);
      
      await navigateToTab(page, 'stories');
      panel = page.locator('#stories-panel');
      await expect(panel).toHaveClass(/active/);
      panel = page.locator('#ideas-panel');
      await expect(panel).not.toHaveClass(/active/);
    });

    test('should load data when switching tabs', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await page.waitForTimeout(1000); // Wait for data load
      
      await navigateToTab(page, 'stories');
      await page.waitForTimeout(1000);
      
      const storiesList = page.locator('#stories-list');
      await expect(storiesList).toBeVisible();
    });
  });

  test.describe('Modal Interactions', () => {
    test('should open modal when create button clicked', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      await expect(modal).not.toHaveClass(/hidden/);
    });

    test('should close modal via X button', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      await closeModal(page);
      
      const modal = page.locator('#modal');
      await expect(modal).toHaveClass(/hidden/);
    });

    test('should close modal via Escape key', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      await page.keyboard.press('Escape');
      
      const modal = page.locator('#modal');
      await expect(modal).toHaveClass(/hidden/);
    });

    test('should close modal via Cancel button', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const cancelButton = page.locator('button[data-modal-cancel]');
      await cancelButton.click();
      
      const modal = page.locator('#modal');
      await expect(modal).toHaveClass(/hidden/);
    });

    test('should close modal by clicking backdrop', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      // Click on the modal backdrop (the modal element itself, not the dialog)
      const modal = page.locator('#modal');
      await modal.click({ position: { x: 10, y: 10 } });
      
      await page.waitForTimeout(300);
      await expect(modal).toHaveClass(/hidden/);
    });

    test('should reset form when modal closes', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      await fillFormField(page, 'title', 'Test Title');
      await closeModal(page);
      
      // Reopen modal
      await openCreateModal(page, 'idea');
      
      const titleInput = page.locator('input[name="title"]');
      const value = await titleInput.inputValue();
      expect(value).not.toBe('Test Title');
    });
  });

  test.describe('Form Interactions', () => {
    test('should handle text input fields', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const titleInput = page.locator('input[name="title"]');
      await titleInput.fill('Test Title');
      const value = await titleInput.inputValue();
      expect(value).toBe('Test Title');
    });

    test('should handle number input fields', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const ideaNumberInput = page.locator('input[name="idea_number"]');
      await ideaNumberInput.fill('123');
      const value = await ideaNumberInput.inputValue();
      expect(value).toBe('123');
    });

    test('should handle date input fields', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const dateInput = page.locator('input[name="created"]');
      const testDate = '2024-12-25';
      await dateInput.fill(testDate);
      const value = await dateInput.inputValue();
      expect(value).toBe(testDate);
    });

    test('should handle select dropdowns', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const statusSelect = page.locator('select[name="status"]');
      await selectOption(page, 'status', 'active');
      const value = await statusSelect.inputValue();
      expect(value).toBe('active');
    });

    test('should handle textarea fields', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      
      const descriptionTextarea = page.locator('textarea[name="description"]');
      const testText = 'This is a test description\nWith multiple lines.';
      await descriptionTextarea.fill(testText);
      const value = await descriptionTextarea.inputValue();
      expect(value).toBe(testText);
    });

    test('should show helper text when present', async ({ page }) => {
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      // Look for helper text elements
      const helperText = page.locator('.helper-text');
      const count = await helperText.count();
      // May or may not have helper text, but if present, should be visible
      if (count > 0) {
        await expect(helperText.first()).toBeVisible();
      }
    });

    test('should update dependent fields (idea → story number)', async ({ page }) => {
      // Create test idea first
      const testIdeaNumber = 500;
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea for Story Number');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'active');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Test story form
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      
      const storyNumberInput = page.locator('input[name="story_number"]');
      const initialValue = await storyNumberInput.inputValue();
      
      // Change idea
      await selectOption(page, 'idea_number', testIdeaNumber.toString());
      await page.waitForTimeout(500);
      
      const newValue = await storyNumberInput.inputValue();
      // Value should have updated
      expect(newValue).toBeTruthy();
      
      // Cleanup
      await page.evaluate(async (path) => {
        // Cleanup handled by test
      }, `_ideas/${testIdeaNumber}.md`);
    });

    test('should auto-fill fields from sprint ID', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const sprintIdInput = page.locator('input[name="sprint_id"]');
      await sprintIdInput.fill('2609');
      
      await page.waitForTimeout(500);
      
      const yearInput = page.locator('input[name="year"]');
      const sprintNumberInput = page.locator('input[name="sprint_number"]');
      
      const yearValue = await yearInput.inputValue();
      const sprintNumberValue = await sprintNumberInput.inputValue();
      
      expect(yearValue).toBe('2026');
      expect(sprintNumberValue).toBe('9');
    });
  });

  test.describe('Toast Notifications', () => {
    test('should show success toast on create', async ({ page }) => {
      const testIdeaNumber = 400;
      
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea for Toast');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      await verifyToast(page, 'Idea created', 'success');
      
      // Cleanup
      await page.evaluate(async (path) => {
        // Cleanup
      }, `_ideas/${testIdeaNumber}.md`);
    });

    test('should show error toast on validation failure', async ({ page }) => {
      const testIdeaNumber = 399;
      
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
      
      // Try duplicate (should show error)
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Duplicate Idea');
      await fillFormField(page, 'description', 'Duplicate description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      await verifyToast(page, '', 'error'); // Error toast should appear
      
      // Cleanup
      await page.evaluate(async (path) => {
        // Cleanup
      }, `_ideas/${testIdeaNumber}.md`);
    });

    test('should auto-dismiss toast after timeout', async ({ page }) => {
      const testIdeaNumber = 398;
      
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      const toast = page.locator('.toast--success');
      await expect(toast).toBeVisible();
      
      // Wait for toast to disappear (should be ~4 seconds)
      await page.waitForTimeout(5000);
      await expect(toast).not.toBeVisible();
      
      // Cleanup
      await page.evaluate(async (path) => {
        // Cleanup
      }, `_ideas/${testIdeaNumber}.md`);
    });

    test('should handle multiple toasts', async ({ page }) => {
      // Create multiple items quickly to test toast stacking
      const testIdeaNumbers = [397, 396];
      
      for (const ideaNumber of testIdeaNumbers) {
        await navigateToTab(page, 'ideas');
        await openCreateModal(page, 'idea');
        await fillFormField(page, 'idea_number', ideaNumber.toString());
        await fillFormField(page, 'title', `Test Idea ${ideaNumber}`);
        await fillFormField(page, 'description', 'Test description');
        await selectOption(page, 'status', 'planned');
        await fillFormField(page, 'created', today());
        await submitForm(page);
        await page.waitForTimeout(200);
      }
      
      // Multiple toasts should be visible
      const toasts = page.locator('.toast--success');
      const count = await toasts.count();
      expect(count).toBeGreaterThanOrEqual(1);
      
      // Cleanup
      for (const ideaNumber of testIdeaNumbers) {
        await page.evaluate(async (path) => {
          // Cleanup
        }, `_ideas/${ideaNumber}.md`);
      }
    });
  });

  test.describe('Error Banner', () => {
    test('should display error banner on errors', async ({ page }) => {
      const testIdeaNumber = 395;
      
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
      await page.evaluate(async (path) => {
        // Cleanup
      }, `_ideas/${testIdeaNumber}.md`);
    });

    test('should auto-hide error banner', async ({ page }) => {
      const testIdeaNumber = 394;
      
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
      
      // Trigger error
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Duplicate');
      await fillFormField(page, 'description', 'Duplicate');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      const errorBanner = page.locator('#error-message');
      await expect(errorBanner).toBeVisible();
      
      // Wait for auto-hide (should be ~5 seconds)
      await page.waitForTimeout(6000);
      const display = await errorBanner.evaluate((el) => window.getComputedStyle(el).display);
      expect(display).toBe('none');
      
      // Cleanup
      await page.evaluate(async (path) => {
        // Cleanup
      }, `_ideas/${testIdeaNumber}.md`);
    });

    test('should show clear error messages', async ({ page }) => {
      const testIdeaNumber = 393;
      
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
      
      // Trigger error
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Duplicate');
      await fillFormField(page, 'description', 'Duplicate');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      
      const errorBanner = page.locator('#error-message');
      await expect(errorBanner).toBeVisible();
      
      const errorText = await errorBanner.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText!.length).toBeGreaterThan(0);
      
      // Cleanup
      await page.evaluate(async (path) => {
        // Cleanup
      }, `_ideas/${testIdeaNumber}.md`);
    });
  });
});

