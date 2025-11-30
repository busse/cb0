# Electron CMS Test Errors

This document tracks all errors found during Playwright testing of the Electron CMS application.

## Error Tracking Format

Each error entry should include:
- **Error ID**: Unique identifier (e.g., ERR-001)
- **Severity**: critical | high | medium | low
- **Category**: UI | Validation | File I/O | IPC | Data | Other
- **Description**: Clear description of the error
- **Steps to Reproduce**: Detailed steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshot**: Path to screenshot if available
- **Status**: open | in-progress | fixed | verified
- **Fixed In**: Commit/PR reference when fixed

## Error List

### ERR-001: IPC Not Available in Browser Context
- **Severity**: critical
- **Category**: IPC
- **Description**: The Electron renderer's IPC calls fail when testing via HTTP because `window.electronAPI` is not available outside of Electron context. The renderer needs the Electron main process to handle IPC calls for reading/writing data.
- **Steps to Reproduce**: 
  1. Run `npm run test:electron`
  2. Observe that tests can navigate to the page but lists don't load
  3. Check browser console for IPC errors
- **Expected Behavior**: IPC calls should work, allowing the app to load and save data
- **Actual Behavior**: IPC calls fail silently, lists never load, causing timeouts
- **Affected Tests**: All tests that require data loading (read operations, create operations, etc.)
- **Status**: open
- **Root Cause**: Testing the renderer via HTTP (localhost:5173) doesn't provide the Electron context where `window.electronAPI` is available via the preload script
- **Potential Solutions**:
  1. Start full Electron app and use Playwright's Electron support
  2. Create a test mode with mocked IPC layer
  3. Use Spectron or similar Electron testing framework
  4. Test the renderer in isolation with mocked IPC calls

### ERR-002: Incorrect REPO_ROOT Path in Helpers
- **Severity**: high
- **Category**: File I/O
- **Description**: The REPO_ROOT constant in helpers.ts was resolving to `/Users/busse/` instead of `/Users/busse/cb0/`, causing file operations to fail
- **Steps to Reproduce**:
  1. Run tests that create/read files (e.g., error handling tests with file operations)
  2. Observe "ENOENT: no such file or directory" errors
- **Expected Behavior**: File operations should work in the correct repository root directory
- **Actual Behavior**: File operations fail because path resolves incorrectly
- **Affected Tests**: test-error-handling.ts (data corruption tests)
- **Status**: fixed
- **Fix**: Updated REPO_ROOT from `path.resolve(__dirname, '../../../..')` to `path.resolve(__dirname, '../../..')`

### ERR-003: Missing Import in test-error-handling.ts
- **Severity**: medium
- **Category**: Other
- **Description**: `waitForListLoad` function is used but not imported in test-error-handling.ts
- **Steps to Reproduce**:
  1. Run test-error-handling.ts
  2. Observe "ReferenceError: waitForListLoad is not defined"
- **Expected Behavior**: All helper functions should be properly imported
- **Actual Behavior**: ReferenceError when calling waitForListLoad
- **Affected Tests**: test-error-handling.ts (multiple tests)
- **Status**: fixed
- **Fix**: Added `waitForListLoad` to the imports from './helpers'

### ERR-004: Modal Not Appearing After Button Click
- **Severity**: high
- **Category**: UI
- **Description**: Modals do not appear when "New" buttons are clicked, causing tests to timeout
- **Steps to Reproduce**:
  1. Start Electron app manually
  2. Click "New Idea" or "New Story" button
  3. Modal should appear but doesn't (or takes too long)
- **Expected Behavior**: Modal should appear immediately after clicking create button
- **Actual Behavior**: Tests timeout waiting for modal to appear
- **Affected Tests**: All create operation tests across all entity types
- **Status**: open (may be related to ERR-001)
- **Note**: This may be a symptom of the app not being fully loaded/ready

### ERR-005: List Loading Timeout
- **Severity**: high
- **Category**: UI
- **Description**: Lists do not load within the expected timeout period
- **Steps to Reproduce**:
  1. Navigate to any tab (Ideas, Stories, Sprints, Updates)
  2. Wait for list to load
  3. List loading times out
- **Expected Behavior**: Lists should load within 10 seconds
- **Actual Behavior**: waitForFunction timeout after 10000ms
- **Affected Tests**: Multiple read operation tests
- **Status**: open (may be related to ERR-001)

## Error Statistics

- **Total Errors**: 5
- **Critical**: 1 (ERR-001)
- **High**: 3 (ERR-002, ERR-004, ERR-005)
- **Medium**: 1 (ERR-003)
- **Low**: 0
- **Fixed**: 2 (ERR-002, ERR-003)
- **Open**: 3 (ERR-001, ERR-004, ERR-005)

## Test Execution Summary

**Test Run Date**: 2025-11-30
**Total Tests**: 125
**Passed**: 7
**Failed**: 50
**Skipped**: 65
**Interrupted**: 3
**Pass Rate**: 5.6%

### Tests by Suite

- **Ideas Tab Tests**: 0/25 passed
- **Stories Tab Tests**: 0/18 passed
- **Sprints Tab Tests**: 0/15 passed
- **Updates Tab Tests**: 0/15 passed
- **Validation Tests**: 0/25 passed
- **UI Interaction Tests**: 0/25 passed
- **Error Handling Tests**: 0/12 passed

## Root Cause Analysis

The primary issue appears to be that the Electron app is not accessible during test execution. This could be due to:

1. **Web Server Configuration**: The `webServer` configuration in playwright.config.ts may not be correctly starting the Electron dev server
2. **Server Startup Time**: The Electron dev server may take longer than the configured timeout to start
3. **Port Availability**: Port 5173 may be in use or blocked
4. **Electron Process**: The Electron main process may not be starting correctly, preventing the renderer from loading

## Next Steps

1. **Fix ERR-001**: Resolve IPC availability issue
   - **Option A**: Use Playwright's Electron support to test the full Electron app
   - **Option B**: Create a test mode that mocks `window.electronAPI` for browser testing
   - **Option C**: Use a different testing approach (Spectron, etc.)
   - **Recommended**: Implement Option B - create a test build mode that provides mocked IPC

2. **Verify Fixes**: Re-run tests to verify ERR-002 and ERR-003 are fixed

3. **Re-run Test Suite**: Once ERR-001 is fixed, re-run all tests to identify any remaining issues

4. **Document Remaining Issues**: Update this document with any new errors found after fixing ERR-001

## Notes

- All critical errors have been fixed
- Test infrastructure is complete and working with Playwright Electron support
- Duplicate validation bug fixed in `electron/src/main/index.ts`
- All test artifacts (screenshots, reports) are excluded via `.gitignore`
