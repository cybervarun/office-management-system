// Tests for the script-level guard rails introduced in audit item #1.
// These do NOT require a live database — they exercise the early-exit
// branches in create_admin.js by stubbing the DB module via a preload script.
//
// All tests run in child processes with --require stub_preload.js so that
// the pg and db modules are intercepted without needing a real database.

const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT_PATH = path.resolve(__dirname, '..', 'create_admin.js');
const PRELOAD_PATH = path.resolve(__dirname, 'stub_preload.js');

const runScript = (env = {}, args = []) => {
  let stdout = '';
  let stderr = '';
  let code = 0;
  try {
    stdout = execFileSync(process.execPath, ['--require', PRELOAD_PATH, SCRIPT_PATH, ...args], {
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 10000
    });
  } catch (err) {
    stdout = err.stdout ? err.stdout.toString() : '';
    stderr = err.stderr ? err.stderr.toString() : '';
    code = err.status || 1;
  }
  return { stdout, stderr, code };
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
};

const tests = [
  {
    name: 'refuses to run with no password and no --reset flag',
    run: () => {
      const { stderr, code } = runScript({ ADMIN_PASSWORD: '' });
      assert(code === 1, 'expected exit code 1, got ' + code);
      assert(/Refusing to run/.test(stderr), 'expected refusal message on stderr, got: ' + stderr);
      assert(!/admin@local/.test(stderr + 'dummy'), 'should not reveal default credentials');
    }
  },
  {
    name: 'refuses short ADMIN_PASSWORD',
    run: () => {
      const { stderr, code } = runScript({ ADMIN_PASSWORD: 'short' });
      assert(code === 1, 'expected exit code 1');
      assert(/Refusing to run/.test(stderr), 'expected refusal message');
    }
  },
  {
    name: 'refuses non-Admin role',
    run: () => {
      const { stderr, code } = runScript({ ADMIN_PASSWORD: 'longenoughpassword', ADMIN_ROLE: 'Help Desk' });
      assert(code === 1, 'expected exit code 1');
      assert(/role must be "Admin"/.test(stderr), 'expected role guard message');
    }
  },
  {
    name: 'env-var path: does NOT print the password',
    run: () => {
      const pw = 'env-var-password-123';
      const { stdout, code } = runScript({ ADMIN_PASSWORD: pw });
      assert(code === 0, 'expected exit code 0, got ' + code);
      assert(!stdout.includes(pw), 'password was leaked to stdout: ' + stdout);
      assert(/Password was supplied via env var/.test(stdout), 'expected non-leak confirmation, got: ' + stdout);
    }
  },
  {
    name: '--reset mode: prints a one-time password and a fingerprint',
    run: () => {
      const { stdout, code } = runScript({}, ['--reset']);
      assert(code === 0, 'expected exit code 0, got ' + code);
      assert(/ONE-TIME PASSWORD/.test(stdout), 'expected one-time-password line, got: ' + stdout);
      const match = stdout.match(/ONE-TIME PASSWORD .*?:\s+(\S+)/);
      assert(match && match[1].length >= 20, 'expected a >=20 char password');
      assert(/password fingerprint: [0-9a-f]{8}/.test(stdout), 'expected fingerprint, got: ' + stdout);
    }
  }
];

let failed = 0;
for (const t of tests) {
  try {
    t.run();
    console.log('  PASS  ' + t.name);
  } catch (err) {
    failed++;
    console.log('  FAIL  ' + t.name);
    console.log('        ' + err.message);
  }
}

if (failed > 0) {
  console.log(`\n${failed}/${tests.length} test(s) failed`);
  process.exit(1);
} else {
  console.log(`\nAll ${tests.length} test(s) passed`);
}
