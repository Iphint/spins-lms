/**
 * Meeting Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { BadRequestError, NotFoundError } = require("../utils/errors");

async function clearMeetingCaches() {
  await cache.delPatterns([
    "meetings:*",
    "attendance:*",
    "dashboard:*",
    "student_portal:*",
  ]);
}

async function listMeetings(query = {}, user = null) {
  const { classId, semesterId, month, year, startDate, endDate } = query;
  const teacherFilter = (user && user.teacherId && !classId) ? user.teacherId : "all";
  const cacheKey = `meetings:list:${classId || "all"}:${semesterId || "all"}:${month || "all"}:${year || "all"}:${startDate || "all"}:${endDate || "all"}:${teacherFilter}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (classId) where.classId = classId;
    if (semesterId) where.semesterId = semesterId;
    if (user && user.teacherId && !classId) {
      where.class = { teacherId: user.teacherId };
    }
    if (month && year) {
      const m = String(month).padStart(2, "0");
      where.date = { startsWith: `${year}-${m}` };
    } else if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }

    return prisma.meeting.findMany({
      where,
      include: {
        material: true,
        class: true,
      },
      orderBy: [{ date: "asc" }, { meetingNumber: "asc" }],
    });
  });
}

async function getMeetingById(id) {
  return cache.remember(`meetings:detail:${id}`, 600, async () => {
    const data = await prisma.meeting.findUnique({
      where: { id },
      include: {
        material: true,
        class: true,
      },
    });
    if (!data) {
      throw new NotFoundError("Meeting not found");
    }
    return data;
  });
}

async function createMeeting(body) {
  const { classId, materialId, date, semesterId } = body;
  if (!classId || !materialId) {
    throw new BadRequestError("classId and materialId required");
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const mat = await prisma.learningMaterial.findUnique({ where: { id: materialId } });
  if (!mat) {
    throw new NotFoundError("Material not found");
  }

  const lastMeeting = await prisma.meeting.findFirst({
    where: { classId },
    orderBy: { meetingNumber: "desc" },
  });

  const meetingNumber = (lastMeeting?.meetingNumber || 0) + 1;
  const semId = semesterId || cls.semesterId;
  const id = `MTG-${classId}-${semId}-${String(meetingNumber).padStart(2, "0")}`;

  const created = await prisma.meeting.create({
    data: {
      id,
      classId,
      semesterId: semId,
      materialId,
      meetingNumber,
      week: meetingNumber,
      date: date || new Date().toISOString().split("T")[0],
      subject: cls.subject,
      topic: mat.topic,
      learningObjective: mat.learningObjective,
      status: "upcoming",
      completion: 0,
    },
    include: {
      material: true,
      class: true,
    },
  });

  await clearMeetingCaches();
  await cache.set(`meetings:detail:${created.id}`, created, 600);

  return created;
}

module.exports = {
  listMeetings,
  getMeetingById,
  createMeeting,
  clearMeetingCaches,
};
