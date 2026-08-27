const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await wait(1500);
  await page.type('input[type="email"]', 'admin@local');
  await page.type('input[type="password"]', 'SecureAdmin@2024!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.sidebar', { timeout: 10000 });
  await wait(2000);
  console.log('Login: OK');

  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log('Token captured:', !!token);

  // SPA navigation helper
  const navigate = async (url) => {
    await page.evaluate((u) => {
      window.history.pushState({}, '', u);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, url);
    await wait(2500);
  };

  const check = async (name, url, checks) => {
    await navigate(url);
    const text = await page.evaluate(() => document.body.innerText);
    console.log(`\n=== ${name} ===`);
    let allPassed = true;
    for (const [label, expected] of checks) {
      const found = text.includes(expected);
      console.log(`${label}: ${found}`);
      if (!found) allPassed = false;
    }
    return allPassed;
  };

  const results = [];

  // 1–7: Original checks
  results.push(await check('Dashboard', '/', [
    ['Dashboard title', 'Dashboard'],
    ['Total Assets', 'TOTAL ASSETS'],
    ['Recent Assets panel', 'Recent Assets'],
    ['Quick Action: Inventory', 'Inventory'],
    ['Quick Action: Tickets', 'Tickets'],
    ['Quick Action: Raise Ticket', 'Raise Ticket'],
    ['Quick Action: Users', 'Users']
  ]));

  results.push(await check('Inventory', '/inventory', [
    ['Inventory title', 'Inventory'],
    ['Add Asset button', 'Add Asset']
  ]));

  results.push(await check('Tickets', '/tickets', [
    ['Tickets title', 'Tickets'],
    ['Raise Ticket', 'Raise Ticket']
  ]));

  results.push(await check('Users', '/users', [
    ['User Management title', 'User Management'],
    ['Create User button', 'Create User']
  ]));

  results.push(await check('Raise Ticket', '/raise-ticket', [
    ['Ministry select', 'Ministry'],
    ['Department select', 'Department'],
    ['Raise Ticket button', 'Raise Ticket']
  ]));

  results.push(await check('Reports', '/reports', [
    ['Reports title', 'Reports'],
    ['Assets by Status', 'Assets by Status'],
    ['Tickets by Status', 'Tickets by Status'],
    ['Ticket Trend', 'Ticket Creation Trend']
  ]));

  results.push(await check('Settings', '/settings', [
    ['Settings title', 'Settings'],
    ['Notification Preferences', 'Notification Preferences'],
    ['Role Policies', 'Role Policies'],
    ['System Information', 'System Information']
  ]));

  // 8–10: Modal checks
  // View Asset modal
  await navigate('/inventory');
  console.log('\n=== View Asset Modal ===');
  const eyeClicked = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    for (const row of rows) {
      const btns = row.querySelectorAll('button.btn-icon');
      for (const btn of btns) { btn.click(); return true; }
    }
    return false;
  });
  await wait(1500);
  const viewModal = await page.evaluate(() => {
    const b = document.querySelector('.modal-backdrop');
    return b ? { ok: true, hasAssetId: b.innerText.includes('Asset ID') } : { ok: false };
  });
  console.log(`  Modal opened: ${eyeClicked && viewModal.ok}`);
  console.log(`  Has Asset ID field: ${viewModal?.hasAssetId}`);
  results.push(eyeClicked && viewModal?.ok === true);
  // Close
  await page.evaluate(() => { const b = document.querySelector('.modal-backdrop'); if (b) b.click(); });
  await wait(500);

  // Ticket Detail modal
  await navigate('/tickets');
  console.log('\n=== Ticket Detail Modal ===');
  const detailClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) { if (btn.innerText.trim() === 'Detail') { btn.click(); return true; } }
    return false;
  });
  await wait(1500);
  const ticketModal = await page.evaluate(() => {
    const b = document.querySelector('.modal-backdrop');
    return b ? { ok: true, hasTitle: b.innerText.includes('Title') } : { ok: false };
  });
  console.log(`  Modal opened: ${detailClicked && ticketModal.ok}`);
  console.log(`  Has Title field: ${ticketModal?.hasTitle}`);
  results.push(detailClicked && ticketModal?.ok === true);
  await page.evaluate(() => { const b = document.querySelector('.modal-backdrop'); if (b) b.click(); });
  await wait(500);

  // Edit User modal
  await navigate('/users');
  console.log('\n=== Edit User Modal ===');
  const editClicked = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    for (const row of rows) {
      const btns = row.querySelectorAll('button.btn-icon');
      for (const btn of btns) { btn.click(); return true; }
    }
    return false;
  });
  await wait(1500);
  const editModal = await page.evaluate(() => {
    const b = document.querySelector('.modal-backdrop');
    return b ? { ok: true, hasSave: b.innerText.includes('Save Changes') } : { ok: false };
  });
  console.log(`  Modal opened: ${editClicked && editModal.ok}`);
  console.log(`  Has Save Changes button: ${editModal?.hasSave}`);
  results.push(editClicked && editModal?.ok === true);
  await page.evaluate(() => { const b = document.querySelector('.modal-backdrop'); if (b) b.click(); });
  await wait(500);

  // API checks
  console.log('\n=== API CHECKS ===');
  const headers = { 'Authorization': `Bearer ${token}` };

  const res1 = await page.evaluate(async ({ url, headers }) => {
    const r = await fetch(url, { headers });
    return { status: r.status };
  }, { url: 'http://localhost:5000/api/reports', headers });
  console.log('GET /api/reports:', res1.status);

  const res2 = await page.evaluate(async ({ url, headers }) => {
    const r = await fetch(url, { headers });
    return { status: r.status };
  }, { url: 'http://localhost:5000/api/settings', headers });
  console.log('GET /api/settings:', res2.status);

  results.push(res1.status === 200);
  results.push(res2.status === 200);

  const allPassed = results.every(r => r);
  console.log(`\n=== RESULT: ${results.filter(Boolean).length}/${results.length} checks passed ===`);
  await browser.close();
  if (!allPassed) process.exit(1);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
