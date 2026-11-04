import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, X, Pencil, Trash2, CheckCircle2,
  Clock, AlertCircle, BookOpen, GraduationCap, Sparkles, Star
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../utils/api';

const defaultForm = {
  academicYearName: '2026/2027',
  number: 1,
  name: 'Semester 1 (Odd) 2026/2027',
  startDate: '',
  endDate: '',
  totalMeetings: 16,
  learningTargets: 16,
  status: 'upcoming',
};

export default function ManagementSemester() {
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmActivate, setConfirmActivate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [semData, ayData] = await Promise.all([
        api.semesters().catch(() => []),
        api.academicYears().catch(() => []),
      ]);
      setSemesters(semData || []);
      setAcademicYears(ayData || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeSemester = semesters.find(s => s.status === 'active');

  function openCreate() {
    const latestAy = academicYears[0]?.name || '2026/2027';
    const nextNumber = semesters.some(s => s.status === 'active' && s.number === 1) ? 2 : 1;
    const nameStr = `Semester ${nextNumber} (${nextNumber === 1 ? 'Odd' : 'Even'}) ${latestAy}`;

    setForm({
      academicYearName: latestAy,
      number: nextNumber,
      name: nameStr,
      startDate: nextNumber === 1 ? '2026-07-13' : '2027-01-04',
      endDate: nextNumber === 1 ? '2026-12-18' : '2027-06-25',
      totalMeetings: 16,
      learningTargets: 16,
      status: semesters.length === 0 ? 'active' : 'upcoming',
    });
    setEditId(null);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(sem) {
    setForm({
      academicYearName: sem.academicYear?.name || '2026/2027',
      number: sem.number,
      name: sem.name,
      startDate: sem.startDate || '',
      endDate: sem.endDate || '',
      totalMeetings: sem.totalMeetings || 16,
      learningTargets: sem.learningTargets || 16,
      status: sem.status,
    });
    setEditId(sem.id);
    setErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Semester name is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errs.endDate = 'End date must be after start date';
    }
    if (!form.totalMeetings || form.totalMeetings <= 0) {
      errs.totalMeetings = 'Target meetings must be at least 1';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    try {
      if (editId) {
        await api.updateSemester(editId, form);
        setSuccessMessage(`Semester ${form.name} updated successfully.`);
      } else {
        await api.createSemester(form);
        setSuccessMessage(`New semester ${form.name} created successfully.`);
      }
      await loadData();
      closeModal();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate(sem) {
    setError('');
    try {
      await api.activateSemester(sem.id);
      setSuccessMessage(`Semester ${sem.name} set as the active semester.`);
      setConfirmActivate(null);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.deleteSemester(id);
      setSuccessMessage('Semester deleted successfully.');
      setConfirmDelete(null);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(dStr) {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semester Management"
        description="Manage school semester calendar periods, configure active semesters, and synchronize teaching schedules."
      >
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Semester
        </button>
      </PageHeader>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Semester Spotlight Banner */}
      {activeSemester && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CURRENT ACTIVE SCHOOL SEMESTER</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{activeSemester.name}</h2>
              <p className="text-xs text-indigo-200 max-w-xl">
                All newly created classes, curriculum plans, and teacher schedules are automatically
                aligned with this semester. Teachers can focus directly on instruction and evaluations.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
              <div className="text-center px-3 border-r border-white/20">
                <span className="block text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">Period</span>
                <span className="text-xs font-bold whitespace-nowrap">
                  {formatDate(activeSemester.startDate)} - {formatDate(activeSemester.endDate)}
                </span>
              </div>
              <div className="text-center px-3 border-r border-white/20">
                <span className="block text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">Target</span>
                <span className="text-base font-bold text-amber-300">
                  {activeSemester.totalMeetings} Meetings
                </span>
              </div>
              <div className="text-center px-3">
                <span className="block text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">Active Classes</span>
                <span className="text-base font-bold text-emerald-300">
                  {activeSemester._count?.classes || 0} Classes
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Semesters Table / Card List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Registered Semesters</h3>
            <p className="text-xs text-zinc-500">Click &quot;Set Active&quot; to switch the active period to another semester.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg">
            Total: {semesters.length} Semesters
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Loading semester data...</div>
        ) : semesters.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">No Semesters Yet</h4>
            <p className="text-xs text-zinc-500 mb-4">Add a new semester to initialize the school academic calendar.</p>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              + Add Semester
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Semester Name</th>
                  <th className="px-4 py-3.5">Academic Year</th>
                  <th className="px-4 py-3.5">Date Range</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Enrolled Classes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {semesters.map(sem => {
                  const isActive = sem.status === 'active';
                  const isUpcoming = sem.status === 'upcoming';
                  const classCount = sem._count?.classes || 0;

                  return (
                    <tr
                      key={sem.id}
                      className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors ${
                        isActive ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {isActive && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                          <span>{sem.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {sem.academicYear?.name || '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatDate(sem.startDate)} - {formatDate(sem.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {sem.totalMeetings} Meetings
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                          {classCount} Classes
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              onClick={() => setConfirmActivate(sem)}
                              title="Set this semester as active"
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                            >
                              Set Active
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(sem)}
                            title="Edit semester"
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isActive && classCount === 0 && (
                            <button
                              onClick={() => setConfirmDelete(sem)}
                              title="Delete semester"
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Semester */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {editId ? 'Edit Semester' : 'Add New Semester'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Administrators configure the academic calendar and semester periods.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      required
                      value={form.academicYearName}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(prev => ({
                          ...prev,
                          academicYearName: val,
                          name: `Semester ${prev.number} (${prev.number === 1 ? 'Odd' : 'Even'}) ${val}`,
                        }));
                      }}
                      placeholder="e.g. 2026/2027"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Semester
                    </label>
                    <select
                      value={form.number}
                      onChange={e => {
                        const num = parseInt(e.target.value, 10);
                        setForm(prev => ({
                          ...prev,
                          number: num,
                          name: `Semester ${num} (${num === 1 ? 'Odd' : 'Even'}) ${prev.academicYearName}`,
                          startDate: num === 1 ? '2026-07-13' : '2027-01-04',
                          endDate: num === 1 ? '2026-12-18' : '2027-06-25',
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value={1}>Semester 1 (Odd)</option>
                      <option value={2}>Semester 2 (Even)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Semester Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Semester 1 (Odd) 2026/2027"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {errors.startDate && <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {errors.endDate && <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Target Meetings
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={form.totalMeetings}
                      onChange={e => setForm(prev => ({ ...prev, totalMeetings: parseInt(e.target.value, 10) || 16 }))}
                      placeholder="16"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Semester Status
                    </label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="active">⭐ Active (Current Semester)</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    {submitting ? 'Saving...' : editId ? 'Save Changes' : 'Create Semester'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Activate Semester */}
      <AnimatePresence>
        {confirmActivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setConfirmActivate(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-6"
            >
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                Activate This Semester?
              </h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                You are about to activate <strong>{confirmActivate.name}</strong>. All class rosters, teaching modules, and teacher schedules will align with this semester.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmActivate(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleActivate(confirmActivate)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-sm"
                >
                  Yes, Activate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Delete Semester */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-6"
            >
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                Delete Semester?
              </h3>
              <p className="text-xs text-zinc-500 mb-5">
                Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
