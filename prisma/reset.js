const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const cache = require("../src/utils/cache");

const prisma = new PrismaClient();

async function reset() {
  console.log("=== RESETTING DATABASE (CLEAN SLATE: 1 ADMIN USER ONLY) ===");

  // 1. Delete transactional, relational, and academic data in correct dependency order
  console.log("1. Deleting attendances, scores, submissions, worksheets, journals, activities, calendar events...");
  await prisma.attendance.deleteMany();
  await prisma.score.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.worksheet.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.meeting.deleteMany();

  console.log("2. Deleting student enrollments, students, and classes...");
  await prisma.studentEnrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();

  console.log("3. Disconnecting foreign keys on users...");
  await prisma.user.updateMany({
    data: { teacherId: null, studentId: null },
  });

  console.log("4. Purging all users and teachers...");
  await prisma.user.deleteMany();
  await prisma.teacher.deleteMany();

  console.log("5. Purging old semesters and academic years...");
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();

  // 2. Create clean Academic Years & Semesters (Ready for 2026/2027 and backwards compatibility)
  console.log("6. Creating Academic Years & Semesters (2026/2027 active)...");
  await prisma.academicYear.create({
    data: {
      id: "AY2026",
      name: "2026/2027",
      startDate: "2026-07-13",
      endDate: "2027-06-25",
      isActive: true,
    },
  });

  await prisma.academicYear.create({
    data: {
      id: "AY2025",
      name: "2025/2026",
      startDate: "2025-07-14",
      endDate: "2026-06-20",
      isActive: false,
    },
  });

  await prisma.semester.create({
    data: {
      id: "SEM1-2026",
      academicYearId: "AY2026",
      name: "Semester 1 (Ganjil) 2026/2027",
      number: 1,
      startDate: "2026-07-13",
      endDate: "2026-12-18",
      totalMeetings: 16,
      completedMeetings: 0,
      progress: 0,
      status: "active",
      learningTargets: 16,
      completedTargets: 0,
    },
  });

  await prisma.semester.create({
    data: {
      id: "SEM2-2026",
      academicYearId: "AY2026",
      name: "Semester 2 (Genap) 2026/2027",
      number: 2,
      startDate: "2027-01-04",
      endDate: "2027-06-25",
      totalMeetings: 16,
      completedMeetings: 0,
      progress: 0,
      status: "upcoming",
      learningTargets: 16,
      completedTargets: 0,
    },
  });

  await prisma.semester.create({
    data: {
      id: "SEM1-2025",
      academicYearId: "AY2025",
      name: "Semester 1 (Ganjil) 2025/2026",
      number: 1,
      startDate: "2025-07-14",
      endDate: "2025-12-19",
      totalMeetings: 16,
      completedMeetings: 0,
      progress: 0,
      status: "completed",
      learningTargets: 16,
      completedTargets: 0,
    },
  });

  // 3. Create exactly 1 User Record (Administrator ONLY)
  console.log("7. Creating Single User Record (admin@lms.com / role: admin)...");
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: {
      id: "USR-ADMIN-001",
      email: "admin@lms.com",
      name: "Administrator LMS",
      role: "admin",
      status: "active",
      teacherId: null,
      studentId: null,
      password: passwordHash,
      createdAt: new Date().toISOString().split("T")[0],
    },
  });

  // 4. Flush Redis and memory cache
  console.log("8. Flushing Redis and in-memory cache...");
  await cache.flush();

  console.log("\n=== RESET COMPLETE: CLEAN SLATE (ADMIN ONLY) ===");
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
  console.log(`Total Users (${users.length}):`);
  users.forEach((u) => console.log(`  - [${u.role.toUpperCase()}] ${u.name} <${u.email}> (id: ${u.id})`));

  const teachersCount = await prisma.teacher.count();
  const classesCount = await prisma.class.count();
  const studentsCount = await prisma.student.count();
  const slotsCount = await prisma.scheduleSlot.count();
  console.log(`Teachers count: ${teachersCount}`);
  console.log(`Classes count: ${classesCount}`);
  console.log(`Students count: ${studentsCount}`);
  console.log(`Schedule slots count: ${slotsCount}`);
}

reset()
  .catch((e) => {
    console.error("Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
