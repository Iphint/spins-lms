import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Users, ClipboardCheck, FileText, BarChart3, Eye } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import PageHeader from '../components/PageHeader';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import { api } from '../utils/api';
import StudentDetail from './StudentDetail';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'meetings', label: 'Meetings', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'worksheets', label: 'Worksheets', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function ClassDetail({ cls, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [s, m, w] = await Promise.all([
          api.students(cls.id),
          api.meetings({ classId: cls.id }),
          api.worksheets({ classId: cls.id }),
        ]);
        setStudents(s);
        setMeetings(m);
        setWorksheets(w);
      } catch (err) {
        console.error('Failed to load class data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cls.id]);

  if (selectedStudent) {
    return <StudentDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  const scoreData = [
    { name: 'UH 1', score: cls.averageScore - 3 },
    { name: 'UH 2', score: cls.averageScore - 1 },
    { name: 'UH 3', score: cls.averageScore + 2 },
    { name: 'UTS', score: cls.averageScore + 1 },
  ];

  const completedMeetings = meetings.filter(m => m.status === 'completed').length;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </button>

      <PageHeader
        title={cls.name}
        description={`${cls.subject}${cls.room ? ` · ${cls.room}` : ''}${cls.semester?.name ? ` · ${cls.semester.name}` : ''} · ${cls.schedule}`}
      />

      <div className="flex items-center gap-1 mb-6 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading && activeTab !== 'overview' ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-48 mb-2" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-semibold text-zinc-500 mb-3">Current & Next Topic</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                    <p className="text-xs text-indigo-500 mb-1">Current</p>
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{cls.currentTopic || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-xs text-zinc-400 mb-1">Next</p>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cls.nextTopic || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-semibold text-zinc-500 mb-3">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-zinc-500">Average Score</span><span className="font-semibold text-zinc-900 dark:text-white">{cls.averageScore}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-zinc-500">Attendance</span><span className="font-semibold text-emerald-600">{cls.attendanceRate}%</span></div>
                  <div className="flex justify-between"><span className="text-sm text-zinc-500">Worksheet</span><span className="font-semibold text-amber-600">{cls.worksheetCompletion}%</span></div>
                  <div className="flex justify-between"><span className="text-sm text-zinc-500">Students</span><span className="font-semibold text-zinc-900 dark:text-white">{cls.studentCount}</span></div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-semibold text-zinc-500 mb-3">Semester Progress</h3>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{cls.semesterProgress}%</div>
                  <p className="text-sm text-zinc-500 mt-2">{completedMeetings} of {meetings.length} meetings completed</p>
                </div>
                <ProgressBar value={cls.semesterProgress} color="indigo" size="lg" />
              </div>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="space-y-2">
              {meetings.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">No meetings found</div>
              ) : (
                meetings.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="w-10 text-center font-bold text-sm text-zinc-400">#{m.meetingNumber}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{m.topic}</p>
                      <p className="text-xs text-zinc-500">{m.date} · Week {m.week}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Student</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Gender</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Attendance</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Worksheet</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Avg Score</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-zinc-400">No students in this class</td></tr>
                    ) : (
                      students.map((student, i) => (
                        <tr key={student.id} onClick={() => setSelectedStudent(student)} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-sm font-medium text-zinc-900 dark:text-white">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{student.gender}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: student.attendance >= 90 ? '#10b981' : student.attendance >= 80 ? '#f59e0b' : '#ef4444' }}>{student.attendance}%</td>
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{student.worksheetCompletion}%</td>
                          <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{student.averageScore}</td>
                          <td className="px-4 py-3"><StatusBadge status={student.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{cls.attendanceRate}%</div>
                  <p className="text-xs text-zinc-500 mt-1">Rate</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(cls.studentCount * cls.attendanceRate / 100)}</div>
                  <p className="text-xs text-zinc-500 mt-1">Avg Present</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <div className="text-2xl font-bold text-rose-600">{cls.studentCount - Math.round(cls.studentCount * cls.attendanceRate / 100)}</div>
                  <p className="text-xs text-zinc-500 mt-1">Avg Absent</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{completedMeetings}</div>
                  <p className="text-xs text-zinc-500 mt-1">Meetings</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500">Student</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500">Attendance %</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-zinc-400">No students in this class</td></tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white">{s.name}</td>
                          <td className="px-4 py-3 text-center"><ProgressBar value={s.attendance} color={s.attendance >= 90 ? 'emerald' : s.attendance >= 80 ? 'amber' : 'rose'} size="sm" /></td>
                          <td className="px-4 py-3 text-center">{s.attendance < 75 ? <StatusBadge status="needs-attention" /> : <StatusBadge status="active" />}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'worksheets' && (
            <div className="space-y-3">
              {worksheets.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">No worksheets found</div>
              ) : (
                worksheets.map((ws, i) => (
                  <motion.div key={ws.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{ws.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">Due: {ws.dueDate} · {ws.difficulty}</p>
                    </div>
                    <div className="w-32"><ProgressBar value={ws.completion} color={ws.completion >= 85 ? 'emerald' : 'amber'} size="sm" /></div>
                    <StatusBadge status={ws.status} />
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Score Trend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(24,24,27,0.9)', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Score Distribution</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { range: '< 60', count: students.filter(s => s.averageScore < 60).length },
                      { range: '60-69', count: students.filter(s => s.averageScore >= 60 && s.averageScore < 70).length },
                      { range: '70-79', count: students.filter(s => s.averageScore >= 70 && s.averageScore < 80).length },
                      { range: '80-89', count: students.filter(s => s.averageScore >= 80 && s.averageScore < 90).length },
                      { range: '90+', count: students.filter(s => s.averageScore >= 90).length },
                    ]}>
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(24,24,27,0.9)', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
