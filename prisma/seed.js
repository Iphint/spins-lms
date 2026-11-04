/**
 * Real-Data Seeder for LMS
 * Teacher: Tr. Muhammad Arifin, S.Kom. (Coding & AI / Integrated AI)
 * 14 Real Timetable Classes + 23 Real Timetable Sessions
 * 16 Modular Curriculum Sessions for Coding & AI
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const SCANNED_TIMETABLE_SESSIONS = [
  // SENIN (MONDAY) - 4 sesi
  { day: "Senin", classCode: "G12-S", startTime: "10:10", endTime: "10:50", room: "Lab AI & Coding 1" },
  { day: "Senin", classCode: "G8-S", startTime: "11:05", endTime: "11:45", room: "Lab Komputer 2" },
  { day: "Senin", classCode: "G10-P", startTime: "13:10", endTime: "13:50", room: "Lab AI & Coding 1" },
  { day: "Senin", classCode: "G9-P", startTime: "14:00", endTime: "14:45", room: "Lab Komputer 3" },

  // SELASA (TUESDAY) - 5 sesi
  { day: "Selasa", classCode: "G11-S", startTime: "09:30", endTime: "10:10", room: "Lab AI & Coding 1" },
  { day: "Selasa", classCode: "G12-S", startTime: "10:10", endTime: "10:50", room: "Lab AI & Coding 1" },
  { day: "Selasa", classCode: "G7-S", startTime: "11:05", endTime: "11:45", room: "Lab Komputer 1" },
  { day: "Selasa", classCode: "G8-S", startTime: "12:25", endTime: "12:55", room: "Lab Komputer 2" },
  { day: "Selasa", classCode: "G8-P", startTime: "12:55", endTime: "13:35", room: "Lab Komputer 2" },

  // RABU (WEDNESDAY) - 6 sesi
  { day: "Rabu", classCode: "G9-S", startTime: "10:05", endTime: "10:40", room: "Lab Komputer 3" },
  { day: "Rabu", classCode: "G9-P", startTime: "10:45", endTime: "11:25", room: "Lab Komputer 3" },
  { day: "Rabu", classCode: "G10-S", startTime: "11:25", endTime: "12:05", room: "Lab AI & Coding 1" },
  { day: "Rabu", classCode: "G8-P", startTime: "12:25", endTime: "12:55", room: "Lab Komputer 2" },
  { day: "Rabu", classCode: "G7-P", startTime: "13:40", endTime: "14:20", room: "Lab Komputer 1" },
  { day: "Rabu", classCode: "G10-P", startTime: "14:45", endTime: "15:15", room: "Lab AI & Coding 1" },

  // KAMIS (THURSDAY) - 3 sesi
  { day: "Kamis", classCode: "G11-S", startTime: "13:25", endTime: "14:00", room: "Lab AI & Coding 1" },
  { day: "Kamis", classCode: "G9-S", startTime: "14:00", endTime: "14:45", room: "Lab Komputer 3" },
  { day: "Kamis", classCode: "G11-A", startTime: "14:50", endTime: "15:25", room: "Lab AI & Coding 1" },

  // JUMAT (FRIDAY) - 5 sesi
  { day: "Jumat", classCode: "G11-A", startTime: "09:30", endTime: "10:10", room: "Lab AI & Coding 1" },
  { day: "Jumat", classCode: "G10-S", startTime: "10:45", endTime: "11:25", room: "Lab AI & Coding 1" },
  { day: "Jumat", classCode: "G7-P", startTime: "12:55", endTime: "13:35", room: "Lab Komputer 1" },
  { day: "Jumat", classCode: "G7-S", startTime: "13:40", endTime: "14:20", room: "Lab Komputer 1" },
  { day: "Jumat", classCode: "G12-A", startTime: "14:50", endTime: "15:25", room: "Lab AI & Coding 1" },
];

const CODING_AI_CURRICULUM = [
  {
    order: 1,
    topic: "Pengenalan Komputasi & Pemrograman Dasar Python",
    description: "Mempelajari paradigma berpikir komputasional, instalasi environment Python, serta sintaks dasar dan fungsi print/input.",
    objective: "Siswa mampu memahami cara kerja interpreter Python dan menulis program interaktif pertama.",
    keyPoints: ["Logika Berpikir Komputasional", "Setup Environment Python & IDE", "Fungsi Input & Output", "Komentar dan Struktur Sintaks"],
    type: "slides",
    fileName: "Modul_01_Pengenalan_Python_Dasar.pdf",
    fileSize: 2450000,
    fileType: "application/pdf",
  },
  {
    order: 2,
    topic: "Variabel, Tipe Data, dan Operasi Aritmatika",
    description: "Memahami tipe data primitif: integer, float, string, boolean, serta konversi tipe data dan operator matematika.",
    objective: "Siswa dapat mengolah data angka dan teks menggunakan operasi aritmatika dan logika dasar.",
    keyPoints: ["Tipe Data Primitif", "Casting & Tipe Konversi", "Operator Aritmatika & Modulo", "String Formatting"],
    type: "code",
    fileName: "Modul_02_Tipe_Data_Operasi.py",
    fileSize: 1850000,
    fileType: "text/x-python",
  },
  {
    order: 3,
    topic: "Percabangan Logika & Pengambilan Keputusan (If-Else)",
    description: "Membangun algoritma pengambilan keputusan menggunakan if, elif, dan else dengan operator perbandingan.",
    objective: "Siswa mampu merancang logika sistem keputusan otomatis berdasarkan kondisi input yang fleksibel.",
    keyPoints: ["Kondisi Boolean", "Struktur If, Elif, Else", "Operator Logika (and, or, not)", "Nested Conditionals"],
    type: "pdf",
    fileName: "Modul_03_Percabangan_Logika.pdf",
    fileSize: 3100000,
    fileType: "application/pdf",
  },
  {
    order: 4,
    topic: "Perulangan (Loops & Iterasi): For dan While",
    description: "Teknik otomasi pengulangan kode secara efisien menggunakan for loops dengan range dan while loops.",
    objective: "Siswa mampu mengotomasi proses berulang dan memahami pengendalian iterasi dengan break dan continue.",
    keyPoints: ["For Loop & Range Function", "While Loop & Infinite Loop Prevention", "Break and Continue Statements", "Nested Loops"],
    type: "slides",
    fileName: "Modul_04_Perulangan_Otomasi.pdf",
    fileSize: 2800000,
    fileType: "application/pdf",
  },
  {
    order: 5,
    topic: "Struktur Data: List, Tuples, dan Dictionary",
    description: "Penyimpanan dan manipulasi koleksi data majemuk pada Python untuk pemrosesan dataset terstruktur.",
    objective: "Siswa menguasai manipulasi koleksi data (indexing, slicing, append, pop, key-value lookup).",
    keyPoints: ["List Operations & Methods", "Immutability pada Tuple", "Key-Value Mapping pada Dictionary", "Iterasi Koleksi Data"],
    type: "code",
    fileName: "Modul_05_Struktur_Data_Python.py",
    fileSize: 2100000,
    fileType: "text/x-python",
  },
  {
    order: 6,
    topic: "Fungsi Modular & Pemecahan Masalah Komputasional",
    description: "Membuat fungsi kustom (def), parameter, return value, dan prinsip clean code DRY (Don't Repeat Yourself).",
    objective: "Siswa mampu menstrukturkan program kompleks menjadi modul-modul fungsi yang rapi dan reusable.",
    keyPoints: ["Deklarasi Fungsi & Argument", "Return Values & Scope Variabel", "Lambda Expressions", "Debugging Fungsi"],
    type: "pdf",
    fileName: "Modul_06_Fungsi_Modular.pdf",
    fileSize: 2900000,
    fileType: "application/pdf",
  },
  {
    order: 7,
    topic: "Pengantar Artificial Intelligence & Machine Learning",
    description: "Konsep dasar AI, perbedaan pemrograman tradisional vs Machine Learning, dan jenis pembelajaran (Supervised, Unsupervised).",
    objective: "Siswa memahami bagaimana mesin belajar dari pola data dan mengenali pemanfaatan AI modern.",
    keyPoints: ["Definisi AI, ML, dan Deep Learning", "Siklus Data: Input, Training, Model, Prediksi", "Supervised vs Unsupervised Learning", "Use Case AI di Dunia Nyata"],
    type: "slides",
    fileName: "Modul_07_Pengantar_AI_MachineLearning.pdf",
    fileSize: 4200000,
    fileType: "application/pdf",
    videoUrl: "https://www.youtube.com/watch?v=2ePf9rue1Ao",
  },
  {
    order: 8,
    topic: "Evaluasi Tengah Semester (PTS / Hands-on Coding Project)",
    description: "Asesmen praktikum pemrograman: membangun program interaktif berbasis Python dengan logika algoritma lengkap.",
    objective: "Mengukur kompetensi koding siswa secara holistik melalui studi kasus pemecahan masalah.",
    keyPoints: ["Studi Kasus Proyek Mandiri", "Penerapan Algoritma Terpadu", "Code Review & Refactoring", "Penilaian Kualitas Kode"],
    type: "pdf",
    fileName: "Panduan_PTS_HandsOn_Coding.pdf",
    fileSize: 1500000,
    fileType: "application/pdf",
  },
  {
    order: 9,
    topic: "Representasi Data & Pengolahan Citra Digital (Computer Vision Dasar)",
    description: "Memahami bagaimana komputer melihat gambar sebagai matriks piksel dan dasar deteksi pola visual.",
    objective: "Siswa mampu memahami konsep piksel, filter citra digital, dan dasar deteksi objek visual.",
    keyPoints: ["Matriks Piksel RGB & Grayscale", "Manipulasi Citra Digital", "Pengenalan Ekstraksi Fitur", "Penerapan Computer Vision"],
    type: "slides",
    fileName: "Modul_09_Computer_Vision_Dasar.pdf",
    fileSize: 3800000,
    fileType: "application/pdf",
  },
  {
    order: 10,
    topic: "Pengenalan Natural Language Processing & Large Language Model",
    description: "Cara komputer memahami bahasa manusia: tokenisasi, embedding, dan prinsip kerja arsitektur transformer LLM.",
    objective: "Siswa memahami cara AI memproses teks, memprediksi kata berikutnya, dan menghasilkan bahasa alami.",
    keyPoints: ["Konsep Dasar NLP", "Tokenisasi & Stopwords", "Generative AI vs Discriminative AI", "Mekanisme Dasar LLM"],
    type: "slides",
    fileName: "Modul_10_Pengenalan_NLP_LLM.pdf",
    fileSize: 3400000,
    fileType: "application/pdf",
  },
  {
    order: 11,
    topic: "Prompt Engineering & Integrasi API Kecerdasan Buatan",
    description: "Teknik merancang instruksi (prompt) yang presisi, zero-shot/few-shot prompting, dan pemanggilan REST API AI.",
    objective: "Siswa mampu merumuskan prompt terstruktur dan mengintegrasikan model AI ke dalam kode aplikasi.",
    keyPoints: ["Prinsip Efektif Prompt Engineering", "Role Prompting & System Instructions", "Few-Shot Prompting", "Dasar API Endpoint & JSON Response"],
    type: "code",
    fileName: "Modul_11_Prompt_Engineering_API.py",
    fileSize: 2200000,
    fileType: "text/x-python",
  },
  {
    order: 12,
    topic: "Pembuatan Chatbot Cerdas dengan Python",
    description: "Membangun antarmuka percakapan interaktif berbasis bot dengan memori percakapan konteks.",
    objective: "Siswa dapat membuat prototipe chatbot tanya-jawab interaktif berbasis aturan dan model AI.",
    keyPoints: ["Arsitektur Chatbot Interaktif", "Pengelolaan Riwayat Percakapan (Memory)", "Penanganan Error & Fallback Response", "Testing Chatbot Dialog"],
    type: "code",
    fileName: "Modul_12_Membangun_Chatbot_Python.py",
    fileSize: 2600000,
    fileType: "text/x-python",
  },
  {
    order: 13,
    topic: "Etika AI, Keamanan Siber, dan Hak Cipta Digital",
    description: "Membahas bias algoritma, privasi data pengguna, keamanan siber (cybersecurity), serta tanggung jawab moral pengembang AI.",
    objective: "Siswa memiliki kesadaran kritis terhadap dampak sosial, etika, dan keamanan dalam pemanfaatan teknologi AI.",
    keyPoints: ["Bias dan Keadilan Algoritma", "Perlindungan Data Pribadi (Privacy)", "Keamanan Siber dalam Sistem AI", "Hak Cipta Karya Buatan AI"],
    type: "slides",
    fileName: "Modul_13_Etika_dan_Keamanan_AI.pdf",
    fileSize: 3100000,
    fileType: "application/pdf",
  },
  {
    order: 14,
    topic: "Mini-Project: Prototipe Aplikasi Berbasis AI",
    description: "Merancang ide aplikasi solusi nyata yang mengombinasikan logika pemrograman dan kecerdasan buatan.",
    objective: "Siswa mampu berkolaborasi merancang rancangan arsitektur dan antarmuka aplikasi AI sederhana.",
    keyPoints: ["Problem Identification & User Needs", "System Flowchart & Wireframe", "Integrasi Komponen AI", "Pembagian Tugas Tim"],
    type: "pdf",
    fileName: "Modul_14_Panduan_MiniProject_AI.pdf",
    fileSize: 2700000,
    fileType: "application/pdf",
  },
  {
    order: 15,
    topic: "Finalisasi, Pengujian, dan Optimasi Kode Proyek",
    description: "Proses testing perangkat lunak, penanganan bug (bug fixing), optimasi performa, dan penyusunan dokumentasi kode.",
    objective: "Siswa menguasai teknik pengujian aplikasi, debugging terstruktur, dan penulisan dokumentasi teknis.",
    keyPoints: ["Teknik Unit Testing Sederhana", "Handling Exceptions (Try-Except)", "Optimasi Kecepatan Eksekusi", "Dokumentasi & README"],
    type: "code",
    fileName: "Modul_15_Testing_dan_Optimasi.py",
    fileSize: 1900000,
    fileType: "text/x-python",
  },
  {
    order: 16,
    topic: "Asesmen Sumatif Akhir Semester (PAS / AI Showcase)",
    description: "Presentasi proyek akhir, demonstrasi langsung aplikasi siswa, dan asesmen capaian pembelajaran semester.",
    objective: "Mengevaluasi kompetensi akhir siswa secara komprehensif melalui demonstrasi produk dan karya komputasi.",
    keyPoints: ["Presentasi & Demo Karya Siswa", "Tanya Jawab Teknis & Refleksi", "Rubrik Penilaian Sumatif", "Evaluasi Akhir Semester"],
    type: "slides",
    fileName: "Modul_16_Showcase_dan_Evaluasi_Akhir.pdf",
    fileSize: 3900000,
    fileType: "application/pdf",
  },
];

const CODING_AI_WORKSHEETS = [
  {
    idSuffix: "01",
    title: "Praktikum 01: Struktur Variabel & Operasi Aritmatika",
    topic: "Pemrograman Dasar Python",
    difficulty: "Mudah",
    totalQuestions: 5,
    maxScore: 100,
    hasCodeEditor: true,
    codeLanguage: "python",
    starterCode: `# Praktikum 1: Operasi Aritmatika & Variabel\n# Buatlah fungsi hitung_luas_persegi_panjang(panjang, lebar)\ndef hitung_luas_persegi_panjang(panjang, lebar):\n    # Tulis kode Anda di sini\n    pass\n\n# Uji coba fungsi Anda:\nprint(hitung_luas_persegi_panjang(10, 5))\n`,
    description: "Buatlah fungsi Python untuk menghitung luas dan keliling persegi panjang berdasarkan input panjang dan lebar.",
  },
  {
    idSuffix: "02",
    title: "Praktikum 02: Sistem Penentuan Nilai & Percabangan If-Else",
    topic: "Percabangan Logika",
    difficulty: "Sedang",
    totalQuestions: 5,
    maxScore: 100,
    hasCodeEditor: true,
    codeLanguage: "python",
    starterCode: `# Praktikum 2: Logika Nilai Siswa\ndef konversi_nilai(skor):\n    # Nilai >= 90: 'A', >= 80: 'B', >= 70: 'C', lainnya: 'D'\n    pass\n\nprint(konversi_nilai(85))\n`,
    description: "Rancang logika konversi skor angka menjadi predikat huruf (A, B, C, D) menggunakan struktur if-elif-else.",
  },
  {
    idSuffix: "03",
    title: "Praktikum 03: Otomasi Kalkulasi Deret dengan Loops",
    topic: "Perulangan (For & While)",
    difficulty: "Sedang",
    totalQuestions: 6,
    maxScore: 100,
    hasCodeEditor: true,
    codeLanguage: "python",
    starterCode: `# Praktikum 3: Jumlah Bilangan Genap\ndef jumlahkan_genap(n):\n    # Jumlahkan semua bilangan genap dari 1 hingga n\n    pass\n\nprint(jumlahkan_genap(10)) # Harusnya 30 (2+4+6+8+10)\n`,
    description: "Gunakan for loop dan operator modulo untuk menjumlahkan deret bilangan genap hingga batas n.",
  },
  {
    idSuffix: "04",
    title: "Praktikum 04: Pengolahan Data Siswa Menggunakan Dictionary",
    topic: "Struktur Data Koleksi",
    difficulty: "Sedang",
    totalQuestions: 5,
    maxScore: 100,
    hasCodeEditor: true,
    codeLanguage: "python",
    starterCode: `# Praktikum 4: Filter Siswa Lulus\ndef filter_lulus(data_siswa, kkm=75):\n    # data_siswa adalah dict {'Nama': Nilai}\n    # Kembalikan list nama siswa yang nilainya >= kkm\n    pass\n\ncontoh = {'Ahmad': 85, 'Budi': 70, 'Siti': 92}\nprint(filter_lulus(contoh))\n`,
    description: "Manipulasi dictionary data siswa dan filter siswa yang memenuhi Kriteria Ketuntasan Minimal (KKM).",
  },
  {
    idSuffix: "05",
    title: "Praktikum 05: Simulasi Klasifikasi Pola AI Sederhana",
    topic: "Machine Learning Dasar",
    difficulty: "Sulit",
    totalQuestions: 5,
    maxScore: 100,
    hasCodeEditor: true,
    codeLanguage: "python",
    starterCode: `# Praktikum 5: Klasifikasi Aturan Heuristik\ndef klasifikasi_spam(pesan):\n    kata_kunci = ['hadiah', 'klaim', 'uang tunai', 'klik link']\n    # Kembalikan True jika mengandung minimal 2 kata kunci\n    pass\n\nprint(klasifikasi_spam("Selamat Anda mendapatkan hadiah uang tunai!"))\n`,
    description: "Buat algoritma pendeteksi pesan spam sederhana menggunakan pencocokan fitur teks (feature matching).",
  },
  {
    idSuffix: "06",
    title: "Praktikum 06: Perancangan Prompt Terstruktur untuk AI Chatbot",
    topic: "Prompt Engineering & LLM",
    difficulty: "Sedang",
    totalQuestions: 4,
    maxScore: 100,
    hasCodeEditor: false,
    description: "Rancang system prompt dan user prompt terstruktur untuk asisten belajar pemrograman sekolah.",
  },
];

async function main() {
  console.log("=========================================");
  console.log("  RESETTING LMS DATABASE WITH REAL DATA  ");
  console.log("  Teacher: Tr. Muhammad Arifin, S.Kom.  ");
  console.log("  Subject: Coding & AI / Integrated AI   ");
  console.log("=========================================");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Clean existing records in foreign-key safe order
  await prisma.studentEnrollment.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.score.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.worksheet.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teacher.deleteMany();

  console.log("✓ All existing tables purged cleanly.");

  // 2. Primary Teacher: Tr. Muhammad Arifin
  await prisma.teacher.create({
    data: {
      id: "T001",
      name: "Tr. Muhammad Arifin, S.Kom.",
      email: "arifin@smpnegeri5.sch.id",
      phone: "+62 813-8899-7711",
      photo: null,
      school: "SMP-SMA Negeri 5 Jakarta",
      schoolAddress: "Jl. Pendidikan No. 15, Jakarta Selatan",
      subject: "Coding & AI / Integrated AI",
      nip: "198804122014021003",
      position: "Guru Utama Coding & Artificial Intelligence",
      joinDate: "2015-07-15",
      bio: "Pengajar Coding & AI berpengalaman dalam integrasi komputasi modern, Python, Machine Learning, dan Computer Vision pada kurikulum sekolah.",
    },
  });

  // Secondary Teacher for compatibility
  await prisma.teacher.create({
    data: {
      id: "T002",
      name: "Ibu Sari Dewi Kusuma, M.Pd.",
      email: "sari.dewi@smpnegeri5.sch.id",
      phone: "+62 812-3456-7890",
      photo: null,
      school: "SMP-SMA Negeri 5 Jakarta",
      schoolAddress: "Jl. Pendidikan No. 15, Jakarta Selatan",
      subject: "Informatika & Literasi Digital",
      nip: "198505152010012005",
      position: "Guru Rekanan Informatika",
      joinDate: "2010-01-15",
      bio: "Guru Rekanan Informatika.",
    },
  });

  console.log("✓ Teachers created (Tr. Muhammad Arifin & Ibu Sari Dewi).");

  // 3. User Accounts (Teacher, Admin, Co-teacher)
  await prisma.user.create({
    data: {
      id: "USR-TEACHER-001",
      email: "arifin@smpnegeri5.sch.id",
      password: passwordHash,
      name: "Tr. Muhammad Arifin",
      role: "teacher",
      status: "active",
      teacherId: "T001",
      createdAt: "2025-07-01",
    },
  });

  await prisma.user.create({
    data: {
      id: "USR-TEACHER-002",
      email: "sari.dewi@smpnegeri5.sch.id",
      password: passwordHash,
      name: "Ibu Sari Dewi Kusuma",
      role: "teacher",
      status: "active",
      teacherId: "T002",
      createdAt: "2025-07-01",
    },
  });

  await prisma.user.create({
    data: {
      id: "USR-ADMIN-001",
      email: "admin@lms.com",
      password: passwordHash,
      name: "Administrator LMS",
      role: "admin",
      status: "active",
      teacherId: null,
      createdAt: "2025-07-01",
    },
  });

  console.log("✓ Auth Users registered.");

  // 4. Academic Years & Semesters
  await prisma.academicYear.create({
    data: {
      id: "AY2024",
      name: "2024/2025",
      startDate: "2024-07-15",
      endDate: "2025-06-20",
      isActive: false,
    },
  });

  await prisma.academicYear.create({
    data: {
      id: "AY2025",
      name: "2025/2026",
      startDate: "2025-07-14",
      endDate: "2026-06-20",
      isActive: true,
    },
  });

  await prisma.semester.create({
    data: {
      id: "SEM1-2024",
      academicYearId: "AY2024",
      name: "Semester 1 (Ganjil) 2024/2025",
      number: 1,
      startDate: "2024-07-15",
      endDate: "2024-12-20",
      totalMeetings: 16,
      completedMeetings: 16,
      progress: 100,
      status: "completed",
      learningTargets: 16,
      completedTargets: 16,
    },
  });

  await prisma.semester.create({
    data: {
      id: "SEM2-2024",
      academicYearId: "AY2024",
      name: "Semester 2 (Genap) 2024/2025",
      number: 2,
      startDate: "2025-01-06",
      endDate: "2025-06-20",
      totalMeetings: 16,
      completedMeetings: 16,
      progress: 100,
      status: "completed",
      learningTargets: 16,
      completedTargets: 16,
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
      completedMeetings: 11,
      progress: 68.75,
      status: "active",
      learningTargets: 16,
      completedTargets: 11,
    },
  });

  await prisma.semester.create({
    data: {
      id: "SEM2-2025",
      academicYearId: "AY2025",
      name: "Semester 2 (Genap) 2025/2026",
      number: 2,
      startDate: "2026-01-05",
      endDate: "2026-06-20",
      totalMeetings: 16,
      completedMeetings: 0,
      progress: 0,
      status: "upcoming",
      learningTargets: 16,
      completedTargets: 0,
    },
  });

  console.log("✓ Academic Years and Semesters set.");

  // 5. Classes (14 Real Schedule Classes + CLS-7A for legacy compatibility)
  const classDefs = [
    { id: "CLS-7A", name: "Kelas 7A", grade: 7, section: "A", room: "Lab Komputer 1", schedule: "Senin 07:30 - 09:00" },
    { id: "CLS-G7-P", name: "Kelas G7-P", grade: 7, section: "P", room: "Lab Komputer 1", schedule: "Rabu 13:40 & Jumat 12:55" },
    { id: "CLS-G7-S", name: "Kelas G7-S", grade: 7, section: "S", room: "Lab Komputer 1", schedule: "Selasa 11:05 & Jumat 13:40" },
    { id: "CLS-G8-P", name: "Kelas G8-P", grade: 8, section: "P", room: "Lab Komputer 2", schedule: "Selasa 12:55 & Rabu 12:25" },
    { id: "CLS-G8-S", name: "Kelas G8-S", grade: 8, section: "S", room: "Lab Komputer 2", schedule: "Senin 11:05 & Selasa 12:25" },
    { id: "CLS-G9-P", name: "Kelas G9-P", grade: 9, section: "P", room: "Lab Komputer 3", schedule: "Senin 14:00 & Rabu 10:45" },
    { id: "CLS-G9-S", name: "Kelas G9-S", grade: 9, section: "S", room: "Lab Komputer 3", schedule: "Rabu 10:05 & Kamis 14:00" },
    { id: "CLS-G10-P", name: "Kelas G10-P", grade: 10, section: "P", room: "Lab AI & Coding 1", schedule: "Senin 13:10 & Rabu 14:45" },
    { id: "CLS-G10-S", name: "Kelas G10-S", grade: 10, section: "S", room: "Lab AI & Coding 1", schedule: "Rabu 11:25 & Jumat 10:45" },
    { id: "CLS-G11-P", name: "Kelas G11-P", grade: 11, section: "P", room: "Lab AI & Coding 1", schedule: "Senin & Rabu" },
    { id: "CLS-G11-S", name: "Kelas G11-S", grade: 11, section: "S", room: "Lab AI & Coding 1", schedule: "Selasa 09:30 & Kamis 13:25" },
    { id: "CLS-G11-A", name: "Kelas G11-A", grade: 11, section: "A", room: "Lab AI & Coding 1", schedule: "Kamis 14:50 & Jumat 09:30" },
    { id: "CLS-G12-P", name: "Kelas G12-P", grade: 12, section: "P", room: "Lab AI & Coding 1", schedule: "Senin & Kamis" },
    { id: "CLS-G12-S", name: "Kelas G12-S", grade: 12, section: "S", room: "Lab AI & Coding 1", schedule: "Senin 10:10 & Selasa 10:10" },
    { id: "CLS-G12-A", name: "Kelas G12-A", grade: 12, section: "A", room: "Lab AI & Coding 1", schedule: "Jumat 14:50" },
  ];

  for (const c of classDefs) {
    await prisma.class.create({
      data: {
        id: c.id,
        name: c.name,
        grade: c.grade,
        section: c.section,
        subject: "Coding & AI / Integrated AI",
        studentCount: 20,
        room: c.room,
        schedule: c.schedule,
        attendanceRate: 94.5,
        worksheetCompletion: 87.5,
        averageScore: 86.8,
        semesterProgress: 68.75,
        currentTopic: "Pengantar Artificial Intelligence & Machine Learning",
        nextTopic: "Evaluasi Tengah Semester (PTS / Hands-on Coding Project)",
        semesterId: "SEM1-2025",
        teacherId: "T001",
      },
    });
  }

  console.log(`✓ Created ${classDefs.length} real classes.`);

  // 6. Curriculum Modules (Deploy 16 Sessions to all classes)
  console.log("Deploying 16 Coding & AI curriculum sessions...");
  for (const cls of classDefs) {
    for (const mod of CODING_AI_CURRICULUM) {
      await prisma.learningMaterial.create({
        data: {
          id: `MAT-${cls.id}-${String(mod.order).padStart(2, "0")}`,
          classId: cls.id,
          orderNumber: mod.order,
          topic: mod.topic,
          description: mod.description,
          learningObjective: mod.objective,
          status: mod.order <= 11 ? "active" : "upcoming",
          content: JSON.stringify(["Materi Silabus Resmi Coding & AI", "Latihan Praktikum", "Contoh Kode"]),
          keyPoints: JSON.stringify(mod.keyPoints),
          references: JSON.stringify(["Python 3.11 Documentation", "CS50 Introduction to Computer Science"]),
          fileUrl: `/uploads/materials/${mod.fileName}`,
          fileName: mod.fileName,
          fileSize: mod.fileSize,
          fileType: mod.fileType,
          videoUrl: mod.videoUrl || null,
        },
      });
    }

    // Deploy Worksheets
    for (const ws of CODING_AI_WORKSHEETS) {
      await prisma.worksheet.create({
        data: {
          id: `WS-${cls.id}-${ws.idSuffix}`,
          classId: cls.id,
          title: ws.title,
          topic: ws.topic,
          assignedDate: "2025-08-01",
          dueDate: "2025-09-30",
          difficulty: ws.difficulty,
          completion: 85,
          status: "published",
          totalQuestions: ws.totalQuestions,
          maxScore: ws.maxScore,
          description: ws.description,
          hasCodeEditor: ws.hasCodeEditor,
          codeLanguage: ws.codeLanguage || "python",
          starterCode: ws.starterCode || "",
          solutionCode: ws.starterCode ? "# Solusi Guru\ndef solution():\n    return True\n" : "",
          testCases: JSON.stringify([{ input: "test", expected: "pass" }]),
        },
      });
    }

    // Deploy 16 Meetings
    for (let i = 1; i <= 16; i++) {
      const curMod = CODING_AI_CURRICULUM[i - 1];
      await prisma.meeting.create({
        data: {
          id: `MTG-${cls.id}-SEM1-2025-${String(i).padStart(2, "0")}`,
          classId: cls.id,
          semesterId: "SEM1-2025",
          materialId: `MAT-${cls.id}-${String(i).padStart(2, "0")}`,
          meetingNumber: i,
          week: i,
          date: `2025-08-${String(i * 2).padStart(2, "0")}`,
          subject: "Coding & AI / Integrated AI",
          topic: curMod.topic,
          learningObjective: curMod.objective,
          teacherNotes: `Pertemuan ke-${i} pembahasan ${curMod.topic}.`,
          hasWorksheet: i <= 6,
          hasHomework: i % 2 === 0,
          status: i <= 11 ? "completed" : "planned",
          completion: i <= 11 ? 100 : 0,
          checkInPin: String(100000 + i * 1111).slice(0, 6),
        },
      });
    }
  }

  console.log("✓ Materials, Worksheets, and Meetings registered.");

  // 7. Register 23 Timetable Sessions exactly from Tr. Arifin's Schedule
  let slotIdx = 1;
  for (const s of SCANNED_TIMETABLE_SESSIONS) {
    const classId = `CLS-${s.classCode}`;
    const exists = classDefs.some(c => c.id === classId);
    const targetClassId = exists ? classId : "CLS-7A";

    await prisma.scheduleSlot.create({
      data: {
        id: `SLOT-${String(slotIdx).padStart(3, "0")}`,
        classId: targetClassId,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        materialId: `MAT-${targetClassId}-01`,
      },
    });
    slotIdx++;
  }

  console.log(`✓ 23 Real Timetable Slots recorded for Tr. Arifin.`);

  // 8. Register Real Sample Students
  // Student 1: Ahmad Rizky Pratama
  const studentAhmad = await prisma.student.create({
    data: {
      id: "STD-CLS-7A-01",
      classId: "CLS-7A",
      name: "Ahmad Rizky Pratama",
      nisn: "0081234501",
      gender: "Laki-laki",
      attendance: 95.5,
      worksheetCompletion: 90.0,
      averageScore: 88.5,
      status: "active",
      parentName: "Bpk. Bambang Pratama",
      parentPhone: "+62 812-9988-7711",
      strengths: JSON.stringify(["Logika Algoritma", "Problem Solving", "Python"]),
      weaknesses: JSON.stringify(["Manajemen Waktu"]),
      achievements: JSON.stringify(["Peringkat 1 Kelas Coding", "Penyelesai Modul Tercepat"]),
    },
  });

  // Student 2: Siti Rahmawati
  const studentSiti = await prisma.student.create({
    data: {
      id: "STD-CLS-7A-02",
      classId: "CLS-7A",
      name: "Siti Rahmawati",
      nisn: "0081234502",
      gender: "Perempuan",
      attendance: 98.0,
      worksheetCompletion: 95.0,
      averageScore: 92.0,
      status: "active",
      parentName: "Ibu Nurhayati",
      parentPhone: "+62 813-7766-5544",
      strengths: JSON.stringify(["Desain Algoritma", "Prompt Engineering", "Data Cleaning"]),
      weaknesses: JSON.stringify(["Kecepatan Mengetik Simbol"]),
      achievements: JSON.stringify(["Juara 2 Lomba Web Mini", "Nilai Sempurna Praktikum Python"]),
    },
  });

  // Link to Student Users
  await prisma.user.create({
    data: {
      id: "USR-STD-001",
      name: "Ahmad Rizky Pratama",
      email: "ahmad.rizky@siswa.smpnegeri5.sch.id",
      password: passwordHash,
      role: "student",
      status: "active",
      studentId: studentAhmad.id,
      createdAt: "2025-07-15",
    },
  });

  await prisma.user.create({
    data: {
      id: "USR-STD-002",
      name: "Siti Rahmawati",
      email: "siti.rahmawati@siswa.smpnegeri5.sch.id",
      password: passwordHash,
      role: "student",
      status: "active",
      studentId: studentSiti.id,
      createdAt: "2025-07-15",
    },
  });

  // Additional classmates in CLS-7A
  const classmates = [
    { name: "Muhammad Fajar Nugraha", nisn: "0081234503", gender: "Laki-laki" },
    { name: "Putri Anggraini", nisn: "0081234504", gender: "Perempuan" },
    { name: "Dimas Arya Saputra", nisn: "0081234505", gender: "Laki-laki" },
    { name: "Nadia Safitri", nisn: "0081234506", gender: "Perempuan" },
    { name: "Rizky Ramadhan", nisn: "0081234507", gender: "Laki-laki" },
    { name: "Dewi Lestari", nisn: "0081234508", gender: "Perempuan" },
    { name: "Galih Hendrawan", nisn: "0081234509", gender: "Laki-laki" },
    { name: "Kartika Wulandari", nisn: "0081234510", gender: "Perempuan" },
  ];

  for (let i = 0; i < classmates.length; i++) {
    const cm = classmates[i];
    await prisma.student.create({
      data: {
        id: `STD-CLS-7A-${String(i + 3).padStart(2, "0")}`,
        classId: "CLS-7A",
        name: cm.name,
        nisn: cm.nisn,
        gender: cm.gender,
        attendance: 90 + (i % 8),
        worksheetCompletion: 85 + (i % 12),
        averageScore: 82 + (i % 14),
        status: "active",
        parentName: `Wali ${cm.name.split(" ")[0]}`,
        parentPhone: `+62 812-5555-${1000 + i}`,
      },
    });
  }

  // 9. Register Multi-Year Student Enrollments (AY2025 - Grade 7)
  const allInitialStudents = await prisma.student.findMany({ where: { classId: "CLS-7A" } });
  for (const st of allInitialStudents) {
    await prisma.studentEnrollment.create({
      data: {
        id: `ENR-AY2025-CLS7A-${st.id}`,
        studentId: st.id,
        classId: "CLS-7A",
        academicYearId: "AY2025",
        semesterId: "SEM1-2025",
        grade: 7,
        status: "active",
        enrollmentDate: "2025-07-14",
        finalScore: st.averageScore,
        attendanceRate: st.attendance,
        notes: "Terdaftar aktif di Kelas 7A Tahun Ajaran 2025/2026",
      },
    });
  }
  console.log(`✓ Enrolled ${allInitialStudents.length} students into AY2025 Grade 7 records.`);

  // Populate Attendance records for Ahmad & Siti in CLS-7A
  for (let i = 1; i <= 11; i++) {
    const mtgId = `MTG-CLS-7A-SEM1-2025-${String(i).padStart(2, "0")}`;
    await prisma.attendance.create({
      data: {
        id: `ATT-AHMAD-${i}`,
        meetingId: mtgId,
        studentId: studentAhmad.id,
        classId: "CLS-7A",
        date: `2025-08-${String(i * 2).padStart(2, "0")}`,
        status: "present",
        note: "Hadir tepat waktu di lab",
      },
    });

    await prisma.attendance.create({
      data: {
        id: `ATT-SITI-${i}`,
        meetingId: mtgId,
        studentId: studentSiti.id,
        classId: "CLS-7A",
        date: `2025-08-${String(i * 2).padStart(2, "0")}`,
        status: "present",
        note: "Hadir tepat waktu di lab",
      },
    });
  }

  // Populate Scores for Ahmad & Siti
  const examTypes = [
    { type: "Tugas 1 - Variabel & Aritmatika", score: 92, weight: 15 },
    { type: "Tugas 2 - Percabangan If-Else", score: 88, weight: 15 },
    { type: "Formatif - Logika Perulangan", score: 85, weight: 20 },
    { type: "PTS - Hands-on Project AI", score: 90, weight: 50 },
  ];

  for (let i = 0; i < examTypes.length; i++) {
    const et = examTypes[i];
    await prisma.score.create({
      data: {
        id: `SCR-AHMAD-${i + 1}`,
        studentId: studentAhmad.id,
        classId: "CLS-7A",
        examType: et.type,
        date: `2025-08-${String((i + 1) * 6).padStart(2, "0")}`,
        score: et.score,
        maxScore: 100,
        weight: et.weight,
      },
    });

    await prisma.score.create({
      data: {
        id: `SCR-SITI-${i + 1}`,
        studentId: studentSiti.id,
        classId: "CLS-7A",
        examType: et.type,
        date: `2025-08-${String((i + 1) * 6).padStart(2, "0")}`,
        score: et.score + 3,
        maxScore: 100,
        weight: et.weight,
      },
    });
  }

  // Populate Submissions for Worksheets
  await prisma.submission.create({
    data: {
      id: "SUB-AHMAD-01",
      worksheetId: "WS-CLS-7A-01",
      studentId: studentAhmad.id,
      classId: "CLS-7A",
      status: "graded",
      score: 95,
      submittedDate: "2025-08-10",
      submittedCode: "def hitung_luas_persegi_panjang(panjang, lebar):\n    return panjang * lebar\n\nprint(hitung_luas_persegi_panjang(10, 5))",
      codeOutput: "50",
      feedback: "Implementasi fungsi sangat bersih dan tepat.",
    },
  });

  // Journals
  await prisma.journal.create({
    data: {
      id: "JRN-CLS-7A-01",
      meetingId: "MTG-CLS-7A-SEM1-2025-01",
      classId: "CLS-7A",
      date: "2025-08-02",
      topic: "Pengenalan Komputasi & Pemrograman Dasar Python",
      summary: "Siswa sangat antusias saat pertama kali menulis kode Python dan menjalankan skrip di terminal lab.",
      wentWell: "Semua siswa berhasil menginstal environment dan mencetak output Hello World.",
      problems: "Beberapa siswa sempat salah ketik tanda kutip dan tanda kurung pada fungsi print.",
      studentsNeedAttention: JSON.stringify(["Dimas Arya Saputra"]),
      ideasForNext: "Berikan lembar pintasan (cheat sheet) sintaks dasar Python di meja komputer.",
      mood: "good",
    },
  });

  // Activities & Calendar Events
  await prisma.activity.create({
    data: {
      id: "ACT-01",
      type: "materials",
      message: "Tr. Muhammad Arifin menerbitkan 16 silabus modul kurikulum Coding & AI.",
      time: "Baru saja",
      icon: "FileText",
      date: "2025-08-01",
    },
  });

  await prisma.activity.create({
    data: {
      id: "ACT-02",
      type: "schedule",
      message: "23 sesi jadwal mengajar mingguan Tr. Arifin disinkronkan ke seluruh lab.",
      time: "10 menit lalu",
      icon: "Calendar",
      date: "2025-08-01",
    },
  });

  await prisma.activity.create({
    data: {
      id: "ACT-03",
      type: "attendance",
      message: "Presensi sesi Kelas 7A tercatat 100% hadir pada pertemuan modul Python.",
      time: "1 jam lalu",
      icon: "CheckCircle",
      date: "2025-08-02",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      id: "EVT-01",
      title: "Hands-on Workshop Python & AI",
      date: "2025-09-15",
      type: "workshop",
      classId: "CLS-7A",
      color: "#6366f1",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      id: "EVT-02",
      title: "Penilaian Tengah Semester (PTS)",
      date: "2025-10-05",
      type: "exam",
      classId: "CLS-7A",
      color: "#f59e0b",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      id: "EVT-03",
      title: "Live Code Review & Debugging Session",
      date: "2025-10-20",
      type: "assignment",
      classId: "CLS-G10-P",
      color: "#10b981",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      id: "EVT-04",
      title: "Deadline Proyek Chatbot AI",
      date: "2025-11-15",
      type: "deadline",
      classId: "CLS-G11-S",
      color: "#ef4444",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      id: "EVT-05",
      title: "Penilaian Akhir Semester (PAS) Coding & AI",
      date: "2025-12-08",
      type: "exam",
      classId: "CLS-7A",
      color: "#8b5cf6",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      id: "EVT-06",
      title: "Showcase & Gelar Karya AI Siswa",
      date: "2025-12-15",
      type: "event",
      classId: "CLS-G12-S",
      color: "#06b6d4",
    },
  });

  console.log("=========================================");
  console.log("✓ LMS DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
