# Ideas Array - Jekyll Taxonomy System

A systematic approach to tracking **Ideas**, **Stories**, and **Sprints** using a zero-based array notation system.

## Overview

This Jekyll site implements a custom taxonomy for project management:

- **Ideas** (`i{n}`) - High-level concepts or projects
- **Stories** (`{idea}.{story}`) - Specific tasks within ideas
- **Sprints** (`{YYSS}`) - Two-week planning cycles
- **Updates** (`{sprint}.{idea}.{story}`) - Progress tracking

## Notation System

| Notation | Meaning | Example |
|----------|---------|---------|
| `i5` | Idea 5 | High-level project |
| `s56` | Story 56 | Specific task |
| `5.56` | Idea 5, Story 56 | Story within idea |
| `2609.5.56` | Sprint 2609, Idea 5, Story 56 | Full reference |

### Sprint Format: YYSS
- **YY** = 2-digit year (26 = 2026)
- **SS** = Sprint number 01-26
- Each sprint = **2 weeks**

**Examples:**
- `2601` = Year 2026, Sprint 1 (weeks 1-2)
- `2609` = Year 2026, Sprint 9 (weeks 17-18)

### Special Cases
- **i0** = The site itself (meta-idea)
- **s0** = Intent/purpose of any idea

## Local Development

### Prerequisites
- Ruby 3.2+
- Bundler
- Node.js 18+ (for Playwright MCP support)

### Setup

```bash
# Install Ruby dependencies
make install

# Install Node.js dependencies (for Playwright MCP)
npm install

# Start development server
make serve
```

Visit `http://localhost:4000` to view the site.

### Playwright MCP Setup

This project includes Playwright MCP for browser automation in Cursor. See [`.cursor/MCP_SETUP.md`](.cursor/MCP_SETUP.md) for detailed configuration instructions.

Quick setup:
1. Open Cursor Settings → MCP → Add new MCP Server
2. Configure with command: `npm`, args: `run`, `mcp:playwright`
3. Restart Cursor

### Available Commands

```bash
make help          # Show all available commands
make serve         # Start dev server with live reload
make build         # Production build
make clean         # Clean build artifacts

make new-idea      # Create a new idea
make new-story     # Create a new story
make new-sprint    # Create a new sprint
```

## Deployment

### Cloudflare Pages

This site is optimized for Cloudflare Pages deployment.

**Build Settings:**
- Build command: `bundle exec jekyll build`
- Build output directory: `_site`
- Root directory: `/`
- Environment variables:
  - `JEKYLL_ENV=production`
  - `RUBY_VERSION=3.2`

### Required Files
- `_headers` - Security and caching headers
- `_redirects` - URL redirects (optional)

### Compatible Plugins
Only static-compatible plugins are used:
- jekyll-feed
- jekyll-sitemap
- jekyll-seo-tag
- jekyll-redirect-from

No server-side Ruby execution required.

## Electron CMS App

This repository includes an Electron desktop application for managing Ideas, Stories, and Sprints with a graphical interface.

### Setup

```bash
# Install dependencies (includes Electron workspace)
npm install
```

### Running the CMS

```bash
# Development mode
npm run electron:dev

# Build distributable
npm run electron:dist
```

See [`electron/README.md`](electron/README.md) for detailed documentation.

## Content Management

### Creating Ideas (Manual)

```bash
make new-idea
# Enter idea number when prompted
# Edit _ideas/{n}.md to add details
```

**Front Matter:**
```yaml
---
layout: idea
idea_number: 5
title: "Your Idea Title"
description: "Brief description"
status: planned  # planned | active | completed | archived
created: 2025-11-28
tags: [tag1, tag2]
---
```

### Creating Stories

```bash
make new-story
# Enter idea number and story number when prompted
# Edit _stories/{idea}/{story}.md to add details
```

**Front Matter:**
```yaml
---
layout: story
idea_number: 5
story_number: 56
title: "Story Title"
description: "As a [user], I want [goal] so that [benefit]"
status: backlog  # backlog | planned | in-progress | done
priority: medium  # low | medium | high | critical
created: 2025-11-28
assigned_sprint: 2609  # Optional: YYSS format
---
```

### Creating Sprints

```bash
make new-sprint
# Enter sprint ID in YYSS format when prompted
# Edit _sprints/{YYSS}.md to add dates and goals
```

**Front Matter:**
```yaml
---
layout: sprint
sprint_id: 2609
year: 2026
sprint_number: 9
start_date: 2026-04-20
end_date: 2026-05-03
status: planned  # planned | active | completed
goals:
  - "Goal 1"
  - "Goal 2"
---
```

### Creating Updates

Manually create files in `_updates/` using the format `{sprint}-{idea}-{story}.md`:

```yaml
---
layout: update
sprint_id: 2609
idea_number: 5
story_number: 56
notation: "2609.5.56"
date: 2026-04-22
type: progress  # progress | completion | blocker | note
---

Update content...
```

## Directory Structure

```
.
├── _config.yml              # Jekyll configuration
├── _headers                 # Cloudflare headers
├── _redirects               # Cloudflare redirects
├── Gemfile                  # Ruby dependencies
├── Makefile                 # Build commands
│
├── _data/
│   ├── notation.yml         # Notation reference
│   └── sprint_calendar.yml  # Sprint-to-weeks mapping
│
├── _ideas/                  # Idea collection
│   ├── 0.md                 # i0 - The site itself
│   └── 1.md                 # i1 - Sample idea
│
├── _stories/                # Story collection
│   ├── 0/                   # Stories for i0
│   │   ├── 0.md             # i0.s0 - Site intent
│   │   └── 1.md             # i0.s1
│   └── 1/                   # Stories for i1
│       ├── 0.md             # i1.s0 - Idea 1 intent
│       └── 1.md             # i1.s1
│
├── _sprints/                # Sprint collection
│   └── 2601.md              # Sprint 2601
│
├── _updates/                # Update collection
│   └── 2601-0-1.md          # Update 2601.0.1
│
├── _layouts/                # Page templates
│   ├── default.html
│   ├── idea.html
│   ├── story.html
│   ├── sprint.html
│   ├── update.html
│   └── post.html
│
├── _includes/               # Reusable components
│   ├── helpers/             # Liquid helpers
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   ├── notation-badge.html
│   ├── idea-card.html
│   ├── story-card.html
│   └── sprint-card.html
│
├── assets/
│   ├── css/main.scss        # Styles (placeholder for UI spec)
│   └── js/main.js           # JavaScript (placeholder for UI spec)
│
├── pages/
│   ├── ideas.html           # Ideas index
│   ├── sprints.html         # Sprints calendar
│   ├── blog.html            # Blog posts
│   └── glossary.md          # Notation reference
│
└── index.html               # Homepage
```

## Technical Implementation

- **Jekyll 4.3+** with Ruby 3.2
- **Pure Liquid templates** (no custom Ruby plugins)
- **Cloudflare Pages compatible** (static output only)
- **Semantic HTML5** with accessibility in mind
- **Responsive design** (mobile-first approach)

## Design System

UI placeholders are marked with `<!-- UI_SPEC_PLACEHOLDER -->` for future design implementation. The design will follow Swiss wayfinding principles:

- Clear hierarchy through scale/weight
- Dense information display
- Functional color (semantic, not decorative)
- Systematic patterns
- Minimal border radius (≤4px)
- Helvetica Neue typography

See `.cursor/rules/ui-design.mdc` for full specifications.

## Navigation

- **[Homepage](/)** - Current sprint, recent updates, active ideas
- **[Ideas](/ideas/)** - Browse all ideas
- **[Sprints](/sprints/)** - View sprint calendar
- **[Glossary](/glossary/)** - Notation reference
- **[Blog](/blog/)** - Traditional blog posts

## Contributing

1. Create ideas and stories following the taxonomy
2. Assign stories to sprints for planning
3. Add updates as work progresses
4. Follow notation conventions consistently

## License

[Specify your license here]

## Acknowledgments

Built with Jekyll and deployed on Cloudflare Pages.
Inspired by zero-based array indexing and systematic notation.
