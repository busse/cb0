/**
 * Playwright tests for Sprints tab
 * Tests CRUD operations, validation, and error handling for Sprints
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

test.describe('Sprints Tab', () => {
  test.beforeEach(async ({ page }) => {
  });

  test.describe('Read Operations', () => {
    test('should load sprints tab and display list', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await waitForListLoad(page, 'sprints-list');
      
      const sprintsList = page.locator('#sprints-list');
      await expect(sprintsList).toBeVisible();
    });

    test('should display existing sprints', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await waitForListLoad(page, 'sprints-list');
      
      const list = page.locator('#sprints-list');
      const text = await list.textContent();
      expect(text).toBeTruthy();
    });
  });

  test.describe('Create Operations', () => {
    test('should open create sprint modal', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      await expect(modal).not.toHaveClass(/hidden/);
      
      const modalTitle = page.locator('#modal-title');
      await expect(modalTitle).toContainText('Create Sprint');
    });

    test('should auto-fill year and sprint number from sprint ID', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const sprintIdInput = page.locator('input[name="sprint_id"]');
      await sprintIdInput.fill('2609');
      
      // Wait for auto-fill
      await page.waitForTimeout(500);
      
      const yearInput = page.locator('input[name="year"]');
      const sprintNumberInput = page.locator('input[name="sprint_number"]');
      
      const yearValue = await yearInput.inputValue();
      const sprintNumberValue = await sprintNumberInput.inputValue();
      
      // Year should be 2026 (26 + 2000), sprint number should be 09
      expect(yearValue).toBe('2026');
      expect(sprintNumberValue).toBe('9');
    });

    test('should create new sprint with valid data', async ({ page }) => {
      const testSprintId = '2701';
      const testStartDate = '2027-01-01';
      const testEndDate = '2027-01-14';
      
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '1');
      await fillFormField(page, 'start_date', testStartDate);
      await fillFormField(page, 'end_date', testEndDate);
      await selectOption(page, 'status', 'planned');
      
      await submitForm(page);
      await verifyToast(page, 'Sprint created', 'success');
      
      await waitForListLoad(page, 'sprints-list');
      await verifyItemInList(page, 'sprints-list', testSprintId);
      
      const fileExists = await verifyFileExists(`_sprints/${testSprintId}.md`);
      expect(fileExists).toBe(true);
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });

    test('should create sprint with goals', async ({ page }) => {
      const testSprintId = '2702';
      const goals = 'Goal 1\nGoal 2\nGoal 3';
      
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '2');
      await fillFormField(page, 'start_date', '2027-01-15');
      await fillFormField(page, 'end_date', '2027-01-28');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'goals', goals);
      
      await submitForm(page);
      await verifyToast(page, 'Sprint created', 'success');
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });

    test('should create sprint with body content', async ({ page }) => {
      const testSprintId = '2703';
      const bodyContent = 'Sprint notes and details\n\nMore content here.';
      
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '3');
      await fillFormField(page, 'start_date', '2027-01-29');
      await fillFormField(page, 'end_date', '2027-02-11');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'body', bodyContent);
      
      await submitForm(page);
      await verifyToast(page, 'Sprint created', 'success');
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });
  });

  test.describe('Edit Operations', () => {
    test('should open edit modal with pre-populated data', async ({ page }) => {
      const testSprintId = '2704';
      
      // Create sprint
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '4');
      await fillFormField(page, 'start_date', '2027-02-12');
      await fillFormField(page, 'end_date', '2027-02-25');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Edit it
      await openEditModal(page, 'sprint', testSprintId);
      
      const modal = page.locator('#modal');
      await expect(modal).toBeVisible();
      
      const sprintIdInput = page.locator('input[name="sprint_id"]');
      const sprintIdValue = await sprintIdInput.inputValue();
      expect(sprintIdValue).toBe(testSprintId);
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });

    test('should update sprint fields', async ({ page }) => {
      const testSprintId = '2705';
      
      // Create sprint
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '5');
      await fillFormField(page, 'start_date', '2027-02-26');
      await fillFormField(page, 'end_date', '2027-03-11');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Edit sprint
      await openEditModal(page, 'sprint', testSprintId);
      await selectOption(page, 'status', 'active');
      await fillFormField(page, 'goals', 'Updated goal 1\nUpdated goal 2');
      await submitForm(page);
      
      await verifyToast(page, 'Sprint updated', 'success');
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });
  });

  test.describe('Delete Operations', () => {
    test('should delete sprint with confirmation', async ({ page }) => {
      const testSprintId = '2706';
      
      // Create test sprint
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '6');
      await fillFormField(page, 'start_date', '2027-03-12');
      await fillFormField(page, 'end_date', '2027-03-25');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Delete with confirmation
      let dialogAccepted = false;
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain(`Delete Sprint ${testSprintId}`);
        dialogAccepted = true;
        await dialog.accept();
      });
      
      await deleteItem(page, 'sprint', testSprintId);
      
      expect(dialogAccepted).toBe(true);
      await verifyToast(page, 'Sprint deleted', 'success');
      
      // Verify file deleted
      const fileExists = await verifyFileExists(`_sprints/${testSprintId}.md`, 1000);
      expect(fileExists).toBe(false);
    });
  });

  test.describe('Error Cases', () => {
    test('should validate sprint ID format (YYSS)', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      // Try invalid format
      const sprintIdInput = page.locator('input[name="sprint_id"]');
      await sprintIdInput.fill('123'); // Too short
      
      // HTML5 pattern validation should catch this
      const validity = await sprintIdInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should prevent duplicate sprint ID', async ({ page }) => {
      const testSprintId = '2707';
      
      // Create first sprint
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '7');
      await fillFormField(page, 'start_date', '2027-03-26');
      await fillFormField(page, 'end_date', '2027-04-08');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      await waitForListLoad(page, 'sprints-list');
      
      // Try to create duplicate
      await openCreateModal(page, 'sprint');
      await fillFormField(page, 'sprint_id', testSprintId);
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '7');
      await fillFormField(page, 'start_date', '2027-04-09');
      await fillFormField(page, 'end_date', '2027-04-22');
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      
      // Should show error
      await verifyErrorBanner(page);
      
      // Cleanup
      await cleanupTestData([`_sprints/${testSprintId}.md`]);
    });

    test('should validate end date is after start date', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      await fillFormField(page, 'sprint_id', '2708');
      await fillFormField(page, 'year', '2027');
      await fillFormField(page, 'sprint_number', '8');
      await fillFormField(page, 'start_date', '2027-04-23');
      await fillFormField(page, 'end_date', '2027-04-22'); // Before start date
      await selectOption(page, 'status', 'planned');
      await submitForm(page);
      
      // Should show validation error
      await verifyErrorBanner(page);
    });

    test('should validate sprint number range (1-26)', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const sprintNumberInput = page.locator('input[name="sprint_number"]');
      await sprintNumberInput.fill('27'); // Out of range
      
      // HTML5 min/max validation
      const validity = await sprintNumberInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should validate year range', async ({ page }) => {
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      
      const yearInput = page.locator('input[name="year"]');
      await yearInput.fill('1999'); // Below minimum
      
      // HTML5 min/max validation
      const validity = await yearInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    });
  });
});





