/**
 * Class Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { BadRequestError, NotFoundError, ConflictError } = require("../utils/errors");

async function resolveSubject(teacherId) {
  if (teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (teacher) return teacher.subject;
  }
  const teacher = await prisma.teacher.findFirst();
  return teacher?.subject || "Coding & AI Integrated";
}

async function clearClassCaches() {
  await cache.delPatterns([
    "classes:*",
    "students:*",
    "materials:*",
    "worksheets:*",
    "submissions:*",
    "scores:*",
    "attendance:*",
    "schedule:*",
    "analytics:*",
    "dashboard:*",
    "student_portal:*",
  ]);
}

async function listClasses(query = {}, user = null) {
  const { semesterId, teacherId: queryTeacherId } = query;
  const effectiveTeacherId = (user && user.teacherId) ? user.teacherId : (queryTeacherId || "all");
  const cacheKey = `classes:list:${semesterId || "all"}:${effectiveTeacherId}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (semesterId) where.semesterId = semesterId;

    if (user && user.teacherId) {
      where.teacherId = user.teacherId;
    } else if (queryTeacherId && queryTeacherId !== "all") {
      where.teacherId = queryTeacherId;
    }

    return prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, subject: true, phone: true },
        },
        semester: {
          select: { id: true, name: true, number: true, status: true, startDate: true, endDate: true },
        },
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    });
  });
}

async function getClassById(id) {
  return cache.remember(`classes:detail:${id}`, 600, async () => {
    const data = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: true,
        semester: true,
      },
    });
    if (!data) {
      throw new NotFoundError("Class not found");
    }
    return data;
  });
}

async function createClass(body, user = null) {
  const { grade, section, name, room, schedule, semesterId, currentTopic, nextTopic, subject, teacherId: bodyTeacherId } = body;
  if (!grade || !section) {
    throw new BadRequestError("Grade and section are required");
  }

  const cleanGrade = parseInt(grade, 10);
  let cleanSection = section.toString().trim().toUpperCase();

  // If user entered e.g. "7P" or "7-P" or "7S" in section while grade is 7, clean leading grade number
  if (cleanSection.startsWith(cleanGrade.toString()) && cleanSection.length > cleanGrade.toString().length) {
    cleanSection = cleanSection.slice(cleanGrade.toString().length).replace(/^[-_ ]+/, '').trim() || cleanSection;
  }

  const id = body.id || `CLS-${cleanGrade}${cleanSection.replace(/[^A-Z0-9]/gi, '')}`;
  const existing = await prisma.class.findUnique({ where: { id } });
  if (existing) {
    throw new ConflictError(`Class ${id} already exists`);
  }

  // Gracefully resolve semester: use provided semesterId, or default to active semester
  let targetSemesterId = semesterId;
  if (!targetSemesterId) {
    const activeSemester = await prisma.semester.findFirst({ where: { status: "active" } });
    targetSemesterId = activeSemester?.id;
  }

  if (!targetSemesterId) {
    throw new BadRequestError("Semester tidak ditemukan dan tidak ada semester aktif");
  }

  const semester = await prisma.semester.findUnique({ where: { id: targetSemesterId } });
  if (!semester) {
    throw new BadRequestError("Semester not found");
  }

  const assignedTeacherId = bodyTeacherId || user?.teacherId || null;
  const classSubject = subject || await resolveSubject(assignedTeacherId);
  const className = name?.trim() || `Kelas ${cleanGrade}${cleanSection}`;

  const created = await prisma.class.create({
    data: {
      id,
      name: className,
      grade: cleanGrade,
      section: cleanSection,
      subject: classSubject,
      studentCount: 0,
      room: room || "",
      schedule: schedule || "",
      semesterId: targetSemesterId,
      teacherId: assignedTeacherId,
      currentTopic: currentTopic || "",
      nextTopic: nextTopic || "",
    },
    include: {
      teacher: true,
      semester: true,
    },
  });

  await clearClassCaches();
  await cache.set(`classes:detail:${created.id}`, created, 600);

  await logActivity({
    type: "general",
    message: `Kelas baru ${created.name} (${classSubject}) berhasil dibuat oleh ${user?.name || "Admin"}`,
    icon: "GraduationCap",
    teacherId: assignedTeacherId,
    teacherName: created.teacher?.name || user?.name,
  });

  return created;
}

async function updateClass(id, body, user = null) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Class not found");
  }

  const {
    name, room, schedule, currentTopic, nextTopic,
    attendanceRate, worksheetCompletion, semesterProgress,
    averageScore, studentCount, subject, semesterId,
  } = body;

  const classSubject = subject || await resolveSubject(user?.teacherId);

  const updated = await prisma.class.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(room !== undefined && { room }),
      ...(schedule !== undefined && { schedule }),
      ...(currentTopic !== undefined && { currentTopic }),
      ...(nextTopic !== undefined && { nextTopic }),
      ...(semesterId !== undefined && { semesterId }),
      subject: classSubject,
      ...(attendanceRate !== undefined && { attendanceRate: parseFloat(attendanceRate) }),
      ...(worksheetCompletion !== undefined && { worksheetCompletion: parseFloat(worksheetCompletion) }),
      ...(semesterProgress !== undefined && { semesterProgress: parseFloat(semesterProgress) }),
      ...(averageScore !== undefined && { averageScore: parseFloat(averageScore) }),
      ...(studentCount !== undefined && { studentCount: parseInt(studentCount, 10) }),
    },
    include: {
      teacher: true,
      semester: true,
    },
  });

  await clearClassCaches();
  await cache.set(`classes:detail:${id}`, updated, 600);

  return updated;
}

async function deleteClass(id) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Class not found");
  }

  // Cascading deletes for child entities
  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { classId: id } }),
    prisma.score.deleteMany({ where: { classId: id } }),
    prisma.submission.deleteMany({ where: { classId: id } }),
    prisma.journal.deleteMany({ where: { classId: id } }),
    prisma.worksheet.deleteMany({ where: { classId: id } }),
    prisma.meeting.deleteMany({ where: { classId: id } }),
    prisma.scheduleSlot.deleteMany({ where: { classId: id } }),
    prisma.learningMaterial.deleteMany({ where: { classId: id } }),
    prisma.student.deleteMany({ where: { classId: id } }),
    prisma.class.delete({ where: { id } }),
  ]);

  await clearClassCaches();
  await cache.del(`classes:detail:${id}`);

  return true;
}

/**
 * Safely reset class roster without deleting past student records
 * Preserves scores, attendance, submissions, and enrollments
 */
async function resetClassRoster(classId, options = {}) {
  const {
    archiveStatus = "completed",
    notes = "",
  } = options;

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    include: { semester: true },
  });
  if (!targetClass) {
    throw new NotFoundError("Class not found");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const activeStudents = await prisma.student.findMany({
    where: { classId },
  });

  const archivedStudents = [];

  for (const st of activeStudents) {
    // 1. Archive student enrollment for this class
    await prisma.studentEnrollment.updateMany({
      where: {
        studentId: st.id,
        classId,
      },
      data: {
        status: archiveStatus,
        completionDate: todayStr,
        finalScore: st.averageScore,
        attendanceRate: st.attendance,
        notes: notes || "Roster kelas direset untuk persiapan tahun ajaran baru",
      },
    });

    // 2. Unlink active class pointer so class is vacated
    await prisma.student.update({
      where: { id: st.id },
      data: {
        classId: null,
      },
    });

    archivedStudents.push({
      id: st.id,
      name: st.name,
      nisn: st.nisn,
      averageScore: st.averageScore,
      attendance: st.attendance,
    });
  }

  // 3. Reset class studentCount to 0
  await prisma.class.update({
    where: { id: classId },
    data: { studentCount: 0 },
  });

  // 4. Invalidate caches and refresh target class cache
  await clearClassCaches();
  const freshClass = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true, semester: true },
  });
  if (freshClass) {
    await cache.set(`classes:detail:${classId}`, freshClass, 600);
  }

  return {
    success: true,
    classId: targetClass.id,
    className: targetClass.name,
    totalArchived: archivedStudents.length,
    archivedStudents,
    message: `Roster ${targetClass.name} berhasil direset. ${archivedStudents.length} siswa telah diarsipkan dengan aman tanpa menghapus riwayat nilai, presensi, maupun tugas.`,
  };
}

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  resetClassRoster,
};
