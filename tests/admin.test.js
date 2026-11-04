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

describe('Admin User & Role Access Management', () => {
  let adminToken;
  let createdTeacherUserId;
  let createdStudentUserId;

  it('Admin login with admin@lms.com / password123', async () => {
    adminToken = await loginAs('admin@lms.com', 'password123');
    assert.ok(adminToken);
  });

  it('GET /api/auth/users lists system accounts', async () => {
    const { status, body } = await makeRequest('/api/auth/users', {}, adminToken);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length >= 1);
    const admin = body.data.find(u => u.role === 'admin');
    assert.ok(admin);
    assert.strictEqual(admin.email, 'admin@lms.com');
  });

  it('POST /api/auth/users creates teacher account and links Teacher profile', async () => {
    const { status, body } = await makeRequest('/api/auth/users', {
      method: 'POST',
      body: {
        name: 'Pak Guru Baru',
        email: 'guru.baru@sekolah.sch.id',
        password: 'password123',
        role: 'teacher',
        status: 'active',
      },
    }, adminToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.role, 'teacher');
    assert.ok(body.data.teacherId);
    createdTeacherUserId = body.data.id;

    // Verify Teacher profile exists
    const teacherProfile = await prisma.teacher.findUnique({ where: { id: body.data.teacherId } });
    assert.ok(teacherProfile);
    assert.strictEqual(teacherProfile.name, 'Pak Guru Baru');
  });

  it('POST /api/auth/users creates student account and links Student profile', async () => {
    const { status, body } = await makeRequest('/api/auth/users', {
      method: 'POST',
      body: {
        name: 'Murid Baru',
        email: 'murid.baru@siswa.sekolah.sch.id',
        password: 'password123',
        role: 'student',
        status: 'active',
      },
    }, adminToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.role, 'student');
    assert.ok(body.data.studentId);
    createdStudentUserId = body.data.id;

    // Verify Student profile exists
    const studentProfile = await prisma.student.findUnique({ where: { id: body.data.studentId } });
    assert.ok(studentProfile);
    assert.strictEqual(studentProfile.name, 'Murid Baru');
  });

  it('Newly created teacher and student can log in', async () => {
    const teacherToken = await loginAs('guru.baru@sekolah.sch.id', 'password123');
    assert.ok(teacherToken);

    const studentToken = await loginAs('murid.baru@siswa.sekolah.sch.id', 'password123');
    assert.ok(studentToken);
  });

  it('Cleanup created test users', async () => {
    if (createdTeacherUserId) {
      await makeRequest('/api/auth/users/' + createdTeacherUserId, { method: 'DELETE' }, adminToken);
    }
    if (createdStudentUserId) {
      await makeRequest('/api/auth/users/' + createdStudentUserId, { method: 'DELETE' }, adminToken);
    }
  });
});
