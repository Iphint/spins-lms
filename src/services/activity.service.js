/**
 * Activity Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");

/**
 * Centrally log teacher and system activities
 */
async function logActivity({ type, message, icon = "Activity", teacherId = null, teacherName = null }) {
  try {
    let resolvedTeacherName = teacherName;
    if (teacherId && !resolvedTeacherName) {
      const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (teacher) resolvedTeacherName = teacher.name;
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0].slice(0, 5); // "HH:MM"
    const id = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const activity = await prisma.activity.create({
      data: {
        id,
        type: type || "general",
        message,
        icon,
        date,
        time,
        teacherId: teacherId || null,
        teacherName: resolvedTeacherName || null,
      },
    });

    // Invalidate activity caches
    await cache.delPattern("activities:*");
    return activity;
  } catch (err) {
    console.error("Failed to log activity:", err.message);
    return null;
  }
}

async function listActivities(query = {}) {
  const { teacherId, type, search, limit } = query;
  const cacheKey = `activities:list:${teacherId || "all"}:${type || "all"}:${search || "all"}:${limit || "all"}`;

  return cache.remember(cacheKey, 60, async () => {
    const where = {};
    if (teacherId && teacherId !== "all") {
      where.teacherId = teacherId;
    }
    if (type && type !== "all") {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { teacherName: { contains: search } },
      ];
    }

    const take = limit ? parseInt(limit, 10) : 100;

    return prisma.activity.findMany({
      where,
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take,
    });
  });
}

async function listRecentActivities(limit = 10) {
  return cache.remember(`activities:recent:${limit}`, 60, async () => {
    return prisma.activity.findMany({
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: limit,
    });
  });
}

async function getActivityStats() {
  return cache.remember("activities:stats", 60, async () => {
    const total = await prisma.activity.count();
    const scoreCount = await prisma.activity.count({ where: { type: "score" } });
    const materialCount = await prisma.activity.count({ where: { type: "material" } });
    const studentCount = await prisma.activity.count({ where: { type: "student" } });
    const worksheetCount = await prisma.activity.count({ where: { type: "worksheet" } });
    const attendanceCount = await prisma.activity.count({ where: { type: "attendance" } });
    const activeTeachers = await prisma.teacher.count();

    return {
      total,
      scoreCount,
      materialCount,
      studentCount,
      worksheetCount,
      attendanceCount,
      activeTeachers,
    };
  });
}

module.exports = {
  logActivity,
  listActivities,
  listRecentActivities,
  getActivityStats,
};
