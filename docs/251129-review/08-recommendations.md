# Prioritized Recommendations

## Overview

This document consolidates all findings into a prioritized action plan with estimated effort and impact ratings.

## Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| **P0** | Critical - Security or functionality blockers | Immediate |
| **P1** | High - Significant quality improvements | 1-2 weeks |
| **P2** | Medium - Good improvements | 2-4 weeks |
| **P3** | Low - Nice to have | Future |

## Consolidated Recommendations

### P0 - Critical (None Identified)

No critical security or functionality issues were identified. The codebase is functional and reasonably secure.

---

### P1 - High Priority

#### 1.1 Path Traversal Prevention
**Area:** Security  
**Effort:** 2 hours  
**Impact:** High  

Add proper path validation to prevent directory traversal attacks.

**Location:** `electron/src/main/index.ts`

**Action:**
```typescript
function resolveAssetPath(assetPath: string): { absolutePath: string; fileUrl: string } {
  // ... existing code ...
  
  // Add: Verify path is within allowed directory
  const absolutePath = path.resolve(repoRoot, sanitized);
  if (!absolutePath.startsWith(path.resolve(repoRoot))) {
    throw new Error('Access denied: path outside repository');
  }
  
  // ... rest of code
}
```

**Prompt:** See `prompts/security-hardening.md`

---

#### 1.2 Enable TypeScript Strict Mode
**Area:** Code Quality  
**Effort:** 4-8 hours  
**Impact:** High  

Enable strict mode in all TypeScript configurations.

**Locations:** 
- `electron/tsconfig.json`
- `electron/tsconfig.main.json`
- `electron/tsconfig.preload.json`

**Action:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Prompt:** See `prompts/improve-type-safety.md`

---

#### 1.3 Add ESLint Configuration
**Area:** Code Quality  
**Effort:** 2 hours  
**Impact:** High  

Add ESLint for consistent code style enforcement.

**Action:** Create `.eslintrc.json`:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "root": true
}
```

**Prompt:** See `prompts/add-error-handling.md`

---

#### 1.4 Split Large Renderer File
**Area:** Architecture  
**Effort:** 8-16 hours  
**Impact:** High  

Split `renderer/main.ts` (1577 lines) into focused modules.

**Current:** Single file with all logic
**Target:** 
```
renderer/
├── main.ts           # Entry (~100 lines)
├── state.ts          # State management (~50 lines)
├── api.ts            # IPC calls (~100 lines)
├── modal.ts          # Modal logic (~200 lines)
├── forms/
│   ├── idea-form.ts
│   ├── story-form.ts
│   ├── sprint-form.ts
│   ├── update-form.ts
│   └── figure-form.ts
└── utils/
    ├── dom.ts
    └── format.ts
```

**Prompt:** See `prompts/refactor-electron-main.md`

---

#### 1.5 Add Unit Tests for Shared Modules
**Area:** Testing  
**Effort:** 4-8 hours  
**Impact:** High  

Add unit tests for `shared/validation.ts` and `shared/file-utils.ts`.

**Action:**
1. Add Vitest as dev dependency
2. Create `tests/unit/` directory
3. Test all validation functions
4. Test file operations with mocks

**Prompt:** See `prompts/enhance-testing.md`

---

### P2 - Medium Priority

#### 2.1 Add Structured Error Handling
**Area:** Code Quality  
**Effort:** 4 hours  
**Impact:** Medium  

Create consistent error types and handling patterns.

**Action:** Create `shared/errors.ts`:
```typescript
export class ValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join(', '));
    this.name = 'ValidationError';
  }
}

export class FileNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}
```

**Prompt:** See `prompts/add-error-handling.md`

---

#### 2.2 Add Stylelint for CSS
**Area:** Code Quality  
**Effort:** 2 hours  
**Impact:** Medium  

Add CSS/SCSS linting for consistency.

**Action:**
1. Install `stylelint` and `stylelint-config-standard-scss`
2. Create `.stylelintrc.json`
3. Add lint script to package.json

**Prompt:** See `prompts/optimize-css.md`

---

#### 2.3 Configure Security Headers
**Area:** Security  
**Effort:** 1 hour  
**Impact:** Medium  

Add security headers for Cloudflare deployment.

**Action:** Update `_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

**Prompt:** See `prompts/security-hardening.md`

---

#### 2.4 Add IPC Handler Factory
**Area:** Code Quality  
**Effort:** 2 hours  
**Impact:** Medium  

Reduce code duplication in main process.

**Current:** 15+ similar IPC handlers
**Action:** Create wrapper:
```typescript
function createHandler<T>(operation: () => Promise<T>) {
  return async () => {
    try {
      return { success: true, data: await operation() };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };
}
```

**Prompt:** See `prompts/refactor-electron-main.md`

---

#### 2.5 Fix Test Cleanup Patterns
**Area:** Testing  
**Effort:** 2 hours  
**Impact:** Medium  

Move test cleanup to `afterEach` hooks.

**Action:** Refactor all test files to use proper cleanup hooks and fixtures.

**Prompt:** See `prompts/enhance-testing.md`

---

#### 2.6 Add Responsive Breakpoint Mixins
**Area:** CSS  
**Effort:** 2 hours  
**Impact:** Medium  

Create SCSS mixins for consistent breakpoint usage.

**Action:** Add to `_variables.scss`:
```scss
$breakpoints: (
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px
);

@mixin breakpoint($name) {
  @media (max-width: map-get($breakpoints, $name)) {
    @content;
  }
}
```

**Prompt:** See `prompts/optimize-css.md`

---

### P3 - Low Priority

#### 3.1 Add JSDoc Comments
**Area:** Documentation  
**Effort:** 4 hours  
**Impact:** Low  

Add documentation to exported functions.

#### 3.2 Add Print Styles
**Area:** CSS  
**Effort:** 1 hour  
**Impact:** Low  

Add `@media print` styles for pages.

#### 3.3 Add Focus Visible Styles
**Area:** Accessibility  
**Effort:** 2 hours  
**Impact:** Low  

Ensure all interactive elements have visible focus indicators.

#### 3.4 Add Rate Limiting
**Area:** Security  
**Effort:** 2 hours  
**Impact:** Low  

Add rate limiting to IPC write handlers.

#### 3.5 Add Visual Regression Tests
**Area:** Testing  
**Effort:** 4 hours  
**Impact:** Low  

Add Playwright screenshot comparison tests.

#### 3.6 Enable Jekyll Strict Mode
**Area:** Quality  
**Effort:** 1 hour  
**Impact:** Low  

Enable strict front matter and Liquid error modes.

#### 3.7 Add Backup Mechanism
**Area:** Data Safety  
**Effort:** 4 hours  
**Impact:** Low  

Implement file backup before overwrite.

---

## Quick Wins (< 1 Hour Each)

1. **Add `.editorconfig`** - Cross-editor consistency
2. **Add Prettier** - Automated code formatting
3. **Enable Jekyll SASS compression** - Smaller CSS output
4. **Add npm audit to CI** - Automated vulnerability scanning
5. **Remove console.log statements** - Production cleanup

---

## Implementation Roadmap

### Week 1
- [ ] 1.1 Path traversal prevention
- [ ] 1.2 TypeScript strict mode
- [ ] 1.3 ESLint configuration
- [ ] Quick wins

### Week 2
- [ ] 1.4 Split renderer file
- [ ] 2.1 Structured error handling
- [ ] 2.2 Stylelint configuration

### Week 3-4
- [ ] 1.5 Unit tests for shared modules
- [ ] 2.4 IPC handler factory
- [ ] 2.5 Fix test cleanup
- [ ] 2.6 Responsive mixins

### Future
- [ ] P3 items as time permits
- [ ] Continuous improvement based on usage

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| TypeScript `any` usage | ~5 | 0 | Week 1 |
| Test coverage | ~60% | 80% | Week 3 |
| Linting errors | N/A | 0 | Week 1 |
| Security issues | 3 | 0 | Week 1 |
| Large files (>500 lines) | 2 | 0 | Week 2 |

---

## Next Steps

1. Review this document with stakeholders
2. Create issues for tracked items
3. Begin with P1 items in priority order
4. Run code review and security tools after changes
5. Update this document as items are completed
