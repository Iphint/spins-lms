/**
 * Auth Service
 */

const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const cache = require("../utils/cache");
const { signToken } = require("../config/jwt");
const { sanitizeUser } = require("../utils/helpers");
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");

async function login(identifier, password) {
  if (!identifier || !password) {
    throw new BadRequestError("Email/NISN and password are required");
  }

  const raw = String(identifier).trim();
  const normalizedEmail = raw.toLowerCase();
  const searchEmail = normalizedEmail === "arifin@smpnegeri5.sch.id" ? "arifin@spins.sch.id" : normalizedEmail;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: searchEmail },
        { student: { nisn: raw } },
      ],
    },
    include: {
      teacher: true,
      student: {
        include: {
          class: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError("Email/NISN atau password salah");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError("Email/NISN atau password salah");
  }

  if (user.status !== "active") {
    throw new ForbiddenError("Akun tidak aktif. Hubungi admin.");
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    teacherId: user.teacherId,
    studentId: user.studentId,
  });

  return {
    token,
    user: sanitizeUser(user),
    teacher: user.teacher,
    student: user.student,
  };
}

async function getCurrentUser(userId) {
  return cache.remember(`users:me:${userId}`, 300, async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacher: true,
        student: {
          include: {
            class: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      user: sanitizeUser(user),
      teacher: user.teacher,
      student: user.student,
    };
  });
}

async function listUsers() {
  return cache.remember("users:list", 300, async () => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map(sanitizeUser);
  });
}

async function createUser({ name, email, password, role, status, teacherId, studentId }) {
  if (!name || !email || !password) {
    throw new BadRequestError("name, email, and password are required");
  }

  if (password.length < 6) {
    throw new BadRequestError("Password minimal 6 karakter");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ConflictError("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = `USR-${Date.now()}`;
  const userRole = role || "teacher";
  let resolvedTeacherId = teacherId || null;
  let resolvedStudentId = studentId || null;

  if (userRole === "teacher" && !resolvedTeacherId) {
    const tid = `TCH-${Date.now()}`;
    const tRecord = await prisma.teacher.create({
      data: {
        id: tid,
        name: name.trim(),
        email: normalizedEmail,
        phone: "-",
        school: "SMP Negeri 5",
        subject: "Coding & AI",
        position: "Guru Pengajar",
        joinDate: new Date().toISOString().split("T")[0],
        bio: "Guru Pengajar",
      },
    });
    resolvedTeacherId = tRecord.id;
  } else if (userRole === "student" && !resolvedStudentId) {
    const sid = `STD-${Date.now()}`;
    const sRecord = await prisma.student.create({
      data: {
        id: sid,
        name: name.trim(),
        gender: "L",
        currentGrade: 7,
        entryYear: new Date().getFullYear().toString(),
        attendance: 0,
        worksheetCompletion: 0,
        averageScore: 0,
        status: "active",
      },
    });
    resolvedStudentId = sRecord.id;
  }

  const user = await prisma.user.create({
    data: {
      id,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      status: status || "active",
      teacherId: resolvedTeacherId,
      studentId: resolvedStudentId,
      createdAt: new Date().toISOString().split("T")[0],
    },
  });

  await cache.delPatterns(["users:*", "teachers:*", "students:*", "dashboard:*"]);

  return sanitizeUser(user);
}

async function updateUser(id, updateData) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("User not found");
  }

  const { name, email, password, role, status, teacherId, studentId } = updateData;
  const data = {
    ...(name !== undefined && { name: name.trim() }),
    ...(email !== undefined && { email: email.trim().toLowerCase() }),
    ...(role !== undefined && { role }),
    ...(status !== undefined && { status }),
    ...(teacherId !== undefined && { teacherId }),
    ...(studentId !== undefined && { studentId }),
  };

  if (password) {
    if (password.length < 6) {
      throw new BadRequestError("Password minimal 6 karakter");
    }
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({ where: { id }, data });
  await cache.delPatterns(["users:*", "teachers:*", "students:*", "dashboard:*"]);
  await cache.del(`users:me:${id}`);
  return sanitizeUser(user);
}

async function deleteUser(id, currentUserId) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("User not found");
  }

  if (existing.id === currentUserId) {
    throw new BadRequestError("Tidak dapat menghapus akun sendiri");
  }

  await prisma.user.delete({ where: { id } });
  await cache.delPatterns(["users:*", "teachers:*", "students:*", "dashboard:*"]);
  await cache.del(`users:me:${id}`);
  return true;
}

module.exports = {
  login,
  getCurrentUser,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
