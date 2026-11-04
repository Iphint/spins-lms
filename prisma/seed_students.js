const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding student accounts...");
  const passwordHash = await bcrypt.hash("password123", 10);

  // Student 1: Ahmad Rizky Pratama
  const student1Id = "STD-CLS-7A-01";
  await prisma.student.upsert({
    where: { id: student1Id },
    create: {
      id: student1Id,
      classId: "CLS-7A",
      name: "Ahmad Rizky Pratama",
      gender: "L",
      nisn: "0081234501",
      attendance: 95,
      worksheetCompletion: 90,
      averageScore: 88,
      status: "active",
      strengths: JSON.stringify(["Logika Pemrograman", "Computational Thinking"]),
      weaknesses: JSON.stringify(["Perlu pendalaman CSS Grid"]),
      achievements: JSON.stringify(["Juara 1 Lomba Coding Kelas 7"]),
      parentName: "Bapak Pratama",
      parentPhone: "+62 812-3456-7801",
    },
    update: {
      name: "Ahmad Rizky Pratama",
      gender: "L",
      nisn: "0081234501",
    },
  });

  await prisma.user.upsert({
    where: { email: "ahmad.rizky@siswa.smpnegeri5.sch.id" },
    create: {
      id: "USR-STD-01",
      email: "ahmad.rizky@siswa.smpnegeri5.sch.id",
      password: passwordHash,
      name: "Ahmad Rizky Pratama",
      role: "student",
      status: "active",
      studentId: student1Id,
      createdAt: "2025-07-14",
    },
    update: {
      password: passwordHash,
      name: "Ahmad Rizky Pratama",
      studentId: student1Id,
      role: "student",
      status: "active",
    },
  });
  console.log("✓ Created Student 1: Ahmad Rizky Pratama (ahmad.rizky@siswa.smpnegeri5.sch.id / NISN: 0081234501)");

  // Student 2: Siti Rahmawati
  const student2Id = "STD-CLS-7A-02";
  await prisma.student.upsert({
    where: { id: student2Id },
    create: {
      id: student2Id,
      classId: "CLS-7A",
      name: "Siti Rahmawati",
      gender: "P",
      nisn: "0081234502",
      attendance: 92,
      worksheetCompletion: 85,
      averageScore: 84,
      status: "active",
      strengths: JSON.stringify(["Kreativitas Solusi", "Teliti"]),
      weaknesses: JSON.stringify([]),
      achievements: JSON.stringify(["Apresiasi Karya Algoritma Terbaik"]),
      parentName: "Ibu Rahmawati",
      parentPhone: "+62 812-3456-7802",
    },
    update: {
      name: "Siti Rahmawati",
      gender: "P",
      nisn: "0081234502",
    },
  });

  await prisma.user.upsert({
    where: { email: "siti.rahmawati@siswa.smpnegeri5.sch.id" },
    create: {
      id: "USR-STD-02",
      email: "siti.rahmawati@siswa.smpnegeri5.sch.id",
      password: passwordHash,
      name: "Siti Rahmawati",
      role: "student",
      status: "active",
      studentId: student2Id,
      createdAt: "2025-07-14",
    },
    update: {
      password: passwordHash,
      name: "Siti Rahmawati",
      studentId: student2Id,
      role: "student",
      status: "active",
    },
  });
  console.log("✓ Created Student 2: Siti Rahmawati (siti.rahmawati@siswa.smpnegeri5.sch.id / NISN: 0081234502)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
