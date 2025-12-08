/**
 * Shared test utilities for Electron CMS Playwright tests
 */

import { Page, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

// From electron/tests/playwright-mcp -> electron -> repo root
const REPO_ROOT = path.resolve(__dirname, '../../..');

export interface TestContext {
  page: Page;
  testDataDir: string;
}

/**
 * Navigate to a specific tab
 */
export async function navigateToTab(
  page: Page,
  tab: 'ideas' | 'notes' | 'stories' | 'sprints' | 'updates' | 'figures'
): Promise<void> {
  const tabButton = page.locator(`button[data-tab="${tab}"]`);
  await tabButton.click();
  await page.waitForSelector(`#${tab}-panel.active`, { timeout: 5000 });
}

/**
 * Open a create modal for an entity type
 */
export async function openCreateModal(
  page: Page,
  entityType: 'idea' | 'material' | 'story' | 'sprint' | 'update'
): Promise<void> {
  await navigateToTab(page, `${entityType}s` as any);
  const newButton = page.locator(`button[data-action="new-${entityType}"]`);
  await newButton.click();
  await page.waitForSelector('#modal:not(.hidden)', { timeout: 5000 });
}

/**
 * Open an edit modal for an entity
 */
export async function openEditModal(
  page: Page,
  entityType: 'idea' | 'material' | 'story' | 'sprint' | 'update',
  identifier: string | { idea: number } | { idea: number; story: number } | { sprint: string } | { sprint: string; idea: number; story: number }
): Promise<void> {
  await navigateToTab(page, `${entityType}s` as any);
  
  let editButton;
  if (entityType === 'idea') {
    editButton = page.locator(`button[data-action="edit-idea"][data-idea="${identifier}"]`);
  } else if (entityType === 'material') {
    editButton = page.locator(`button[data-action="edit-material"][data-material="${identifier}"]`);
  } else if (entityType === 'story') {
    const id = identifier as { idea: number; story: number };
    editButton = page.locator(`button[data-action="edit-story"][data-idea="${id.idea}"][data-story="${id.story}"]`);
  } else if (entityType === 'sprint') {
    editButton = page.locator(`button[data-action="edit-sprint"][data-sprint="${identifier}"]`);
  } else if (entityType === 'update') {
    const id = identifier as { sprint: string; idea: number; story: number };
    editButton = page.locator(
      `button[data-action="edit-update"][data-sprint="${id.sprint}"][data-idea="${id.idea}"][data-story="${id.story}"]`
    );
  }
  
  if (editButton) {
    await editButton.click();
    await page.waitForSelector('#modal:not(.hidden)', { timeout: 5000 });
  }
}

/**
 * Fill a form field
 */
export async function fillFormField(page: Page, name: string, value: string): Promise<void> {
  const field = page.locator(`input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`);
  await field.fill(value);
}

/**
 * Select an option in a select field
 */
export async function selectOption(page: Page, name: string, value: string): Promise<void> {
  const select = page.locator(`select[name="${name}"]`);
  await select.selectOption(value);
}

/**
 * Submit the current modal form
 */
export async function submitForm(page: Page): Promise<void> {
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  // Wait for modal to close or error to appear
  await page.waitForTimeout(1000);
}

/**
 * Close the modal
 */
export async function closeModal(page: Page): Promise<void> {
  const closeButton = page.locator('#modal-close');
  await closeButton.click();
  await page.waitForSelector('#modal.hidden', { timeout: 5000 });
}

/**
 * Verify a toast message appears
 */
export async function verifyToast(page: Page, message: string, type: 'success' | 'error' = 'success'): Promise<void> {
  // Find toast with specific message text
  const toast = page.locator(`.toast--${type}`).filter({ hasText: message }).first();
  await expect(toast).toBeVisible({ timeout: 5000 });
  await expect(toast).toContainText(message);
}

/**
 * Verify error banner displays
 */
export async function verifyErrorBanner(page: Page, message?: string): Promise<void> {
  const errorBanner = page.locator('#error-message');
  await expect(errorBanner).toBeVisible({ timeout: 5000 });
  if (message) {
    await expect(errorBanner).toContainText(message);
  }
}

/**
 * Verify a file exists in the content directory
 */
export async function verifyFileExists(
  relativePath: string,
  timeout = 5000
): Promise<boolean> {
  const filePath = path.join(REPO_ROOT, relativePath);
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  return false;
}

/**
 * Verify a file does not exist
 */
export async function verifyFileNotExists(relativePath: string): Promise<boolean> {
  const filePath = path.join(REPO_ROOT, relativePath);
  try {
    await fs.access(filePath);
    return false; // File exists when it shouldn't
  } catch {
    return true; // File doesn't exist as expected
  }
}

/**
 * Read a content file
 */
export async function readContentFile(relativePath: string): Promise<string> {
  const filePath = path.join(REPO_ROOT, relativePath);
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Delete a test file
 */
export async function deleteTestFile(relativePath: string): Promise<void> {
  const filePath = path.join(REPO_ROOT, relativePath);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, that's okay
  }
}

/**
 * Cleanup test data files
 */
export async function cleanupTestData(testFiles: string[]): Promise<void> {
  for (const file of testFiles) {
    await deleteTestFile(file);
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Wait for list to load
 */
export async function waitForListLoad(page: Page, listId: string): Promise<void> {
  const list = page.locator(`#${listId}`);
  // Wait for either content or empty state
  await page.waitForFunction(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const text = el.textContent || '';
      return text.includes('Loading') === false;
    },
    listId,
    { timeout: 10000 }
  );
}

/**
 * Get count of items in a list
 */
export async function getListItemCount(page: Page, listId: string): Promise<number> {
  const list = page.locator(`#${listId}`);
  const items = list.locator('.item-card');
  return await items.count();
}

/**
 * Verify item appears in list
 */
export async function verifyItemInList(
  page: Page,
  listId: string,
  identifier: string | { idea: number } | { idea: number; story: number } | { sprint: string } | { sprint: string; idea: number; story: number }
): Promise<void> {
  await waitForListLoad(page, listId);
  
  let selector;
  if (typeof identifier === 'string') {
    selector = `#${listId} .item-badge:has-text("${identifier}")`;
  } else if ('idea' in identifier && 'story' in identifier) {
    // For stories or updates
    selector = `.item-badge:has-text("${identifier.idea}.${identifier.story}")`;
  } else if ('sprint' in identifier && 'idea' in identifier && 'story' in identifier) {
    selector = `.item-badge:has-text("${identifier.sprint}.${identifier.idea}.${identifier.story}")`;
  } else {
    throw new Error('Invalid identifier format');
  }
  
  const item = page.locator(selector);
  await expect(item).toBeVisible({ timeout: 5000 });
}

/**
 * Click delete button and confirm
 */
export async function deleteItem(
  page: Page,
  entityType: 'idea' | 'material' | 'story' | 'sprint' | 'update',
  identifier: string | { idea: number } | { idea: number; story: number } | { sprint: string } | { sprint: string; idea: number; story: number }
): Promise<void> {
  await navigateToTab(page, `${entityType}s` as any);
  
  let deleteButton;
  if (entityType === 'idea') {
    deleteButton = page.locator(`button[data-action="delete-idea"][data-idea="${identifier}"]`);
  } else if (entityType === 'material') {
    deleteButton = page.locator(`button[data-action="delete-material"][data-material="${identifier}"]`);
  } else if (entityType === 'story') {
    const id = identifier as { idea: number; story: number };
    deleteButton = page.locator(`button[data-action="delete-story"][data-idea="${id.idea}"][data-story="${id.story}"]`);
  } else if (entityType === 'sprint') {
    deleteButton = page.locator(`button[data-action="delete-sprint"][data-sprint="${identifier}"]`);
  } else if (entityType === 'update') {
    const id = identifier as { sprint: string; idea: number; story: number };
    deleteButton = page.locator(
      `button[data-action="delete-update"][data-sprint="${id.sprint}"][data-idea="${id.idea}"][data-story="${id.story}"]`
    );
  }
  
  if (deleteButton) {
    // Set up dialog handler before clicking
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await deleteButton.click();
    await page.waitForTimeout(1000); // Wait for deletion to process
  }
}

/**
 * Refresh a tab's data
 */
export async function refreshTab(
  page: Page,
  tab: 'ideas' | 'notes' | 'stories' | 'sprints' | 'updates' | 'figures'
): Promise<void> {
  await navigateToTab(page, tab);
  const refreshButton = page.locator(`button[data-action="refresh-${tab}"]`);
  await refreshButton.click();
  await waitForListLoad(page, `${tab}-list`);
}

/**
 * Select an option in a multi-select component
 */
export async function selectMultiSelectOption(
  page: Page,
  fieldName: string,
  value: string
): Promise<void> {
  const multiSelect = page.locator(`[data-multi-select="${fieldName}"]`);
  await expect(multiSelect).toBeVisible({ timeout: 5000 });
  
  // Click the input to open dropdown
  const input = multiSelect.locator('.multi-select__input');
  await input.click();
  await page.waitForTimeout(200); // Wait for dropdown to open
  
  // Find and click the checkbox for the option
  const option = multiSelect.locator(`[data-option="${value}"]`);
  const checkbox = option.locator('input[type="checkbox"]');
  
  // Check if already selected
  const isChecked = await checkbox.isChecked();
  if (!isChecked) {
    await checkbox.click();
    await page.waitForTimeout(200); // Wait for selection to register
  }
  
  // Click outside to close dropdown
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

/**
 * Get selected options from a multi-select component
 */
export async function getSelectedMultiSelectOptions(
  page: Page,
  fieldName: string
): Promise<string[]> {
  const multiSelect = page.locator(`[data-multi-select="${fieldName}"]`);
  await expect(multiSelect).toBeVisible({ timeout: 5000 });
  
  // Get all checked checkboxes
  const checkedBoxes = multiSelect.locator('input[type="checkbox"]:checked');
  const count = await checkedBoxes.count();
  const selected: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const value = await checkedBoxes.nth(i).getAttribute('value');
    if (value) {
      selected.push(value);
    }
  }
  
  return selected;
}

/**
 * Verify a relationship appears in the sidebar
 */
export async function verifyRelationshipInSidebar(
  page: Page,
  tab: 'ideas' | 'notes' | 'stories' | 'sprints' | 'updates' | 'figures',
  relationshipType: string,
  expectedText: string
): Promise<void> {
  const sidebar = page.locator(`#${tab}-sidebar`);
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  
  // Find the relationship section
  const section = sidebar.locator(`section:has-text("${relationshipType}")`);
  await expect(section).toBeVisible({ timeout: 2000 });
  
  // Verify the expected text appears in that section
  const relationshipItem = section.locator(`text=${expectedText}`);
  await expect(relationshipItem).toBeVisible({ timeout: 2000 });
}

/**
 * Verify a relationship does not appear in the sidebar
 */
export async function verifyRelationshipNotInSidebar(
  page: Page,
  tab: 'ideas' | 'notes' | 'stories' | 'sprints' | 'updates' | 'figures',
  relationshipType: string,
  text: string
): Promise<void> {
  const sidebar = page.locator(`#${tab}-sidebar`);
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  
  // Find the relationship section if it exists
  const section = sidebar.locator(`section:has-text("${relationshipType}")`);
  const sectionExists = await section.count() > 0;
  
  if (sectionExists) {
    // If section exists, verify the text is not in it
    const relationshipItem = section.locator(`text=${text}`);
    await expect(relationshipItem).not.toBeVisible({ timeout: 1000 });
  }
  // If section doesn't exist, that's fine - relationship is not shown
}

/**
 * Get sidebar content as text
 */
export async function getSidebarContent(
  page: Page,
  tab: 'ideas' | 'notes' | 'stories' | 'sprints' | 'updates' | 'figures'
): Promise<string> {
  const sidebar = page.locator(`#${tab}-sidebar`);
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  return await sidebar.textContent() || '';
}

/**
 * Click a card to select it and show relationships
 */
export async function clickCard(
  page: Page,
  tab: 'ideas' | 'notes' | 'stories' | 'sprints' | 'updates' | 'figures',
  identifier: string
): Promise<void> {
  await navigateToTab(page, tab);
  await waitForListLoad(page, `${tab}-list`);
  
  // Find the card by its data attribute
  let card;
  if (tab === 'ideas') {
    card = page.locator(`.item-card[data-idea-number="${identifier}"]`);
  } else if (tab === 'notes') {
    card = page.locator(`.item-card[data-note-slug="${identifier}"]`);
  } else if (tab === 'stories') {
    card = page.locator(`.item-card[data-story-number="${identifier}"]`);
  } else if (tab === 'sprints') {
    card = page.locator(`.item-card[data-sprint-id="${identifier}"]`);
  } else if (tab === 'updates') {
    // Updates need sprint, idea, story
    const parts = identifier.split('.');
    if (parts.length === 3) {
      card = page.locator(
        `.item-card[data-sprint-id="${parts[0]}"][data-idea-number="${parts[1]}"][data-story-number="${parts[2]}"]`
      );
    }
  } else if (tab === 'figures') {
    card = page.locator(`.item-card[data-figure-number="${identifier}"]`);
  }
  
  if (card && (await card.count()) > 0) {
    await card.click();
    await page.waitForTimeout(500); // Wait for sidebar to update
  }
}

