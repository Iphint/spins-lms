import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  HelpCircle,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  X,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../utils/api';

const EXAM_TYPES = [
  { id: 'UTS', name: 'Mid Exam (UTS)', shortName: 'Mid Exam', defaultWeight: 40, desc: 'Midterm Examination' },
  { id: 'UAS', name: 'Semester Exam (UAS)', shortName: 'Semester Exam', defaultWeight: 60, desc: 'Final Semester Examination' },
];

export default function ExamScores() {
  // Data State
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [semesterNumber, setSemesterNumber] = useState(1); // 1 or 2
  const [activeExamTab, setActiveExamTab] = useState('ALL'); // 'UTS' | 'UAS' | 'ALL'
  const [students, setStudents] = useState([]);
  const [existingScores, setExistingScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State for Inputs (keyed by studentId)
  // scoresMap[studentId] = { UTS: number|string, UAS: number|string }
  const [scoresMap, setScoresMap] = useState({});

  // Settings for exam inputs
  const [examSettings, setExamSettings] = useState({
    date: new Date().toISOString().split('T')[0],
    maxScore: 100,
    kkm: 75,
    utsWeight: 40,
    uasWeight: 60,
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PASSED' | 'REMEDIAL' | 'UNSCORED'
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTargetExam, setPasteTargetExam] = useState('UTS');

  // Input refs for keyboard navigation (Tab/Enter moves to next row)
  const inputRefs = useRef({});

  // Load initial classes, semesters, and active semester
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [clsList, semList, semActive] = await Promise.all([
          api.classes().catch(() => []),
          api.semesters().catch(() => []),
          api.semesterActive().catch(() => null),
        ]);

        setClasses(clsList);
        setSemesters(semList);
        setActiveSemester(semActive);

        if (semActive?.number) {
          setSemesterNumber(semActive.number);
        }

        if (clsList.length > 0) {
          setSelectedClassId(clsList[0].id);
        }
      } catch (err) {
        setErrorToast(err.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // When selected class or semesterNumber changes, load students & scores
  useEffect(() => {
    if (!selectedClassId) return;

    async function loadClassData() {
      try {
        setLoading(true);
        const [studList, scoreList] = await Promise.all([
          api.students(selectedClassId).catch(() => []),
          api.scores({ classId: selectedClassId, semesterNumber }).catch(() => []),
        ]);

        setStudents(studList);
        setExistingScores(scoreList);

        // Build working scoresMap
        const initialMap = {};
        for (const st of studList) {
          initialMap[st.id] = { UTS: '', UAS: '' };
        }

        for (const sc of scoreList) {
          if (!initialMap[sc.studentId]) {
            initialMap[sc.studentId] = { UTS: '', UAS: '' };
          }
          const typeUpper = (sc.examType || '').toUpperCase();
          if (typeUpper.includes('MID') || typeUpper.includes('UTS') || typeUpper.includes('TENGAH')) {
            initialMap[sc.studentId].UTS = sc.score;
          } else if (typeUpper.includes('UAS') || typeUpper.includes('AKHIR') || typeUpper.includes('SEMESTER EXAM') || typeUpper.includes('PAS')) {
            initialMap[sc.studentId].UAS = sc.score;
          }
        }

        setScoresMap(initialMap);
      } catch (err) {
        setErrorToast(err.message || 'Failed to load class scores');
      } finally {
        setLoading(false);
      }
    }

    loadClassData();
  }, [selectedClassId, semesterNumber]);

  // Toast feedback timer
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Selected Class Object
  const currentClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Score Updater
  const handleScoreChange = (studentId, examKey, val) => {
    if (val === '') {
      setScoresMap(prev => ({
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), [examKey]: '' },
      }));
      return;
    }

    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num < 0) num = 0;
    if (num > examSettings.maxScore) num = examSettings.maxScore;

    setScoresMap(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [examKey]: num },
    }));
  };

  // Keyboard navigation between rows
  const handleKeyDown = (e, index, examKey) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextKey = `${index + 1}-${examKey}`;
      if (inputRefs.current[nextKey]) {
        inputRefs.current[nextKey].focus();
        inputRefs.current[nextKey].select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevKey = `${index - 1}-${examKey}`;
      if (inputRefs.current[prevKey]) {
        inputRefs.current[prevKey].focus();
        inputRefs.current[prevKey].select();
      }
    }
  };

  // Computations for each student
  const studentRows = useMemo(() => {
    const kkm = examSettings.kkm || 75;
    const wUts = examSettings.utsWeight / 100;
    const wUas = examSettings.uasWeight / 100;

    return students.map((st, idx) => {
      const scores = scoresMap[st.id] || { UTS: '', UAS: '' };
      const rawUts = scores.UTS;
      const rawUas = scores.UAS;

      const hasUts = rawUts !== '' && rawUts !== undefined && !isNaN(Number(rawUts));
      const hasUas = rawUas !== '' && rawUas !== undefined && !isNaN(Number(rawUas));

      const utsVal = hasUts ? Number(rawUts) : null;
      const uasVal = hasUas ? Number(rawUas) : null;

      // Final Semester Exam Score Calculation
      let finalScore = null;
      if (hasUts && hasUas) {
        finalScore = Math.round((utsVal * wUts + uasVal * wUas) * 10) / 10;
      } else if (hasUts) {
        finalScore = utsVal;
      } else if (hasUas) {
        finalScore = uasVal;
      }

      // Predicate
      let grade = '-';
      if (finalScore !== null) {
        if (finalScore >= 90) grade = 'A';
        else if (finalScore >= 80) grade = 'B';
        else if (finalScore >= kkm) grade = 'C';
        else grade = 'D';
      }

      // Status
      let isPassed = false;
      let statusLabel = 'Incomplete';
      let statusColor = 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800';

      if (finalScore !== null) {
        if (finalScore >= kkm) {
          isPassed = true;
          statusLabel = 'Passed';
          statusColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
        } else {
          isPassed = false;
          statusLabel = 'Remedial';
          statusColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
        }
      }

      return {
        ...st,
        idx,
        uts: rawUts,
        uas: rawUas,
        utsVal,
        uasVal,
        finalScore,
        grade,
        isPassed,
        statusLabel,
        statusColor,
      };
    });
  }, [students, scoresMap, examSettings]);

  // Filtered Rows for display
  const filteredRows = useMemo(() => {
    return studentRows.filter(r => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchNisn = (r.nisn || '').toLowerCase().includes(q);
        if (!matchName && !matchNisn) return false;
      }

      // Status filter
      if (statusFilter === 'PASSED') return r.isPassed;
      if (statusFilter === 'REMEDIAL') return r.finalScore !== null && !r.isPassed;
      if (statusFilter === 'UNSCORED') return r.uts === '' || r.uas === '';

      return true;
    });
  }, [studentRows, searchQuery, statusFilter]);

  // Statistics & KPI
  const stats = useMemo(() => {
    const scoredFinals = studentRows.filter(r => r.finalScore !== null).map(r => r.finalScore);
    const scoredUts = studentRows.filter(r => r.utsVal !== null).map(r => r.utsVal);
    const scoredUas = studentRows.filter(r => r.uasVal !== null).map(r => r.uasVal);

    const count = scoredFinals.length;
    const avg = count > 0 ? Math.round((scoredFinals.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    const highest = count > 0 ? Math.max(...scoredFinals) : 0;
    const lowest = count > 0 ? Math.min(...scoredFinals) : 0;
    const passedCount = studentRows.filter(r => r.isPassed).length;
    const passRate = count > 0 ? Math.round((passedCount / count) * 100) : 0;

    return {
      totalStudents: students.length,
      scoredCount: count,
      utsScored: scoredUts.length,
      uasScored: scoredUas.length,
      avg,
      highest,
      lowest,
      passRate,
      passedCount,
      remedialCount: count - passedCount,
    };
  }, [studentRows, students.length]);

  // Quick preset scores
  const fillAllScores = (examKey, value) => {
    setScoresMap(prev => {
      const next = { ...prev };
      for (const st of students) {
        next[st.id] = { ...(next[st.id] || {}), [examKey]: value };
      }
      return next;
    });
  };

  const clearExamScores = (examKey) => {
    if (!window.confirm(`Clear all ${examKey === 'UTS' ? 'Mid Exam (UTS)' : 'Semester Exam (UAS)'} scores for class ${currentClass?.name}?`)) return;
    fillAllScores(examKey, '');
  };

  // Save all scores
  const handleSaveAll = async (targetExam = activeExamTab) => {
    if (!selectedClassId) return;

    try {
      setSaving(true);
      setErrorToast('');

      // Determine which exam types to save
      const examTypesToSave = targetExam === 'ALL' ? ['UTS', 'UAS'] : [targetExam];
      let totalSaved = 0;

      for (const exKey of examTypesToSave) {
        const fullExamTitle = exKey === 'UTS' ? 'Mid Exam (UTS)' : 'Semester Exam (UAS)';
        const weightVal = exKey === 'UTS' ? examSettings.utsWeight : examSettings.uasWeight;

        const scorePayload = students
          .map(st => {
            const raw = scoresMap[st.id]?.[exKey];
            if (raw === '' || raw === undefined || isNaN(Number(raw))) return null;
            return {
              studentId: st.id,
              score: Number(raw),
            };
          })
          .filter(Boolean);

        if (scorePayload.length > 0) {
          const res = await api.bulkScores({
            classId: selectedClassId,
            examType: fullExamTitle,
            semesterNumber,
            date: examSettings.date,
            maxScore: examSettings.maxScore,
            weight: weightVal,
            scores: scorePayload,
          });
          totalSaved += res.savedCount || scorePayload.length;
        }
      }

      setSuccessToast(`Successfully saved ${totalSaved} exam score entries for Semester ${semesterNumber} in class ${currentClass?.name}!`);

      // Refresh scores from server
      const refreshedScores = await api.scores({ classId: selectedClassId, semesterNumber });
      setExistingScores(refreshedScores);
    } catch (err) {
      setErrorToast(err.message || 'Failed to save exam scores');
    } finally {
      setSaving(false);
    }
  };

  // Parse pasted scores from Excel / spreadsheet
  const handleApplyPastedScores = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    // If pasted line has format: [Name/NISN][tab/pipe][Score] or just a list of numbers
    const updatedMap = { ...scoresMap };
    let matchCount = 0;

    lines.forEach((line, lineIdx) => {
      const parts = line.split(/[\t,|;]/).map(p => p.trim());
      let parsedNum = null;
      let targetStudent = null;

      if (parts.length >= 2) {
        // Try finding student by identifier (NISN or Name) in first part, and number in last part
        const identifier = parts[0].toLowerCase();
        const scoreCandidate = parseInt(parts[parts.length - 1], 10);

        targetStudent = students.find(
          s => (s.nisn && s.nisn.toLowerCase() === identifier) ||
               (s.name && s.name.toLowerCase().includes(identifier))
        );

        if (targetStudent && !isNaN(scoreCandidate)) {
          parsedNum = scoreCandidate;
        }
      }

      // If not matched by identifier, map sequentially to students by index
      if (parsedNum === null && lineIdx < students.length) {
        const directNum = parseInt(line.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(directNum)) {
          targetStudent = students[lineIdx];
          parsedNum = directNum;
        }
      }

      if (targetStudent && parsedNum !== null) {
        const clamped = Math.max(0, Math.min(examSettings.maxScore, parsedNum));
        if (!updatedMap[targetStudent.id]) {
          updatedMap[targetStudent.id] = { UTS: '', UAS: '' };
        }
        updatedMap[targetStudent.id][pasteTargetExam] = clamped;
        matchCount++;
      }
    });

    setScoresMap(updatedMap);
    setShowPasteModal(false);
    setPasteText('');
    setSuccessToast(`Successfully applied ${matchCount} ${pasteTargetExam} scores from pasted text.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Exam Scores & Recaps"
        description={`Manage Mid Exam (UTS) and Semester Exam (UAS) scores for Semester ${semesterNumber} in ${currentClass?.subject || 'Coding & AI'}.`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Paste from Excel</span>
          </button>

          <button
            type="button"
            disabled={saving || students.length === 0}
            onClick={() => handleSaveAll()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Scores'}</span>
          </button>
        </div>
      </PageHeader>

      {/* Toast Feedback */}
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
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div className="flex-1 font-medium">{errorToast}</div>
            <button onClick={() => setErrorToast('')} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Filter & Scope Selector Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* 1. Semester Selector (Semester 1 vs Semester 2) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Semester:
            </span>
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSemesterNumber(1)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  semesterNumber === 1
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${semesterNumber === 1 ? 'bg-white' : 'bg-blue-500'}`} />
                <span>Semester 1</span>
              </button>
              <button
                type="button"
                onClick={() => setSemesterNumber(2)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  semesterNumber === 2
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${semesterNumber === 2 ? 'bg-white' : 'bg-purple-500'}`} />
                <span>Semester 2</span>
              </button>
            </div>

            {activeSemester && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Active: {activeSemester.name}
              </span>
            )}
          </div>

          {/* 2. Class Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 shrink-0">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              Select Class:
            </span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount || 0} Students)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exam Type Sub-Navigation & Settings Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {/* Exam Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl overflow-x-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveExamTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeExamTab === 'ALL'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Exams & Semester Recap
            </button>
            <button
              type="button"
              onClick={() => setActiveExamTab('UTS')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeExamTab === 'UTS'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Mid Exam (UTS)</span>
              <span className="text-[10px] opacity-80">({stats.utsScored}/{students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveExamTab('UAS')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeExamTab === 'UAS'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Semester Exam (UAS)</span>
              <span className="text-[10px] opacity-80">({stats.uasScored}/{students.length})</span>
            </button>
          </div>

          {/* Quick Grading Parameter Settings */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Passing Grade (KKM):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={examSettings.kkm}
                onChange={e => setExamSettings(prev => ({ ...prev, kkm: Number(e.target.value) || 75 }))}
                className="w-14 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-bold text-zinc-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Weight Mid/Final:</span>
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                {examSettings.utsWeight}% / {examSettings.uasWeight}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Date:</span>
              <input
                type="date"
                value={examSettings.date}
                onChange={e => setExamSettings(prev => ({ ...prev, date: e.target.value }))}
                className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Class Summary Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Average Score</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{stats.avg}</div>
            <div className="text-[10px] text-zinc-400">Target Passing: {examSettings.kkm}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Passing Rate (≥KKM)</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.passRate}%</div>
            <div className="text-[10px] text-zinc-400">{stats.passedCount} of {stats.scoredCount} students</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Highest / Lowest</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">
              {stats.highest} <span className="text-sm font-normal text-zinc-400">/ {stats.lowest}</span>
            </div>
            <div className="text-[10px] text-zinc-400">Student score range</div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Input Status</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">
              {stats.scoredCount} <span className="text-sm font-normal text-zinc-400">/ {students.length}</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              {students.length - stats.scoredCount === 0 ? 'All scores entered' : `${students.length - stats.scoredCount} pending input`}
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Score Input Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or NISN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 outline-none"
            >
              <option value="ALL">All Students ({students.length})</option>
              <option value="PASSED">Passed (≥KKM) ({stats.passedCount})</option>
              <option value="REMEDIAL">Remedial ({stats.remedialCount})</option>
              <option value="UNSCORED">Incomplete</option>
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-[11px] text-zinc-500 mr-1 hidden lg:inline">Quick Fill:</span>
            {activeExamTab !== 'UAS' && (
              <button
                type="button"
                onClick={() => fillAllScores('UTS', 100)}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                UTS 100
              </button>
            )}
            {activeExamTab !== 'UTS' && (
              <button
                type="button"
                onClick={() => fillAllScores('UAS', 100)}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                UAS 100
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                fillAllScores('UTS', examSettings.kkm);
                fillAllScores('UAS', examSettings.kkm);
              }}
              className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Set Passing ({examSettings.kkm})
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/90 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 min-w-[200px]">Student Name &amp; NISN</th>
                {(activeExamTab === 'ALL' || activeExamTab === 'UTS') && (
                  <th className="py-3 px-3 w-40 text-center bg-indigo-50/40 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-center gap-1 text-indigo-700 dark:text-indigo-300 font-bold">
                      <Award className="w-3.5 h-3.5" />
                      <span>Mid Exam (UTS)</span>
                    </div>
                    <div className="text-[10px] font-normal text-zinc-400">Weight {examSettings.utsWeight}%</div>
                  </th>
                )}
                {(activeExamTab === 'ALL' || activeExamTab === 'UAS') && (
                  <th className="py-3 px-3 w-40 text-center bg-purple-50/40 dark:bg-purple-950/20">
                    <div className="flex items-center justify-center gap-1 text-purple-700 dark:text-purple-300 font-bold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Semester Exam (UAS)</span>
                    </div>
                    <div className="text-[10px] font-normal text-zinc-400">Weight {examSettings.uasWeight}%</div>
                  </th>
                )}
                <th className="py-3 px-3 w-32 text-center">Final Score Sem {semesterNumber}</th>
                <th className="py-3 px-3 w-20 text-center">Grade</th>
                <th className="py-3 px-3 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading student data and exam scores...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No student records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, i) => {
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center font-mono text-zinc-400 font-medium">
                        {i + 1}
                      </td>

                      {/* Name & NISN */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                          {row.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          NISN: {row.nisn || '-'} · {row.gender === 'M' ? 'Male' : 'Female'}
                        </div>
                      </td>

                      {/* Mid Exam Input (UTS) */}
                      {(activeExamTab === 'ALL' || activeExamTab === 'UTS') && (
                        <td className="py-2.5 px-3 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              ref={el => (inputRefs.current[`${i}-UTS`] = el)}
                              type="number"
                              min="0"
                              max={examSettings.maxScore}
                              value={row.uts !== undefined ? row.uts : ''}
                              onChange={e => handleScoreChange(row.id, 'UTS', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, i, 'UTS')}
                              placeholder="0 - 100"
                              className={`w-20 px-2 py-1.5 rounded-xl border text-center font-mono font-bold text-xs outline-none transition-all ${
                                row.utsVal !== null
                                  ? row.utsVal >= examSettings.kkm
                                    ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                                    : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white'
                              }`}
                            />
                            {row.utsVal !== null && (
                              <span className="text-[10px] font-mono font-bold text-zinc-400">
                                /100
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Semester Exam Input (UAS) */}
                      {(activeExamTab === 'ALL' || activeExamTab === 'UAS') && (
                        <td className="py-2.5 px-3 text-center bg-purple-50/20 dark:bg-purple-950/10">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              ref={el => (inputRefs.current[`${i}-UAS`] = el)}
                              type="number"
                              min="0"
                              max={examSettings.maxScore}
                              value={row.uas !== undefined ? row.uas : ''}
                              onChange={e => handleScoreChange(row.id, 'UAS', e.target.value)}
                              onKeyDown={e => handleKeyDown(e, i, 'UAS')}
                              placeholder="0 - 100"
                              className={`w-20 px-2 py-1.5 rounded-xl border text-center font-mono font-bold text-xs outline-none transition-all ${
                                row.uasVal !== null
                                  ? row.uasVal >= examSettings.kkm
                                    ? 'border-purple-300 dark:border-purple-700 bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 shadow-xs'
                                    : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white'
                              }`}
                            />
                            {row.uasVal !== null && (
                              <span className="text-[10px] font-mono font-bold text-zinc-400">
                                /100
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Final Score */}
                      <td className="py-2.5 px-3 text-center">
                        {row.finalScore !== null ? (
                          <span className={`font-mono font-bold text-xs ${
                            row.finalScore >= examSettings.kkm
                              ? 'text-zinc-900 dark:text-white'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {row.finalScore}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Predicate */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block w-6 h-6 rounded-lg text-center leading-6 font-bold font-mono text-xs ${
                          row.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : row.grade === 'B'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : row.grade === 'C'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : row.grade === 'D'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'text-zinc-400'
                        }`}>
                          {row.grade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.statusColor}`}>
                          {row.statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            Showing <strong>{filteredRows.length}</strong> of <strong>{students.length} students</strong> in class {currentClass?.name}.
            Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">↓</kbd> keys to quickly navigate rows.
          </div>
          <button
            type="button"
            disabled={saving || students.length === 0}
            onClick={() => handleSaveAll()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>
      </div>

      {/* MODAL: PASTE DARI EXCEL */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowPasteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-xl p-6 z-10 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                      Quick Paste Scores from Excel / Spreadsheet
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Copy a score column from Excel/Google Sheets and paste it here.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Apply Scores To:
                  </label>
                  <select
                    value={pasteTargetExam}
                    onChange={e => setPasteTargetExam(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white"
                  >
                    <option value="UTS">Mid Exam (UTS) — Semester {semesterNumber}</option>
                    <option value="UAS">Semester Exam (UAS) — Semester {semesterNumber}</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700 text-xs text-zinc-500 space-y-1">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">Supported formats:</p>
                  <p>1. Sequential list of numeric scores per line (mapped sequentially to students 1 to {students.length})</p>
                  <p>2. Or two-column format: <code className="font-mono font-bold text-indigo-600">Name/NISN [tab] Score</code></p>
                </div>

                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={`85\n90\n78\n95\n...`}
                  className="w-full p-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={handleApplyPastedScores}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Scores to Table</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
