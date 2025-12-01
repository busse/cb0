# Prompt: Optimize CSS Architecture

> **Purpose:** Improve CSS organization, add linting, and optimize for production
> **Target Files:** `assets/css/` directory
> **Estimated Time:** 2-4 hours

---

## Context

The CSS architecture is well-organized with a Bauhaus/Swiss design system. However, there are opportunities to:
- Add CSS/SCSS linting
- Create reusable mixins
- Add focus styles for accessibility
- Add print styles
- Configure production optimization

---

## Task 1: Add Stylelint Configuration

### Install dependencies:
```bash
npm install --save-dev stylelint stylelint-config-standard-scss stylelint-order
```

### Create `.stylelintrc.json`:
```json
{
  "extends": ["stylelint-config-standard-scss"],
  "plugins": ["stylelint-order"],
  "rules": {
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      {
        "message": "Expected class selector to match BEM pattern"
      }
    ],
    "max-nesting-depth": 3,
    "selector-max-specificity": "0,4,0",
    "color-named": "never",
    "color-no-hex": null,
    "scss/dollar-variable-pattern": "^[a-z][a-z0-9-]*$",
    "order/properties-alphabetical-order": true,
    "declaration-block-no-duplicate-properties": true,
    "no-descending-specificity": "warn"
  },
  "ignoreFiles": ["_site/**/*", "node_modules/**/*"]
}
```

### Add npm scripts to `package.json`:
```json
{
  "scripts": {
    "lint:css": "stylelint 'assets/css/**/*.scss'",
    "lint:css:fix": "stylelint 'assets/css/**/*.scss' --fix"
  }
}
```

---

## Task 2: Create Responsive Mixins

### Update `assets/css/_variables.scss`:

Add at the end of the file:

```scss
// ==========================================================================
// SCSS Variables (for mixins - CSS custom properties can't be used in media queries)
// ==========================================================================

$breakpoints: (
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  2xl: 1536px
);

// ==========================================================================
// Mixins
// ==========================================================================

/// Responsive breakpoint mixin
/// @param {String} $name - Breakpoint name (sm, md, lg, xl, 2xl)
@mixin breakpoint($name) {
  $value: map-get($breakpoints, $name);
  @if $value {
    @media (max-width: $value) {
      @content;
    }
  } @else {
    @warn "Unknown breakpoint: #{$name}";
  }
}

/// Breakpoint for minimum width
/// @param {String} $name - Breakpoint name
@mixin breakpoint-up($name) {
  $value: map-get($breakpoints, $name);
  @if $value {
    @media (min-width: $value + 1px) {
      @content;
    }
  }
}

/// Focus visible styles
@mixin focus-visible {
  &:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }
  
  // Fallback for older browsers
  &:focus:not(:focus-visible) {
    outline: none;
  }
}

/// Truncate text with ellipsis
@mixin truncate($lines: 1) {
  @if $lines == 1 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/// Hide visually but keep accessible
@mixin visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/// Aspect ratio container
@mixin aspect-ratio($width, $height) {
  aspect-ratio: #{$width} / #{$height};
  
  // Fallback for older browsers
  @supports not (aspect-ratio: 1) {
    &::before {
      content: '';
      display: block;
      padding-top: percentage($height / $width);
    }
  }
}

/// Card hover effect
@mixin card-hover {
  transition: border-color var(--transition-fast);
  
  &:hover {
    border-color: var(--color-border-strong);
  }
}

/// Status color background
@mixin status-bg($status) {
  background: var(--color-badge-#{$status}-bg);
  color: var(--color-badge-#{$status}-text);
}
```

---

## Task 3: Update Layout to Use Mixins

### Update `assets/css/_layout.scss`:

Replace media queries with mixin:

```scss
// Responsive Grid
@include breakpoint(xl) {
  .card-grid,
  .idea-grid,
  .story-grid,
  .sprint-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@include breakpoint(lg) {
  .header-region {
    grid-template-columns: 1fr;
    padding: var(--spacing-md);
  }
  
  .content-section {
    padding: var(--spacing-sm);
  }
  
  .header-sidebar {
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-left: 0;
    padding-top: var(--spacing-md);
  }
}

@include breakpoint(md) {
  .card-grid,
  .idea-grid,
  .story-grid,
  .sprint-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}

@include breakpoint(sm) {
  .card-grid,
  .idea-grid,
  .story-grid,
  .sprint-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Task 4: Add Focus Styles

### Create `assets/css/_accessibility.scss`:

```scss
// ==========================================================================
// Accessibility
// Focus States & Screen Reader Utilities
// ==========================================================================

// Focus visible for all interactive elements
a,
button,
input,
select,
textarea,
[tabindex]:not([tabindex="-1"]) {
  @include focus-visible;
}

// Visually hidden utility
.visually-hidden,
.sr-only {
  @include visually-hidden;
}

// Skip link
.skip-link {
  @include visually-hidden;
  
  &:focus {
    position: fixed;
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    z-index: 9999;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-background);
    border: 2px solid var(--color-accent-primary);
    width: auto;
    height: auto;
    margin: 0;
    clip: auto;
    white-space: normal;
  }
}

// Reduced motion preference
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// High contrast mode adjustments
@media (forced-colors: active) {
  .notation-badge {
    border: 1px solid currentColor;
  }
  
  .status-indicator {
    border: 1px solid currentColor;
  }
}
```

### Update `assets/css/main.scss`:

```scss
@import "variables";
@import "reset";
@import "typography";
@import "layout";
@import "accessibility";  // Add this line
@import "navigation";
@import "badges";
@import "cards";
@import "figures";
@import "kanban";
@import "dashboard";
@import "footer";
@import "utilities";
```

---

## Task 5: Add Print Styles

### Create `assets/css/_print.scss`:

```scss
// ==========================================================================
// Print Styles
// Optimized layout for printing pages
// ==========================================================================

@media print {
  // Hide non-essential elements
  .primary-nav,
  .mobile-nav,
  .footer,
  .filter-bar,
  .quick-jump,
  .notation-search,
  .lightbox,
  [data-action],
  button:not([type="submit"]) {
    display: none !important;
  }
  
  // Reset layout
  .container {
    max-width: 100%;
    padding: 0;
  }
  
  .header-region {
    display: block;
    border: none;
    background: none;
  }
  
  .header-sidebar {
    border: none;
    padding: 0;
    margin-top: 2rem;
  }
  
  // Cards as simple list items
  .card-grid {
    display: block;
  }
  
  .idea-card,
  .story-card,
  .sprint-card,
  .figure-card {
    break-inside: avoid;
    border: 1px solid #ccc;
    margin-bottom: 1rem;
    page-break-inside: avoid;
  }
  
  // Show URLs after links
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    font-weight: normal;
  }
  
  // Don't show URLs for internal links
  a[href^="/"]::after,
  a[href^="#"]::after {
    content: none;
  }
  
  // Ensure text is black
  body,
  .page-title,
  .section-title,
  h1, h2, h3, h4, h5, h6 {
    color: #000 !important;
  }
  
  // White background
  body {
    background: #fff !important;
  }
  
  // Page breaks
  h1, h2, h3 {
    page-break-after: avoid;
  }
  
  // Images
  img {
    max-width: 100% !important;
  }
  
  // Notation badges for print
  .notation-badge {
    background: #eee !important;
    color: #000 !important;
    border: 1px solid #000;
  }
}
```

### Update `assets/css/main.scss`:

Add before utilities:
```scss
@import "print";
@import "utilities";
```

---

## Task 6: Add Production Optimization

### Update `_config.yml`:

```yaml
# Build settings
sass:
  style: compressed  # Minify CSS in production
  sourcemap: development  # Only generate source maps in dev
```

### Create PostCSS config for PurgeCSS (optional):

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@fullhuman/postcss-purgecss': process.env.JEKYLL_ENV === 'production' ? {
      content: [
        './_site/**/*.html',
        './_includes/**/*.html',
        './_layouts/**/*.html',
        './assets/js/**/*.js'
      ],
      safelist: [
        'is-active',
        'is-selected',
        'hidden',
        /^status-/,
        /^idea-card--/,
        /^story-card--/,
        /^sprint-card--/,
        /^figure-card--/,
        /^filter-/,
        /^toast--/,
        /^lightbox/
      ]
    } : false,
    'autoprefixer': {},
    'cssnano': process.env.JEKYLL_ENV === 'production' ? {} : false
  }
};
```

---

## Task 7: Fix Existing Stylelint Issues

Run linter and fix issues:

```bash
npm run lint:css:fix
```

Common fixes needed:
1. Property ordering
2. Color values (use CSS custom properties)
3. Remove empty rules
4. Fix selector specificity

---

## Verification

1. **Run Stylelint:**
   ```bash
   npm run lint:css
   ```
   Should complete with no errors.

2. **Test focus styles:**
   - Tab through the page
   - Verify all interactive elements have visible focus

3. **Test print styles:**
   - Open print preview in browser (Cmd+P / Ctrl+P)
   - Verify clean, readable output

4. **Test responsive breakpoints:**
   - Resize browser to each breakpoint
   - Verify layouts adjust correctly

5. **Build for production:**
   ```bash
   JEKYLL_ENV=production bundle exec jekyll build
   ```
   Verify CSS is minified.

---

## Success Criteria

- [ ] Stylelint configured and passing
- [ ] Responsive mixins used throughout
- [ ] Focus styles visible on all interactive elements
- [ ] Print styles provide clean output
- [ ] Production CSS is minified
- [ ] No magic numbers for breakpoints
- [ ] All CSS follows BEM naming (or linter exceptions documented)
