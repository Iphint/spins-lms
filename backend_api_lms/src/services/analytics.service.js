/**
 * Analytics Service
 */

const prisma = require("../config/database");
const cache = require("../utils/cache");

async function getAttendanceTrend() {
  return cache.remember("analytics:attendance-trend", 300, async () => {
    const meetings = await prisma.meeting.findMany({
      where: { status: "completed" },
      orderBy: { date: "asc" },
    });

  const classes = await prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  const weekGroups = {};
  for (const m of meetings) {
    const d = new Date(m.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const key = weekStart.toISOString().split("T")[0];
    if (!weekGroups[key]) weekGroups[key] = [];
    weekGroups[key].push(m);
  }

  const weeks = Object.keys(weekGroups).sort().slice(0, 11);
  const trend = [];

  for (let idx = 0; idx < weeks.length; idx++) {
    const weekKey = weeks[idx];
    const weekMeetings = weekGroups[weekKey];
    const row = { week: `Wk ${idx + 1}` };

    for (const cls of classes) {
      const clsMeetings = weekMeetings.filter(m => m.classId === cls.id);
      if (clsMeetings.length === 0) {
        row[cls.name] = 0;
        continue;
      }

      let totalRate = 0;
      let count = 0;
      for (const m of clsMeetings) {
        const attRecords = await prisma.attendance.findMany({ where: { meetingId: m.id } });
        if (attRecords.length > 0) {
          const rate = Math.round(
            (attRecords.filter(r => r.status === "present" || r.status === "late").length /
              attRecords.length) * 100
          );
          totalRate += rate;
          count++;
        }
      }
      row[cls.name] = count > 0 ? Math.round(totalRate / count) : 0;
    }
    trend.push(row);
  }

  return trend;
  });
}

async function getWorksheetTrend() {
  return cache.remember("analytics:worksheet-trend", 300, async () => {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    });

    const worksheets = await prisma.worksheet.findMany({
      where: { status: "completed" },
      orderBy: { assignedDate: "asc" },
    });

    const grouped = {};
    for (const ws of worksheets) {
      const key = ws.title;
      if (!grouped[key]) grouped[key] = {};
      const submissions = await prisma.submission.findMany({
        where: { worksheetId: ws.id, status: { not: "pending" } },
      });
      const completed = submissions.filter(s => s.status === "completed" || s.status === "late");
      const cls = classes.find(c => c.id === ws.classId);
      if (cls) {
        grouped[key][cls.name] =
          submissions.length > 0 ? Math.round((completed.length / submissions.length) * 100) : 0;
      }
    }

    const trend = Object.entries(grouped).map(([name, data]) => ({
      name: name.replace("LK ", "LK "),
      ...data,
    }));

    return trend.slice(0, 5);
  });
}

async function getAverageScoreTrend() {
  return cache.remember("analytics:average-score-trend", 300, async () => {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    });

    const examOrder = ["Ulangan Harian 1", "Ulangan Harian 2", "Ulangan Harian 3", "UTS"];
    const trend = [];

    for (const exam of examOrder) {
      const row = { exam: exam.replace("Ulangan Harian", "UH") };
      for (const cls of classes) {
        const scores = await prisma.score.findMany({
          where: { classId: cls.id, examType: exam },
        });
        row[cls.name] =
          scores.length > 0
            ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
            : 0;
      }
      trend.push(row);
    }

    return trend;
  });
}

async function getClassComparison() {
  return cache.remember("analytics:class-comparison", 300, async () => {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    });

    return classes.map(c => ({
      name: c.name,
      attendance: c.attendanceRate,
      worksheet: c.worksheetCompletion,
      score: c.averageScore,
    }));
  });
}

async function getSemesterProgress() {
  return cache.remember("analytics:semester-progress", 300, async () => {
    const activeSemester = await prisma.semester.findFirst({
      where: { status: "active" },
      include: { academicYear: true },
    });

    const meetings = await prisma.meeting.findMany({
      where: activeSemester ? { semesterId: activeSemester.id } : {},
      orderBy: { date: "asc" },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthGroups = {};

    meetings.forEach((m) => {
      if (!m.date) return;
      const d = new Date(m.date);
      if (isNaN(d.getTime())) return;
      const mIdx = d.getMonth();
      const monthKey = monthNames[mIdx];
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = { target: 0, actual: 0 };
      }
      monthGroups[monthKey].target += 1;
      if (m.status === "completed") {
        monthGroups[monthKey].actual += 1;
      }
    });

    let cumulativeTarget = 0;
    let cumulativeActual = 0;
    const progressTrend = Object.keys(monthGroups).map((name) => {
      cumulativeTarget += monthGroups[name].target;
      cumulativeActual += monthGroups[name].actual;
      return {
        name,
        target: cumulativeTarget,
        actual: cumulativeActual,
      };
    });

    if (progressTrend.length > 0) {
      return progressTrend;
    }

    // Default empty representation if no meetings registered yet
    return [];
  });
}

async function getLearningTargets() {
  return cache.remember("analytics:learning-targets", 300, async () => {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    });
    const semester = await prisma.semester.findFirst({ where: { status: "active" } });

    return classes.map(c => ({
      name: c.name,
      total: semester ? semester.learningTargets : 12,
      completed: semester ? Math.round((c.semesterProgress / 100) * semester.learningTargets) : 0,
    }));
  });
}

module.exports = {
  getAttendanceTrend,
  getWorksheetTrend,
  getAverageScoreTrend,
  getClassComparison,
  getSemesterProgress,
  getLearningTargets,
};
