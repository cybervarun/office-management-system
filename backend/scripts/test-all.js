const http = require('http');

async function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {}
    };
    if (payload) {
      opts.headers['Content-Type'] = 'application/json';
    }
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
  const token = login.body.token;
  const auth = { Authorization: 'Bearer ' + token };
  console.log('Login OK, token:', token.slice(0, 30) + '...');

  // 1. Dashboard
  const dash = await request('GET', '/api/dashboard', null);
  console.log('\n[1] Dashboard:', dash.status, '- assets:', dash.body.totalAssets, 'tickets:', dash.body.openTickets);

  // 2. Inventory list
  const inv = await request('GET', '/api/inventory?page=1&pageSize=5', null);
  console.log('[2] Inventory:', inv.status, '- items:', inv.body.data?.length, 'total:', inv.body.pagination?.total);

  // 3. Inventory dropdowns
  const dd = await request('GET', '/api/inventory/dropdowns', null);
  console.log('[3] Dropdowns:', dd.status, '- fields:', dd.body ? Object.keys(dd.body).length : 'N/A');

  // 4. Tickets list
  const tkt = await request('GET', '/api/tickets?page=1&pageSize=5', null);
  console.log('[4] Tickets:', tkt.status, '- items:', tkt.body.data?.length, 'total:', tkt.body.pagination?.total);

  // 5. Users list
  const usr = await request('GET', '/api/users', null);
  console.log('[5] Users:', usr.status, '- count:', usr.body?.data?.length || usr.body?.length || 'N/A');

  // 6. Create user
  const createUser = await request('POST', '/api/users', { name: 'Test User', email: 'test@example.com', phone: '9876543210', role: 'IT Team', password: 'Test@123' });
  console.log('[6] Create user:', createUser.status, JSON.stringify(createUser.body).slice(0, 200));

  // 7. Edit user
  const editUser = await request('PATCH', '/api/users/1', { name: 'Administrator Updated' });
  console.log('[7] Edit user:', editUser.status, JSON.stringify(editUser.body).slice(0, 200));

  // 8. Create asset
  const createAsset = await request('POST', '/api/inventory', {
    asset_category: 'Laptop',
    asset_description: 'Test Laptop',
    asset_user: 'Test User',
    asset_current_status: 'Available',
    mdo_location: 'Test Location',
    ministry: 'Test Ministry',
    department: 'Test Dept',
    division: 'Test Division'
  });
  console.log('[8] Create asset:', createAsset.status, JSON.stringify(createAsset.body).slice(0, 300));

  // 9. Create ticket
  const createTicket = await request('POST', '/api/tickets', {
    title: 'Test ticket from API',
    description: 'Test description for validation'
  });
  console.log('[9] Create ticket:', createTicket.status, JSON.stringify(createTicket.body).slice(0, 300));

  // 10. Update ticket status
  const updateStatus = await request('PATCH', '/api/tickets/7/status', { status: 'In Progress' });
  console.log('[10] Update status:', updateStatus.status, JSON.stringify(updateStatus.body).slice(0, 200));

  // 11. Transfer ticket
  const transfer = await request('POST', '/api/tickets/7/transfer', { to_team: 'IT Team', note: 'Transferred via API test' });
  console.log('[11] Transfer:', transfer.status, JSON.stringify(transfer.body).slice(0, 200));

  // 12. Add work notes
  const notes = await request('PATCH', '/api/tickets/7/notes', { work_notes: 'Added via API test' });
  console.log('[12] Add notes:', notes.status, JSON.stringify(notes.body).slice(0, 200));

  // 13. Delete ticket (first get ID of created ticket)
  const tickets = await request('GET', '/api/tickets?page=1&pageSize=20', null);
  const newTicket = tickets.body.data.find(t => t.title === 'Test ticket from API');
  if (newTicket) {
    const delTicket = await request('DELETE', '/api/tickets/' + newTicket.id, null);
    console.log('[13] Delete ticket:', delTicket.status, JSON.stringify(delTicket.body).slice(0, 200));
  } else {
    console.log('[13] Delete ticket: SKIPPED (ticket not found)');
  }

  // 14. Delete asset (first get ID of created asset)
  const assets = await request('GET', '/api/inventory?page=1&pageSize=20', null);
  const newAsset = assets.body.data.find(a => a.asset_description === 'Test Laptop');
  if (newAsset) {
    const delAsset = await request('DELETE', '/api/inventory/' + newAsset.id, null);
    console.log('[14] Delete asset:', delAsset.status, JSON.stringify(delAsset.body).slice(0, 200));
  } else {
    console.log('[14] Delete asset: SKIPPED (asset not found)');
  }

  // 15. Delete user
  const users = await request('GET', '/api/users', null);
  const testUser = users.body.data?.find(u => u.email === 'test@example.com');
  if (testUser) {
    const delUser = await request('DELETE', '/api/users/' + testUser.id, null);
    console.log('[15] Delete user:', delUser.status, JSON.stringify(delUser.body).slice(0, 200));
  } else {
    console.log('[15] Delete user: SKIPPED (user not found)');
  }

  // 16. Inventory search
  const search = await request('GET', '/api/inventory/search-user?q=Priya', null);
  console.log('[16] Search user:', search.status, '- results:', search.body?.data?.length || search.body?.length || 'N/A');

  // 17. Unauthenticated request
  const unauth = await request('GET', '/api/dashboard', null);
  console.log('[17] Unauth request:', unauth.status, '- should be 401');

  console.log('\n=== ALL API TESTS COMPLETE ===');
}

main().catch(console.error);
