/**
 * Submission Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");
const { logActivity } = require("./activity.service");
const { BadRequestError, NotFoundError } = require("../utils/errors");

async function clearSubmissionCaches() {
  await cache.delPatterns([
    "submissions:*",
    "worksheets:*",
    "students:*",
    "classes:*",
    "scores:*",
    "analytics:*",
    "dashboard:*",
    "student_portal:*",
  ]);
}

async function listSubmissions(query = {}) {
  const { worksheetId, studentId, classId } = query;
  const cacheKey = `submissions:list:${worksheetId || "all"}:${studentId || "all"}:${classId || "all"}`;

  return cache.remember(cacheKey, 300, async () => {
    const where = {};
    if (worksheetId) where.worksheetId = worksheetId;
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;

    return prisma.submission.findMany({
      where,
      include: {
        student: true,
        worksheet: true,
      },
      orderBy: [{ submittedDate: "desc" }, { score: "desc" }],
    });
  });
}

async function getSubmissionById(id) {
  return cache.remember(`submissions:detail:${id}`, 600, async () => {
    const data = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: true,
        worksheet: true,
      },
    });
    if (!data) {
      throw new NotFoundError("Submission not found");
    }
    return data;
  });
}

async function createOrUpdateSubmission(body, user = null) {
  const {
    worksheetId,
    studentId,
    classId,
    status,
    score,
    submittedDate,
    feedback,
    submittedCode,
    codeOutput,
    fileUrl,
    fileName,
  } = body;

  if (!worksheetId || !studentId) {
    throw new BadRequestError("worksheetId and studentId are required");
  }

  const existing = await prisma.submission.findFirst({
    where: { worksheetId, studentId },
    include: { student: true, worksheet: true },
  });

  if (existing) {
    const updated = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        ...(status !== undefined && { status }),
        ...(score !== undefined && { score: parseInt(score, 10) }),
        submittedDate: submittedDate || new Date().toISOString().split("T")[0],
        ...(feedback !== undefined && { feedback }),
        ...(submittedCode !== undefined && { submittedCode }),
        ...(codeOutput !== undefined && { codeOutput }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
      },
      include: { student: true, worksheet: true },
    });

    if (score !== undefined) {
      await logActivity({
        type: "score",
        message: `Guru ${user?.name || "Guru"} menilai tugas "${existing.worksheet?.title || "Lembar Kerja"}" untuk ${existing.student?.name || "siswa"}: ${score}/${existing.worksheet?.maxScore || 100}`,
        icon: "Award",
        teacherId: user?.teacherId,
        teacherName: user?.name,
      });
    }

    await clearSubmissionCaches();
    await cache.set(`submissions:detail:${updated.id}`, updated, 600);

    return updated;
  }

  let resolvedClassId = classId;
  if (!resolvedClassId) {
    const ws = await prisma.worksheet.findUnique({ where: { id: worksheetId } });
    resolvedClassId = ws ? ws.classId : "";
  }

  const id = `SUB-${worksheetId}-${studentId}`;
  const created = await prisma.submission.create({
    data: {
      id,
      worksheetId,
      studentId,
      classId: resolvedClassId,
      status: status || "completed",
      score: score !== undefined ? parseInt(score, 10) : 0,
      submittedDate: submittedDate || new Date().toISOString().split("T")[0],
      feedback: feedback || "",
      submittedCode: submittedCode || null,
      codeOutput: codeOutput || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    },
    include: { student: true, worksheet: true },
  });

  await clearSubmissionCaches();
  await cache.set(`submissions:detail:${created.id}`, created, 600);

  return created;
}

async function updateSubmission(id, body, user = null) {
  const existing = await prisma.submission.findUnique({
    where: { id },
    include: { student: true, worksheet: true },
  });
  if (!existing) {
    throw new NotFoundError("Submission not found");
  }

  const { status, score, feedback, submittedCode, codeOutput } = body;
  const updated = await prisma.submission.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(score !== undefined && { score: parseInt(score, 10) }),
      ...(feedback !== undefined && { feedback }),
      ...(submittedCode !== undefined && { submittedCode }),
      ...(codeOutput !== undefined && { codeOutput }),
    },
    include: { student: true, worksheet: true },
  });

  if (score !== undefined) {
    await logActivity({
      type: "score",
      message: `Guru ${user?.name || "Guru"} memberi nilai tugas "${existing.worksheet?.title || "LK"}" untuk ${existing.student?.name}: ${score}/${existing.worksheet?.maxScore || 100}`,
      icon: "Award",
      teacherId: user?.teacherId,
      teacherName: user?.name,
    });
  }

  await clearSubmissionCaches();
  await cache.set(`submissions:detail:${id}`, updated, 600);

  return updated;
}

module.exports = {
  listSubmissions,
  getSubmissionById,
  createOrUpdateSubmission,
  updateSubmission,
};
