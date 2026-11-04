const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, makeRequest, loginAs } = require('./helpers');
const prisma = require('../src/config/database');

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
});

describe('Classes 7P, 7S and Custom Class Naming', () => {
  let adminToken;
  let teacherToken;
  let teacherProfileId;

  it('1. Login as Admin', async () => {
    adminToken = await loginAs('admin@lms.com', 'password123');
    assert.ok(adminToken);
  });

  it('2. Create Teacher account for testing if needed', async () => {
    const rand = Date.now().toString().slice(-4);
    const email = `teacher.class.${rand}@lms.com`;
    const { status, body } = await makeRequest('/api/auth/users', {
      method: 'POST',
      body: {
        name: 'Ibu Guru Maya',
        email,
        password: 'password123',
        role: 'teacher',
        status: 'active',
      },
    }, adminToken);

    assert.strictEqual(status, 201);
    teacherProfileId = body.data.teacherId;
    teacherToken = await loginAs(email, 'password123');
    assert.ok(teacherToken);
  });

  it('3. Create Class 7P (grade: 7, section: P)', async () => {
    await prisma.class.deleteMany({ where: { id: 'CLS-7P' } });

    const { status, body } = await makeRequest('/api/classes', {
      method: 'POST',
      body: {
        grade: 7,
        section: 'P',
        name: 'Kelas 7P',
        room: 'Lab AI 1',
        schedule: 'Senin, 07:30-09:00',
        semesterId: 'SEM1-2026',
        subject: 'Coding & AI Integrated',
      },
    }, teacherToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, 'CLS-7P');
    assert.strictEqual(body.data.name, 'Kelas 7P');
    assert.strictEqual(body.data.grade, 7);
    assert.strictEqual(body.data.section, 'P');
  });

  it('4. Create Class 7S (grade: 7, section: S)', async () => {
    await prisma.class.deleteMany({ where: { id: 'CLS-7S' } });

    const { status, body } = await makeRequest('/api/classes', {
      method: 'POST',
      body: {
        grade: 7,
        section: 'S',
        name: 'Kelas 7S',
        room: 'Lab AI 2',
        schedule: 'Selasa, 09:30-11:00',
        semesterId: 'SEM1-2026',
        subject: 'Coding & AI Integrated',
      },
    }, teacherToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, 'CLS-7S');
    assert.strictEqual(body.data.name, 'Kelas 7S');
    assert.strictEqual(body.data.grade, 7);
    assert.strictEqual(body.data.section, 'S');
  });

  it('5. Verify Class 7P and 7S are retrieved via GET /api/classes', async () => {
    const { status, body } = await makeRequest('/api/classes', {}, teacherToken);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    const c7p = body.data.find(c => c.id === 'CLS-7P');
    const c7s = body.data.find(c => c.id === 'CLS-7S');
    assert.ok(c7p, 'CLS-7P should exist in list');
    assert.ok(c7s, 'CLS-7S should exist in list');
    assert.strictEqual(c7p.name, 'Kelas 7P');
    assert.strictEqual(c7s.name, 'Kelas 7S');
  });

  it('6. Gracefully handle section entered as "8P" with grade 8 (auto-clean)', async () => {
    await prisma.class.deleteMany({ where: { id: 'CLS-8P' } });

    const { status, body } = await makeRequest('/api/classes', {
      method: 'POST',
      body: {
        grade: 8,
        section: '8P',
        name: 'Kelas 8P',
        room: 'Lab Komputer 3',
        schedule: 'Rabu, 07:30-09:00',
        semesterId: 'SEM1-2026',
      },
    }, teacherToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.data.id, 'CLS-8P');
    assert.strictEqual(body.data.section, 'P');
    assert.strictEqual(body.data.name, 'Kelas 8P');
  });
});
