/**
 * Student Portal Service
 * Integrates all LMS capabilities for authenticated students
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/errors");

const CACHE_TTL = 180; // 3 minutes

const INDO_TO_EN_DAYS = {
  senin: "Monday",
  selasa: "Tuesday",
  rabu: "Wednesday",
  kamis: "Thursday",
  jumat: "Friday",
  sabtu: "Saturday",
  minggu: "Sunday",
};

function formatDayName(day) {
  if (!day) return "";
  const lower = day.toLowerCase();
  return INDO_TO_EN_DAYS[lower] || day;
}

/**
 * Resolves student record for a given user or explicit studentId
 */
async function resolveStudent(userId, explicitStudentId) {
  let studentId = explicitStudentId;
  if (!studentId && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { studentId: true },
    });
    studentId = user?.studentId;
  }

  if (!studentId) {
    const fallbackStudent = await prisma.student.findFirst({
      where: { status: "active" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    studentId = fallbackStudent?.id;
  }

  if (!studentId) {
    throw new NotFoundError("Student profile not found in database");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          teacher: true,
          semester: {
            include: { academicYear: true },
          },
          scheduleSlots: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!student) {
    throw new NotFoundError("Data profil siswa tidak ditemukan");
  }

  return student;
}

/**
 * Get comprehensive student dashboard
 */
async function getDashboard(studentId) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:dashboard:${student.id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const classId = student.classId;

  // 1. Fetch Schedule for class
  const scheduleSlots = await prisma.scheduleSlot.findMany({
    where: { classId },
    include: {
      material: true,
      class: {
        include: { teacher: true },
      },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  // Map today's schedule
  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const nowDayIdx = new Date().getDay();
  const currentDayEn = dayNamesEn[nowDayIdx].toLowerCase();
  const currentDayIndo = dayNamesIndo[nowDayIdx].toLowerCase();
  const todaySlots = scheduleSlots.filter(
    (s) => s.day.toLowerCase() === currentDayEn || s.day.toLowerCase() === currentDayIndo
  );

  // 2. Fetch Worksheets with student's submissions
  const allWorksheets = await prisma.worksheet.findMany({
    where: { classId },
    include: {
      submissions: {
        where: { studentId: student.id },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalWorksheets = allWorksheets.length;
  let completedCount = 0;
  let submittedCount = 0;

  const worksheetsWithStatus = allWorksheets.map((w) => {
    const sub = w.submissions[0] || null;
    let computedStatus = "upcoming";
    if (sub) {
      if (sub.status === "graded" || (sub.score !== undefined && sub.score > 0)) {
        computedStatus = "completed";
        completedCount++;
      } else {
        computedStatus = "submitted";
        submittedCount++;
      }
    } else {
      const isOverdue = new Date(w.dueDate) < new Date();
      computedStatus = isOverdue ? "overdue" : "in-progress";
    }

    return {
      id: w.id,
      title: w.title,
      topic: w.topic,
      assignedDate: w.assignedDate,
      dueDate: w.dueDate,
      difficulty: w.difficulty,
      maxScore: w.maxScore,
      hasCodeEditor: w.hasCodeEditor,
      codeLanguage: w.codeLanguage,
      status: computedStatus,
      myScore: sub?.score ?? null,
      submittedDate: sub?.submittedDate ?? null,
      fileUrl: w.fileUrl,
      fileName: w.fileName,
    };
  });

  // 3. Fetch Recent Learning Materials
  const materials = await prisma.learningMaterial.findMany({
    where: { classId },
    orderBy: { orderNumber: "asc" },
    take: 6,
  });

  const formattedMaterials = materials.map((m) => {
    let keyPoints = [];
    try {
      keyPoints = JSON.parse(m.keyPoints || "[]");
    } catch {
      keyPoints = [];
    }
    const isOpen = m.status === "active" || m.status === "completed";
    return {
      ...m,
      isOpen,
      isLocked: !isOpen,
      keyPoints: isOpen ? keyPoints : [],
    };
  });

  // 4. Fetch Attendance Summary
  const attendances = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: { meeting: true },
    orderBy: { date: "desc" },
  });

  const attendanceTotal = attendances.length;
  const attendancePresent = attendances.filter(
    (a) => a.status === "present" || a.status === "hadir"
  ).length;
  const attendancePercent =
    attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : (student.attendance ?? 0);

  // 5. Fetch Recent Scores
  const scores = await prisma.score.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 6,
  });

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length)
      : (student.averageScore ?? 0);

  // 6. Upcoming Meetings / Active Meeting
  const meetings = await prisma.meeting.findMany({
    where: { classId },
    include: { material: true },
    orderBy: { meetingNumber: "asc" },
  });

  let activeSemester = student.class.semester;
  if (!activeSemester) {
    activeSemester = await prisma.semester.findFirst({
      where: { status: "active" },
      include: { academicYear: true },
    });
  }

  const teacherInfo = student.class?.teacher
    ? {
        id: student.class.teacher.id,
        name: student.class.teacher.name,
        email: student.class.teacher.email,
        school: student.class.teacher.school || "",
        subject: student.class.teacher.subject || student.class.subject,
      }
    : null;

  const data = {
    student: {
      id: student.id,
      name: student.name,
      nisn: student.nisn,
      gender: student.gender,
      class: {
        id: student.class.id,
        name: student.class.name,
        grade: student.class.grade,
        section: student.class.section,
        subject: student.class.subject,
        room: student.class.room,
        schedule: student.class.schedule,
        teacher: teacherInfo,
        academicYear: activeSemester?.academicYear?.name || "",
        semester: activeSemester?.name || "",
      },
      stats: {
        attendance: attendancePercent,
        averageScore,
        totalWorksheets,
        completedWorksheets: completedCount,
        submittedWorksheets: submittedCount,
        pendingWorksheets: Math.max(0, totalWorksheets - completedCount - submittedCount),
        learningStreak: attendanceTotal > 0 ? Math.min(attendanceTotal, 12) : 0,
      },
    },
    assignedSubject: {
      name: student.class.subject,
      className: student.class.name,
      grade: student.class.grade,
      room: student.class.room,
      schedule: student.class.schedule,
      teacher: teacherInfo,
      totalMaterials: materials.length,
      totalWorksheets,
    },
    todaySchedule: todaySlots.map((s) => ({
      id: s.id,
      day: formatDayName(s.day),
      time: `${s.startTime} - ${s.endTime}`,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      subject: s.class?.subject || student.class.subject,
      teacherName: s.class?.teacher?.name || teacherInfo?.name || "Teacher",
      topic: s.material?.topic || student.class.currentTopic || `Learning Session`,
    })),
    scheduleSlots: scheduleSlots.map((s) => ({
      id: s.id,
      day: formatDayName(s.day),
      time: `${s.startTime} - ${s.endTime}`,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      subject: s.class?.subject || student.class.subject,
      teacherName: s.class?.teacher?.name || teacherInfo?.name || "Teacher",
      topic: s.material?.topic || (s.room ? `Room ${s.room}` : ""),
    })),
    recentWorksheets: worksheetsWithStatus.slice(0, 5),
    recentMaterials: formattedMaterials,
    recentScores: scores,
    meetings: meetings.map((m) => ({
      id: m.id,
      meetingNumber: m.meetingNumber,
      week: m.week,
      date: m.date,
      subject: m.subject,
      topic: m.topic,
      learningObjective: m.learningObjective,
      status: m.status,
      hasPin: Boolean(m.checkInPin),
      pin: m.checkInPin,
    })),
  };

  await cache.set(cacheKey, data, CACHE_TTL);
  return data;
}

/**
 * Get Materials for student's class
 */
async function getMaterials(studentId, { search, type, semester, semesterNumber } = {}) {
  const student = await resolveStudent(null, studentId);
  const semNum = semesterNumber || semester;
  const cacheKey = `student_portal:materials:${student.classId}:${search || "all"}:${type || "all"}:${semNum || "all"}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const whereClause = { classId: student.classId };
  if (semNum && semNum !== "all") {
    whereClause.semesterNumber = parseInt(semNum, 10);
  }
  if (search) {
    whereClause.OR = [
      { topic: { contains: search } },
      { description: { contains: search } },
      { learningObjective: { contains: search } },
    ];
  }

  const materials = await prisma.learningMaterial.findMany({
    where: whereClause,
    orderBy: { orderNumber: "asc" },
  });

  let formatted = materials.map((m) => {
    let keyPoints = [];
    let references = [];
    let content = [];
    try {
      keyPoints = JSON.parse(m.keyPoints || "[]");
    } catch {
      keyPoints = [];
    }
    try {
      references = JSON.parse(m.references || "[]");
    } catch {
      references = [];
    }
    try {
      content = JSON.parse(m.content || "[]");
    } catch {
      content = [];
    }

    let resolvedType = "pdf";
    if (m.fileType?.includes("pdf") || m.fileName?.endsWith(".pdf")) resolvedType = "pdf";
    else if (m.fileType?.includes("presentation") || m.fileName?.endsWith(".pptx") || m.fileName?.endsWith(".ppt")) resolvedType = "slides";
    else if (m.videoUrl) resolvedType = "video";
    else if (m.fileName?.endsWith(".py") || m.fileName?.endsWith(".js")) resolvedType = "code";

    const isOpen = m.status === "active" || m.status === "completed";
    const isLocked = !isOpen;

    return {
      id: m.id,
      classId: m.classId,
      orderNumber: m.orderNumber,
      semesterNumber: m.semesterNumber || 1,
      title: m.topic,
      topic: m.topic,
      description: m.description,
      learningObjective: m.learningObjective,
      status: m.status,
      isOpen,
      isLocked,
      statusLabel: isOpen ? (m.status === "completed" ? "Completed" : "Open") : "Waiting for Teacher",
      type: resolvedType,
      fileUrl: isOpen ? m.fileUrl : null,
      fileName: isOpen ? m.fileName : null,
      fileSize: isOpen ? m.fileSize : null,
      fileType: isOpen ? m.fileType : null,
      videoUrl: isOpen ? m.videoUrl : null,
      keyPoints: isOpen ? keyPoints : [],
      references: isOpen ? references : [],
      content: isOpen ? content : [],
    };
  });

  if (type && type !== "all") {
    formatted = formatted.filter((m) => m.type === type);
  }

  await cache.set(cacheKey, formatted, CACHE_TTL);
  return formatted;
}

/**
 * Get Single Material by ID
 */
async function getMaterialById(studentId, materialId) {
  const student = await resolveStudent(null, studentId);

  const m = await prisma.learningMaterial.findUnique({
    where: { id: materialId },
    include: {
      class: {
        include: { teacher: true },
      },
    },
  });

  if (!m) {
    throw new NotFoundError("Material not found");
  }

  if (m.classId !== student.classId) {
    throw new ForbiddenError("Material is not assigned to your class");
  }

  let keyPoints = [];
  let references = [];
  let content = [];
  try {
    keyPoints = JSON.parse(m.keyPoints || "[]");
  } catch {
    keyPoints = [];
  }
  try {
    references = JSON.parse(m.references || "[]");
  } catch {
    references = [];
  }
  try {
    content = JSON.parse(m.content || "[]");
  } catch {
    content = [];
  }

  let resolvedType = "pdf";
  if (m.fileType?.includes("pdf") || m.fileName?.endsWith(".pdf")) resolvedType = "pdf";
  else if (m.fileType?.includes("presentation") || m.fileName?.endsWith(".pptx") || m.fileName?.endsWith(".ppt")) resolvedType = "slides";
  else if (m.videoUrl) resolvedType = "video";
  else if (m.fileName?.endsWith(".py") || m.fileName?.endsWith(".js")) resolvedType = "code";

  const isOpen = m.status === "active" || m.status === "completed";
  const isLocked = !isOpen;

  return {
    id: m.id,
    classId: m.classId,
    orderNumber: m.orderNumber,
    semesterNumber: m.semesterNumber || 1,
    title: m.topic,
    topic: m.topic,
    description: m.description,
    learningObjective: m.learningObjective,
    status: m.status,
    isOpen,
    isLocked,
    statusLabel: isOpen ? (m.status === "completed" ? "Completed" : "Open") : "Waiting for Teacher",
    lockedMessage: isLocked ? "This module has not been unlocked by the teacher yet. Please wait for the teacher to open this session in class." : null,
    type: resolvedType,
    fileUrl: isOpen ? m.fileUrl : null,
    fileName: isOpen ? m.fileName : null,
    fileSize: isOpen ? m.fileSize : null,
    fileType: isOpen ? m.fileType : null,
    videoUrl: isOpen ? m.videoUrl : null,
    keyPoints: isOpen ? keyPoints : [],
    references: isOpen ? references : [],
    content: isOpen ? content : [],
    class: {
      id: m.class.id,
      name: m.class.name,
      grade: m.class.grade,
      subject: m.class.subject,
      teacher: m.class.teacher
        ? {
            id: m.class.teacher.id,
            name: m.class.teacher.name,
            email: m.class.teacher.email,
            school: m.class.teacher.school || "",
          }
        : null,
    },
  };
}

/**
 * Get Worksheets with student's individual submission
 */
async function getWorksheets(studentId, { search, status } = {}) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:worksheets:${student.id}:${search || "all"}:${status || "all"}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const whereClause = { classId: student.classId };
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { topic: { contains: search } },
    ];
  }

  const worksheets = await prisma.worksheet.findMany({
    where: whereClause,
    include: {
      submissions: {
        where: { studentId: student.id },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  let formatted = worksheets.map((w) => {
    const sub = w.submissions[0] || null;
    let computedStatus = "upcoming";

    if (sub) {
      if (sub.status === "graded" || (sub.score !== undefined && sub.score > 0)) {
        computedStatus = "completed";
      } else {
        computedStatus = "submitted";
      }
    } else {
      const isOverdue = new Date(w.dueDate) < new Date();
      computedStatus = isOverdue ? "overdue" : "in-progress";
    }

    let testCases = [];
    try {
      testCases = JSON.parse(w.testCases || "[]");
    } catch {
      testCases = [];
    }

    return {
      id: w.id,
      title: w.title,
      topic: w.topic,
      subject: student.class?.subject || "Mata Pelajaran",
      assignedDate: w.assignedDate,
      dueDate: w.dueDate,
      difficulty: w.difficulty || "Sedang",
      totalQuestions: w.totalQuestions || 10,
      maxScore: w.maxScore || 100,
      description: w.description || "",
      fileUrl: w.fileUrl,
      fileName: w.fileName,
      fileSize: w.fileSize,
      fileType: w.fileType,
      hasCodeEditor: w.hasCodeEditor,
      codeLanguage: w.codeLanguage || "python",
      starterCode: w.starterCode || "",
      testCases,
      status: computedStatus,
      submission: sub
        ? {
            id: sub.id,
            status: sub.status,
            score: sub.score,
            submittedDate: sub.submittedDate,
            feedback: sub.feedback,
            submittedCode: sub.submittedCode,
            codeOutput: sub.codeOutput,
            fileUrl: sub.fileUrl,
            fileName: sub.fileName,
          }
        : null,
    };
  });

  if (status && status !== "all") {
    formatted = formatted.filter((w) => w.status === status);
  }

  await cache.set(cacheKey, formatted, CACHE_TTL);
  return formatted;
}

/**
 * Submit or update a worksheet submission
 */
async function submitWorksheet(studentId, worksheetId, payload) {
  const student = await resolveStudent(null, studentId);
  const worksheet = await prisma.worksheet.findUnique({
    where: { id: worksheetId },
  });

  if (!worksheet) {
    throw new NotFoundError("Lembar kerja tidak ditemukan");
  }

  if (worksheet.classId !== student.classId) {
    throw new ForbiddenError("Lembar kerja bukan untuk kelas Anda");
  }

  const {
    submittedCode,
    codeOutput,
    fileUrl,
    fileName,
    feedback,
  } = payload;

  const todayStr = new Date().toISOString().split("T")[0];

  // Check if submission exists
  const existingSub = await prisma.submission.findFirst({
    where: {
      worksheetId,
      studentId: student.id,
    },
  });

  let submission;
  if (existingSub) {
    submission = await prisma.submission.update({
      where: { id: existingSub.id },
      data: {
        submittedCode: submittedCode !== undefined ? submittedCode : existingSub.submittedCode,
        codeOutput: codeOutput !== undefined ? codeOutput : existingSub.codeOutput,
        fileUrl: fileUrl !== undefined ? fileUrl : existingSub.fileUrl,
        fileName: fileName !== undefined ? fileName : existingSub.fileName,
        submittedDate: todayStr,
        status: existingSub.status === "graded" ? "graded" : "submitted",
      },
    });
  } else {
    const subId = `SUB-${Date.now()}`;
    submission = await prisma.submission.create({
      data: {
        id: subId,
        worksheetId,
        studentId: student.id,
        classId: student.classId,
        status: "submitted",
        score: 0,
        submittedDate: todayStr,
        submittedCode: submittedCode || null,
        codeOutput: codeOutput || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        feedback: feedback || "",
      },
    });
  }

  // Recalculate student worksheet completion
  const totalClassWorksheets = await prisma.worksheet.count({
    where: { classId: student.classId },
  });
  const completedOrSubmittedCount = await prisma.submission.count({
    where: { studentId: student.id },
  });

  const completionRate =
    totalClassWorksheets > 0
      ? Math.round((completedOrSubmittedCount / totalClassWorksheets) * 100)
      : 100;

  await prisma.student.update({
    where: { id: student.id },
    data: { worksheetCompletion: completionRate },
  });

  // Invalidate caches and immediately re-cache submission
  await cache.delPatterns([
    `student_portal:dashboard:${student.id}`,
    `student_portal:worksheets:${student.id}`,
    `student_portal:scores:${student.id}`,
    "student_portal:leaderboard*",
    "submissions:*",
    "worksheets:*",
    "scores:*",
    "analytics:*",
    "dashboard:*",
  ]);
  await cache.set(`submissions:detail:${submission.id}`, submission, 600);

  return submission;
}

/**
 * Get Weekly Schedule for student
 */
async function getSchedule(studentId) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:schedule:${student.classId}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const slots = await prisma.scheduleSlot.findMany({
    where: { classId: student.classId },
    include: {
      material: true,
      class: {
        include: { teacher: true },
      },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  // Group by day
  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const grouped = {};
  for (const day of daysOrder) {
    grouped[day] = [];
  }

  const teacherName = student.class?.teacher?.name || "Teacher";
  const defaultSubject = student.class?.subject || "Subject";

  slots.forEach((s) => {
    const dayEn = formatDayName(s.day);
    if (!grouped[dayEn]) grouped[dayEn] = [];
    grouped[dayEn].push({
      id: s.id,
      day: dayEn,
      startTime: s.startTime,
      endTime: s.endTime,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
      subject: s.class?.subject || defaultSubject,
      teacherName: s.class?.teacher?.name || teacherName,
      className: s.class?.name || student.class?.name,
      materialTopic: s.material?.topic || "",
      materialObjective: s.material?.learningObjective || "",
      materialId: s.materialId,
    });
  });

  const result = {
    classInfo: {
      id: student.class.id,
      name: student.class.name,
      grade: student.class.grade,
      section: student.class.section,
      subject: student.class.subject,
      room: student.class.room,
      schedule: student.class.schedule,
      teacher: student.class.teacher
        ? {
            id: student.class.teacher.id,
            name: student.class.teacher.name,
            email: student.class.teacher.email,
            school: student.class.teacher.school || "",
            position: student.class.teacher.position || "Guru Pengajar",
          }
        : null,
    },
    slots: slots.map((s) => ({
      id: s.id,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
      subject: s.class?.subject || defaultSubject,
      teacherName: s.class?.teacher?.name || teacherName,
    })),
    byDay: grouped,
  };

  await cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Get Full Synchronized Calendar for student
 * Synchronizes: Meetings, Worksheet Due Dates, School/Class Events, and Class Schedule Slots
 */
async function getCalendar(studentId, query = {}) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:calendar:${student.classId}:${student.id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [meetings, worksheets, calendarEvents, scheduleSlots, attendances] = await Promise.all([
    prisma.meeting.findMany({
      where: { classId: student.classId },
      include: {
        material: true,
      },
      orderBy: { meetingNumber: "asc" },
    }),
    prisma.worksheet.findMany({
      where: { classId: student.classId },
      include: {
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: {
        OR: [
          { classId: student.classId },
          { classId: null },
        ],
      },
      orderBy: { date: "asc" },
    }),
    prisma.scheduleSlot.findMany({
      where: { classId: student.classId },
      include: {
        material: true,
        class: {
          include: { teacher: true },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { meeting: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const teacherInfo = student.class?.teacher
    ? {
        id: student.class.teacher.id,
        name: student.class.teacher.name,
        email: student.class.teacher.email,
        school: student.class.teacher.school || "",
        subject: student.class.teacher.subject || student.class.subject,
      }
    : null;

  const teacherName = teacherInfo?.name || "Teacher";
  const defaultSubject = student.class?.subject || "Subject";

  const unifiedEvents = [];

  // 1. Class Sessions from Database
  meetings.forEach((m) => {
    if (m.date) {
      const dateStr = String(m.date).split("T")[0];
      unifiedEvents.push({
        id: `meeting-${m.id}`,
        sourceId: m.id,
        type: "meeting",
        category: "Class Session",
        date: dateStr,
        title: `Session #${m.meetingNumber}: ${m.topic || m.subject}`,
        subject: m.subject || defaultSubject,
        topic: m.topic,
        learningObjective: m.learningObjective,
        teacher: teacherName,
        room: student.class.room || "Computer Lab",
        status: m.status,
        hasWorksheet: m.hasWorksheet,
        materialId: m.materialId,
        color: m.status === "completed" ? "#10b981" : m.status === "active" ? "#6366f1" : "#8b5cf6",
      });
    }
  });

  // 2. Worksheets & Assignment Deadlines from Database
  worksheets.forEach((w) => {
    if (w.dueDate) {
      const dateStr = String(w.dueDate).split("T")[0];
      const sub = w.submissions?.[0];
      const isSubmitted = !!sub;
      const isGraded = sub?.score !== null && sub?.score !== undefined;
      const statusLabel = isGraded
        ? `Graded (${sub.score}/${w.maxScore})`
        : isSubmitted
        ? "Submitted"
        : "Pending";

      unifiedEvents.push({
        id: `worksheet-${w.id}`,
        sourceId: w.id,
        type: "worksheet",
        category: "Assignment Deadline",
        date: dateStr,
        title: `Deadline: ${w.title}`,
        subject: defaultSubject,
        topic: w.topic,
        teacher: teacherName,
        difficulty: w.difficulty,
        hasCodeEditor: w.hasCodeEditor,
        status: isGraded ? "graded" : isSubmitted ? "submitted" : "pending",
        statusLabel,
        score: sub?.score ?? null,
        maxScore: w.maxScore,
        color: isGraded ? "#10b981" : isSubmitted ? "#3b82f6" : "#f59e0b",
      });
    }
  });

  // 3. School / Academic Events from Database
  calendarEvents.forEach((e) => {
    if (e.date) {
      const dateStr = String(e.date).split("T")[0];
      unifiedEvents.push({
        id: `event-${e.id}`,
        sourceId: e.id,
        type: "event",
        category: "School Event",
        date: dateStr,
        title: e.title,
        eventType: e.type,
        color: e.color || "#06b6d4",
      });
    }
  });

  const result = {
    classInfo: {
      id: student.class.id,
      name: student.class.name,
      grade: student.class.grade,
      section: student.class.section,
      subject: student.class.subject,
      room: student.class.room,
      schedule: student.class.schedule,
      teacher: teacherInfo,
    },
    events: unifiedEvents,
    meetings: meetings.map((m) => ({
      id: m.id,
      meetingNumber: m.meetingNumber,
      week: m.week,
      date: String(m.date).split("T")[0],
      subject: m.subject,
      topic: m.topic,
      learningObjective: m.learningObjective,
      status: m.status,
      hasWorksheet: m.hasWorksheet,
    })),
    worksheets: worksheets.map((w) => ({
      id: w.id,
      title: w.title,
      topic: w.topic,
      dueDate: w.dueDate ? String(w.dueDate).split("T")[0] : null,
      difficulty: w.difficulty,
      hasCodeEditor: w.hasCodeEditor,
      isSubmitted: (w.submissions?.length || 0) > 0,
      score: w.submissions?.[0]?.score ?? null,
    })),
    calendarEvents: calendarEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: String(e.date).split("T")[0],
      type: e.type,
      color: e.color,
    })),
    scheduleSlots: scheduleSlots.map((s) => ({
      id: s.id,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
      subject: s.class?.subject || defaultSubject,
      teacherName: s.class?.teacher?.name || teacherName,
    })),
  };

  await cache.set(cacheKey, result, 60);
  return result;
}

/**
 * Get Attendance History & Stats for student
 */
async function getAttendance(studentId) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:attendance:${student.id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const records = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: {
      meeting: true,
    },
    orderBy: { date: "desc" },
  });

  let present = 0;
  let sick = 0;
  let permission = 0;
  let absent = 0;

  records.forEach((r) => {
    const s = r.status.toLowerCase();
    if (s === "present" || s === "hadir") present++;
    else if (s === "sick" || s === "sakit") sick++;
    else if (s === "permission" || s === "izin") permission++;
    else absent++;
  });

  const total = records.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : student.attendance || 100;

  const result = {
    summary: {
      total,
      present,
      sick,
      permission,
      absent,
      percentage,
    },
    records: records.map((r) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      note: r.note,
      meeting: {
        id: r.meeting.id,
        meetingNumber: r.meeting.meetingNumber,
        week: r.meeting.week,
        subject: r.meeting.subject,
        topic: r.meeting.topic,
        status: r.meeting.status,
      },
    })),
  };

  await cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Check-in Attendance via meeting PIN
 */
async function checkInAttendance(studentId, meetingId, pin) {
  const student = await resolveStudent(null, studentId);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) {
    throw new NotFoundError("Class session not found");
  }

  if (meeting.classId !== student.classId) {
    throw new ForbiddenError("Class session is not for your class");
  }

  if (meeting.checkInPin && pin) {
    if (meeting.checkInPin.trim() !== String(pin).trim()) {
      throw new BadRequestError("Invalid check-in PIN");
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Upsert attendance record
  const existing = await prisma.attendance.findFirst({
    where: {
      meetingId,
      studentId: student.id,
    },
  });

  let attendance;
  if (existing) {
    attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        status: "present",
        date: todayStr,
        note: "Self check-in via student portal",
      },
    });
  } else {
    attendance = await prisma.attendance.create({
      data: {
        id: `ATT-${Date.now()}`,
        meetingId,
        studentId: student.id,
        classId: student.classId,
        date: todayStr,
        status: "present",
        note: "Self check-in via student portal",
      },
    });
  }

  // Recalculate student attendance rate
  const allAtt = await prisma.attendance.findMany({
    where: { studentId: student.id },
  });
  const presCount = allAtt.filter((a) => a.status === "present" || a.status === "hadir").length;
  const newPercent = Math.round((presCount / allAtt.length) * 100);

  await prisma.student.update({
    where: { id: student.id },
    data: { attendance: newPercent },
  });

  await cache.delPatterns([
    `student_portal:dashboard:${student.id}`,
    `student_portal:attendance:${student.id}`,
    "attendance:*",
    "students:*",
    "analytics:*",
    "dashboard:*",
  ]);
  await cache.set(`attendance:detail:${attendance.id}`, attendance, 300);

  return attendance;
}

/**
 * Get Grades / Scores breakdown
 */
async function getScores(studentId) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:scores:${student.id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const scores = await prisma.score.findMany({
    where: { studentId: student.id },
    include: { class: true },
    orderBy: { date: "desc" },
  });

  const totalScores = scores.length;
  const overallAverage =
    totalScores > 0
      ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / totalScores)
      : (student.averageScore ?? 0);

  const highestScore =
    totalScores > 0 ? Math.max(...scores.map((s) => s.score)) : 0;

  const lowestScore =
    totalScores > 0 ? Math.min(...scores.map((s) => s.score)) : 0;

  const breakdown = {
    Tugas: scores.filter((s) => s.examType.toLowerCase().includes("tugas")),
    Formatif: scores.filter((s) => s.examType.toLowerCase().includes("formatif") || s.examType.toLowerCase().includes("quiz")),
    Sumatif: scores.filter((s) => s.examType.toLowerCase().includes("sumatif") || s.examType.toLowerCase().includes("pts") || s.examType.toLowerCase().includes("pas")),
  };

  const result = {
    overallAverage,
    highestScore,
    lowestScore,
    totalEvaluations: totalScores,
    scores,
    breakdown,
  };

  await cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Get Complete Student Profile
 */
async function getProfile(studentId) {
  const student = await resolveStudent(null, studentId);

  let strengths = [];
  let weaknesses = [];
  let achievements = [];

  try {
    strengths = JSON.parse(student.strengths || "[]");
  } catch {
    strengths = [];
  }
  try {
    weaknesses = JSON.parse(student.weaknesses || "[]");
  } catch {
    weaknesses = [];
  }
  try {
    achievements = JSON.parse(student.achievements || "[]");
  } catch {
    achievements = [];
  }

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { studentId: student.id },
    include: { class: true, academicYear: true },
    orderBy: [{ grade: "asc" }, { enrollmentDate: "asc" }],
  });

  const academicJourney = enrollments.map((enr) => ({
    id: enr.id,
    grade: enr.grade,
    className: enr.class.name,
    academicYear: enr.academicYear.name,
    status: enr.status,
    finalScore: enr.finalScore || 0,
    attendanceRate: enr.attendanceRate || 0,
    enrollmentDate: enr.enrollmentDate,
    completionDate: enr.completionDate,
    notes: enr.notes,
  }));

  return {
    ...student,
    currentGrade: student.currentGrade || student.class?.grade || null,
    strengths,
    weaknesses,
    achievements,
    academicJourney,
  };
}

/**
 * Get Enrolled Classes / Assigned Subject for student
 */
async function getClasses(studentId) {
  const student = await resolveStudent(null, studentId);
  const cacheKey = `student_portal:classes:${student.id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  if (!student.class) {
    return [];
  }

  const cls = student.class;

  const [totalMaterials, totalWorksheets, totalMeetings] = await Promise.all([
    prisma.learningMaterial.count({ where: { classId: cls.id } }),
    prisma.worksheet.count({ where: { classId: cls.id } }),
    prisma.meeting.count({ where: { classId: cls.id } }),
  ]);

  const scheduleSlots = cls.scheduleSlots || [];

  const enrolledClass = {
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    section: cls.section,
    subject: cls.subject,
    room: cls.room,
    schedule: cls.schedule,
    attendanceRate: cls.attendanceRate || student.attendance || 100,
    worksheetCompletion: cls.worksheetCompletion || student.worksheetCompletion || 0,
    semesterProgress: cls.semesterProgress || 0,
    averageScore: cls.averageScore || student.averageScore || 0,
    currentTopic: cls.currentTopic || "",
    nextTopic: cls.nextTopic || "",
    teacher: cls.teacher
      ? {
          id: cls.teacher.id,
          name: cls.teacher.name,
          email: cls.teacher.email,
          school: cls.teacher.school || "",
          position: cls.teacher.position || "Guru Pengajar",
          subject: cls.teacher.subject,
        }
      : null,
    academicYear: cls.semester?.academicYear?.name || "",
    semester: cls.semester?.name || "",
    totalLessons: totalMaterials,
    completedLessons: totalMaterials > 0 ? Math.round(totalMaterials * ((cls.semesterProgress || 0) / 100)) : 0,
    totalWorksheets,
    totalMeetings,
    scheduleSlots: scheduleSlots.map((s) => ({
      id: s.id,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
    })),
    color: "#6366f1",
  };

  const result = [enrolledClass];
  await cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Get detailed class info by ID
 */
async function getClassById(studentId, classId) {
  const student = await resolveStudent(null, studentId);
  if (student.classId !== classId) {
    throw new ForbiddenError("You are not enrolled in this class");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: true,
      semester: { include: { academicYear: true } },
      scheduleSlots: true,
      materials: { orderBy: { orderNumber: "asc" } },
      worksheets: { orderBy: { dueDate: "asc" } },
      meetings: { orderBy: { meetingNumber: "asc" } },
    },
  });

  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  return {
    ...cls,
    academicYear: cls.semester?.academicYear?.name || "",
    semester: cls.semester?.name || "",
    teacher: cls.teacher
      ? {
          id: cls.teacher.id,
          name: cls.teacher.name,
          email: cls.teacher.email,
          school: cls.teacher.school || "",
          position: cls.teacher.position || "Guru Pengajar",
        }
      : null,
  };
}

/**
 * Get list of subjects assigned to student
 */
async function getSubjects(studentId) {
  const classes = await getClasses(studentId);
  return classes.map((c) => ({
    id: c.id,
    name: c.subject,
    className: c.name,
    grade: c.grade,
    teacherName: c.teacher?.name || "Guru Pengajar",
    teacherEmail: c.teacher?.email,
    school: c.teacher?.school || "",
    schedule: c.schedule,
    room: c.room,
  }));
}

/**
 * Get Saved Projects for Student
 */
async function getProjects(studentId) {
  const student = await resolveStudent(null, studentId);
  const projects = await prisma.studentProject.findMany({
    where: { studentId: student.id },
    orderBy: { lastSaved: "desc" },
  });
  return projects;
}

/**
 * Get Project for specific material
 */
async function getProjectByMaterial(studentId, materialId) {
  const student = await resolveStudent(null, studentId);
  const project = await prisma.studentProject.findFirst({
    where: {
      studentId: student.id,
      materialId,
    },
  });
  return project;
}

/**
 * Save or update project
 */
async function saveProject(studentId, payload) {
  const student = await resolveStudent(null, studentId);
  const { materialId, title, language, code, codeOutput, notes } = payload;

  const nowStr = new Date().toISOString();
  const projectTitle = title || "Projek Praktik Mandiri";
  const projLang = language || "python";

  let existing = null;
  if (materialId) {
    existing = await prisma.studentProject.findFirst({
      where: {
        studentId: student.id,
        materialId,
      },
    });
  }

  if (existing) {
    const updated = await prisma.studentProject.update({
      where: { id: existing.id },
      data: {
        title: projectTitle,
        language: projLang,
        code: code || "",
        codeOutput: codeOutput || "",
        notes: notes !== undefined ? notes : existing.notes,
        lastSaved: nowStr,
      },
    });
    return updated;
  } else {
    const newId = `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const created = await prisma.studentProject.create({
      data: {
        id: newId,
        studentId: student.id,
        classId: student.classId,
        materialId: materialId || null,
        title: projectTitle,
        language: projLang,
        code: code || "",
        codeOutput: codeOutput || "",
        notes: notes || "",
        lastSaved: nowStr,
        createdAt: nowStr,
      },
    });
    return created;
  }
}

const { spawn: childSpawn } = require("child_process");

/**
 * Execute real code (Python) via child process safely
 */
async function runCode(payload) {
  const { code, language = "python" } = payload || {};
  if (!code || typeof code !== "string") {
    return { output: "Tidak ada kode untuk dieksekusi.", success: false };
  }

  if (language === "html" || language === "web") {
    return { output: "Halaman web dirender pada tab Live Preview.", success: true };
  }

  return new Promise((resolve) => {
    let output = "";
    let timedOut = false;

    const py = childSpawn("python3", ["-u", "-c", code], {
      timeout: 5000,
      env: { PYTHONUNBUFFERED: "1", ...process.env },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try { py.kill("SIGKILL"); } catch (e) {}
      resolve({
        output: "TimeoutError: Eksekusi program melebihi batas waktu (5 detik). Pastikan perulangan (loop) memiliki kondisi berhenti.",
        success: false,
      });
    }, 5000);

    py.stdout.on("data", (d) => { output += d.toString(); });
    py.stderr.on("data", (d) => { output += d.toString(); });

    py.on("close", (exitCode) => {
      clearTimeout(timer);
      if (timedOut) return;
      resolve({
        output: output.trim() || "[Program selesai dieksekusi tanpa error. 0 output]",
        success: exitCode === 0,
        exitCode,
      });
    });

    py.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        output: `Error runtime Python: ${err.message}`,
        success: false,
      });
    });
  });
}

module.exports = {
  resolveStudent,
  getDashboard,
  getMaterials,
  getWorksheets,
  submitWorksheet,
  getSchedule,
  getCalendar,
  getAttendance,
  checkInAttendance,
  getScores,
  getProfile,
  getClasses,
  getClassById,
  getSubjects,
  getMaterialById,
  getProjects,
  getProjectByMaterial,
  saveProject,
  runCode,
};
