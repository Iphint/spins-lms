import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  Star,
  AlertTriangle,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle2,
  History,
  Plus,
  Trash2,
  X,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { api } from '../utils/api';

export default function StudentDetail({ student: initialStudent, onBack }) {
  const [student, setStudent] = useState(initialStudent);
  const [scores, setScores] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Score management state
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    examType: 'Ulangan Harian 1',
    score: '',
    maxScore: 100,
    date: new Date().toISOString().split('T')[0],
  });
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [scoreSuccess, setScoreSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, sub, att, hist] = await Promise.all([
          api.scores({ studentId: initialStudent.id }),
          api.submissions({ studentId: initialStudent.id }),
          api.attendance({ studentId: initialStudent.id }),
          api.studentHistory(initialStudent.id).catch(() => null),
        ]);
        setScores(s || []);
        setSubmissions(sub || []);
        setAttendance(att || []);
        setHistoryData(hist);
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialStudent.id]);

  const handleSaveScore = async (e) => {
    e.preventDefault();
    setScoreError('');
    if (!scoreForm.examType.trim()) {
      setScoreError('Evaluation / exam type is required');
      return;
    }
    const numScore = parseFloat(scoreForm.score);
    if (isNaN(numScore) || numScore < 0) {
      setScoreError('Score must be a positive number (0 - 100)');
      return;
    }
    const max = parseFloat(scoreForm.maxScore) || 100;
    if (numScore > max) {
      setScoreError(`Score cannot exceed maximum score (${max})`);
      return;
    }

    setScoreSubmitting(true);
    try {
      await api.createScore({
        studentId: student.id,
        examType: scoreForm.examType.trim(),
        score: numScore,
        maxScore: max,
        date: scoreForm.date ? new Date(scoreForm.date).toISOString() : new Date().toISOString(),
      });
      setShowScoreModal(false);
      setScoreSuccess(`Score for ${scoreForm.examType} (${numScore}/${max}) saved successfully!`);
      setTimeout(() => setScoreSuccess(''), 3500);

      // Refresh scores & student details
      const [s, updatedStudent] = await Promise.all([
        api.scores({ studentId: student.id }),
        api.student(student.id).catch(() => null),
      ]);
      setScores(s || []);
      if (updatedStudent) {
        setStudent(updatedStudent);
      } else {
        const avg = s && s.length > 0 ? Math.round(s.reduce((acc, curr) => acc + curr.score, 0) / s.length) : 0;
        setStudent(prev => ({ ...prev, averageScore: avg }));
      }
    } catch (err) {
      setScoreError(err.message || 'Failed to save score');
    } finally {
      setScoreSubmitting(false);
    }
  };

  const handleDeleteScore = async (scoreItem) => {
    if (!window.confirm(`Delete score for ${scoreItem.examType} (${scoreItem.score}/${scoreItem.maxScore})?`)) {
      return;
    }
    try {
      await api.deleteScore(scoreItem.id);
      setScoreSuccess(`Score for ${scoreItem.examType} deleted successfully.`);
      setTimeout(() => setScoreSuccess(''), 3500);

      const [s, updatedStudent] = await Promise.all([
        api.scores({ studentId: student.id }),
        api.student(student.id).catch(() => null),
      ]);
      setScores(s || []);
      if (updatedStudent) {
        setStudent(updatedStudent);
      } else {
        const avg = s && s.length > 0 ? Math.round(s.reduce((acc, curr) => acc + curr.score, 0) / s.length) : 0;
        setStudent(prev => ({ ...prev, averageScore: avg }));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete score');
    }
  };

  const strengths = typeof student.strengths === 'string' ? JSON.parse(student.strengths || '[]') : student.strengths;
  const weaknesses = typeof student.weaknesses === 'string' ? JSON.parse(student.weaknesses || '[]') : student.weaknesses;
  const achievements = typeof student.achievements === 'string' ? JSON.parse(student.achievements || '[]') : student.achievements;

  const attSummary = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    permission: attendance.filter(a => a.status === 'permission').length,
  };

  const examScores = scores.map(s => ({
    name: s.examType.length > 12 ? s.examType.slice(0, 10) + '..' : s.examType,
    score: s.score,
  }));

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {scoreSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{scoreSuccess}</span>
        </motion.div>
      )}

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{student.name}</h1>
                <StatusBadge status={student.status} />
              </div>
              <button
                onClick={() => {
                  setScoreForm({
                    examType: 'Quiz ' + (scores.length + 1),
                    score: '',
                    maxScore: 100,
                    date: new Date().toISOString().split('T')[0],
                  });
                  setScoreError('');
                  setShowScoreModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Grade Student
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-zinc-400">NISN</span><p className="font-medium text-zinc-900 dark:text-white">{student.nisn || '—'}</p></div>
              <div><span className="text-zinc-400">Class</span><p className="font-medium text-zinc-900 dark:text-white">{student.classId}</p></div>
              <div><span className="text-zinc-400">Gender</span><p className="font-medium text-zinc-900 dark:text-white">{student.gender === 'L' ? 'Male' : 'Female'}</p></div>
              <div><span className="text-zinc-400">Parent</span><p className="font-medium text-zinc-900 dark:text-white">{student.parentName || '—'}</p></div>
            </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-16 mx-auto mb-2" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-20 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className={`text-3xl font-bold ${student.averageScore === 0 ? 'text-zinc-500 dark:text-zinc-400' : student.averageScore >= 80 ? 'text-emerald-600' : student.averageScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{student.averageScore ?? 0}</div>
              <p className="text-xs text-zinc-500 mt-1">Average Score</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className={`text-3xl font-bold ${student.attendance === 0 ? 'text-zinc-500 dark:text-zinc-400' : student.attendance >= 90 ? 'text-emerald-600' : student.attendance >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{student.attendance ?? 0}%</div>
              <p className="text-xs text-zinc-500 mt-1">Attendance</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{student.worksheetCompletion}%</div>
              <p className="text-xs text-zinc-500 mt-1">Worksheet</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-3xl font-bold text-sky-600">{submissions.filter(s => s.status === 'completed').length}</div>
              <p className="text-xs text-zinc-500 mt-1">Submissions</p>
            </motion.div>
          </div>

          {/* Academic Journey (Riwayat Jenjang Siswa) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Academic Progression Journey (Multi-Year)</h3>
                  <p className="text-xs text-zinc-400">Grade transcripts, attendance records, and past classes are permanently preserved.</p>
                </div>
              </div>
              <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-500" />
                {historyData?.history?.length || 1} Levels Recorded
              </div>
            </div>

            {historyData?.history && historyData.history.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-900/50 space-y-6 ml-3">
                {historyData.history.map((enr, idx) => {
                  const isActive = enr.status === 'active';
                  const isPromoted = enr.status === 'promoted';
                  return (
                    <div key={enr.enrollmentId || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-zinc-900 ${
                        isActive
                          ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                          : 'border-indigo-500'
                      } flex items-center justify-center`} />

                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                              Grade {enr.grade} ({enr.className})
                            </span>
                            <span className="text-xs text-zinc-400">· {enr.academicYearName}</span>
                          </div>
                          <div>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Currently Active
                              </span>
                            )}
                            {isPromoted && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                                <GraduationCap className="w-3 h-3" /> Promoted (Recorded)
                              </span>
                            )}
                            {!isActive && !isPromoted && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                {enr.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-2">
                          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50">
                            <span className="text-zinc-400 block text-[11px]">Average Score</span>
                            <span className={`font-bold text-sm ${enr.finalScore >= 80 ? 'text-emerald-600' : enr.finalScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {enr.finalScore} / 100
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50">
                            <span className="text-zinc-400 block text-[11px]">Attendance</span>
                            <span className={`font-bold text-sm ${enr.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {enr.attendanceRate}%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50">
                            <span className="text-zinc-400 block text-[11px]">Evaluations</span>
                            <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                              {enr.totalEvaluations || 0} Grades
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50">
                            <span className="text-zinc-400 block text-[11px]">Sessions Attended</span>
                            <span className="font-bold text-sm text-sky-600 dark:text-sky-400">
                              {enr.totalMeetingsAttended || 0} Sessions
                            </span>
                          </div>
                        </div>

                        {enr.notes && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 bg-white/50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700/30">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Notes:</span> {enr.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500 text-center">
                Student registered in Class {student.classId}. Multi-year history expands upon promotion.
              </div>
            )}
          </motion.div>

          {/* Section: Daftar Evaluasi & Nilai Siswa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Assessments & Student Evaluation Records</h3>
                  <p className="text-xs text-zinc-400">Teachers can record assignment scores, quizzes, midterms, and finals.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Total {scores.length} Records
                </span>
                <button
                  onClick={() => {
                    setScoreForm({
                      examType: 'Quiz ' + (scores.length + 1),
                      score: '',
                      maxScore: 100,
                      date: new Date().toISOString().split('T')[0],
                    });
                    setScoreError('');
                    setShowScoreModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Assessment
                </button>
              </div>
            </div>

            {scores.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                No score records for this student yet. Click <strong>"Grade Student"</strong> above to enter the first evaluation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3">Assessment / Exam Type</th>
                      <th className="pb-3">Date Administered</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Mastery Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {scores.map((s) => {
                      const isPassing = s.score >= 75;
                      const formattedDate = s.date
                        ? new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—';
                      return (
                        <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3 font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            {s.examType}
                          </td>
                          <td className="py-3 text-xs text-zinc-500">{formattedDate}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              s.score >= 80
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : s.score >= 65
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}>
                              {s.score} <span className="font-normal opacity-70 ml-1">/ {s.maxScore || 100}</span>
                            </span>
                          </td>
                          <td className="py-3">
                            {isPassing ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" /> Remedial Required
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteScore(s)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete Score"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Trend */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Score Progression Chart
              </h3>
              <div className="h-48">
                {examScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={examScores}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(24,24,27,0.9)', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm">No score chart data yet</div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Attendance Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-center">
                  <div className="text-xl font-bold text-emerald-600">{attSummary.present}</div>
                  <p className="text-xs text-emerald-500">Present</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-center">
                  <div className="text-xl font-bold text-rose-600">{attSummary.absent}</div>
                  <p className="text-xs text-rose-500">Absent</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-center">
                  <div className="text-xl font-bold text-amber-600">{attSummary.late}</div>
                  <p className="text-xs text-amber-500">Late</p>
                </div>
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-center">
                  <div className="text-xl font-bold text-sky-600">{attSummary.permission}</div>
                  <p className="text-xs text-sky-500">Excused</p>
                </div>
              </div>
              <ProgressBar value={student.attendance ?? 0} color={(student.attendance ?? 0) >= 90 ? 'emerald' : 'amber'} size="lg" />
            </div>

            {/* Strengths */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Strengths & Achievements
              </h3>
              {strengths && strengths.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400 mb-4">No strengths recorded yet</p>
              )}
              {achievements && achievements.length > 0 && (
                <div className="space-y-2">
                  {achievements.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <Award className="w-4 h-4" /> {a}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weaknesses */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Observations & Teacher Notes
              </h3>
              {weaknesses && weaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400">No special notes recorded</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Beri Nilai */}
      <AnimatePresence>
        {showScoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Grade Student</h3>
                    <p className="text-xs text-zinc-500">{student.name} ({student.classId})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {scoreError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{scoreError}</span>
                </div>
              )}

              <form onSubmit={handleSaveScore} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Assessment / Exam Type
                  </label>
                  <input
                    type="text"
                    required
                    value={scoreForm.examType}
                    onChange={e => setScoreForm(prev => ({ ...prev, examType: e.target.value }))}
                    placeholder="e.g. Quiz 1, Midterm Exam, Final Project, Lab 1"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {['Quiz 1', 'Quiz 2', 'Midterm Exam', 'Final Exam', 'Practical Lab'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setScoreForm(prev => ({ ...prev, examType: preset }))}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Score
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={scoreForm.maxScore || 100}
                      value={scoreForm.score}
                      onChange={e => setScoreForm(prev => ({ ...prev, score: e.target.value }))}
                      placeholder="0 - 100"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Maximum Score
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={scoreForm.maxScore}
                      onChange={e => setScoreForm(prev => ({ ...prev, maxScore: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Date Administered
                  </label>
                  <input
                    type="date"
                    value={scoreForm.date}
                    onChange={e => setScoreForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowScoreModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scoreSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    {scoreSubmitting ? 'Saving...' : 'Save Score'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
