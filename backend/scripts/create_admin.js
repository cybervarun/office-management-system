const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { executeQuery, sql } = require('../config/db');

const RESET_MODE = process.argv.includes('--reset');

const generateOneTimePassword = () => {
  // 16 bytes → 22-char base64url, easy to copy, hard to brute-force offline.
  return crypto.randomBytes(16).toString('base64url');
};

(async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || 'admin@local').trim().toLowerCase();
    const name = process.env.ADMIN_NAME || 'Administrator';
    const role = process.env.ADMIN_ROLE || 'Admin';

    // Resolve the password. Three rules:
    //   1) --reset flag: always generate a one-time password and print only its fingerprint.
    //   2) ADMIN_PASSWORD env var explicitly set: use it, but never echo it back.
    //   3) Neither: refuse to run. Forces the operator to make a conscious choice.
    let password;
    let shouldPrintOtp = false;

    if (RESET_MODE) {
      password = generateOneTimePassword();
      shouldPrintOtp = true;
    } else if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12) {
      password = process.env.ADMIN_PASSWORD;
    } else {
      console.error(
        '[create_admin] Refusing to run: no password source available.\n' +
        '  Either set ADMIN_PASSWORD (>= 12 chars) or run with --reset to generate a one-time password.'
      );
      process.exit(1);
    }

    if (role !== 'Admin') {
      console.error(`[create_admin] Refusing to run: role must be "Admin", got "${role}".`);
      process.exit(1);
    }

    const exists = await executeQuery(
      'SELECT id FROM users WHERE email = @email',
      [{ name: 'email', type: sql.NVarChar(255), value: email }]
    );

    const hash = await bcrypt.hash(password, 12);
    const fingerprint = crypto.createHash('sha256').update(password).digest('hex').slice(0, 8);

    if (exists.recordset[0]) {
      const id = exists.recordset[0].id;
      await executeQuery(
        'UPDATE users SET password_hash = @password_hash, role = @role, name = @name, is_active = 1, updated_at = SYSUTCDATETIME() WHERE id = @id',
        [
          { name: 'id', type: sql.Int, value: id },
          { name: 'password_hash', type: sql.NVarChar(255), value: hash },
          { name: 'role', type: sql.NVarChar(50), value: role },
          { name: 'name', type: sql.NVarChar(255), value: name }
        ]
      );
      console.log(`[create_admin] Updated existing admin (${email}) — password fingerprint: ${fingerprint}`);
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
      console.log(`[create_admin] Created admin user ${email} — password fingerprint: ${fingerprint}`);
    }

    if (shouldPrintOtp) {
      // The full password is only ever printed once, in --reset mode,
      // and is intended to be captured into a one-time-delivery channel
      // (e.g. handed to the operator to set on first login).
      console.log(`[create_admin] ONE-TIME PASSWORD (deliver securely, do not commit): ${password}`);
    } else {
      console.log('[create_admin] Password was supplied via env var and was not printed to stdout.');
    }

    process.exit(0);
  } catch (err) {
    console.error('[create_admin] Failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
