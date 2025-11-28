#!/usr/bin/env node
/**
 * Playwright MCP Verification Test
 * 
 * This script verifies that Playwright is installed and can perform
 * basic browser automation tasks.
 */

const { chromium } = require('playwright');

async function testPlaywright() {
  console.log('🧪 Starting Playwright MCP verification tests...\n');
  
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Launch browser
    console.log('Test 1: Launching browser...');
    browser = await chromium.launch({ headless: true });
    console.log('✅ Browser launched successfully\n');
    passed++;
    
    // Test 2: Create context
    console.log('Test 2: Creating browser context...');
    const context = await browser.newContext();
    console.log('✅ Browser context created successfully\n');
    passed++;
    
    // Test 3: Create page
    console.log('Test 3: Creating new page...');
    const page = await context.newPage();
    console.log('✅ Page created successfully\n');
    passed++;
    
    // Test 4: Navigate to a test page
    console.log('Test 4: Navigating to test page...');
    await page.goto('https://example.com', { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(`✅ Navigation successful - Page title: "${title}"\n`);
    passed++;
    
    // Test 5: Take screenshot
    console.log('Test 5: Taking screenshot...');
    const screenshot = await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✅ Screenshot captured successfully\n');
    passed++;
    
    // Test 6: Evaluate JavaScript
    console.log('Test 6: Evaluating JavaScript on page...');
    const url = await page.evaluate(() => window.location.href);
    console.log(`✅ JavaScript evaluation successful - URL: ${url}\n`);
    passed++;
    
    // Test 7: Get page content
    console.log('Test 7: Getting page content...');
    const content = await page.content();
    const contentLength = content.length;
    console.log(`✅ Page content retrieved - ${contentLength} characters\n`);
    passed++;
    
    // Cleanup
    await browser.close();
    console.log('✅ Browser closed successfully\n');
    
  } catch (error) {
    failed++;
    console.error('❌ Test failed:', error.message);
    if (browser) {
      await browser.close();
    }
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Playwright MCP is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests
testPlaywright().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

