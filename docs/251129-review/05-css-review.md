# CSS/SCSS Architecture Review

## Overview

The project implements a Bauhaus/Experimental Jetset/Swiss-German design system using SCSS with a well-organized partial structure. The styling follows a custom design system with CSS custom properties for theming.

## File Structure

```
assets/css/
├── main.scss           # Entry point
├── _variables.scss     # CSS custom properties
├── _reset.scss         # CSS reset
├── _typography.scss    # Type styles
├── _layout.scss        # Grid and page structure
├── _navigation.scss    # Nav components
├── _badges.scss        # Notation badges
├── _cards.scss         # Card components
├── _figures.scss       # Figure/image styles
├── _kanban.scss        # Kanban board styles
├── _dashboard.scss     # Dashboard layout
├── _footer.scss        # Footer styles
└── _utilities.scss     # Utility classes
```

## Architecture Assessment

### Import Order (`main.scss`)

```scss
@import "variables";
@import "reset";
@import "typography";
@import "layout";
@import "navigation";
@import "badges";
@import "cards";
@import "figures";
@import "kanban";
@import "dashboard";
@import "footer";
@import "utilities";
```

**Assessment:** ✅ Good
- Follows logical cascade order
- Variables and reset first
- Base styles before components
- Utilities last for override capability

### Design Tokens (`_variables.scss`)

**Strengths:**
```scss
:root {
  /* Typography */
  --font-primary: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', Consolas, 'Liberation Mono', monospace;
  
  /* Type Scale (minimum 10px, ratio 1.25) */
  --text-xs: 0.714rem;    /* 10px */
  --text-sm: 0.75rem;     /* 12px */
  // ...
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  // ...
}
```

- Well-documented with comments
- Semantic naming
- Consistent spacing scale
- Type scale with minimum size enforced

**Opportunities:**
```scss
/* Current */
--color-border: #E0E0E0;

/* Could add semantic variants */
--color-border-default: #E0E0E0;
--color-border-hover: #CCCCCC;
--color-border-focus: #1A1A1A;
```

### Dark Mode Implementation

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1A1A1A;
    --color-surface: #1F1F1F;
    // ...
  }
}
```

**Assessment:** ✅ Good implementation using media query and CSS custom properties.

**Enhancement:** Consider adding manual toggle support:
```scss
[data-theme="dark"] {
  --color-background: #1A1A1A;
  // ...
}
```

## Component Analysis

### Layout System (`_layout.scss`)

**Strengths:**
```scss
.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 min(5vw, var(--grid-margin));  // ✅ Modern clamp alternative
}

.header-region {
  display: grid;
  grid-template-columns: 4fr 1.2fr;  // ✅ Clear ratio-based layout
  gap: var(--grid-gutter);
}
```

**Issues:**

**Issue #1: Responsive Breakpoints as Magic Numbers**
```scss
@media (max-width: 1024px) { }  // Magic number
@media (max-width: 768px) { }   // Magic number
```

**Recommendation:**
```scss
// In _variables.scss
$breakpoints: (
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px
);

// Create mixin
@mixin breakpoint($name) {
  @media (max-width: map-get($breakpoints, $name)) {
    @content;
  }
}

// Usage
@include breakpoint(lg) {
  .header-region { grid-template-columns: 1fr; }
}
```

### Card Components (`_cards.scss`)

**Strengths:**
- Consistent padding using variables
- Proper use of grid for layout
- Status-based color variants

**Issues:**

**Issue #2: Selector Specificity**
```scss
.item-card {
  // base styles
}

.item-card:hover {
  // hover styles
}

.idea-card {
  // extends base styles? No - separate
}
```

**Recommendation:** Use BEM-style extension:
```scss
.card {
  // base styles
  
  &--idea { }
  &--story { }
  &--sprint { }
  
  &:hover { }
}
```

### Navigation (`_navigation.scss`)

**Strengths:**
```scss
.primary-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;  // Matches --nav-height
  z-index: 1000;
  
  &__container { }  // ✅ BEM naming
  &__brand { }
  &__links { }
}
```

**Issue #3: Inconsistent Nesting**
```scss
.filter-bar {
  &__dropdown {
    position: relative;
  }
  
  &__trigger {
    // 20+ lines of styles
    
    &[aria-expanded="true"] {
      // Deeply nested
    }
  }
}
```

**Recommendation:** Keep nesting shallow:
```scss
.filter-bar { }
.filter-bar__dropdown { position: relative; }
.filter-bar__trigger { }
.filter-bar__trigger[aria-expanded="true"] { }
```

### Utility Classes (`_utilities.scss`)

Review the utilities file for common patterns.

**Expected Utilities:**
- `.visually-hidden` - Screen reader only content
- `.truncate` - Text truncation
- `.flex`, `.grid` - Layout utilities
- `.mt-*`, `.mb-*` - Margin utilities

## CSS Best Practices

### Good Practices ✅

1. **CSS Custom Properties for Theming**
```scss
color: var(--color-text-primary);
background: var(--color-surface);
```

2. **Logical Properties (Opportunity)**
```scss
// Current
padding-left: var(--spacing-md);

// Modern alternative
padding-inline-start: var(--spacing-md);
```

3. **Modern CSS Features**
```scss
.page-content {
  min-height: calc(100vh - var(--nav-height) - 120px);  // ✅ calc()
}

.container {
  padding: 0 min(5vw, var(--grid-margin));  // ✅ min()
}
```

### Issues Found

**Issue #4: Inline Styles in Templates**
Location: Various Jekyll templates
```html
<p style="font-size: var(--text-sm); color: var(--color-text-secondary);">
```

**Recommendation:** Create utility classes or move to CSS.

**Issue #5: Missing Focus Styles**
Some interactive elements lack visible focus indicators.

```scss
// Current: Implicit or missing
.button:focus { outline: none; }  // ❌ Removes accessibility

// Recommended
.button:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

**Issue #6: Print Styles Missing**
No `@media print` styles defined.

```scss
@media print {
  .primary-nav,
  .footer,
  .mobile-nav {
    display: none;
  }
  
  .container {
    max-width: 100%;
    padding: 0;
  }
  
  a[href]::after {
    content: " (" attr(href) ")";
  }
}
```

## Electron App Styling

### Renderer Styles (`electron/src/renderer/index.html`)

The Electron app has inline styles:
```html
<style>
  /* Inline styles for CMS */
</style>
```

**Recommendation:** Extract to separate CSS file or use CSS-in-JS for component styling.

## Sass Features Usage

### Used Features
- Variables (via CSS custom properties)
- Nesting
- Partials
- Parent selector (&)

### Underutilized Features
- Mixins for responsive design
- Functions for calculations
- Maps for design tokens
- `@extend` for style inheritance

### Recommended Additions

**Responsive Mixins:**
```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'small' {
    @media (max-width: 640px) { @content; }
  }
  @else if $breakpoint == 'medium' {
    @media (max-width: 768px) { @content; }
  }
  // ...
}
```

**Color Function:**
```scss
@function tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}

@function shade($color, $percentage) {
  @return mix(black, $color, $percentage);
}
```

**Spacing Function:**
```scss
@function space($multiplier) {
  @return calc(var(--spacing-unit) * #{$multiplier});
}
```

## Performance Considerations

### Bundle Size
- No CSS purging configured
- Entire stylesheet loaded on every page
- No critical CSS extraction

### Recommendations

1. **Add PurgeCSS for Production**
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./_site/**/*.html'],
      safelist: ['is-active', 'is-selected', /^status-/]
    })
  ]
};
```

2. **Consider Critical CSS**
Extract above-the-fold styles for faster perceived load.

3. **Add CSS Minification**
```yaml
# _config.yml
sass:
  style: compressed
```

## Linting

### Current State
No CSS/SCSS linting configured.

### Recommended: Stylelint

```json
// .stylelintrc.json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
    "max-nesting-depth": 3,
    "selector-max-specificity": "0,3,0"
  }
}
```

## Recommendations Summary

### High Priority
1. Add Stylelint for consistency
2. Create responsive breakpoint mixins
3. Add focus-visible styles for accessibility
4. Remove inline styles from templates

### Medium Priority
1. Add print styles
2. Configure PurgeCSS for production
3. Reduce selector nesting depth
4. Create utility classes for common patterns

### Low Priority
1. Add CSS custom properties for dark mode toggle
2. Implement logical properties for RTL support
3. Create color functions for consistent palettes
4. Add CSS-in-JS or scoped styles for Electron

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Partials | 12 | - |
| Max nesting | 4-5 | 3 |
| Inline styles | Several | 0 |
| Specificity issues | Few | 0 |
| Print styles | None | Present |

## Conclusion

The CSS architecture is well-organized and follows a clear design system. The main opportunities are:

1. Adding linting for consistency
2. Creating reusable mixins for responsive design
3. Improving accessibility with focus styles
4. Optimizing for production with purging and minification

The Bauhaus design system is consistently implemented and provides a solid foundation for the visual design.
