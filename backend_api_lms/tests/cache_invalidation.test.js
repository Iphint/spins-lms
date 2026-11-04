const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const cache = require('../src/utils/cache');

describe('Unified Redis Cache & Dynamic Invalidation Suite', () => {
  beforeEach(async () => {
    await cache.flush();
  });

  it('1. Basic get, set, and del operations', async () => {
    await cache.set('test:key:1', { name: 'Math Class', grade: 7 }, 60);
    const data = await cache.get('test:key:1');
    assert.deepStrictEqual(data, { name: 'Math Class', grade: 7 });

    await cache.del('test:key:1');
    const deleted = await cache.get('test:key:1');
    assert.strictEqual(deleted, null);
  });

  it('2. cache.remember caches on first call and returns cached on second call', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { count: callCount, title: 'Sample Worksheet' };
    };

    const first = await cache.remember('worksheets:detail:WS-1', 60, fetcher);
    assert.strictEqual(first.count, 1);
    assert.strictEqual(callCount, 1);

    const second = await cache.remember('worksheets:detail:WS-1', 60, fetcher);
    assert.strictEqual(second.count, 1);
    assert.strictEqual(callCount, 1); // Not called again!
  });

  it('3. Pattern invalidation (delPattern and delPatterns) deletes matching keys', async () => {
    await cache.set('classes:list:all:all', [{ id: 'CLS-7A' }], 60);
    await cache.set('classes:list:sem1:tch1', [{ id: 'CLS-7B' }], 60);
    await cache.set('classes:detail:CLS-7A', { id: 'CLS-7A', name: '7A' }, 60);
    await cache.set('students:list:CLS-7A', [{ id: 'STD-1' }], 60);
    await cache.set('dashboard:teacher:1', { total: 10 }, 60);

    // Invalidate classes:* and dashboard:*
    await cache.delPatterns(['classes:*', 'dashboard:*']);

    assert.strictEqual(await cache.get('classes:list:all:all'), null);
    assert.strictEqual(await cache.get('classes:list:sem1:tch1'), null);
    assert.strictEqual(await cache.get('classes:detail:CLS-7A'), null);
    assert.strictEqual(await cache.get('dashboard:teacher:1'), null);

    // Unrelated pattern remains intact
    assert.deepStrictEqual(await cache.get('students:list:CLS-7A'), [{ id: 'STD-1' }]);
  });

  it('4. Data mutation flow: invalidate stale lists and immediately cache fresh detail', async () => {
    // 1. Existing cached list and detail
    await cache.set('worksheets:list:CLS-7A:all:all', [{ id: 'WS-1', title: 'Old Title' }], 300);
    await cache.set('worksheets:detail:WS-1', { id: 'WS-1', title: 'Old Title' }, 600);
    await cache.set('student_portal:worksheets:STD-1', [{ id: 'WS-1' }], 300);

    // 2. Simulate Update / Add data mutation
    const updatedWorksheet = { id: 'WS-1', title: 'New Updated Title', maxScore: 100 };

    // Invalidate stale lists/portals and cache new data
    await cache.delPatterns([
      'worksheets:*',
      'submissions:*',
      'student_portal:*',
      'dashboard:*',
    ]);
    await cache.set(`worksheets:detail:${updatedWorksheet.id}`, updatedWorksheet, 600);

    // 3. Stale lists and student portal caches are evicted
    assert.strictEqual(await cache.get('worksheets:list:CLS-7A:all:all'), null);
    assert.strictEqual(await cache.get('student_portal:worksheets:STD-1'), null);

    // 4. Detail contains newly cached data immediately
    const cachedFresh = await cache.get('worksheets:detail:WS-1');
    assert.deepStrictEqual(cachedFresh, updatedWorksheet);
    assert.strictEqual(cachedFresh.title, 'New Updated Title');
  });

  it('5. Delete mutation flow: clear related lists and evict detail', async () => {
    await cache.set('scores:list:STD-1:CLS-7A:all:all', [{ id: 'SCR-1', score: 95 }], 300);
    await cache.set('scores:detail:SCR-1', { id: 'SCR-1', score: 95 }, 600);
    await cache.set('students:detail:STD-1', { id: 'STD-1', averageScore: 95 }, 600);

    // Simulate delete:
    await cache.delPatterns(['scores:*', 'students:*', 'analytics:*', 'dashboard:*']);
    await cache.del('scores:detail:SCR-1');

    assert.strictEqual(await cache.get('scores:list:STD-1:CLS-7A:all:all'), null);
    assert.strictEqual(await cache.get('scores:detail:SCR-1'), null);
    assert.strictEqual(await cache.get('students:detail:STD-1'), null);
  });

  it('6. reCache replaces existing cache with new value in one step', async () => {
    await cache.set('semesters:active', { id: 'SEM-1', name: 'Semester 1' }, 300);
    const newActive = { id: 'SEM-2', name: 'Semester 2' };

    await cache.reCache('semesters:active', newActive, 300);
    const result = await cache.get('semesters:active');
    assert.deepStrictEqual(result, newActive);
  });
});
