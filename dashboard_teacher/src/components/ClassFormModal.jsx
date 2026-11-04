import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Plus, Trash2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ALIASES = {
  Senin: 'Monday',
  Selasa: 'Tuesday',
  Rabu: 'Wednesday',
  Kamis: 'Thursday',
  Jumat: 'Friday',
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
};
const GRADES = [7, 8, 9, 10, 11, 12];
const SECTION_SHORTCUTS = ['P', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];

function parseSchedule(scheduleStr) {
  if (!scheduleStr) return [{ day: 'Monday', start: '07:30', end: '09:00' }];
  const slots = scheduleStr.split(' & ');
  return slots.map(slot => {
    const parts = slot.split(', ');
    const rawDay = parts[0]?.trim();
    let matchedDay = 'Monday';
    for (const [k, v] of Object.entries(DAY_ALIASES)) {
      if (rawDay?.includes(k)) {
        matchedDay = v;
        break;
      }
    }
    return {
      day: matchedDay,
      start: parts[1]?.split('-')[0] || '07:30',
      end: parts[1]?.split('-')[1] || '09:00',
    };
  });
}

function formatSlots(slots) {
  return slots.map(s => `${s.day}, ${s.start}-${s.end}`).join(' & ');
}

export default function ClassFormModal({ isOpen, onClose, onSubmit, semesters, teacherSubject, initialData }) {
  const isEdit = !!initialData;
  const parsedSlots = parseSchedule(initialData?.schedule);
  const activeSemester = (semesters || []).find(s => s.status === 'active') || semesters?.[0];
  const defaultSubject = initialData?.subject || teacherSubject || 'Coding & AI Integrated';

  const [form, setForm] = useState({
    grade: initialData?.grade || 7,
    section: initialData?.section || 'P',
    name: initialData?.name || `Class ${initialData?.grade || 7}${initialData?.section || 'P'}`,
    subject: defaultSubject,
    room: initialData?.room || '',
    scheduleSlots: parsedSlots,
    semesterId: initialData?.semesterId || activeSemester?.id || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Synchronize form when opened or when initialData changes
  useEffect(() => {
    if (isOpen) {
      const defaultGrade = initialData?.grade || 7;
      const defaultSection = initialData?.section || 'P';
      const defaultName = initialData?.name || `Class ${defaultGrade}${defaultSection}`;
      const activeSem = (semesters || []).find(s => s.status === 'active') || semesters?.[0];
      setForm({
        grade: defaultGrade,
        section: defaultSection,
        name: defaultName,
        subject: initialData?.subject || teacherSubject || 'Coding & AI Integrated',
        room: initialData?.room || '',
        scheduleSlots: parseSchedule(initialData?.schedule),
        semesterId: initialData?.semesterId || activeSem?.id || '',
      });
      setError('');
    }
  }, [isOpen, initialData, semesters, teacherSubject]);

  const updateSlot = (index, field, value) => {
    setForm(prev => {
      const slots = [...prev.scheduleSlots];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, scheduleSlots: slots };
    });
  };

  const addSlot = () => {
    const usedDays = form.scheduleSlots.map(s => s.day);
    const available = DAYS.filter(d => !usedDays.includes(d));
    setForm(prev => ({
      ...prev,
      scheduleSlots: [...prev.scheduleSlots, { day: available[0] || 'Friday', start: '07:30', end: '09:00' }],
    }));
  };

  const removeSlot = (index) => {
    setForm(prev => ({
      ...prev,
      scheduleSlots: prev.scheduleSlots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanSection = (form.section || '').trim().toUpperCase();
    if (!cleanSection) {
      setError('Class section code must be filled. Example: P, S, A, B');
      return;
    }

    const cleanSubject = (form.subject || '').trim();
    if (!cleanSubject) {
      setError('Subject must be filled. Example: Coding & AI, Computer Science');
      return;
    }

    if (form.scheduleSlots.length === 0) {
      setError('Please add at least 1 weekly schedule slot');
      return;
    }
    const daySet = new Set(form.scheduleSlots.map(s => s.day));
    if (daySet.size !== form.scheduleSlots.length) {
      setError('Each teaching session must be on a different day');
      return;
    }

    setSubmitting(true);
    try {
      const className = form.name?.trim() || `Class ${form.grade}${cleanSection}`;
      const payload = {
        name: className,
        grade: form.grade,
        section: cleanSection,
        subject: cleanSubject,
        room: form.room,
        schedule: formatSlots(form.scheduleSlots),
        semesterId: form.semesterId || activeSemester?.id || '',
        ...(initialData && {
          studentCount: initialData.studentCount,
          attendanceRate: initialData.attendanceRate,
          worksheetCompletion: initialData.worksheetCompletion,
          semesterProgress: initialData.semesterProgress,
          averageScore: initialData.averageScore,
        }),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {isEdit ? 'Edit Class Details' : 'Add New Class'}
                </h2>
                <p className="text-xs text-zinc-500">
                  {isEdit ? 'Update information and weekly schedule for this class' : 'Create a new class with grade level, section, and subject'}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Grade Level
                  </label>
                  <select
                    value={form.grade}
                    onChange={e => {
                      const newGrade = parseInt(e.target.value, 10);
                      setForm(prev => ({
                        ...prev,
                        grade: newGrade,
                        name: `Class ${newGrade}${prev.section || ''}`,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isEdit}
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Class Section (Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.section}
                    onChange={e => {
                      let val = e.target.value.toUpperCase();
                      if (val.startsWith(form.grade.toString()) && val.length > form.grade.toString().length) {
                        val = val.slice(form.grade.toString().length).replace(/^[-_ ]+/, '').trim();
                      }
                      setForm(prev => ({
                        ...prev,
                        section: val,
                        name: `Class ${prev.grade}${val}`,
                      }));
                    }}
                    placeholder="e.g. P, S, A, B"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isEdit}
                  />

                  {/* Section shortcuts */}
                  {!isEdit && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 mr-0.5">Options:</span>
                      {SECTION_SHORTCUTS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              section: s,
                              name: `Class ${prev.grade}${s}`,
                            }));
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                            form.section.toUpperCase() === s
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Class Name Preview & Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Class Name (System Display)
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                    ID: CLS-{form.grade}{(form.section || '').replace(/[^A-Z0-9]/gi, '')}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Class ${form.grade}${form.section || 'P'}`}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Example: <strong>Class 7P</strong>, <strong>Class 7S</strong>, <strong>Class 8P</strong>, etc.
                </p>
              </div>

              {/* Mata Pelajaran & Ruangan Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Subject
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g. Coding & AI, Computer Science"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Customizable (e.g. Coding & AI, Robotics, etc.).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Classroom / Room
                  </label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={e => setForm({ ...form, room: e.target.value })}
                    placeholder="e.g. AI Lab 1, Room 301"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Optional (physical classroom location).
                  </p>
                </div>
              </div>

              {/* Schedule Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Weekly Class Schedule
                  </label>
                  {form.scheduleSlots.length < 3 && (
                    <button
                      type="button"
                      onClick={addSlot}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Session
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {form.scheduleSlots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <select
                        value={slot.day}
                        onChange={e => updateSlot(i, 'day', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {DAYS.map(d => (
                          <option key={d} value={d} disabled={d !== slot.day && form.scheduleSlots.some(s => s.day === d)}>{d}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={e => updateSlot(i, 'start', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-zinc-400 text-xs">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={e => updateSlot(i, 'end', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      {form.scheduleSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(i)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
