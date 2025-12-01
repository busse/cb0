# Cursor Prompt: UI Specification for Jekyll Ideas/Stories/Sprints Site

> **Usage**: Use this prompt alongside or after `jekyll-ideas-cursor-prompt.md` to implement the UI layer.
> 
> **Prerequisite**: The taxonomy and collection structure from the base prompt must be in place.

---

## Prompt

Implement the UI/UX layer for the Jekyll Ideas/Stories/Sprints site. This specification replaces all `<!-- UI_SPEC_PLACEHOLDER -->` markers from the base prompt.

---

## Design System: Swiss Wayfinding

### Design Philosophy

This site follows a **Swiss International Typographic Style** approach with specific influence from:

1. **German Road Signage** (Bundesautobahn system) - Clear hierarchy, high contrast, functional color coding
2. **Rudy Bauer Design Studio** - Particularly the Cologne Bonn Airport (CGN) wayfinding system
3. **Classic Swiss Design** - Grid systems, Helvetica, information density, minimal decoration

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Clarity** | Information hierarchy through scale, weight, and position—not decoration |
| **Density** | Maximum useful information per viewport; no excessive whitespace |
| **Systematic** | Consistent patterns; once learned, universally applied |
| **Functional Color** | Color communicates status/type, never decorative |
| **Wayfinding** | User always knows where they are and how to navigate |

---

## Typography

### Font Stack

```css
:root {
  /* Primary: Helvetica Neue or system fallbacks */
  --font-primary: 'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif;
  
  /* Monospace: For notation badges and code */
  --font-mono: 'SF Mono', 'Consolas', 'Liberation Mono', monospace;
  
  /* Base size - dense but readable */
  --font-size-base: 14px;
  --line-height-base: 1.4;
}
```

### Type Scale (Modular, ratio 1.25)

```css
:root {
  --text-xs: 0.64rem;    /* 9px - meta, timestamps */
  --text-sm: 0.8rem;     /* 11px - captions, secondary */
  --text-base: 1rem;     /* 14px - body */
  --text-md: 1.25rem;    /* 17.5px - card titles */
  --text-lg: 1.563rem;   /* 22px - section headers */
  --text-xl: 1.953rem;   /* 27px - page titles */
  --text-2xl: 2.441rem;  /* 34px - hero/primary */
  --text-3xl: 3.052rem;  /* 43px - display */
}
```

### Typography Rules

- **All caps** for: Navigation, status labels, section headers
- **Sentence case** for: Body text, descriptions, card content
- **Tabular numerals** for: All notation (i5, s23, 2609.5.56)
- **Letter-spacing**: +0.02em for all-caps text, 0 for body
- **No italics** except for `<cite>` elements
- **Bold (700)** for emphasis, **Medium (500)** for headings, **Regular (400)** for body

---

## Color System

### Functional Palette

Colors are **semantic only**—they communicate meaning, not aesthetics.

```css
:root {
  /* Base */
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-border: #E0E0E0;
  --color-border-strong: #CCCCCC;
  
  /* Status Colors (German signage influenced) */
  --color-status-active: #0066CC;      /* Blue - in progress, current */
  --color-status-planned: #666666;     /* Gray - future, pending */
  --color-status-complete: #2E7D32;    /* Green - done, shipped */
  --color-status-blocked: #C62828;     /* Red - blocker, critical */
  --color-status-archived: #9E9E9E;    /* Muted - archived, inactive */
  
  /* Accent - Wayfinding */
  --color-accent-primary: #FFCC00;     /* Yellow - CGN-style highlight */
  --color-accent-secondary: #0066CC;  /* Blue - links, interactive */
  
  /* Notation Badge */
  --color-notation-bg: #1A1A1A;
  --color-notation-text: #FFFFFF;
}
```

### Dark Mode (Optional)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #121212;
    --color-surface: #1E1E1E;
    --color-text-primary: #F5F5F5;
    --color-text-secondary: #A0A0A0;
    --color-border: #333333;
    --color-border-strong: #444444;
    --color-notation-bg: #FFCC00;
    --color-notation-text: #1A1A1A;
  }
}
```

---

## Grid System

### Base Grid

```css
:root {
  --grid-columns: 12;
  --grid-gutter: 16px;
  --grid-margin: 24px;
  
  /* Breakpoints */
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
}
```

### Container

```css
.container {
  max-width: 1536px;
  margin: 0 auto;
  padding: 0 var(--grid-margin);
}
```

---

## Page Layout Structure

### Primary Layout: 4/5 + 1/5 Header Region

```
┌─────────────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR (fixed, minimal height)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────┬─────────────────┐   │
│  │                                           │                 │   │
│  │  PRIMARY CONTENT AREA                     │  NOTES       │   │
│  │  (4/5 width)                              │  SIDEBAR        │   │
│  │                                           │  (1/5 width)    │   │
│  │  Static content from include file         │                 │   │
│  │  or page-specific hero content            │  Recent posts   │   │
│  │                                           │  condensed list │   │
│  │                                           │                 │   │
│  └───────────────────────────────────────────┴─────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CARD GRID AREA                                                     │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐               │
│  │  Card   │  Card   │  Card   │  Card   │  Card   │               │
│  │         │         │         │         │         │               │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘               │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐               │
│  │  Card   │  Card   │  Card   │  Card   │  Card   │               │
│  │         │         │         │         │         │               │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘               │
│  (5 columns, even width, repeating rows)                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout CSS

```css
/* Header Region */
.header-region {
  display: grid;
  grid-template-columns: 4fr 1fr;
  gap: var(--grid-gutter);
  padding: var(--grid-gutter) 0;
  border-bottom: 2px solid var(--color-border-strong);
  margin-bottom: var(--grid-gutter);
}

.header-primary {
  /* 4/5 width - static content area */
}

.header-sidebar {
  /* 1/5 width - articles/posts list */
  border-left: 1px solid var(--color-border);
  padding-left: var(--grid-gutter);
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--grid-gutter);
  padding: var(--grid-gutter) 0;
}

/* Responsive */
@media (max-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .header-region {
    grid-template-columns: 1fr;
  }
  .header-sidebar {
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-left: 0;
    padding-top: var(--grid-gutter);
  }
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Navigation

### Top Navigation Bar

Fixed position, minimal height, maximum utility.

```
┌─────────────────────────────────────────────────────────────────────┐
│ [i0] SITE NAME     IDEAS  SPRINTS  BACKLOG  GLOSSARY    [SEARCH]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Navigation HTML Structure

```html
<nav class="nav-bar" role="navigation">
  <div class="nav-container">
    <a href="/" class="nav-brand">
      <span class="notation-badge">i0</span>
      <span class="nav-site-name">SITE NAME</span>
    </a>
    
    <ul class="nav-links">
      <li><a href="/ideas/" class="nav-link">IDEAS</a></li>
      <li><a href="/sprints/" class="nav-link">SPRINTS</a></li>
      <li><a href="/backlog/" class="nav-link">BACKLOG</a></li>
      <li><a href="/glossary/" class="nav-link">GLOSSARY</a></li>
    </ul>
    
    <div class="nav-search">
      <button class="search-trigger" aria-label="Search">
        <!-- Search icon -->
      </button>
    </div>
  </div>
</nav>
```

### Navigation Styling

```css
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--color-background);
  border-bottom: 2px solid var(--color-text-primary);
  z-index: 1000;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1536px;
  margin: 0 auto;
  padding: 0 var(--grid-margin);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--color-text-primary);
}

.nav-site-name {
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

.nav-link:hover,
.nav-link[aria-current="page"] {
  color: var(--color-text-primary);
}

/* Page content offset for fixed nav */
body {
  padding-top: 48px;
}
```

---

## Component Library

### 1. Notation Badge

The signature element—displays taxonomy notation in wayfinding style.

```html
<span class="notation-badge">i5</span>
<span class="notation-badge">5.56</span>
<span class="notation-badge">2609.5.56</span>
```

```css
.notation-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: var(--color-notation-bg);
  color: var(--color-notation-text);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 2px;
  white-space: nowrap;
}

/* Size variants */
.notation-badge--lg {
  padding: 4px 10px;
  font-size: var(--text-base);
}

.notation-badge--sm {
  padding: 1px 4px;
  font-size: var(--text-xs);
}
```

### 2. Status Indicator

```html
<span class="status-indicator status-indicator--active">ACTIVE</span>
<span class="status-indicator status-indicator--complete">DONE</span>
<span class="status-indicator status-indicator--blocked">BLOCKED</span>
```

```css
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 2px;
  background: var(--color-surface);
}

.status-indicator::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator--active::before { background: var(--color-status-active); }
.status-indicator--planned::before { background: var(--color-status-planned); }
.status-indicator--complete::before { background: var(--color-status-complete); }
.status-indicator--blocked::before { background: var(--color-status-blocked); }
.status-indicator--archived::before { background: var(--color-status-archived); }
```

### 3. Idea Card

Dense, information-rich card for the 5-column grid.

```html
<article class="idea-card">
  <header class="idea-card__header">
    <span class="notation-badge">i5</span>
    <span class="status-indicator status-indicator--active">ACTIVE</span>
  </header>
  
  <h3 class="idea-card__title">
    <a href="/i/5/">Idea Title Goes Here</a>
  </h3>
  
  <p class="idea-card__description">
    Brief description of the idea, truncated to 2-3 lines maximum for density.
  </p>
  
  <footer class="idea-card__meta">
    <span class="idea-card__stories">12 stories</span>
    <span class="idea-card__date">2025-01-15</span>
  </footer>
</article>
```

```css
.idea-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-status-active);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.idea-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.idea-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.idea-card__title {
  font-size: var(--text-md);
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 6px 0;
}

.idea-card__title a {
  color: var(--color-text-primary);
  text-decoration: none;
}

.idea-card__title a:hover {
  text-decoration: underline;
}

.idea-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0 0 auto 0;
  /* Clamp to 3 lines */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.idea-card__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Border color by status */
.idea-card--planned { border-left-color: var(--color-status-planned); }
.idea-card--complete { border-left-color: var(--color-status-complete); }
.idea-card--archived { border-left-color: var(--color-status-archived); }
```

### 4. Story Card

Similar to idea card but with sprint assignment context.

```html
<article class="story-card">
  <header class="story-card__header">
    <span class="notation-badge notation-badge--sm">5.56</span>
    <span class="priority-indicator priority-indicator--high">HIGH</span>
  </header>
  
  <h4 class="story-card__title">
    <a href="/s/5/56/">Story Title</a>
  </h4>
  
  <p class="story-card__description">
    As a user, I want to...
  </p>
  
  <footer class="story-card__meta">
    <span class="status-indicator status-indicator--active">IN PROGRESS</span>
    <span class="story-card__sprint">
      <span class="notation-badge notation-badge--sm">2609</span>
    </span>
  </footer>
</article>
```

```css
.story-card {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.story-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.story-card__title {
  font-size: var(--text-base);
  font-weight: 500;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.story-card__title a {
  color: var(--color-text-primary);
  text-decoration: none;
}

.story-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
}

/* Priority indicator */
.priority-indicator {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.priority-indicator--critical { color: var(--color-status-blocked); }
.priority-indicator--high { color: #E65100; }
.priority-indicator--medium { color: var(--color-text-secondary); }
.priority-indicator--low { color: var(--color-text-secondary); opacity: 0.7; }
```

### 5. Sprint Card

```html
<article class="sprint-card">
  <header class="sprint-card__header">
    <span class="notation-badge notation-badge--lg">2609</span>
    <span class="status-indicator status-indicator--active">ACTIVE</span>
  </header>
  
  <div class="sprint-card__dates">
    <time>Apr 20</time>
    <span class="sprint-card__date-separator">→</span>
    <time>May 3</time>
  </div>
  
  <div class="sprint-card__progress">
    <div class="progress-bar">
      <div class="progress-bar__fill" style="width: 45%"></div>
    </div>
    <span class="sprint-card__progress-text">9 / 20 stories</span>
  </div>
  
  <footer class="sprint-card__meta">
    <span>4 ideas</span>
    <a href="/sprint/2609/">VIEW BOARD →</a>
  </footer>
</article>
```

### 6. Note List Item (Sidebar)

Condensed format for the 1/5 articles sidebar.

```html
<article class="note-item">
  <time class="note-item__date">2025-01-15</time>
  <h5 class="note-item__title">
    <a href="/blog/article-slug/">Note Title Here</a>
  </h5>
</article>
```

```css
.note-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.note-item:last-child {
  border-bottom: none;
}

.note-item__date {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 2px;
}

.note-item__title {
  font-size: var(--text-sm);
  font-weight: 500;
  margin: 0;
  line-height: 1.3;
}

.note-item__title a {
  color: var(--color-text-primary);
  text-decoration: none;
}

.note-item__title a:hover {
  text-decoration: underline;
}
```

---

## Page Templates

### Homepage Layout

```html
<main class="page-home">
  <section class="header-region">
    <div class="header-primary">
      {% include home-hero.html %}
      <!-- Static content: site introduction, current focus, etc. -->
    </div>
    
    <aside class="header-sidebar">
      <h2 class="sidebar-heading">NOTES</h2>
      <div class="note-list">
        {% for post in site.posts limit:5 %}
          {% include note-item.html post=post %}
        {% endfor %}
      </div>
      <a href="/blog/" class="sidebar-more">ALL NOTES →</a>
    </aside>
  </section>
  
  <section class="content-section">
    <header class="section-header">
      <h2 class="section-title">IDEAS</h2>
      <a href="/ideas/" class="section-link">VIEW ALL →</a>
    </header>
    
    <div class="card-grid">
      {% for idea in site.ideas limit:10 %}
        {% include idea-card.html idea=idea %}
      {% endfor %}
    </div>
  </section>
  
  <section class="content-section">
    <header class="section-header">
      <h2 class="section-title">CURRENT SPRINT</h2>
      <a href="/sprints/" class="section-link">ALL SPRINTS →</a>
    </header>
    
    <!-- Current sprint summary + story cards -->
  </section>
</main>
```

### Ideas Index (Array View)

```html
<main class="page-ideas">
  <section class="header-region">
    <div class="header-primary">
      <h1 class="page-title">IDEAS</h1>
      <p class="page-description">
        All ideas tracked in this system. i0 is this site itself.
      </p>
      
      <!-- Filter controls -->
      <div class="filter-bar">
        <button class="filter-btn filter-btn--active">ALL</button>
        <button class="filter-btn">ACTIVE</button>
        <button class="filter-btn">PLANNED</button>
        <button class="filter-btn">COMPLETE</button>
        <button class="filter-btn">ARCHIVED</button>
      </div>
    </div>
    
    <aside class="header-sidebar">
      <h2 class="sidebar-heading">NOTES</h2>
      <!-- ... -->
    </aside>
  </section>
  
  <section class="content-section">
    <div class="card-grid">
      {% assign sorted_ideas = site.ideas | sort: "idea_number" %}
      {% for idea in sorted_ideas %}
        {% include idea-card.html idea=idea %}
      {% endfor %}
    </div>
  </section>
</main>
```

### Single Idea Page

```html
<main class="page-idea">
  <section class="header-region">
    <div class="header-primary">
      <header class="idea-header">
        <span class="notation-badge notation-badge--lg">i{{ page.idea_number }}</span>
        <span class="status-indicator status-indicator--{{ page.status }}">
          {{ page.status | upcase }}
        </span>
      </header>
      
      <h1 class="page-title">{{ page.title }}</h1>
      
      <div class="idea-content">
        {{ content }}
      </div>
    </div>
    
    <aside class="header-sidebar">
      <h2 class="sidebar-heading">NOTES</h2>
      <!-- ... -->
    </aside>
  </section>
  
  <section class="content-section">
    <header class="section-header">
      <h2 class="section-title">STORIES</h2>
      <span class="section-count">{{ stories_count }} total</span>
    </header>
    
    <div class="card-grid">
      {% include helpers/stories-for-idea.html idea_number=page.idea_number %}
      {% for story in stories_list %}
        {% include story-card.html story=story %}
      {% endfor %}
    </div>
  </section>
</main>
```

---

## Backlog View

### Implicit Backlog Logic

The backlog is **implicitly derived** from stories and their sprint assignments:

- **Unassigned stories** = Stories with no `assigned_sprint` → Backlog
- **Assigned stories** = Stories with `assigned_sprint` → Planned/Scheduled
- **Completed stories** = Stories with `status: done` → Archive

### Backlog Page Structure

```html
<main class="page-backlog">
  <section class="header-region">
    <div class="header-primary">
      <h1 class="page-title">BACKLOG</h1>
      <p class="page-description">
        Stories not yet assigned to a sprint.
      </p>
      
      <div class="backlog-stats">
        <div class="stat">
          <span class="stat__value">{{ unassigned_count }}</span>
          <span class="stat__label">UNASSIGNED</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ planned_count }}</span>
          <span class="stat__label">PLANNED</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ in_progress_count }}</span>
          <span class="stat__label">IN PROGRESS</span>
        </div>
      </div>
    </div>
    
    <aside class="header-sidebar">
      <!-- ... -->
    </aside>
  </section>
  
  <!-- Grouped by Idea -->
  <section class="content-section">
    {% for idea in site.ideas %}
      {% include helpers/stories-for-idea.html idea_number=idea.idea_number %}
      {% assign backlog_stories = stories_list | where: "assigned_sprint", nil %}
      
      {% if backlog_stories.size > 0 %}
        <div class="backlog-group">
          <header class="backlog-group__header">
            <span class="notation-badge">i{{ idea.idea_number }}</span>
            <span class="backlog-group__title">{{ idea.title }}</span>
            <span class="backlog-group__count">{{ backlog_stories.size }} stories</span>
          </header>
          
          <div class="card-grid">
            {% for story in backlog_stories %}
              {% include story-card.html story=story %}
            {% endfor %}
          </div>
        </div>
      {% endif %}
    {% endfor %}
  </section>
</main>
```

### Backlog Group Styling

```css
.backlog-group {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.backlog-group:last-child {
  border-bottom: none;
}

.backlog-group__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.backlog-group__title {
  font-size: var(--text-lg);
  font-weight: 500;
}

.backlog-group__count {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-left: auto;
}
```

---

## Sprint Board View

### Kanban Layout

```html
<main class="page-sprint-board">
  <header class="sprint-board__header">
    <div class="sprint-board__title">
      <span class="notation-badge notation-badge--lg">{{ page.sprint_id }}</span>
      <h1>Sprint {{ page.sprint_number }}, {{ page.year }}</h1>
    </div>
    
    <div class="sprint-board__dates">
      <time>{{ page.start_date | date: "%b %d" }}</time>
      <span>→</span>
      <time>{{ page.end_date | date: "%b %d, %Y" }}</time>
    </div>
  </header>
  
  <div class="kanban-board">
    <div class="kanban-column kanban-column--backlog">
      <header class="kanban-column__header">
        <h2>BACKLOG</h2>
        <span class="kanban-column__count">{{ backlog_count }}</span>
      </header>
      <div class="kanban-column__cards">
        {% for story in sprint_stories_backlog %}
          {% include story-card.html story=story compact=true %}
        {% endfor %}
      </div>
    </div>
    
    <div class="kanban-column kanban-column--progress">
      <header class="kanban-column__header">
        <h2>IN PROGRESS</h2>
        <span class="kanban-column__count">{{ progress_count }}</span>
      </header>
      <div class="kanban-column__cards">
        {% for story in sprint_stories_progress %}
          {% include story-card.html story=story compact=true %}
        {% endfor %}
      </div>
    </div>
    
    <div class="kanban-column kanban-column--done">
      <header class="kanban-column__header">
        <h2>DONE</h2>
        <span class="kanban-column__count">{{ done_count }}</span>
      </header>
      <div class="kanban-column__cards">
        {% for story in sprint_stories_done %}
          {% include story-card.html story=story compact=true %}
        {% endfor %}
      </div>
    </div>
  </div>
</main>
```

### Kanban Styling

```css
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--grid-gutter);
  min-height: 60vh;
}

.kanban-column {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.kanban-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 2px solid var(--color-border);
}

.kanban-column__header h2 {
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 0;
}

.kanban-column__count {
  background: var(--color-text-primary);
  color: var(--color-background);
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.kanban-column__cards {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

/* Column accent colors */
.kanban-column--backlog { border-top: 3px solid var(--color-status-planned); }
.kanban-column--progress { border-top: 3px solid var(--color-status-active); }
.kanban-column--done { border-top: 3px solid var(--color-status-complete); }
```

---

## Footer

```html
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-section">
        <h3 class="footer-heading">NOTATION</h3>
        <ul class="footer-list">
          <li><code>i{n}</code> — Idea</li>
          <li><code>s{n}</code> — Story</li>
          <li><code>{i}.{s}</code> — Combined</li>
          <li><code>{sprint}.{i}.{s}</code> — Full</li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-heading">NAVIGATION</h3>
        <ul class="footer-list">
          <li><a href="/ideas/">Ideas</a></li>
          <li><a href="/sprints/">Sprints</a></li>
          <li><a href="/backlog/">Backlog</a></li>
          <li><a href="/glossary/">Glossary</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-heading">META</h3>
        <ul class="footer-list">
          <li><a href="/i/0/">About (i0)</a></li>
          <li><a href="/blog/">Notes</a></li>
          <li><a href="/feed.xml">RSS Feed</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p class="footer-copyright">
        Built with this system. <span class="notation-badge notation-badge--sm">i0</span>
      </p>
    </div>
  </div>
</footer>
```

```css
.site-footer {
  margin-top: 48px;
  padding: 32px 0;
  background: var(--color-surface);
  border-top: 2px solid var(--color-text-primary);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 24px;
}

.footer-heading {
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;
}

.footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-list li {
  font-size: var(--text-sm);
  margin-bottom: 6px;
}

.footer-list a {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.footer-list a:hover {
  color: var(--color-text-primary);
}

.footer-bottom {
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.footer-copyright {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
```

---

## Responsive Behavior Summary

| Breakpoint | Card Grid | Header Region | Kanban |
|------------|-----------|---------------|--------|
| > 1280px | 5 columns | 4/5 + 1/5 | 3 columns |
| 1024-1280px | 4 columns | 4/5 + 1/5 | 3 columns |
| 768-1024px | 3 columns | Stacked | 3 columns (scrollable) |
| 480-768px | 2 columns | Stacked | Tabs |
| < 480px | 1 column | Stacked | Tabs |

---

## File Structure for Styles

```
assets/
  css/
    main.scss           # Main entry point
    _variables.scss     # CSS custom properties
    _reset.scss         # Minimal reset
    _typography.scss    # Type styles
    _layout.scss        # Grid, containers
    _navigation.scss    # Nav bar
    _cards.scss         # All card components
    _badges.scss        # Notation, status badges
    _kanban.scss        # Sprint board
    _footer.scss        # Footer
    _utilities.scss     # Helper classes
```

---

## Implementation Checklist

- [ ] Set up CSS custom properties in `_variables.scss`
- [ ] Implement base typography and reset
- [ ] Build navigation component
- [ ] Build notation badge component
- [ ] Build status indicator component
- [ ] Build idea card component
- [ ] Build story card component
- [ ] Build sprint card component
- [ ] Build article list item component
- [ ] Implement 4/5 + 1/5 header region layout
- [ ] Implement 5-column card grid
- [ ] Build homepage template
- [ ] Build ideas index template
- [ ] Build single idea template
- [ ] Build backlog page with grouped stories
- [ ] Build sprint board with kanban columns
- [ ] Build footer
- [ ] Test all responsive breakpoints
- [ ] Verify dark mode (if implementing)
