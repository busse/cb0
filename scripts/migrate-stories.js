#!/usr/bin/env node

/**
 * Story migration utility
 *
 * - Flattens `_stories/{idea}/{story}.md` -> `_stories/{globalId}.md`
 * - Converts `idea_number` to `related_ideas` array
 * - Converts `assigned_sprint` to `related_sprints` array
 * - Updates `_updates` notation + story_number references
 * - Updates `_figures` related_stories references
 */

const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const STORIES_DIR = path.join(ROOT, '_stories');
const UPDATES_DIR = path.join(ROOT, '_updates');
const FIGURES_DIR = path.join(ROOT, '_figures');

async function collectStoryFiles() {
  const entries = await fs.readdir(STORIES_DIR);
  const stories = [];

  for (const entry of entries) {
    const entryPath = path.join(STORIES_DIR, entry);
    const stat = await fs.stat(entryPath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(entryPath);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        stories.push(path.join(entryPath, file));
      }
      continue;
    }

    if (entry.endsWith('.md')) {
      stories.push(entryPath);
    }
  }

  return stories;
}

function normalizeStoryData(parsed) {
  const data = { ...parsed.data };
  const legacyIdea = data.idea_number;
  const legacyStory = data.story_number;

  if (typeof legacyIdea !== 'number' || typeof legacyStory !== 'number') {
    throw new Error('Story is missing idea_number or story_number');
  }

  const relatedIdeas = Array.isArray(data.related_ideas)
    ? data.related_ideas.map(Number)
    : [legacyIdea];

  const relatedSprints = Array.isArray(data.related_sprints)
    ? data.related_sprints.map(String)
    : data.assigned_sprint
      ? [String(data.assigned_sprint)]
      : undefined;

  delete data.idea_number;
  delete data.assigned_sprint;

  return {
    data: {
      ...data,
      related_ideas: Array.from(new Set(relatedIdeas)),
      ...(relatedSprints && relatedSprints.length ? { related_sprints: relatedSprints } : {}),
    },
    legacyIdea,
    legacyStory,
    body: parsed.content,
  };
}

async function migrateStories() {
  const files = await collectStoryFiles();
  const storyEntries = [];

  for (const filePath of files) {
    const parsed = matter(await fs.readFile(filePath, 'utf-8'));
    if (Array.isArray(parsed.data.related_ideas) && !parsed.data.idea_number) {
      // Already migrated
      continue;
    }
    const normalized = normalizeStoryData(parsed);
    storyEntries.push({
      ...normalized,
      filePath,
    });
  }

  if (!storyEntries.length) {
    console.log('No legacy stories found. Nothing to migrate.');
    return { storyMap: new Map(), migratedStories: 0 };
  }

  storyEntries.sort((a, b) => {
    if (a.legacyIdea !== b.legacyIdea) {
      return a.legacyIdea - b.legacyIdea;
    }
    return a.legacyStory - b.legacyStory;
  });

  const storyMap = new Map(); // key: `${legacyIdea}:${legacyStory}` -> newStoryNumber
  let nextStoryNumber = 0;

  for (const story of storyEntries) {
    story.newStoryNumber = nextStoryNumber++;
    storyMap.set(`${story.legacyIdea}:${story.legacyStory}`, story.newStoryNumber);
  }

  // Clean up any existing flat files before writing
  const existingFlatFiles = await fs.readdir(STORIES_DIR);
  for (const file of existingFlatFiles) {
    if (file.endsWith('.md')) {
      await fs.unlink(path.join(STORIES_DIR, file));
    }
  }

  // Write migrated stories
  for (const story of storyEntries) {
    const frontMatter = matter.stringify(story.body, {
      ...story.data,
      story_number: story.newStoryNumber,
    });
    const destinationPath = path.join(STORIES_DIR, `${story.newStoryNumber}.md`);
    await fs.writeFile(destinationPath, frontMatter, 'utf-8');
    await fs.unlink(story.filePath);
  }

  // Remove empty legacy directories
  const legacyDirs = await fs.readdir(STORIES_DIR);
  for (const entry of legacyDirs) {
    const entryPath = path.join(STORIES_DIR, entry);
    const stat = await fs.stat(entryPath).catch(() => undefined);
    if (stat?.isDirectory()) {
      const remaining = await fs.readdir(entryPath);
      if (!remaining.length) {
        await fs.rmdir(entryPath);
      }
    }
  }

  console.log(`Migrated ${storyEntries.length} stories.`);
  return { storyMap, migratedStories: storyEntries.length };
}

async function updateUpdates(storyMap) {
  const files = await fs.readdir(UPDATES_DIR);
  let updated = 0;

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(UPDATES_DIR, file);
    const parsed = matter(await fs.readFile(filePath, 'utf-8'));
    const data = { ...parsed.data };
    const key = `${data.idea_number}:${data.story_number}`;
    const mappedStoryNumber = storyMap.get(key);

    if (mappedStoryNumber === undefined) {
      console.warn(`No migrated story found for update ${file}. Skipping.`);
      continue;
    }

    data.story_number = mappedStoryNumber;
    data.notation = `${data.sprint_id}.${data.idea_number}.${mappedStoryNumber}`;

    const frontMatter = matter.stringify(parsed.content, data);
    await fs.writeFile(filePath, frontMatter, 'utf-8');
    updated += 1;
  }

  console.log(`Updated ${updated} updates.`);
}

async function updateFigures(storyMap) {
  const files = await fs.readdir(FIGURES_DIR).catch(() => []);
  let updated = 0;

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(FIGURES_DIR, file);
    const parsed = matter(await fs.readFile(filePath, 'utf-8'));
    const data = { ...parsed.data };

    if (!Array.isArray(data.related_stories) || !data.related_stories.length) continue;

    let changed = false;
    const updatedReferences = data.related_stories.map((ref) => {
      const [ideaStr, storyStr] = String(ref).split('.');
      const ideaNumber = Number(ideaStr);
      const storyNumber = Number(storyStr);
      if (Number.isNaN(ideaNumber) || Number.isNaN(storyNumber)) {
        return ref;
      }

      const mapped = storyMap.get(`${ideaNumber}:${storyNumber}`);
      if (mapped === undefined) {
        console.warn(`No migrated story found for figure ${file} reference ${ref}.`);
        return ref;
      }
      if (mapped !== storyNumber) {
        changed = true;
      }
      return `${ideaNumber}.${mapped}`;
    });

    if (!changed) continue;

    data.related_stories = updatedReferences;
    const frontMatter = matter.stringify(parsed.content, data);
    await fs.writeFile(filePath, frontMatter, 'utf-8');
    updated += 1;
  }

  console.log(`Updated ${updated} figures.`);
}

async function runMigration() {
  const { storyMap, migratedStories } = await migrateStories();
  if (!migratedStories) {
    return;
  }

  await updateUpdates(storyMap);
  await updateFigures(storyMap);
  console.log('Migration complete.');
}

runMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});


