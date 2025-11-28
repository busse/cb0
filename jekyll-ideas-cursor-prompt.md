# Cursor Prompt: Jekyll Site with Ideas/Stories/Sprints Taxonomy

> **Usage**: Copy this entire prompt into Cursor to generate the Jekyll site structure.

---

## Prompt

Create a Jekyll site with a custom taxonomy system for tracking Ideas, Stories, and Sprints. Leave placeholder sections marked with `<!-- UI_SPEC_PLACEHOLDER -->` for future UI/design specifications.

---

## Deployment & Development Requirements

### Local Development
- Must work with standard `bundle exec jekyll serve` workflow
- Include a `Gemfile` with all dependencies
- Provide a `Makefile` or scripts for common tasks:
  - `make serve` - Local dev server with live reload
  - `make build` - Production build
  - `make new-idea` - Scaffold new idea
  - `make new-story IDEA=n` - Scaffold new story for idea n
  - `make new-sprint` - Scaffold next sprint
- Include `.ruby-version` file for version consistency
- Document any system dependencies in README

### Cloudflare Pages Deployment
- Must be fully compatible with Cloudflare Pages
- Include `_headers` file for proper caching/security headers
- Include `_redirects` file for any needed redirects
- Build command: `jekyll build`
- Build output directory: `_site`
- No plugins that require server-side execution (static output only)
- Include `cloudflare-pages.json` or document build settings:
  ```json
  {
    "build_command": "bundle exec jekyll build",
    "build_output_directory": "_site",
    "root_directory": "/",
    "environment_variables": {
      "JEKYLL_ENV": "production",
      "RUBY_VERSION": "3.2"
    }
  }
  ```
- Ensure all internal links work without trailing slashes OR configure consistent trailing slash behavior
- Include a `_headers` file:
  ```
  /*
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin

  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```

### Plugin Constraints
- Only use plugins compatible with static site generation
- Avoid plugins requiring Ruby runtime at request time
- Preferred plugins (Cloudflare-safe):
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-redirect-from
- Document any custom Liquid filters as includes (not Ruby plugins) for portability

---

## Core Taxonomy & Notation System

This site uses a zero-based array notation system:

### Standalone Notation
- `i{n}` = Idea n (e.g., i5 = Idea 5)
- `s{n}` = Story n (e.g., s56 = Story 56)

### Combined Notation (omit prefixes)
- `{idea}.{story}` = Idea + Story (e.g., 5.56 = Idea 5, Story 56)
- `{sprint}.{idea}.{story}` = Sprint + Idea + Story (e.g., 2609.5.56)

### Sprint Format
- YYSS where YY = year, SS = sprint number (1-26)
- Each sprint = 2 weeks
- Example: 2603 = Year 2026, Sprint 3 (weeks 5-6)

### Special Cases
- i0 = The site itself (meta-idea)
- s0 for any idea = The intent/purpose behind developing that idea

---

## Jekyll Collections Structure

Create these collections in `_config.yml`:

```yaml
collections:
  ideas:
    output: true
    permalink: /i/:slug/
  stories:
    output: true
    permalink: /s/:path/
  sprints:
    output: true
    permalink: /sprint/:name/
  updates:
    output: true
    permalink: /updates/:path/

defaults:
  - scope:
      path: ""
      type: "ideas"
    values:
      layout: "idea"
  - scope:
      path: ""
      type: "stories"
    values:
      layout: "story"
  - scope:
      path: ""
      type: "sprints"
    values:
      layout: "sprint"
  - scope:
      path: ""
      type: "updates"
    values:
      layout: "update"
```

---

## Directory Structure

```
.
├── _config.yml
├── _headers                 # Cloudflare headers
├── _redirects               # Cloudflare redirects
├── Gemfile
├── Gemfile.lock
├── Makefile
├── README.md
├── .ruby-version
│
├── _data/
│   ├── notation.yml         # Notation format reference
│   └── sprint_calendar.yml  # Sprint-to-weeks mapping
│
├── _ideas/
│   ├── 0.md                 # i0 - The site itself
│   ├── 1.md                 # i1
│   └── ...
│
├── _stories/
│   ├── 0/                   # Stories for i0
│   │   ├── 0.md             # i0.s0 - Intent of the site
│   │   └── 1.md             # i0.s1
│   ├── 1/                   # Stories for i1
│   │   ├── 0.md             # i1.s0 - Intent of idea 1
│   │   └── ...
│   └── ...
│
├── _sprints/
│   ├── 2601.md
│   ├── 2602.md
│   └── ...
│
├── _updates/
│   ├── 2604-34-4.md         # 2604.34.4
│   ├── 2604-34-7.md         # 2604.34.7
│   └── 2605-4-23.md         # 2605.4.23
│
├── _posts/                  # Traditional blog (minimized in UI)
│
├── _layouts/
│   ├── default.html
│   ├── idea.html
│   ├── story.html
│   ├── sprint.html
│   ├── update.html
│   ├── ideas-index.html
│   ├── sprint-board.html
│   └── post.html
│
├── _includes/
│   ├── notation-badge.html  # Renders notation as styled badge
│   ├── idea-card.html       # Card component for idea
│   ├── story-card.html      # Card component for story
│   ├── sprint-selector.html # Dropdown for sprints
│   ├── head.html
│   ├── header.html
│   └── footer.html
│
├── assets/
│   ├── css/
│   │   └── main.scss
│   ├── js/
│   │   └── main.js
│   └── images/
│
└── pages/
    ├── index.html           # Homepage
    ├── ideas.html           # Ideas array index
    ├── sprints.html         # Sprint calendar
    ├── blog.html            # Posts index (minimized)
    └── glossary.md          # Notation reference
```

---

## Front Matter Templates

### Idea (`_ideas/5.md`)
```yaml
---
layout: idea
idea_number: 5
title: "Idea Title"
description: "Brief description"
status: active  # active | completed | archived | planned
created: 2025-01-15
tags: []
---

Idea content goes here...
```

### Story (`_stories/5/56.md`)
```yaml
---
layout: story
idea_number: 5
story_number: 56
title: "Story Title"
description: "As a [user], I want [goal] so that [benefit]"
status: backlog  # backlog | planned | in-progress | done
priority: medium  # low | medium | high | critical
created: 2025-01-15
assigned_sprint: 2609  # Optional - links to sprint
---

Story details and acceptance criteria...
```

### Sprint (`_sprints/2609.md`)
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

Sprint notes and retrospective...
```

### Update (`_updates/2609-5-56.md`)
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

---

## Required Includes & Layouts

### Layouts

1. **`_layouts/idea.html`** - Single idea view with linked stories
2. **`_layouts/story.html`** - Single story view with updates timeline
3. **`_layouts/sprint.html`** - Sprint view with assigned stories grouped by idea
4. **`_layouts/update.html`** - Update entry view
5. **`_layouts/ideas-index.html`** - Array view of all ideas
6. **`_layouts/sprint-board.html`** - Kanban-style sprint board

### Includes

1. **`_includes/notation-badge.html`** - Renders notation (e.g., "2609.5.56") as styled badge
   - Parameters: `sprint`, `idea`, `story` (all optional)
   - Auto-formats based on which params provided
   
2. **`_includes/idea-card.html`** - Card component for idea in array view
   - Shows: idea number, title, status, story count
   
3. **`_includes/story-card.html`** - Card component for story
   - Shows: notation, title, status, priority, assigned sprint
   
4. **`_includes/sprint-selector.html`** - Dropdown/picker for sprints
   - Shows current sprint highlighted
   - Links to sprint pages

---

## Helper Data Files

### `_data/notation.yml`
```yaml
formats:
  idea: "i{n}"
  story: "s{n}"
  idea_story: "{idea}.{story}"
  full: "{sprint}.{idea}.{story}"

examples:
  - notation: "i5"
    meaning: "Idea 5"
  - notation: "s56"
    meaning: "Story 56"
  - notation: "5.56"
    meaning: "Idea 5, Story 56"
  - notation: "2609.5.56"
    meaning: "Sprint 2609, Idea 5, Story 56"
```

### `_data/sprint_calendar.yml`
```yaml
# Sprint number to week mapping
sprints:
  1: { weeks: [1, 2] }
  2: { weeks: [3, 4] }
  3: { weeks: [5, 6] }
  4: { weeks: [7, 8] }
  5: { weeks: [9, 10] }
  6: { weeks: [11, 12] }
  7: { weeks: [13, 14] }
  8: { weeks: [15, 16] }
  9: { weeks: [17, 18] }
  10: { weeks: [19, 20] }
  11: { weeks: [21, 22] }
  12: { weeks: [23, 24] }
  13: { weeks: [25, 26] }
  14: { weeks: [27, 28] }
  15: { weeks: [29, 30] }
  16: { weeks: [31, 32] }
  17: { weeks: [33, 34] }
  18: { weeks: [35, 36] }
  19: { weeks: [37, 38] }
  20: { weeks: [39, 40] }
  21: { weeks: [41, 42] }
  22: { weeks: [43, 44] }
  23: { weeks: [45, 46] }
  24: { weeks: [47, 48] }
  25: { weeks: [49, 50] }
  26: { weeks: [51, 52] }
```

---

## Liquid Helpers (as Includes)

Since we need Cloudflare compatibility, implement these as Liquid includes rather than Ruby plugins:

### `_includes/helpers/notation-format.html`
```liquid
{%- comment -%}
  Usage: {% include helpers/notation-format.html sprint=2609 idea=5 story=56 %}
  Output: 2609.5.56 (or appropriate shorter form)
{%- endcomment -%}
{%- if include.sprint and include.idea and include.story -%}
  {{ include.sprint }}.{{ include.idea }}.{{ include.story }}
{%- elsif include.idea and include.story -%}
  {{ include.idea }}.{{ include.story }}
{%- elsif include.idea -%}
  i{{ include.idea }}
{%- elsif include.story -%}
  s{{ include.story }}
{%- endif -%}
```

### `_includes/helpers/stories-for-idea.html`
```liquid
{%- comment -%}
  Usage: {% include helpers/stories-for-idea.html idea_number=5 %}
  Sets: stories_list variable
{%- endcomment -%}
{%- assign stories_list = site.stories | where: "idea_number", include.idea_number | sort: "story_number" -%}
```

### `_includes/helpers/updates-for-sprint.html`
```liquid
{%- comment -%}
  Usage: {% include helpers/updates-for-sprint.html sprint_id=2609 %}
  Sets: sprint_updates variable
{%- endcomment -%}
{%- assign sprint_updates = site.updates | where: "sprint_id", include.sprint_id | sort: "date" -%}
```

---

## Key Pages to Generate

### 1. Homepage (`/`)
```
<!-- UI_SPEC_PLACEHOLDER: Homepage layout and featured content -->
<!-- Should show: current sprint, recent updates, featured ideas -->
```

### 2. Ideas Array Index (`/ideas/`)
```
<!-- UI_SPEC_PLACEHOLDER: Array visualization style -->
<!-- Should show: grid/list of ideas as i0, i1, i2... with status indicators -->
```

### 3. Individual Idea (`/i/{n}/`)
```
<!-- UI_SPEC_PLACEHOLDER: Idea detail page layout -->
<!-- Should show: idea content, linked stories as array, recent updates -->
```

### 4. Sprint Calendar (`/sprints/`)
```
<!-- UI_SPEC_PLACEHOLDER: Sprint visualization -->
<!-- Should show: timeline or calendar view of sprints with status -->
```

### 5. Individual Sprint Board (`/sprint/{YYSS}/`)
```
<!-- UI_SPEC_PLACEHOLDER: Sprint board layout -->
<!-- Should show: kanban columns (backlog/in-progress/done), stories grouped by idea -->
```

### 6. Blog Index (`/blog/`)
```
<!-- UI_SPEC_PLACEHOLDER: Minimal blog integration -->
<!-- Should be de-emphasized, simple list view -->
```

### 7. Glossary Page (`/glossary/`)
Reference page explaining the notation system.

---

## Glossary Page Content

The glossary page must explain:

| Notation | Meaning |
|----------|---------|
| i5 | Idea 5 |
| s56 | Story 56 |
| 5.56 | Idea 5, Story 56 |
| 2609.5.56 | Sprint 2609, Idea 5, Story 56 |

Additional explanations:
- **i0** is always the site itself (the meta-idea)
- **s0** is always the intent/purpose behind its parent idea
- **Sprint YYSS**: YY = 2-digit year, SS = sprint number (01-26)
- Each sprint covers 2 calendar weeks

---

## Seed Content Requirements

Create the following seed content for testing:

1. **i0** - "This Site" - The meta-idea representing the site itself
2. **i0.s0** - "Site Intent" - Why this site exists
3. **i0.s1** - "Core Taxonomy" - Implement the notation system
4. **i1** - A sample idea
5. **i1.s0** - Intent for idea 1
6. **i1.s1** - A sample story for idea 1
7. **Sprint 2601** - First sprint of 2026
8. **Update 2601.1.1** - Sample update linking sprint to story

---

## Gemfile

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-redirect-from", "~> 0.16"
end

# Development
gem "webrick", "~> 1.8"  # Required for Ruby 3+
```

---

## Makefile

```makefile
.PHONY: serve build clean new-idea new-story new-sprint

serve:
	bundle exec jekyll serve --livereload --drafts

build:
	JEKYLL_ENV=production bundle exec jekyll build

clean:
	bundle exec jekyll clean

install:
	bundle install

new-idea:
	@read -p "Idea number: " num; \
	echo "---\nlayout: idea\nidea_number: $$num\ntitle: \"\"\ndescription: \"\"\nstatus: planned\ncreated: $$(date +%Y-%m-%d)\ntags: []\n---\n" > _ideas/$$num.md; \
	mkdir -p _stories/$$num; \
	echo "Created _ideas/$$num.md and _stories/$$num/"

new-story:
	@read -p "Idea number: " idea; \
	read -p "Story number: " story; \
	echo "---\nlayout: story\nidea_number: $$idea\nstory_number: $$story\ntitle: \"\"\ndescription: \"\"\nstatus: backlog\npriority: medium\ncreated: $$(date +%Y-%m-%d)\n---\n" > _stories/$$idea/$$story.md; \
	echo "Created _stories/$$idea/$$story.md"

new-sprint:
	@read -p "Sprint ID (YYSS): " id; \
	echo "---\nlayout: sprint\nsprint_id: $$id\nyear: 20$${id:0:2}\nsprint_number: $${id:2:2}\nstatus: planned\ngoals: []\n---\n" > _sprints/$$id.md; \
	echo "Created _sprints/$$id.md"
```

---

## README.md Sections Required

1. **Overview** - What this site is and the taxonomy system
2. **Local Development** - How to run locally
3. **Deployment** - Cloudflare Pages setup instructions
4. **Content Management** - How to add ideas, stories, sprints, updates
5. **Notation Reference** - Quick reference for the taxonomy
6. **Contributing** - How to contribute (if applicable)

---

## Technical Requirements Summary

- Jekyll 4.x
- Ruby 3.x compatible
- Cloudflare Pages compatible (static output only)
- No server-side plugins
- All custom logic via Liquid includes
- Mobile-responsive (details in future UI spec)
- Semantic HTML5
- Accessible (WCAG 2.1 AA minimum)
