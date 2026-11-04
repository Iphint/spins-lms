/**
 * Material Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { safeJsonStringify } = require("../utils/helpers");
const { BadRequestError, NotFoundError } = require("../utils/errors");

async function clearMaterialCaches() {
  await cache.delPatterns([
    "materials:*",
    "classes:*",
    "analytics:*",
    "dashboard:*",
    "student_portal:*",
    "meetings:*",
  ]);
}

function getCurriculumTemplates() {
  return {};
}

async function listMaterials(query = {}) {
  const { classId, status, semesterNumber } = query;
  const cacheKey = `materials:list:${classId || "all"}:${status || "all"}:${semesterNumber || "all"}`;
  return cache.remember(cacheKey, 600, async () => {
    const where = {};
    if (classId) where.classId = classId;
    if (status && status !== "all") where.status = status;
    if (semesterNumber && semesterNumber !== "all") {
      where.semesterNumber = parseInt(semesterNumber, 10);
    }

    return prisma.learningMaterial.findMany({
      where,
      orderBy: [{ classId: "asc" }, { semesterNumber: "asc" }, { orderNumber: "asc" }],
    });
  });
}

async function getMaterialById(id) {
  return cache.remember(`materials:detail:${id}`, 600, async () => {
    const data = await prisma.learningMaterial.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundError("Material not found");
    }
    return data;
  });
}

async function createMaterial(body, user = null) {
  const {
    classId, orderNumber, semesterNumber, topic, description, learningObjective,
    status, content, keyPoints, references,
    fileUrl, fileName, fileSize, fileType, videoUrl,
  } = body;

  if (!classId || !topic) {
    throw new BadRequestError("classId and topic required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const finalOrder = orderNumber ? parseInt(orderNumber, 10) : 1;
  const semNum = semesterNumber ? parseInt(semesterNumber, 10) : 1;
  const id = `MAT-${classId}-${String(finalOrder).padStart(2, "0")}`;

  // Check if exists, if so delete or update to avoid ID conflict
  await prisma.learningMaterial.deleteMany({
    where: { id },
  });

  const created = await prisma.learningMaterial.create({
    data: {
      id,
      classId,
      orderNumber: finalOrder,
      semesterNumber: semNum,
      topic,
      description: description || "",
      learningObjective: learningObjective || "",
      status: status || "upcoming",
      content: safeJsonStringify(content),
      keyPoints: safeJsonStringify(keyPoints),
      references: safeJsonStringify(references),
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize ? parseInt(fileSize, 10) : null,
      fileType: fileType || null,
      videoUrl: videoUrl || null,
    },
  });

  await clearMaterialCaches();
  await cache.set(`materials:detail:${created.id}`, created, 600);

  await logActivity({
    type: "material",
    message: `Guru ${user?.name || cls.teacher?.name || "Guru"} menambahkan materi #${finalOrder}: "${topic}" untuk ${cls.name}`,
    icon: "BookMarked",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return created;
}

async function updateMaterial(id, body) {
  const existing = await prisma.learningMaterial.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Material not found");
  }

  const {
    topic, description, learningObjective, status, orderNumber, semesterNumber,
    content, keyPoints, references,
    fileUrl, fileName, fileSize, fileType, videoUrl,
  } = body;

  const updated = await prisma.learningMaterial.update({
    where: { id },
    data: {
      ...(topic !== undefined && { topic }),
      ...(description !== undefined && { description }),
      ...(learningObjective !== undefined && { learningObjective }),
      ...(status !== undefined && { status }),
      ...(orderNumber !== undefined && { orderNumber: parseInt(orderNumber, 10) }),
      ...(semesterNumber !== undefined && { semesterNumber: parseInt(semesterNumber, 10) }),
      ...(content !== undefined && { content: safeJsonStringify(content) }),
      ...(keyPoints !== undefined && { keyPoints: safeJsonStringify(keyPoints) }),
      ...(references !== undefined && { references: safeJsonStringify(references) }),
      ...(fileUrl !== undefined && { fileUrl }),
      ...(fileName !== undefined && { fileName }),
      ...(fileSize !== undefined && { fileSize: fileSize ? parseInt(fileSize, 10) : null }),
      ...(fileType !== undefined && { fileType }),
      ...(videoUrl !== undefined && { videoUrl }),
    },
  });

  await clearMaterialCaches();
  await cache.set(`materials:detail:${id}`, updated, 600);
  return updated;
}

async function deleteMaterial(id) {
  const existing = await prisma.learningMaterial.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Material not found");
  }

  // Set null in referencing meetings and scheduleSlots first
  await prisma.meeting.updateMany({
    where: { materialId: id },
    data: { materialId: null },
  });
  await prisma.scheduleSlot.updateMany({
    where: { materialId: id },
    data: { materialId: null },
  });

  await prisma.learningMaterial.delete({ where: { id } });
  await clearMaterialCaches();
  await cache.del(`materials:detail:${id}`);
  return true;
}

async function bulkCreateMaterials(body) {
  const { classId, topics, startOrder, semesterNumber, description: sharedDesc, learningObjective: sharedLO, status } = body;
  if (!classId || !topics || !Array.isArray(topics) || topics.length === 0) {
    throw new BadRequestError("classId and topics array required");
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const semNum = semesterNumber ? parseInt(semesterNumber, 10) : 1;
  const created = [];
  for (let i = 0; i < topics.length; i++) {
    const item = topics[i];
    const isObj = typeof item === "object";
    const topic = isObj ? item.topic.trim() : item.trim();
    const desc = isObj && item.description ? item.description : (sharedDesc || "");
    const lo = isObj && item.learningObjective ? item.learningObjective : (sharedLO || "");
    const order = isObj && item.orderNumber ? parseInt(item.orderNumber, 10) : ((startOrder || 1) + i);
    const sem = isObj && item.semesterNumber ? parseInt(item.semesterNumber, 10) : semNum;
    const id = `MAT-${classId}-${String(order).padStart(2, "0")}`;

    await prisma.learningMaterial.deleteMany({ where: { id } });

    const contentSections = [
      { id: "s1", title: `1. Pendahuluan — ${topic}`, body: desc || `Pengantar konsep dan pemahaman mendalam mengenai ${topic}.` },
      { id: "s2", title: `2. Pembahasan Inti & Contoh`, body: `Penjelasan sintaks, implementasi kode terapan, dan studi kasus untuk ${topic}.` },
      { id: "s3", title: `3. Latihan & Tantangan Praktik`, body: `Latihan mandiri dan evaluasi praktikum terbimbing bagi siswa untuk ${topic}.` }
    ];

    const mat = await prisma.learningMaterial.create({
      data: {
        id,
        classId,
        orderNumber: order,
        semesterNumber: sem,
        topic,
        description: desc,
        learningObjective: lo,
        status: status || "upcoming",
        keyPoints: JSON.stringify([topic, "Konsep Inti", "Studi Kasus"]),
        content: JSON.stringify(contentSections),
      },
    });
    created.push(mat);
  }

  await clearMaterialCaches();
  return created;
}

/**
 * Deploy a single material to multiple target classes
 */
async function deployMaterialToClasses(body) {
  const { materialId, targetClassIds } = body;
  if (!materialId || !Array.isArray(targetClassIds) || targetClassIds.length === 0) {
    throw new BadRequestError("materialId and targetClassIds array are required");
  }

  const sourceMat = await prisma.learningMaterial.findUnique({ where: { id: materialId } });
  if (!sourceMat) {
    throw new NotFoundError("Source material not found");
  }

  const deployed = [];

  for (const targetClassId of targetClassIds) {
    const targetClass = await prisma.class.findUnique({ where: { id: targetClassId } });
    if (!targetClass) continue;

    const targetId = `MAT-${targetClassId}-${String(sourceMat.orderNumber).padStart(2, "0")}`;

    // Check if exists
    const existing = await prisma.learningMaterial.findUnique({ where: { id: targetId } });

    if (existing) {
      const updated = await prisma.learningMaterial.update({
        where: { id: targetId },
        data: {
          orderNumber: sourceMat.orderNumber,
          semesterNumber: sourceMat.semesterNumber || 1,
          topic: sourceMat.topic,
          description: sourceMat.description,
          learningObjective: sourceMat.learningObjective,
          content: sourceMat.content,
          keyPoints: sourceMat.keyPoints,
          references: sourceMat.references,
          fileUrl: sourceMat.fileUrl,
          fileName: sourceMat.fileName,
          fileSize: sourceMat.fileSize,
          fileType: sourceMat.fileType,
          videoUrl: sourceMat.videoUrl,
          status: "active", // Mark as published/active on deployment
        },
      });
      deployed.push(updated);
    } else {
      const created = await prisma.learningMaterial.create({
        data: {
          id: targetId,
          classId: targetClassId,
          orderNumber: sourceMat.orderNumber,
          semesterNumber: sourceMat.semesterNumber || 1,
          topic: sourceMat.topic,
          description: sourceMat.description,
          learningObjective: sourceMat.learningObjective,
          content: sourceMat.content,
          keyPoints: sourceMat.keyPoints,
          references: sourceMat.references,
          fileUrl: sourceMat.fileUrl,
          fileName: sourceMat.fileName,
          fileSize: sourceMat.fileSize,
          fileType: sourceMat.fileType,
          videoUrl: sourceMat.videoUrl,
          status: "active",
        },
      });
      deployed.push(created);
    }
  }

  await clearMaterialCaches();
  return {
    success: true,
    count: deployed.length,
    message: `Materi "${sourceMat.topic}" berhasil di-deploy ke ${deployed.length} kelas.`,
  };
}

/**
 * Clone entire curriculum from source class to target classes
 */
async function cloneCurriculum(body) {
  const { sourceClassId, targetClassIds, overwrite = true } = body;
  if (!sourceClassId || !Array.isArray(targetClassIds) || targetClassIds.length === 0) {
    throw new BadRequestError("sourceClassId and targetClassIds array required");
  }

  const sourceMaterials = await prisma.learningMaterial.findMany({
    where: { classId: sourceClassId },
    orderBy: [{ semesterNumber: "asc" }, { orderNumber: "asc" }],
  });

  if (sourceMaterials.length === 0) {
    throw new BadRequestError("No materials found in source class to clone");
  }

  let totalCloned = 0;

  for (const targetClassId of targetClassIds) {
    if (targetClassId === sourceClassId) continue;
    const targetClass = await prisma.class.findUnique({ where: { id: targetClassId } });
    if (!targetClass) continue;

    if (overwrite) {
      // Unlink before delete
      const oldMats = await prisma.learningMaterial.findMany({ where: { classId: targetClassId } });
      const oldIds = oldMats.map(m => m.id);
      await prisma.meeting.updateMany({ where: { materialId: { in: oldIds } }, data: { materialId: null } });
      await prisma.scheduleSlot.updateMany({ where: { materialId: { in: oldIds } }, data: { materialId: null } });
      await prisma.learningMaterial.deleteMany({ where: { classId: targetClassId } });
    }

    for (const sm of sourceMaterials) {
      const targetId = `MAT-${targetClassId}-${String(sm.orderNumber).padStart(2, "0")}`;
      await prisma.learningMaterial.create({
        data: {
          id: targetId,
          classId: targetClassId,
          orderNumber: sm.orderNumber,
          semesterNumber: sm.semesterNumber || 1,
          topic: sm.topic,
          description: sm.description,
          learningObjective: sm.learningObjective,
          content: sm.content,
          keyPoints: sm.keyPoints,
          references: sm.references,
          fileUrl: sm.fileUrl,
          fileName: sm.fileName,
          fileSize: sm.fileSize,
          fileType: sm.fileType,
          videoUrl: sm.videoUrl,
          status: sm.status,
        },
      });
      totalCloned++;
    }
  }

  await clearMaterialCaches();
  return {
    success: true,
    totalCloned,
    message: `Berhasil menduplikasi ${sourceMaterials.length} modul silabus ke ${targetClassIds.length} kelas target.`,
  };
}

/**
 * Apply 2-semester standard curriculum template for Grade 7 through 12
 */
async function applyTemplateCurriculum(body) {
  const { classId } = body;
  if (!classId) {
    throw new BadRequestError("classId is required");
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  throw new BadRequestError(
    "Belum ada template kurikulum bawaan untuk jenjang ini. Silakan buat materi baru secara mandiri atau gunakan fitur salin kurikulum dari kelas lain."
  );
}

module.exports = {
  listMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  bulkCreateMaterials,
  deployMaterialToClasses,
  cloneCurriculum,
  applyTemplateCurriculum,
  getCurriculumTemplates,
};
