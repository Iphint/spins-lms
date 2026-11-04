/**
 * Teacher Service (with Redis Caching)
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { NotFoundError } = require("../utils/errors");

async function getTeacher(teacherId) {
  const cacheKey = `dashboard:teacher:${teacherId || "default"}`;
  return cache.remember(cacheKey, 600, async () => {
    const teacher = teacherId
      ? await prisma.teacher.findUnique({ where: { id: teacherId } })
      : await prisma.teacher.findFirst();
    return teacher;
  });
}

async function updateTeacher(teacherId, updateData) {
  const current = teacherId
    ? await prisma.teacher.findUnique({ where: { id: teacherId } })
    : await prisma.teacher.findFirst();

  if (!current) {
    throw new NotFoundError("Teacher not found");
  }

  const {
    name, email, phone, photo, school, schoolAddress, subject,
    nip, position, joinDate, bio,
  } = updateData;

  const data = await prisma.teacher.update({
    where: { id: current.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(photo !== undefined && { photo }),
      ...(school !== undefined && { school }),
      ...(schoolAddress !== undefined && { schoolAddress }),
      ...(nip !== undefined && { nip }),
      ...(position !== undefined && { position }),
      ...(joinDate !== undefined && { joinDate }),
      ...(bio !== undefined && { bio }),
      ...(subject !== undefined && { subject }),
    },
  });

  // Keep all classes aligned if subject changes
  if (subject !== undefined && subject !== current.subject) {
    await prisma.class.updateMany({ data: { subject } });
  }

  // Invalidate caches and immediately re-cache updated teacher data
  await cache.delPatterns([
    "dashboard:teacher:*",
    "dashboard:teachers:*",
    "teachers:*",
    "classes:*",
    "dashboard:*",
    "student_portal:*",
  ]);
  await cache.set(`dashboard:teacher:${current.id}`, data, 600);
  await cache.set(`dashboard:teacher:default`, data, 600);

  return data;
}

async function getAllTeachers() {
  const cacheKey = "dashboard:teachers:all";
  return cache.remember(cacheKey, 60, async () => {
    return prisma.teacher.findMany({
      include: {
        classes: {
          select: { id: true, name: true, grade: true, section: true, room: true },
        },
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });
  });
}

module.exports = {
  getTeacher,
  updateTeacher,
  getAllTeachers,
};
