/**
 * Worksheet Service
 */

const crypto = require("crypto");
const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const { safeJsonStringify } = require("../utils/helpers");

async function clearWorksheetCaches() {
  await cache.delPatterns([
    "worksheets:*",
    "submissions:*",
    "dashboard:*",
    "student_portal:*",
    "analytics:*",
  ]);
}

async function listWorksheets(query = {}) {
  const { classId, status, hasCodeEditor } = query;
  const cacheKey = `worksheets:list:${classId || "all"}:${status || "all"}:${hasCodeEditor !== undefined ? hasCodeEditor : "all"}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (classId) where.classId = classId;
    if (status) where.status = status;
    if (hasCodeEditor !== undefined) where.hasCodeEditor = hasCodeEditor === "true" || hasCodeEditor === true;

    return prisma.worksheet.findMany({
      where,
      include: {
        class: true,
        submissions: {
          include: { student: true },
        },
      },
      orderBy: { assignedDate: "desc" },
    });
  });
}

async function getWorksheetById(id) {
  return cache.remember(`worksheets:detail:${id}`, 600, async () => {
    const data = await prisma.worksheet.findUnique({
      where: { id },
      include: {
        class: true,
        submissions: {
          include: { student: true },
          orderBy: { submittedDate: "desc" },
        },
      },
    });
    if (!data) {
      throw new NotFoundError("Worksheet not found");
    }
    return data;
  });
}

async function createWorksheet(body, user = null) {
  const {
    classId,
    title,
    topic,
    assignedDate,
    dueDate,
    difficulty,
    totalQuestions,
    maxScore,
    description,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    hasCodeEditor,
    codeLanguage,
    starterCode,
    solutionCode,
    testCases,
  } = body;

  if (!classId || !title) {
    throw new BadRequestError("classId and title are required");
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { teacher: true },
  });
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  const formattedTestCases = typeof testCases === "object" ? safeJsonStringify(testCases) : (testCases || "[]");

  const created = await prisma.worksheet.create({
    data: {
      id: `WS-${crypto.randomUUID().slice(0, 8)}`,
      classId,
      title,
      topic: topic || title,
      assignedDate: assignedDate || new Date().toISOString().split("T")[0],
      dueDate: dueDate || "",
      difficulty: difficulty || "Sedang",
      completion: 0,
      status: "upcoming",
      totalQuestions: parseInt(totalQuestions, 10) || 10,
      maxScore: parseInt(maxScore, 10) || 100,
      description: description || "",
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize ? parseInt(fileSize, 10) : null,
      fileType: fileType || null,
      hasCodeEditor: Boolean(hasCodeEditor),
      codeLanguage: codeLanguage || "python",
      starterCode: starterCode || "",
      solutionCode: solutionCode || "",
      testCases: formattedTestCases,
    },
    include: {
      class: true,
      submissions: true,
    },
  });

  await clearWorksheetCaches();
  await cache.set(`worksheets:detail:${created.id}`, created, 600);

  await logActivity({
    type: "worksheet",
    message: `Guru ${user?.name || cls.teacher?.name || "Guru"} menerbitkan lembar kerja "${title}" untuk ${cls.name}`,
    icon: "FileText",
    teacherId: user?.teacherId || cls.teacherId,
    teacherName: user?.name || cls.teacher?.name,
  });

  return created;
}

async function updateWorksheet(id, body) {
  const existing = await prisma.worksheet.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Worksheet not found");
  }

  const {
    title,
    topic,
    assignedDate,
    dueDate,
    difficulty,
    status,
    totalQuestions,
    maxScore,
    description,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    hasCodeEditor,
    codeLanguage,
    starterCode,
    solutionCode,
    testCases,
    completion,
  } = body;

  const formattedTestCases =
    testCases !== undefined
      ? typeof testCases === "object"
        ? safeJsonStringify(testCases)
        : testCases
      : undefined;

  const updated = await prisma.worksheet.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(topic !== undefined && { topic }),
      ...(assignedDate !== undefined && { assignedDate }),
      ...(dueDate !== undefined && { dueDate }),
      ...(difficulty !== undefined && { difficulty }),
      ...(status !== undefined && { status }),
      ...(completion !== undefined && { completion: parseFloat(completion) }),
      ...(totalQuestions !== undefined && { totalQuestions: parseInt(totalQuestions, 10) }),
      ...(maxScore !== undefined && { maxScore: parseInt(maxScore, 10) }),
      ...(description !== undefined && { description }),
      ...(fileUrl !== undefined && { fileUrl }),
      ...(fileName !== undefined && { fileName }),
      ...(fileSize !== undefined && { fileSize: fileSize ? parseInt(fileSize, 10) : null }),
      ...(fileType !== undefined && { fileType }),
      ...(hasCodeEditor !== undefined && { hasCodeEditor: Boolean(hasCodeEditor) }),
      ...(codeLanguage !== undefined && { codeLanguage }),
      ...(starterCode !== undefined && { starterCode }),
      ...(solutionCode !== undefined && { solutionCode }),
      ...(formattedTestCases !== undefined && { testCases: formattedTestCases }),
    },
    include: {
      class: true,
      submissions: {
        include: { student: true },
      },
    },
  });

  await clearWorksheetCaches();
  await cache.set(`worksheets:detail:${id}`, updated, 600);

  return updated;
}

async function deleteWorksheet(id) {
  const existing = await prisma.worksheet.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Worksheet not found");
  }

  await prisma.$transaction([
    prisma.submission.deleteMany({ where: { worksheetId: id } }),
    prisma.worksheet.delete({ where: { id } }),
  ]);

  await clearWorksheetCaches();
  await cache.del(`worksheets:detail:${id}`);

  return true;
}

module.exports = {
  listWorksheets,
  getWorksheetById,
  createWorksheet,
  updateWorksheet,
  deleteWorksheet,
};
