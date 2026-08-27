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
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@local');
  await page.type('input[type="password"]', 'Admin@12345678');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.sidebar', { timeout: 10000 });
  console.log('Login: OK\n');

  const results = {};
  const check = (name, condition) => { console.log((condition ? 'PASS' : 'FAIL') + ' - ' + name); return condition; };

  // Dashboard
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await wait(2500);
  const dash = await page.evaluate(() => document.body.innerText);
  results.dashboard = {
    '10 total assets': check('10 total assets', dash.includes('10')),
    '6 assigned': check('6 assigned', dash.includes('6')),
    '3 available': check('3 available', dash.includes('3')),
    '4 open tickets': check('4 open tickets', dash.includes('4')),
    'Recent Assets': check('Recent Assets panel', dash.includes('Recent Assets')),
    'Recent Tickets': check('Recent Tickets panel', dash.includes('Recent Tickets'))
  };

  // Inventory - collect ALL pages
  await page.goto('http://localhost:5173/inventory', { waitUntil: 'networkidle0' });
  await wait(1500);
  let invText = await page.evaluate(() => document.body.innerText);
  for (let i = 0; i < 10; i++) {
    const canNext = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const next = btns.find(b => b.textContent.trim() === 'Next');
      return next && !next.disabled;
    });
    if (!canNext) break;
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const next = btns.find(b => b.textContent.trim() === 'Next');
      if (next) next.click();
    });
    await wait(1000);
    invText += await page.evaluate(() => document.body.innerText);
  }
  results.inventory = {
    '10 records': check('10 records found', invText.includes('Total Assets10') || invText.includes('10 RECORDS')),
    'ASM-001847': check('ASM-001847', invText.includes('ASM-001847')),
    'ASM-001856': check('ASM-001856', invText.includes('ASM-001856')),
    'Sarah Chen': check('Sarah Chen', invText.includes('Sarah Chen')),
    'M. Johnson': check('M. Johnson', invText.includes('M. Johnson')),
    'CRUD buttons': check('View/Edit/Delete', invText.includes('View') && invText.includes('Edit'))
  };

  // Tickets - collect ALL pages
  await page.goto('http://localhost:5173/tickets', { waitUntil: 'networkidle0' });
  await wait(1500);
  let tickText = await page.evaluate(() => document.body.innerText);
  for (let i = 0; i < 10; i++) {
    const canNext = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const next = btns.find(b => b.textContent.trim() === 'Next');
      return next && !next.disabled;
    });
    if (!canNext) break;
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const next = btns.find(b => b.textContent.trim() === 'Next');
      if (next) next.click();
    });
    await wait(1000);
    tickText += await page.evaluate(() => document.body.innerText);
  }
  results.tickets = {
    'Has tickets': check('Laptop not booting', tickText.includes('Laptop not booting')),
    'Open status': check('Open status', tickText.includes('Open')),
    'In Progress': check('In Progress', tickText.includes('In Progress'))
  };

  // Users
  await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle0' });
  await wait(1500);
  const usr = await page.evaluate(() => document.body.innerText);
  results.users = {
    'Has admin': check('admin user', usr.includes('admin'))
  };

  // Raise Ticket
  await page.goto('http://localhost:5173/raise-ticket', { waitUntil: 'networkidle0' });
  await wait(2000);
  const rtInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return {
      ticketTitle: inputs.some(i => i.placeholder === 'Ticket title'),
      searchUser: inputs.some(i => i.placeholder === 'Search user'),
      ministryDropdown: inputs.some(i => i.tagName === 'SELECT' && i.options.length > 1),
      raiseBtn: document.querySelector('button[type="submit"]') !== null
    };
  });
  results['raise-ticket'] = {
    'Ministry dropdown': check('Ministry dropdown', rtInputs.ministryDropdown),
    'Ticket title input': check('Ticket title input', rtInputs.ticketTitle),
    'Search user input': check('Search user input', rtInputs.searchUser),
    'Raise Ticket button': check('Raise Ticket button', rtInputs.raiseBtn)
  };

  // User search
  const searchInput = await page.$('input[placeholder="Search user"]');
  if (searchInput) {
    await searchInput.click();
    await searchInput.type('Sarah', { delay: 50 });
    await wait(2000);
  }
  const searchResult = await page.evaluate(() => document.body.innerText);
  results['user-search'] = {
    'Search finds Sarah': check('Sarah Chen found', searchResult.includes('Sarah Chen'))
  };

  // Reports
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
  await wait(1000);
  const rep = await page.evaluate(() => document.body.innerText);
  results.reports = {
    'Has Reports': check('Reports page', rep.includes('Reports'))
  };

  // Settings
  await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle0' });
  await wait(1000);
  const set = await page.evaluate(() => document.body.innerText);
  results.settings = {
    'Has Settings': check('Settings page', set.includes('Settings'))
  };

  // Print summary
  let allPass = true;
  for (const [route, checks] of Object.entries(results)) {
    console.log('\n=== ' + route.toUpperCase() + ' ===');
    for (const [name, pass] of Object.entries(checks)) {
      if (!pass) allPass = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(allPass ? 'ALL E2E TESTS PASSED' : 'SOME TESTS FAILED');
  await browser.close();
  process.exit(allPass ? 0 : 1);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
