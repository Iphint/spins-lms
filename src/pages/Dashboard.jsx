import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ClipboardList, FileSpreadsheet, HelpCircle, Trophy, Flame,
  CheckCircle2, Target, TrendingUp, Calendar, ChevronRight, Play, Clock, Bell,
  Sparkles, User, MapPin, School, ArrowRight, Lock, Unlock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import StatusBadge from '../components/ui/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { student: authStudent, user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const [dash, classes] = await Promise.all([
          api.get('/api/student-portal/dashboard').catch(() => null),
          api.get('/api/student-portal/classes').catch(() => []),
        ]);
        if (isMounted) {
          setDashboardData(dash);
          setEnrolledClasses(Array.isArray(classes) ? classes : []);
        }
      } catch (err) {
        console.warn('Could not load student dashboard from API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  const activeStudentName = dashboardData?.student?.name || authStudent?.name || user?.name || 'Student';
  const activeClassName = dashboardData?.student?.class?.name || authStudent?.class?.name || 'Enrolled Class';
  const assignedSubjectName = dashboardData?.assignedSubject?.name || dashboardData?.student?.class?.subject || 'Computer Science & AI';
  const teacher = dashboardData?.assignedSubject?.teacher || dashboardData?.student?.class?.teacher || {
    name: 'Muhammad Arifin',
    school: 'SPINS',
    email: 'arifin@spins.sch.id',
  };
  const schoolName = teacher.school || 'SPINS';

  const stats = dashboardData?.student?.stats;
  const weeklyProgress = 14;
  const weeklyGoal = 20;

  const todaySchedule = dashboardData?.todaySchedule || [];
  const scheduleSlots = dashboardData?.scheduleSlots || [];
  const recentWorksheets = dashboardData?.recentWorksheets || [];
  const recentMaterials = dashboardData?.recentMaterials || [];

  const statCards = [
    { icon: BookOpen, label: "Total Modules", value: recentMaterials.length, sub: activeClassName, color: "indigo" },
    { icon: FileSpreadsheet, label: "Worksheets Completed", value: stats?.completedWorksheets ?? 0, sub: `of ${stats?.totalWorksheets ?? 0} total`, color: "emerald" },
    { icon: ClipboardList, label: "Assignments Submitted", value: stats?.submittedWorksheets ?? 0, sub: "pending grading", color: "amber" },
    { icon: HelpCircle, label: "Pending Tasks", value: stats?.pendingWorksheets ?? 0, sub: "action needed", color: "sky" },
    { icon: Target, label: "Average Score", value: `${stats?.averageScore ?? 0}%`, sub: stats?.averageScore ? (stats.averageScore >= 80 ? "Excellent" : "Good") : "No Grades Yet", color: "purple" },
    { icon: CheckCircle2, label: "Attendance", value: `${stats?.attendance ?? 100}%`, sub: "Active presence", color: "emerald" },
    { icon: Flame, label: "Learning Streak", value: `${stats?.learningStreak ?? 1} days`, sub: "Keep it up! 🔥", color: "orange" },
  ];

  const dayMap = {
    Senin: "Mon",
    Selasa: "Tue",
    Rabu: "Wed",
    Kamis: "Thu",
    Jumat: "Fri",
    Sabtu: "Sat",
    Minggu: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  const weeklyActivity = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((shortDay) => {
    const slots = (dashboardData?.scheduleSlots || []).filter((s) => {
      const mapped = dayMap[s.day] || s.day?.slice(0, 3);
      return mapped === shortDay;
    });

    let totalHours = 0;
    slots.forEach((s) => {
      if (s.startTime && s.endTime) {
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = s.endTime.split(":").map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          const diffMinutes = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
          if (diffMinutes > 0) {
            totalHours += Math.round((diffMinutes / 60) * 10) / 10;
          }
        }
      }
    });

    return {
      day: shortDay,
      hours: totalHours,
    };
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome Banner */}
      <motion.div variants={item} className="rounded-2xl p-5 sm:p-7 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs sm:text-sm font-semibold">
            <School className="w-4 h-4" /> {schoolName} • Student Learning Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Welcome Back, {activeStudentName} 👋</h1>
          <p className="text-indigo-100 mt-2 text-sm sm:text-base max-w-2xl">
            You are enrolled in <span className="font-bold text-white">{activeClassName}</span> for <span className="font-bold text-white">{assignedSubjectName}</span> guided by Teacher <span className="font-bold text-white">{teacher.name}</span>.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => navigate('/classes')} className="px-4 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition flex items-center gap-2 shadow-sm">
              <Play className="w-4 h-4" /> Go to Class
            </button>
            <button onClick={() => navigate('/materials')} className="px-4 py-2.5 bg-white/15 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> View Materials ({recentMaterials.length})
            </button>
          </div>
        </div>
      </motion.div>

      {/* Assigned Subject & Schedule Highlight Bar */}
      <motion.div variants={item} className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
            💻
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">ACTIVE SUBJECT</span>
              <span className="text-xs font-semibold text-indigo-400">{activeClassName}</span>
            </div>
            <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {assignedSubjectName}
            </h3>
            <p className="text-xs flex items-center gap-2 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              <span><User className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />{teacher.name}</span>
              <span>•</span>
              <span><Clock className="w-3.5 h-3.5 inline mr-1 text-purple-500" />{dashboardData?.student?.class?.schedule || 'Enrolled Schedule'}</span>
              {dashboardData?.student?.class?.room && (
                <>
                  <span>•</span>
                  <span><MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />Room {dashboardData.student.class.room}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/classes')}
          className="self-start md:self-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-sm"
        >
          Syllabus Details <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {statCards.map((s, i) => <StatCard key={i} {...s} index={i} />)}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Schedule Card */}
        <motion.div variants={item} className="lg:col-span-1 rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-base" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-4 h-4 text-indigo-500" /> Class Schedule Sessions
            </h3>
            <button onClick={() => navigate('/calendar')} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
              Calendar
            </button>
          </div>

          {todaySchedule.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sessions Scheduled Today
              </div>
              {todaySchedule.map((s, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.time}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold">Room {s.room}</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.subject}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Teacher: {s.teacherName}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-700/40 bg-slate-800/20 space-y-2">
                <p className="text-xs font-semibold text-amber-500">No class sessions scheduled today</p>
                <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {assignedSubjectName}
                  </p>
                  <p>
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />
                    {dashboardData?.student?.class?.schedule || 'Weekly Schedule'}
                  </p>
                  {dashboardData?.student?.class?.room && (
                    <p>
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                      Room {dashboardData.student.class.room}
                    </p>
                  )}
                  <p>
                    <User className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                    {teacher.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="w-full py-2 rounded-xl text-xs font-semibold border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition"
              >
                View Full Calendar Schedule
              </button>
            </div>
          )}
        </motion.div>

        {/* Upcoming Worksheets / Lembar Kerja */}
        <motion.div variants={item} className="lg:col-span-1 rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-base" style={{ color: 'var(--text-primary)' }}>
              <ClipboardList className="w-4 h-4 text-amber-500" /> Worksheets & Tasks
            </h3>
            <button onClick={() => navigate('/worksheets')} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentWorksheets.length > 0 ? (
              recentWorksheets.map(w => (
                <div key={w.id} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{w.title}</p>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock className="w-3 h-3" />
                    <span>Due: {w.dueDate}</span>
                    <span>•</span>
                    <span>{assignedSubjectName}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-40" />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>No active tasks</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Assignments given by Teacher {teacher.name} will appear here.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enrolled Subject Progress */}
        <motion.div variants={item} className="lg:col-span-1 rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-base" style={{ color: 'var(--text-primary)' }}>
              <BookOpen className="w-4 h-4 text-emerald-500" /> Course Progress
            </h3>
            <button onClick={() => navigate('/classes')} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
              Classes
            </button>
          </div>

          <div className="space-y-4">
            {enrolledClasses.length > 0 ? (
              enrolledClasses.map(cls => (
                <div key={cls.id} className="p-3.5 rounded-xl border border-indigo-500/10 space-y-2.5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-500">{cls.name}</span>
                      <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{cls.subject}</h4>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-400">{cls.semesterProgress || 0}%</span>
                  </div>
                  <ProgressBar value={cls.semesterProgress || 0} color="indigo" showLabel={false} size="sm" />
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{cls.totalLessons} Lesson Modules</span>
                    <span>Teacher: {teacher.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl border border-indigo-500/10 space-y-2.5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-500">{activeClassName}</span>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{assignedSubjectName}</h4>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-400">0%</span>
                </div>
                <ProgressBar value={0} color="indigo" showLabel={false} size="sm" />
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{recentMaterials.length} Lesson Modules</span>
                  <span>Teacher: {teacher.name}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Weekly Activity Chart & Module Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-base" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Weekly Learning Hours
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: '1px solid ' + (isDark ? '#334155' : '#e2e8f0'), borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Silabus Modul Pembelajaran */}
        <motion.div variants={item} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-base" style={{ color: 'var(--text-primary)' }}>
              <BookOpen className="w-4 h-4 text-indigo-500" /> Syllabus Modules ({assignedSubjectName})
            </h3>
            <button onClick={() => navigate('/materials')} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {recentMaterials.length > 0 ? (
              recentMaterials.slice(0, 5).map((m, idx) => (
                <div
                  key={m.id || idx}
                  onClick={() => navigate('/materials')}
                  className="p-3 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:opacity-90 transition"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {m.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400">Sem {m.semesterNumber || 1}</span>
                    {m.isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Unlock className="w-2.5 h-2.5" /> Open
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
                Syllabus modules are currently being prepared by Teacher {teacher.name}.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
