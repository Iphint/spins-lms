import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GraduationCap, Users, ClipboardCheck, FileText, BookOpen, ArrowRight, Plus, Edit2, Trash2, RotateCcw, ListPlus, Calendar, Filter } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProgressBar from '../components/ProgressBar';
import ClassFormModal from '../components/ClassFormModal';
import PromotionModal from '../components/PromotionModal';
import ResetRosterModal from '../components/ResetRosterModal';
import BulkStudentModal from '../components/BulkStudentModal';
import { api } from '../utils/api';
import ClassDetail from './ClassDetail';

export default function Classes() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teacherSubject, setTeacherSubject] = useState('Coding & AI Integrated');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetClass, setResetTargetClass] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');
  const [promotionSourceClass, setPromotionSourceClass] = useState('');
  const [promotionTargetClass, setPromotionTargetClass] = useState('');
  const [editClass, setEditClass] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadClasses() {
    try {
      const [clsData, semData, teacherData] = await Promise.all([
        api.classes(),
        api.semesters(),
        api.teacher(),
      ]);
      setClasses(clsData);
      setSemesters(semData);
      if (teacherData?.subject) setTeacherSubject(teacherData.subject);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClasses(); }, []);

  const handleCreate = async (form) => {
    const newClass = await api.createClass(form);
    setClasses(prev => [...prev, newClass].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section)));
  };

  const handleUpdate = async (form) => {
    const updated = await api.updateClass(editClass.id, form);
    setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditClass(null);
  };

  const handleDelete = async (id) => {
    await api.deleteClass(id);
    setClasses(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
  };

  if (selectedClass) {
    return <ClassDetail cls={selectedClass} onBack={() => setSelectedClass(null)} />;
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Classes" description="Manage all your classes and track progress" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                <div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-1" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                </div>
              </div>
              {[1, 2, 3].map(j => <div key={j} className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Classes" description="Manage all classes and track learning progress">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setBulkTargetClassId('');
              setShowBulkModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer"
          >
            <ListPlus className="w-4 h-4" /> Bulk Add Students
          </button>
          <button
            onClick={() => {
              setPromotionSourceClass('');
              setPromotionTargetClass('');
              setShowPromotionModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" /> Student Promotion
          </button>
          <button
            onClick={() => { setEditClass(null); setShowForm(true); }}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Class (7P, 7S, etc.)
          </button>
        </div>
      </PageHeader>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Semester Filter Bar & Info */}
      {semesters.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" /> Semester Filter:
            </span>
            <button
              onClick={() => setSelectedSemesterFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedSemesterFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All ({classes.length})
            </button>
            {semesters.map(s => {
              const isSelected = selectedSemesterFilter === s.id;
              const count = classes.filter(c => c.semesterId === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSemesterFilter(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {s.status === 'active' && <span>⭐</span>}
                  <span>{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {(() => {
            const activeSem = semesters.find(s => s.status === 'active');
            return activeSem ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Active Semester: <strong>{activeSem.name}</strong></span>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            No Classes Created Yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6">
            Get started by creating your class roster, for example <strong>Grade 7P</strong>, <strong>Grade 7S</strong>, or other classes.
          </p>
          <button
            onClick={() => { setEditClass(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Class (e.g. Grade 7P, 7S)
          </button>
        </div>
      ) : classes.filter(c => selectedSemesterFilter === 'all' || c.semesterId === selectedSemesterFilter).length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            No classes found for this semester
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Create a new class for this semester or select a different semester filter.
          </p>
          <button
            onClick={() => { setEditClass(null); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes
          .filter(c => selectedSemesterFilter === 'all' || c.semesterId === selectedSemesterFilter)
          .map((cls, i) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{cls.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-zinc-500 truncate">Grade {cls.grade} · {cls.subject}</span>
                    {cls.semester && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                        cls.semester.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {cls.semester.status === 'active' ? '⭐ ' : ''}
                        {cls.semester.number === 1 ? 'Sem 1' : cls.semester.number === 2 ? 'Sem 2' : cls.semester.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBulkTargetClassId(cls.id);
                    setShowBulkModal(true);
                  }}
                  title="Bulk Add Students to This Class"
                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPromotionSourceClass(cls.id);
                    setPromotionTargetClass('');
                    setShowPromotionModal(true);
                  }}
                  title="Promote students from this class"
                  className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setResetTargetClass(cls);
                    setShowResetModal(true);
                  }}
                  title="Reset Class Roster (New Academic Year)"
                  className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditClass(cls); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(cls); }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div onClick={() => setSelectedClass(cls)} className="cursor-pointer">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Students</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{cls.studentCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5" /> Attendance</span>
                  <span className={`font-medium ${cls.attendanceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : cls.attendanceRate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>{cls.attendanceRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Worksheet</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{cls.worksheetCompletion}%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 mb-3">
                <p className="text-xs text-zinc-400 mb-1">Current Topic</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{cls.currentTopic || '—'}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Semester Progress</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{cls.semesterProgress}%</span>
                </div>
                <ProgressBar value={cls.semesterProgress} color="indigo" size="sm" showLabel={false} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}

      <ClassFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditClass(null); }}
        onSubmit={editClass ? handleUpdate : handleCreate}
        semesters={semesters}
        teacherSubject={teacherSubject}
        initialData={editClass}
      />

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Delete Class</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will also delete all students, meetings, worksheets, and related data.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onSuccess={loadClasses}
        classes={classes}
        defaultSourceClassId={promotionSourceClass}
        defaultTargetClassId={promotionTargetClass}
      />

      <ResetRosterModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetTargetClass(null);
        }}
        onSuccess={loadClasses}
        cls={resetTargetClass}
      />

      <BulkStudentModal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkTargetClassId('');
        }}
        onSuccess={loadClasses}
        classes={classes}
        initialClassId={bulkTargetClassId}
      />
    </div>
  );
}
