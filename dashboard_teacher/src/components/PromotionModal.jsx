import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, CheckCircle2, ArrowRight, ShieldCheck, Filter, Users, UserCheck } from 'lucide-react';
import { api } from '../utils/api';

export default function PromotionModal({
  isOpen,
  onClose,
  onSuccess,
  classes = [],
  defaultSourceClassId = '',
  defaultTargetClassId = '',
}) {
  const [targetClassId, setTargetClassId] = useState(defaultTargetClassId || classes[1]?.id || classes[0]?.id || '');
  const [sourceClassId, setSourceClassId] = useState(defaultSourceClassId || classes[0]?.id || '');
  const [candidates, setCandidates] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [action, setAction] = useState('promoted');
  const [notes, setNotes] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync initial class selection when opened
  useEffect(() => {
    if (isOpen) {
      if (defaultTargetClassId) setTargetClassId(defaultTargetClassId);
      else if (classes.length > 1) setTargetClassId(classes[1].id);
      else if (classes.length > 0) setTargetClassId(classes[0].id);

      if (defaultSourceClassId) setSourceClassId(defaultSourceClassId);
      else if (classes.length > 0) setSourceClassId(classes[0].id);

      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, defaultSourceClassId, defaultTargetClassId, classes]);

  // Load candidate students from source class
  useEffect(() => {
    if (!isOpen || !sourceClassId) return;

    let isMounted = true;
    async function loadCandidates() {
      setLoadingCandidates(true);
      setError('');
      try {
        const students = await api.students({ classId: sourceClassId });
        if (isMounted) {
          setCandidates(students);
          // By default, select all active students
          setSelectedStudentIds(students.map(s => s.id));
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load student roster');
      } finally {
        if (isMounted) setLoadingCandidates(false);
      }
    }
    loadCandidates();
    return () => { isMounted = false; };
  }, [isOpen, sourceClassId]);

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedStudentIds(candidates.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const selectPassingOnly = () => {
    setSelectedStudentIds(candidates.filter(s => (s.averageScore || 0) >= 70).map(s => s.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetClassId) {
      setError('Please select a target class for promotion first');
      return;
    }
    if (sourceClassId === targetClassId) {
      setError('Source class and target class cannot be the same');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError('Select at least one student to promote to the next class');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const targetClass = classes.find(c => c.id === targetClassId);
      const res = await api.promoteStudents({
        sourceClassId,
        targetClassId,
        studentIds: selectedStudentIds,
        action,
        notes: notes || `Promotion to ${targetClass?.name || targetClassId}`,
      });

      setSuccessMessage(res.message || `Successfully promoted ${selectedStudentIds.length} students to the new class.`);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to process student promotion');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl my-8 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Student Progression & Class Promotion
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Grades, attendance, and previous class records are permanently preserved and archived.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Class source & target selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Source Class (Current Origin)
                </label>
                <select
                  value={sourceClassId}
                  onChange={(e) => setSourceClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Grade {c.grade} · {c.studentCount} Students)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> Target Class (Promoted Level)
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="" disabled>-- Select Target Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === sourceClassId}>
                      {c.name} (Grade {c.grade} · {c.studentCount} Students) {c.id === sourceClassId ? '(Current Class)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Checklist */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Select Students to Promote ({selectedStudentIds.length} / {candidates.length} Selected)
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={selectPassingOnly}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Grade ≥ 70
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                {loadingCandidates ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Loading student roster from source class...
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    No students currently registered in this class.
                  </div>
                ) : (
                  candidates.map(st => {
                    const isSelected = selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleSelectStudent(st.id)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/20'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                              {st.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">
                              NISN: {st.nisn} · {st.gender === 'L' || st.gender === 'M' ? 'Male' : 'Female'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <span className="text-[11px] text-zinc-400 block">Average</span>
                            <span className={`text-xs font-bold ${
                              (st.averageScore || 0) >= 80 ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {st.averageScore || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-400 block">Attendance</span>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              {st.attendance || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Note & Action */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Source Archive Status
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="promoted">Promoted</option>
                  <option value="transferred">Transferred</option>
                  <option value="retained">Retained</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Promotion Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Promoted to Grade 8A Semester 1 2025/2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Data Guarantee Banner */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Data Integrity Guarantee:</strong> All attendance logs, submissions, and exam scores from the source class are permanently archived. Students can view their historical learning journey directly from the student portal profile.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedStudentIds.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                {submitting
                  ? 'Processing Promotion...'
                  : `Promote Students (${selectedStudentIds.length} Students)`}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
