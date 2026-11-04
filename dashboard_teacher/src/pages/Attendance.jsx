import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  Users,
  TrendingUp,
  Plus,
  X,
  CheckSquare,
  BookOpen,
  CalendarDays,
  RotateCcw,
  AlertTriangle,
  Check,
  Search,
  Download,
  Printer,
  QrCode,
  KeyRound,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  HelpCircle,
  ChevronRight,
  Filter,
  RefreshCw,
  Award,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { api } from '../utils/api';

const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', short: 'P', color: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' },
  { value: 'permission', label: 'Excused', short: 'E', color: 'sky', bg: 'bg-sky-600', text: 'text-sky-700 dark:text-sky-300', lightBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800' },
  { value: 'late', label: 'Late', short: 'L', color: 'amber', bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', lightBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' },
  { value: 'absent', label: 'Absent', short: 'A', color: 'rose', bg: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-300', lightBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' },
];

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('rollcall');

  // Core Data
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [matrixData, setMatrixData] = useState(null);

  // Selected Meeting for Roll-Call
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [rollCallMap, setRollCallMap] = useState({}); // { studentId: { status, note } }
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter in Roll-Call
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [generatingPin, setGeneratingPin] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const [editingNoteStudentId, setEditingNoteStudentId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  // Toast Helper
  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. Initial Load: Classes & Meetings
  useEffect(() => {
    async function load() {
      try {
        const [c, m] = await Promise.all([api.classes(), api.meetings()]);
        setClasses(c);
        setMeetings(m);
        if (c.length > 0) setSelectedClass(c[0].id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 2. Class Change: Load Students, Attendance Records, Materials, & Matrix
  useEffect(() => {
    if (!selectedClass) return;
    async function loadClassData() {
      setLoading(true);
      setError('');
      try {
        const [s, a, mats] = await Promise.all([
          api.students(selectedClass),
          api.attendance({ classId: selectedClass }),
          api.materials(selectedClass),
        ]);
        setStudents(s);
        setAttendanceRecords(a);
        setMaterials(mats);

        // Find or auto-select active/today meeting
        const classMts = meetings.filter(m => m.classId === selectedClass);
        if (classMts.length > 0) {
          // Prefer meeting matching active material or first meeting
          const activeMat = mats.find(mt => mt.status === 'active');
          const matchedMeeting = activeMat ? classMts.find(m => m.materialId === activeMat.id) : null;
          setSelectedMeetingId(matchedMeeting ? matchedMeeting.id : classMts[0].id);
        } else {
          setSelectedMeetingId('');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadClassData();
  }, [selectedClass, meetings]);

  // 3. Load / Initialize Roll-Call Map when selectedMeetingId or students change
  useEffect(() => {
    if (!selectedMeetingId || students.length === 0) {
      setRollCallMap({});
      return;
    }

    const map = {};
    const recordsForMeeting = attendanceRecords.filter(a => a.meetingId === selectedMeetingId);

    students.forEach(s => {
      const rec = recordsForMeeting.find(r => r.studentId === s.id);
      if (rec) {
        map[s.id] = { status: rec.status, note: rec.note || '' };
      } else {
        // Default to 'present' for easy roll-call
        map[s.id] = { status: 'present', note: '' };
      }
    });

    setRollCallMap(map);
    setHasUnsavedChanges(false);
  }, [selectedMeetingId, students, attendanceRecords]);

  // 4. Load Matrix Data when Matrix Tab is opened
  useEffect(() => {
    if (activeTab === 'matrix' && selectedClass) {
      loadMatrix();
    }
  }, [activeTab, selectedClass]);

  async function loadMatrix() {
    setLoadingMatrix(true);
    try {
      const res = await api.attendanceMatrix(selectedClass);
      setMatrixData(res);
    } catch (err) {
      setError(`Failed to load matrix summary: ${err.message}`);
    } finally {
      setLoadingMatrix(false);
    }
  }

  const cls = classes.find(c => c.id === selectedClass);
  const classMeetings = meetings
    .filter(m => m.classId === selectedClass)
    .sort((a, b) => a.meetingNumber - b.meetingNumber);

  const selectedMeeting = classMeetings.find(m => m.id === selectedMeetingId);
  const selectedMaterial = materials.find(mt => mt.id === selectedMeeting?.materialId);

  // Fast Roll-Call Actions
  const handleSetStudentStatus = (studentId, status) => {
    setRollCallMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    setRollCallMap(prev => {
      const next = { ...prev };
      students.forEach(s => {
        next[s.id] = {
          status: 'present',
          note: next[s.id]?.note || '',
        };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    notify('All students marked Present. Adjust if any are excused or absent.');
  };

  const handleOpenNoteModal = (studentId) => {
    setEditingNoteStudentId(studentId);
    setTempNote(rollCallMap[studentId]?.note || '');
  };

  const handleSaveNote = () => {
    if (editingNoteStudentId) {
      setRollCallMap(prev => ({
        ...prev,
        [editingNoteStudentId]: {
          ...prev[editingNoteStudentId],
          note: tempNote,
        },
      }));
      setHasUnsavedChanges(true);
    }
    setEditingNoteStudentId(null);
  };

  const handleSaveRollCall = async () => {
    if (!selectedMeetingId || !selectedClass) return;
    setSaving(true);
    setError('');
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: rollCallMap[s.id]?.status || 'present',
        note: rollCallMap[s.id]?.note || '',
      }));

      await api.bulkAttendance({
        meetingId: selectedMeetingId,
        classId: selectedClass,
        date: selectedMeeting?.date || formatDate(new Date()),
        records,
      });

      // Refresh records in background
      const updated = await api.attendance({ classId: selectedClass });
      setAttendanceRecords(updated);
      setHasUnsavedChanges(false);
      notify(`Session #${selectedMeeting?.meetingNumber || ''} attendance saved successfully!`);
    } catch (err) {
      setError(`Failed to save attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Generate / View Session PIN
  const handleOpenPin = async () => {
    if (!selectedMeetingId) return;
    setShowPinModal(true);
    if (selectedMeeting?.checkInPin) {
      setCurrentPin(selectedMeeting.checkInPin);
    } else {
      setGeneratingPin(true);
      try {
        const res = await api.generateAttendancePin(selectedMeetingId);
        setCurrentPin(res.checkInPin);
        setMeetings(prev =>
          prev.map(m => m.id === selectedMeetingId ? { ...m, checkInPin: res.checkInPin } : m)
        );
      } catch (err) {
        setError(`Failed to generate PIN: ${err.message}`);
      } finally {
        setGeneratingPin(false);
      }
    }
  };

  // Reset Class Attendance
  const handleReset = async () => {
    if (!cls) return;
    if (resetConfirmText.toLowerCase() !== cls.name.toLowerCase()) {
      setError(`Type "${cls.name}" to confirm reset`);
      return;
    }
    setSaving(true);
    try {
      await api.resetAttendance(selectedClass);
      setAttendanceRecords([]);
      setShowResetModal(false);
      notify(`Attendance data for ${cls.name} has been reset.`);
      loadMatrix();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export Matrix to CSV
  const handleExportCSV = () => {
    if (!matrixData || !matrixData.matrix || matrixData.matrix.length === 0) {
      notify('No matrix data available to export.');
      return;
    }

    const meetingHeaders = matrixData.meetings.map(m => `Session ${m.meetingNumber} (${m.date})`).join(',');
    let csv = `No,Student Name,NISN,Gender,${meetingHeaders},Present,Excused,Late,Absent,Attendance Rate (%)\n`;

    matrixData.matrix.forEach(row => {
      const sessionValues = row.sessions.map(s => {
        if (!s.status) return '-';
        if (s.status === 'present') return 'P';
        if (s.status === 'permission') return 'E';
        if (s.status === 'late') return 'L';
        if (s.status === 'absent') return 'A';
        return s.status;
      }).join(',');

      const line = `"${row.index}","${row.name}","${row.nisn}","${row.gender}",${sessionValues},"${row.summary.present}","${row.summary.permission}","${row.summary.late}","${row.summary.absent}","${row.summary.rate}%"`;
      csv += `${line}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${cls?.name || 'Class'}_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('CSV file downloaded successfully.');
  };

  // Print Matrix
  const handlePrint = () => {
    window.print();
  };

  // Filtered Students for Roll-Call
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNisn = s.nisn?.toLowerCase().includes(q);
        if (!matchName && !matchNisn) return false;
      }
      if (statusFilter !== 'all') {
        const currentStatus = rollCallMap[s.id]?.status;
        if (currentStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [students, studentSearch, statusFilter, rollCallMap]);

  // Live Summary of Current Roll-Call
  const rollCallSummary = useMemo(() => {
    let present = 0, permission = 0, late = 0, absent = 0;
    Object.values(rollCallMap).forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'permission') permission++;
      else if (r.status === 'late') late++;
      else if (r.status === 'absent') absent++;
    });
    const total = students.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, permission, late, absent, total, rate };
  }, [rollCallMap, students]);

  // Overall Class Stats across all records
  const overallStats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const permission = attendanceRecords.filter(a => a.status === 'permission').length;
    const late = attendanceRecords.filter(a => a.status === 'late').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, permission, late, absent, rate };
  }, [attendanceRecords]);

  // Chart Data
  const chartMeetingData = useMemo(() => {
    return classMeetings.map(m => {
      const records = attendanceRecords.filter(a => a.meetingId === m.id);
      const present = records.filter(r => r.status === 'present').length;
      const permission = records.filter(r => r.status === 'permission').length;
      const late = records.filter(r => r.status === 'late').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const rate = records.length ? Math.round(((present + late) / records.length) * 100) : 0;
      return {
        meetingNumber: `Session ${m.meetingNumber}`,
        topic: m.topic,
        present,
        permission,
        late,
        absent,
        rate,
        total: records.length,
      };
    });
  }, [classMeetings, attendanceRecords]);

  const studentsNeedingAttention = useMemo(() => {
    return students
      .map(s => {
        const recs = attendanceRecords.filter(a => a.studentId === s.id);
        const p = recs.filter(r => r.status === 'present').length;
        const l = recs.filter(r => r.status === 'late').length;
        const a = recs.filter(r => r.status === 'absent').length;
        const perm = recs.filter(r => r.status === 'permission').length;
        const rate = recs.length > 0 ? Math.round(((p + l) / recs.length) * 100) : 100;
        return { ...s, totalRec: recs.length, absentCount: a, permissionCount: perm, rate };
      })
      .filter(s => s.totalRec > 0 && (s.rate < 80 || s.absentCount >= 2))
      .sort((a, b) => a.rate - b.rate);
  }, [students, attendanceRecords]);

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Quick Action Buttons */}
      <PageHeader
        title="Student Attendance"
        description="Quick in-class roll call, complete semester records, and attendance discipline monitoring."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'rollcall' && (
            <>
              <button
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all shadow-sm"
                title="Mark all students present in 1 click"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚡ Mark All Present</span>
              </button>

              <button
                onClick={handleOpenPin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm"
                title="Display PIN or QR Code for student self check-in"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Student PIN Check-in</span>
              </button>

              <button
                onClick={handleSaveRollCall}
                disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${
                  hasUnsavedChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 scale-[1.02]'
                    : 'bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </>
          )}

          {activeTab === 'matrix' && (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Download CSV Report</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/25"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setResetConfirmText('');
              setError('');
              setShowResetModal(true);
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Reset class attendance data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Class Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {classes.map(c => {
          const isSelected = selectedClass === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation Mode Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('rollcall')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'rollcall'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>⚡ Session Roll Call</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>📊 Semester Matrix Report</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📈 Analytics & Trends</span>
          </button>
        </div>

        {/* Semester Stats Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
          <span>Semester Attendance Rate:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
            {overallStats.rate}%
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: QUICK ROLL-CALL MODE (SESSION ROLL CALL)          */}
      {/* ======================================================== */}
      {activeTab === 'rollcall' && (
        <div className="space-y-5">
          {/* Meeting Carousel / Selector Bar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
                Select Class Session
              </span>
              <span className="text-[11px] text-zinc-400">
                Click session number to switch date & curriculum material
              </span>
            </div>

            {classMeetings.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs">
                No class sessions scheduled yet for {cls?.name}. Create sessions in Schedule or Materials.
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {classMeetings.map(m => {
                  const isSelected = m.id === selectedMeetingId;
                  const records = attendanceRecords.filter(a => a.meetingId === m.id);
                  const isRecorded = records.length > 0;
                  const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;

                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMeetingId(m.id)}
                      className={`flex flex-col items-center min-w-[76px] p-2 rounded-xl border transition-all text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 scale-[1.03]'
                          : isRecorded
                          ? 'bg-zinc-50 dark:bg-zinc-800/80 border-emerald-300 dark:border-emerald-800/60 text-zinc-800 dark:text-zinc-200 hover:border-indigo-400'
                          : 'bg-white dark:bg-zinc-900 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                      }`}
                    >
                      <span className="text-[10px] font-mono opacity-80 uppercase">
                        Session #{m.meetingNumber}
                      </span>
                      <span className="text-xs font-bold truncate max-w-[70px]">
                        {m.date ? m.date.slice(5) : '—'}
                      </span>
                      {isRecorded ? (
                        <span className={`text-[9px] font-semibold mt-0.5 px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {presentCount}/{records.length} P
                        </span>
                      ) : (
                        <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-zinc-400'}`}>
                          None
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Current Selected Meeting Detail Banner */}
            {selectedMeeting && (
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                    Session #{selectedMeeting.meetingNumber}
                  </span>
                  <div className="truncate">
                    <strong className="text-zinc-900 dark:text-white">
                      {selectedMaterial?.topic || selectedMeeting.topic}
                    </strong>
                    <span className="text-zinc-400 ml-2">
                      📅 {selectedMeeting.date}
                    </span>
                  </div>
                </div>

                {/* Live Roll-Call Stats Pills */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                    Present: {rollCallSummary.present}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800/60">
                    Excused: {rollCallSummary.permission}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60">
                    Late: {rollCallSummary.late}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800/60">
                    Absent: {rollCallSummary.absent}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/60">
                    Rate: {rollCallSummary.rate}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Student Search & Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or NISN..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                All ({students.length})
              </button>
              {ATTENDANCE_STATUSES.map(st => {
                const count = Object.values(rollCallMap).filter(r => r.status === st.value).length;
                return (
                  <button
                    key={st.value}
                    onClick={() => setStatusFilter(st.value)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      statusFilter === st.value
                        ? `${st.bg} text-white shadow-sm`
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {st.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Roster Card Grid */}
          <div className="space-y-2.5">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No students match the search/filter criteria.</p>
              </div>
            ) : (
              filteredStudents.map((s, idx) => {
                const currentStatus = rollCallMap[s.id]?.status || 'present';
                const currentNote = rollCallMap[s.id]?.note || '';

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.25) }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-sm transition-shadow"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-600 dark:text-zinc-300 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {s.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {s.gender === 'L' || s.gender === 'male' ? 'M' : 'F'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span>NISN: {s.nisn || '—'}</span>
                          {currentNote && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium truncate max-w-xs">
                              💬 Note: "{currentNote}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Buttons & Notes Button */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* 4 Tactile Status Toggle Buttons */}
                      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
                        {ATTENDANCE_STATUSES.map(st => {
                          const isActive = currentStatus === st.value;
                          return (
                            <button
                              key={st.value}
                              onClick={() => handleSetStudentStatus(s.id, st.value)}
                              className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isActive
                                    ? `${st.bg} text-white shadow-sm scale-105`
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
                              }`}
                              title={st.label}
                            >
                              <span>{st.short}</span>
                              <span className="hidden sm:inline text-[11px] font-medium">{st.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Note Button */}
                      <button
                        onClick={() => handleOpenNoteModal(s.id)}
                        className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
                          currentNote
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-600'
                        }`}
                        title={currentNote ? `Note: ${currentNote}` : 'Add note/reason'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Sticky Bottom Save Bar (Visible when there are unsaved changes) */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-4 z-40 bg-zinc-900 dark:bg-zinc-800 text-white p-4 rounded-2xl shadow-2xl border border-zinc-700 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved attendance changes for this session.</span>
              </div>
              <button
                onClick={handleSaveRollCall}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/30 transition-all"
              >
                <Check className="w-4 h-4 stroke-3" />
                <span>{saving ? 'Saving...' : 'Save Attendance Now'}</span>
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SEMESTER ATTENDANCE MATRIX                        */}
      {/* ======================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                  Semester Attendance Report — {cls?.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Student attendance matrix per meeting session with automatic attendance percentage calculations.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> P = Present
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-sky-600">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> E = Excused
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> L = Late
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> A = Absent
                </span>
              </div>
            </div>

            {loadingMatrix ? (
              <div className="py-16 text-center text-xs text-zinc-400 animate-pulse">
                Calculating semester attendance matrix...
              </div>
            ) : !matrixData || !matrixData.matrix || matrixData.matrix.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                No student attendance records found for this class.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-3 text-center w-8">#</th>
                      <th className="py-3 px-3 min-w-40">Student Name</th>
                      <th className="py-3 px-2 text-center w-12">NISN</th>
                      {matrixData.meetings.map(m => (
                        <th key={m.id} className="py-3 px-1.5 text-center min-w-[34px]" title={`Session #${m.meetingNumber}: ${m.topic} (${m.date})`}>
                          S#{m.meetingNumber}
                        </th>
                      ))}
                      <th className="py-3 px-2 text-center text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20">P</th>
                      <th className="py-3 px-2 text-center text-sky-600 bg-sky-50/40 dark:bg-sky-950/20">E</th>
                      <th className="py-3 px-2 text-center text-amber-600 bg-amber-50/40 dark:bg-amber-950/20">L</th>
                      <th className="py-3 px-2 text-center text-rose-600 bg-rose-50/40 dark:bg-rose-950/20">A</th>
                      <th className="py-3 px-3 text-center font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {matrixData.matrix.map((row) => (
                      <tr key={row.studentId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-400">{row.index}</td>
                        <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-white truncate max-w-[180px]">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-2 text-center text-zinc-400 font-mono text-[10px]">
                          {row.nisn}
                        </td>
                        {row.sessions.map((s) => {
                          let badge = <span className="text-zinc-300 dark:text-zinc-700">—</span>;
                          if (s.status === 'present') {
                            badge = <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mx-auto">P</span>;
                          } else if (s.status === 'permission') {
                            badge = <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 mx-auto" title={s.note || 'Excused'}>E</span>;
                          } else if (s.status === 'late') {
                            badge = <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mx-auto" title={s.note || 'Late'}>L</span>;
                          } else if (s.status === 'absent') {
                            badge = <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 mx-auto" title={s.note || 'Absent'}>A</span>;
                          }
                          return (
                            <td key={s.meetingId} className="py-2 px-1 text-center">
                              {badge}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10">
                          {row.summary.present}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-sky-600 bg-sky-50/20 dark:bg-sky-950/10">
                          {row.summary.permission}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-amber-600 bg-amber-50/20 dark:bg-amber-950/10">
                          {row.summary.late}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-rose-600 bg-rose-50/20 dark:bg-rose-950/10">
                          {row.summary.absent}
                        </td>
                        <td className="py-2 px-3 text-center font-bold bg-zinc-100/60 dark:bg-zinc-800/40">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] ${
                              row.summary.rate >= 90
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : row.summary.rate >= 75
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {row.summary.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ANALYTICS & CHARTS                                */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{overallStats.rate}%</div>
              <p className="text-xs text-zinc-500 mt-1">Average Attendance</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{overallStats.present}</div>
              <p className="text-xs text-zinc-500 mt-1">Total Present</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-sky-600">{overallStats.permission}</div>
              <p className="text-xs text-zinc-500 mt-1">Total Excused</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{overallStats.late}</div>
              <p className="text-xs text-zinc-500 mt-1">Total Late</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
              <div className="text-2xl font-bold text-rose-600">{overallStats.absent}</div>
              <p className="text-xs text-zinc-500 mt-1">Total Absent</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                Attendance Distribution per Session
              </h3>
              <div className="h-64">
                {chartMeetingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartMeetingData}>
                      <XAxis dataKey="meetingNumber" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(24,24,27,0.9)', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="present" fill="#10b981" name="Present" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" stackId="a" />
                      <Bar dataKey="permission" fill="#0ea5e9" name="Excused" stackId="a" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs">No attendance records yet</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Class Attendance Trends (%)
              </h3>
              <div className="h-64">
                {chartMeetingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartMeetingData}>
                      <XAxis dataKey="meetingNumber" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                      <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(24,24,27,0.9)', border: 'none', borderRadius: 8, color: '#fff' }} />
                      <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} name="Attendance %" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs">No attendance records yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Students Needing Attention Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Students Needing Attention (Attendance &lt; 80% or Absent &ge; 2)
                </h3>
              </div>
              <span className="text-xs text-zinc-400">{studentsNeedingAttention.length} students identified</span>
            </div>

            {studentsNeedingAttention.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All students in this class have excellent attendance records!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {studentsNeedingAttention.map(st => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-40">
                        {st.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        {st.absentCount} Absent · {st.permissionCount} Excused
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                      {st.rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: STUDENT CHECK-IN PIN & QR CODE              */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPinModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6 text-center"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  Student Self Check-in
                </span>
                <button onClick={() => setShowPinModal(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-6">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Session #{selectedMeeting?.meetingNumber} PIN Code
                </div>
                <div className="flex items-center justify-center gap-2">
                  {generatingPin ? (
                    <div className="text-zinc-400 text-sm animate-pulse">Generating session PIN...</div>
                  ) : currentPin ? (
                    currentPin.split('').map((digit, i) => (
                      <span
                        key={i}
                        className="w-11 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-2xl font-mono font-bold flex items-center justify-center shadow-inner"
                      >
                        {digit}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-400 text-sm">PIN not generated yet</span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 mt-4 max-w-xs mx-auto">
                  Display this PIN code on the projector screen. Students can enter the PIN on their student portal to check in automatically.
                </p>
              </div>

              <button
                onClick={() => setShowPinModal(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-colors"
              >
                Close Display
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: STUDENT ATTENDANCE NOTE                     */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {editingNoteStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setEditingNoteStudentId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Student Attendance Note
                </h4>
                <button onClick={() => setEditingNoteStudentId(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={tempNote}
                onChange={e => setTempNote(e.target.value)}
                placeholder="e.g., Sick with medical certificate, Late 15 minutes, School competition..."
                rows={3}
                className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                autoFocus
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditingNoteStudentId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: RESET CONFIRMATION MODAL                    */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowResetModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Reset Class Attendance</h3>
                  <p className="text-xs text-zinc-500">{cls?.name}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 mb-4">
                This action will delete all attendance records for this class and reset student attendance percentages to 0%.
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Type <strong className="text-rose-600">{cls?.name}</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={e => setResetConfirmText(e.target.value)}
                  placeholder={cls?.name}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving || resetConfirmText.toLowerCase() !== (cls?.name || '').toLowerCase()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-md shadow-rose-500/25"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{saving ? 'Resetting...' : 'Reset Now'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
