const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { startServer, stopServer, makeRequest, loginAs } = require('./helpers');

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
});

describe('API Tests', () => {
  describe('Auth', () => {
    it('POST /api/auth/login with valid credentials', async () => {
      const { status, body } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'sari.dewi@smpnegeri5.sch.id', password: 'password123' },
      });
      assert.strictEqual(status, 200);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.role, 'teacher');
    });

    it('POST /api/auth/login with wrong password returns 401', async () => {
      const { status, body } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'sari.dewi@smpnegeri5.sch.id', password: 'wrong' },
      });
      assert.strictEqual(status, 401);
      assert.ok(body.message);
    });

    it('GET /api/classes without token returns 401', async () => {
      const { status, body } = await makeRequest('/api/classes', { noAuth: true });
      assert.strictEqual(status, 401);
      assert.ok(body.message);
    });

    it('GET /api/auth/me returns current user', async () => {
      const token = await loginAs();
      const { status, body } = await makeRequest('/api/auth/me', {}, token);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.user.email, 'arifin@smpnegeri5.sch.id');
    });
  });

  describe('Teacher', () => {
    it('GET /api/teacher', async () => {
      const { status, body } = await makeRequest('/api/teacher');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.id, 'T001');
    });
  });

  describe('Academic Years', () => {
    it('GET /api/academic-years', async () => {
      const { status, body } = await makeRequest('/api/academic-years');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.length >= 2);
    });

    it('GET /api/academic-years/active', async () => {
      const { status, body } = await makeRequest('/api/academic-years/active');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.isActive, true);
    });

    it('GET /api/academic-years/AY2025', async () => {
      const { status, body } = await makeRequest('/api/academic-years/AY2025');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.id, 'AY2025');
    });
  });

  describe('Semesters', () => {
    it('GET /api/semesters', async () => {
      const { status, body } = await makeRequest('/api/semesters');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 4);
    });

    it('GET /api/semesters/active', async () => {
      const { status, body } = await makeRequest('/api/semesters/active');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.status, 'active');
    });

    it('GET /api/semesters?academicYearId=AY2025', async () => {
      const { status, body } = await makeRequest('/api/semesters?academicYearId=AY2025');
      assert.strictEqual(status, 200);
      assert.ok(body.data.every(s => s.academicYearId === 'AY2025'));
    });
  });

  describe('Classes', () => {
    it('GET /api/classes', async () => {
      const { status, body } = await makeRequest('/api/classes');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 6);
    });

    it('GET /api/classes/CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/classes/CLS-7A');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.name, 'Kelas 7A');
    });

    it('POST /api/classes', async () => {
      const { status, body } = await makeRequest('/api/classes', {
        method: 'POST',
        body: { grade: 10, section: 'A', subject: 'Coding & AI Integrated', room: 'Ruang 401', semesterId: 'SEM1-2025' },
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(body.data.id, 'CLS-10A');
    });

    it('POST /api/classes duplicate returns 409', async () => {
      const { status } = await makeRequest('/api/classes', {
        method: 'POST',
        body: { grade: 10, section: 'A', semesterId: 'SEM1-2025' },
      });
      assert.strictEqual(status, 409);
    });

    it('PUT /api/classes/CLS-10A', async () => {
      const { status, body } = await makeRequest('/api/classes/CLS-10A', {
        method: 'PUT',
        body: { room: 'Ruang 402', currentTopic: 'Fungsi Kuadrat' },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.room, 'Ruang 402');
    });

    it('DELETE /api/classes/CLS-10A', async () => {
      const { status, body } = await makeRequest('/api/classes/CLS-10A', { method: 'DELETE' });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
    });

    it('GET deleted class returns 404', async () => {
      const { status } = await makeRequest('/api/classes/CLS-10A');
      assert.strictEqual(status, 404);
    });
  });

  describe('Students', () => {
    it('GET /api/students', async () => {
      const { status, body } = await makeRequest('/api/students');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 9);
    });

    it('GET /api/students?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/students?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 9);
      assert.ok(body.data.every(s => s.classId === 'CLS-7A'));
    });
  });

  describe('Meetings', () => {
    it('GET /api/meetings?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/meetings?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.length, 16);
    });
  });

  describe('Worksheets', () => {
    it('GET /api/worksheets?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/worksheets?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.length, 6);
    });
  });

  describe('Submissions', () => {
    it('GET /api/submissions', async () => {
      const { status, body } = await makeRequest('/api/submissions');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length > 0);
    });
  });

  describe('Scores', () => {
    it('GET /api/scores?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/scores?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length > 0);
    });
  });

  describe('Attendance', () => {
    it('GET /api/attendance?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/attendance?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length > 0);
    });

    it('GET /api/attendance/matrix/CLS-7A returns full matrix', async () => {
      const { status, body } = await makeRequest('/api/attendance/matrix/CLS-7A');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.matrix.length > 0);
      assert.ok(body.data.matrix[0].summary);
      assert.ok(body.data.matrix[0].sessions);
    });

    it('POST /api/attendance/mark-all-present marks class students present', async () => {
      // Get first meeting
      const meetRes = await makeRequest('/api/meetings?classId=CLS-7A');
      const meetingId = meetRes.body.data[0].id;
      const { status, body } = await makeRequest('/api/attendance/mark-all-present', {
        method: 'POST',
        body: { meetingId, classId: 'CLS-7A' },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.totalMarked > 0);
    });

    it('POST /api/attendance supports note', async () => {
      const meetRes = await makeRequest('/api/meetings?classId=CLS-7A');
      const meetingId = meetRes.body.data[0].id;
      const studRes = await makeRequest('/api/students?classId=CLS-7A');
      const studentId = studRes.body.data[0].id;

      const { status, body } = await makeRequest('/api/attendance', {
        method: 'POST',
        body: {
          meetingId,
          studentId,
          classId: 'CLS-7A',
          status: 'permission',
          note: 'Izin sakit flu (surat dokter)',
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.data.status, 'permission');
      assert.strictEqual(body.data.note, 'Izin sakit flu (surat dokter)');
    });

    it('POST /api/attendance/pin/:meetingId generates 6-digit PIN', async () => {
      const meetRes = await makeRequest('/api/meetings?classId=CLS-7A');
      const meetingId = meetRes.body.data[0].id;
      const { status, body } = await makeRequest(`/api/attendance/pin/${meetingId}`, {
        method: 'POST',
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(typeof body.data.checkInPin, 'string');
      assert.strictEqual(body.data.checkInPin.length, 6);
    });
  });

  describe('Activities', () => {
    it('GET /api/activities', async () => {
      const { status, body } = await makeRequest('/api/activities');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length > 0);
    });

    it('GET /api/activities/recent', async () => {
      const { status, body } = await makeRequest('/api/activities/recent');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length <= 10);
    });
  });

  describe('Calendar Events', () => {
    it('GET /api/calendar-events', async () => {
      const { status, body } = await makeRequest('/api/calendar-events');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 6);
    });
  });

  describe('Analytics', () => {
    it('GET /api/analytics/class-comparison', async () => {
      const { status, body } = await makeRequest('/api/analytics/class-comparison');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 6);
    });

    it('GET /api/analytics/learning-targets', async () => {
      const { status, body } = await makeRequest('/api/analytics/learning-targets');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length >= 6);
    });
  });

  describe('Journals', () => {
    it('GET /api/journals', async () => {
      const { status, body } = await makeRequest('/api/journals');
      assert.strictEqual(status, 200);
      assert.ok(body.data.length > 0);
    });

    it('GET /api/journals?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/journals?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.ok(body.data.every(j => j.classId === 'CLS-7A'));
    });
  });

  describe('Materials', () => {
    let testMaterialId = null;

    it('GET /api/materials?classId=CLS-7A', async () => {
      const { status, body } = await makeRequest('/api/materials?classId=CLS-7A');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    it('POST /api/materials create new material with file and video', async () => {
      const { status, body } = await makeRequest('/api/materials', {
        method: 'POST',
        body: {
          classId: 'CLS-7A',
          topic: 'Pengenalan Python & Turtle Graphics',
          description: 'Belajar logika pemrograman visual',
          learningObjective: 'Siswa memahami loop dan koordinat',
          status: 'active',
          fileUrl: '/uploads/materials/test-modul.pdf',
          fileName: 'test-modul.pdf',
          fileSize: 1048576,
          fileType: 'application/pdf',
          videoUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.id);
      testMaterialId = body.data.id;
      assert.strictEqual(body.data.fileUrl, '/uploads/materials/test-modul.pdf');
      assert.strictEqual(body.data.videoUrl, 'https://www.youtube.com/watch?v=kqtD5dpn9C8');
    });

    it('POST /api/materials/deploy deploys material to target class', async () => {
      const { status, body } = await makeRequest('/api/materials/deploy', {
        method: 'POST',
        body: {
          materialId: testMaterialId,
          targetClassIds: ['CLS-G7-S'],
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.deployedCount, 1);
      assert.strictEqual(body.data.materials[0].topic, 'Pengenalan Python & Turtle Graphics');
    });

    it('POST /api/materials/template-curriculum applies 16 standard sessions', async () => {
      const { status, body } = await makeRequest('/api/materials/template-curriculum', {
        method: 'POST',
        body: {
          classId: 'CLS-G9-P',
          grade: 9,
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.count, 16);
      assert.strictEqual(body.data.materials.length, 16);
    });

    it('POST /api/materials/clone-curriculum clones full curriculum to target class', async () => {
      const { status, body } = await makeRequest('/api/materials/clone-curriculum', {
        method: 'POST',
        body: {
          sourceClassId: 'CLS-G9-P',
          targetClassIds: ['CLS-G8-P'],
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.totalCloned, 16);
    });
  });

  describe('Redis Cache Layer', () => {
    it('GET /api/cache/status returns cache driver and status', async () => {
      const { status, body } = await makeRequest('/api/cache/status');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.redisConnected === 'boolean');
      assert.ok(['redis', 'memory-fallback'].includes(body.data.driver));
      assert.ok(typeof body.data.memoryCacheEntries === 'number');
    });

    it('POST /api/cache/flush clears all cache keys', async () => {
      const { status, body } = await makeRequest('/api/cache/flush', {
        method: 'POST',
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.flushed, true);
    });

    it('Dashboard, Materials, Students, Attendance APIs utilize cache smoothly', async () => {
      // 1. Dashboard teacher profile cache
      const t1 = await makeRequest('/api/teacher');
      assert.strictEqual(t1.status, 200);
      const t2 = await makeRequest('/api/teacher');
      assert.strictEqual(t2.status, 200);
      assert.strictEqual(t2.body.data.name, t1.body.data.name);

      // 2. Materials list cache & mutation invalidation
      const m1 = await makeRequest('/api/materials?classId=CLS-7A');
      assert.strictEqual(m1.status, 200);

      // 3. Students list cache
      const s1 = await makeRequest('/api/students?classId=CLS-7A');
      assert.strictEqual(s1.status, 200);

      // 4. Attendance matrix cache
      const att1 = await makeRequest('/api/attendance/matrix/CLS-7A');
      assert.strictEqual(att1.status, 200);
      assert.strictEqual(att1.body.data.classId, 'CLS-7A');

      // 5. Analytics attendance trend cache
      const an1 = await makeRequest('/api/analytics/attendance-trend');
      assert.strictEqual(an1.status, 200);
    });
  });

  describe('Weekly Schedule Management', () => {
    it('POST /api/schedule-slots/weekly sets multiple lessons for a class', async () => {
      const { status, body } = await makeRequest('/api/schedule-slots/weekly', {
        method: 'POST',
        body: {
          classId: 'CLS-G7-P',
          lessons: [
            { day: 'Senin', startTime: '07:30', endTime: '09:00', room: 'Lab Komputer 1' },
            { day: 'Kamis', startTime: '10:00', endTime: '11:30', room: 'Lab Komputer 1' },
          ],
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.length >= 2);
    });
  });

  describe('Student Portal', () => {
    let studentToken = null;

    it('POST /api/auth/login via NISN for Ahmad Rizky Pratama', async () => {
      const { status, body } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: { identifier: '0081234501', password: 'password123' },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.name, 'Ahmad Rizky Pratama');
      assert.strictEqual(body.data.student.nisn, '0081234501');
      studentToken = body.data.token;
    });

    it('POST /api/auth/login via Email for Siti Rahmawati', async () => {
      const { status, body } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'siti.rahmawati@siswa.smpnegeri5.sch.id', password: 'password123' },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.user.name, 'Siti Rahmawati');
      assert.strictEqual(body.data.student.nisn, '0081234502');
    });

    it('GET /api/student-portal/dashboard returns live dashboard for student', async () => {
      const { status, body } = await makeRequest('/api/student-portal/dashboard', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.student);
      assert.strictEqual(body.data.student.name, 'Ahmad Rizky Pratama');
      assert.ok(body.data.recentWorksheets.length > 0);
      assert.ok(body.data.recentMaterials.length > 0);
    });

    it('GET /api/student-portal/materials returns student class materials', async () => {
      const { status, body } = await makeRequest('/api/student-portal/materials', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 10);
    });

    it('GET /api/student-portal/worksheets returns class worksheets with student submission state', async () => {
      const { status, body } = await makeRequest('/api/student-portal/worksheets', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 4);
    });

    it('POST /api/student-portal/worksheets/:id/submit submits code solution', async () => {
      const { body: wsBody } = await makeRequest('/api/student-portal/worksheets', {}, studentToken);
      const targetWs = wsBody.data.find(w => !w.submission) || wsBody.data[0];
      assert.ok(targetWs);

      const { status, body } = await makeRequest(`/api/student-portal/worksheets/${targetWs.id}/submit`, {
        method: 'POST',
        body: {
          submittedCode: 'def test():\n    return "Solved"\nprint(test())',
          codeOutput: 'Solved',
          feedback: 'Selesai dikerjakan dan diuji',
        },
      }, studentToken);

      assert.ok([200, 201].includes(status));
      assert.strictEqual(body.success, true);
      assert.ok(['submitted', 'graded'].includes(body.data.status));
    });

    it('GET /api/student-portal/schedule returns timetable slots for class', async () => {
      const { status, body } = await makeRequest('/api/student-portal/schedule', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.byDay);
      assert.ok(body.data.classInfo);
    });

    it('GET /api/student-portal/attendance returns student attendance records', async () => {
      const { status, body } = await makeRequest('/api/student-portal/attendance', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.summary);
      assert.ok(body.data.summary.total >= 5);
    });

    it('GET /api/student-portal/scores returns evaluations breakdown', async () => {
      const { status, body } = await makeRequest('/api/student-portal/scores', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.overallAverage > 0);
      assert.ok(Array.isArray(body.data.scores));
    });

    it('GET /api/student-portal/profile returns full student profile', async () => {
      const { status, body } = await makeRequest('/api/student-portal/profile', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Ahmad Rizky Pratama');
      assert.strictEqual(body.data.nisn, '0081234501');
      assert.ok(Array.isArray(body.data.strengths));
      assert.ok(Array.isArray(body.data.achievements));
    });
  });

  describe('Student Multi-Year Progression & Promotion', () => {
    it('GET /api/students/promotion-candidates/:classId retrieves eligible previous grade candidates', async () => {
      const { status, body } = await makeRequest('/api/students/promotion-candidates/CLS-G8-S');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.targetClass.grade, 8);
      assert.strictEqual(body.data.eligiblePreviousGrade, 7);
      assert.ok(Array.isArray(body.data.sourceClasses));
      assert.ok(body.data.sourceClasses.length > 0);
    });

    it('POST /api/students/promote promotes student from Grade 7 to Grade 8 keeping past records', async () => {
      const { status, body } = await makeRequest('/api/students/promote', {
        method: 'POST',
        body: {
          sourceClassId: 'CLS-7A',
          targetClassId: 'CLS-G8-S',
          studentIds: ['STD-CLS-7A-01'],
          action: 'promoted',
          notes: 'Naik ke kelas 8S tahun ajaran berikutnya',
        },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.totalPromoted, 1);
      assert.strictEqual(body.data.targetClass.grade, 8);
    });

    it('GET /api/students/:id/history retrieves complete multi-year timeline without data loss', async () => {
      const { status, body } = await makeRequest('/api/students/STD-CLS-7A-01/history');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.student.name, 'Ahmad Rizky Pratama');
      assert.ok(body.data.totalYearsRecorded >= 2);

      const g7Record = body.data.timeline.find(t => t.grade === 7);
      assert.ok(g7Record);
      assert.strictEqual(g7Record.status, 'promoted');
      assert.ok(g7Record.finalScore > 0);

      const g8Record = body.data.timeline.find(t => t.grade === 8);
      assert.ok(g8Record);
      assert.strictEqual(g8Record.status, 'active');
      assert.strictEqual(g8Record.classId, 'CLS-G8-S');
    });

    it('GET /api/student-portal/profile includes multi-year academicJourney', async () => {
      const { body: loginBody } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: { identifier: '0081234501', password: 'password123' },
      });
      const studentToken = loginBody.data.token;

      const { status, body } = await makeRequest('/api/student-portal/profile', {}, studentToken);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.academicJourney));
      assert.ok(body.data.academicJourney.length >= 1);
    });
  });

  describe('Student Bulk Creation & Safe Class Reset', () => {
    it('POST /api/students/bulk registers students by Name and Class with 0 initial stats', async () => {
      const studentsList = [
        { name: 'Alden', gender: 'L' },
        { name: 'Celline Prayogo', gender: 'P' },
        { name: 'Chadrich Javiero Jingga', gender: 'L' },
        { name: 'Chanel Suryadinata', gender: 'P' },
        { name: 'Aiden Ryu Adideva', gender: 'L' },
      ];

      const { status, body } = await makeRequest('/api/students/bulk', {
        method: 'POST',
        body: {
          classId: 'CLS-G7-P',
          students: studentsList,
        },
      });

      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.length, 5);

      const alden = body.data.find(s => s.name === 'Alden');
      assert.ok(alden);
      assert.strictEqual(alden.classId, 'CLS-G7-P');
      assert.strictEqual(alden.averageScore, 0);
      assert.strictEqual(alden.attendance, 0);
      assert.strictEqual(alden.worksheetCompletion, 0);
      assert.ok(alden.nisn);

      // Verify student login created
      const { status: loginStatus, body: loginBody } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: { identifier: alden.nisn, password: 'password123' },
      });
      assert.strictEqual(loginStatus, 200);
      assert.strictEqual(loginBody.data.user.name, 'Alden');
      assert.strictEqual(loginBody.data.user.role, 'student');
    });

    it('POST /api/classes/:id/reset-roster clears class roster safely without data loss', async () => {
      const { status, body } = await makeRequest('/api/classes/CLS-G7-P/reset-roster', {
        method: 'POST',
        body: {
          archiveStatus: 'completed',
          notes: 'Persiapan tahun ajaran baru',
        },
      });

      assert.strictEqual(status, 200);
      assert.strictEqual(body.success, true);

      // Verify class studentCount is now 0
      const { body: classBody } = await makeRequest('/api/classes/CLS-G7-P');
      assert.strictEqual(classBody.data.studentCount, 0);
    });
  });
});
