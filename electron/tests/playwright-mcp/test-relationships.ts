/**
 * Playwright tests for Many-to-Many Relationships
 * Tests bidirectional sync, display, forms, persistence, and edge cases
 */

import { test, expect } from './electron-fixture';
import {
  navigateToTab,
  openCreateModal,
  openEditModal,
  fillFormField,
  selectOption,
  submitForm,
  closeModal,
  verifyToast,
  waitForListLoad,
  verifyItemInList,
  today,
  cleanupTestData,
  verifyFileExists,
  readContentFile,
  selectMultiSelectOption,
  getSelectedMultiSelectOptions,
  verifyRelationshipInSidebar,
  verifyRelationshipNotInSidebar,
  getSidebarContent,
  clickCard,
} from './helpers';

test.describe('Many-to-Many Relationships', () => {
  test.describe('Bidirectional Relationship Sync', () => {
    test('should create Idea → Story relationship and verify Story → Idea is created', async ({ page }) => {
      const testIdeaNumber = 9001;
      const testStoryIdea = 9002;
      const testStoryNumber = 1;
      
      // Create test idea
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea for Relationship');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Create test story
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story for Relationship');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Edit idea to add story relationship
      await navigateToTab(page, 'ideas');
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      
      // Select the story in the multi-select
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await submitForm(page);
      await verifyToast(page, 'Idea updated', 'success');
      await waitForListLoad(page, 'ideas-list');
      
      // Verify idea file has related_stories
      const ideaFile = await readContentFile(`_ideas/${testIdeaNumber}.md`);
      expect(ideaFile).toContain('related_stories:');
      expect(ideaFile).toContain(`- ${testStoryNumber}`);
      
      // Verify story file has related_ideas (bidirectional)
      const storyFile = await readContentFile(`_stories/${testStoryIdea}/${testStoryNumber}.md`);
      expect(storyFile).toContain('related_ideas:');
      expect(storyFile).toContain(`- ${testIdeaNumber}`);
      
      // Cleanup
      await cleanupTestData([
        `_ideas/${testIdeaNumber}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
      ]);
    });

    test('should create Sprint → Story relationship and verify Story → Sprint is created', async ({ page }) => {
      const testSprintId = '9001';
      const testStoryIdea = 9003;
      const testStoryNumber = 1;
      
      // Create test sprint
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
      
      // Create test story
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story for Sprint');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Edit sprint to add story relationship
      await navigateToTab(page, 'sprints');
      await openEditModal(page, 'sprint', testSprintId);
      
      // Select the story in the multi-select
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await submitForm(page);
      await verifyToast(page, 'Sprint updated', 'success');
      await waitForListLoad(page, 'sprints-list');
      
      // Verify sprint file has related_stories
      const sprintFile = await readContentFile(`_sprints/${testSprintId}.md`);
      expect(sprintFile).toContain('related_stories:');
      expect(sprintFile).toContain(`- ${testStoryNumber}`);
      
      // Verify story file has related_sprints (bidirectional)
      const storyFile = await readContentFile(`_stories/${testStoryIdea}/${testStoryNumber}.md`);
      expect(storyFile).toContain('related_sprints:');
      expect(storyFile).toContain(`- ${testSprintId}`);
      
      // Cleanup
      await cleanupTestData([
        `_sprints/${testSprintId}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
      ]);
    });

    test('should remove relationship and verify bidirectional cleanup', async ({ page }) => {
      const testIdeaNumber = 9004;
      const testStoryIdea = 9005;
      const testStoryNumber = 1;
      
      // Create idea and story with relationship
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Add relationship
      await navigateToTab(page, 'ideas');
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Remove relationship
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      // Deselect the story
      const selected = await getSelectedMultiSelectOptions(page, 'related_stories');
      if (selected.includes(testStoryNumber.toString())) {
        await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString()); // Toggle off
      }
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Verify idea file no longer has related_stories
      const ideaFile = await readContentFile(`_ideas/${testIdeaNumber}.md`);
      expect(ideaFile).not.toContain(`- ${testStoryNumber}`);
      
      // Verify story file no longer has related_ideas (bidirectional cleanup)
      const storyFile = await readContentFile(`_stories/${testStoryIdea}/${testStoryNumber}.md`);
      expect(storyFile).not.toContain(`- ${testIdeaNumber}`);
      
      // Cleanup
      await cleanupTestData([
        `_ideas/${testIdeaNumber}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
      ]);
    });
  });

  test.describe('Relationship Display', () => {
    test('should show sidebar when card is selected', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await waitForListLoad(page, 'ideas-list');
      
      // Click first card if available
      const firstCard = page.locator('.item-card').first();
      const count = await firstCard.count();
      if (count > 0) {
        await clickCard(page, 'ideas', await firstCard.getAttribute('data-idea-number') || '');
        
        // Verify sidebar is visible
        const sidebar = page.locator('#ideas-sidebar');
        await expect(sidebar).toBeVisible({ timeout: 2000 });
      }
    });

    test('should display relationships in sidebar in correct order', async ({ page }) => {
      const testIdeaNumber = 9006;
      const testStoryIdea = 9007;
      const testStoryNumber = 1;
      const testSprintId = '9002';
      
      // Create entities with relationships
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea for Display');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
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
      
      // Add relationships to idea
      await navigateToTab(page, 'ideas');
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await selectMultiSelectOption(page, 'related_sprints', testSprintId);
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Select the idea card
      await clickCard(page, 'ideas', testIdeaNumber.toString());
      
      // Verify sidebar shows relationships in correct order: Ideas, Stories, Sprints, Notes, Figures, Updates
      const sidebarContent = await getSidebarContent(page, 'ideas');
      
      // Find positions of each section
      const storiesIndex = sidebarContent.indexOf('STORIES');
      const sprintsIndex = sidebarContent.indexOf('SPRINTS');
      
      // Stories should come before Sprints
      expect(storiesIndex).toBeGreaterThan(-1);
      expect(sprintsIndex).toBeGreaterThan(-1);
      expect(storiesIndex).toBeLessThan(sprintsIndex);
      
      // Verify specific relationships appear
      await verifyRelationshipInSidebar(page, 'ideas', 'STORIES', `s${testStoryNumber}`);
      await verifyRelationshipInSidebar(page, 'ideas', 'SPRINTS', testSprintId);
      
      // Cleanup
      await cleanupTestData([
        `_ideas/${testIdeaNumber}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
        `_sprints/${testSprintId}.md`,
      ]);
    });

    test('should show relationships from both directions (Sprint shows stories that reference it)', async ({ page }) => {
      const testSprintId = '2601'; // Use existing sprint
      const testStoryIdea = 9008;
      const testStoryNumber = 1;
      
      // Create a story
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story for Sprint 2601');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Add sprint relationship to story
      await openEditModal(page, 'story', { idea: testStoryIdea, story: testStoryNumber });
      await selectMultiSelectOption(page, 'related_sprints', testSprintId);
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Select the sprint card
      await navigateToTab(page, 'sprints');
      await waitForListLoad(page, 'sprints-list');
      await clickCard(page, 'sprints', testSprintId);
      
      // Verify sidebar shows the story (bidirectional display)
      await verifyRelationshipInSidebar(page, 'sprints', 'STORIES', `s${testStoryNumber}`);
      
      // Cleanup
      await cleanupTestData([`_stories/${testStoryIdea}/${testStoryNumber}.md`]);
    });

    test('should clear sidebar when card is deselected', async ({ page }) => {
      await navigateToTab(page, 'ideas');
      await waitForListLoad(page, 'ideas-list');
      
      const firstCard = page.locator('.item-card').first();
      const count = await firstCard.count();
      if (count > 0) {
        await clickCard(page, 'ideas', await firstCard.getAttribute('data-idea-number') || '');
        
        // Verify sidebar is visible
        const sidebar = page.locator('#ideas-sidebar');
        await expect(sidebar).toBeVisible({ timeout: 2000 });
        
        // Click elsewhere to deselect
        await page.click('body');
        await page.waitForTimeout(500);
        
        // Sidebar should show placeholder
        const sidebarText = await sidebar.textContent();
        expect(sidebarText).toContain('Select an item');
      }
    });
  });

  test.describe('Form Relationship Management', () => {
    test('should show multi-select components in all forms', async ({ page }) => {
      // Test Ideas form
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await expect(page.locator('[data-multi-select="related_stories"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_sprints"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_notes"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_figures"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_updates"]')).toBeVisible();
      await closeModal(page);
      
      // Test Stories form
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await expect(page.locator('[data-multi-select="related_sprints"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_notes"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_figures"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_updates"]')).toBeVisible();
      await closeModal(page);
      
      // Test Sprints form
      await navigateToTab(page, 'sprints');
      await openCreateModal(page, 'sprint');
      await expect(page.locator('[data-multi-select="related_ideas"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_stories"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_notes"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_figures"]')).toBeVisible();
      await expect(page.locator('[data-multi-select="related_updates"]')).toBeVisible();
      await closeModal(page);
    });

    test('should pre-populate existing relationships in edit form', async ({ page }) => {
      const testIdeaNumber = 9009;
      const testStoryIdea = 9010;
      const testStoryNumber = 1;
      
      // Create entities
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Add relationship
      await navigateToTab(page, 'ideas');
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Re-open edit form and verify relationship is pre-selected
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      const selected = await getSelectedMultiSelectOptions(page, 'related_stories');
      expect(selected).toContain(testStoryNumber.toString());
      
      await closeModal(page);
      
      // Cleanup
      await cleanupTestData([
        `_ideas/${testIdeaNumber}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
      ]);
    });
  });

  test.describe('Data Persistence', () => {
    test('should save relationships to front matter correctly', async ({ page }) => {
      const testIdeaNumber = 9011;
      const testStoryIdea = 9012;
      const testStoryNumber = 1;
      
      // Create entities
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Add relationship
      await navigateToTab(page, 'ideas');
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Verify front matter
      const ideaFile = await readContentFile(`_ideas/${testIdeaNumber}.md`);
      expect(ideaFile).toMatch(/related_stories:\s*\n\s*-\s*\d+/);
      
      // Cleanup
      await cleanupTestData([
        `_ideas/${testIdeaNumber}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
      ]);
    });

    test('should read relationships from front matter correctly', async ({ page }) => {
      const testIdeaNumber = 9013;
      const testStoryIdea = 9014;
      const testStoryNumber = 1;
      
      // Create entities and add relationship
      await navigateToTab(page, 'ideas');
      await openCreateModal(page, 'idea');
      await fillFormField(page, 'idea_number', testIdeaNumber.toString());
      await fillFormField(page, 'title', 'Test Idea');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'planned');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      await navigateToTab(page, 'stories');
      await openCreateModal(page, 'story');
      await fillFormField(page, 'idea_number', testStoryIdea.toString());
      await fillFormField(page, 'story_number', testStoryNumber.toString());
      await fillFormField(page, 'title', 'Test Story');
      await fillFormField(page, 'description', 'Test description');
      await selectOption(page, 'status', 'backlog');
      await selectOption(page, 'priority', 'medium');
      await fillFormField(page, 'created', today());
      await submitForm(page);
      await waitForListLoad(page, 'stories-list');
      
      // Add relationship
      await navigateToTab(page, 'ideas');
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      await selectMultiSelectOption(page, 'related_stories', testStoryNumber.toString());
      await submitForm(page);
      await waitForListLoad(page, 'ideas-list');
      
      // Refresh and verify relationship is still there
      await navigateToTab(page, 'ideas');
      await page.locator('button[data-action="refresh-ideas"]').click();
      await waitForListLoad(page, 'ideas-list');
      
      // Open edit form again
      await openEditModal(page, 'idea', testIdeaNumber.toString());
      const selected = await getSelectedMultiSelectOptions(page, 'related_stories');
      expect(selected).toContain(testStoryNumber.toString());
      
      await closeModal(page);
      
      // Cleanup
      await cleanupTestData([
        `_ideas/${testIdeaNumber}.md`,
        `_stories/${testStoryIdea}/${testStoryNumber}.md`,
      ]);
    });
  });
});

