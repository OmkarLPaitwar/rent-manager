const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to mobile size
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false,
  });
  
  // Open the local app
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Wait for layout
  await page.waitForSelector('.bottom-nav');
  
  // Take screenshot before click
  await page.screenshot({ path: 'screenshot_before.png' });
  
  // Click the "More" button (assumes it's the last item in bottom nav)
  const buttons = await page.$$('.bottom-nav-item');
  if (buttons.length > 0) {
    await buttons[buttons.length - 1].click();
    
    // Wait for the drawer transition
    await new Promise(r => setTimeout(r, 500));
    
    // Take screenshot after click
    await page.screenshot({ path: 'screenshot_after.png' });
    console.log("Screenshots captured successfully.");
  } else {
    console.log("Could not find bottom nav buttons");
  }
  
  await browser.close();
})();
