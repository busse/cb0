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
  Note,
  IdeaRecord,
  StoryRecord,
  SprintRecord,
  UpdateRecord,
  FigureRecord,
  NoteRecord,
  StoryPriority,
  StoryStatus,
} from './types';
import { slugify } from './strings';

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

type RawStoryFrontMatter = Partial<Story> & {
  idea_number?: number;
  assigned_sprint?: string;
};

export const PATHS = {
  ideas: path.join(CONTENT_DIR, '_ideas'),
  stories: path.join(CONTENT_DIR, '_stories'),
  sprints: path.join(CONTENT_DIR, '_sprints'),
  updates: path.join(CONTENT_DIR, '_updates'),
  figures: path.join(CONTENT_DIR, '_figures'),
  notes: path.join(CONTENT_DIR, '_posts'),
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
    const data = normalizeIdeaData(parsed.data as Idea);
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
  const entries = await safeReaddir(PATHS.stories);

  for (const entry of entries) {
    const entryPath = path.join(PATHS.stories, entry);
    const stat = await fs.stat(entryPath).catch(() => undefined);
    if (!stat) continue;

    if (stat.isDirectory()) {
      // Legacy structure: _stories/{idea_number}/{story_number}.md
      const storyFiles = await fs.readdir(entryPath);
      for (const file of storyFiles) {
        if (!file.endsWith('.md')) continue;
        const filePath = path.join(entryPath, file);
        stories.push(normalizeStoryRecord(matter(await fs.readFile(filePath, 'utf-8'))));
      }
      continue;
    }

    if (!entry.endsWith('.md')) continue;
    stories.push(normalizeStoryRecord(matter(await fs.readFile(entryPath, 'utf-8'))));
  }

  return stories.sort((a, b) => a.story_number - b.story_number);
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
    const data = normalizeSprintData(parsed.data as Sprint);
    sprints.push({
      ...data,
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
    const data = normalizeUpdateData(parsed.data as Update);
    updates.push({
      ...data,
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
    const data = normalizeFigureData(parsed.data as Figure);
    figures.push({
      ...data,
      body: parsed.content?.trim() ?? '',
    });
  }

  return figures.sort((a, b) => a.figure_number - b.figure_number);
}

/**
 * Read all notes (blog posts)
 */
export async function readNotes(): Promise<NoteRecord[]> {
  const files = await safeReaddir(PATHS.notes);
  const notes: NoteRecord[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(PATHS.notes, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parsed.data as Note;
    const dateFromFile = extractDateFromFilename(file);
    const slugFromFile = extractSlugFromFilename(file);
    notes.push({
      layout: data.layout ?? 'post',
      title: data.title ?? '',
      date: data.date ?? dateFromFile,
      author: data.author,
      tags: data.tags,
      excerpt: data.excerpt,
      slug: data.slug ?? slugFromFile,
      body: parsed.content?.trim() ?? '',
      filename: file,
      related_ideas: normalizeNumberArray(data.related_ideas),
      related_stories: normalizeNumberArray(data.related_stories),
      related_sprints: normalizeStringArray(data.related_sprints),
      related_figures: normalizeNumberArray(data.related_figures),
      related_updates: normalizeStringArray(data.related_updates),
    });
  }

  return notes.sort((a, b) => b.date.localeCompare(a.date));
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

function normalizeNumberArray(value: unknown): number[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const values = Array.isArray(value) ? value : [value];
  const numbers = values
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
  return numbers.length ? numbers : undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const values = Array.isArray(value) ? value : [value];
  const strings = values
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0);
  return strings.length ? strings : undefined;
}

function normalizeStoryRecord(parsed: matter.GrayMatterFile<string>): StoryRecord {
  const data = parsed.data as RawStoryFrontMatter;
  const relatedIdeas =
    normalizeNumberArray(data.related_ideas) ??
    (data.idea_number !== undefined ? [Number(data.idea_number)] : undefined) ??
    [];
  const relatedSprints =
    normalizeStringArray(data.related_sprints) ??
    (data.assigned_sprint ? [String(data.assigned_sprint)] : undefined);
  const relatedNotes = normalizeStringArray(data.related_notes);
  const relatedFigures = normalizeNumberArray(data.related_figures);
  const relatedUpdates = normalizeStringArray(data.related_updates);

  const normalized: Story = {
    layout: 'story',
    story_number: Number(data.story_number),
    title: data.title ?? '',
    description: data.description ?? '',
    status: (data.status as StoryStatus) ?? 'backlog',
    priority: (data.priority as StoryPriority) ?? 'medium',
    created: data.created ?? '',
    related_ideas: relatedIdeas,
    related_sprints: relatedSprints,
    related_notes: relatedNotes,
    related_figures: relatedFigures,
    related_updates: relatedUpdates,
  };

  return {
    ...normalized,
    body: parsed.content?.trim() ?? '',
  };
}

function normalizeIdeaData(data: Idea): Idea {
  return {
    ...data,
    related_stories: normalizeNumberArray(data.related_stories),
    related_sprints: normalizeStringArray(data.related_sprints),
    related_notes: normalizeStringArray(data.related_notes),
    related_figures: normalizeNumberArray(data.related_figures),
    related_updates: normalizeStringArray(data.related_updates),
  };
}

function normalizeSprintData(data: Sprint): Sprint {
  return {
    ...data,
    sprint_id: String(data.sprint_id),
    related_ideas: normalizeNumberArray(data.related_ideas),
    related_stories: normalizeNumberArray(data.related_stories),
    related_notes: normalizeStringArray(data.related_notes),
    related_figures: normalizeNumberArray(data.related_figures),
    related_updates: normalizeStringArray(data.related_updates),
  };
}

function normalizeUpdateData(data: Update): Update {
  return {
    ...data,
    sprint_id: String(data.sprint_id),
    related_ideas: normalizeNumberArray(data.related_ideas),
    related_stories: normalizeNumberArray(data.related_stories),
    related_figures: normalizeNumberArray(data.related_figures),
    related_notes: normalizeStringArray(data.related_notes),
    related_sprints: normalizeStringArray(data.related_sprints),
  };
}

function normalizeFigureData(data: Figure): Figure {
  return {
    ...data,
    related_ideas: normalizeNumberArray(data.related_ideas),
    related_stories: normalizeStringArray(data.related_stories),
    related_sprints: normalizeStringArray(data.related_sprints),
    related_notes: normalizeStringArray(data.related_notes),
    related_updates: normalizeStringArray(data.related_updates),
  };
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
  await fs.mkdir(PATHS.stories, { recursive: true });
  const filePath = path.join(PATHS.stories, `${story.story_number}.md`);
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
 * Write note file (create or update)
 */
export async function writeNote(notePayload: Note & { filename?: string }, content: string): Promise<string> {
  await fs.mkdir(PATHS.notes, { recursive: true });
  const { filename: existingFilename, ...frontMatterNote } = notePayload;
  const normalizedDate = normalizeDate(frontMatterNote.date);
  const resolvedSlug = frontMatterNote.slug?.trim() || slugify(frontMatterNote.title || 'note');
  const filename = `${normalizedDate}-${resolvedSlug}.md`;
  const filePath = path.join(PATHS.notes, filename);

  const cleaned = removeUndefined({
    ...frontMatterNote,
    layout: frontMatterNote.layout ?? 'post',
    date: normalizedDate,
    slug: resolvedSlug,
  });
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');

  if (existingFilename && existingFilename !== filename) {
    await fs.unlink(path.join(PATHS.notes, existingFilename)).catch(() => undefined);
  }

  return filename;
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
export async function deleteStory(storyNumber: number): Promise<void> {
  const filePath = path.join(PATHS.stories, `${storyNumber}.md`);
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
 * Delete note file
 */
export async function deleteNote(filename: string): Promise<void> {
  const filePath = path.join(PATHS.notes, filename);
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

function extractDateFromFilename(filename: string): string {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  return match ? match[1] : new Date().toISOString().slice(0, 10);
}

function extractSlugFromFilename(filename: string): string {
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

function normalizeDate(dateValue?: string): string {
  if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  return new Date().toISOString().slice(0, 10);
}


