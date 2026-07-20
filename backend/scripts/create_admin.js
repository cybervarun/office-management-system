const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('../config/db');

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@local';
    const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const name = process.env.ADMIN_NAME || 'Administrator';
    const role = process.env.ADMIN_ROLE || 'Admin';

    // Check if user exists
    const exists = await executeQuery(
      'SELECT id FROM users WHERE email = @email',
      [{ name: 'email', type: sql.NVarChar(255), value: email }]
    );

    const hash = await bcrypt.hash(password, 10);

    if (exists.recordset[0]) {
      const id = exists.recordset[0].id;
      await executeQuery(
        'UPDATE users SET password_hash = @password_hash, role = @role, is_active = 1, updated_at = SYSUTCDATETIME() WHERE id = @id',
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'password_hash', type: sql.NVarChar(255), value: hash },
          { name: 'role', type: sql.NVarChar(50), value: role }
        ]
      );
      console.log(`Updated existing admin (${email})`);
    } else {
      await executeQuery(
        `INSERT INTO users (name, email, phone, role, password_hash, is_active)
         VALUES (@name, @email, NULL, @role, @password_hash, 1)`,
        [
          { name: 'name', type: sql.NVarChar(255), value: name },
          { name: 'email', type: sql.NVarChar(255), value: email },
          { name: 'role', type: sql.NVarChar(50), value: role },
          { name: 'password_hash', type: sql.NVarChar(255), value: hash }
        ]
      );
      console.log(`Created admin user ${email}`);
    }

    console.log('Admin credentials:');
    console.log(`  email: ${email}`);
    console.log(`  password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create/update admin:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
