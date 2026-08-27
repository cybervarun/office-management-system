const http = require('http');

const getToken = () => new Promise((resolve, reject) => {
  const data = JSON.stringify({ email: 'admin@local', password: 'Admin@12345678' });
  const req = http.request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body).token));
  });
  req.on('error', reject);
  req.write(data);
  req.end();
});

const api = (token, path) => new Promise((resolve, reject) => {
  const req = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET', headers: { Authorization: `Bearer ${token}` } }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  });
  req.on('error', reject);
  req.end();
});

(async () => {
  const token = await getToken();
  console.log('Token obtained:', token.substring(0, 40) + '...');

  const inv = await api(token, '/api/inventory?page=1&limit=5');
  console.log('\n=== INVENTORY ===');
  console.log('Total:', inv.total, 'Returned:', inv.data?.length);
  if (inv.data?.[0]) console.log('Keys:', Object.keys(inv.data[0]).join(', '));
  if (inv.data?.[0]) console.log('First item:', JSON.stringify(inv.data[0], null, 2).substring(0, 500));

  const tik = await api(token, '/api/tickets?page=1&limit=5');
  console.log('\n=== TICKETS ===');
  console.log('Total:', tik.total, 'Returned:', tik.data?.length);
  if (tik.data?.[0]) console.log('Keys:', Object.keys(tik.data[0]).join(', '));

  const usr = await api(token, '/api/users?page=1&limit=5');
  console.log('\n=== USERS ===');
  console.log('Total:', usr.total, 'Returned:', usr.data?.length);
  if (usr.data?.[0]) console.log('First user:', JSON.stringify(usr.data[0], null, 2).substring(0, 300));

  const dd = await api(token, '/api/inventory/dropdowns');
  console.log('\n=== DROPDOWNS ===');
  console.log('Keys:', Object.keys(dd).join(', '));
  for (const [k, v] of Object.entries(dd)) {
    if (Array.isArray(v)) console.log(`  ${k}: ${v.length} items`);
  }

  const su = await api(token, '/api/tickets/users/search?q=Sar');
  console.log('\n=== SEARCH USERS ===');
  console.log('Result:', JSON.stringify(su));
})();
