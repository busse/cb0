# Ideas Taxonomy CMS - Electron App

A desktop application for managing Ideas, Stories, and Sprints in the Jekyll taxonomy system.

## Features

- **Interactive UI** – Tabbed dashboard with rich cards for Ideas, Stories, Sprints, and Updates
- **Modal Forms** – Guided create/edit flows with smart defaults, helpers, and validation
- **Live Validation** – Unique numbering, sprint format checks, relationship safeguards, and notation previews
- **Toast + Inline Feedback** – Non-blocking success/error messages plus inline banner errors
- **Type-Safe IPC** – Shared TypeScript types between renderer, preload, and main processes
- **Content Awareness** – Body (Markdown) editing alongside front matter for every document

## Using the CMS

1. **Launch** via `npm run electron:dev` (or `npm run electron:dist` for packaged builds).
2. **Navigate Tabs** – Ideas, Stories, Sprints, and Updates each provide creation shortcuts plus inline actions.
3. **Create / Edit** – Clicking “New …” or “Edit” opens a modal with:
   - Auto-generated idea/story numbers (with overrides)
   - Sprint + story selectors with dependent dropdowns
   - Markdown body field for the content section beneath front matter
4. **Delete** – Inline Delete buttons trigger confirmation prompts before removing files.
5. **Refresh** – Each tab includes a refresh action to re-read files after manual edits.

> All operations read/write directly against the `_ideas`, `_stories`, `_sprints`, and `_updates` directories; every change is immediately reflected in the Jekyll repo.

## Development

### Prerequisites

- Node.js 18+
- npm (comes with Node.js)

### Setup

```bash
# Install dependencies (from root)
npm install

# Or install just Electron workspace
cd electron
npm install
```

### Running in Development

```bash
# From root directory
npm run electron:dev

# Or from electron directory
npm run dev
```

This will:
1. Start the Vite dev server for the renderer (http://localhost:5173)
2. Watch and compile the main process TypeScript
3. Launch Electron with hot reload

### Building

```bash
# Build for development
npm run electron:build

# Build distributable
npm run electron:dist
```

### Testing

```bash
# Run the full Playwright Electron suite
npm run test:electron

# From the electron workspace
cd electron
npm run test:electron
```

- The test script compiles the main + preload bundles, launches the dev web server defined in `playwright.config.ts`, and executes the Playwright specs in `tests/playwright-mcp`.
- Use `npm run test:electron:ui` or `npm run test:electron:debug` (either from the repo root or inside `electron/`) for interactive debugging modes.

## Architecture

### Directory Structure

```
electron/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point
│   │   └── preload.ts  # Preload script (bridge)
│   ├── renderer/       # UI (HTML/CSS/JS)
│   │   ├── index.html
│   │   └── main.ts
│   └── shared/         # Shared utilities
│       ├── types.ts    # TypeScript types
│       ├── validation.ts  # Validation logic
│       └── file-utils.ts  # File I/O
├── out/                # Compiled main process
├── renderer-dist/       # Built renderer
└── dist/               # Distribution builds
```

### Key Components

1. **Main Process** (`src/main/index.ts`)
   - Handles file I/O operations
   - Validates data before writing
   - Exposes IPC handlers for renderer

2. **Renderer** (`src/renderer/`)
   - UI built with vanilla TypeScript
   - Communicates with main process via IPC
   - Uses preload script for secure API access

3. **Shared Utilities** (`src/shared/`)
   - Type definitions for all taxonomy entities
   - Validation functions
   - File reading/writing utilities
   - Notation formatting helpers

## API

The renderer communicates with the main process through `window.electronAPI`:

### Read Operations
- `readIdeas()` - Get all ideas
- `readStories()` - Get all stories
- `readSprints()` - Get all sprints
- `readUpdates()` - Get all updates

### Write Operations
- `writeIdea(idea, content)` - Create/update idea
- `writeStory(story, content)` - Create/update story
- `writeSprint(sprint, content)` - Create/update sprint
- `writeUpdate(update, content)` - Create/update update

### Delete Operations
- `deleteIdea(ideaNumber)` - Delete idea
- `deleteStory(ideaNumber, storyNumber)` - Delete story
- `deleteSprint(sprintId)` - Delete sprint
- `deleteUpdate(sprintId, ideaNumber, storyNumber)` - Delete update

### Utilities
- `getNextIdeaNumber()` - Get next available idea number
- `getNextStoryNumber(ideaNumber)` - Get next available story number for an idea

## File Paths

The app reads/writes files relative to the Jekyll site root:
- Ideas: `_ideas/{n}.md`
- Stories: `_stories/{idea}/{story}.md`
- Sprints: `_sprints/{YYSS}.md`
- Updates: `_updates/{sprint}-{idea}-{story}.md`

## Validation

All write operations validate:
- Required fields
- Data types and formats
- Unique constraints (idea numbers, story numbers within ideas)
- Relationships (stories must reference existing ideas)
- Sprint ID format (YYSS)

## Future Enhancements

- [ ] Inline diff preview + git commit helpers
- [ ] Advanced filtering, search, and tagging tools
- [ ] Relationship visualization (Idea ⇄ Story ⇄ Sprint ⇄ Update)
- [ ] Bulk operations & multi-select editing
- [ ] Markdown preview with Swiss design system styles
- [ ] Optional cloud sync / multi-user awareness

