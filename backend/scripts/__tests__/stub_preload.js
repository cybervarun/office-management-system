// Preload stub for create_admin tests — intercepts pg and db module loads
// in child processes so they don't need a live database.
const Module = require('module');
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'pg') {
    return { Pool: class {}, Client: class {} };
  }
  if (request === '../config/db' || request === './db' || request.endsWith('config/db')) {
    return {
      executeQuery: async () => ({ rows: [] }),
      executeTransaction: async (fn) => fn({ query: async () => ({ rows: [] }) }),
      getPool: async () => ({}),
      logConnectionTarget: () => {}
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};
