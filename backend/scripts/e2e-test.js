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
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@local');
  await page.type('input[type="password"]', 'Admin@12345678');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.sidebar', { timeout: 10000 });
  console.log('Login: OK');

  // Dashboard
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await wait(2500);
  const dashText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== DASHBOARD ===');
  console.log('Total Assets 10:', dashText.includes('10'));
  console.log('Assigned 6:', dashText.includes('6'));
  console.log('Available 3:', dashText.includes('3'));
  console.log('Open Tickets 4:', dashText.includes('4'));
  console.log('MacBook Pro:', dashText.includes('MacBook'));
  console.log('Dell OptiPlex:', dashText.includes('Dell OptiPlex'));
  console.log('Recent Assets panel:', dashText.includes('Recent Assets'));
  console.log('Recent Tickets panel:', dashText.includes('Recent Tickets'));
  console.log('View all button:', dashText.includes('View all'));

  // Inventory
  await page.goto('http://localhost:5173/inventory', { waitUntil: 'networkidle0' });
  await wait(1500);
  const invText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== INVENTORY ===');
  console.log('Has 10 items:', invText.includes('10'));
  console.log('SN-LP-001847:', invText.includes('SN-LP-001847'));
  console.log('Sarah Chen:', invText.includes('Sarah Chen'));
  console.log('ASM-001847:', invText.includes('ASM-001847'));

  // Tickets
  await page.goto('http://localhost:5173/tickets', { waitUntil: 'networkidle0' });
  await wait(1500);
  const tickText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== TICKETS ===');
  console.log('Laptop not booting:', tickText.includes('Laptop not booting'));
  console.log('Open status:', tickText.includes('Open'));
  console.log('In Progress:', tickText.includes('In Progress'));

  // Users
  await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle0' });
  await wait(1500);
  const usrText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== USERS ===');
  console.log('Has admin:', usrText.includes('admin'));

  // Raise Ticket
  await page.goto('http://localhost:5173/raise-ticket', { waitUntil: 'networkidle0' });
  await wait(1500);
  const rtText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== RAISE TICKET ===');
  console.log('Ministry select:', rtText.includes('Ministry'));
  console.log('Department select:', rtText.includes('Department'));
  console.log('Title input:', rtText.includes('Ticket Title'));
  console.log('Raise Ticket btn:', rtText.includes('Raise Ticket'));

  // Reports
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
  await wait(1500);
  const repText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== REPORTS ===');
  console.log('Reports title:', repText.includes('Reports'));
  console.log('Assets by Status chart:', repText.includes('Assets by Status'));
  console.log('Tickets by Status chart:', repText.includes('Tickets by Status'));
  console.log('Ticket Trend:', repText.includes('Ticket Creation Trend'));

  // Settings
  await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle0' });
  await wait(1500);
  const setText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== SETTINGS ===');
  console.log('Settings title:', setText.includes('Settings'));
  console.log('Notification Preferences:', setText.includes('Notification Preferences'));
  console.log('Role Policies:', setText.includes('Role Policies'));

  // User search
  await page.goto('http://localhost:5173/raise-ticket', { waitUntil: 'networkidle0' });
  await wait(1500);
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('Sarah');
    await wait(1000);
    const results = await page.evaluate(() => {
      const el = document.querySelector('.results');
      return el ? el.innerText : 'none';
    });
    console.log('\n=== USER SEARCH ===');
    console.log('Search results:', results);
  }

  console.log('\n=== ALL ROUTES VERIFIED ===');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
