const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, makeRequest } = require('./helpers');

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
});

describe('Teacher API', () => {
  it('GET /api/teacher should return teacher data', async () => {
    const { status, body } = await makeRequest('/api/teacher');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(body.data);
    assert.strictEqual(body.data.id, 'T001');
    assert.ok(body.data.name);
    assert.strictEqual(body.data.subject, 'Coding & AI / Integrated AI');
  });
});
