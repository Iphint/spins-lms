/**
 * Student Service
 */

const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { safeJsonStringify } = require("../utils/helpers");
const { BadRequestError, NotFoundError } = require("../utils/errors");

async function clearStudentCaches() {
  await cache.delPatterns([
    "students:*",
    "classes:*",
    "analytics:*",
    "dashboard:*",
    "student_portal:*",
  ]);
}

async function listStudents(query = {}, user = null) {
  const { classId, search, teacherId: queryTeacherId } = query;
  const effectiveTeacherId = (user && user.teacherId) ? user.teacherId : (queryTeacherId || "all");
  const cacheKey = `students:list:${classId || "all"}:${search || "all"}:${effectiveTeacherId}`;

  return cache.remember(cacheKey, 60, async () => {
    const where = {};
    if (classId) {
      where.classId = classId;
    } else if (effectiveTeacherId !== "all") {
      where.class = { teacherId: effectiveTeacherId };
    }
    if (search) where.name = { contains: search };

    return prisma.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, grade: true, section: true, teacherId: true } },
      },
      orderBy: { name: "asc" },
    });
  });
}

async function getStudentById(id) {
  return cache.remember(`students:detail:${id}`, 600, async () => {
    const data = await prisma.student.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundError("Student not found");
    }
    return data;
  });
}

async function createStudent(body, user = null) {
  const { classId, name, gender, nisn } = body;
  if (!classId || !name || !gender) {
    throw new BadRequestError("classId, name, and gender are required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { semester: true, teacher: true },
  });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const count = await prisma.student.count({ where: { classId } });
  const id = `STD-${classId}-${String(count + 1).padStart(2, "0")}`;

  const student = await prisma.student.create({
    data: {
      id,
      classId,
      name: name.trim(),
      gender: gender || "L",
      nisn: nisn || "",
      currentGrade: cls.grade || 7,
      entryYear: "2026",
      attendance: 0,
      worksheetCompletion: 0,
      averageScore: 0,
      status: "active",
      strengths: "[]",
      weaknesses: "[]",
      achievements: "[]",
      parentName: "",
      parentPhone: "",
    },
  });

  // Auto-create StudentEnrollment for active academic year
  const academicYearId = cls.semester?.academicYearId || "AY2026";
  const todayStr = new Date().toISOString().split("T")[0];
  await prisma.studentEnrollment.upsert({
    where: {
      studentId_classId: {
        studentId: student.id,
        classId: cls.id,
      },
    },
    update: {
      status: "active",
      grade: cls.grade || 7,
      academicYearId,
    },
    create: {
      id: `ENR-${academicYearId}-${cls.id}-${student.id}`,
      studentId: student.id,
      classId: cls.id,
      academicYearId,
      grade: cls.grade || 7,
      status: "active",
      enrollmentDate: todayStr,
      finalScore: 0,
      attendanceRate: 0,
      notes: "Siswa baru terdaftar",
    },
  });

  // Auto-create User account for student login
  const paddedIndex = String(count + 1).padStart(3, "0");
  const cleanNisn = nisn || `0082607${paddedIndex}`;
  const studentEmail = (name.trim().toLowerCase().replace(/\s+/g, ".") + "@siswa.spins.sch.id");
  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      name: student.name,
      studentId: student.id,
      status: "active",
    },
    create: {
      id: `USR-${student.id}`,
      email: studentEmail,
      name: student.name,
      role: "student",
      status: "active",
      studentId: student.id,
      password: defaultPasswordHash,
      createdAt: todayStr,
    },
  });

  await prisma.class.update({
    where: { id: classId },
    data: { studentCount: { increment: 1 } },
  });

  await clearStudentCaches();
  await cache.set(`students:detail:${student.id}`, student, 600);

  await logActivity({
    type: "student",
    message: `Guru ${user?.name || cls.teacher?.name || "Guru"} menambahkan siswa baru ${student.name} ke ${cls.name}`,
    icon: "UserPlus",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return student;
}

function guessGenderFromName(name) {
  const lower = (name || "").toLowerCase().trim();
  const first = lower.split(/\s+/)[0] || "";
  const femaleNames = [
    "celline", "celine", "chanel", "clarisya", "gretchen", "kimberly", "nadine",
    "haifa", "naura", "videllea", "ailynn", "evita", "iswarya", "jane", "jesslyn",
    "meyra", "aurora", "reinetta", "cryztalline", "eugenia", "gwen", "siti", "putri",
    "dewi", "ayu", "zahra", "nur", "sarah", "dian"
  ];
  if (femaleNames.includes(first) || first.endsWith("a") || first.endsWith("i") || first.endsWith("yn") || first.endsWith("ine")) {
    return "P";
  }
  return "L";
}

async function bulkCreateStudents(defaultClassId, studentList, user = null) {
  if (!studentList || !Array.isArray(studentList) || studentList.length === 0) {
    throw new BadRequestError("students array required");
  }

  // Pre-load existing classes for fast lookup by id or name
  const existingClasses = await prisma.class.findMany({
    include: { semester: true, teacher: true },
  });
  const classMap = new Map();
  for (const c of existingClasses) {
    classMap.set(c.id, c);
    classMap.set(c.name.toLowerCase(), c);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const createdStudents = [];
  const classIncrementMap = new Map();

  for (let i = 0; i < studentList.length; i++) {
    const item = studentList[i];
    const isObj = typeof item === "object" && item !== null;
    let name = "";
    let itemClassId = defaultClassId;
    let gender = "";
    let nisn = "";

    if (isObj) {
      name = (item.name || "").trim();
      itemClassId = item.classId || defaultClassId;
      gender = item.gender || "";
      nisn = item.nisn || "";
    } else {
      const str = String(item).trim();
      if (str.includes("|")) {
        const parts = str.split("|").map(p => p.trim());
        name = parts[0] || "";
        if (parts[1] && (classMap.has(parts[1]) || classMap.has(parts[1].toLowerCase()))) {
          itemClassId = classMap.get(parts[1])?.id || classMap.get(parts[1].toLowerCase())?.id;
        } else if (parts[1] && (parts[1] === "L" || parts[1] === "P")) {
          gender = parts[1];
        }
      } else if (str.includes(",")) {
        const parts = str.split(",").map(p => p.trim());
        name = parts[0] || "";
        if (parts[1] && (classMap.has(parts[1]) || classMap.has(parts[1].toLowerCase()))) {
          itemClassId = classMap.get(parts[1])?.id || classMap.get(parts[1].toLowerCase())?.id;
        }
      } else {
        name = str;
      }
    }

    if (!name) continue;

    const targetClass = classMap.get(itemClassId) || classMap.get(defaultClassId);
    if (!targetClass) continue;

    if (!gender) gender = guessGenderFromName(name);

    const count = await prisma.student.count({ where: { classId: targetClass.id } });
    const currentInc = classIncrementMap.get(targetClass.id) || 0;
    const newCount = count + currentInc + 1;
    classIncrementMap.set(targetClass.id, currentInc + 1);

    const studentId = `STD-${targetClass.id}-${String(newCount).padStart(2, "0")}`;
    const academicYearId = targetClass.semester?.academicYearId || "AY2026";

    const student = await prisma.student.create({
      data: {
        id: studentId,
        classId: targetClass.id,
        name,
        gender: gender || "L",
        nisn: nisn || "",
        currentGrade: targetClass.grade || 7,
        entryYear: "2026",
        attendance: 0,
        worksheetCompletion: 0,
        averageScore: 0,
        status: "active",
        strengths: "[]",
        weaknesses: "[]",
        achievements: "[]",
        parentName: "",
        parentPhone: "",
      },
    });

    await prisma.studentEnrollment.create({
      data: {
        id: `ENR-${academicYearId}-${targetClass.id}-${student.id}`,
        studentId: student.id,
        classId: targetClass.id,
        academicYearId,
        grade: targetClass.grade || 7,
        status: "active",
        enrollmentDate: todayStr,
        finalScore: 0,
        attendanceRate: 0,
        notes: "Siswa baru terdaftar via bulk add",
      },
    });

    let candidateUserId = `USR-${student.id}`;
    const cleanEmailBase = name.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/);
    let baseEmail = cleanEmailBase.length > 1
      ? `${cleanEmailBase[0]}.${cleanEmailBase[cleanEmailBase.length - 1]}@siswa.spins.sch.id`
      : `${cleanEmailBase[0] || 'student'}@siswa.spins.sch.id`;

    let studentEmail = baseEmail;
    let emailSuffix = 1;
    while (await prisma.user.findUnique({ where: { email: studentEmail } })) {
      const parts = baseEmail.split("@");
      studentEmail = `${parts[0]}${emailSuffix++}@${parts[1]}`;
    }

    await prisma.user.create({
      data: {
        id: candidateUserId,
        email: studentEmail,
        name: student.name,
        role: "student",
        status: "active",
        studentId: student.id,
        password: defaultPasswordHash,
        createdAt: todayStr,
      },
    });

    createdStudents.push({ ...student, class: { id: targetClass.id, name: targetClass.name } });
  }

  for (const [clsId, inc] of classIncrementMap.entries()) {
    await prisma.class.update({
      where: { id: clsId },
      data: { studentCount: { increment: inc } },
    });
  }

  await clearStudentCaches();
  await cache.delPattern("classes:*");

  const defaultCls = classMap.get(defaultClassId);
  await logActivity({
    type: "student",
    message: `Guru ${user?.name || defaultCls?.teacher?.name || "Guru"} menambahkan ${createdStudents.length} siswa baru secara bulk${defaultCls ? ` ke ${defaultCls.name}` : ""}`,
    icon: "Users",
    teacherId: user?.teacherId || defaultCls?.teacherId,
    teacherName: user?.name || defaultCls?.teacher?.name,
  });

  return createdStudents;
}

async function updateStudent(id, body, user = null) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Student not found");
  }

  const {
    name, gender, nisn, attendance, worksheetCompletion,
    averageScore, status, strengths, weaknesses, achievements,
    parentName, parentPhone,
  } = body;

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(gender !== undefined && { gender }),
      ...(nisn !== undefined && { nisn }),
      ...(attendance !== undefined && { attendance: parseFloat(attendance) }),
      ...(worksheetCompletion !== undefined && { worksheetCompletion: parseFloat(worksheetCompletion) }),
      ...(averageScore !== undefined && { averageScore: parseFloat(averageScore) }),
      ...(status !== undefined && { status }),
      ...(strengths !== undefined && { strengths: safeJsonStringify(strengths) }),
      ...(weaknesses !== undefined && { weaknesses: safeJsonStringify(weaknesses) }),
      ...(achievements !== undefined && { achievements: safeJsonStringify(achievements) }),
      ...(parentName !== undefined && { parentName }),
      ...(parentPhone !== undefined && { parentPhone }),
    },
  });

  await clearStudentCaches();
  await cache.set(`students:detail:${id}`, updated, 600);

  await logActivity({
    type: "student",
    message: `Guru ${user?.name || "Guru"} memperbarui profil siswa ${updated.name}`,
    icon: "UserCheck",
    teacherId: user?.teacherId,
    teacherName: user?.name,
  });

  return updated;
}

async function deleteStudent(id, user = null) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Student not found");
  }

  await prisma.$transaction([
    prisma.studentEnrollment.deleteMany({ where: { studentId: id } }),
    prisma.attendance.deleteMany({ where: { studentId: id } }),
    prisma.score.deleteMany({ where: { studentId: id } }),
    prisma.submission.deleteMany({ where: { studentId: id } }),
    prisma.student.delete({ where: { id } }),
    prisma.class.update({
      where: { id: existing.classId },
      data: { studentCount: { decrement: 1 } },
    }),
  ]);

  await clearStudentCaches();
  await cache.del(`students:detail:${id}`);

  await logActivity({
    type: "student",
    message: `Guru ${user?.name || "Guru"} menghapus data siswa ${existing.name}`,
    icon: "Trash2",
    teacherId: user?.teacherId,
    teacherName: user?.name,
  });

  return true;
}

/**
 * Promote students from source class to target class (Naik Kelas berjenjang)
 */
async function promoteStudents(body) {
  const {
    sourceClassId,
    targetClassId,
    studentIds,
    academicYearId: customYearId,
    action = "promoted",
    notes = "",
  } = body;

  if (!targetClassId) {
    throw new BadRequestError("targetClassId is required");
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: targetClassId },
    include: { semester: true },
  });
  if (!targetClass) {
    throw new NotFoundError("Target class not found");
  }

  const academicYearId = customYearId || targetClass.semester?.academicYearId || "AY2025";
  const todayStr = new Date().toISOString().split("T")[0];

  let selectedStudents = [];
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    selectedStudents = await prisma.student.findMany({
      where: { id: { in: studentIds } },
    });
  } else if (sourceClassId) {
    selectedStudents = await prisma.student.findMany({
      where: { classId: sourceClassId },
    });
  } else {
    throw new BadRequestError("studentIds array or sourceClassId required");
  }

  if (selectedStudents.length === 0) {
    throw new BadRequestError("No students found to promote");
  }

  const promotedList = [];

  for (const st of selectedStudents) {
    // 1. If student was enrolled in source class, archive that enrollment
    if (sourceClassId) {
      await prisma.studentEnrollment.updateMany({
        where: {
          studentId: st.id,
          classId: sourceClassId,
        },
        data: {
          status: action,
          completionDate: todayStr,
          finalScore: st.averageScore,
          attendanceRate: st.attendance,
          notes: notes || `Siswa ${action === "promoted" ? "naik" : "dipindahkan"} ke ${targetClass.name}`,
        },
      });
    }

    // 2. Create or update new enrollment in target class
    const enrollmentId = `ENR-${academicYearId}-${targetClassId}-${st.id}`;
    const enrollment = await prisma.studentEnrollment.upsert({
      where: {
        studentId_classId: {
          studentId: st.id,
          classId: targetClassId,
        },
      },
      update: {
        academicYearId,
        semesterId: targetClass.semesterId,
        grade: targetClass.grade,
        status: "active",
        enrollmentDate: todayStr,
        notes: notes || `Terdaftar aktif di ${targetClass.name}`,
      },
      create: {
        id: enrollmentId,
        studentId: st.id,
        classId: targetClassId,
        academicYearId,
        semesterId: targetClass.semesterId,
        grade: targetClass.grade,
        status: "active",
        enrollmentDate: todayStr,
        notes: notes || `Terdaftar aktif di ${targetClass.name}`,
      },
    });

    // 3. Update student master active pointers
    await prisma.student.update({
      where: { id: st.id },
      data: {
        classId: targetClassId,
        currentGrade: targetClass.grade,
      },
    });

    promotedList.push({
      studentId: st.id,
      name: st.name,
      nisn: st.nisn,
      previousClassId: sourceClassId || st.classId,
      newClassId: targetClassId,
      newGrade: targetClass.grade,
      enrollmentId: enrollment.id,
    });
  }

  // 4. Update student count on target class
  const activeCount = await prisma.student.count({
    where: { classId: targetClassId },
  });
  await prisma.class.update({
    where: { id: targetClassId },
    data: { studentCount: activeCount },
  });

  if (sourceClassId) {
    const sourceCount = await prisma.student.count({
      where: { classId: sourceClassId },
    });
    await prisma.class.update({
      where: { id: sourceClassId },
      data: { studentCount: sourceCount },
    });
  }

  await clearStudentCaches();
  await cache.delPattern("classes:*");

  return {
    success: true,
    totalPromoted: promotedList.length,
    targetClass: {
      id: targetClass.id,
      name: targetClass.name,
      grade: targetClass.grade,
    },
    students: promotedList,
    message: `Berhasil menaikkan / mengimpor ${promotedList.length} siswa ke ${targetClass.name}. Riwayat kelas sebelumnya tetap tersimpan utuh.`,
  };
}

/**
 * Import existing master students to a class
 */
async function importStudentsToClass(classId, studentIds, notes = "") {
  return promoteStudents({
    targetClassId: classId,
    studentIds,
    action: "promoted",
    notes: notes || "Diimpor ke kelas baru",
  });
}

/**
 * Get full multi-year academic history for a student
 */
async function getStudentAcademicHistory(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { studentId },
    include: {
      class: true,
      academicYear: true,
    },
    orderBy: [{ grade: "asc" }, { enrollmentDate: "asc" }],
  });

  const scores = await prisma.score.findMany({
    where: { studentId },
    include: { class: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: { class: true },
  });

  const history = enrollments.map((enr) => {
    const classScores = scores.filter((s) => s.classId === enr.classId);
    const classAtt = attendances.filter((a) => a.classId === enr.classId);
    const avgScore = classScores.length > 0
      ? Math.round(classScores.reduce((acc, c) => acc + c.score, 0) / classScores.length)
      : (enr.finalScore || 0);

    const attPresent = classAtt.filter((a) => a.status === "present").length;
    const attTotal = classAtt.length;
    const attRate = attTotal > 0
      ? Math.round((attPresent / attTotal) * 100)
      : (enr.attendanceRate || 0);

    return {
      enrollmentId: enr.id,
      classId: enr.classId,
      className: enr.class.name,
      grade: enr.grade,
      academicYearId: enr.academicYearId,
      academicYearName: enr.academicYear.name,
      status: enr.status,
      enrollmentDate: enr.enrollmentDate,
      completionDate: enr.completionDate,
      finalScore: avgScore,
      attendanceRate: attRate,
      notes: enr.notes,
      totalEvaluations: classScores.length,
      totalMeetingsAttended: attPresent,
    };
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      nisn: student.nisn,
      currentGrade: student.currentGrade,
      currentClass: student.class?.name || null,
      status: student.status,
    },
    totalYearsRecorded: enrollments.length,
    timeline: history,
  };
}

/**
 * Get promotion candidates (students from previous grade)
 */
async function getPromotionCandidates(targetClassId) {
  const targetClass = await prisma.class.findUnique({
    where: { id: targetClassId },
  });
  if (!targetClass) {
    throw new NotFoundError("Target class not found");
  }

  const prevGrade = targetClass.grade > 7 ? targetClass.grade - 1 : targetClass.grade;
  const sourceClasses = await prisma.class.findMany({
    where: {
      id: { not: targetClassId },
      grade: prevGrade,
    },
    include: {
      students: true,
    },
  });

  return {
    targetClass: {
      id: targetClass.id,
      name: targetClass.name,
      grade: targetClass.grade,
    },
    eligiblePreviousGrade: prevGrade,
    sourceClasses: sourceClasses.map((sc) => ({
      classId: sc.id,
      className: sc.name,
      grade: sc.grade,
      studentCount: sc.students.length,
      students: sc.students.map((s) => ({
        id: s.id,
        name: s.name,
        nisn: s.nisn,
        gender: s.gender,
        attendance: s.attendance,
        averageScore: s.averageScore,
        currentGrade: s.currentGrade,
      })),
    })),
  };
}

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
  promoteStudents,
  importStudentsToClass,
  getStudentAcademicHistory,
  getPromotionCandidates,
};
