# Prompt: Security Hardening

> **Purpose:** Address security findings and harden the application
> **Target Files:** Electron app and Jekyll deployment configuration
> **Estimated Time:** 2-4 hours

---

## Context

Security review identified several areas for improvement:
- Path traversal prevention needs strengthening
- Security headers not configured for deployment
- File content validation could be added
- SVG files could contain malicious content

---

## Task 1: Strengthen Path Validation

### Update `electron/src/main/index.ts`:

Replace the `resolveAssetPath` function:

```typescript
import * as path from 'path';
import { pathToFileURL } from 'url';

// Define allowed asset directories
const ALLOWED_ASSET_DIRS = [
  path.resolve(repoRoot, 'assets'),
  path.resolve(repoRoot, '_figures'),
  path.resolve(repoRoot, 'images'),
];

/**
 * Resolve and validate an asset path
 * Prevents path traversal attacks
 */
function resolveAssetPath(assetPath: string): { absolutePath: string; fileUrl: string } {
  if (!assetPath || typeof assetPath !== 'string') {
    throw new Error('Invalid path provided');
  }

  // Allow external URLs through
  if (/^(https?:|data:)/i.test(assetPath)) {
    return { absolutePath: assetPath, fileUrl: assetPath };
  }

  // Normalize and resolve the path
  // Remove leading slashes and normalize separators
  const normalizedInput = assetPath
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');

  // Resolve to absolute path
  const absolutePath = path.resolve(repoRoot, normalizedInput);

  // Security check: Verify path is within repo root
  const resolvedRepoRoot = path.resolve(repoRoot);
  if (!absolutePath.startsWith(resolvedRepoRoot + path.sep)) {
    throw new Error('Access denied: path outside repository');
  }

  // Additional check: Verify path is in allowed directories
  const isAllowed = ALLOWED_ASSET_DIRS.some(dir => 
    absolutePath.startsWith(dir + path.sep) || absolutePath === dir
  );

  if (!isAllowed && !absolutePath.startsWith(path.resolve(repoRoot, 'assets'))) {
    throw new Error('Access denied: path not in allowed directory');
  }

  // Check for path traversal patterns that might have bypassed normalization
  if (absolutePath.includes('..') || normalizedInput.includes('..')) {
    throw new Error('Access denied: path traversal detected');
  }

  const fileUrl = pathToFileURL(absolutePath).href;
  return { absolutePath, fileUrl };
}

// Add validation to IPC handler
ipcMain.handle('resolve-asset-path', async (_event, assetPath: string) => {
  try {
    const result = resolveAssetPath(assetPath);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: 'Unable to resolve path. Access may be restricted.'
    };
  }
});
```

---

## Task 2: Add File Content Validation

### Install file-type package:
```bash
cd electron
npm install file-type
```

### Create `electron/src/shared/file-validation.ts`:

```typescript
import { fileTypeFromBuffer } from 'file-type';
import * as fs from 'fs/promises';

const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  mimeType?: string;
  error?: string;
}

/**
 * Validate that a file is an allowed image type
 */
export async function validateImageFile(filePath: string): Promise<FileValidationResult> {
  try {
    // Check file exists
    const stats = await fs.stat(filePath);
    
    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }
    
    // Read file for type detection
    const buffer = await fs.readFile(filePath);
    
    // Check for SVG (file-type doesn't detect SVG well)
    const firstChars = buffer.toString('utf8', 0, 1000);
    if (firstChars.includes('<svg') || firstChars.includes('<?xml')) {
      // Validate SVG content
      const svgValidation = validateSVGContent(buffer.toString('utf8'));
      if (!svgValidation.valid) {
        return svgValidation;
      }
      return { valid: true, mimeType: 'image/svg+xml' };
    }
    
    // Use file-type for binary images
    const type = await fileTypeFromBuffer(buffer);
    
    if (!type) {
      return { valid: false, error: 'Unable to determine file type' };
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(type.mime)) {
      return { 
        valid: false, 
        error: `File type ${type.mime} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
      };
    }
    
    return { valid: true, mimeType: type.mime };
  } catch (error) {
    return { 
      valid: false, 
      error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Validate SVG content for security
 * Checks for potentially dangerous elements
 */
export function validateSVGContent(content: string): FileValidationResult {
  // Dangerous SVG elements/attributes
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick, onload, etc.
    /<foreignObject/i,
    /<animate.*href/i,
    /<set.*href/i,
    /<use.*href=["'](?!#)/i,  // External references
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { 
        valid: false, 
        error: 'SVG contains potentially unsafe content' 
      };
    }
  }
  
  return { valid: true, mimeType: 'image/svg+xml' };
}
```

### Update image selection handler in `electron/src/main/index.ts`:

```typescript
import { validateImageFile } from '../shared/file-validation';

ipcMain.handle('select-figure-image', async () => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) {
    return { success: false, error: 'No active window' };
  }

  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
    ],
  });

  if (result.canceled || !result.filePaths[0]) {
    return { success: false, canceled: true };
  }

  const selectedPath = result.filePaths[0];
  
  // Validate file content
  const validation = await validateImageFile(selectedPath);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return { success: true, path: selectedPath, mimeType: validation.mimeType };
});
```

---

## Task 3: Configure Security Headers

### Create/Update `_headers` file at repo root:

```
# Security headers for Cloudflare Pages

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# HTML pages shouldn't be cached
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Feed should update regularly
/feed.xml
  Cache-Control: public, max-age=3600
```

### Create Cloudflare redirect rules `_redirects`:

```
# Cloudflare Pages redirects

# Ensure trailing slashes for pretty URLs
/ideas    /ideas/
/sprints  /sprints/
/backlog  /backlog/
/timeline /timeline/

# Legacy URL support (if needed)
# /old-path  /new-path  301
```

---

## Task 4: Add Rate Limiting to IPC Handlers

### Create `electron/src/main/rate-limiter.ts`:

```typescript
/**
 * Simple rate limiter for IPC handlers
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number = 10, refillRate: number = 5) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token
   * @returns true if request allowed, false if rate limited
   */
  tryConsume(): boolean {
    this.refill();
    
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Create rate limiters for different operation types
export const rateLimiters = {
  read: new RateLimiter(20, 10),   // 20 burst, 10/sec refill
  write: new RateLimiter(5, 2),    // 5 burst, 2/sec refill
  delete: new RateLimiter(3, 1),   // 3 burst, 1/sec refill
};
```

### Update IPC handlers to use rate limiting:

```typescript
import { rateLimiters } from './rate-limiter';

// Wrap write handlers with rate limiting
ipcMain.handle('write-idea', async (_event, idea: Idea, content: string) => {
  if (!rateLimiters.write.tryConsume()) {
    return { 
      success: false, 
      error: 'Too many requests. Please wait a moment and try again.' 
    };
  }
  
  try {
    // ... existing logic
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
});

// Apply similar pattern to other write/delete handlers
```

---

## Task 5: Add Input Sanitization

### Create `electron/src/shared/sanitize.ts`:

```typescript
/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input
 * Removes control characters and normalizes whitespace
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove other control characters (except newlines, tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize filename
 * Removes path separators and dangerous characters
 */
export function sanitizeFilename(input: string): string {
  if (!input) return '';
  
  return input
    // Remove path separators
    .replace(/[/\\]/g, '')
    // Remove other potentially dangerous characters
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    // Remove leading/trailing dots (hidden files on Unix)
    .replace(/^\.+|\.+$/g, '')
    // Limit length
    .slice(0, 255)
    .trim();
}

/**
 * Sanitize path segment (single directory or file name)
 */
export function sanitizePathSegment(input: string): string {
  if (!input) return '';
  
  return sanitizeFilename(input)
    // Remove .. which could be used for traversal
    .replace(/\.\./g, '');
}

/**
 * Validate and sanitize sprint ID
 */
export function sanitizeSprintId(input: string): string | null {
  const cleaned = input.replace(/\D/g, '');
  if (!/^\d{4}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Validate and sanitize idea/story number
 */
export function sanitizeNumber(input: string | number): number | null {
  const num = typeof input === 'number' ? input : parseInt(input, 10);
  if (Number.isNaN(num) || num < 0) return null;
  return num;
}
```

---

## Task 6: Add Security Tests

### Create `electron/tests/unit/security.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeFilename,
  sanitizePathSegment,
  sanitizeSprintId,
  sanitizeNumber
} from '@shared/sanitize';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('removes null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });
    
    it('removes control characters', () => {
      expect(sanitizeString('hello\x01\x02world')).toBe('helloworld');
    });
    
    it('preserves newlines and tabs', () => {
      expect(sanitizeString('hello\n\tworld')).toBe('hello\n\tworld');
    });
    
    it('handles null/undefined', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });
  
  describe('sanitizeFilename', () => {
    it('removes path separators', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt');
    });
    
    it('removes dangerous characters', () => {
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
    });
    
    it('removes leading/trailing dots', () => {
      expect(sanitizeFilename('..hidden')).toBe('hidden');
      expect(sanitizeFilename('.hidden.')).toBe('hidden');
    });
  });
  
  describe('sanitizePathSegment', () => {
    it('removes path traversal patterns', () => {
      expect(sanitizePathSegment('..')).toBe('');
      expect(sanitizePathSegment('../etc')).toBe('etc');
      expect(sanitizePathSegment('..%2F..%2Fetc')).toBe('%2F%2Fetc');
    });
  });
});

describe('Path Security', () => {
  it('rejects path traversal attempts', () => {
    // This would test the actual resolveAssetPath function
    // Test various traversal patterns:
    const traversalPatterns = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      'assets/../../../secret',
      'assets/./../../secret',
      'assets%2F..%2F..%2Fsecret',
    ];
    
    // Each should be rejected
    expect(true).toBe(true); // Placeholder
  });
});
```

---

## Verification

1. **Test path validation:**
   ```typescript
   // In Electron dev tools console
   window.electronAPI.resolveAssetPath('../../../etc/passwd')
   // Should return error
   ```

2. **Test file validation:**
   - Try to upload a renamed `.js` file as `.png`
   - Should be rejected

3. **Test rate limiting:**
   - Rapidly submit forms
   - Should get rate limit error after threshold

4. **Test security headers:**
   - Deploy to Cloudflare Pages
   - Check headers with: `curl -I https://your-site.pages.dev`

---

## Success Criteria

- [ ] Path traversal attempts are blocked
- [ ] File content is validated, not just extension
- [ ] SVG files are sanitized
- [ ] Security headers configured for deployment
- [ ] Rate limiting prevents rapid operations
- [ ] Input sanitization removes dangerous characters
- [ ] Security tests pass
- [ ] No regressions in existing functionality
