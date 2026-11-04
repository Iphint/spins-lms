import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Users, BookOpen, ClipboardCheck, FileText, BarChart3,
  ArrowRight, Plus, Calendar, Clock, AlertTriangle, TrendingUp,
  CheckCircle2, Activity, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { api } from '../utils/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function getDayName(date) {
  return DAY_NAMES[date.getDay()];
}

function getIndoDayName(date) {
  return INDO_DAYS[date.getDay()];
}

function toISO(d) {
  return d.toISOString().split('T')[0];
}

function slotStatus(startTime, endTime) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (cur > e) return 'completed';
  if (cur >= s && cur <= e) return 'active';
  return 'upcoming';
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [semester, setSemester] = useState(null);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [t, c, s, m, sem, slots, evts, acts, trend] = await Promise.all([
          api.teacher(),
          api.classes(),
          api.students(),
          api.meetings(),
          api.semesterActive(),
          api.scheduleSlots(),
          api.calendarEvents(),
          api.activitiesRecent(),
          api.analytics.attendanceTrend(),
        ]);
        setTeacher(t);
        setClasses(c);
        setStudents(s);
        setMeetings(m);
        setSemester(sem);
        setScheduleSlots(slots);
        setCalendarEvents(evts);
        setActivities(acts);
        setAttendanceTrend(trend);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const needsAttention = students.filter(s => s.status === 'needs-attention' || s.status === 'remedial').slice(0, 5);
  const teacherName = teacher ? teacher.name.split(' ').slice(0, 2).join(' ') : '';

  const totalStudents = students.length;
  const totalClasses = classes.length;
  const semesterLabel = semester ? (semester.number === 1 ? 'Semester 1 (Odd)' : 'Semester 2 (Even)') : '—';
  const meetingsDone = semester ? semester.completedMeetings : 0;
  const meetingsTotal = semester ? semester.totalMeetings : 0;
  const worksheetRate = classes.length ? Math.round(classes.reduce((sum, c) => sum + c.worksheetCompletion, 0) / classes.length) : 0;
  const attendanceRate = classes.length ? Math.round(classes.reduce((sum, c) => sum + c.attendanceRate, 0) / classes.length) : 0;
  const semesterProgress = semester ? Math.round(semester.progress) : 0;

  const todayName = getDayName(new Date());
  const todayIndoName = getIndoDayName(new Date());
  const todaySlots = scheduleSlots
    .filter(s => s.day === todayName || s.day === todayIndoName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map(slot => {
      const cls = classes.find(c => c.id === slot.classId);
      return {
        id: slot.id,
        time: slot.startTime,
        endTime: slot.endTime,
        class: cls ? cls.name : slot.classId,
        room: slot.room || '—',
        topic: slot.material?.topic || '',
        status: slotStatus(slot.startTime, slot.endTime),
      };
    });

  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const weekCalendar = weekLabels.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const iso = toISO(date);
    return {
      day,
      events: calendarEvents
        .filter(e => e.date === iso)
        .map(e => ({ title: e.title, time: e.type })),
    };
  });

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Loading your dashboard..." />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-96" />
          <div className="h-28 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          <div className="h-40 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        </div>
      </div>
    );
  }

  const chartKeys = attendanceTrend.length ? Object.keys(attendanceTrend[0]).filter(k => k !== 'week') : [];

  return (
    <div>
      <PageHeader title="Dashboard" description={teacherName ? `Welcome back, ${teacherName}!` : 'Welcome back!'}>
        <Link to="/schedule" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" />
          Quick Add
        </Link>
      </PageHeader>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Onboarding Banner when Database has 0 Students */}
      {totalStudents === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Database Ready: Add Student Data
                <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-medium">Bulk Add Active</span>
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5 max-w-xl">
                Use Bulk Add to quickly register students based on name and class with starting scores & attendance.
              </p>
            </div>
          </div>
          <Link
            to="/students"
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow-sm transition-all whitespace-nowrap flex items-center gap-2 shrink-0"
          >
            <Users className="w-4 h-4 text-emerald-600" />
            Add Students Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={GraduationCap} label="Total Classes" value={totalClasses} delay={0} />
        <StatCard icon={Users} label="Total Students" value={totalStudents} delay={0.05} />
        <StatCard icon={BookOpen} label="Active Semester" value={semesterLabel} delay={0.1} />
        <StatCard icon={CheckCircle2} label="Meetings Done" value={meetingsDone} change={`${semesterProgress}%`} delay={0.15} />
        <StatCard icon={FileText} label="Worksheet Done" value={`${worksheetRate}%`} delay={0.2} />
        <StatCard icon={ClipboardCheck} label="Attendance Rate" value={`${attendanceRate}%`} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Today's Schedule — {todayName}
              </h2>
              <Link to="/schedule" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {todaySlots.length === 0 ? (
                <p className="text-sm text-zinc-400 py-6 text-center">No classes scheduled today.</p>
              ) : (
                todaySlots.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <div className="text-sm font-mono font-semibold text-zinc-500 dark:text-zinc-400 w-14">{item.time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-white text-sm">{item.class}</span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.room}</span>
                      </div>
                      {item.topic && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.topic}</p>}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Attendance Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Attendance Trend
              </h2>
              <Link to="/analytics" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-48">
              {attendanceTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">No attendance data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrend}>
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(24,24,27,0.9)', border: 'none', borderRadius: 8, color: '#fff' }} />
                    {chartKeys.map((key, i) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        fill={i === 0 ? 'url(#colorAtt)' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Weekly Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" />
                Weekly Calendar
              </h2>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {weekCalendar.map((day, i) => (
                <div key={i} className="text-center">
                  <div className={`text-xs font-semibold mb-2 ${i === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>{day.day}</div>
                  <div className="space-y-1">
                    {day.events.map((ev, j) => (
                      <div key={j} className="text-[10px] p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 leading-tight">
                        <div className="font-medium">{ev.title}</div>
                        <div className="text-indigo-500 capitalize">{ev.time}</div>
                      </div>
                    ))}
                    {day.events.length === 0 && (
                      <div className="text-[10px] p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-400">Empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Semester Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Semester Progress
            </h2>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{semesterProgress}%</div>
              <p className="text-sm text-zinc-500 mt-1">{meetingsDone} / {meetingsTotal} meetings completed</p>
            </div>
            <ProgressBar value={semesterProgress} color="indigo" size="lg" />
            <div className="mt-4 space-y-2">
              {classes.slice(0, 4).map(cls => (
                <div key={cls.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{cls.name}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{Math.round(cls.semesterProgress)}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Students Need Attention */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Needs Attention
            </h2>
            <div className="space-y-3">
              {needsAttention.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">All students are performing well.</p>
              ) : (
                needsAttention.map(student => (
                  <Link key={student.id} to={`/students/${student.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">
                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{student.name}</p>
                      <p className="text-xs text-zinc-500">{student.classId} · Score: {student.averageScore}%</p>
                    </div>
                    <StatusBadge status={student.status} />
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No activities recorded yet.</p>
              ) : (
                activities.slice(0, 6).map(act => (
                  <div key={act.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{act.message}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ClipboardCheck, label: 'Attendance', path: '/attendance', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { icon: FileText, label: 'Worksheet', path: '/worksheets', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                { icon: BarChart3, label: 'Analytics', path: '/analytics', color: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' },
                { icon: BookOpen, label: 'Journal', path: '/journal', color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
              ].map(action => (
                <Link key={action.path} to={action.path} className={`flex flex-col items-center gap-2 p-3 rounded-lg ${action.color} hover:opacity-80 transition-opacity`}>
                  <action.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}