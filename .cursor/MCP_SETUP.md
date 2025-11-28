# Playwright MCP Setup Guide

This project includes Playwright MCP (Model Context Protocol) server for browser automation capabilities in Cursor.

## Prerequisites

- Node.js 18 or newer
- Cursor IDE

## Installation

The Playwright MCP package has been installed as a dev dependency. To verify:

```bash
npm list @playwright/mcp
```

## Configuration in Cursor

1. Open **Cursor Settings** (⌘, on Mac or Ctrl+, on Windows/Linux)
2. Navigate to **MCP** section
3. Click **Add new MCP Server**
4. Configure with the following:

   **Name:** `playwright`
   
   **Command:** `npm`
   
   **Args:** `run`, `mcp:playwright`
   
   **Working Directory:** `${workspaceFolder}` (or leave empty to use project root)

   Alternatively, you can use the direct npx command:
   
   **Command:** `npx`
   
   **Args:** `@playwright/mcp@latest`

5. Save the configuration
6. Restart Cursor to apply changes

## Verification

✅ **Playwright MCP has been verified and is working correctly!** See [`.cursor/PLAYWRIGHT_VERIFICATION.md`](PLAYWRIGHT_VERIFICATION.md) for detailed test results.

You can also run the verification tests manually:

```bash
# Basic Playwright functionality
node test-playwright.js

# Local Jekyll server integration
node test-playwright-local.js
```

After configuration in Cursor, you can verify the integration by asking Cursor to list available MCP tools. The Playwright MCP server should provide browser automation capabilities including:

- Navigating to URLs
- Taking screenshots
- Interacting with page elements
- Capturing page snapshots
- And more browser automation features

## Usage

Once configured, you can use Playwright MCP tools through Cursor's AI assistant. For example:

- "Take a screenshot of https://example.com"
- "Navigate to the local dev server and check the homepage"
- "Interact with the form on the page"

## Troubleshooting

If the MCP server doesn't appear:

1. Ensure Node.js 18+ is installed: `node --version`
2. Verify the package is installed: `npm list @playwright/mcp`
3. Check Cursor's MCP settings are saved correctly
4. Restart Cursor completely
5. Check Cursor's developer console for MCP connection errors

## Alternative: Global Installation

If you prefer a global installation instead of project-local:

```bash
npm install -g @playwright/mcp
```

Then configure Cursor with:
- **Command:** `npx`
- **Args:** `@playwright/mcp@latest`

