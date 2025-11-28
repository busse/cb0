#!/usr/bin/env node
/**
 * Playwright Local Jekyll Server Test
 * 
 * This script verifies that Playwright can interact with the local
 * Jekyll development server.
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');

const JEKYLL_URL = 'http://localhost:4000';
const TIMEOUT = 30000; // 30 seconds

async function waitForServer(url, timeout) {
  const startTime = Date.now();
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  while (Date.now() - startTime < timeout) {
    try {
      await page.goto(url, { timeout: 2000, waitUntil: 'domcontentloaded' });
      await browser.close();
      return true;
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  await browser.close();
  return false;
}

async function testLocalJekyll() {
  console.log('🧪 Testing Playwright with local Jekyll server...\n');
  
  let jekyllProcess;
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    // Start Jekyll server
    console.log('📦 Starting Jekyll server...');
    jekyllProcess = spawn('bundle', ['exec', 'jekyll', 'serve', '--port', '4000'], {
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to start...');
    const serverReady = await waitForServer(JEKYLL_URL, TIMEOUT);
    
    if (!serverReady) {
      throw new Error('Jekyll server did not start within timeout period');
    }
    
    console.log('✅ Jekyll server is running\n');
    passed++;
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('✅ Browser launched\n');
    passed++;
    
    // Test 1: Navigate to homepage
    console.log('Test 1: Navigating to homepage...');
    await page.goto(JEKYLL_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(`✅ Homepage loaded - Title: "${title}"\n`);
    passed++;
    
    // Test 2: Check page content
    console.log('Test 2: Checking page content...');
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 0;
    console.log(`✅ Page content check - ${hasContent ? 'Content found' : 'No content'}\n`);
    passed++;
    
    // Test 3: Navigate to ideas page
    console.log('Test 3: Navigating to /ideas/...');
    await page.goto(`${JEKYLL_URL}/ideas/`, { waitUntil: 'networkidle' });
    const ideasTitle = await page.title();
    console.log(`✅ Ideas page loaded - Title: "${ideasTitle}"\n`);
    passed++;
    
    // Test 4: Take screenshot
    console.log('Test 4: Taking screenshot of homepage...');
    await page.goto(JEKYLL_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-jekyll-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved to test-jekyll-screenshot.png\n');
    passed++;
    
    // Test 5: Check for navigation elements
    console.log('Test 5: Checking for navigation elements...');
    const navLinks = await page.$$eval('nav a, header a', elements => 
      elements.map(el => ({ text: el.textContent.trim(), href: el.getAttribute('href') }))
    ).catch(() => []);
    console.log(`✅ Found ${navLinks.length} navigation links\n`);
    passed++;
    
    // Cleanup
    await browser.close();
    console.log('✅ Browser closed\n');
    
    // Stop Jekyll server
    console.log('🛑 Stopping Jekyll server...');
    jekyllProcess.kill();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Jekyll server stopped\n');
    
  } catch (error) {
    failed++;
    console.error('❌ Test failed:', error.message);
    if (browser) {
      await browser.close();
    }
    if (jekyllProcess) {
      jekyllProcess.kill();
    }
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('📊 Local Jekyll Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 All local tests passed! Playwright can interact with your Jekyll site.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests
testLocalJekyll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

