/**
 * Schedule Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { BadRequestError, NotFoundError } = require("../utils/errors");

const DAY_ORDER = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

async function clearScheduleCaches() {
  await cache.delPatterns([
    "schedule:*",
    "dashboard:*",
    "classes:*",
    "student_portal:*",
    "analytics:*",
  ]);
}

async function syncClassScheduleString(classId) {
  if (!classId) return;
  const allSlots = await prisma.scheduleSlot.findMany({
    where: { classId },
  });
  const sorted = allSlots.sort(
    (a, b) =>
      (DAY_ORDER[a.day] || 9) - (DAY_ORDER[b.day] || 9) ||
      a.startTime.localeCompare(b.startTime)
  );
  const scheduleStr = sorted
    .map((s) => `${s.day}, ${s.startTime}-${s.endTime}`)
    .join(" & ");
  const firstRoom = sorted.find((s) => s.room && s.room.trim())?.room;
  const updateData = { schedule: scheduleStr };
  if (firstRoom) {
    updateData.room = firstRoom;
  }
  await prisma.class
    .update({
      where: { id: classId },
      data: updateData,
    })
    .catch(() => {});
}

async function listScheduleSlots(query = {}, user = null) {
  const { classId, teacherId: queryTeacherId } = query;
  // If user is a teacher, scope to their classes.
  // If user is admin, allow queryTeacherId if provided, or show all.
  const effectiveTeacherId = (user && user.teacherId) ? user.teacherId : (queryTeacherId || "all");
  const cacheKey = `schedule:list:${classId || "all"}:${effectiveTeacherId}`;

  return cache.remember(cacheKey, 60, async () => {
    const where = {};
    if (classId) {
      where.classId = classId;
    }
    if (effectiveTeacherId !== "all") {
      where.class = { teacherId: effectiveTeacherId };
    }

    return prisma.scheduleSlot.findMany({
      where,
      include: {
        material: true,
        class: {
          include: {
            teacher: {
              select: { id: true, name: true, subject: true, phone: true },
            },
          },
        },
      },
      orderBy: [{ classId: "asc" }, { day: "asc" }, { startTime: "asc" }],
    });
  });
}

async function setWeeklySchedule(classId, lessons, user = null) {
  if (!classId || !Array.isArray(lessons) || lessons.length === 0) {
    throw new BadRequestError("classId and lessons array required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  await prisma.scheduleSlot.deleteMany({ where: { classId } });

  const created = [];
  for (const lesson of lessons) {
    if (!lesson.day || !lesson.startTime || !lesson.endTime) continue;
    const slug = `${classId}-${lesson.day}-${lesson.startTime.replace(":", "")}`;
    const id = `SCH-${slug}`;

    const slot = await prisma.scheduleSlot.upsert({
      where: { id },
      update: {
        classId,
        day: lesson.day,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        room: lesson.room || "",
        materialId: lesson.materialId || null,
      },
      create: {
        id,
        classId,
        day: lesson.day,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        room: lesson.room || "",
        materialId: lesson.materialId || null,
      },
      include: {
        material: true,
        class: {
          include: { teacher: true },
        },
      },
    });
    created.push(slot);
  }

  await syncClassScheduleString(classId);
  await clearScheduleCaches();
  await cache.set(`schedule:detail:${created.id}`, created, 600);

  // Log activity
  await logActivity({
    type: "schedule",
    message: `Guru ${user?.name || cls.teacher?.name || "Guru"} menyusun ${created.length} sesi jadwal rutin mingguan untuk ${cls.name}`,
    icon: "Clock",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return created;
}

async function distributeMaterials(classId, user = null) {
  if (!classId) {
    throw new BadRequestError("classId required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });

  const materials = await prisma.learningMaterial.findMany({
    where: { classId },
    orderBy: { orderNumber: "asc" },
  });

  const allSlots = await prisma.scheduleSlot.findMany({
    where: { classId },
  });

  const slots = allSlots.sort(
    (a, b) =>
      (DAY_ORDER[a.day] || 9) - (DAY_ORDER[b.day] || 9) ||
      a.startTime.localeCompare(b.startTime)
  );

  if (materials.length === 0) {
    throw new BadRequestError("No materials found for this class");
  }
  if (slots.length === 0) {
    throw new BadRequestError("No schedule slots found for this class. Set a weekly schedule first.");
  }

  const weeksNeeded = Math.ceil(materials.length / slots.length);
  const updated = [];

  for (let i = 0; i < materials.length; i++) {
    const slotIdx = i % slots.length;
    const slot = slots[slotIdx];
    const material = materials[i];
    const result = await prisma.scheduleSlot.update({
      where: { id: slot.id },
      data: { materialId: material.id },
      include: { material: true },
    });
    if (!updated.find(u => u.id === result.id)) {
      updated.push(result);
    }
  }

  await clearScheduleCaches();

  await logActivity({
    type: "schedule",
    message: `Guru ${user?.name || cls?.teacher?.name || "Guru"} mendistribusikan ${materials.length} materi ke ${slots.length} sesi jadwal ${cls?.name || classId}`,
    icon: "Sparkles",
    teacherId: user?.teacherId || cls?.teacherId,
    teacherName: user?.name || cls?.teacher?.name,
  });

  return {
    slots: updated,
    stats: {
      totalMaterials: materials.length,
      weeklySlots: slots.length,
      weeksNeeded,
      materialsPerSlot: Math.ceil(materials.length / slots.length),
    },
    message: `Distributed ${materials.length} materials across ${slots.length} weekly slots (${weeksNeeded} weeks)`,
  };
}

async function getScheduleSlotById(id) {
  return cache.remember(`schedule:detail:${id}`, 600, async () => {
    const data = await prisma.scheduleSlot.findUnique({
      where: { id },
      include: {
        material: true,
        class: {
          include: { teacher: true },
        },
      },
    });
    if (!data) {
      throw new NotFoundError("Schedule slot not found");
    }
    return data;
  });
}

async function createScheduleSlot(body, user = null) {
  const { classId, day, startTime, endTime, room, materialId } = body;
  if (!classId || !day || !startTime || !endTime) {
    throw new BadRequestError("classId, day, startTime, endTime required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const slug = `${classId}-${day}-${startTime.replace(":", "")}`;
  const id = `SCH-${slug}`;

  const created = await prisma.scheduleSlot.upsert({
    where: { id },
    update: {
      classId,
      day,
      startTime,
      endTime,
      room: room || cls.room || "",
      materialId: materialId || null,
    },
    create: {
      id,
      classId,
      day,
      startTime,
      endTime,
      room: room || cls.room || "",
      materialId: materialId || null,
    },
    include: {
      material: true,
      class: { include: { teacher: true } },
    },
  });
  await syncClassScheduleString(classId);
  await clearScheduleCaches();
  await cache.set(`schedule:detail:${created.id}`, created, 600);

  await logActivity({
    type: "schedule",
    message: `Teacher ${user?.name || cls.teacher?.name || "Teacher"} added schedule session ${day} (${startTime} - ${endTime}) for ${cls.name}`,
    icon: "Clock",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return created;
}

async function bulkSaveSchedules(body, user = null) {
  const { items, mode = "replace_classes" } = body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("Schedule list (items) must contain at least 1 session");
  }

  const validItems = items.filter(
    (item) => item && item.classId && item.day && item.startTime && item.endTime
  );
  if (validItems.length === 0) {
    throw new BadRequestError(
      "Ensure each schedule row has Class, Day, Start Time, and End Time"
    );
  }

  const affectedClassIds = [...new Set(validItems.map((i) => i.classId))];

  const existingClasses = await prisma.class.findMany({
    where: { id: { in: affectedClassIds } },
    include: { teacher: true },
  });
  const classMap = {};
  for (const c of existingClasses) {
    classMap[c.id] = c;
  }

  if (mode === "replace_classes") {
    await prisma.scheduleSlot.deleteMany({
      where: { classId: { in: affectedClassIds } },
    });
  } else if (mode === "replace_all") {
    const teacherId = user?.teacherId;
    if (teacherId) {
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId },
        select: { id: true },
      });
      const tClassIds = teacherClasses.map((c) => c.id);
      await prisma.scheduleSlot.deleteMany({
        where: { classId: { in: tClassIds } },
      });
    } else {
      await prisma.scheduleSlot.deleteMany({
        where: { classId: { in: affectedClassIds } },
      });
    }
  }

  const savedSlots = [];
  for (const item of validItems) {
    const cls = classMap[item.classId];
    if (!cls) continue;

    const cleanStart = item.startTime.trim();
    const cleanEnd = item.endTime.trim();
    const slug = `${item.classId}-${item.day}-${cleanStart.replace(":", "")}`;
    const id = `SCH-${slug}`;
    const roomVal =
      item.room !== undefined && item.room !== "" ? item.room : cls.room || "";

    const slot = await prisma.scheduleSlot.upsert({
      where: { id },
      update: {
        classId: item.classId,
        day: item.day,
        startTime: cleanStart,
        endTime: cleanEnd,
        room: roomVal,
        materialId: item.materialId || null,
      },
      create: {
        id,
        classId: item.classId,
        day: item.day,
        startTime: cleanStart,
        endTime: cleanEnd,
        room: roomVal,
        materialId: item.materialId || null,
      },
      include: {
        material: true,
        class: { include: { teacher: true } },
      },
    });
    savedSlots.push(slot);
  }

  for (const cId of affectedClassIds) {
    await syncClassScheduleString(cId);
  }

  await clearScheduleCaches();

  const firstCls = existingClasses[0];
  const classNames = existingClasses.map((c) => c.name).join(", ");
  await logActivity({
    type: "schedule",
    message: `Guru ${user?.name || firstCls?.teacher?.name || "Guru"} menyimpan bulk jadwal mengajar (${savedSlots.length} sesi untuk ${existingClasses.length} kelas: ${classNames})`,
    icon: "Clock",
    teacherId: user?.teacherId || firstCls?.teacherId,
    teacherName: user?.name || firstCls?.teacher?.name,
  });

  return {
    slots: savedSlots,
    totalSaved: savedSlots.length,
    classesCount: existingClasses.length,
  };
}

async function updateScheduleSlot(id, body, user = null) {
  const existing = await prisma.scheduleSlot.findUnique({
    where: { id },
    include: { class: { include: { teacher: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Schedule slot not found");
  }

  const { day, startTime, endTime, room, materialId } = body;
  const updated = await prisma.scheduleSlot.update({
    where: { id },
    data: {
      ...(day !== undefined && { day }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(room !== undefined && { room }),
      ...(materialId !== undefined && { materialId }),
    },
    include: {
      material: true,
      class: { include: { teacher: true } },
    },
  });
  await syncClassScheduleString(existing.classId);
  await clearScheduleCaches();
  await cache.set(`schedule:detail:${id}`, updated, 600);
  return updated;
}

async function deleteScheduleSlot(id, user = null) {
  const existing = await prisma.scheduleSlot.findUnique({
    where: { id },
    include: { class: { include: { teacher: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Schedule slot not found");
  }

  await prisma.scheduleSlot.delete({ where: { id } });
  await syncClassScheduleString(existing.classId);
  await clearScheduleCaches();
  await cache.del(`schedule:detail:${id}`);

  await logActivity({
    type: "schedule",
    message: `Teacher ${user?.name || existing.class?.teacher?.name || "Teacher"} deleted schedule session ${existing.day} (${existing.startTime} - ${existing.endTime}) on ${existing.class?.name || existing.classId}`,
    icon: "Trash2",
    teacherId: user?.teacherId || existing.class?.teacherId,
    teacherName: user?.name || existing.class?.teacher?.name,
  });

  return true;
}

module.exports = {
  listScheduleSlots,
  setWeeklySchedule,
  bulkSaveSchedules,
  distributeMaterials,
  getScheduleSlotById,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
};
