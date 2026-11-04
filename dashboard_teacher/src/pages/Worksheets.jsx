import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Trash2,
  BookOpen,
  Code2,
  UploadCloud,
  File,
  ExternalLink,
  Eye,
  Check,
  Send,
  Award,
  Sparkles,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  Pencil,
  Sun,
  Moon,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import FilePreviewModal from '../components/FilePreviewModal';
import CodeEditorModal from '../components/CodeEditorModal';
import Editor from '@monaco-editor/react';
import '../utils/monacoSetup';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';

const difficultyColors = {
  Easy: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  Medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Hard: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  Mudah: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  Sedang: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Sulit: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
};

const formatDifficulty = (diff) => {
  if (diff === 'Mudah' || diff === 'Easy') return 'Easy';
  if (diff === 'Sedang' || diff === 'Medium') return 'Medium';
  if (diff === 'Sulit' || diff === 'Hard') return 'Hard';
  return diff || 'Medium';
};

export default function Worksheets() {
  // Server Data
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'upcoming' | 'completed'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'coding' | 'file'

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWs, setSelectedWs] = useState(null);
  const [editingWs, setEditingWs] = useState(null);

  let appThemeContext = null;
  try {
    appThemeContext = useTheme();
  } catch {
    // fallback if outside ThemeProvider
  }
  const isAppDark = appThemeContext ? appThemeContext.theme === 'dark' : true;
  const [starterCodeTheme, setStarterCodeTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('monaco_editor_theme');
      if (saved === 'vs-dark' || saved === 'light') return saved;
    }
    return isAppDark ? 'vs-dark' : 'light';
  });

  const toggleStarterCodeTheme = () => {
    const nextTheme = starterCodeTheme === 'vs-dark' ? 'light' : 'vs-dark';
    setStarterCodeTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('monaco_editor_theme', nextTheme);
    }
  };
  const [previewFile, setPreviewFile] = useState(null);
  const [codeEditorTarget, setCodeEditorTarget] = useState(null);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);

  // Notifications
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Form State
  const [form, setForm] = useState({
    classId: '',
    title: '',
    topic: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    difficulty: 'Medium',
    totalQuestions: 10,
    maxScore: 100,
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: null,
    fileType: '',
    hasCodeEditor: false,
    codeLanguage: 'python',
    starterCode: '',
    testCases: [{ input: '', expected: '' }],
  });

  const [uploadingFile, setUploadingFile] = useState(false);

  // Detail Modal Tab: 'overview' | 'submissions'
  const [detailTab, setDetailTab] = useState('overview');

  // Load classes & worksheets
  const loadClasses = async () => {
    try {
      const c = await api.classes();
      setClasses(c || []);
      if (c && c.length > 0 && !selectedClass) {
        setSelectedClass(c[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadWorksheets = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await api.worksheets({ classId: selectedClass });
      setWorksheets(data || []);
    } catch (err) {
      console.error('Failed to load worksheets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadWorksheets();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Filtered worksheets
  const filteredWorksheets = useMemo(() => {
    return worksheets.filter(ws => {
      // Status filter
      if (statusFilter !== 'all' && ws.status !== statusFilter) return false;
      // Type filter
      if (typeFilter === 'coding' && !ws.hasCodeEditor) return false;
      if (typeFilter === 'file' && !ws.fileUrl) return false;
      return true;
    });
  }, [worksheets, statusFilter, typeFilter]);

  // Statistics for selected class
  const classStats = useMemo(() => {
    const total = worksheets.length;
    const completed = worksheets.filter(w => w.status === 'completed').length;
    const codingTasks = worksheets.filter(w => w.hasCodeEditor).length;
    const avgCompletion = total > 0 ? Math.round(worksheets.reduce((sum, w) => sum + (w.completion || 0), 0) / total) : 0;
    return { total, completed, codingTasks, avgCompletion };
  }, [worksheets]);

  // Modal Openers
  const openCreateModal = () => {
    setEditingWs(null);
    setForm({
      classId: selectedClass || classes[0]?.id || '',
      title: '',
      topic: '',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      difficulty: 'Medium',
      totalQuestions: 10,
      maxScore: 100,
      description: '',
      fileUrl: '',
      fileName: '',
      fileSize: null,
      fileType: '',
      hasCodeEditor: false,
      codeLanguage: 'python',
      starterCode: '# Write your solution function here:\ndef solve(data):\n    return data\n',
      testCases: [{ input: '5', expected: '10' }],
    });
    setError('');
    setShowCreateModal(true);
  };

  const openEditModal = (ws) => {
    setEditingWs(ws);
    let parsedTC = [{ input: '', expected: '' }];
    if (ws.testCases) {
      try {
        parsedTC = typeof ws.testCases === 'string' ? JSON.parse(ws.testCases) : ws.testCases;
      } catch {}
    }
    setForm({
      classId: ws.classId,
      title: ws.title,
      topic: ws.topic,
      assignedDate: ws.assignedDate,
      dueDate: ws.dueDate,
      difficulty: ws.difficulty || 'Medium',
      totalQuestions: ws.totalQuestions || 10,
      maxScore: ws.maxScore || 100,
      description: ws.description || '',
      fileUrl: ws.fileUrl || '',
      fileName: ws.fileName || '',
      fileSize: ws.fileSize || null,
      fileType: ws.fileType || '',
      hasCodeEditor: Boolean(ws.hasCodeEditor),
      codeLanguage: ws.codeLanguage || 'python',
      starterCode: ws.starterCode || '',
      testCases: parsedTC.length > 0 ? parsedTC : [{ input: '', expected: '' }],
    });
    setError('');
    setShowCreateModal(true);
  };

  // Handle File Upload to server
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.uploadWorksheetFile(formData);
      setForm(f => ({
        ...f,
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileType: res.fileType,
      }));
      setSuccessToast(`File "${res.fileName}" successfully uploaded!`);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFileAttachment = () => {
    setForm(f => ({
      ...f,
      fileUrl: '',
      fileName: '',
      fileSize: null,
      fileType: '',
    }));
  };

  // Handle Create / Update Save
  const handleSaveWorksheet = async () => {
    setError('');
    if (!form.title.trim()) {
      setError('Worksheet title is required');
      return;
    }

    try {
      const payload = {
        ...form,
        testCases: form.hasCodeEditor ? JSON.stringify(form.testCases.filter(t => t.input || t.expected)) : '[]',
      };

      if (editingWs) {
        await api.updateWorksheet(editingWs.id, payload);
        setSuccessToast(`Worksheet "${form.title}" successfully updated!`);
      } else {
        await api.createWorksheet(payload);
        setSuccessToast(`Worksheet "${form.title}" successfully created!`);
      }

      setShowCreateModal(false);
      loadWorksheets();
    } catch (err) {
      setError(err.message || 'Failed to save worksheet');
    }
  };

  const handleDelete = async (ws) => {
    if (!window.confirm(`Delete worksheet "${ws.title}" and all related student submissions?`)) return;
    try {
      await api.deleteWorksheet(ws.id);
      setSuccessToast(`Worksheet "${ws.title}" deleted.`);
      if (selectedWs?.id === ws.id) setSelectedWs(null);
      loadWorksheets();
    } catch (err) {
      setError(err.message || 'Failed to delete worksheet');
    }
  };

  // Teacher grade submission handler
  const handleGradeSubmission = async (subId, score, feedback) => {
    try {
      await api.updateSubmission(subId, {
        score: parseInt(score, 10),
        feedback,
        status: 'completed',
      });
      setSuccessToast('Student score and feedback evaluation saved!');
      // Reload selected worksheet details
      if (selectedWs) {
        const freshWs = await api.worksheet(selectedWs.id);
        setSelectedWs(freshWs);
      }
      loadWorksheets();
    } catch (err) {
      alert(`Failed to save grade: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Worksheets & Assignments"
        description="Manage interactive worksheets, document attachments (PDF/docs), and Online Code Editor integration"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Worksheet</span>
          </button>
        </div>
      </PageHeader>

      {/* Success Toast */}
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

      {/* Top Class Selection Tabs & KPI Overview */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedClass === c.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>Total: <strong className="text-zinc-800 dark:text-zinc-200">{classStats.total} Tasks</strong></span>
            <span>·</span>
            <span>Avg Completion: <strong className="text-emerald-600 dark:text-emerald-400">{classStats.avgCompletion}%</strong></span>
            <span>·</span>
            <span>Coding Tasks: <strong className="text-indigo-600 dark:text-indigo-400">{classStats.codingTasks} Modules</strong></span>
          </div>
        </div>

        {/* Directed Filter Bar: Status & Type */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold' : 'text-zinc-500'
              }`}
            >
              All ({worksheets.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold' : 'text-zinc-500'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'upcoming' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold' : 'text-zinc-500'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-zinc-500'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
            >
              <option value="all">All Task Types</option>
              <option value="coding">💻 Coding & AI Tasks</option>
              <option value="file">📄 File Attachments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Worksheets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse space-y-3">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              <div className="h-4 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
              <div className="h-10 bg-zinc-50 dark:bg-zinc-800/40 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : filteredWorksheets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            No worksheets match the current filter
          </h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
            Change the status filter or click the button below to create a new worksheet.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Worksheet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorksheets.map((ws, i) => {
            const completedCount = (ws.submissions || []).filter(s => s.status === 'completed').length;
            const totalSubmissions = (ws.submissions || []).length;
            const formattedDiff = formatDifficulty(ws.difficulty);

            return (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Card Header: Difficulty & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${difficultyColors[formattedDiff] || difficultyColors[ws.difficulty] || ''}`}>
                        {formattedDiff}
                      </span>
                      {ws.hasCodeEditor && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                          <Code2 className="w-3 h-3" /> {ws.codeLanguage?.toUpperCase() || 'CODE'}
                        </span>
                      )}
                      {ws.fileUrl && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> File
                        </span>
                      )}
                    </div>
                    <StatusBadge status={ws.status} />
                  </div>

                  {/* Title & Topic */}
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                    Topic: {ws.topic}
                  </p>

                  {/* Key Dates & Meta */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase">Assigned</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{ws.assignedDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase">Due Date</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{ws.dueDate || '—'}</span>
                    </div>
                  </div>

                  {/* Quick Feature Launchers (File Preview / Code Editor) */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {ws.fileUrl && (
                      <button
                        onClick={() => setPreviewFile(ws)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 text-[11px] font-medium transition-colors cursor-pointer"
                        title="Preview Attached File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview File</span>
                      </button>
                    )}

                    {ws.hasCodeEditor && (
                      <button
                        onClick={() => setCodeEditorTarget(ws)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Open Online Code Editor"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Code Editor</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Completion Progress & Submissions summary */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">
                      {totalSubmissions > 0 ? `${completedCount} / ${totalSubmissions} Students` : 'No submissions yet'}
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {ws.completion}% Completed
                    </span>
                  </div>
                  <ProgressBar
                    value={ws.completion}
                    color={ws.completion >= 80 ? 'emerald' : ws.completion >= 50 ? 'amber' : 'indigo'}
                    size="sm"
                    showLabel={false}
                  />

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between mt-4 pt-2">
                    <button
                      onClick={() => {
                        setSelectedWs(ws);
                        setDetailTab('overview');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Details & Submissions</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(ws)}
                        className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Worksheet"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ws)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Worksheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CREATE / EDIT WORKSHEET (WITH FILE UPLOAD & CODE EDITOR CONFIG)  */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowCreateModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {editingWs ? 'Edit Worksheet' : 'Create New Worksheet'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Configure title, instructions file, and Online Code Editor options for student assignments.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 shrink-0">
                  {error}
                </div>
              )}

              {/* Form Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* 1. Class & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Target Class
                    </label>
                    <select
                      value={form.classId}
                      onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Worksheet Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Worksheet 1: Search & Sorting Algorithms"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. Topic & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Syllabus Topic
                    </label>
                    <input
                      type="text"
                      value={form.topic}
                      onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                      placeholder="e.g. Control Flow & Loops"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={form.difficulty}
                      onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* 3. Dates & Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">Assigned Date</label>
                    <input
                      type="date"
                      value={form.assignedDate}
                      onChange={e => setForm(f => ({ ...f, assignedDate: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">Questions Count</label>
                    <input
                      type="number"
                      min="1"
                      value={form.totalQuestions}
                      onChange={e => setForm(f => ({ ...f, totalQuestions: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">Max Score</label>
                    <input
                      type="number"
                      min="10"
                      value={form.maxScore}
                      onChange={e => setForm(f => ({ ...f, maxScore: parseInt(e.target.value, 10) || 100 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                </div>

                {/* 4. Description / Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Instructions & Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Provide assignment guidelines or problem statements students must solve..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                  />
                </div>

                {/* 5. File Upload Section */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-indigo-500" />
                      Attachment Material / Worksheet (PDF, Images, Documents, Code files)
                    </span>
                    {form.fileUrl && (
                      <button
                        type="button"
                        onClick={removeFileAttachment}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Remove File
                      </button>
                    )}
                  </div>

                  {form.fileUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 truncate">
                          {form.fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewFile(form)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 rounded-md border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
                      >
                        Preview
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer bg-white dark:bg-zinc-800/40">
                      <UploadCloud className="w-8 h-8 text-zinc-400 mb-1.5" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {uploadingFile ? 'Uploading...' : 'Click or Drag file here to upload'}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">
                        Supports PDF, PNG, JPG, DOCX, TXT, PY, JS (Max 25MB)
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 6. Online Code Editor Toggle & Config */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.hasCodeEditor}
                        onChange={e => setForm(f => ({ ...f, hasCodeEditor: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-indigo-500" />
                        Enable Online Code Editor Integration for this Task
                      </span>
                    </label>

                    {form.hasCodeEditor && (
                      <select
                        value={form.codeLanguage}
                        onChange={e => setForm(f => ({ ...f, codeLanguage: e.target.value }))}
                        className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript</option>
                        <option value="html">HTML/CSS</option>
                        <option value="sql">SQL</option>
                        <option value="cpp">C++</option>
                      </select>
                    )}
                  </div>

                  {form.hasCodeEditor && (
                    <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Starter Code (Initial template displayed to students)
                        </label>
                        <div className={`rounded-xl overflow-hidden border transition-colors ${
                          starterCodeTheme === 'vs-dark' ? 'border-zinc-800 bg-[#1e1e1e]' : 'border-zinc-300 bg-white shadow-xs'
                        }`}>
                          <div className={`px-3 py-1 border-b flex items-center justify-between text-[11px] font-mono select-none transition-colors ${
                            starterCodeTheme === 'vs-dark' ? 'bg-[#252526] border-[#1e1e1e] text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                          }`}>
                            <span>starter_template.{form.codeLanguage === 'javascript' ? 'js' : form.codeLanguage === 'html' ? 'html' : 'py'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-500 font-semibold">Monaco VS Code</span>
                              <button
                                type="button"
                                onClick={toggleStarterCodeTheme}
                                className={`p-1 rounded cursor-pointer transition ${
                                  starterCodeTheme === 'vs-dark'
                                    ? 'text-amber-400 hover:text-amber-300 hover:bg-zinc-800'
                                    : 'text-amber-600 hover:text-amber-700 hover:bg-zinc-200'
                                }`}
                                title={starterCodeTheme === 'vs-dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                              >
                                {starterCodeTheme === 'vs-dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Editor
                            height="170px"
                            language={form.codeLanguage || 'python'}
                            theme={starterCodeTheme}
                            value={form.starterCode}
                            onChange={(val) => setForm((f) => ({ ...f, starterCode: val || '' }))}
                            options={{
                              fontSize: 12,
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              minimap: { enabled: false },
                              lineNumbers: 'on',
                              scrollBeyondLastLine: false,
                              wordWrap: 'on',
                              automaticLayout: true,
                              tabSize: 4,
                            }}
                          />
                        </div>
                      </div>

                      {/* Test cases builder */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                            Automated Test Cases (Automated Solution Testing)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm(f => ({ ...f, testCases: [...f.testCases, { input: '', expected: '' }] }))
                            }
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            + Add Test Case
                          </button>
                        </div>

                        <div className="space-y-2">
                          {form.testCases.map((tc, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-zinc-400 w-6">#{idx + 1}</span>
                              <input
                                type="text"
                                value={tc.input}
                                onChange={e => {
                                  const updated = [...form.testCases];
                                  updated[idx].input = e.target.value;
                                  setForm(f => ({ ...f, testCases: updated }));
                                }}
                                placeholder="Input (e.g. 5)"
                                className="flex-1 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                              />
                              <span className="text-zinc-400 text-xs">→</span>
                              <input
                                type="text"
                                value={tc.expected}
                                onChange={e => {
                                  const updated = [...form.testCases];
                                  updated[idx].expected = e.target.value;
                                  setForm(f => ({ ...f, testCases: updated }));
                                }}
                                placeholder="Expected Output (e.g. 10)"
                                className="flex-1 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                              />
                              {form.testCases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm(f => ({ ...f, testCases: f.testCases.filter((_, i) => i !== idx) }))
                                  }
                                  className="p-1 text-zinc-400 hover:text-rose-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWorksheet}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingWs ? 'Save Changes' : 'Create Worksheet'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL: WORKSHEET DETAIL & STUDENT SUBMISSIONS REVIEW                    */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {selectedWs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedWs(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {selectedWs.title}
                    </h3>
                    <StatusBadge status={selectedWs.status} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Class: {classes.find(c => c.id === selectedWs.classId)?.name || selectedWs.classId} · Topic: {selectedWs.topic}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWs(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Submissions KPI summary bar */}
              <div className="grid grid-cols-4 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 shrink-0 text-center">
                <div>
                  <div className="text-base font-bold text-emerald-600">
                    {(selectedWs.submissions || []).filter(s => s.status === 'completed').length}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Completed</span>
                </div>
                <div>
                  <div className="text-base font-bold text-amber-600">
                    {(selectedWs.submissions || []).filter(s => s.status === 'pending').length}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Pending</span>
                </div>
                <div>
                  <div className="text-base font-bold text-indigo-600">
                    {selectedWs.completion}%
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Class Progress</span>
                </div>
                <div>
                  <div className="text-base font-bold text-zinc-700 dark:text-zinc-300">
                    {selectedWs.maxScore || 100}
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Max Score</span>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex items-center gap-4 px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0 text-xs">
                <button
                  onClick={() => setDetailTab('overview')}
                  className={`py-3 border-b-2 font-bold transition-colors cursor-pointer ${
                    detailTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Overview & File Attachments
                </button>
                <button
                  onClick={() => setDetailTab('submissions')}
                  className={`py-3 border-b-2 font-bold transition-colors cursor-pointer ${
                    detailTab === 'submissions'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Student Submissions ({(selectedWs.submissions || []).length})
                </button>
              </div>

              {/* Tab 1: Overview */}
              {detailTab === 'overview' && (
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Assignment Instructions
                    </h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 leading-relaxed">
                      {selectedWs.description || 'No special instruction notes. Solve all problems according to the syllabus.'}
                    </p>
                  </div>

                  {/* Attachment Card */}
                  {selectedWs.fileUrl && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Attached Assignment File
                      </h4>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                            <File className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-white">
                              {selectedWs.fileName || 'Attached File'}
                            </div>
                            <span className="text-[11px] text-zinc-400">
                              {selectedWs.fileSize ? `${Math.round(selectedWs.fileSize / 1024)} KB` : 'Supporting Document'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setPreviewFile(selectedWs)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Preview</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Code Editor Configuration */}
                  {selectedWs.hasCodeEditor && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          Online Code Editor Integration ({selectedWs.codeLanguage})
                        </h4>
                        <button
                          onClick={() => setCodeEditorTarget(selectedWs)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Launch Code Editor</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs text-emerald-400 overflow-x-auto">
                        <div className="text-zinc-600 text-[10px] select-none mb-1"># Starter Code Template:</div>
                        <pre>{selectedWs.starterCode || '# No starter code'}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Submissions List & Review */}
              {detailTab === 'submissions' && (
                <div className="p-6 overflow-y-auto flex-1">
                  {(selectedWs.submissions || []).length === 0 ? (
                    <div className="text-center py-12 text-xs text-zinc-400">
                      No students have submitted work for this worksheet yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase font-semibold">
                            <th className="pb-3 px-3">Student Name</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3">Submitted Date</th>
                            <th className="pb-3 px-3">Score</th>
                            <th className="pb-3 px-3 text-right">Review Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {selectedWs.submissions.map(sub => {
                            const std = sub.student;
                            return (
                              <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-white">
                                  {std?.name || sub.studentId}
                                </td>
                                <td className="py-3 px-3">
                                  <StatusBadge status={sub.status} />
                                </td>
                                <td className="py-3 px-3 text-zinc-500 font-mono">
                                  {sub.submittedDate || '—'}
                                </td>
                                <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">
                                  {sub.score !== null && sub.score !== undefined ? `${sub.score} / ${selectedWs.maxScore || 100}` : '—'}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      if (selectedWs.hasCodeEditor) {
                                        setCodeEditorTarget(selectedWs);
                                      }
                                      setReviewingSubmission(sub);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Review Submission</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL: TEACHER REVIEW & SCORE SUBMISSION                                */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {reviewingSubmission && !codeEditorTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setReviewingSubmission(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Evaluate Student Submission
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Student: {reviewingSubmission.student?.name || reviewingSubmission.studentId}
                  </p>
                </div>
                <button
                  onClick={() => setReviewingSubmission(null)}
                  className="p-1 rounded hover:bg-zinc-100 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reviewingSubmission.submittedCode && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                    Student Code Submission
                  </label>
                  <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-40">
                    {reviewingSubmission.submittedCode}
                  </pre>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Grade Score (Max Score: {selectedWs?.maxScore || 100})
                </label>
                <input
                  type="number"
                  defaultValue={reviewingSubmission.score || 0}
                  id="gradeScoreInput"
                  min="0"
                  max={selectedWs?.maxScore || 100}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Teacher Notes / Feedback
                </label>
                <textarea
                  id="gradeFeedbackInput"
                  rows={3}
                  defaultValue={reviewingSubmission.feedback || ''}
                  placeholder="Great job! Sound algorithmic logic and clean formatting..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs leading-relaxed outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setReviewingSubmission(null)}
                  className="px-4 py-2 text-xs text-zinc-500 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const score = document.getElementById('gradeScoreInput')?.value;
                    const feedback = document.getElementById('gradeFeedbackInput')?.value;
                    handleGradeSubmission(reviewingSubmission.id, score, feedback);
                    setReviewingSubmission(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Evaluation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* FILE PREVIEW MODAL                                                      */}
      {/* ======================================================================= */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* ======================================================================= */}
      {/* ONLINE CODE EDITOR MODAL                                                */}
      {/* ======================================================================= */}
      <CodeEditorModal
        isOpen={Boolean(codeEditorTarget)}
        onClose={() => {
          setCodeEditorTarget(null);
          setReviewingSubmission(null);
        }}
        worksheet={codeEditorTarget}
        submission={reviewingSubmission}
        onSubmitted={() => {
          loadWorksheets();
          if (selectedWs) {
            api.worksheet(selectedWs.id).then(fresh => setSelectedWs(fresh));
          }
        }}
      />
    </div>
  );
}
