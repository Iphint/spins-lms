import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Calendar, BookOpen, ClipboardList, FileSpreadsheet,
  HelpCircle, Bell, BarChart3, CheckCircle, Lock, Play, Clock, ChevronRight,
  MapPin, School, Sparkles, FileText
} from 'lucide-react';
import ProgressBar from '../components/ui/ProgressBar';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../utils/api';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'lessons', label: 'Syllabus & Materials', icon: BookOpen },
  { id: 'worksheets', label: 'Worksheets', icon: FileSpreadsheet },
  { id: 'schedule', label: 'Class Schedule', icon: Calendar },
];

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [classData, setClassData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [cls, mats, wks, sched] = await Promise.all([
          api.get(`/api/student-portal/classes/${id}`).catch(async () => {
            const list = await api.get('/api/student-portal/classes');
            return list.find(c => c.id === id) || null;
          }),
          api.get('/api/student-portal/materials').catch(() => []),
          api.get('/api/student-portal/worksheets').catch(() => []),
          api.get('/api/student-portal/schedule').catch(() => null),
        ]);

        if (isMounted) {
          if (!cls) {
            setError('Class not found or you are not enrolled');
          } else {
            setClassData(cls);
            setMaterials(Array.isArray(mats) ? mats : []);
            setWorksheets(Array.isArray(wks) ? wks : []);
            setSchedule(sched);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load class details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading class details...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold">{error || 'Class not found'}</p>
        <button
          onClick={() => navigate('/classes')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          Back to Classes
        </button>
      </div>
    );
  }

  const teacher = classData.teacher || { name: 'Subject Teacher', school: 'School LMS' };
  const scheduleSlots = classData.scheduleSlots || [];

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => navigate('/classes')}
        className="flex items-center gap-2 text-sm mb-4 hover:text-indigo-500 transition"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 sm:p-7 text-white mb-6 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              {classData.name} • Grade {classData.grade}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-900/60 font-semibold">
              {classData.semester}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{classData.subject}</h1>
          <p className="text-white/80 text-sm mt-1 max-w-2xl">
            Official learning course for {classData.subject} guided by Teacher {teacher.name}.
          </p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/90">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4 text-indigo-300" /> {teacher.name} ({teacher.school || 'SPINS'})
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-300" /> {classData.schedule || 'Enrolled Schedule'}
            </span>
            {classData.room && (
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-300" /> Room {classData.room}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Class Information & Performance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Semester Progress', value: `${classData.semesterProgress || 0}%` },
                    { label: 'Attendance Rate', value: `${classData.attendanceRate || 100}%` },
                    { label: 'Total Modules', value: materials.length },
                    { label: 'Worksheets', value: worksheets.length },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <ProgressBar value={classData.semesterProgress || 0} color="indigo" />
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Current Topic of Study</h3>
                <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <Play className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-indigo-500">Scheduled Topic</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {classData.currentTopic || 'Programming Fundamentals & Computational Logic'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-5">
              <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <User className="w-4 h-4 text-indigo-500" /> Course Instructor
                </h3>
                <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{teacher.name}</p>
                  <p className="text-xs text-indigo-500 font-medium">{teacher.email || 'arifin@spins.sch.id'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{teacher.school || 'SPINS'} • Computer Science Teacher</p>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="w-4 h-4 text-purple-500" /> Class Schedule
                </h3>
                <div className="space-y-2">
                  {scheduleSlots.length > 0 ? (
                    scheduleSlots.map((slot, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl text-xs flex justify-between items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{slot.day}</span>
                        <span className="text-indigo-500 font-bold">{slot.startTime} - {slot.endTime}</span>
                        <span className="text-slate-400">({slot.room})</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{classData.schedule}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="p-8 text-center rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-indigo-400 opacity-40" />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No Modules Available Yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Syllabus materials for {classData.name} will be uploaded by {teacher.name}.
                </p>
              </div>
            ) : (
              materials.map((m, i) => (
                <div
                  key={m.id || i}
                  className="rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-md"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold shrink-0">
                    #{m.orderNumber || i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">
                        Semester {m.semesterNumber || 1}
                      </span>
                      {m.isLocked ? (
                        <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Waiting for Teacher to Unlock
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Open
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {m.topic}
                    </p>
                    {m.description && (
                      <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {m.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/materials')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ${
                      m.isLocked
                        ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {m.isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </>
                    ) : (
                      <>
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'worksheets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worksheets.length === 0 ? (
              <div className="col-span-2 p-8 text-center rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-indigo-400 opacity-40" />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No Worksheets Available</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Assignments and hands-on worksheets for this class will appear here.
                </p>
              </div>
            ) : (
              worksheets.map((ws) => (
                <div key={ws.id} className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ws.title}</h4>
                    <StatusBadge status={ws.status} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ws.topic} • {ws.difficulty}</p>
                  <p className="text-xs text-indigo-500">Due: {ws.dueDate}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Weekly Class Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scheduleSlots.map((slot, i) => (
                <div key={i} className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{slot.day}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-600 text-white font-semibold">Class Session</span>
                  </div>
                  <p className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {slot.startTime} - {slot.endTime}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Room: <span className="font-semibold">{slot.room}</span> • Teacher: <span className="font-semibold">{teacher.name}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
