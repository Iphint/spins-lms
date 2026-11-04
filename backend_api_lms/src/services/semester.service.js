/**
 * Semester Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { NotFoundError, BadRequestError } = require("../utils/errors");
const { logActivity } = require("./activity.service");

async function clearSemesterCaches() {
  await cache.delPatterns([
    "semesters:*",
    "classes:*",
    "academic_years:*",
    "dashboard:*",
    "student_portal:*",
    "analytics:*",
    "schedule:*",
  ]);
}

async function listSemesters(query = {}) {
  const { academicYearId } = query;
  const cacheKey = `semesters:list:${academicYearId || "all"}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = academicYearId ? { academicYearId } : {};
    const semesters = await prisma.semester.findMany({
      where,
      include: {
        academicYear: true,
        _count: {
          select: { classes: true, meetings: true },
        },
      },
    });

    // Prioritize active semester first, then upcoming, then completed
    const statusWeight = { active: 0, upcoming: 1, completed: 2 };
    return semesters.sort((a, b) => {
      const diff = (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9);
      if (diff !== 0) return diff;
      return new Date(a.startDate) - new Date(b.startDate);
    });
  });
}

async function getActiveSemester() {
  return cache.remember("semesters:active", 300, async () => {
    const active = await prisma.semester.findFirst({
      where: { status: "active" },
      include: {
        academicYear: true,
        _count: {
          select: { classes: true, meetings: true },
        },
      },
    });
    if (active) return active;
    return prisma.semester.findFirst({
      orderBy: { startDate: "desc" },
      include: {
        academicYear: true,
        _count: {
          select: { classes: true, meetings: true },
        },
      },
    });
  });
}

async function getSemesterById(id) {
  return cache.remember(`semesters:detail:${id}`, 600, async () => {
    const data = await prisma.semester.findUnique({
      where: { id },
      include: {
        academicYear: true,
        _count: {
          select: { classes: true, meetings: true },
        },
      },
    });
    if (!data) {
      throw new NotFoundError("Semester not found");
    }
    return data;
  });
}

async function createSemester(body, user = null) {
  const {
    academicYearId,
    academicYearName,
    name,
    number,
    startDate,
    endDate,
    totalMeetings,
    learningTargets,
    status = "upcoming",
  } = body;

  if (!name || !startDate || !endDate) {
    throw new BadRequestError("Nama semester, tanggal mulai, dan tanggal selesai wajib diisi");
  }

  // Resolve or create academic year
  let finalAyId = academicYearId;
  if (!finalAyId && academicYearName) {
    let ay = await prisma.academicYear.findFirst({ where: { name: academicYearName } });
    if (!ay) {
      const yearStart = academicYearName.split("/")[0] || startDate.split("-")[0];
      finalAyId = `AY${yearStart}`;
      ay = await prisma.academicYear.create({
        data: {
          id: finalAyId,
          name: academicYearName,
          startDate,
          endDate,
          isActive: status === "active",
        },
      });
    } else {
      finalAyId = ay.id;
    }
  }

  if (!finalAyId) {
    const activeAy = await prisma.academicYear.findFirst({ where: { isActive: true } });
    finalAyId = activeAy?.id || "AY2026";
  }

  const semNumber = parseInt(number, 10) || 1;
  const cleanYearTag = finalAyId.replace(/^AY/, "");
  let id = body.id || `SEM${semNumber}-${cleanYearTag}`;

  // If ID already exists, append unique suffix
  const existing = await prisma.semester.findUnique({ where: { id } });
  if (existing) {
    id = `SEM${semNumber}-${cleanYearTag}-${Date.now().toString().slice(-4)}`;
  }

  const created = await prisma.semester.create({
    data: {
      id,
      academicYearId: finalAyId,
      name: name.trim(),
      number: semNumber,
      startDate,
      endDate,
      totalMeetings: parseInt(totalMeetings, 10) || 16,
      completedMeetings: 0,
      progress: 0,
      status: status === "active" ? "active" : "upcoming",
      learningTargets: parseInt(learningTargets, 10) || 16,
      completedTargets: 0,
    },
    include: {
      academicYear: true,
      _count: { select: { classes: true, meetings: true } },
    },
  });

  if (status === "active") {
    await setActiveSemester(created.id);
  }

  await clearSemesterCaches();
  await cache.set(`semesters:detail:${created.id}`, created, 600);
  if (status === "active") {
    await cache.set("semesters:active", created, 300);
  }

  await logActivity({
    type: "general",
    message: `Semester baru ${created.name} berhasil dibuat oleh ${user?.name || "Administrator"}`,
    icon: "Calendar",
  });

  return created;
}

async function updateSemester(id, body, user = null) {
  const existing = await prisma.semester.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Semester not found");
  }

  const {
    name,
    number,
    startDate,
    endDate,
    totalMeetings,
    learningTargets,
    status,
  } = body;

  const updated = await prisma.semester.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(number !== undefined && { number: parseInt(number, 10) }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(totalMeetings !== undefined && { totalMeetings: parseInt(totalMeetings, 10) }),
      ...(learningTargets !== undefined && { learningTargets: parseInt(learningTargets, 10) }),
      ...(status && { status }),
    },
    include: {
      academicYear: true,
      _count: { select: { classes: true, meetings: true } },
    },
  });

  if (status === "active" && existing.status !== "active") {
    await setActiveSemester(id);
  }

  await clearSemesterCaches();
  await cache.set(`semesters:detail:${id}`, updated, 600);
  if (updated.status === "active") {
    await cache.set("semesters:active", updated, 300);
  }

  await logActivity({
    type: "general",
    message: `Semester ${updated.name} diperbarui oleh ${user?.name || "Administrator"}`,
    icon: "Calendar",
  });

  return updated;
}

async function deleteSemester(id, user = null) {
  const existing = await prisma.semester.findUnique({
    where: { id },
    include: {
      _count: { select: { classes: true, meetings: true } },
    },
  });
  if (!existing) {
    throw new NotFoundError("Semester not found");
  }

  if (existing.status === "active") {
    throw new BadRequestError("Tidak dapat menghapus semester yang sedang aktif. Silakan tentukan semester lain sebagai aktif terlebih dahulu.");
  }

  if (existing._count.classes > 0) {
    throw new BadRequestError(`Tidak dapat menghapus semester karena masih ada ${existing._count.classes} kelas terdaftar di semester ini.`);
  }

  await prisma.semester.delete({ where: { id } });
  await clearSemesterCaches();
  await cache.del(`semesters:detail:${id}`);

  await logActivity({
    type: "general",
    message: `Semester ${existing.name} dihapus oleh ${user?.name || "Administrator"}`,
    icon: "Trash2",
  });

  return { message: "Semester deleted successfully" };
}

async function setActiveSemester(semesterId) {
  const target = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!target) {
    throw new NotFoundError("Semester not found");
  }

  await prisma.$transaction(async (tx) => {
    // Set target to active
    await tx.semester.update({
      where: { id: semesterId },
      data: { status: "active" },
    });

    // Update other semesters
    const others = await tx.semester.findMany({
      where: { id: { not: semesterId } },
    });

    for (const sem of others) {
      let newStatus = sem.status;
      if (sem.academicYearId === target.academicYearId) {
        newStatus = sem.number < target.number ? "completed" : "upcoming";
      } else {
        newStatus = "completed";
      }
      if (newStatus !== sem.status) {
        await tx.semester.update({
          where: { id: sem.id },
          data: { status: newStatus },
        });
      }
    }
  });

  await clearSemesterCaches();

  const activeSem = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: {
      academicYear: true,
      _count: { select: { classes: true, meetings: true } },
    },
  });

  if (activeSem) {
    await cache.set("semesters:active", activeSem, 300);
    await cache.set(`semesters:detail:${semesterId}`, activeSem, 600);
  }

  return activeSem;
}

module.exports = {
  listSemesters,
  getActiveSemester,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
  setActiveSemester,
};
