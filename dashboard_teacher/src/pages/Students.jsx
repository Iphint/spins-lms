import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Edit2, Trash2, X, ListPlus, GraduationCap, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import FilterBar from '../components/FilterBar';
import PromotionModal from '../components/PromotionModal';
import BulkStudentModal from '../components/BulkStudentModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import StudentDetail from './StudentDetail';

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', gender: 'L', classId: '', nisn: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadData() {
    try {
      const [s, c, t] = await Promise.all([
        api.students(),
        api.classes(),
        isAdmin ? api.teachers().catch(() => []) : Promise.resolve([]),
      ]);
      setStudents(s || []);
      setClasses(c || []);
      setTeachers(t || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [isAdmin]);

  const filters = [
    ...(isAdmin && teachers.length > 0 ? [{
      key: 'teacher',
      label: 'All Teachers',
      options: teachers.map(t => ({ value: t.id, label: t.name })),
    }] : []),
    { key: 'class', label: 'All Classes', options: classes.map(c => ({ value: c.id, label: c.name })) },
    { key: 'status', label: 'All Status', options: [
      { value: 'active', label: 'Active' },
      { value: 'needs-attention', label: 'Needs Attention' },
      { value: 'remedial', label: 'Remedial' },
      { value: 'enrichment', label: 'Enrichment' },
    ]},
    { key: 'gender', label: 'Gender', options: [
      { value: 'L', label: 'Male' },
      { value: 'P', label: 'Female' },
    ]},
  ];

  const openAddForm = () => {
    setEditStudent(null);
    setForm({ name: '', gender: 'L', classId: classes[0]?.id || '', nisn: '' });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setEditStudent(student);
    setForm({
      name: student.name,
      gender: student.gender,
      classId: student.classId,
      nisn: student.nisn || '',
    });
    setShowForm(true);
  };

  const openBulkForm = () => {
    setError('');
    setShowBulkModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editStudent) {
        const updated = await api.updateStudent(editStudent.id, form);
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await api.createStudent(form);
        setStudents(prev => [...prev, created]);
      }
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (selectedStudent) {
    return <StudentDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  let filtered = students;
  if (search) filtered = filtered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  if (activeFilters.teacher) {
    const classIdsForTeacher = classes.filter(c => c.teacherId === activeFilters.teacher).map(c => c.id);
    filtered = filtered.filter(s => classIdsForTeacher.includes(s.classId));
  }
  if (activeFilters.class) filtered = filtered.filter(s => s.classId === activeFilters.class);
  if (activeFilters.status) filtered = filtered.filter(s => s.status === activeFilters.status);
  if (activeFilters.gender) filtered = filtered.filter(s => s.gender === activeFilters.gender);

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset pagination to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilters]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = filtered.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  function getPageNumbers() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Administrator Supervision Mode
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Students are managed and evaluated directly by their classroom teachers. Click on a student name to review their full profile, academic history, and grade transcript.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold shadow-sm">
              {classes.length} Classes Recorded
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm">
              {teachers.length} Active Teachers
            </span>
          </div>
        </div>
      )}

      <PageHeader title="Students" description={`${students.length} total students across ${classes.length} classes`}>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openBulkForm}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <ListPlus className="w-4 h-4" /> Bulk Add Students
          </button>
          <button
            onClick={() => setShowPromotionModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" /> Student Promotion
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Student Manually
          </button>
        </div>
      </PageHeader>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400">{error}</div>
      )}

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <FilterBar filters={filters} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
          </div>

      {loading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Class</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gender</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Attendance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Worksheet</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span
                          className="text-sm font-medium text-zinc-900 dark:text-white cursor-pointer hover:text-indigo-600"
                          onClick={() => setSelectedStudent(student)}
                        >
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {classes.find(c => c.id === student.classId)?.name || student.classId}
                      </div>
                      {classes.find(c => c.id === student.classId)?.teacher?.name && (
                        <div className="text-[11px] text-zinc-400">
                          Teacher: {classes.find(c => c.id === student.classId)?.teacher?.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{student.gender}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${student.attendance === 0 ? 'text-zinc-500 dark:text-zinc-400' : student.attendance >= 90 ? 'text-emerald-600' : student.attendance >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {student.attendance ?? 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">{student.worksheetCompletion ?? 0}%</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{student.averageScore ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={student.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(student)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-indigo-500 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <span>
                  Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> students
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={validCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => (
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-zinc-400 text-xs select-none">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            validCurrentPage === p
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          {filtered.length === 0 && (
            students.length === 0 ? (
              <div className="py-16 px-4 text-center max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">No Students Registered Yet</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                  The system is currently fresh/reset. You can add students in bulk or enter records manually.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={openBulkForm}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <ListPlus className="w-4 h-4" /> Bulk Add Students
                  </button>
                  <button
                    onClick={openAddForm}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Student Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-sm">No students found matching your criteria.</div>
            )
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {editStudent ? 'Edit Student' : 'Add Student'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600">{error}</div>
              )}

              {!editStudent && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <ListPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Want to add multiple students at once?
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Use the Bulk Add tool to copy and paste student rosters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setShowBulkModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" /> Bulk Add
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Student name"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      <option value="L">Male</option>
                      <option value="P">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Class</label>
                    <select
                      value={form.classId}
                      onChange={e => setForm({ ...form, classId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      {classes.length === 0
                        ? <option value="">Loading classes...</option>
                        : classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">NISN (optional)</label>
                  <input
                    type="text"
                    value={form.nisn}
                    onChange={e => setForm({ ...form, nisn: e.target.value })}
                    placeholder="Student ID number"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {!editStudent && (
                  <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300">
                    ℹ️ <strong>New Student:</strong> Attendance, worksheet completion, and average score start automatically at <strong>0</strong>. Login account is automatically created with default password <code className="font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1 rounded">password123</code>.
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : editStudent ? 'Update' : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Delete Student</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will also remove all their scores, submissions, and attendance records.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700">
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
        onSuccess={loadData}
        classes={classes}
      />

      <BulkStudentModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={loadData}
        classes={classes}
      />
    </div>
  );
}
