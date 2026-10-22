const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRunner } = require('../alpha/cleanup-runner');
test('dry-run respects filters, stable IDs, limit and scroll bounds without deleting', async () => {
  let deletes = 0, scrolls = 0;
  const runner = createRunner({ scan: async () => [{ id: 'a', own: true }, { id: 'a', own: true }, { id: 'b', own: false }, { id: 'c', own: true }], deleteItem: async () => deletes++, scroll: async () => scrolls++, wait: async () => {}, log: () => {} });
  const r = await runner.run({ dryRun: true, limit: 1, scrolls: 3, matches: x => x.own });
  assert.equal(r.count, 1); assert.equal(deletes, 0); assert.equal(scrolls, 0);
  const r2 = await runner.run({ dryRun: true, limit: 10, scrolls: 2, matches: x => x.own });
  assert.equal(r2.count, 2); assert.equal(scrolls, 2); assert.equal(deletes, 0);
});
test('stop during scan prevents deletion and additional scrolling', async () => {
  let deletes = 0, scrolls = 0;
  const runner = createRunner({ scan: async () => { runner.stop(); return [{ id: 'a' }]; }, deleteItem: async () => deletes++, scroll: async () => scrolls++, wait: async () => {}, log: () => {} });
  const r = await runner.run({ limit: 10, scrolls: 3, matches: () => true });
  assert.equal(r.stopped, true); assert.equal(deletes, 0); assert.equal(scrolls, 0);
});
test('stop during multi-step deletion prevents its final action; running resets after failure', async () => {
  let confirms = 0;
  const runner = createRunner({ scan: async () => [{ id: 'a' }], deleteItem: async (item, check, pause) => { await pause(200); check(); confirms++; }, scroll: async () => {}, wait: async () => runner.stop(), log: () => {} });
  assert.equal((await runner.run({ limit: 1, matches: () => true })).stopped, true);
  assert.equal(confirms, 0); assert.equal(runner.isRunning(), false);
});
