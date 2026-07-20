const http = require('http');
const data = JSON.stringify({
  ministry: 'Ministry A',
  department: 'Dept X',
  asset_category: 'Laptop',
  asset_description: 'Dell Latitude',
  serial_number: 'SN-12345-TEST',
  asset_user: 'Alice',
  asset_custodian: 'Bob',
  asset_current_status: 'In Use'
  ,
  block_name: 'Main Block',
  floor: '1',
  room: '101',
  workstation: 'WS-01'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/inventory',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJyb2xlIjoiQWRtaW4iLCJuYW1lIjoiRGV2IiwiaWF0IjoxNzc5NzkwMzkzLCJleHAiOjE3Nzk4MTkxOTN9.akRJjlA-p6vYmlv8x3I_OzFPcO_a7LWjq5mMh8eSKs8'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('RESPONSE:', body));
});

req.on('error', (e) => console.error('ERR', e));
req.write(data);
req.end();
