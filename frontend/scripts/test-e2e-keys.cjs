const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      logs.push({ type: msg.type(), text: msg.text().slice(0, 300) });
    }
  });
  page.on('pageerror', err => logs.push({ type: 'error', text: err.message }));

  // Login first
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'admin@local');
  await page.fill('input[type="password"]', '0cASes9gYW4LC4Rd-t9UzQ');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Check console logs so far
  console.log('Logs after login+dashboard:', logs.length);
  for (const l of logs) console.log(l.type + ':', l.text.slice(0, 200));

  // Check DOM for tr elements
  const trKeys = await page.$$eval('tbody tr', els => els.map((el, i) => ({
    index: i,
    text: el.textContent.slice(0, 50)
  })));
  console.log('TR elements:', JSON.stringify(trKeys, null, 2));

  // Check DOM for activity items
  const divKeys = await page.$$eval('.activity-item', els => els.map((el, i) => ({
    index: i,
    text: el.textContent.slice(0, 50)
  })));
  console.log('Activity items:', JSON.stringify(divKeys, null, 2));

  // Now navigate to inventory and back to dashboard to trigger re-render
  await page.goto('http://localhost:5173/inventory', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('Logs after inventory:', logs.length);

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);
  console.log('Logs after dashboard revisit:', logs.length);
  for (const l of logs) console.log(l.type + ':', l.text.slice(0, 200));

  await browser.close();
  console.log('\n=== DONE ===');
})();
