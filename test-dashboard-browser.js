const puppeteer = require('playwright');

// Test dashboard with real browser automation
async function testDashboardWithBrowser() {
  console.log('🌐 Testing dashboard with browser automation...');

  const browser = await puppeteer.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Go to dashboard
    console.log('1️⃣ Accessing dashboard...');
    await page.goto('https://peepers.vercel.app/admin/dashboard');

    // Wait for redirect to login
    await page.waitForURL('**/login**', { timeout: 10000 });
    console.log('2️⃣ Redirected to login page');

    // Check if login page loaded
    const loginContent = await page.content();
    if (loginContent.includes('login') || loginContent.includes('Login')) {
      console.log('✅ Login page loaded successfully');
    }

    // For now, just check the page title and URL
    console.log('📍 Current URL:', page.url());
    console.log('📄 Page title:', await page.title());

    // Try to find dashboard elements (if any loaded)
    const dashboardElements = await page.$$('[data-testid*="dashboard"], .dashboard, #dashboard');
    console.log(`📊 Found ${dashboardElements.length} dashboard elements`);

    // Check for any metrics displayed
    const metricsText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let metricsFound = [];
      for (let el of elements) {
        const text = el.textContent || '';
        if (text.includes('R$') || text.includes('pedidos') || text.includes('produtos') || /\d+\.\d+/.test(text)) {
          metricsFound.push(text.trim());
        }
      }
      return metricsFound.slice(0, 10); // First 10 matches
    });

    console.log('💰 Metrics found on page:', metricsText);

  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboardWithBrowser().catch(console.error);