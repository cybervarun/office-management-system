/**
 * Jest config for the integration test suite.
 * - Uses the Node runner (no browser)
 * - Seeds DB once before all tests
 * - Cleans up test data after each spec file
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  globalSetup: '<rootDir>/jest-setup.js',
  globalTeardown: '<rootDir>/tests/integration/teardown.js',
  testTimeout: 15000,
  forceExit: true,
  maxWorkers: 1,
  verbose: true,
  clearMocks: true,
  resetModules: true
};
