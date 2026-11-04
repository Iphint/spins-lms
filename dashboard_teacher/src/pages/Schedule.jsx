import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  BookOpen,
  Users,
  MapPin,
  Plus,
  X,
  Pencil,
  Trash2,
  CalendarDays,
  Layers,
  Grid3X3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  Sparkles,
  Check,
  FileText,
  Bookmark,
  Award,
  Filter,
  UserCheck,
  ListPlus,
  Copy,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ALIASES = {
  monday: 'Monday',
  senin: 'Monday',
  tuesday: 'Tuesday',
  selasa: 'Tuesday',
  wednesday: 'Wednesday',
  rabu: 'Wednesday',
  thursday: 'Thursday',
  kamis: 'Thursday',
  friday: 'Friday',
  jumat: 'Friday',
  saturday: 'Saturday',
  sabtu: 'Saturday',
  sunday: 'Sunday',
  minggu: 'Sunday',
};
const normalizeDay = (d) => DAY_ALIASES[d?.trim()?.toLowerCase()] || d || 'Monday';

const HOURS = [];
for (let h = 7; h <= 16; h++) HOURS.push(`${String(h).padStart(2, '0')}:00`);

const TIME_HEIGHT = 58;

const TIME_PRESETS = [
  { label: 'Session 1 (07:30 - 09:00)', short: '07:30 - 09:00', startTime: '07:30', endTime: '09:00' },
  { label: 'Session 2 (09:00 - 10:30)', short: '09:00 - 10:30', startTime: '09:00', endTime: '10:30' },
  { label: 'Session 3 (09:30 - 11:00)', short: '09:30 - 11:00', startTime: '09:30', endTime: '11:00' },
  { label: 'Session 4 (10:30 - 12:00)', short: '10:30 - 12:00', startTime: '10:30', endTime: '12:00' },
  { label: 'Session 5 (11:00 - 12:30)', short: '11:00 - 12:30', startTime: '11:00', endTime: '12:30' },
  { label: 'Session 6 (13:00 - 14:30)', short: '13:00 - 14:30', startTime: '13:00', endTime: '14:30' },
  { label: 'Session 7 (14:30 - 16:00)', short: '14:30 - 16:00', startTime: '14:30', endTime: '16:00' },
];

const NON_OVERLAPPING_SLOTS = [
  { startTime: '07:30', endTime: '09:00' },
  { startTime: '09:15', endTime: '10:45' },
  { startTime: '11:00', endTime: '12:30' },
  { startTime: '13:00', endTime: '14:30' },
];

function parseClassScheduleHint(scheduleStr) {
  if (!scheduleStr || typeof scheduleStr !== 'string') return [];
  const parts = scheduleStr.split(/\s*(?:&|•|;)\s*/);
  const parsed = [];
  for (const part of parts) {
    const dayMatch = DAYS.find(d => part.toLowerCase().includes(d.toLowerCase())) ||
      Object.keys(DAY_ALIASES).find(k => part.toLowerCase().includes(k));
    const normalized = dayMatch ? normalizeDay(dayMatch) : null;
    const timeMatch = part.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (normalized && timeMatch) {
      parsed.push({
        day: normalized,
        startTime: timeMatch[1].padStart(5, '0'),
        endTime: timeMatch[2].padStart(5, '0'),
      });
    }
  }
  return parsed;
}

function parseBulkScheduleText(text, classes, defaultRoom = 'Coding Lab') {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n');
  let currentDay = 'Monday';
  const rows = [];

  const findClass = (token) => {
    if (!token) return null;
    const clean = token.trim().toLowerCase().replace(/^class\s+/i, '').replace(/^kelas\s+/i, '').replace(/^cls-/i, '');
    return (
      classes.find(c => c.id.toLowerCase() === token.trim().toLowerCase()) ||
      classes.find(c => c.name.toLowerCase() === token.trim().toLowerCase()) ||
      classes.find(c => `${c.grade}${c.section}`.toLowerCase() === clean) ||
      classes.find(c => c.name.toLowerCase().replace(/^(?:class|kelas)\s+/i, '') === clean)
    );
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if the line is just a day header like "Monday" or "Senin" or "Day Monday:"
    const rawWord = line.toLowerCase().replace(/^hari\s+/i, '').replace(/^day\s+/i, '').replace(/:$/, '').trim();
    if (DAY_ALIASES[rawWord]) {
      currentDay = DAY_ALIASES[rawWord];
      continue;
    }

    // Split by | or ; or , or tab
    const segments = line.split(/\s*[|;\t]\s*/).map(s => s.trim()).filter(Boolean);
    let matchedClass = null;
    let matchedDay = null;
    let startTime = '07:30';
    let endTime = '09:00';
    let room = defaultRoom;

    for (const seg of segments) {
      const segLower = seg.toLowerCase();
      let dayFound = null;
      for (const [alias, standard] of Object.entries(DAY_ALIASES)) {
        if (segLower === alias || segLower.startsWith(alias + ' ')) {
          dayFound = standard;
          break;
        }
      }
      const timeMatch = seg.match(/(\d{1,2}:\d{2})\s*(?:-|to|s\/d|sampai|–)\s*(\d{1,2}:\d{2})/i);
      const clsMatch = findClass(seg);

      if (timeMatch) {
        startTime = timeMatch[1].padStart(5, '0');
        endTime = timeMatch[2].padStart(5, '0');
        if (dayFound && !matchedDay) matchedDay = dayFound;
        const leftover = seg.replace(timeMatch[0], '').replace(/[,:-]/g, '').trim();
        if (leftover && !matchedClass) {
          const possibleCls = findClass(leftover);
          if (possibleCls) matchedClass = possibleCls;
        }
      } else if (clsMatch && !matchedClass) {
        matchedClass = clsMatch;
      } else if (dayFound && !matchedDay) {
        matchedDay = dayFound;
      } else {
        room = seg;
      }
    }

    if (matchedClass) {
      rows.push({
        rowId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        enabled: true,
        classId: matchedClass.id,
        day: matchedDay || currentDay || 'Monday',
        startTime,
        endTime,
        room: room || matchedClass.room || defaultRoom,
        materialId: '',
      });
    }
  }

  return rows;
}

const CLASS_PALETTE = [
  { bg: '#4f46e5', light: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  { bg: '#059669', light: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { bg: '#d97706', light: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { bg: '#e11d48', light: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  { bg: '#0284c7', light: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { bg: '#7c3aed', light: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
];

export default function Schedule() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'monthly' | 'semester'

  // Server Data
  const [teacher, setTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [materialsMap, setMaterialsMap] = useState({});
  const [meetings, setMeetings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notifications & UI feedback
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Weekly View State
  const [weeklyViewMode, setWeeklyViewMode] = useState('grid'); // 'grid' | 'cards'
  const [weeklyClassFilter, setWeeklyClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [isWeeklyMode, setIsWeeklyMode] = useState(false);
  const [modalForm, setModalForm] = useState({
    classId: '',
    lessons: [{ classId: '', day: 'Monday', startTime: '07:30', endTime: '09:00', room: '', materialId: '' }],
  });

  // Bulk Schedule Modal State (Single Render Class & Time Matrix)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState('table'); // 'table' | 'text'
  const [bulkMode, setBulkMode] = useState('replace_classes'); // 'replace_classes' | 'append'
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultRoom, setBulkDefaultRoom] = useState('Coding Lab');
  const [savingBulk, setSavingBulk] = useState(false);

  // Monthly View State
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 9, 1)); // Default Oct 2025 where active semester meetings exist
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 9, 15));
  const [monthlyClassFilter, setMonthlyClassFilter] = useState('');

  // Semester Target State
  const [selectedPacingClass, setSelectedPacingClass] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [distributeStats, setDistributeStats] = useState(null);

  // Load all initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, cData, sData, mData, eData, wData, semData, allTeachers] = await Promise.all([
        api.teacher().catch(() => null),
        api.classes().catch(() => []),
        api.scheduleSlots().catch(() => []),
        api.meetings().catch(() => []),
        api.calendarEvents().catch(() => []),
        api.worksheets().catch(() => []),
        api.semesterActive().catch(() => null),
        api.teachers().catch(() => []),
      ]);

      setTeacher(tData);
      setTeachers(allTeachers || []);
      setClasses(cData || []);
      setSlots(sData || []);
      setMeetings(mData || []);
      setCalendarEvents(eData || []);
      setWorksheets(wData || []);
      setActiveSemester(semData);
      if (semData?.startDate) {
        const semStart = new Date(semData.startDate);
        setCurrentMonth(new Date(semStart.getFullYear(), semStart.getMonth(), 1));
        setSelectedDate(semStart);
      }

      if (cData && cData.length > 0) {
        if (!selectedPacingClass) setSelectedPacingClass(cData[0].id);
        const mm = {};
        for (const cls of cData) {
          const mats = await api.materials(cls.id).catch(() => []);
          mm[cls.id] = mats;
        }
        setMaterialsMap(mm);
      }
    } catch (err) {
      console.error('Failed to load schedule data:', err);
      setError('Failed to load schedule data. Make sure backend server is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick feedback timer
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Class Lookup Map & Color Map
  const classMap = useMemo(() => {
    const map = {};
    for (const c of classes) map[c.id] = c;
    return map;
  }, [classes]);

  const classColorMap = useMemo(() => {
    const map = {};
    classes.forEach((c, idx) => {
      map[c.id] = CLASS_PALETTE[idx % CLASS_PALETTE.length];
    });
    return map;
  }, [classes]);

  // Modal Handlers
  const buildAllClassBulkRows = (useExistingSlots = true) => {
    const generated = [];
    classes.forEach((cls, idx) => {
      const existingForClass = useExistingSlots ? slots.filter(s => s.classId === cls.id) : [];
      if (existingForClass.length > 0) {
        existingForClass.forEach(s => {
          generated.push({
            rowId: `row-${s.id}-${Math.random().toString(36).slice(2, 6)}`,
            enabled: true,
            classId: cls.id,
            day: normalizeDay(s.day) || 'Monday',
            startTime: s.startTime || '07:30',
            endTime: s.endTime || '09:00',
            room: s.room || cls.room || bulkDefaultRoom,
            materialId: s.materialId || '',
          });
        });
      } else {
        const parsedHint = useExistingSlots ? parseClassScheduleHint(cls.schedule) : [];
        if (parsedHint.length > 0) {
          parsedHint.forEach(h => {
            generated.push({
              rowId: `row-${cls.id}-${h.day}-${Math.random().toString(36).slice(2, 6)}`,
              enabled: true,
              classId: cls.id,
              day: h.day,
              startTime: h.startTime,
              endTime: h.endTime,
              room: cls.room || bulkDefaultRoom,
              materialId: '',
            });
          });
        } else {
          const dayChoice = DAYS[idx % DAYS.length];
          const timeSlot = NON_OVERLAPPING_SLOTS[Math.floor(idx / DAYS.length) % NON_OVERLAPPING_SLOTS.length];
          generated.push({
            rowId: `row-${cls.id}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            enabled: true,
            classId: cls.id,
            day: dayChoice,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            room: cls.room || bulkDefaultRoom,
            materialId: '',
          });
        }
      }
    });
    return generated;
  };

  const openBulkScheduleModal = (initialMode = 'replace_classes') => {
    setError('');
    setBulkTab('table');
    setBulkMode(initialMode);
    const rows = buildAllClassBulkRows(true);
    setBulkRows(rows);
    setShowBulkModal(true);
  };

  const resetBulkToOnePerClass = () => {
    const rows = buildAllClassBulkRows(false);
    setBulkRows(rows);
  };

  const autoArrangeBulkAntiConflict = () => {
    setBulkRows(prev =>
      prev.map((row, idx) => {
        const dayChoice = DAYS[idx % DAYS.length];
        const timeSlot = NON_OVERLAPPING_SLOTS[Math.floor(idx / DAYS.length) % NON_OVERLAPPING_SLOTS.length];
        return {
          ...row,
          day: dayChoice,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
        };
      })
    );
  };

  const applyRoomToAllBulk = () => {
    if (!bulkDefaultRoom.trim()) return;
    setBulkRows(prev => prev.map(r => ({ ...r, room: bulkDefaultRoom.trim() })));
  };

  const updateBulkRow = (rowId, field, value) => {
    setBulkRows(prev =>
      prev.map(r => {
        if (r.rowId !== rowId) return r;
        const updated = { ...r, [field]: value };
        if (field === 'classId') {
          const targetCls = classMap[value];
          if (targetCls?.room && (!r.room || r.room === 'Ruang 301')) {
            updated.room = targetCls.room;
          }
          updated.materialId = '';
        }
        return updated;
      })
    );
  };

  const applyPresetToBulkRow = (rowId, presetIdx) => {
    const preset = TIME_PRESETS[presetIdx];
    if (!preset) return;
    setBulkRows(prev =>
      prev.map(r =>
        r.rowId === rowId
          ? { ...r, startTime: preset.startTime, endTime: preset.endTime }
          : r
      )
    );
  };

  const duplicateBulkRow = (idx) => {
    setBulkRows(prev => {
      const source = prev[idx];
      if (!source) return prev;
      const nextDayIdx = (DAYS.indexOf(source.day) + 2) % DAYS.length;
      const copy = {
        ...source,
        rowId: `row-${source.classId}-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        day: DAYS[nextDayIdx] || 'Wednesday',
        enabled: true,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const addNewBulkRow = (defaultDay = 'Monday') => {
    const defaultCls = classes[0];
    setBulkRows(prev => [
      ...prev,
      {
        rowId: `row-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        enabled: true,
        classId: defaultCls?.id || '',
        day: defaultDay,
        startTime: '07:30',
        endTime: '09:00',
        room: defaultCls?.room || bulkDefaultRoom,
        materialId: '',
      },
    ]);
  };

  const removeBulkRow = (rowId) => {
    setBulkRows(prev => prev.filter(r => r.rowId !== rowId));
  };

  const toggleAllBulkRows = (checked) => {
    setBulkRows(prev => prev.map(r => ({ ...r, enabled: checked })));
  };

  const generateSampleBulkText = () => {
    const lines = [];
    DAYS.forEach((day, dIdx) => {
      const dayClasses = classes.filter((_, cIdx) => cIdx % DAYS.length === dIdx);
      if (dayClasses.length > 0) {
        lines.push(day);
        dayClasses.forEach((c, slotIdx) => {
          const t = NON_OVERLAPPING_SLOTS[slotIdx % NON_OVERLAPPING_SLOTS.length];
          lines.push(`${c.grade}${c.section} | ${t.startTime} - ${t.endTime} | ${c.room || 'Coding Lab'}`);
        });
        lines.push('');
      }
    });
    setBulkText(lines.join('\n').trim());
  };

  const handleApplyBulkTextToTable = () => {
    const parsed = parseBulkScheduleText(bulkText, classes, bulkDefaultRoom);
    if (parsed.length === 0) {
      setError('Unrecognized text format or class name not found. Use format: 7P | Monday | 07:30 - 09:00');
      return;
    }
    setError('');
    setBulkRows(parsed);
    setBulkTab('table');
  };

  // Detect time conflicts among enabled rows in bulkRows
  const bulkConflictRowIds = useMemo(() => {
    const conflicts = new Set();
    const active = bulkRows.filter(r => r.enabled && r.day && r.startTime && r.endTime);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        if (a.day === b.day && a.startTime < b.endTime && a.endTime > b.startTime) {
          conflicts.add(a.rowId);
          conflicts.add(b.rowId);
        }
      }
    }
    return conflicts;
  }, [bulkRows]);

  const handleSaveBulkSchedule = async () => {
    setError('');
    const enabledRows = bulkRows.filter(r => r.enabled && r.classId && r.day && r.startTime && r.endTime);
    if (enabledRows.length === 0) {
      setError('Select / check at least 1 class row with its teaching hours to save.');
      return;
    }

    try {
      setSavingBulk(true);
      const res = await api.bulkScheduleSlots({
        items: enabledRows.map(r => ({
          classId: r.classId,
          day: r.day,
          startTime: r.startTime,
          endTime: r.endTime,
          room: r.room,
          materialId: r.materialId || null,
        })),
        mode: bulkMode,
      });
      setShowBulkModal(false);
      const [updatedSlots, updatedClasses] = await Promise.all([
        api.scheduleSlots(),
        api.classes(),
      ]);
      setSlots(updatedSlots || []);
      if (updatedClasses?.length) setClasses(updatedClasses);
      setSuccessToast(
        `Successfully saved bulk teaching schedule: ${res.totalSaved || enabledRows.length} sessions across ${res.classesCount || new Set(enabledRows.map(r => r.classId)).size} classes!`
      );
    } catch (err) {
      setError(err.message || 'Failed to save bulk schedule');
    } finally {
      setSavingBulk(false);
    }
  };

  const openCreate = (preselectedClass = '', preselectedDay = 'Monday') => {
    setEditSlot(null);
    setIsWeeklyMode(false);
    const defaultClassId = preselectedClass || weeklyClassFilter || classes[0]?.id || '';
    const defaultCls = classMap[defaultClassId] || classes[0];
    setModalForm({
      classId: defaultClassId,
      lessons: [
        {
          classId: defaultClassId,
          day: preselectedDay || 'Monday',
          startTime: '07:30',
          endTime: '09:00',
          room: defaultCls?.room || 'Coding Lab',
          materialId: '',
        },
      ],
    });
    setError('');
    setShowModal(true);
  };

  const openWeeklyWizard = (targetClassId = '') => {
    if (!targetClassId) {
      openBulkScheduleModal('replace_classes');
      return;
    }
    setEditSlot(null);
    setIsWeeklyMode(true);
    const clsId = targetClassId || classes[0]?.id || '';
    const cls = classMap[clsId];
    const existingForCls = slots.filter(s => s.classId === clsId);
    setModalForm({
      classId: clsId,
      lessons:
        existingForCls.length > 0
          ? existingForCls.map(s => ({
              classId: clsId,
              day: s.day,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room || cls?.room || 'Coding Lab',
              materialId: s.materialId || '',
            }))
          : [
              { classId: clsId, day: 'Monday', startTime: '07:30', endTime: '09:00', room: cls?.room || 'Coding Lab', materialId: '' },
              { classId: clsId, day: 'Wednesday', startTime: '07:30', endTime: '09:00', room: cls?.room || 'Coding Lab', materialId: '' },
            ],
    });
    setError('');
    setShowModal(true);
  };

  const openEditSlot = (slot) => {
    setEditSlot(slot);
    setIsWeeklyMode(false);
    setModalForm({
      classId: slot.classId,
      lessons: [{
        classId: slot.classId,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room || '',
        materialId: slot.materialId || '',
      }],
    });
    setError('');
    setShowModal(true);
  };

  const updateLesson = (idx, field, value) => {
    setModalForm(prev => {
      const lessons = [...prev.lessons];
      const updated = { ...lessons[idx], [field]: value };
      if (field === 'classId') {
        const cls = classMap[value];
        if (cls?.room) updated.room = cls.room;
        updated.materialId = '';
      }
      lessons[idx] = updated;
      return { ...prev, lessons };
    });
  };

  const addLessonRow = () => {
    const defaultClsId = modalForm.classId || classes[0]?.id || '';
    const cls = classMap[defaultClsId];
    setModalForm(prev => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          classId: defaultClsId,
          day: DAYS[prev.lessons.length % DAYS.length] || 'Thursday',
          startTime: '09:30',
          endTime: '11:00',
          room: cls?.room || 'Coding Lab',
          materialId: '',
        },
      ],
    }));
  };

  const removeLessonRow = (idx) => {
    setModalForm(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveModal = async () => {
    setError('');
    const valid = modalForm.lessons
      .map(l => ({ ...l, classId: l.classId || modalForm.classId }))
      .filter(l => l.classId && l.day && l.startTime && l.endTime);

    if (valid.length === 0) {
      setError('At least one session with class, day, start time, and end time must be specified');
      return;
    }

    try {
      if (editSlot && !isWeeklyMode) {
        await api.updateScheduleSlot(editSlot.id, valid[0]);
        setSuccessToast(`Schedule slot for ${classMap[valid[0].classId]?.name || ''} on ${valid[0].day} updated successfully!`);
      } else if (isWeeklyMode) {
        await api.setWeeklySchedule({ classId: modalForm.classId, lessons: valid });
        setSuccessToast(`Weekly schedule for ${classMap[modalForm.classId]?.name || ''} (${valid.length} sessions) saved successfully!`);
      } else {
        await api.bulkScheduleSlots({ items: valid, mode: 'append' });
        setSuccessToast(`Successfully added ${valid.length} teaching schedule sessions!`);
      }
      setShowModal(false);
      const updatedSlots = await api.scheduleSlots();
      setSlots(updatedSlots);
    } catch (err) {
      setError(err.message || 'Failed to save schedule slot');
    }
  };

  const handleDeleteSlot = async (slot) => {
    const clsName = classMap[slot.classId]?.name || slot.classId;
    if (!window.confirm(`Delete teaching schedule for class ${clsName} on ${slot.day} (${slot.startTime} - ${slot.endTime})?`)) {
      return;
    }
    try {
      await api.deleteScheduleSlot(slot.id);
      setSuccessToast(`Schedule for class ${clsName} on ${slot.day} deleted successfully.`);
      const updatedSlots = await api.scheduleSlots();
      setSlots(updatedSlots);
    } catch (err) {
      setError(err.message || 'Failed to delete schedule slot');
    }
  };

  // Auto distribute materials
  const handleAutoDistribute = async (targetClassId) => {
    const cId = targetClassId || selectedPacingClass;
    if (!cId) return;
    try {
      setDistributing(true);
      setError('');
      const result = await api.distributeMaterials(cId);
      setDistributeStats(result.stats);
      setSuccessToast(
        `Successfully mapped ${result.stats.totalMaterials} materials of class ${classMap[cId]?.name} to ${result.stats.weeklySlots} weekly slots (${result.stats.weeksNeeded} learning weeks)!`
      );
      const updatedSlots = await api.scheduleSlots();
      setSlots(updatedSlots);
    } catch (err) {
      setError(err.message || 'Failed to auto-distribute materials');
    } finally {
      setDistributing(false);
    }
  };

  // Filtered slots for Weekly View
  const filteredSlots = useMemo(() => {
    let result = slots;
    if (teacherFilter !== 'all') {
      result = result.filter(s => (s.class?.teacherId === teacherFilter || classMap[s.classId]?.teacherId === teacherFilter));
    }
    if (weeklyClassFilter) {
      result = result.filter(s => s.classId === weeklyClassFilter);
    }
    return result;
  }, [slots, teacherFilter, weeklyClassFilter, classMap]);

  const slotsByDay = useMemo(() => {
    const map = {};
    for (const d of DAYS) {
      map[d] = filteredSlots.filter(s => normalizeDay(s.day) === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredSlots]);

  const getSlotStyle = (slot) => {
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const top = ((sh - 7) * 60 + sm) * (TIME_HEIGHT / 60);
    const height = ((eh - sh) * 60 + (em - sm)) * (TIME_HEIGHT / 60);
    return { top, height };
  };

  // Calendar calculations for Monthly View
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Selected date events & meetings
  const selectedDateStr = useMemo(() => {
    return format(selectedDate, 'yyyy-MM-dd');
  }, [selectedDate]);

  const selectedDayMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchDate = m.date === selectedDateStr;
      const matchClass = !monthlyClassFilter || m.classId === monthlyClassFilter;
      return matchDate && matchClass;
    });
  }, [meetings, selectedDateStr, monthlyClassFilter]);

  const selectedDayWorksheets = useMemo(() => {
    return worksheets.filter(w => {
      const matchDate = w.dueDate === selectedDateStr || w.assignedDate === selectedDateStr;
      const matchClass = !monthlyClassFilter || w.classId === monthlyClassFilter;
      return matchDate && matchClass;
    });
  }, [worksheets, selectedDateStr, monthlyClassFilter]);

  const selectedDayEvents = useMemo(() => {
    return calendarEvents.filter(e => e.date === selectedDateStr);
  }, [calendarEvents, selectedDateStr]);

  // Day name for recurring slot hint
  const recurringDaySlots = useMemo(() => {
    const engDay = format(selectedDate, 'EEEE');
    if (!DAYS.includes(engDay)) return [];
    return slots.filter(s => {
      const matchDay = normalizeDay(s.day) === engDay;
      const matchClass = !monthlyClassFilter || s.classId === monthlyClassFilter;
      return matchDay && matchClass;
    });
  }, [slots, selectedDate, monthlyClassFilter]);

  // Pacing calculations for Semester Target View
  const currentPacingClass = useMemo(() => {
    return classMap[selectedPacingClass] || classes[0] || null;
  }, [classMap, selectedPacingClass, classes]);

  const currentPacingMaterials = useMemo(() => {
    if (!currentPacingClass) return [];
    return materialsMap[currentPacingClass.id] || [];
  }, [currentPacingClass, materialsMap]);

  const currentPacingMeetings = useMemo(() => {
    if (!currentPacingClass) return [];
    return meetings.filter(m => m.classId === currentPacingClass.id);
  }, [currentPacingClass, meetings]);

  const semesterSummary = useMemo(() => {
    const totalMeetings = activeSemester?.totalMeetings || 16;
    const completedMeetings = activeSemester?.completedMeetings || 0;
    const totalTargets = activeSemester?.learningTargets || 16;
    const completedTargets = activeSemester?.completedTargets || 0;
    const progressPercent = activeSemester?.progress || (totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0);

    let rangeStr = 'Periode Aktif Semester';
    if (activeSemester?.startDate && activeSemester?.endDate) {
      try {
        const s = new Date(activeSemester.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const e = new Date(activeSemester.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        rangeStr = `${s} - ${e}`;
      } catch {
        rangeStr = `${activeSemester.startDate} - ${activeSemester.endDate}`;
      }
    }

    return {
      totalMeetings,
      completedMeetings,
      totalTargets,
      completedTargets,
      progressPercent,
      semesterName: activeSemester?.name || 'Semester Aktif',
      dateRange: rangeStr,
    };
  }, [activeSemester]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teaching Schedule & Targets" description="Loading schedule module..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Teaching Schedule & Targets"
        description={`Manage weekly routines, monthly agendas, and curriculum targets for ${teacher?.subject || 'Coding & AI'}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openBulkScheduleModal('replace_classes')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
          >
            <ListPlus className="w-4 h-4 text-indigo-200" />
            <span>Bulk Schedule Entry (All Classes)</span>
          </button>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        </div>
      </PageHeader>

      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 font-medium">{successToast}</div>
            <button onClick={() => setSuccessToast('')} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-Pillar Tab Navigation Bar */}
      <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>1. Weekly Timetable</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              {slots.length} Sessions
            </span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>2. Monthly Agenda</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
              {meetings.length} Meetings
            </span>
          </button>

          <button
            onClick={() => setActiveTab('semester')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'semester'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>3. Semester Targets</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              {semesterSummary.progressPercent}%
            </span>
          </button>
        </div>

        {/* Quick Context badge */}
        {isAdmin ? (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Supervision Mode: Monitoring All Teachers' Schedules ({teachers.length} Teachers)</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Subject: <strong className="text-zinc-800 dark:text-zinc-200">{teacher?.subject || 'Coding & AI'}</strong></span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>{classes.length} Supervised Classes</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WEEKLY TIMETABLE                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Teacher Filter:</span>
                  </div>
                  <select
                    value={teacherFilter}
                    onChange={e => setTeacherFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">All Teachers ({teachers.length})</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject || 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Class Filter:</span>
              </div>
              <select
                value={weeklyClassFilter}
                onChange={e => setWeeklyClassFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">All Classes ({slots.length} Sessions)</option>
                {classes.map(c => {
                  const classSlotCount = slots.filter(s => s.classId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({classSlotCount} Sessions / week)
                    </option>
                  );
                })}
              </select>

              {(weeklyClassFilter || teacherFilter) && (
                <button
                  onClick={() => {
                    setWeeklyClassFilter('');
                    setTeacherFilter('');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* View switcher & Quick Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button
                  onClick={() => setWeeklyViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    weeklyViewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Time Grid</span>
                </button>
                <button
                  onClick={() => setWeeklyViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    weeklyViewMode === 'cards'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Daily List</span>
                </button>
              </div>

              <button
                onClick={() =>
                  weeklyClassFilter
                    ? openWeeklyWizard(weeklyClassFilter)
                    : openBulkScheduleModal('replace_classes')
                }
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950 rounded-xl transition-colors cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>{weeklyClassFilter ? 'Set Pattern for Class' : 'Bulk Entry Classes & Times'}</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Timetable Grid */}
          {weeklyViewMode === 'grid' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 overflow-x-auto shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-indigo-500" />
                    Weekly Teaching Timetable (Monday – Friday)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Click on any session block to edit hours/room, or click Add Session above to allocate a new time slot.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-mono">07:00 - 17:00 WIB</span>
                </div>
              </div>

              <div className="min-w-[800px]">
                {/* Day Header Row */}
                <div className="flex" style={{ paddingLeft: 60 }}>
                  {DAYS.map(day => (
                    <div
                      key={day}
                      className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 py-2.5 border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 first:border-l-0 rounded-t-lg"
                    >
                      {day}
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-400">
                        ({(slotsByDay[day] || []).length} sessions)
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="relative" style={{ height: (HOURS.length - 1) * TIME_HEIGHT }}>
                  {HOURS.map((h, i) =>
                    i < HOURS.length - 1 ? (
                      <div key={h} className="flex" style={{ height: TIME_HEIGHT }}>
                        <div className="w-[60px] shrink-0 text-[11px] font-mono text-zinc-400 pr-2.5 text-right pt-0 -translate-y-2.5 select-none">
                          {h}
                        </div>
                        {DAYS.map(day => (
                          <div
                            key={day}
                            className="flex-1 border-t border-l border-zinc-100 dark:border-zinc-800/60 relative hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                          />
                        ))}
                      </div>
                    ) : null
                  )}

                  {/* Render Slot Blocks */}
                  {DAYS.map((day, dayIdx) =>
                    (slotsByDay[day] || []).map(slot => {
                      const cls = classMap[slot.classId];
                      const colorInfo = classColorMap[slot.classId] || CLASS_PALETTE[0];
                      const style = getSlotStyle(slot);
                      const mat = slot.material;

                      return (
                        <motion.div
                          key={slot.id}
                          onClick={() => openEditSlot(slot)}
                          whileHover={{ scale: 1.015, zIndex: 10 }}
                          className="absolute cursor-pointer rounded-xl p-2.5 overflow-hidden text-white shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                          style={{
                            left: `calc(60px + ${dayIdx} * (100% - 60px) / 5 + 3px)`,
                            width: `calc((100% - 60px) / 5 - 6px)`,
                            top: style.top + 2,
                            height: Math.max(style.height - 4, 38),
                            backgroundColor: colorInfo.bg,
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs truncate">{cls?.name || slot.classId}</span>
                              <span className="text-[10px] font-mono opacity-90 px-1.5 py-0.5 rounded bg-black/20">
                                {slot.startTime}-{slot.endTime}
                              </span>
                            </div>
                            {(cls?.teacher?.name || slot.class?.teacher?.name) && (
                              <div className="text-[10px] font-medium opacity-90 truncate flex items-center gap-1 mt-0.5">
                                <UserCheck className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{cls?.teacher?.name || slot.class?.teacher?.name}</span>
                              </div>
                            )}
                            <div className="text-[10px] opacity-90 truncate mt-0.5 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{slot.room || cls?.room || 'Classroom'}</span>
                            </div>
                          </div>

                          {mat && style.height > 60 && (
                            <div className="text-[10px] opacity-80 truncate border-t border-white/20 pt-1 mt-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span className="truncate">{mat.topic}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Daily Cards View */}
          {weeklyViewMode === 'cards' && (
            <div className="space-y-4">
              {DAYS.map((day, dIdx) => {
                const daySlots = slotsByDay[day] || [];
                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dIdx * 0.04 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{day}</h4>
                        <span className="text-xs text-zinc-400 font-medium">({daySlots.length} sessions)</span>
                      </div>
                      <button
                        onClick={() => openCreate('', day)}
                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add on {day}
                      </button>
                    </div>

                    {daySlots.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        No teaching schedule allocated for {day}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {daySlots.map(item => {
                          const cls = classMap[item.classId];
                          const colorInfo = classColorMap[item.classId] || CLASS_PALETTE[0];
                          const mat = item.material;

                          return (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between gap-3 group"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span
                                    className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                                    style={{ backgroundColor: colorInfo.bg }}
                                  >
                                    {cls?.name || item.classId}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditSlot(item)}
                                      className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-indigo-600"
                                      title="Edit Session"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSlot(item)}
                                      className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-rose-600"
                                      title="Delete Session"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                  {(cls?.teacher?.name || item.class?.teacher?.name) && (
                                    <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                                      <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span>{cls?.teacher?.name || item.class?.teacher?.name}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>{item.startTime} - {item.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{item.room || cls?.room || 'Classroom'}</span>
                                  </div>
                                </div>

                                {mat && (
                                  <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                                    <div className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                      {mat.topic}
                                    </div>
                                    <div className="mt-1">
                                      <StatusBadge status={mat.status} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AGENDA BULANAN (MONTHLY CALENDAR & ROADMAP)                        */}
      {/* ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Calendar Navigation & Legend */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {/* Month selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 font-bold text-sm text-zinc-900 dark:text-white capitalize min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: enUS })}
                </div>
                <button
                  onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  const targetDate = activeSemester?.startDate ? new Date(activeSemester.startDate) : new Date();
                  setCurrentMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
                  setSelectedDate(targetDate);
                }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              >
                Back to Active Semester {activeSemester ? `(${activeSemester.name})` : ''}
              </button>
            </div>

            {/* Filter by class */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Class:</span>
              </div>
              <select
                value={monthlyClassFilter}
                onChange={e => setMonthlyClassFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Color legend chips */}
              <div className="hidden lg:flex items-center gap-3 text-xs text-zinc-500 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" /> In-Person Session
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Worksheet Due
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Exam/Evaluation
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Holiday/Event
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Calendar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Month Grid (7 Cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 py-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="uppercase tracking-wider">{d}</div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(dayDate => {
                  const dateStr = format(dayDate, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(dayDate, currentMonth);
                  const isSelected = isSameDay(dayDate, selectedDate);
                  const isTodayDate = isToday(dayDate);

                  // Count meetings on this day
                  const dayMtgs = meetings.filter(m => {
                    const match = m.date === dateStr;
                    return match && (!monthlyClassFilter || m.classId === monthlyClassFilter);
                  });

                  // Count worksheets on this day
                  const dayWks = worksheets.filter(w => {
                    const match = w.dueDate === dateStr;
                    return match && (!monthlyClassFilter || w.classId === monthlyClassFilter);
                  });

                  // Events
                  const dayEvts = calendarEvents.filter(e => e.date === dateStr);

                  return (
                    <motion.div
                      key={dateStr}
                      whileHover={{ scale: 0.98 }}
                      onClick={() => setSelectedDate(dayDate)}
                      className={`min-h-[82px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 font-semibold'
                          : isTodayDate
                          ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20'
                          : isCurrentMonth
                          ? 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-800/20 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50'
                          : 'border-transparent bg-transparent opacity-30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold'
                              : isTodayDate
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {format(dayDate, 'd')}
                        </span>

                        {dayMtgs.length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-1 rounded">
                            {dayMtgs.length} sessions
                          </span>
                        )}
                      </div>

                      {/* Small visual indicator dots/tags */}
                      <div className="space-y-1 mt-1">
                        {dayMtgs.slice(0, 1).map(m => (
                          <div
                            key={m.id}
                            className="text-[10px] px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 truncate font-medium"
                          >
                            {classMap[m.classId]?.name || m.classId}
                          </div>
                        ))}
                        {dayWks.length > 0 && (
                          <div className="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 truncate">
                            Worksheet Due
                          </div>
                        )}
                        {dayEvts.length > 0 && (
                          <div className="text-[9px] px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 truncate">
                            {dayEvts[0].title}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Date Agenda Details */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                  <div>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                      Daily Agenda
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white capitalize">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: enUS })}
                    </h3>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <CalendarIcon className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>

                {/* Agenda Content */}
                <div className="space-y-4">
                  {/* 1. Actual Meetings */}
                  {selectedDayMeetings.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        Teaching Sessions ({selectedDayMeetings.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDayMeetings.map(mtg => {
                          const cls = classMap[mtg.classId];
                          const isDone = mtg.status === 'completed';
                          return (
                            <div
                              key={mtg.id}
                              className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:border-indigo-300 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                                  {cls?.name || mtg.classId} · Meeting {mtg.meetingNumber}
                                </span>
                                <StatusBadge status={mtg.status} />
                              </div>
                              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                                {mtg.topic}
                              </p>
                              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                                {mtg.learningObjective || 'Regular semester learning objective.'}
                              </p>
                              {isDone && (
                                <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Session recorded in Teacher Journal
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Worksheets Due */}
                  {selectedDayWorksheets.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        Worksheet Submission Deadlines ({selectedDayWorksheets.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDayWorksheets.map(ws => (
                          <div
                            key={ws.id}
                            className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{ws.title}</span>
                              <span className="text-[10px] text-amber-700 font-medium">Due: {ws.dueDate}</span>
                            </div>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">{ws.topic}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Calendar Events (Holidays / Exams) */}
                  {selectedDayEvents.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-rose-500" />
                        Calendar Events & Activities
                      </h4>
                      <div className="space-y-2">
                        {selectedDayEvents.map(evt => (
                          <div
                            key={evt.id}
                            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: evt.color || '#6366f1' }} />
                            <div>
                              <div className="text-xs font-bold text-zinc-900 dark:text-white">{evt.title}</div>
                              <div className="text-[10px] text-zinc-500 capitalize">{evt.type}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Recurring Routine Slot fallback */}
                  {recurringDaySlots.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Routine Timetable for {selectedDayIndo}
                      </h4>
                      <div className="space-y-1.5">
                        {recurringDaySlots.map(s => (
                          <div
                            key={s.id}
                            className="text-xs flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          >
                            <span className="font-medium">{classMap[s.classId]?.name || s.classId}</span>
                            <span className="font-mono text-[11px] text-zinc-500">{s.startTime} - {s.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {selectedDayMeetings.length === 0 &&
                    selectedDayWorksheets.length === 0 &&
                    selectedDayEvents.length === 0 &&
                    recurringDaySlots.length === 0 && (
                      <div className="py-8 text-center text-xs text-zinc-400">
                        No teaching schedule or calendar events on this date.
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SEMESTER TARGETS & PACING                                          */}
      {/* ========================================================================= */}
      {activeTab === 'semester' && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Meeting Progress</span>
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <CalendarDays className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {semesterSummary.completedMeetings} <span className="text-sm font-normal text-zinc-400">/ {semesterSummary.totalMeetings} Sessions</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((semesterSummary.completedMeetings / semesterSummary.totalMeetings) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 inline-block">
                  {Math.round((semesterSummary.completedMeetings / semesterSummary.totalMeetings) * 100)}% completed
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Curriculum Topics (LO)</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {semesterSummary.completedTargets} <span className="text-sm font-normal text-zinc-400">/ {semesterSummary.totalTargets} Topics</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((semesterSummary.completedTargets / semesterSummary.totalTargets) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 inline-block">
                  {Math.round((semesterSummary.completedTargets / semesterSummary.totalTargets) * 100)}% topics completed
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Total Teaching Classes</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{classes.length} Classes</div>
                <p className="text-xs text-zinc-500 mt-2">
                  Active students enrolled in this semester's syllabus.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Semester Period</span>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Target className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {semesterSummary.semesterName}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{semesterSummary.dateRange}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Active Semester
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Distribute Banner / Tool */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                Curriculum Pacing Distribution Assistant
              </div>
              <h3 className="text-lg font-bold mb-2">
                Map All Syllabus Materials to Weekly Schedule
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                This intelligent feature sequentially maps curriculum modules ({teacher?.subject || 'Coding & AI'}) to the selected class's weekly schedule slots, automatically generating estimated completion weeks and a learning roadmap.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={selectedPacingClass}
                  onChange={e => {
                    setSelectedPacingClass(e.target.value);
                    setDistributeStats(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-white text-zinc-900 text-xs font-medium outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({materialsMap[c.id]?.length || 0} Materials · {slots.filter(s => s.classId === c.id).length} slots/week)
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleAutoDistribute(selectedPacingClass)}
                  disabled={distributing || !selectedPacingClass}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{distributing ? 'Processing...' : 'Apply Auto-Distribution'}</span>
                </button>
              </div>

              {distributeStats && (
                <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs text-white">
                  ✓ Successfully distributed <strong>{distributeStats.totalMaterials} materials</strong> into{' '}
                  <strong>{distributeStats.weeklySlots} weekly teaching slots</strong> (estimated{' '}
                  <strong>{distributeStats.weeksNeeded} weeks</strong>).
                </div>
              )}
            </div>
          </div>

          {/* Pacing Curriculum Matrix Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  Syllabus Pacing & Completion: {currentPacingClass?.name || 'Class'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Module progression, in-person meeting correlation, and student completion status.
                </p>
              </div>

              {/* Class Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {classes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedPacingClass(c.id);
                      setDistributeStats(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedPacingClass === c.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3 w-16">No</th>
                    <th className="pb-3 px-3">Syllabus Topic / Module</th>
                    <th className="pb-3 px-3">Learning Objective</th>
                    <th className="pb-3 px-3 w-36">Estimated Meeting</th>
                    <th className="pb-3 px-3 w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {currentPacingMaterials.map((mat, mIdx) => {
                    const linkedMeeting = currentPacingMeetings.find(m => m.materialId === mat.id || m.meetingNumber === mat.orderNumber);
                    const isActive = mat.status === 'active';

                    return (
                      <tr
                        key={mat.id}
                        className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors ${
                          isActive ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-zinc-400">
                          #{String(mat.orderNumber || mIdx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                            {mat.topic}
                          </div>
                          {isActive && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              ★ Currently active this week
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {mat.learningObjective || mat.description || 'Master core syllabus concepts and applications.'}
                        </td>
                        <td className="py-3 px-3">
                          {linkedMeeting ? (
                            <div>
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                Meeting {linkedMeeting.meetingNumber}
                              </span>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                {linkedMeeting.date}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Meeting #{mat.orderNumber}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={mat.status} />
                        </td>
                      </tr>
                    );
                  })}
                  {currentPacingMaterials.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        No syllabus modules registered for this class yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT / SETUP TEACHING SCHEDULE                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    {editSlot && !isWeeklyMode
                      ? 'Edit Teaching Schedule Session'
                      : isWeeklyMode
                      ? `Set Weekly Schedule Pattern — ${classMap[modalForm.classId]?.name || ''}`
                      : 'Add Teaching Schedule Session (Class & Time)'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {editSlot && !isWeeklyMode
                      ? 'Update teaching hours or room for this schedule slot.'
                      : 'Select class, day, and teaching hours. You can also add multiple classes at once.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!editSlot && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        openBulkScheduleModal('replace_classes');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Bulk All Classes Mode</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 shrink-0">
                  {error}
                </div>
              )}

              {/* Class Selector */}
              {(editSlot || isWeeklyMode) && (
                <div className="mb-4 shrink-0">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Target Supervised Class
                  </label>
                  <select
                    value={modalForm.classId}
                    disabled={Boolean(editSlot)}
                    onChange={e =>
                      setModalForm(prev => ({
                        ...prev,
                        classId: e.target.value,
                        lessons: prev.lessons.map(l => ({ ...l, classId: e.target.value })),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Room {c.room || 'Classroom'} ({c.studentCount || 0} Students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lesson Rows */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {modalForm.lessons.map((lesson, idx) => {
                  const rowClassId = lesson.classId || modalForm.classId;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Teaching Session #{idx + 1}
                        </span>
                        {/* Quick Time Preset Chips */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-zinc-400 mr-1">Quick Time Select:</span>
                          {TIME_PRESETS.slice(0, 4).map((p, pIdx) => {
                            const isMatch = lesson.startTime === p.startTime && lesson.endTime === p.endTime;
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  updateLesson(idx, 'startTime', p.startTime);
                                  updateLesson(idx, 'endTime', p.endTime);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                                  isMatch
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400'
                                }`}
                              >
                                {p.short}
                              </button>
                            );
                          })}
                          {modalForm.lessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLessonRow(idx)}
                              className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer ml-1"
                              title="Delete Session"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 ${!editSlot && !isWeeklyMode ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2.5`}>
                        {!editSlot && !isWeeklyMode && (
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Class</label>
                            <select
                              value={rowClassId}
                              onChange={e => updateLesson(idx, 'classId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white"
                            >
                              {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Day</label>
                          <select
                            value={lesson.day}
                            onChange={e => updateLesson(idx, 'day', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
                          >
                            {DAYS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={lesson.startTime}
                            onChange={e => updateLesson(idx, 'startTime', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">End Time</label>
                          <input
                            type="time"
                            value={lesson.endTime}
                            onChange={e => updateLesson(idx, 'endTime', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Room</label>
                          <input
                            type="text"
                            value={lesson.room}
                            onChange={e => updateLesson(idx, 'room', e.target.value)}
                            placeholder="Coding Lab"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Syllabus Topic (Optional)
                        </label>
                        <select
                          value={lesson.materialId}
                          onChange={e => updateLesson(idx, 'materialId', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <option value="">— Leave empty or determine automatically —</option>
                          {(materialsMap[rowClassId] || []).map(m => (
                            <option key={m.id} value={m.id}>
                              #{m.orderNumber} - {m.topic} ({m.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add lesson button */}
              {!editSlot && (
                <div className="pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={addLessonRow}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Class & Time Row
                  </button>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {editSlot && !isWeeklyMode
                      ? 'Save Changes'
                      : `Save Schedule (${modalForm.lessons.length} Sessions)`}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: BULK INPUT JADWAL MENGAJAR (SEKALI RENDER KELAS & JAM)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowBulkModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-5xl p-5 sm:p-6 max-h-[92vh] flex flex-col z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <ListPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        Bulk Teaching Schedule Entry — Single Render Classes & Hours
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        All supervised classes are displayed directly in a single table. Set days, start times, end times, and rooms at once without leaving the page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Tab Switcher: Table vs Text */}
                  <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setBulkTab('table')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        bulkTab === 'table'
                          ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      Classes & Hours Table ({bulkRows.filter(r => r.enabled).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!bulkText.trim()) generateSampleBulkText();
                        setBulkTab('text');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        bulkTab === 'text'
                          ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      Copy-Paste Text
                    </button>
                  </div>

                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 shrink-0">
                  {error}
                </div>
              )}

              {/* TAB 1: SINGLE-RENDER TABLE OF ALL CLASSES & TIMES */}
              {bulkTab === 'table' && (
                <>
                  {/* Quick Action Toolbar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={autoArrangeBulkAntiConflict}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        title="Automatically organize days and times for all classes to prevent conflicts"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Auto-Arrange Hours (Conflict-Free)</span>
                      </button>

                      <button
                        type="button"
                        onClick={resetBulkToOnePerClass}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Load 1 Row / Class ({classes.length} Classes)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addNewBulkRow('Monday')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Row</span>
                      </button>
                    </div>

                    {/* Bulk Room Filler */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-500 font-medium">Bulk Room:</span>
                      <input
                        type="text"
                        value={bulkDefaultRoom}
                        onChange={e => setBulkDefaultRoom(e.target.value)}
                        placeholder="Coding Lab"
                        className="w-32 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={applyRoomToAllBulk}
                        className="px-2.5 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Apply to All
                      </button>
                    </div>
                  </div>

                  {/* Conflict Warning Banner */}
                  {bulkConflictRowIds.size > 0 && (
                    <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300 shrink-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Detected <strong>{bulkConflictRowIds.size} schedule rows</strong> with overlapping days and hours (conflict).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={autoArrangeBulkAntiConflict}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                      >
                        Auto-Resolve Conflicts
                      </button>
                    </div>
                  )}

                  {/* Single-Render Table */}
                  <div className="mt-3 flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-zinc-100/95 dark:bg-zinc-800/95 backdrop-blur-xs text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={bulkRows.length > 0 && bulkRows.every(r => r.enabled)}
                              onChange={e => toggleAllBulkRows(e.target.checked)}
                              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              title="Select All Rows"
                            />
                          </th>
                          <th className="py-2.5 px-2.5 min-w-[140px]">Class</th>
                          <th className="py-2.5 px-2.5 min-w-[115px]">Day</th>
                          <th className="py-2.5 px-2.5 min-w-[155px]">Quick Time Select</th>
                          <th className="py-2.5 px-2.5 min-w-[110px]">Start Time</th>
                          <th className="py-2.5 px-2.5 min-w-[110px]">End Time</th>
                          <th className="py-2.5 px-2.5 min-w-[130px]">Room</th>
                          <th className="py-2.5 px-3 text-right min-w-[95px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {bulkRows.map((row, idx) => {
                          const colorInfo = classColorMap[row.classId] || CLASS_PALETTE[0];
                          const isConflict = row.enabled && bulkConflictRowIds.has(row.rowId);
                          const matchedPresetIdx = TIME_PRESETS.findIndex(
                            p => p.startTime === row.startTime && p.endTime === row.endTime
                          );

                          return (
                            <tr
                              key={row.rowId}
                              className={`transition-colors ${
                                !row.enabled
                                  ? 'opacity-45 bg-zinc-50/40 dark:bg-zinc-900/40'
                                  : isConflict
                                  ? 'bg-amber-50/70 dark:bg-amber-950/25'
                                  : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={row.enabled}
                                  onChange={e => updateBulkRow(row.rowId, 'enabled', e.target.checked)}
                                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>

                              {/* Class Select */}
                              <td className="py-2 px-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: colorInfo.bg }}
                                  />
                                  <select
                                    value={row.classId}
                                    onChange={e => updateBulkRow(row.rowId, 'classId', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                  >
                                    {classes.map(c => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              {/* Day Select */}
                              <td className="py-2 px-2.5">
                                <select
                                  value={row.day}
                                  onChange={e => updateBulkRow(row.rowId, 'day', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold text-zinc-800 dark:text-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                  {DAYS.map(d => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Quick Preset Time Select */}
                              <td className="py-2 px-2.5">
                                <select
                                  value={matchedPresetIdx >= 0 ? matchedPresetIdx : ''}
                                  onChange={e => {
                                    if (e.target.value !== '') {
                                      applyPresetToBulkRow(row.rowId, Number(e.target.value));
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium text-xs outline-none"
                                >
                                  <option value="">— Custom Time —</option>
                                  {TIME_PRESETS.map((p, pIdx) => (
                                    <option key={pIdx} value={pIdx}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Start Time */}
                              <td className="py-2 px-2.5">
                                <input
                                  type="time"
                                  value={row.startTime}
                                  onChange={e => updateBulkRow(row.rowId, 'startTime', e.target.value)}
                                  className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                                    isConflict
                                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                  }`}
                                />
                              </td>

                              {/* End Time */}
                              <td className="py-2 px-2.5">
                                <input
                                  type="time"
                                  value={row.endTime}
                                  onChange={e => updateBulkRow(row.rowId, 'endTime', e.target.value)}
                                  className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                                    isConflict
                                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                  }`}
                                />
                              </td>

                              {/* Room */}
                              <td className="py-2 px-2.5">
                                <input
                                  type="text"
                                  value={row.room}
                                  onChange={e => updateBulkRow(row.rowId, 'room', e.target.value)}
                                  placeholder="Coding Lab"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                                />
                              </td>

                              {/* Actions */}
                              <td className="py-2 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => duplicateBulkRow(idx)}
                                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                    title="Add session on another day for this class"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>+Session</span>
                                  </button>
                                  {bulkRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeBulkRow(row.rowId)}
                                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                      title="Delete row"
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
                </>
              )}

              {/* TAB 2: FAST TEXT PASTE MODE */}
              {bulkTab === 'text' && (
                <div className="mt-4 flex-1 flex flex-col space-y-3 overflow-y-auto">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-indigo-900 dark:text-indigo-200">
                      <p className="font-semibold">Quick Copy-Paste Text Format:</p>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                        Type day name or directly <code className="font-mono font-bold">Class Name | Day | Start Time - End Time | Room</code>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={generateSampleBulkText}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      Load Sample for All Classes ({classes.length} Classes)
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={`Monday\n7P | 07:30 - 09:00 | Coding Lab\n7S | 09:15 - 10:45 | Coding Lab\n\nTuesday\n8P | 07:30 - 09:00 | Coding Lab`}
                    className="w-full flex-1 p-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/90 font-mono text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplyBulkTextToTable}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply Text to Classes & Hours Table</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkSaveMode"
                      checked={bulkMode === 'replace_classes'}
                      onChange={() => setBulkMode('replace_classes')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Update selected class schedules</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkSaveMode"
                      checked={bulkMode === 'append'}
                      onChange={() => setBulkMode('append')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Append without deleting previous sessions</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingBulk || bulkRows.filter(r => r.enabled).length === 0}
                    onClick={handleSaveBulkSchedule}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {savingBulk
                        ? 'Saving...'
                        : `Save All Schedules (${bulkRows.filter(r => r.enabled).length} Sessions · ${
                            new Set(bulkRows.filter(r => r.enabled).map(r => r.classId)).size
                          } Classes)`}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
