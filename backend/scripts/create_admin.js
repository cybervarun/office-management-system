const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { executeQuery } = require('../config/db');

const RESET_MODE = process.argv.includes('--reset');

const generateOneTimePassword = () => {
  return crypto.randomBytes(16).toString('base64url');
};

(async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || 'admin@local').trim().toLowerCase();
    const name = process.env.ADMIN_NAME || 'Administrator';
    const role = process.env.ADMIN_ROLE || 'Admin';

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
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    const hash = await bcrypt.hash(password, 12);
    const fingerprint = crypto.createHash('sha256').update(password).digest('hex').slice(0, 8);

    if (exists.rows[0]) {
      const id = exists.rows[0].id;
      await executeQuery(
        'UPDATE users SET password_hash = $1, role = $2, name = $3, is_active = true, updated_at = NOW() WHERE id = $4',
        [hash, role, name, id]
      );
      console.log(`[create_admin] Updated existing admin (${email}) — password fingerprint: ${fingerprint}`);
    } else {
      await executeQuery(
        `INSERT INTO users (name, email, phone, role, password_hash, is_active)
         VALUES ($1, $2, NULL, $3, $4, true)`,
        [name, email, role, hash]
      );
      console.log(`[create_admin] Created admin user ${email} — password fingerprint: ${fingerprint}`);
    }

    if (shouldPrintOtp) {
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
