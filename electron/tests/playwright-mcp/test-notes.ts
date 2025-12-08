/**
 * Playwright tests for Notes tab (blog posts)
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

test.describe('Notes Tab', () => {
  test('should load notes list', async ({ page }) => {
    await navigateToTab(page, 'notes');
    const list = page.locator('#notes-list');
    await expect(list).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    const date = today();
    const slug = `test-note-${Date.now()}`;
    const fileName = `${date}-${slug}.md`;

    await openCreateModal(page, 'note');
    await fillFormField(page, 'title', `Test Note ${slug}`);
    await fillFormField(page, 'slug', slug);
    await fillFormField(page, 'date', date);
    await fillFormField(page, 'author', 'Playwright Bot');
    await fillFormField(page, 'tags', 'test, automation');
    await fillFormField(page, 'excerpt', 'Test excerpt');
    await fillFormField(page, 'body', 'This is a body for the test note.');

    await submitForm(page);
    await verifyToast(page, 'Note created', 'success');
    await verifyItemInList(page, 'notes-list', slug);

    const fileExists = await verifyFileExists(`_posts/${fileName}`);
    expect(fileExists).toBe(true);

    await cleanupTestData([`_posts/${fileName}`]);
  });

  test('should edit an existing note', async ({ page }) => {
    const date = today();
    const slug = `test-note-edit-${Date.now()}`;
    const fileName = `${date}-${slug}.md`;

    // Create note first
    await openCreateModal(page, 'note');
    await fillFormField(page, 'title', `Editable Note ${slug}`);
    await fillFormField(page, 'slug', slug);
    await fillFormField(page, 'date', date);
    await submitForm(page);
    await verifyToast(page, 'Note created', 'success');

    await openEditModal(page, 'note', fileName);
    await fillFormField(page, 'title', `Edited Note ${slug}`);
    await submitForm(page);
    await verifyToast(page, 'Note updated', 'success');

    await cleanupTestData([`_posts/${fileName}`]);
  });

  test('should delete a note', async ({ page }) => {
    const date = today();
    const slug = `test-note-delete-${Date.now()}`;
    const fileName = `${date}-${slug}.md`;

    await openCreateModal(page, 'note');
    await fillFormField(page, 'title', `Delete Note ${slug}`);
    await fillFormField(page, 'slug', slug);
    await fillFormField(page, 'date', date);
    await submitForm(page);
    await verifyToast(page, 'Note created', 'success');

    await deleteItem(page, 'note', fileName);
    const fileMissing = await verifyFileNotExists(`_posts/${fileName}`);
    expect(fileMissing).toBe(true);
  });
});




