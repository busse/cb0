/**
 * File system utilities for reading/writing taxonomy files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { pathToFileURL } from 'url';
import matter from 'gray-matter';
import type {
  Idea,
  Story,
  Sprint,
  Update,
  Figure,
  IdeaRecord,
  StoryRecord,
  SprintRecord,
  UpdateRecord,
  FigureRecord,
} from './types';

// Get content directory relative to the Jekyll site root
// When compiled, shared code is in out/main/shared
// We need to go: out/main/shared -> out/main -> out -> electron -> repo root (4 levels up)
const getContentDir = () => {
  // Check if we're in compiled output
  if (__dirname.includes('out')) {
    // From electron/out/main/shared -> ../../../../ to repo root
    return path.resolve(__dirname, '../../../../');
  }
  // From electron/src/shared -> ../.. to repo root
  return path.resolve(__dirname, '../../..');
};

const CONTENT_DIR = getContentDir();

export const PATHS = {
  ideas: path.join(CONTENT_DIR, '_ideas'),
  stories: path.join(CONTENT_DIR, '_stories'),
  sprints: path.join(CONTENT_DIR, '_sprints'),
  updates: path.join(CONTENT_DIR, '_updates'),
  figures: path.join(CONTENT_DIR, '_figures'),
  figureImages: path.join(CONTENT_DIR, 'assets', 'figures'),
};

/**
 * Read all ideas
 */
export async function readIdeas(): Promise<IdeaRecord[]> {
  const files = await fs.readdir(PATHS.ideas);
  const ideas: IdeaRecord[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(PATHS.ideas, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parsed.data as Idea;
    ideas.push({
      ...data,
      body: parsed.content?.trim() ?? '',
    });
  }

  return ideas.sort((a, b) => a.idea_number - b.idea_number);
}

/**
 * Read all stories
 */
export async function readStories(): Promise<StoryRecord[]> {
  const stories: StoryRecord[] = [];
  const ideaDirs = await fs.readdir(PATHS.stories);

  for (const ideaDir of ideaDirs) {
    const ideaPath = path.join(PATHS.stories, ideaDir);
    const stat = await fs.stat(ideaPath);
    if (!stat.isDirectory()) continue;

    const storyFiles = await fs.readdir(ideaPath);
    for (const file of storyFiles) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(ideaPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const data = parsed.data as Story;
      stories.push({
        ...data,
        body: parsed.content?.trim() ?? '',
      });
    }
  }

  return stories.sort((a, b) => {
    if (a.idea_number !== b.idea_number) {
      return a.idea_number - b.idea_number;
    }
    return a.story_number - b.story_number;
  });
}

/**
 * Read all sprints
 */
export async function readSprints(): Promise<SprintRecord[]> {
  const files = await fs.readdir(PATHS.sprints);
  const sprints: SprintRecord[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(PATHS.sprints, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parsed.data as Sprint;
    sprints.push({
      ...data,
      sprint_id: String(data.sprint_id), // Ensure sprint_id is always a string
      body: parsed.content?.trim() ?? '',
    });
  }

  return sprints.sort((a, b) => String(a.sprint_id).localeCompare(String(b.sprint_id)));
}

/**
 * Read all updates
 */
export async function readUpdates(): Promise<UpdateRecord[]> {
  const files = await fs.readdir(PATHS.updates);
  const updates: UpdateRecord[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(PATHS.updates, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parsed.data as Update;
    updates.push({
      ...data,
      sprint_id: String(data.sprint_id), // Ensure sprint_id is always a string
      body: parsed.content?.trim() ?? '',
    });
  }

  return updates.sort((a, b) => {
    if (a.sprint_id !== b.sprint_id) {
      return String(a.sprint_id).localeCompare(String(b.sprint_id));
    }
    if (a.idea_number !== b.idea_number) {
      return a.idea_number - b.idea_number;
    }
    return a.story_number - b.story_number;
  });
}

/**
 * Read all figures
 */
export async function readFigures(): Promise<FigureRecord[]> {
  const files = await safeReaddir(PATHS.figures);
  const figures: FigureRecord[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(PATHS.figures, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parsed.data as Figure;
    figures.push({
      ...data,
      body: parsed.content?.trim() ?? '',
    });
  }

  return figures.sort((a, b) => a.figure_number - b.figure_number);
}

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true });
      return [];
    }
    throw error;
  }
}

/**
 * Remove undefined values from an object (YAML can't serialize undefined)
 */
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned = { ...obj };
  for (const key in cleaned) {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

/**
 * Write idea file
 */
export async function writeIdea(idea: Idea, content: string): Promise<void> {
  const filePath = path.join(PATHS.ideas, `${idea.idea_number}.md`);
  const cleaned = removeUndefined(idea);
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');
}

/**
 * Write story file
 */
export async function writeStory(story: Story, content: string): Promise<void> {
  const ideaDir = path.join(PATHS.stories, story.idea_number.toString());
  await fs.mkdir(ideaDir, { recursive: true });
  const filePath = path.join(ideaDir, `${story.story_number}.md`);
  const cleaned = removeUndefined(story);
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');
}

/**
 * Write sprint file
 */
export async function writeSprint(sprint: Sprint, content: string): Promise<void> {
  const filePath = path.join(PATHS.sprints, `${sprint.sprint_id}.md`);
  const cleaned = removeUndefined(sprint);
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');
}

/**
 * Write update file
 */
export async function writeUpdate(update: Update, content: string): Promise<void> {
  const filename = `${update.sprint_id}-${update.idea_number}-${update.story_number}.md`;
  const filePath = path.join(PATHS.updates, filename);
  const cleaned = removeUndefined(update);
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');
}

/**
 * Write figure file
 */
export async function writeFigure(figure: Figure, content: string): Promise<void> {
  await fs.mkdir(PATHS.figures, { recursive: true });
  const filePath = path.join(PATHS.figures, `${figure.figure_number}.md`);
  const cleaned = removeUndefined(figure);
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');
}

/**
 * Delete idea file
 */
export async function deleteIdea(ideaNumber: number): Promise<void> {
  const filePath = path.join(PATHS.ideas, `${ideaNumber}.md`);
  await fs.unlink(filePath);
}

/**
 * Delete story file
 */
export async function deleteStory(ideaNumber: number, storyNumber: number): Promise<void> {
  const filePath = path.join(PATHS.stories, ideaNumber.toString(), `${storyNumber}.md`);
  await fs.unlink(filePath);
}

/**
 * Delete sprint file
 */
export async function deleteSprint(sprintId: string): Promise<void> {
  const filePath = path.join(PATHS.sprints, `${sprintId}.md`);
  await fs.unlink(filePath);
}

/**
 * Delete update file
 */
export async function deleteUpdate(sprintId: string, ideaNumber: number, storyNumber: number): Promise<void> {
  const filename = `${sprintId}-${ideaNumber}-${storyNumber}.md`;
  const filePath = path.join(PATHS.updates, filename);
  await fs.unlink(filePath);
}

/**
 * Delete figure file
 */
export async function deleteFigure(figureNumber: number): Promise<void> {
  const filePath = path.join(PATHS.figures, `${figureNumber}.md`);
  await fs.unlink(filePath);
}

/**
 * Copy an image file into the figures assets directory
 */
export async function copyImageFile(
  sourcePath: string,
  figureNumber: number
): Promise<{
  relativePath: string;
  absolutePath: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
}> {
  const ext = path.extname(sourcePath) || '.png';
  const fileType = ext.replace('.', '').toLowerCase();
  const fileName = `fig_${figureNumber}${ext}`;
  await fs.mkdir(PATHS.figureImages, { recursive: true });
  const destinationPath = path.join(PATHS.figureImages, fileName);
  await fs.copyFile(sourcePath, destinationPath);
  const stats = await fs.stat(destinationPath);

  return {
    relativePath: `/assets/figures/${fileName}`,
    absolutePath: destinationPath,
    fileType,
    fileSize: formatFileSize(stats.size),
    fileUrl: pathToFileURL(destinationPath).href,
  };
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)}${units[index]}`;
}

