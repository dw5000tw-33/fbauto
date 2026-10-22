/* Bounded cleanup loop. Adapters own DOM details; dry-run never calls deleteItem. */
((global) => {
  'use strict';
  function createRunner(adapter) {
    let stopped = false, running = false;
    const check = () => { if (stopped) throw new Error('STOPPED'); };
    const pause = async ms => { for (let left = ms; left > 0; left -= 100) { check(); await adapter.wait(Math.min(left, 100)); } check(); };
    return {
      stop() { stopped = true; },
      isRunning() { return running; },
      async run(options) {
        if (running) throw new Error('ALREADY_RUNNING');
        running = true; stopped = false;
        const seen = new Set(); let count = 0;
        const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
        const rounds = Math.min(50, Math.max(0, Number(options.scrolls) || 0));
        const min = Math.max(200, Number(options.delayMin) || 1000);
        const max = Math.max(min, Number(options.delayMax) || 2000);
        try {
          for (let round = 0; round <= rounds && count < limit; round++) {
            check(); const items = await adapter.scan(); check();
            for (const item of items) {
              check();
              if (!item.id || seen.has(item.id) || !options.matches(item)) continue;
              seen.add(item.id);
              if (!options.dryRun) { await adapter.deleteItem(item, check, pause); check(); }
              count++; adapter.log(`${options.dryRun ? '預覽候選' : '已完成刪除'} ${count}：${item.title || item.id}`);
              if (count >= limit) break;
              await pause(min + Math.floor(Math.random() * (max - min + 1)));
            }
            if (round < rounds && count < limit) { check(); await adapter.scroll(); await pause(min); }
          }
          return { count, stopped: false, dryRun: !!options.dryRun };
        } catch (error) {
          if (error.message === 'STOPPED') return { count, stopped: true, dryRun: !!options.dryRun };
          throw error;
        } finally { running = false; }
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createRunner };
  else global.WorksCleanup = { createRunner };
})(typeof window !== 'undefined' ? window : globalThis);
