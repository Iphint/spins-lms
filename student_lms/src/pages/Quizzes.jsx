import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Clock, Trophy, Award, CheckCircle, X, Search, BookOpen, AlertCircle, Calendar } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../utils/api';

export default function Quizzes() {
  const [quizzesList, setQuizzesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadQuizAndExamData() {
      try {
        const [scoresRes, worksheetsRes] = await Promise.all([
          api.get('/api/student-portal/scores').catch(() => ({ scores: [] })),
          api.get('/api/student-portal/worksheets').catch(() => ([])),
        ]);

        if (!isMounted) return;

        const scores = Array.isArray(scoresRes?.scores) ? scoresRes.scores : [];
        const worksheets = Array.isArray(worksheetsRes) ? worksheetsRes : [];

        // Combine into unified evaluation list
        const combined = [];

        // 1. Add Exam & Quiz Scores recorded by Teacher
        scores.forEach((s, idx) => {
          combined.push({
            id: `score-${s.id || idx}`,
            title: s.topic || s.examType || `Evaluation ${idx + 1}`,
            examType: s.examType || 'Quiz',
            subject: s.class?.name ? `${s.class.name} (${s.class.subject || 'Informatics'})` : 'Informatics & Coding',
            date: s.date ? new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recorded',
            score: s.score,
            maxScore: s.maxScore || 100,
            notes: s.notes || 'Grade recorded by subject teacher.',
            status: 'completed',
            semester: s.semester ? `Semester ${s.semester}` : 'Semester 1',
            category: s.examType?.toLowerCase().includes('mid') || s.examType?.toLowerCase().includes('pts') || s.examType?.toLowerCase().includes('uas') || s.examType?.toLowerCase().includes('pas')
              ? 'exam'
              : 'quiz',
          });
        });

        // 2. Add Worksheets / Tests assigned by Teacher
        worksheets.forEach((w) => {
          const hasScore = w.submission?.score !== undefined && w.submission?.score > 0;
          combined.push({
            id: `ws-${w.id}`,
            title: w.title,
            examType: w.hasCodeEditor ? 'Practical Coding Test' : 'Quiz Worksheet',
            subject: w.topic || 'Informatics & Coding',
            date: w.dueDate ? new Date(w.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible',
            score: hasScore ? w.submission.score : null,
            maxScore: w.maxScore || 100,
            notes: w.submission?.feedback || w.description || 'Complete the quiz/task provided by the teacher.',
            status: hasScore ? 'completed' : (w.status === 'submitted' ? 'submitted' : 'available'),
            semester: 'Current Semester',
            category: 'worksheet',
            totalQuestions: w.totalQuestions || 10,
          });
        });

        setQuizzesList(combined);
      } catch (err) {
        console.warn('Failed to load evaluations & quizzes:', err.message);
        if (isMounted) setQuizzesList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadQuizAndExamData();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return quizzesList;
    return quizzesList.filter(q => q.category === typeFilter || q.status === typeFilter);
  }, [quizzesList, typeFilter]);

  return (
    <div>
      <PageHeader
        title="Quizzes & Exams"
        subtitle={loading ? "Loading assessment records..." : `${quizzesList.length} evaluation records from teachers`}
        icon={HelpCircle}
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {[
          { id: 'all', label: 'All Evaluations' },
          { id: 'exam', label: 'Mid & Final Exam' },
          { id: 'quiz', label: 'Quizzes & Formative' },
          { id: 'worksheet', label: 'Practical Tests' },
          { id: 'completed', label: 'Graded' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setTypeFilter(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${typeFilter === s.id ? 'bg-indigo-500 text-white shadow-sm' : ''}`}
            style={typeFilter !== s.id ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzesList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No Quiz or Exam Records</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            No quizzes or exam evaluations have been published for your class yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                    {q.title}
                  </h4>
                  <StatusBadge status={q.status} />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    {q.examType}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    • {q.semester}
                  </span>
                </div>

                <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{q.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Subject
                    </span>
                    <span className="font-medium truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>{q.subject}</span>
                  </div>
                </div>

                {q.score !== null && q.score !== undefined ? (
                  <div className="p-3.5 rounded-xl text-center bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 mb-4">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">Score Achieved</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {q.score} <span className="text-sm font-semibold opacity-75">/ {q.maxScore}</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {q.status === 'submitted' ? 'Pending Teacher Grading' : 'Not Started'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => setSelectedItem(q)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                >
                  <Trophy className="w-3.5 h-3.5" /> View Details & Review
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Result / Review Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                    {selectedItem.examType}
                  </span>
                  <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {selectedItem.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedItem.score !== null ? (
                <div className="text-center my-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                    <span className="text-3xl font-black text-white">{selectedItem.score}</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Max score {selectedItem.maxScore} points
                  </p>
                </div>
              ) : (
                <div className="text-center my-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ungraded</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    This evaluation has not been scored yet by the teacher.
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-xl flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Course Subject:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedItem.subject}</span>
                </div>
                <div className="p-3.5 rounded-xl flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Date:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedItem.date}</span>
                </div>
                <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <span className="text-xs block mb-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>Teacher Comments:</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {selectedItem.notes}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                Close Review
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
