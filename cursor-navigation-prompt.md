# Cursor Prompt: Cross-Functional Navigation System

> **Prerequisites**: 
> - Base Jekyll site with Ideas/Stories/Sprints taxonomy is built and running
> - Playwright MCP server is configured in Cursor
> - Local dev server is running (`bundle exec jekyll serve`)
>
> **Purpose**: Add comprehensive navigation enabling users to slice, filter, and explore content across all dimensions of the taxonomy.

---

## Phase 1: Playwright Exploration (Run First)

Before implementing navigation, use Playwright MCP to audit the existing site structure and understand what's already built.

### 1.1 Start Local Server

Ensure the Jekyll site is running:
```bash
bundle exec jekyll serve --livereload
```

Default URL: `http://localhost:4000`

### 1.2 Exploration Tasks

Use Playwright MCP to perform these discovery tasks. Execute them sequentially and document findings.

#### Task 1: Map Existing Navigation
```
Using Playwright, navigate to http://localhost:4000 and document:
1. Current navigation structure (header, footer, sidebar)
2. All visible navigation links and their destinations
3. Current active state styling for navigation items
4. Mobile navigation behavior (resize viewport to 375px width)

Take screenshots at desktop (1280px) and mobile (375px) widths.
```

#### Task 2: Audit Ideas Collection
```
Using Playwright, navigate to the Ideas index page and document:
1. URL structure for ideas listing
2. How many ideas currently exist
3. What filtering/sorting options are present (if any)
4. How idea cards link to individual idea pages
5. Click through to 2-3 individual idea pages and note:
   - URL pattern
   - How stories are displayed
   - Any navigation back to index
   - Breadcrumb presence

Take screenshots of the ideas index and one idea detail page.
```

#### Task 3: Audit Stories Structure
```
Using Playwright, explore the Stories display and document:
1. Are stories accessible via a dedicated index, or only through ideas?
2. URL structure for individual stories
3. How stories reference their parent idea
4. How stories show sprint assignment (if applicable)
5. Cross-linking between stories

Take screenshots showing story display in context.
```

#### Task 4: Audit Sprints Collection
```
Using Playwright, navigate to the Sprints section and document:
1. URL for sprints listing
2. How sprints are displayed (calendar, list, timeline?)
3. Current sprint indicator (if any)
4. Sprint detail page structure
5. How stories assigned to sprints are shown

Take screenshots of sprint index and one sprint detail page.
```

#### Task 5: Audit Backlog View
```
Using Playwright, navigate to the Backlog page and document:
1. URL for backlog
2. How unassigned stories are grouped (by idea, flat list, etc.)
3. Filtering capabilities present
4. How users can identify story priority
5. Any quick-assign functionality

Take screenshot of backlog page.
```

#### Task 6: Check Cross-Linking Gaps
```
Using Playwright, perform a navigation flow test:
1. Start at homepage
2. Navigate to a random idea
3. Click into a story within that idea
4. Attempt to navigate to the sprint (if assigned)
5. From sprint, try to navigate back to the idea
6. Note any dead-ends or missing navigation paths

Document the complete click path and any gaps found.
```

### 1.3 Compile Exploration Report

After completing the Playwright exploration, summarize:

```markdown
## Current Navigation Audit

### Existing Structure
- Primary nav items: [list them]
- Secondary nav: [list them]
- Footer nav: [list them]

### URL Patterns
- Ideas: [pattern]
- Stories: [pattern]  
- Sprints: [pattern]
- Updates: [pattern]

### Identified Gaps
1. [Gap 1]
2. [Gap 2]
3. [Gap 3]

### Screenshots
[Reference screenshot locations]
```

---

## Phase 2: Navigation Architecture

Based on the taxonomy structure and Swiss wayfinding principles, implement the following navigation system.

### 2.1 Navigation Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: Primary Navigation (Global, Fixed Header)                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [i0] SITE    IDEAS    SPRINTS    BACKLOG    TIMELINE    [🔍]   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: Contextual Navigation (Page-Specific)                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Breadcrumbs: Ideas > i5 > 5.23                                  │ │
│ │ Filters: [Status ▼] [Priority ▼] [Sprint ▼]                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ LEVEL 3: In-Page Navigation (Section/Collection Specific)          │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Quick Jump: [Active] [Planned] [Archived] | View: [Grid] [List]│ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ LEVEL 4: Cross-Reference Links (Inline, Contextual)                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Related: i5 → Sprint 2609 → See also: i12, i3                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Navigation Components to Build

```
_includes/
  navigation/
    primary-nav.html        # Fixed header navigation
    breadcrumbs.html        # Hierarchical location indicator  
    filter-bar.html         # Status/Priority/Sprint filters
    view-toggle.html        # Grid/List view switcher
    quick-jump.html         # Jump to filtered subsets
    pagination.html         # Page navigation for long lists
    sprint-picker.html      # Sprint selection dropdown
    notation-search.html    # Direct notation input (e.g., "5.23")
    related-items.html      # Cross-reference suggestions
    mobile-nav.html         # Hamburger menu for mobile
    footer-nav.html         # Footer navigation grid
```

---

## Phase 3: Component Specifications

### 3.1 Primary Navigation (`_includes/navigation/primary-nav.html`)

```html
<!--
  Primary Navigation
  Fixed header, always visible
  Highlights current section
  
  Required data: 
    - site.ideas (for count badge)
    - current sprint (derived from date)
-->

<nav class="primary-nav" role="navigation" aria-label="Primary">
  <div class="primary-nav__container">
    
    <!-- Brand / Home -->
    <a href="{{ '/' | relative_url }}" class="primary-nav__brand">
      <span class="notation-badge">i0</span>
      <span class="primary-nav__site-name">{{ site.title | upcase }}</span>
    </a>
    
    <!-- Main Links -->
    <ul class="primary-nav__links" role="menubar">
      <li role="none">
        <a href="{{ '/ideas/' | relative_url }}" 
           role="menuitem"
           class="primary-nav__link {% if page.url contains '/ideas' or page.layout == 'idea' %}is-active{% endif %}"
           {% if page.url contains '/ideas' %}aria-current="page"{% endif %}>
          IDEAS
          <span class="primary-nav__count">{{ site.ideas | size }}</span>
        </a>
      </li>
      <li role="none">
        <a href="{{ '/sprints/' | relative_url }}"
           role="menuitem" 
           class="primary-nav__link {% if page.url contains '/sprint' %}is-active{% endif %}">
          SPRINTS
        </a>
      </li>
      <li role="none">
        <a href="{{ '/backlog/' | relative_url }}"
           role="menuitem"
           class="primary-nav__link {% if page.url contains '/backlog' %}is-active{% endif %}">
          BACKLOG
          {%- assign backlog_count = site.stories | where: "assigned_sprint", nil | size -%}
          {% if backlog_count > 0 %}<span class="primary-nav__count">{{ backlog_count }}</span>{% endif %}
        </a>
      </li>
      <li role="none">
        <a href="{{ '/timeline/' | relative_url }}"
           role="menuitem"
           class="primary-nav__link {% if page.url contains '/timeline' %}is-active{% endif %}">
          TIMELINE
        </a>
      </li>
    </ul>
    
    <!-- Notation Search -->
    <div class="primary-nav__search">
      {% include navigation/notation-search.html %}
    </div>
    
    <!-- Mobile Toggle -->
    <button class="primary-nav__mobile-toggle" 
            aria-expanded="false" 
            aria-controls="mobile-nav"
            aria-label="Toggle navigation">
      <span class="primary-nav__hamburger"></span>
    </button>
    
  </div>
</nav>
```

**Styling requirements:**
- Fixed position, 48px height
- Background: `--color-background` with subtle bottom border
- Active state: Bold weight + accent underline
- Count badges: Small, muted, inline
- Mobile: Hamburger at 768px breakpoint

---

### 3.2 Breadcrumbs (`_includes/navigation/breadcrumbs.html`)

```html
<!--
  Breadcrumbs
  Shows hierarchical path using notation system
  
  Parameters:
    - include.idea (optional): idea object
    - include.story (optional): story object  
    - include.sprint (optional): sprint object
-->

{%- assign crumbs = "" | split: "" -%}

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol class="breadcrumbs__list">
    
    <!-- Home is always first -->
    <li class="breadcrumbs__item">
      <a href="{{ '/' | relative_url }}" class="breadcrumbs__link">
        <span class="notation-badge notation-badge--sm">i0</span>
      </a>
    </li>
    
    <!-- Ideas level -->
    {%- if include.idea or page.layout == 'idea' or page.layout == 'story' -%}
      <li class="breadcrumbs__item">
        <span class="breadcrumbs__separator" aria-hidden="true">→</span>
        <a href="{{ '/ideas/' | relative_url }}" class="breadcrumbs__link">IDEAS</a>
      </li>
    {%- endif -%}
    
    <!-- Specific Idea -->
    {%- if include.idea -%}
      <li class="breadcrumbs__item">
        <span class="breadcrumbs__separator" aria-hidden="true">→</span>
        <a href="{{ include.idea.url | relative_url }}" class="breadcrumbs__link">
          <span class="notation-badge notation-badge--sm">i{{ include.idea.idea_number }}</span>
        </a>
      </li>
    {%- elsif page.layout == 'idea' -%}
      <li class="breadcrumbs__item" aria-current="page">
        <span class="breadcrumbs__separator" aria-hidden="true">→</span>
        <span class="notation-badge notation-badge--sm">i{{ page.idea_number }}</span>
      </li>
    {%- endif -%}
    
    <!-- Story level -->
    {%- if include.story or page.layout == 'story' -%}
      {%- assign story = include.story | default: page -%}
      <li class="breadcrumbs__item" aria-current="page">
        <span class="breadcrumbs__separator" aria-hidden="true">→</span>
        <span class="notation-badge notation-badge--sm">{{ story.idea_number }}.{{ story.story_number }}</span>
      </li>
    {%- endif -%}
    
    <!-- Sprint context (if viewing from sprint) -->
    {%- if include.sprint -%}
      <li class="breadcrumbs__item">
        <span class="breadcrumbs__separator" aria-hidden="true">→</span>
        <a href="{{ include.sprint.url | relative_url }}" class="breadcrumbs__link">
          <span class="notation-badge notation-badge--sm">{{ include.sprint.sprint_id }}</span>
        </a>
      </li>
    {%- endif -%}
    
  </ol>
</nav>
```

**Styling requirements:**
- Horizontal layout, left-aligned
- Notation badges for items, plain text for categories
- Arrow separator (→) matching German signage aesthetic
- Current page not linked, slightly muted
- Compact: fits in single line

---

### 3.3 Filter Bar (`_includes/navigation/filter-bar.html`)

```html
<!--
  Filter Bar
  Client-side filtering for collections
  
  Parameters:
    - include.collection: "ideas" | "stories" | "sprints"
    - include.show_status: boolean (default: true)
    - include.show_priority: boolean (default: false)
    - include.show_sprint: boolean (default: false)
-->

<div class="filter-bar" data-filter-collection="{{ include.collection }}">
  
  <div class="filter-bar__group">
    <span class="filter-bar__label">FILTER:</span>
    
    <!-- Status Filter (always for ideas/stories) -->
    {%- if include.show_status != false -%}
    <div class="filter-bar__dropdown">
      <button class="filter-bar__trigger" 
              aria-expanded="false"
              aria-haspopup="listbox"
              data-filter-type="status">
        STATUS <span class="filter-bar__caret">▼</span>
      </button>
      <ul class="filter-bar__options" role="listbox" hidden>
        <li role="option" data-value="all" class="is-selected">All</li>
        <li role="option" data-value="active">Active</li>
        <li role="option" data-value="planned">Planned</li>
        <li role="option" data-value="in-progress">In Progress</li>
        <li role="option" data-value="completed">Completed</li>
        <li role="option" data-value="archived">Archived</li>
      </ul>
    </div>
    {%- endif -%}
    
    <!-- Priority Filter (stories only) -->
    {%- if include.show_priority -%}
    <div class="filter-bar__dropdown">
      <button class="filter-bar__trigger"
              aria-expanded="false"
              aria-haspopup="listbox"
              data-filter-type="priority">
        PRIORITY <span class="filter-bar__caret">▼</span>
      </button>
      <ul class="filter-bar__options" role="listbox" hidden>
        <li role="option" data-value="all" class="is-selected">All</li>
        <li role="option" data-value="critical">Critical</li>
        <li role="option" data-value="high">High</li>
        <li role="option" data-value="medium">Medium</li>
        <li role="option" data-value="low">Low</li>
      </ul>
    </div>
    {%- endif -%}
    
    <!-- Sprint Filter -->
    {%- if include.show_sprint -%}
    <div class="filter-bar__dropdown">
      <button class="filter-bar__trigger"
              aria-expanded="false"
              aria-haspopup="listbox"
              data-filter-type="sprint">
        SPRINT <span class="filter-bar__caret">▼</span>
      </button>
      <ul class="filter-bar__options" role="listbox" hidden>
        <li role="option" data-value="all" class="is-selected">All</li>
        <li role="option" data-value="unassigned">Unassigned</li>
        <li role="option" data-value="current">Current Sprint</li>
        {%- assign sprints = site.sprints | sort: "sprint_id" | reverse -%}
        {%- for sprint in sprints limit: 6 -%}
        <li role="option" data-value="{{ sprint.sprint_id }}">{{ sprint.sprint_id }}</li>
        {%- endfor -%}
      </ul>
    </div>
    {%- endif -%}
    
  </div>
  
  <!-- Active Filters Display -->
  <div class="filter-bar__active" hidden>
    <span class="filter-bar__active-label">Active:</span>
    <ul class="filter-bar__tags"></ul>
    <button class="filter-bar__clear" type="button">CLEAR ALL</button>
  </div>
  
  <!-- Results Count -->
  <div class="filter-bar__results">
    <span class="filter-bar__count" data-total="{{ include.total | default: 0 }}">
      Showing <strong data-visible-count>all</strong> items
    </span>
  </div>
  
</div>
```

**JavaScript requirements:**
Create `assets/js/filter-bar.js`:
- Toggle dropdown visibility on click
- Apply `data-status`, `data-priority`, `data-sprint` attributes to filterable cards
- Show/hide cards based on selected filters
- Update visible count
- Persist filter state in URL query params
- Support keyboard navigation (arrow keys, enter, escape)

---

### 3.4 Notation Search (`_includes/navigation/notation-search.html`)

```html
<!--
  Notation Search
  Direct navigation via notation input (i5, 5.23, 2609.5.56)
-->

<div class="notation-search">
  <form class="notation-search__form" action="{{ '/search/' | relative_url }}" method="get" role="search">
    <label for="notation-input" class="visually-hidden">Jump to notation</label>
    <input type="text" 
           id="notation-input"
           name="q"
           class="notation-search__input"
           placeholder="i5, 5.23, 2609..."
           autocomplete="off"
           autocapitalize="off"
           spellcheck="false"
           pattern="[iIsS]?\d+(\.\d+)?(\.\d+)?"
           aria-describedby="notation-hint">
    <button type="submit" class="notation-search__submit" aria-label="Go">
      →
    </button>
  </form>
  <div id="notation-hint" class="notation-search__hint" hidden>
    Enter: i5 (idea), 5.23 (story), 2609.5.23 (update)
  </div>
  
  <!-- Autocomplete Results -->
  <ul class="notation-search__results" role="listbox" hidden></ul>
</div>
```

**JavaScript requirements:**
Create notation parser in `assets/js/notation-search.js`:
```javascript
// Parse notation and redirect
function parseNotation(input) {
  const normalized = input.toLowerCase().trim();
  
  // Full notation: 2609.5.23 → /updates/2609-5-23/
  if (/^\d{4}\.\d+\.\d+$/.test(normalized)) {
    const [sprint, idea, story] = normalized.split('.');
    return `/updates/${sprint}-${idea}-${story}/`;
  }
  
  // Idea.Story: 5.23 → /s/5/23/
  if (/^\d+\.\d+$/.test(normalized)) {
    const [idea, story] = normalized.split('.');
    return `/s/${idea}/${story}/`;
  }
  
  // Idea only: i5 or 5 → /i/5/
  if (/^i?\d+$/.test(normalized)) {
    const num = normalized.replace('i', '');
    return `/i/${num}/`;
  }
  
  // Story only: s23 → search
  if (/^s\d+$/.test(normalized)) {
    return `/search/?q=${normalized}`;
  }
  
  // Sprint: 2609 → /sprint/2609/
  if (/^\d{4}$/.test(normalized)) {
    return `/sprint/${normalized}/`;
  }
  
  return null;
}
```

---

### 3.5 Quick Jump (`_includes/navigation/quick-jump.html`)

```html
<!--
  Quick Jump
  Fast-access buttons for common filtered views
  
  Parameters:
    - include.context: "ideas" | "stories" | "sprints"
-->

<div class="quick-jump" role="navigation" aria-label="Quick filters">
  
  {%- if include.context == "ideas" -%}
    {%- assign active_count = site.ideas | where: "status", "active" | size -%}
    {%- assign planned_count = site.ideas | where: "status", "planned" | size -%}
    {%- assign completed_count = site.ideas | where: "status", "completed" | size -%}
    
    <a href="?status=active" class="quick-jump__btn" data-filter="status:active">
      ACTIVE <span class="quick-jump__count">{{ active_count }}</span>
    </a>
    <a href="?status=planned" class="quick-jump__btn" data-filter="status:planned">
      PLANNED <span class="quick-jump__count">{{ planned_count }}</span>
    </a>
    <a href="?status=completed" class="quick-jump__btn" data-filter="status:completed">
      COMPLETED <span class="quick-jump__count">{{ completed_count }}</span>
    </a>
  {%- endif -%}
  
  {%- if include.context == "sprints" -%}
    <a href="?status=active" class="quick-jump__btn quick-jump__btn--highlight" data-filter="status:active">
      CURRENT
    </a>
    <a href="?status=completed" class="quick-jump__btn" data-filter="status:completed">
      PAST
    </a>
    <a href="?status=planned" class="quick-jump__btn" data-filter="status:planned">
      UPCOMING
    </a>
  {%- endif -%}
  
  {%- if include.context == "stories" -%}
    <a href="?priority=critical,high" class="quick-jump__btn quick-jump__btn--urgent">
      URGENT
    </a>
    <a href="?sprint=current" class="quick-jump__btn">
      THIS SPRINT
    </a>
    <a href="?sprint=unassigned" class="quick-jump__btn">
      UNASSIGNED
    </a>
  {%- endif -%}
  
  <!-- View Toggle -->
  <div class="quick-jump__separator" aria-hidden="true"></div>
  {% include navigation/view-toggle.html %}
  
</div>
```

---

### 3.6 Related Items (`_includes/navigation/related-items.html`)

```html
<!--
  Related Items
  Cross-references for contextual navigation
  
  Parameters:
    - include.idea: current idea object
    - include.story: current story object
    - include.sprint: current sprint object
    - include.limit: max items to show (default: 5)
-->

{%- assign limit = include.limit | default: 5 -%}

<aside class="related-items" aria-labelledby="related-heading">
  <h3 id="related-heading" class="related-items__heading">RELATED</h3>
  
  <div class="related-items__sections">
    
    <!-- If viewing a Story, show sibling stories and parent idea -->
    {%- if include.story -%}
      {%- assign siblings = site.stories | where: "idea_number", include.story.idea_number | where_exp: "s", "s.story_number != include.story.story_number" | limit: limit -%}
      
      {%- if siblings.size > 0 -%}
      <div class="related-items__section">
        <h4 class="related-items__subheading">SAME IDEA</h4>
        <ul class="related-items__list">
          {%- for story in siblings -%}
          <li>
            <a href="{{ story.url | relative_url }}">
              <span class="notation-badge notation-badge--sm">{{ story.idea_number }}.{{ story.story_number }}</span>
              {{ story.title | truncate: 30 }}
            </a>
          </li>
          {%- endfor -%}
        </ul>
      </div>
      {%- endif -%}
      
      <!-- Show sprint if assigned -->
      {%- if include.story.assigned_sprint -%}
        {%- assign sprint = site.sprints | where: "sprint_id", include.story.assigned_sprint | first -%}
        {%- if sprint -%}
        <div class="related-items__section">
          <h4 class="related-items__subheading">SPRINT</h4>
          <a href="{{ sprint.url | relative_url }}" class="related-items__sprint-link">
            <span class="notation-badge">{{ sprint.sprint_id }}</span>
            <span class="related-items__sprint-dates">
              {{ sprint.start_date | date: "%b %d" }} – {{ sprint.end_date | date: "%b %d" }}
            </span>
          </a>
        </div>
        {%- endif -%}
      {%- endif -%}
    {%- endif -%}
    
    <!-- If viewing an Idea, show related ideas by tag -->
    {%- if include.idea and include.idea.tags.size > 0 -%}
      {%- assign related_ideas = "" | split: "" -%}
      {%- for tag in include.idea.tags -%}
        {%- assign tagged = site.ideas | where_exp: "i", "i.tags contains tag" | where_exp: "i", "i.idea_number != include.idea.idea_number" -%}
        {%- assign related_ideas = related_ideas | concat: tagged -%}
      {%- endfor -%}
      {%- assign related_ideas = related_ideas | uniq | limit: limit -%}
      
      {%- if related_ideas.size > 0 -%}
      <div class="related-items__section">
        <h4 class="related-items__subheading">RELATED IDEAS</h4>
        <ul class="related-items__list">
          {%- for idea in related_ideas -%}
          <li>
            <a href="{{ idea.url | relative_url }}">
              <span class="notation-badge notation-badge--sm">i{{ idea.idea_number }}</span>
              {{ idea.title | truncate: 30 }}
            </a>
          </li>
          {%- endfor -%}
        </ul>
      </div>
      {%- endif -%}
    {%- endif -%}
    
    <!-- If viewing a Sprint, show adjacent sprints -->
    {%- if include.sprint -%}
      {%- assign all_sprints = site.sprints | sort: "sprint_id" -%}
      {%- assign prev_sprint = nil -%}
      {%- assign next_sprint = nil -%}
      {%- for s in all_sprints -%}
        {%- if s.sprint_id == include.sprint.sprint_id -%}
          {%- if forloop.index > 1 -%}
            {%- assign prev_sprint = all_sprints[forloop.index0 | minus: 1] -%}
          {%- endif -%}
          {%- if forloop.index < all_sprints.size -%}
            {%- assign next_sprint = all_sprints[forloop.index] -%}
          {%- endif -%}
        {%- endif -%}
      {%- endfor -%}
      
      <div class="related-items__section related-items__section--nav">
        {%- if prev_sprint -%}
        <a href="{{ prev_sprint.url | relative_url }}" class="related-items__nav-link related-items__nav-link--prev">
          ← <span class="notation-badge notation-badge--sm">{{ prev_sprint.sprint_id }}</span>
        </a>
        {%- endif -%}
        {%- if next_sprint -%}
        <a href="{{ next_sprint.url | relative_url }}" class="related-items__nav-link related-items__nav-link--next">
          <span class="notation-badge notation-badge--sm">{{ next_sprint.sprint_id }}</span> →
        </a>
        {%- endif -%}
      </div>
    {%- endif -%}
    
  </div>
</aside>
```

---

### 3.7 Timeline Page (`pages/timeline.html`)

Create a new page for chronological navigation:

```html
---
layout: default
title: Timeline
permalink: /timeline/
---

<main class="page-timeline">
  <section class="header-region">
    <div class="header-primary">
      <h1 class="page-title">TIMELINE</h1>
      <p class="page-description">
        Chronological view of all activity across ideas, stories, and sprints.
      </p>
      
      {% include navigation/filter-bar.html 
         collection="updates" 
         show_status=true 
         show_sprint=true %}
    </div>
    
    <aside class="header-sidebar">
      <h2 class="sidebar-heading">SPRINTS</h2>
      {% include navigation/sprint-picker.html %}
    </aside>
  </section>
  
  <section class="timeline">
    {%- assign updates = site.updates | sort: "date" | reverse -%}
    {%- assign current_month = "" -%}
    
    {%- for update in updates -%}
      {%- assign update_month = update.date | date: "%Y-%m" -%}
      
      {%- if update_month != current_month -%}
        {%- if current_month != "" -%}</div>{%- endif -%}
        <div class="timeline__month" data-month="{{ update_month }}">
          <h2 class="timeline__month-heading">{{ update.date | date: "%B %Y" }}</h2>
        {%- assign current_month = update_month -%}
      {%- endif -%}
      
      <article class="timeline__item" 
               data-type="{{ update.type }}"
               data-sprint="{{ update.sprint_id }}"
               data-idea="{{ update.idea_number }}">
        <div class="timeline__marker"></div>
        <div class="timeline__content">
          <header class="timeline__header">
            <span class="notation-badge">{{ update.notation }}</span>
            <time datetime="{{ update.date | date_to_xmlschema }}">
              {{ update.date | date: "%b %d" }}
            </time>
            <span class="status-indicator status-indicator--{{ update.type }}">
              {{ update.type | upcase }}
            </span>
          </header>
          <div class="timeline__body">
            {{ update.content | markdownify | truncatewords: 30 }}
          </div>
          <a href="{{ update.url | relative_url }}" class="timeline__link">View details →</a>
        </div>
      </article>
      
    {%- endfor -%}
    
    {%- if current_month != "" -%}</div>{%- endif -%}
  </section>
</main>
```

---

### 3.8 Mobile Navigation (`_includes/navigation/mobile-nav.html`)

```html
<!--
  Mobile Navigation
  Full-screen overlay menu for mobile devices
-->

<div id="mobile-nav" class="mobile-nav" hidden>
  <div class="mobile-nav__header">
    <span class="notation-badge">i0</span>
    <button class="mobile-nav__close" aria-label="Close menu">×</button>
  </div>
  
  <nav class="mobile-nav__primary" role="navigation">
    <ul class="mobile-nav__list">
      <li>
        <a href="{{ '/ideas/' | relative_url }}" class="mobile-nav__link">
          IDEAS
          <span class="mobile-nav__count">{{ site.ideas | size }}</span>
        </a>
      </li>
      <li>
        <a href="{{ '/sprints/' | relative_url }}" class="mobile-nav__link">
          SPRINTS
        </a>
      </li>
      <li>
        <a href="{{ '/backlog/' | relative_url }}" class="mobile-nav__link">
          BACKLOG
          {%- assign backlog_count = site.stories | where: "assigned_sprint", nil | size -%}
          <span class="mobile-nav__count">{{ backlog_count }}</span>
        </a>
      </li>
      <li>
        <a href="{{ '/timeline/' | relative_url }}" class="mobile-nav__link">
          TIMELINE
        </a>
      </li>
    </ul>
  </nav>
  
  <div class="mobile-nav__search">
    {% include navigation/notation-search.html %}
  </div>
  
  <nav class="mobile-nav__secondary">
    <ul class="mobile-nav__list mobile-nav__list--secondary">
      <li><a href="{{ '/glossary/' | relative_url }}">Glossary</a></li>
      <li><a href="{{ '/blog/' | relative_url }}">Notes</a></li>
      <li><a href="{{ '/i/0/' | relative_url }}">About (i0)</a></li>
    </ul>
  </nav>
</div>
```

---

## Phase 4: Styling

### 4.1 Navigation Styles (`assets/css/_navigation.scss`)

```scss
// ==========================================================================
// Navigation Components
// Swiss Wayfinding Design System
// ==========================================================================

// --------------------------------------------------------------------------
// Primary Navigation
// --------------------------------------------------------------------------

.primary-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--color-background);
  border-bottom: 2px solid var(--color-text-primary);
  z-index: 1000;
  
  &__container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    max-width: 1536px;
    margin: 0 auto;
    padding: 0 var(--grid-margin);
  }
  
  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: var(--color-text-primary);
  }
  
  &__site-name {
    font-size: var(--text-base);
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  
  &__links {
    display: flex;
    gap: 24px;
    list-style: none;
    margin: 0;
    padding: 0;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  &__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-sm);
    font-weight: 500;
    letter-spacing: 0.05em;
    text-decoration: none;
    color: var(--color-text-secondary);
    padding: 4px 0;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    
    &:hover,
    &.is-active {
      color: var(--color-text-primary);
    }
    
    &.is-active {
      border-bottom-color: var(--color-accent-primary);
    }
  }
  
  &__count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    background: var(--color-surface);
    padding: 1px 6px;
    border-radius: 10px;
  }
  
  &__mobile-toggle {
    display: none;
    
    @media (max-width: 768px) {
      display: block;
    }
  }
}

// --------------------------------------------------------------------------
// Breadcrumbs
// --------------------------------------------------------------------------

.breadcrumbs {
  padding: 12px 0;
  
  &__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__separator {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }
  
  &__link {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    
    &:hover {
      color: var(--color-text-primary);
    }
  }
}

// --------------------------------------------------------------------------
// Filter Bar
// --------------------------------------------------------------------------

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  
  &__group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  &__label {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
  }
  
  &__dropdown {
    position: relative;
  }
  
  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.02em;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    cursor: pointer;
    
    &[aria-expanded="true"] {
      background: var(--color-text-primary);
      color: var(--color-background);
    }
  }
  
  &__options {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 150px;
    margin-top: 4px;
    padding: 4px 0;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    list-style: none;
    z-index: 100;
    
    [role="option"] {
      padding: 8px 12px;
      font-size: var(--text-sm);
      cursor: pointer;
      
      &:hover {
        background: var(--color-surface);
      }
      
      &.is-selected {
        font-weight: 700;
      }
    }
  }
  
  &__active {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__tags {
    display: flex;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  &__clear {
    font-size: var(--text-xs);
    color: var(--color-status-blocked);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
  }
  
  &__results {
    margin-left: auto;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

// --------------------------------------------------------------------------
// Quick Jump
// --------------------------------------------------------------------------

.quick-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-decoration: none;
    color: var(--color-text-secondary);
    background: transparent;
    border: 1px solid var(--color-border);
    transition: all 0.15s;
    
    &:hover,
    &.is-active {
      color: var(--color-text-primary);
      border-color: var(--color-text-primary);
    }
    
    &--highlight {
      background: var(--color-accent-primary);
      border-color: var(--color-accent-primary);
      color: var(--color-text-primary);
    }
    
    &--urgent {
      border-color: var(--color-status-blocked);
      color: var(--color-status-blocked);
    }
  }
  
  &__count {
    font-weight: 400;
    opacity: 0.7;
  }
  
  &__separator {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 8px;
  }
}

// --------------------------------------------------------------------------
// Notation Search
// --------------------------------------------------------------------------

.notation-search {
  position: relative;
  
  &__form {
    display: flex;
  }
  
  &__input {
    width: 120px;
    padding: 6px 10px;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    border: 1px solid var(--color-border);
    border-right: none;
    
    &:focus {
      outline: none;
      border-color: var(--color-text-primary);
    }
    
    &::placeholder {
      color: var(--color-text-secondary);
      opacity: 0.6;
    }
  }
  
  &__submit {
    padding: 6px 10px;
    font-size: var(--text-base);
    background: var(--color-text-primary);
    color: var(--color-background);
    border: 1px solid var(--color-text-primary);
    cursor: pointer;
  }
  
  &__results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    list-style: none;
    padding: 0;
    z-index: 100;
  }
}

// --------------------------------------------------------------------------
// Related Items
// --------------------------------------------------------------------------

.related-items {
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  
  &__heading {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    margin: 0 0 12px 0;
    color: var(--color-text-secondary);
  }
  
  &__section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__subheading {
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.05em;
    margin: 0 0 8px 0;
    color: var(--color-text-secondary);
  }
  
  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    
    li {
      margin-bottom: 6px;
    }
    
    a {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// --------------------------------------------------------------------------
// Mobile Navigation
// --------------------------------------------------------------------------

.mobile-nav {
  position: fixed;
  inset: 0;
  background: var(--color-background);
  z-index: 2000;
  padding: 24px;
  overflow-y: auto;
  
  &[hidden] {
    display: none;
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  
  &__close {
    font-size: 32px;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  &__link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: 0.02em;
    text-decoration: none;
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-border);
  }
  
  &__secondary {
    margin-top: 32px;
    
    .mobile-nav__list--secondary a {
      font-size: var(--text-base);
      font-weight: 400;
    }
  }
}
```

---

## Phase 5: JavaScript

### 5.1 Main Navigation Script (`assets/js/navigation.js`)

```javascript
/**
 * Navigation System
 * Handles filtering, search, and mobile menu
 */

(function() {
  'use strict';
  
  // --------------------------------------------------------------------------
  // Filter Bar
  // --------------------------------------------------------------------------
  
  function initFilterBar() {
    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;
    
    const dropdowns = filterBar.querySelectorAll('.filter-bar__dropdown');
    const activeFilters = {};
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.filter-bar__trigger');
      const options = dropdown.querySelector('.filter-bar__options');
      const filterType = trigger.dataset.filterType;
      
      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        closeAllDropdowns();
        if (!isExpanded) {
          trigger.setAttribute('aria-expanded', 'true');
          options.hidden = false;
        }
      });
      
      // Select option
      options.addEventListener('click', (e) => {
        const option = e.target.closest('[role="option"]');
        if (!option) return;
        
        const value = option.dataset.value;
        
        // Update selection
        options.querySelectorAll('[role="option"]').forEach(opt => {
          opt.classList.remove('is-selected');
        });
        option.classList.add('is-selected');
        
        // Store filter
        if (value === 'all') {
          delete activeFilters[filterType];
        } else {
          activeFilters[filterType] = value;
        }
        
        // Apply filters
        applyFilters(filterBar.dataset.filterCollection, activeFilters);
        updateURL(activeFilters);
        closeAllDropdowns();
      });
    });
    
    // Close on outside click
    document.addEventListener('click', closeAllDropdowns);
    
    // Load filters from URL
    loadFiltersFromURL(activeFilters);
    if (Object.keys(activeFilters).length > 0) {
      applyFilters(filterBar.dataset.filterCollection, activeFilters);
    }
  }
  
  function closeAllDropdowns() {
    document.querySelectorAll('.filter-bar__trigger').forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.filter-bar__options').forEach(options => {
      options.hidden = true;
    });
  }
  
  function applyFilters(collection, filters) {
    const cards = document.querySelectorAll('.card-grid > [class*="-card"]');
    let visibleCount = 0;
    
    cards.forEach(card => {
      let visible = true;
      
      for (const [type, value] of Object.entries(filters)) {
        const cardValue = card.dataset[type];
        if (cardValue !== value) {
          visible = false;
          break;
        }
      }
      
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    
    // Update count
    const countEl = document.querySelector('[data-visible-count]');
    if (countEl) {
      countEl.textContent = visibleCount === cards.length ? 'all' : visibleCount;
    }
  }
  
  function updateURL(filters) {
    const url = new URL(window.location);
    url.search = '';
    for (const [key, value] of Object.entries(filters)) {
      url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
  }
  
  function loadFiltersFromURL(filters) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      filters[key] = value;
      // Update dropdown UI
      const option = document.querySelector(
        `.filter-bar__trigger[data-filter-type="${key}"]`
      )?.closest('.filter-bar__dropdown')
       ?.querySelector(`[data-value="${value}"]`);
      if (option) {
        option.classList.add('is-selected');
      }
    }
  }
  
  // --------------------------------------------------------------------------
  // Notation Search
  // --------------------------------------------------------------------------
  
  function initNotationSearch() {
    const searchForm = document.querySelector('.notation-search__form');
    if (!searchForm) return;
    
    const input = searchForm.querySelector('.notation-search__input');
    
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const notation = input.value.trim();
      const url = parseNotation(notation);
      
      if (url) {
        window.location.href = url;
      } else {
        // Fallback to search
        window.location.href = `/search/?q=${encodeURIComponent(notation)}`;
      }
    });
    
    // Show hint on focus
    input.addEventListener('focus', () => {
      const hint = document.getElementById('notation-hint');
      if (hint) hint.hidden = false;
    });
    
    input.addEventListener('blur', () => {
      setTimeout(() => {
        const hint = document.getElementById('notation-hint');
        if (hint) hint.hidden = true;
      }, 200);
    });
  }
  
  function parseNotation(input) {
    const normalized = input.toLowerCase().trim();
    
    // Full notation: 2609.5.23
    if (/^\d{4}\.\d+\.\d+$/.test(normalized)) {
      const [sprint, idea, story] = normalized.split('.');
      return `/updates/${sprint}-${idea}-${story}/`;
    }
    
    // Idea.Story: 5.23
    if (/^\d+\.\d+$/.test(normalized)) {
      const [idea, story] = normalized.split('.');
      return `/s/${idea}/${story}/`;
    }
    
    // Idea only: i5 or just 5
    if (/^i?\d+$/.test(normalized)) {
      const num = normalized.replace(/^i/i, '');
      return `/i/${num}/`;
    }
    
    // Sprint: 2609
    if (/^\d{4}$/.test(normalized)) {
      return `/sprint/${normalized}/`;
    }
    
    return null;
  }
  
  // --------------------------------------------------------------------------
  // Mobile Navigation
  // --------------------------------------------------------------------------
  
  function initMobileNav() {
    const toggle = document.querySelector('.primary-nav__mobile-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const closeBtn = mobileNav?.querySelector('.mobile-nav__close');
    
    if (!toggle || !mobileNav) return;
    
    toggle.addEventListener('click', () => {
      mobileNav.hidden = false;
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    });
    
    closeBtn?.addEventListener('click', closeMobileNav);
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileNav.hidden) {
        closeMobileNav();
      }
    });
    
    function closeMobileNav() {
      mobileNav.hidden = true;
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    }
  }
  
  // --------------------------------------------------------------------------
  // Quick Jump
  // --------------------------------------------------------------------------
  
  function initQuickJump() {
    const buttons = document.querySelectorAll('.quick-jump__btn[data-filter]');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const [type, value] = btn.dataset.filter.split(':');
        const filters = { [type]: value };
        
        applyFilters('', filters);
        updateURL(filters);
        
        // Update active state
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
  }
  
  // --------------------------------------------------------------------------
  // Initialize
  // --------------------------------------------------------------------------
  
  document.addEventListener('DOMContentLoaded', () => {
    initFilterBar();
    initNotationSearch();
    initMobileNav();
    initQuickJump();
  });
  
})();
```

---

## Phase 6: Playwright Testing

After implementing navigation, use Playwright MCP to verify functionality.

### 6.1 Navigation Smoke Tests

```
Using Playwright, run these navigation smoke tests on http://localhost:4000:

TEST 1: Primary Navigation
1. Click each primary nav link (Ideas, Sprints, Backlog, Timeline)
2. Verify each page loads without errors
3. Verify the clicked link shows active state
4. Take screenshot of each page

TEST 2: Breadcrumbs
1. Navigate to an individual idea page
2. Verify breadcrumbs show: i0 → IDEAS → i{n}
3. Click the IDEAS breadcrumb
4. Verify navigation back to ideas index
5. Navigate to a story page
6. Verify breadcrumbs show full path including story notation

TEST 3: Filter Bar
1. Go to Ideas index
2. Click STATUS dropdown
3. Select "Active"
4. Verify only active ideas are visible
5. Verify URL contains ?status=active
6. Refresh page
7. Verify filter persists from URL
8. Click "Clear All"
9. Verify all items visible again

TEST 4: Notation Search
1. Type "i5" in notation search
2. Submit
3. Verify navigation to /i/5/
4. Go back, type "5.23"
5. Submit
6. Verify navigation to /s/5/23/
7. Type "2609" 
8. Submit
9. Verify navigation to /sprint/2609/

TEST 5: Mobile Navigation
1. Resize viewport to 375px width
2. Verify hamburger menu is visible
3. Click hamburger
4. Verify mobile nav overlay appears
5. Click a navigation link
6. Verify page navigates and menu closes
7. Open menu again
8. Press Escape key
9. Verify menu closes

Report pass/fail for each test with screenshots of failures.
```

### 6.2 Cross-Linking Tests

```
Using Playwright, verify cross-linking functionality:

TEST 1: Idea to Stories
1. Navigate to /i/1/
2. Verify stories for this idea are displayed
3. Click a story card
4. Verify navigation to story page
5. Verify breadcrumbs include parent idea

TEST 2: Story to Sprint
1. Find a story with assigned_sprint
2. Navigate to that story
3. Look for sprint link in related items or metadata
4. Click sprint link
5. Verify navigation to sprint page
6. Verify the story appears in sprint's story list

TEST 3: Sprint Navigation
1. Navigate to any sprint page
2. Find prev/next sprint navigation
3. Click next sprint
4. Verify navigation to adjacent sprint
5. Click prev sprint
6. Verify navigation back

TEST 4: Timeline to Detail Pages
1. Navigate to /timeline/
2. Click on an update entry
3. Verify navigation to update detail page
4. Verify back navigation works

Report any broken links or navigation dead-ends.
```

### 6.3 Accessibility Tests

```
Using Playwright, verify navigation accessibility:

TEST 1: Keyboard Navigation
1. Start at homepage
2. Press Tab key repeatedly
3. Verify all navigation links are focusable in logical order
4. Verify focus is visible (outline or highlight)
5. Press Enter on a focused link
6. Verify navigation occurs

TEST 2: ARIA Attributes
1. Inspect primary-nav element
2. Verify role="navigation" and aria-label present
3. Inspect dropdown triggers
4. Verify aria-expanded toggles correctly
5. Verify aria-haspopup="listbox" on filter dropdowns
6. Inspect breadcrumbs
7. Verify aria-current="page" on current item

TEST 3: Screen Reader Simulation
1. Check all images have alt text
2. Check all form inputs have labels
3. Check heading hierarchy (h1 > h2 > h3, no skips)
4. Verify landmark regions present (nav, main, footer)

Report any accessibility issues found.
```

### 6.4 Responsive Tests

```
Using Playwright, test responsive behavior at these breakpoints:

BREAKPOINTS:
- 1280px (desktop)
- 1024px (tablet landscape)
- 768px (tablet portrait)  
- 480px (mobile landscape)
- 375px (mobile portrait)

For each breakpoint, verify:
1. Navigation is accessible (either header links or hamburger)
2. Card grid adjusts column count appropriately
3. Filter bar remains usable
4. Breadcrumbs don't overflow
5. No horizontal scrolling on body
6. Touch targets are at least 44x44px on mobile

Take screenshot at each breakpoint for the Ideas index page.
```

---

## Phase 7: Integration Checklist

After implementation, verify these integration points:

### Layout Updates Required

- [ ] `_layouts/default.html` - Add primary-nav include
- [ ] `_layouts/idea.html` - Add breadcrumbs with idea context
- [ ] `_layouts/story.html` - Add breadcrumbs with story context
- [ ] `_layouts/sprint.html` - Add breadcrumbs and related items
- [ ] `_layouts/update.html` - Add full breadcrumb path

### Page Updates Required

- [ ] `pages/ideas.html` - Add filter-bar and quick-jump
- [ ] `pages/sprints.html` - Add filter-bar and sprint picker
- [ ] `pages/backlog.html` - Add filter-bar with priority filter
- [ ] `pages/timeline.html` - Create new page

### Data Attributes Required

Add these data attributes to card components for filtering:

```html
<!-- Idea Card -->
<article class="idea-card" 
         data-status="{{ idea.status }}"
         data-idea="{{ idea.idea_number }}">

<!-- Story Card -->  
<article class="story-card"
         data-status="{{ story.status }}"
         data-priority="{{ story.priority }}"
         data-sprint="{{ story.assigned_sprint }}"
         data-idea="{{ story.idea_number }}">
```

### Asset Compilation

Ensure these files are loaded:
- [ ] `assets/css/_navigation.scss` imported in main.scss
- [ ] `assets/js/navigation.js` loaded before closing body tag

---

## Summary

This navigation system provides:

1. **Primary Navigation** - Fixed header with section links and counts
2. **Breadcrumbs** - Hierarchical location using notation badges
3. **Filter Bar** - Client-side filtering by status, priority, sprint
4. **Quick Jump** - One-click access to common filtered views
5. **Notation Search** - Direct navigation via notation input
6. **Related Items** - Cross-references between collections
7. **Timeline View** - Chronological activity feed
8. **Mobile Navigation** - Full-screen overlay menu

All components follow the Swiss wayfinding design system and maintain the dense, functional aesthetic established in the UI specification.
