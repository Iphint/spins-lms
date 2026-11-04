/**
 * Score Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { NotFoundError, BadRequestError } = require("../utils/errors");

async function clearScoreCaches() {
  await cache.delPatterns([
    "scores:*",
    "students:*",
    "classes:*",
    "analytics:*",
    "dashboard:*",
    "student_portal:*",
  ]);
}

async function recalculateAverages(studentId, classId) {
  // 1. Recalculate Student Average Score
  const studentScores = await prisma.score.findMany({ where: { studentId } });
  const studentAvg = studentScores.length > 0
    ? Math.round((studentScores.reduce((sum, s) => sum + s.score, 0) / studentScores.length) * 10) / 10
    : 0;

  await prisma.student.update({
    where: { id: studentId },
    data: { averageScore: studentAvg },
  });

  // 2. Recalculate Class Average Score if classId exists
  if (classId) {
    const classStudents = await prisma.student.findMany({ where: { classId } });
    const classAvg = classStudents.length > 0
      ? Math.round((classStudents.reduce((sum, s) => sum + s.averageScore, 0) / classStudents.length) * 10) / 10
      : 0;

    await prisma.class.update({
      where: { id: classId },
      data: { averageScore: classAvg },
    });
  }

  await clearScoreCaches();
  return studentAvg;
}

async function listScores(query = {}) {
  const { studentId, classId, semesterNumber, examType } = query;
  const cacheKey = `scores:list:${studentId || "all"}:${classId || "all"}:${semesterNumber || "all"}:${examType || "all"}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (semesterNumber && semesterNumber !== "all") {
      where.semesterNumber = parseInt(semesterNumber, 10);
    }
    if (examType && examType !== "all") {
      where.examType = examType;
    }

    return prisma.score.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, nisn: true } },
        class: { select: { id: true, name: true, grade: true, section: true } },
      },
      orderBy: { date: "desc" },
    });
  });
}

async function getScoreById(id) {
  return cache.remember(`scores:detail:${id}`, 600, async () => {
    const data = await prisma.score.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
      },
    });
    if (!data) {
      throw new NotFoundError("Score not found");
    }
    return data;
  });
}

async function createScore(body, user = null) {
  const { studentId, classId, examType, score, maxScore = 100, weight = 10, date, semesterNumber = 1 } = body;
  if (!studentId || !classId || !examType || score === undefined) {
    throw new BadRequestError("studentId, classId, examType, and score are required");
  }

  const numScore = parseInt(score, 10);
  if (isNaN(numScore) || numScore < 0 || numScore > (parseInt(maxScore, 10) || 100)) {
    throw new BadRequestError(`Score must be a number between 0 and ${maxScore}`);
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError("Student not found");

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) throw new NotFoundError("Class not found");

  const todayStr = date || new Date().toISOString().split("T")[0];
  const id = `SCR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const created = await prisma.score.create({
    data: {
      id,
      studentId,
      classId,
      examType,
      score: numScore,
      maxScore: parseInt(maxScore, 10) || 100,
      weight: parseInt(weight, 10) || 10,
      semesterNumber: parseInt(semesterNumber, 10) || 1,
      date: todayStr,
    },
    include: {
      student: true,
      class: true,
    },
  });

  // Automatically update student and class average score
  await recalculateAverages(studentId, classId);
  await cache.set(`scores:detail:${created.id}`, created, 600);

  // Log teacher activity
  await logActivity({
    type: "score",
    message: `Guru ${user?.name || cls.teacher?.name || "Guru"} memberikan nilai ${numScore}/${maxScore} (${examType} Sem ${semesterNumber}) untuk ${student.name} (${cls.name})`,
    icon: "Award",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return created;
}

async function updateScore(id, body, user = null) {
  const existing = await prisma.score.findUnique({
    where: { id },
    include: { student: true, class: { include: { teacher: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Score not found");
  }

  const { examType, score, maxScore, weight, date, semesterNumber } = body;
  const numScore = score !== undefined ? parseInt(score, 10) : existing.score;

  const updated = await prisma.score.update({
    where: { id },
    data: {
      ...(examType !== undefined && { examType }),
      ...(score !== undefined && { score: numScore }),
      ...(maxScore !== undefined && { maxScore: parseInt(maxScore, 10) }),
      ...(weight !== undefined && { weight: parseInt(weight, 10) }),
      ...(semesterNumber !== undefined && { semesterNumber: parseInt(semesterNumber, 10) || 1 }),
      ...(date !== undefined && { date }),
    },
    include: {
      student: true,
      class: true,
    },
  });

  await recalculateAverages(existing.studentId, existing.classId);
  await cache.set(`scores:detail:${id}`, updated, 600);

  await logActivity({
    type: "score",
    message: `Guru ${user?.name || existing.class?.teacher?.name || "Guru"} memperbarui nilai (${updated.examType}: ${updated.score}) untuk ${existing.student?.name}`,
    icon: "Award",
    teacherId: user?.teacherId || existing.class?.teacherId,
    teacherName: user?.name || existing.class?.teacher?.name,
  });

  return updated;
}

async function bulkSaveScores(body, user = null) {
  const { classId, examType, semesterNumber = 1, date, maxScore = 100, weight = 20, scores = [] } = body;
  if (!classId || !examType) {
    throw new BadRequestError("classId and examType are required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) throw new NotFoundError("Class not found");

  const todayStr = date || new Date().toISOString().split("T")[0];
  const semNum = parseInt(semesterNumber, 10) || 1;
  const maxSc = parseInt(maxScore, 10) || 100;
  const wt = parseInt(weight, 10) || 20;

  const validEntries = scores.filter(
    s => s && s.studentId && s.score !== null && s.score !== undefined && s.score !== ""
  );

  const savedList = [];
  for (const entry of validEntries) {
    const numScore = parseInt(entry.score, 10);
    if (isNaN(numScore) || numScore < 0 || numScore > maxSc) continue;

    // Check if score already exists for student, class, examType, semesterNumber
    const existing = await prisma.score.findFirst({
      where: {
        studentId: entry.studentId,
        classId,
        examType,
        semesterNumber: semNum,
      },
    });

    if (existing) {
      const updated = await prisma.score.update({
        where: { id: existing.id },
        data: {
          score: numScore,
          maxScore: maxSc,
          weight: wt,
          date: todayStr,
        },
      });
      savedList.push(updated);
    } else {
      const id = `SCR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const created = await prisma.score.create({
        data: {
          id,
          studentId: entry.studentId,
          classId,
          examType,
          semesterNumber: semNum,
          score: numScore,
          maxScore: maxSc,
          weight: wt,
          date: todayStr,
        },
      });
      savedList.push(created);
    }

    // Recalculate student average
    await recalculateAverages(entry.studentId, classId);
  }

  await clearScoreCaches();

  await logActivity({
    type: "score",
    message: `Guru ${user?.name || cls.teacher?.name || "Guru"} menginput nilai ${examType} (Semester ${semNum}) untuk ${savedList.length} siswa kelas ${cls.name}`,
    icon: "Award",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return {
    savedCount: savedList.length,
    classId,
    examType,
    semesterNumber: semNum,
    scores: savedList,
  };
}

async function deleteScore(id, user = null) {
  const existing = await prisma.score.findUnique({
    where: { id },
    include: { student: true, class: { include: { teacher: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Score not found");
  }

  await prisma.score.delete({ where: { id } });
  await recalculateAverages(existing.studentId, existing.classId);
  await cache.del(`scores:detail:${id}`);

  await logActivity({
    type: "score",
    message: `Guru ${user?.name || existing.class?.teacher?.name || "Guru"} menghapus catatan nilai ${existing.examType} (${existing.score}) siswa ${existing.student?.name}`,
    icon: "Trash2",
    teacherId: user?.teacherId || existing.class?.teacherId,
    teacherName: user?.name || existing.class?.teacher?.name,
  });

  return true;
}

module.exports = {
  listScores,
  getScoreById,
  createScore,
  updateScore,
  deleteScore,
  bulkSaveScores,
};
