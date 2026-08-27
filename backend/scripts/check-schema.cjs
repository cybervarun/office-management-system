const { Client } = require('pg');
const c = {
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'it_inventory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT || 5432)
};
(async () => {
  const client = new Client(c);
  await client.connect();
  const r = await client.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'inventory'
    ORDER BY ORDINAL_POSITION
  `);
  r.rows.forEach(row => console.log(row.column_name, row.data_type, row.is_nullable));

  const rc = await client.query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_NAME = 'inventory'
  `);
  console.log('\nKey constraints:', JSON.stringify(rc.rows));
  await client.end();
})();
