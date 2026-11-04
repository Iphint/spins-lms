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

describe('Admin Monitoring & Teacher Operations (Students, Scores, Materials, Schedules, Activities)', () => {
  const rand = Date.now().toString().slice(-4);
  const teacherEmail = `budi.${rand}@sekolah.sch.id`;
  let adminToken;
  let teacherToken;
  let teacherUser;
  let teacherProfileId;
  let createdClassId;
  let createdStudentId;
  let createdScoreId;

  it('1. Admin login with admin@lms.com / password123', async () => {
    adminToken = await loginAs('admin@lms.com', 'password123');
    assert.ok(adminToken);
  });

  it('2. Admin gets all teachers via GET /api/teacher/all', async () => {
    const { status, body } = await makeRequest('/api/teacher/all', {}, adminToken);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  it('3. Admin creates a Teacher user (Pak Budi)', async () => {
    const { status, body } = await makeRequest('/api/auth/users', {
      method: 'POST',
      body: {
        name: `Pak Budi Santoso ${rand}`,
        email: teacherEmail,
        password: 'password123',
        role: 'teacher',
        status: 'active',
      },
    }, adminToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.teacherId);
    teacherUser = body.data;
    teacherProfileId = body.data.teacherId;
  });

  it('4. Teacher (Pak Budi) logs in with credentials', async () => {
    teacherToken = await loginAs(teacherEmail, 'password123');
    assert.ok(teacherToken);
  });

  it('5. Teacher creates a class', async () => {
    const { status, body } = await makeRequest('/api/classes', {
      method: 'POST',
      body: {
        grade: 7,
        section: `Z${rand.slice(-2)}`,
        semesterId: 'SEM1-2026',
        room: 'Lab AI 1',
        schedule: 'Senin 08:00 - 09:30',
        subject: 'Coding & AI Integrated',
      },
    }, teacherToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.teacherId, teacherProfileId);
    createdClassId = body.data.id;
  });

  it('6. Teacher adds a student to the class', async () => {
    const { status, body } = await makeRequest('/api/students', {
      method: 'POST',
      body: {
        classId: createdClassId,
        name: 'Doni Pratama',
        gender: 'L',
        nisn: `008${rand}999`,
      },
    }, teacherToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.name, 'Doni Pratama');
    assert.strictEqual(body.data.averageScore, 0);
    createdStudentId = body.data.id;
  });

  it('7. Teacher assigns score (UH 1: 85) to student Doni', async () => {
    const { status, body } = await makeRequest('/api/scores', {
      method: 'POST',
      body: {
        studentId: createdStudentId,
        classId: createdClassId,
        examType: 'Ulangan Harian 1',
        score: 85,
        maxScore: 100,
        weight: 10,
      },
    }, teacherToken);

    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.score, 85);
    createdScoreId = body.data.id;

    // Verify student averageScore is updated to 85
    const student = await prisma.student.findUnique({ where: { id: createdStudentId } });
    assert.strictEqual(student.averageScore, 85);

    // Verify class averageScore is updated to 85
    const cls = await prisma.class.findUnique({ where: { id: createdClassId } });
    assert.strictEqual(cls.averageScore, 85);
  });

  it('8. Teacher sets weekly schedule for class CLS-7K', async () => {
    const { status, body } = await makeRequest('/api/schedule-slots/weekly', {
      method: 'POST',
      body: {
        classId: createdClassId,
        lessons: [
          { day: 'Senin', startTime: '08:00', endTime: '09:30', room: 'Lab AI 1' },
          { day: 'Kamis', startTime: '10:00', endTime: '11:30', room: 'Lab AI 1' },
        ],
      },
    }, teacherToken);

    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
  });

  it('9. Admin views all schedule slots and filters by teacherId', async () => {
    // Without filter: sees all slots
    const resAll = await makeRequest('/api/schedule-slots', {}, adminToken);
    assert.strictEqual(resAll.status, 200);
    assert.ok(resAll.body.data.length >= 2);

    // Filter by Pak Budi's teacherId
    const resFiltered = await makeRequest(`/api/schedule-slots?teacherId=${teacherProfileId}`, {}, adminToken);
    assert.strictEqual(resFiltered.status, 200);
    assert.strictEqual(resFiltered.body.data.length, 2);
    assert.ok(resFiltered.body.data[0].class.teacher.name.includes('Pak Budi Santoso'));
  });

  it('10. Admin views all teacher activities and statistics', async () => {
    const resActivities = await makeRequest('/api/activities', {}, adminToken);
    assert.strictEqual(resActivities.status, 200);
    assert.strictEqual(resActivities.success, undefined);
    assert.ok(resActivities.body.data.length >= 4);

    // Verify activities include teacherName
    const teacherActivities = resActivities.body.data.filter(a => a.teacherId === teacherProfileId);
    assert.ok(teacherActivities.length >= 3);

    // Verify score activity was logged
    const scoreAct = teacherActivities.find(a => a.type === 'score');
    assert.ok(scoreAct);
    assert.ok(scoreAct.message.includes('Pak Budi Santoso'));
    assert.ok(scoreAct.message.includes('85/100'));

    // Verify student activity was logged
    const studentAct = teacherActivities.find(a => a.type === 'student');
    assert.ok(studentAct);
    assert.ok(studentAct.message.includes('Doni Pratama'));

    // Check stats endpoint
    const resStats = await makeRequest('/api/activities/stats', {}, adminToken);
    assert.strictEqual(resStats.status, 200);
    assert.ok(resStats.body.data.total >= 4);
    assert.ok(resStats.body.data.scoreCount >= 1);
    assert.ok(resStats.body.data.studentCount >= 1);
  });
});
