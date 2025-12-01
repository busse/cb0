# Security Review

## Overview

This security review examines the codebase for vulnerabilities, security best practices, and areas for hardening. The project consists of a static Jekyll site and an Electron desktop application.

## Threat Model

| Asset | Threat | Impact | Likelihood |
|-------|--------|--------|------------|
| User content (markdown files) | Data corruption | Medium | Low |
| File system access | Path traversal | High | Low |
| Electron renderer | XSS | High | Low |
| User credentials | Credential exposure | High | N/A (none stored) |

## Electron Security

### Good Practices Implemented ✅

**1. Context Isolation Enabled**
```typescript
// main/index.ts
mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,  // ✅ Disabled
    contextIsolation: true,  // ✅ Enabled
  },
});
```
This prevents renderer from directly accessing Node.js APIs.

**2. Preload Script for IPC Bridge**
```typescript
// main/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  readIdeas: () => ipcRenderer.invoke('read-ideas'),
  // ... controlled API surface
});
```
Only explicitly exposed functions available to renderer.

**3. Input Validation Present**
```typescript
// shared/validation.ts
export function validateIdea(idea: Partial<Idea>): string[] {
  const errors: string[] = [];
  if (!isValidIdeaNumber(idea.idea_number)) {
    errors.push('idea_number must be a non-negative integer');
  }
  // ...
}
```
Validation runs before write operations.

### Security Concerns ⚠️

**Issue #1: Path Traversal Risk**

Location: `main/index.ts`
```typescript
function resolveAssetPath(assetPath: string): { absolutePath: string; fileUrl: string } {
  if (!assetPath) {
    throw new Error('No path provided');
  }

  // Check for URL schemes
  if (/^(https?:|file:|data:)/i.test(assetPath)) {
    return { absolutePath: assetPath, fileUrl: assetPath };
  }

  // Sanitization is minimal
  const sanitized = assetPath.replace(/^\/+/, '');
  const absolutePath = path.isAbsolute(assetPath) ? assetPath : path.join(repoRoot, sanitized);
  const fileUrl = pathToFileURL(absolutePath).href;
  return { absolutePath, fileUrl };
}
```

**Risk:** Input like `../../../etc/passwd` could potentially access files outside repo.

**Mitigation:**
```typescript
function resolveAssetPath(assetPath: string): { absolutePath: string; fileUrl: string } {
  if (!assetPath) {
    throw new Error('No path provided');
  }

  if (/^(https?:|file:|data:)/i.test(assetPath)) {
    return { absolutePath: assetPath, fileUrl: assetPath };
  }

  // Remove leading slashes and normalize
  const sanitized = assetPath.replace(/^\/+/, '');
  const absolutePath = path.resolve(repoRoot, sanitized);
  
  // Verify path is within allowed directory
  if (!absolutePath.startsWith(path.resolve(repoRoot))) {
    throw new Error('Access denied: path outside repository');
  }

  const fileUrl = pathToFileURL(absolutePath).href;
  return { absolutePath, fileUrl };
}
```

**Issue #2: File Type Validation**

Location: `main/index.ts`
```typescript
ipcMain.handle('select-figure-image', async () => {
  const result = await dialog.showOpenDialog(window, {
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
    ],
  });
  // Only checks extension, not content
});
```

**Risk:** User could rename malicious file with image extension.

**Mitigation:**
```typescript
import { fileTypeFromBuffer } from 'file-type';

async function validateImageFile(filePath: string): Promise<boolean> {
  const buffer = await fs.readFile(filePath);
  const type = await fileTypeFromBuffer(buffer);
  
  if (!type) return false;
  
  const allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
  return allowedMimes.includes(type.mime);
}
```

**Issue #3: No Request Rate Limiting**

IPC handlers have no rate limiting:
```typescript
ipcMain.handle('write-idea', async (_event, idea: Idea, content: string) => {
  // No rate limiting - could be called rapidly
  await writeIdea(idea, content);
});
```

**Risk:** Rapid file operations could stress system.

**Mitigation:**
```typescript
import { RateLimiter } from 'limiter';

const writeLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'second',
});

ipcMain.handle('write-idea', async (_event, idea: Idea, content: string) => {
  const hasToken = await writeLimiter.removeTokens(1);
  if (!hasToken) {
    return { success: false, error: 'Rate limit exceeded' };
  }
  // ...
});
```

**Issue #4: SVG XSS Risk**

SVG files can contain JavaScript:
```typescript
ipcMain.handle('get-figure-image', async (_event, assetPath: string) => {
  const buffer = await fsPromises.readFile(absolutePath);
  const mimeType = getMimeType(absolutePath);
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
  // SVG with embedded script could execute
});
```

**Mitigation:**
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

function sanitizeSVG(svgContent: string): string {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  return purify.sanitize(svgContent, {
    USE_PROFILES: { svg: true },
    FORBID_TAGS: ['script', 'foreignObject'],
  });
}
```

## Renderer Security

### XSS Prevention

**Good Practice - HTML Escaping:**
```typescript
// renderer/main.ts
function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function escapeAttr(value: string): string {
  return (value ?? '').replace(/"/g, '&quot;');
}
```

**Usage:**
```typescript
listElement.innerHTML = state.ideas
  .map((idea) => `
    <span class="item-title">${escapeHtml(idea.title || 'Untitled')}</span>
  `)
  .join('');
```

**Concern:** HTML templates are built as strings:
```typescript
// Inline HTML in JavaScript
body: `
  <div class="form-field">
    <label>Title</label>
    <input type="text" name="title" value="${escapeAttr(defaults.title)}" />
  </div>
`
```

**Recommendation:** Consider using a template library with automatic escaping.

## Jekyll Security

### Static Site Security ✅

The Jekyll site is static HTML, which limits attack surface:
- No server-side code execution
- No database queries
- No session management

### Cloudflare Headers

**`_headers` file should include:**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'
```

## Data Security

### File System Operations

**Current Implementation:**
```typescript
// shared/file-utils.ts
export async function writeIdea(idea: Idea, content: string): Promise<void> {
  const filePath = path.join(PATHS.ideas, `${idea.idea_number}.md`);
  const cleaned = removeUndefined(idea);
  const frontMatter = matter.stringify(content, cleaned);
  await fs.writeFile(filePath, frontMatter, 'utf-8');
}
```

**Concerns:**
1. No backup before overwrite
2. No atomic writes
3. No file locking

**Recommendations:**
```typescript
import { writeFileAtomic } from 'write-file-atomic';

export async function writeIdea(idea: Idea, content: string): Promise<void> {
  const filePath = path.join(PATHS.ideas, `${idea.idea_number}.md`);
  
  // Create backup
  if (await fileExists(filePath)) {
    await fs.copyFile(filePath, `${filePath}.bak`);
  }
  
  // Atomic write
  await writeFileAtomic(filePath, frontMatter);
}
```

### Delete Operations

**Current:**
```typescript
export async function deleteIdea(ideaNumber: number): Promise<void> {
  const filePath = path.join(PATHS.ideas, `${ideaNumber}.md`);
  await fs.unlink(filePath);  // Permanent deletion
}
```

**Recommendation:** Implement soft delete or recycle bin:
```typescript
export async function deleteIdea(ideaNumber: number): Promise<void> {
  const filePath = path.join(PATHS.ideas, `${ideaNumber}.md`);
  const trashPath = path.join(PATHS.trash, `idea-${ideaNumber}-${Date.now()}.md`);
  
  await fs.mkdir(PATHS.trash, { recursive: true });
  await fs.rename(filePath, trashPath);
}
```

## Dependency Security

### npm Audit

Run regularly:
```bash
npm audit
cd electron && npm audit
```

### Dependency Analysis

| Package | Version | Known Vulnerabilities |
|---------|---------|----------------------|
| electron | ^28.0.0 | Check releases |
| gray-matter | ^4.0.3 | None known |
| js-yaml | ^4.1.0 | None known |

### Recommendations

1. **Pin Exact Versions**
```json
{
  "dependencies": {
    "electron": "28.3.3",  // Exact version
    "gray-matter": "4.0.3"
  }
}
```

2. **Add Security Scanning**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

## Security Checklist

### Electron
- [x] Context isolation enabled
- [x] Node integration disabled
- [x] Preload script for IPC bridge
- [x] Input validation present
- [ ] Path traversal prevention (needs improvement)
- [ ] File content validation
- [ ] Rate limiting
- [ ] SVG sanitization

### Jekyll
- [x] Static output only
- [x] No server-side code
- [ ] Security headers configured
- [ ] CSP policy defined

### General
- [ ] Dependency audit
- [ ] Error messages don't leak paths
- [ ] Backup/recovery mechanism
- [ ] Audit logging

## Recommendations Summary

### High Priority
1. **Add path validation** to prevent directory traversal
2. **Configure security headers** in `_headers`
3. **Run dependency audit** and fix issues

### Medium Priority
1. Implement file content validation for uploads
2. Add rate limiting to IPC handlers
3. Sanitize SVG content
4. Implement atomic file writes

### Low Priority
1. Add soft delete/recycle bin
2. Implement audit logging
3. Add file backup mechanism
4. Consider Content Security Policy for Electron

## Security Testing

### Manual Tests

1. **Path Traversal Test**
```typescript
// Test: resolve-asset-path handler
// Input: '../../../etc/passwd'
// Expected: Error thrown
```

2. **XSS Test**
```typescript
// Test: Create idea with script in title
// Input: '<script>alert(1)</script>'
// Expected: Rendered as text, not executed
```

3. **Large File Test**
```typescript
// Test: Upload very large file
// Expected: Size limit enforced or graceful handling
```

### Automated Security Tests

```typescript
// tests/security/path-traversal.test.ts
test('rejects path traversal attempts', async () => {
  const result = await window.electronAPI.resolveAssetPath('../../../etc/passwd');
  expect(result.success).toBe(false);
  expect(result.error).toContain('Access denied');
});

test('escapes HTML in user content', async () => {
  await createIdea({ title: '<script>alert(1)</script>' });
  const html = document.querySelector('.item-title').innerHTML;
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
});
```

## Conclusion

The codebase demonstrates security-conscious design with proper Electron configuration and input validation. The main areas for improvement are:

1. **Path validation** - Strengthen to prevent directory traversal
2. **File content validation** - Verify uploaded files match expected types
3. **Security headers** - Configure for production deployment
4. **Rate limiting** - Protect against rapid operations

These improvements would bring the security posture from good to excellent.
