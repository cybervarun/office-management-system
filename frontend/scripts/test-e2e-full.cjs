const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text().slice(0, 300) }));
  page.on('pageerror', err => logs.push({ type: 'error', text: err.message }));

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'admin@local');
  await page.fill('input[type="password"]', '0cASes9gYW4LC4Rd-t9UzQ');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Check dashboard
  let text = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard => chars=' + text.length + ' hasContent=' + (text.length > 100));

  // Get nav links and click through
  const links = await page.$$eval('nav.sidebar-nav a', els =>
    els.map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }))
  );
  console.log('Nav links:', links.map(l => l.text).join(', '));

  for (const link of links) {
    if (link.href === '/' || link.href === 'http://localhost:5173/') continue;
    await page.click('nav.sidebar-nav a[href="' + link.href + '"]');
    await page.waitForTimeout(2000);
    text = await page.evaluate(() => document.body.innerText);
    console.log(link.text + ' => chars=' + text.length + ' hasContent=' + (text.length > 100));
  }

  // Check console
  const warnings = logs.filter(l => l.type === 'warning');
  const errors = logs.filter(l => l.type === 'error');
  console.log('\nWarnings:', warnings.length);
  for (const w of warnings) console.log('WARN:', w.text.slice(0, 200));
  console.log('Errors:', errors.length);
  for (const e of errors.slice(0, 5)) console.log('ERR:', e.text.slice(0, 200));

  await browser.close();
  console.log('\n=== E2E COMPLETE ===');
})();
