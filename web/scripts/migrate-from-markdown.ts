/**
 * Migration script to import existing Markdown content into Supabase
 *
 * Usage:
 * 1. Set up your .env.local with Supabase credentials
 * 2. Run the schema.sql in your Supabase SQL Editor
 * 3. Run: npx ts-node scripts/migrate-from-markdown.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to the Jekyll content directories (relative to repo root)
const CONTENT_ROOT = path.join(__dirname, "../..");

interface MarkdownFile {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

function readMarkdownFiles(dir: string): MarkdownFile[] {
  const fullPath = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Directory not found: ${fullPath}`);
    return [];
  }

  const files = fs.readdirSync(fullPath).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const filePath = path.join(fullPath, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    return {
      path: file,
      frontmatter: data,
      content: content.trim(),
    };
  });
}

async function migrateIdeas() {
  console.log("\n📝 Migrating Ideas...");
  const files = readMarkdownFiles("_ideas");

  for (const file of files) {
    const fm = file.frontmatter;
    const { error } = await supabase.from("ideas").upsert(
      {
        idea_number: fm.idea_number as number,
        title: fm.title as string,
        description: fm.description as string,
        status: fm.status as string,
        created: fm.created as string,
        tags: (fm.tags as string[]) || [],
        body: file.content || null,
      },
      { onConflict: "idea_number" }
    );

    if (error) {
      console.error(`  ❌ Error migrating idea ${fm.idea_number}:`, error.message);
    } else {
      console.log(`  ✅ Migrated idea ${fm.idea_number}: ${fm.title}`);
    }
  }
}

async function migrateStories() {
  console.log("\n📖 Migrating Stories...");
  const files = readMarkdownFiles("_stories");

  for (const file of files) {
    const fm = file.frontmatter;
    const { error } = await supabase.from("stories").upsert(
      {
        story_number: fm.story_number as number,
        title: fm.title as string,
        description: fm.description as string,
        status: fm.status as string,
        priority: fm.priority as string,
        created: fm.created as string,
        body: file.content || null,
      },
      { onConflict: "story_number" }
    );

    if (error) {
      console.error(`  ❌ Error migrating story ${fm.story_number}:`, error.message);
    } else {
      console.log(`  ✅ Migrated story ${fm.story_number}: ${fm.title}`);
    }
  }
}

async function migrateSprints() {
  console.log("\n🏃 Migrating Sprints...");
  const files = readMarkdownFiles("_sprints");

  for (const file of files) {
    const fm = file.frontmatter;
    const { error } = await supabase.from("sprints").upsert(
      {
        sprint_id: fm.sprint_id as string,
        year: fm.year as number,
        sprint_number: fm.sprint_number as number,
        start_date: fm.start_date as string,
        end_date: fm.end_date as string,
        status: fm.status as string,
        goals: (fm.goals as string[]) || [],
        body: file.content || null,
      },
      { onConflict: "sprint_id" }
    );

    if (error) {
      console.error(`  ❌ Error migrating sprint ${fm.sprint_id}:`, error.message);
    } else {
      console.log(`  ✅ Migrated sprint ${fm.sprint_id}`);
    }
  }
}

async function migrateUpdates() {
  console.log("\n📊 Migrating Updates...");
  const files = readMarkdownFiles("_updates");

  for (const file of files) {
    const fm = file.frontmatter;
    const { error } = await supabase.from("updates").upsert(
      {
        sprint_id: fm.sprint_id as string,
        idea_number: fm.idea_number as number,
        story_number: fm.story_number as number,
        notation: fm.notation as string,
        date: fm.date as string,
        type: fm.type as string,
        body: file.content || null,
      },
      { onConflict: "sprint_id,idea_number,story_number" }
    );

    if (error) {
      console.error(`  ❌ Error migrating update ${fm.notation}:`, error.message);
    } else {
      console.log(`  ✅ Migrated update ${fm.notation}`);
    }
  }
}

async function migrateFigures() {
  console.log("\n🖼️  Migrating Figures...");
  const files = readMarkdownFiles("_figures");

  for (const file of files) {
    const fm = file.frontmatter;
    const { error } = await supabase.from("figures").upsert(
      {
        figure_number: fm.figure_number as number,
        title: fm.title as string,
        description: (fm.description as string) || null,
        image_path: fm.image_path as string,
        alt_text: (fm.alt_text as string) || null,
        created: fm.created as string,
        uploaded_date: (fm.uploaded_date as string) || null,
        file_type: (fm.file_type as string) || null,
        status: fm.status as string,
        tags: (fm.tags as string[]) || [],
        dimensions: (fm.dimensions as string) || null,
        file_size: (fm.file_size as string) || null,
        body: file.content || null,
      },
      { onConflict: "figure_number" }
    );

    if (error) {
      console.error(`  ❌ Error migrating figure ${fm.figure_number}:`, error.message);
    } else {
      console.log(`  ✅ Migrated figure ${fm.figure_number}: ${fm.title}`);
    }
  }
}

async function migrateMaterials() {
  console.log("\n📚 Migrating Materials...");
  const files = readMarkdownFiles("_materials");

  for (const file of files) {
    const fm = file.frontmatter;
    // Extract slug from filename (e.g., "2025-01-15-my-post.md" -> "my-post")
    const slug = fm.slug || file.path.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");

    const { error } = await supabase.from("materials").upsert(
      {
        title: fm.title as string,
        slug: slug as string,
        date: fm.date as string,
        author: (fm.author as string) || null,
        tags: (fm.tags as string[]) || [],
        excerpt: (fm.excerpt as string) || null,
        canonical_source_url: (fm.canonical_source_url as string) || null,
        body: file.content || null,
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`  ❌ Error migrating material ${slug}:`, error.message);
    } else {
      console.log(`  ✅ Migrated material: ${fm.title}`);
    }
  }
}

async function main() {
  console.log("🚀 Starting migration from Markdown to Supabase...\n");
  console.log(`Content root: ${CONTENT_ROOT}`);

  try {
    await migrateIdeas();
    await migrateStories();
    await migrateSprints();
    await migrateUpdates();
    await migrateFigures();
    await migrateMaterials();

    console.log("\n✨ Migration complete!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
