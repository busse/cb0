/**
 * Playwright tests for Materials tab
 */

import { test, expect } from './electron-fixture';
import {
  cleanupTestData,
  deleteItem,
  fillFormField,
  navigateToTab,
  openCreateModal,
  openEditModal,
  submitForm,
  today,
  verifyFileExists,
  verifyFileNotExists,
  verifyItemInList,
  verifyToast,
} from './helpers';

test.describe('Materials Tab', () => {
  test('should load materials list', async ({ page }) => {
    await navigateToTab(page, 'materials');
    const list = page.locator('#materials-list');
    await expect(list).toBeVisible();
  });

  test('should create a new material', async ({ page }) => {
    const date = today();
    const slug = `test-material-${Date.now()}`;
    const fileName = `${date}-${slug}.md`;

    await openCreateModal(page, 'material');
    await fillFormField(page, 'title', `Test Material ${slug}`);
    await fillFormField(page, 'slug', slug);
    await fillFormField(page, 'date', date);
    await fillFormField(page, 'author', 'Playwright Bot');
    await fillFormField(page, 'canonical_source_url', 'https://example.com/source');
    await fillFormField(page, 'tags', 'test, automation');
    await fillFormField(page, 'excerpt', 'Test excerpt');
    await fillFormField(page, 'body', 'This is a body for the test material.');

    await submitForm(page);
    await verifyToast(page, 'Material created', 'success');
    await verifyItemInList(page, 'materials-list', slug);

    const fileExists = await verifyFileExists(`_materials/${fileName}`);
    expect(fileExists).toBe(true);

    await cleanupTestData([`_materials/${fileName}`]);
  });

  test('should edit an existing material', async ({ page }) => {
    const date = today();
    const slug = `test-material-edit-${Date.now()}`;
    const fileName = `${date}-${slug}.md`;

    // Create material first
    await openCreateModal(page, 'material');
    await fillFormField(page, 'title', `Editable Material ${slug}`);
    await fillFormField(page, 'slug', slug);
    await fillFormField(page, 'date', date);
    await submitForm(page);
    await verifyToast(page, 'Material created', 'success');

    await openEditModal(page, 'material', fileName);
    await fillFormField(page, 'title', `Edited Material ${slug}`);
    await submitForm(page);
    await verifyToast(page, 'Material updated', 'success');

    await cleanupTestData([`_materials/${fileName}`]);
  });

  test('should delete a material', async ({ page }) => {
    const date = today();
    const slug = `test-material-delete-${Date.now()}`;
    const fileName = `${date}-${slug}.md`;

    await openCreateModal(page, 'material');
    await fillFormField(page, 'title', `Delete Material ${slug}`);
    await fillFormField(page, 'slug', slug);
    await fillFormField(page, 'date', date);
    await submitForm(page);
    await verifyToast(page, 'Material created', 'success');

    await deleteItem(page, 'material', fileName);
    const fileMissing = await verifyFileNotExists(`_materials/${fileName}`);
    expect(fileMissing).toBe(true);
  });
});

