const http = require('http');

async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  // Login
  const login = await request('POST', '/api/auth/login', { email: 'admin@local', password: '0cASes9gYW4LC4Rd-t9UzQ' });
  if (!login.body.token) {
    console.log('LOGIN FAILED:', JSON.stringify(login.body));
    return;
  }
  const token = login.body.token;
  console.log('Login OK, token:', token.slice(0, 30) + '...');

  let pass = 0, fail = 0;
  const check = (name, condition) => {
    if (condition) { pass++; console.log('  PASS: ' + name); }
    else { fail++; console.log('  FAIL: ' + name); }
  };

  // 1. Dashboard
  console.log('\n[1] Dashboard');
  const dash = await request('GET', '/api/dashboard', null, token);
  check('status 200', dash.status === 200);
  check('has totalAssets', dash.body.totalAssets !== undefined);
  check('has openTickets', dash.body.openTickets !== undefined);
  check('has recentAssets', Array.isArray(dash.body.recentAssets));
  check('has recentTickets', Array.isArray(dash.body.recentTickets));

  // 2. Inventory list
  console.log('\n[2] Inventory list');
  const inv = await request('GET', '/api/inventory?page=1&pageSize=5', null, token);
  check('status 200', inv.status === 200);
  check('has data array', Array.isArray(inv.body.data));
  check('has pagination', !!inv.body.pagination);
  check('returns 5 items', inv.body.data?.length === 5);

  // 3. Inventory dropdowns
  console.log('\n[3] Inventory dropdowns');
  const dd = await request('GET', '/api/inventory/dropdowns', null, token);
  check('status 200', dd.status === 200);
  check('has dropdown fields', dd.body && typeof dd.body === 'object');

  // 4. Tickets list
  console.log('\n[4] Tickets list');
  const tkt = await request('GET', '/api/tickets?page=1&pageSize=5', null, token);
  check('status 200', tkt.status === 200);
  check('has data array', Array.isArray(tkt.body.data));
  check('has pagination', !!tkt.body.pagination);

  // 5. Users list
  console.log('\n[5] Users list');
  const usr = await request('GET', '/api/users', null, token);
  check('status 200', usr.status === 200);
  check('has users', (usr.body.data?.length || usr.body.length || 0) >= 1);

  // 6. Create user
  console.log('\n[6] Create user');
  const createUser = await request('POST', '/api/users', { name: 'Test User', email: 'test@example.com', phone: '9876543210', role: 'IT Team', password: 'Test@123' }, token);
  check('status 201', createUser.status === 201);
  check('has user id', createUser.body?.id !== undefined);
  check('has email', createUser.body?.email === 'test@example.com');

  // 7. Edit user
  console.log('\n[7] Edit user');
  const editUser = await request('PATCH', '/api/users/1', { name: 'Administrator Updated' }, token);
  check('status 200', editUser.status === 200);
  check('name updated', editUser.body?.name === 'Administrator Updated');

  // 8. Create asset
  console.log('\n[8] Create asset');
  const createAsset = await request('POST', '/api/inventory', {
    asset_category: 'Laptop',
    asset_description: 'Test Laptop',
    asset_user: 'Test User',
    asset_current_status: 'Available',
    mdo_location: 'Test Location',
    ministry: 'Test Ministry',
    department: 'Test Dept',
    division: 'Test Division'
  }, token);
  check('status 201', createAsset.status === 201);
  check('has asset_id', createAsset.body?.asset_id !== undefined);

  // 9. Create ticket
  console.log('\n[9] Create ticket');
  const createTicket = await request('POST', '/api/tickets', {
    title: 'Test ticket from API',
    description: 'Test description for validation'
  }, token);
  check('status 201', createTicket.status === 201);
  check('has ticket id', createTicket.body?.id !== undefined);
  check('status is Open', createTicket.body?.status === 'Open');

  // 10. Get ticket by ID
  console.log('\n[10] Get ticket by ID');
  if (createTicket.body?.id) {
    const getTicket = await request('GET', '/api/tickets/' + createTicket.body.id, null, token);
    check('status 200', getTicket.status === 200);
    check('has history', Array.isArray(getTicket.body?.history));
  } else {
    check('skip (no ticket id)', true);
  }

  // 11. Update ticket status
  console.log('\n[11] Update ticket status');
  const updateStatus = await request('PATCH', '/api/tickets/7/status', { status: 'In Progress' }, token);
  check('status 200', updateStatus.status === 200);
  check('status changed', updateStatus.body?.status === 'In Progress');

  // 12. Transfer ticket
  console.log('\n[12] Transfer ticket');
  const transfer = await request('POST', '/api/tickets/7/transfer', { to_team: 'IT Team', note: 'Transferred via API test' }, token);
  check('status 200', transfer.status === 200);
  check('team changed', transfer.body?.assigned_team === 'IT Team');

  // 13. Add work notes
  console.log('\n[13] Add work notes');
  const notes = await request('PATCH', '/api/tickets/7/notes', { work_notes: 'Added via API test' }, token);
  check('status 200', notes.status === 200);
  check('has notes', notes.body?.work_notes !== null);

  // 14. Delete ticket
  console.log('\n[14] Delete ticket');
  if (createTicket.body?.id) {
    const delTicket = await request('DELETE', '/api/tickets/' + createTicket.body.id, null, token);
    check('status 200', delTicket.status === 200);
    check('has message', delTicket.body?.message === 'Ticket deleted');
  } else {
    check('skip (no ticket id)', true);
  }

  // 15. Delete asset
  console.log('\n[15] Delete asset');
  if (createAsset.body?.id) {
    const delAsset = await request('DELETE', '/api/inventory/' + createAsset.body.id, null, token);
    check('status 200', delAsset.status === 200);
  } else {
    check('skip (no asset id)', true);
  }

  // 16. Delete user
  console.log('\n[16] Delete user');
  const users = await request('GET', '/api/users', null, token);
  const testUser = users.body.data?.find(u => u.email === 'test@example.com');
  if (testUser) {
    const delUser = await request('DELETE', '/api/users/' + testUser.id, null, token);
    check('status 200', delUser.status === 200);
  } else {
    check('skip (no test user)', true);
  }

  // 17. Inventory search
  console.log('\n[17] Inventory search');
  const search = await request('GET', '/api/inventory/search-user?q=Priya', null, token);
  check('status 200', search.status === 200);
  check('has results', search.body?.data?.length >= 0);

  // 18. Unauthenticated request
  console.log('\n[18] Unauthenticated request');
  const unauth = await request('GET', '/api/dashboard', null, null);
  check('returns 401', unauth.status === 401);

  // 19. Invalid token
  console.log('\n[19] Invalid token');
  const invalid = await request('GET', '/api/dashboard', null, 'invalid-token');
  check('returns 401', invalid.status === 401);

  console.log('\n=== RESULTS: ' + pass + ' passed, ' + fail + ' failed ===');
  if (fail > 0) process.exit(1);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
