const sql = require('mssql');
const c = { server: '127.0.0.1', database: 'OfficeManagement', user: 'sa', password: 'Admin123!', options: { trustServerCertificate: true } };
(async () => {
  const pool = await sql.connect(c);
  const r = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'inventory'
    ORDER BY ORDINAL_POSITION
  `);
  r.recordset.forEach(c => console.log(c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE));

  // Check constraints
  const rc = await pool.request().query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_NAME = 'inventory'
  `);
  console.log('\nKey constraints:', JSON.stringify(rc.recordset));
  await sql.close();
})();
