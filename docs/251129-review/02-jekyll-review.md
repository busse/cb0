# Jekyll Site Review

## Overview

The Jekyll site implements a taxonomy system for tracking Ideas, Stories, Sprints, Updates, and Figures. It follows a well-defined structure with custom collections and a Bauhaus-inspired design system.

## Architecture Assessment

### Collections Structure

```
_config.yml defines:
├── ideas     → /i/:slug/
├── stories   → /s/:path/
├── sprints   → /sprint/:name/
├── updates   → /updates/:path/
└── figures   → /fig/:slug/
```

**Strengths:**
- Clear, semantic collection names
- Consistent permalink structure
- Proper output settings for each collection

**Areas for Improvement:**
- Stories use `:path` which can create nested URLs
- Consider adding collection-specific data files

### Layout Structure

| Layout | Purpose | Quality |
|--------|---------|---------|
| `default.html` | Base template | ⭐⭐⭐⭐ Well-structured |
| `idea.html` | Idea detail pages | ⭐⭐⭐⭐ Good content organization |
| `story.html` | Story detail pages | ⭐⭐⭐ Could use more context |
| `sprint.html` | Sprint views | ⭐⭐⭐⭐ Good functionality |
| `update.html` | Progress updates | ⭐⭐⭐ Basic implementation |
| `figure.html` | Figure display | ⭐⭐⭐⭐ Proper image handling |

### Include Components

**Well-Implemented:**
- `navigation/*.html` - Comprehensive navigation system
- `notation-badge.html` - Consistent notation display
- `idea-card.html`, `story-card.html` - Reusable card components

**Needs Improvement:**
- `helpers/*.html` - Some complex Liquid logic could be simplified
- Missing documentation in include files

## Code Quality Findings

### 1. Liquid Template Practices

**Good Practices Observed:**
```liquid
{%- assign sorted_ideas = site.ideas | sort: "idea_number" -%}
{%- if sorted_ideas.size > 0 -%}
  <!-- Proper null checking -->
{%- endif -%}
```

**Issues Found:**

**Issue #1: Complex Inline Logic**
Location: `_includes/navigation/related-items.html`
```liquid
{%- for tag in include.idea.tags -%}
  {%- assign tagged = site.ideas | where_exp: "i", "i.tags contains tag" | where_exp: "i", "i.idea_number != include.idea.idea_number" -%}
  {%- assign related_ideas = related_ideas | concat: tagged -%}
{%- endfor -%}
```
**Recommendation:** Extract complex filtering logic into a separate helper include.

**Issue #2: Missing Default Values**
Location: Various layouts
```liquid
{{ page.tags }}  <!-- Could be nil -->
```
**Recommendation:** Use `| default: empty` filter for collections.

### 2. Front Matter Consistency

**Observation:** Front matter schemas are well-defined but not enforced.

**Current State:**
```yaml
---
layout: idea
idea_number: 5
title: "Example"
status: active  # No validation
created: 2025-11-28
---
```

**Recommendation:** Document front matter schemas in `_data/schemas.yml` for reference.

### 3. Asset Pipeline

**Current Structure:**
```
assets/
├── css/
│   ├── main.scss      # Entry point
│   ├── _variables.scss
│   ├── _reset.scss
│   └── ... (11 partials)
├── js/
│   ├── main.js
│   ├── navigation.js
│   └── figures.js
└── figures/           # Uploaded images
```

**Good:**
- SCSS organization follows ITCSS-like pattern
- JavaScript uses IIFE pattern for encapsulation
- Clear file naming conventions

**Issues:**
- No JavaScript bundling/minification
- CSS could benefit from purging unused styles
- No source maps for debugging

### 4. SEO and Accessibility

**Good:**
- jekyll-seo-tag plugin configured
- jekyll-feed for RSS
- jekyll-sitemap for search engines
- Semantic HTML structure

**Needs Attention:**
```html
<!-- Missing lang attribute in some cases -->
<html lang="{{ page.lang | default: site.lang | default: 'en' }}">

<!-- Inline styles should move to CSS -->
<p style="font-size: var(--text-sm); color: var(--color-text-secondary);">
```

### 5. Navigation System

**Excellent Implementation:**
- Primary nav with active states
- Breadcrumb navigation
- Filter bar with JavaScript interactivity
- Mobile navigation
- Notation search functionality

**Code Quality:**
```javascript
// navigation.js - Good patterns
(function() {
  'use strict';
  
  function initFilterBar() { /* ... */ }
  function closeAllDropdowns() { /* ... */ }
  
  // Proper event delegation
  document.addEventListener('click', closeAllDropdowns);
})();
```

## Data Files Review

### `_data/notation.yml`
- Well-structured reference data
- Could add validation rules

### `_data/sprint_calendar.yml`
- Sprint-to-weeks mapping
- Consider auto-generating from sprint front matter

## Configuration Review

### `_config.yml`

**Good:**
```yaml
collections:
  ideas:
    output: true
    permalink: /i/:slug/
```

**Missing:**
```yaml
# Consider adding:
sass:
  style: compressed  # For production
  
strict_front_matter: true  # Catch errors early

liquid:
  error_mode: strict  # Better debugging
```

### Build Performance

**Current Build:** Not measured
**Recommendations:**
1. Add `--profile` flag to identify slow operations
2. Consider incremental builds for development
3. Exclude unnecessary files more aggressively

## Recommendations Summary

### High Priority
1. Add Liquid strict mode for better error detection
2. Document front matter schemas
3. Add JavaScript bundling for production

### Medium Priority
1. Extract complex Liquid logic into helper includes
2. Add CSS/JS source maps for development
3. Implement CSS purging for production builds

### Low Priority
1. Add inline code comments to complex templates
2. Create Jekyll plugin for notation validation
3. Add build performance monitoring

## File-Specific Issues

| File | Issue | Severity |
|------|-------|----------|
| `_layouts/idea.html` | Long template, could split | Low |
| `_includes/helpers/stories-for-idea.html` | Complex logic | Medium |
| `pages/backlog.html` | Repetitive filtering | Low |
| `assets/js/main.js` | Console.log in production | Low |

## Conclusion

The Jekyll site is well-architected with clear conventions. The primary opportunities lie in:
1. Adding stricter validation (Liquid strict mode)
2. Optimizing the asset pipeline for production
3. Documenting complex template logic
4. Extracting reusable patterns into helpers
