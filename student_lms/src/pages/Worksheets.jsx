import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet, Search, Clock, CheckCircle, Send, MessageSquare, X,
  Code2, Play, Download, Upload, CheckCircle2, AlertCircle, FileText, Sparkles,
  Award, ShieldAlert, Check
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import CodePlayground from '../components/code/CodePlayground';
import api from '../utils/api';

export default function Worksheets() {
  const [worksheetsList, setWorksheetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);

  // Student submission state inside modal
  const [studentCode, setStudentCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWorksheets() {
      try {
        const data = await api.get('/api/student-portal/worksheets');
        if (isMounted) {
          setWorksheetsList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Failed to load worksheets from API:', err.message);
        if (isMounted) setWorksheetsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadWorksheets();
    return () => { isMounted = false; };
  }, []);

  const openModal = (ws) => {
    setModal(ws);
    setStudentCode(ws.submission?.submittedCode || ws.starterCode || '# Write your solution code here\n');
    setCodeOutput(ws.submission?.codeOutput || '');
    setStudentNotes(ws.submission?.feedback || '');
    setSubmitSuccess(false);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setCodeOutput(`[Output Test Runner]\nProgram executed with 0 errors.`);
    }, 400);
  };

  const handleSubmitWorksheet = async (codeData) => {
    if (!modal) return;
    setSubmitting(true);
    try {
      const codeToSend = typeof codeData === 'object' && codeData?.code !== undefined
        ? codeData.code
        : (studentCode || modal.submission?.submittedCode || modal.starterCode);
      const outputToSend = typeof codeData === 'object' && codeData?.output !== undefined
        ? codeData.output
        : (codeOutput || modal.submission?.codeOutput || '');

      const payload = {
        submittedCode: codeToSend,
        codeOutput: outputToSend,
        feedback: studentNotes || 'Answer submitted via Online Test Runner',
        fileUrl: modal.submission?.fileUrl || null,
        fileName: modal.submission?.fileName || null,
      };

      await api.post(`/api/student-portal/worksheets/${modal.id}/submit`, payload);

      setSubmitSuccess(true);
      setStudentCode(codeToSend);
      setCodeOutput(outputToSend);

      // Refresh list in state
      setWorksheetsList(prev => prev.map(w => {
        if (w.id === modal.id) {
          return {
            ...w,
            status: 'submitted',
            submission: {
              ...(w.submission || {}),
              status: 'submitted',
              submittedDate: new Date().toISOString().split('T')[0],
              submittedCode: codeToSend,
              codeOutput: outputToSend,
            },
          };
        }
        return w;
      }));
    } catch (err) {
      alert(`Failed to submit worksheet answer: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return worksheetsList.filter(w => {
      const matchSearch = (w.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.topic || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [worksheetsList, search, statusFilter]);

  const difficultyColor = (d) => {
    if (d === 'Mudah' || d === 'Easy') return 'text-green-600 bg-green-100 dark:bg-green-500/20 dark:text-green-400';
    if (d === 'Sedang' || d === 'Medium') return 'text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400';
    return 'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400';
  };

  return (
    <div>
      <PageHeader
        title="Student Worksheets"
        subtitle={`${worksheetsList.length} active assignments & coding tasks`}
        icon={FileSpreadsheet}
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search worksheets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'completed', 'submitted', 'in-progress', 'overdue'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                statusFilter === s ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : ''
              }`}
              style={statusFilter !== s ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
            >
              {s === 'all' ? 'All Status' : s === 'completed' ? 'Completed (Graded)' : s === 'submitted' ? 'Submitted' : s === 'in-progress' ? 'In Progress' : 'Overdue'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ws, i) => {
          const isDone = ws.status === 'completed';
          const isSubmitted = ws.status === 'submitted';
          const score = ws.submission?.score || ws.score;

          return (
            <motion.div
              key={ws.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              onClick={() => openModal(ws)}
              className="rounded-2xl p-5 cursor-pointer transition-shadow hover:shadow-lg flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ws.title}</h4>
                  <StatusBadge status={ws.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ws.topic || 'Informatics'}</span>
                  <span>•</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${difficultyColor(ws.difficulty || 'Medium')}`}>
                    {ws.difficulty || 'Medium'}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Pure Test
                  </span>
                  {ws.hasCodeEditor && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> Code
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {ws.dueDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                {isDone && score !== undefined ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Graded
                    </span>
                    <span className="text-sm font-bold text-emerald-500">Score: {score}/100</span>
                  </div>
                ) : isSubmitted ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Awaiting Teacher Grading
                    </span>
                    <span className="text-xs text-slate-400">Submitted</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" /> Start Task Now
                    </span>
                    <span className="text-xs text-slate-400">Max: {ws.maxScore || 100}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No worksheets found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Try adjusting your search or status filter</p>
        </div>
      )}

      {/* Submission & Online Code Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {/* Modal Header */}
              <div>
                <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white tracking-wide flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" /> PURE TEST CODING
                      </span>
                      <StatusBadge status={modal.status} />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${difficultyColor(modal.difficulty || 'Medium')}`}>
                        {modal.difficulty || 'Medium'}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Weight: {modal.maxScore || 100} Points
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                        Language: {modal.codeLanguage?.toUpperCase() || 'PYTHON'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{modal.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{modal.topic} • Due: {modal.dueDate}</p>
                  </div>
                  <button
                    onClick={() => setModal(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>

                {/* Success Alert */}
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 my-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Test answers submitted successfully and recorded for teacher grading!</span>
                  </motion.div>
                )}

                {/* Teacher Feedback & Final Score (if graded) */}
                {modal.submission?.score !== undefined && modal.submission.score > 0 && (
                  <div className="my-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
                        {modal.submission.score}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Test Assessment Results</p>
                        <p className="text-sm font-semibold text-slate-200">
                          {modal.submission.feedback || 'Worksheet submission has been graded by the teacher.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 text-white shadow-xs">
                      PASSED (SCORE: {modal.submission.score}/{modal.maxScore || 100})
                    </span>
                  </div>
                )}

                {/* Instructions & Guidelines from Teacher */}
                <div className="p-4 rounded-2xl my-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Teacher Test Instructions (Muhammad Arifin)
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                    {modal.description || 'Solve this algorithm and programming problem. Make sure your code passes all test cases before submitting.'}
                  </p>

                  {/* Teacher's problem attachment download */}
                  {modal.fileUrl && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-slate-300">{modal.fileName || 'Attached Test Document'}</span>
                      </div>
                      <a
                        href={modal.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition"
                      >
                        <Download className="w-3 h-3" /> Download Document
                      </a>
                    </div>
                  )}
                </div>

                {/* Interactive Pure Test Code Editor with Automated Test Cases */}
                <div className="space-y-4 mb-4">
                  <CodePlayground
                    worksheetId={modal.id}
                    title={`Pure Test: ${modal.title}`}
                    language={modal.codeLanguage || (modal.title?.toLowerCase().includes('turtle') ? 'turtle' : 'python')}
                    starterCode={modal.submission?.submittedCode || modal.starterCode || '# Write your solution code here\n'}
                    testCases={Array.isArray(modal.testCases) ? modal.testCases : []}
                    teacherNotes={modal.description}
                    isTestMode={true}
                    submission={modal.submission}
                    onSubmit={handleSubmitWorksheet}
                  />

                  {/* Optional notes textarea for student */}
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Additional Student Notes / Comments (Optional)
                    </h5>
                    <textarea
                      rows={2}
                      value={studentNotes}
                      onChange={e => setStudentNotes(e.target.value)}
                      placeholder="Write any additional explanations about your algorithm or approach here..."
                      className="w-full p-3 rounded-xl border text-xs outline-none resize-y"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => setModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-slate-800 transition cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Close Worksheet
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitWorksheet({ code: studentCode, output: codeOutput })}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{modal.status === 'completed' || modal.status === 'submitted' ? 'Resubmit Test Answer' : 'Submit Test Answer'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
