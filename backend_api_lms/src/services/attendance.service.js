/**
 * Attendance Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { BadRequestError, NotFoundError } = require("../utils/errors");

async function clearAttendanceCaches() {
  await cache.delPatterns([
    "attendance:*",
    "students:*",
    "classes:*",
    "analytics:*",
    "dashboard:*",
    "student_portal:*",
    "meetings:*",
  ]);
}

/**
 * Recalculate attendance percentage for a list of student IDs
 */
async function recalculateStudentAttendance(studentIds) {
  if (!studentIds || studentIds.length === 0) return;
  for (const studentId of studentIds) {
    const records = await prisma.attendance.findMany({ where: { studentId } });
    if (records.length === 0) continue;
    const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
    const rate = Math.round((presentCount / records.length) * 100);
    await prisma.student.update({
      where: { id: studentId },
      data: { attendance: rate },
    }).catch(() => {});
  }
}

async function listAttendance(query = {}) {
  const { meetingId, studentId, classId } = query;
  const cacheKey = `attendance:list:${classId || "all"}:${meetingId || "all"}:${studentId || "all"}`;
  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (meetingId) where.meetingId = meetingId;
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;

    return prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, gender: true, nisn: true } },
        meeting: { select: { id: true, meetingNumber: true, topic: true, date: true } },
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    });
  });
}

async function getAttendanceSummary(meetingId) {
  return cache.remember(`attendance:summary:${meetingId}`, 300, async () => {
    const records = await prisma.attendance.findMany({ where: { meetingId } });
    const total = records.length;
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    const late = records.filter(r => r.status === "late").length;
    const permission = records.filter(r => r.status === "permission").length;
    const rate = total ? Math.round(((present + late) / total) * 100) : 0;

    return {
      present,
      absent,
      late,
      permission,
      total,
      rate,
    };
  });
}

async function bulkUpsertAttendance(body, user = null) {
  const { meetingId, classId, date, records } = body;
  if (!meetingId || !classId || !records || !Array.isArray(records)) {
    throw new BadRequestError("meetingId, classId, and records array required");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { class: true },
  });
  if (!meeting) {
    throw new NotFoundError("Meeting not found");
  }

  const results = await prisma.$transaction(
    records.map(r =>
      prisma.attendance.upsert({
        where: { id: r.id || `ATT-${meetingId}-${r.studentId}` },
        create: {
          id: `ATT-${meetingId}-${r.studentId}`,
          meetingId,
          studentId: r.studentId,
          classId,
          date: date || meeting.date,
          status: r.status || "present",
          note: r.note || "",
        },
        update: {
          status: r.status,
          date: date || meeting.date,
          ...(r.note !== undefined && { note: r.note }),
        },
      })
    )
  );

  const studentIds = [...new Set(records.map(r => r.studentId))];
  await recalculateStudentAttendance(studentIds);

  await clearAttendanceCaches();

  await logActivity({
    type: "attendance",
    message: `Guru ${user?.name || "Guru"} memperbarui presensi (${records.length} siswa) untuk ${meeting.class?.name || classId} pertemuan #${meeting.meetingNumber}`,
    icon: "ClipboardCheck",
    teacherId: user?.teacherId,
    teacherName: user?.name,
  });

  return results;
}

async function markAllPresent(body, user = null) {
  const { meetingId, classId, date } = body;
  if (!meetingId || !classId) {
    throw new BadRequestError("meetingId and classId required");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { class: true },
  });
  if (!meeting) {
    throw new NotFoundError("Meeting not found");
  }

  const students = await prisma.student.findMany({
    where: { classId, status: "active" },
    select: { id: true },
  });

  const records = students.map(s => ({
    studentId: s.id,
    status: "present",
    note: "Hadir tepat waktu",
  }));

  const results = await bulkUpsertAttendance({
    meetingId,
    classId,
    date: date || meeting.date,
    records,
  }, user);

  await logActivity({
    type: "attendance",
    message: `Guru ${user?.name || "Guru"} menandai semua siswa (${results.length} siswa) hadir di ${meeting.class?.name || classId}`,
    icon: "UserCheck",
    teacherId: user?.teacherId,
    teacherName: user?.name,
  });

  return {
    success: true,
    totalMarked: results.length,
    meetingId,
    classId,
    message: `Berhasil menandai ${results.length} siswa hadir pada sesi ini.`,
  };
}

async function getAttendanceMatrix(classId) {
  if (!classId) {
    throw new BadRequestError("classId is required");
  }

  return cache.remember(`attendance:matrix:${classId}`, 300, async () => {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          where: { status: "active" },
          orderBy: { name: "asc" },
        },
        meetings: {
          orderBy: { meetingNumber: "asc" },
          include: {
            material: { select: { id: true, topic: true, orderNumber: true } },
          },
        },
      },
    });

    if (!cls) {
      throw new NotFoundError("Class not found");
    }

  const allAttendances = await prisma.attendance.findMany({
    where: { classId },
  });

  const attendanceMap = new Map();
  allAttendances.forEach(a => {
    attendanceMap.set(`${a.studentId}_${a.meetingId}`, a);
  });

  const matrix = cls.students.map((student, idx) => {
    let present = 0;
    let late = 0;
    let permission = 0;
    let absent = 0;

    const sessionStatuses = cls.meetings.map(meeting => {
      const att = attendanceMap.get(`${student.id}_${meeting.id}`);
      const status = att ? att.status : null;
      const note = att ? att.note : "";

      if (status === "present") present++;
      else if (status === "late") late++;
      else if (status === "permission") permission++;
      else if (status === "absent") absent++;

      return {
        meetingId: meeting.id,
        meetingNumber: meeting.meetingNumber,
        date: meeting.date,
        status,
        note,
      };
    });

    const recordedCount = present + late + permission + absent;
    const rate = recordedCount > 0 ? Math.round(((present + late) / recordedCount) * 100) : 100;

    return {
      index: idx + 1,
      studentId: student.id,
      name: student.name,
      nisn: student.nisn || "-",
      gender: student.gender,
      sessions: sessionStatuses,
      summary: {
        present,
        late,
        permission,
        absent,
        recordedCount,
        rate,
      },
    };
  });

  return {
    classId: cls.id,
    className: cls.name,
    totalStudents: cls.students.length,
    meetings: cls.meetings.map(m => ({
      id: m.id,
      meetingNumber: m.meetingNumber,
      date: m.date,
      topic: m.material?.topic || m.topic,
    })),
    matrix,
  };
  });
}

async function generateCheckInPin(meetingId) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw new NotFoundError("Meeting not found");
  }

  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { checkInPin: pin },
  });

  return {
    meetingId,
    checkInPin: pin,
    topic: meeting.topic,
    date: meeting.date,
  };
}

async function upsertAttendance(body) {
  const { meetingId, studentId, classId, date, status, note } = body;
  if (!meetingId || !studentId || !classId) {
    throw new BadRequestError("meetingId, studentId, classId required");
  }

  const id = `ATT-${meetingId}-${studentId}`;
  const res = await prisma.attendance.upsert({
    where: { id },
    create: {
      id,
      meetingId,
      studentId,
      classId,
      date: date || "",
      status: status || "present",
      note: note || "",
    },
    update: {
      status: status || "present",
      date: date || "",
      ...(note !== undefined && { note }),
    },
  });

  await recalculateStudentAttendance([studentId]);
  await clearAttendanceCaches();
  return res;
}

async function resetAttendance(classId) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const deleted = await prisma.attendance.deleteMany({ where: { classId } });
  await prisma.student.updateMany({
    where: { classId },
    data: { attendance: 0 },
  });

  await clearAttendanceCaches();
  return { deletedCount: deleted.count, classId, className: cls.name };
}

async function updateAttendance(id, body) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Attendance record not found");
  }

  const { status, date, note } = body;
  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(date !== undefined && { date }),
      ...(note !== undefined && { note }),
    },
  });

  await recalculateStudentAttendance([existing.studentId]);
  await clearAttendanceCaches();
  await cache.set(`attendance:detail:${id}`, updated, 300);
  return updated;
}

async function deleteAttendance(id) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Attendance record not found");
  }

  await prisma.attendance.delete({ where: { id } });
  await recalculateStudentAttendance([existing.studentId]);
  await clearAttendanceCaches();
  await cache.del(`attendance:detail:${id}`);
  return true;
}

async function getAttendanceById(id) {
  return cache.remember(`attendance:detail:${id}`, 300, async () => {
    const data = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, gender: true, nisn: true } },
        meeting: true,
      },
    });
    if (!data) {
      throw new NotFoundError("Attendance record not found");
    }
    return data;
  });
}

module.exports = {
  listAttendance,
  getAttendanceSummary,
  bulkUpsertAttendance,
  markAllPresent,
  getAttendanceMatrix,
  generateCheckInPin,
  upsertAttendance,
  resetAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceById,
};
