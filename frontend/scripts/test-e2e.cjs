const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      consoleLogs.push({ type: msg.type(), text: msg.text().slice(0, 300) });
    }
  });

  // Login via API first, then set localStorage
  const loginResp = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@local', password: '0cASes9gYW4LC4Rd-t9UzQ' })
  });
  const loginData = await loginResp.json();
  console.log('API Login:', loginResp.status, 'token:', loginData.token ? 'yes' : 'no');

  // Set auth in localStorage
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, loginData.token, loginData.user);

  // Navigate to each route
  const routes = ['/', '/inventory', '/tickets', '/users', '/raise-ticket', '/reports', '/settings'];
  for (const route of routes) {
    try {
      const resp = await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle', timeout: 15000 });
      const content = await page.evaluate(() => document.body.innerText);
      const hasSidebar = content.includes('Dashboard') || content.includes('Inventory') || content.includes('Tickets');
      console.log(route + ' => status=' + resp.status() + ' chars=' + content.length + ' sidebar=' + hasSidebar);
    } catch (e) {
      console.log(route + ' => ERROR: ' + e.message.slice(0, 100));
    }
  }

  // Re-navigate to dashboard to capture console warnings
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Check console
  const keyWarnings = consoleLogs.filter(l => l.text.toLowerCase().includes('key'));
  const errors = consoleLogs.filter(l => l.type === 'error');
  console.log('\n=== CONSOLE ===');
  console.log('Key warnings:', keyWarnings.length);
  console.log('Errors:', errors.length);
  for (const log of consoleLogs.slice(0, 10)) {
    console.log('[' + log.type + '] ' + log.text);
  }

  // Test login flow
  console.log('\n=== LOGIN FLOW ===');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const formInfo = await page.evaluate(() => {
    return {
      emailCount: document.querySelectorAll('input[type="email"]').length,
      passwordCount: document.querySelectorAll('input[type="password"]').length,
      submitCount: document.querySelectorAll('button[type="submit"]').length,
      formCount: document.querySelectorAll('form').length,
      bodyText: document.body.innerText.slice(0, 200)
    };
  });
  console.log('Form elements:', JSON.stringify(formInfo));

  if (formInfo.emailCount > 0) {
    // Try wrong password first
    await page.fill('input[type="email"]', 'admin@local');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const afterWrong = await page.evaluate(() => document.body.innerText);
    console.log('Wrong password shows error:', afterWrong.toLowerCase().includes('invalid') || afterWrong.toLowerCase().includes('failed'));

    // Try correct password
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'admin@local');
    await page.fill('input[type="password"]', '0cASes9gYW4LC4Rd-t9UzQ');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const afterLogin = await page.evaluate(() => ({
      url: window.location.href,
      text: document.body.innerText.slice(0, 200)
    }));
    console.log('After login URL:', afterLogin.url);
    console.log('Redirected:', !afterLogin.url.includes('/login'));
    console.log('Has sidebar:', afterLogin.text.includes('Dashboard') || afterLogin.text.includes('Inventory'));
  } else {
    console.log('No form inputs found - checking page content');
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page text:', pageText.slice(0, 300));
  }

  await browser.close();
  console.log('\n=== ALL E2E TESTS COMPLETE ===');
})();
