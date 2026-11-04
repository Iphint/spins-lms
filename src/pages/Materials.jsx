import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  ListPlus,
  Eye,
  Send,
  Sparkles,
  UploadCloud,
  FileText,
  Video,
  ExternalLink,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  GraduationCap,
  FolderSync,
  Lock,
  Unlock,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import FilePreviewModal from '../components/FilePreviewModal';
import { api } from '../utils/api';

const SAMPLE_BULK_TEXT = `semester 1
Lesson 1 | Introduction to Python
Lesson 2 | Python Syntax & print()
Lesson 3 | Variables
Lesson 4 | Data Types
Lesson 5 | Type Conversion
Lesson 6 | Input and Output
Lesson 7 | Arithmetic Operators
Lesson 8 | Comparison Operators
Lesson 9 | Logical Operators
Lesson 10 | if Statement
Lesson 11 | if-else Statement
Lesson 12 | elif Statement
Lesson 13 | Nested Conditions
Lesson 14 | Conditional Challenges
Lesson 15 | Review
Lesson 16 | Practical Exercise
Lesson 17 | Mini Project
Lesson 18 | Project Presentation

semester 2
Lesson 19 | Introduction to Loops
Lesson 20 | while Loop
Lesson 21 | while Loop with Conditions
Lesson 22 | for Loop
Lesson 23 | range()
Lesson 24 | Nested Loops
Lesson 25 | break Statement
Lesson 26 | continue Statement
Lesson 27 | Strings and Loops
Lesson 28 | Loop Challenges
Lesson 29 | Problem Solving
Lesson 30 | Debugging
Lesson 31 | Menu-Based Program
Lesson 32 | Mini Project
Lesson 33 | Project Development
Lesson 34 | Project Development
Lesson 35 | Testing and Improvement
Lesson 36 | Final Project`;

function parseBulkMaterials(text, defaultSemester = 1, defaultStartOrder = 1, keepPrefix = false) {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n');
  let currentSemester = defaultSemester || 1;
  let autoOrder = defaultStartOrder || 1;
  const items = [];

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line is a semester header (e.g., "semester 1", "Semester 2", "[Semester 1]", "Semester 1:")
    const semMatch = line.match(/^[#=\-\*\[\s]*semester\s*([12])\b.*$/i);
    if (semMatch) {
      currentSemester = parseInt(semMatch[1], 10);
      continue;
    }

    const parts = line.split('|').map(p => p.trim());
    let order = autoOrder;
    let topic = '';
    let description = '';
    let learningObjective = '';

    const lessonPrefixMatch = parts[0].match(/^(?:lesson|sesi|unit|pertemuan|materi)?\s*(\d+)$/i);

    if (parts.length >= 2 && lessonPrefixMatch) {
      order = parseInt(lessonPrefixMatch[1], 10);
      topic = keepPrefix ? `Lesson ${order}: ${parts[1]}` : parts[1];
      description = parts[2] || '';
      learningObjective = parts[3] || '';
      autoOrder = order + 1;
    } else if (parts.length >= 3) {
      topic = parts[0];
      description = parts[1];
      learningObjective = parts[2];
      order = autoOrder++;
    } else if (parts.length === 2) {
      topic = parts[0];
      description = parts[1];
      order = autoOrder++;
    } else {
      const colonMatch = line.match(/^(?:lesson|sesi|unit|pertemuan|materi)?\s*(\d+)\s*[:—\-]\s*(.+)$/i);
      if (colonMatch) {
        order = parseInt(colonMatch[1], 10);
        topic = keepPrefix ? `Lesson ${order}: ${colonMatch[2].trim()}` : colonMatch[2].trim();
        autoOrder = order + 1;
      } else {
        topic = parts[0];
        order = autoOrder++;
      }
    }

    if (topic) {
      items.push({
        orderNumber: order,
        semesterNumber: currentSemester,
        topic,
        description,
        learningObjective,
      });
    }
  }

  return items;
}

const STANDARD_PRESETS = {};

export default function Materials() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Core Data
  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classMaterialCounts, setClassMaterialCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Action targets
  const [editItem, setEditItem] = useState(null);
  const [deployItem, setDeployItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [form, setForm] = useState({
    orderNumber: 1,
    semesterNumber: 1,
    topic: '',
    description: '',
    learningObjective: '',
    status: 'upcoming',
    fileUrl: '',
    fileName: '',
    fileSize: null,
    fileType: '',
    videoUrl: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  const [bulkForm, setBulkForm] = useState({
    topicsText: '',
    description: '',
    learningObjective: '',
    status: 'upcoming',
    startOrder: 1,
    defaultSemester: 1,
    keepPrefix: false,
  });

  // Deploy Form
  const [deployTargetClasses, setDeployTargetClasses] = useState([]);

  // Clone Form
  const [cloneSourceClass, setCloneSourceClass] = useState('');
  const [cloneTargetClasses, setCloneTargetClasses] = useState([]);

  // Template Form
  const [templateGrade, setTemplateGrade] = useState(7);
  const [templateSemester, setTemplateSemester] = useState('both');
  const [curriculumTemplates, setCurriculumTemplates] = useState({});

  // Show Toast
  const notify = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Initial load
  useEffect(() => {
    async function load() {
      try {
        const c = await api.classes();
        setClasses(c);
        if (c.length > 0) {
          setSelectedClass(c[0].id);
          setCloneSourceClass(c[0].id);
        }
        loadAllClassCounts(c);

        try {
          const tpls = await api.curriculumTemplates();
          if (tpls && Object.keys(tpls).length > 0) {
            setCurriculumTemplates(tpls);
          }
        } catch {
          // ignore error
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadAllClassCounts(clsList) {
    const counts = {};
    for (const cl of clsList) {
      try {
        const mats = await api.materials(cl.id);
        counts[cl.id] = mats.length;
      } catch {
        counts[cl.id] = 0;
      }
    }
    setClassMaterialCounts(counts);
  }

  // Load materials when selected class changes
  useEffect(() => {
    if (!selectedClass) return;
    async function load() {
      setLoading(true);
      try {
        const mats = await api.materials(selectedClass);
        setMaterials(mats);
        setClassMaterialCounts(prev => ({ ...prev, [selectedClass]: mats.length }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedClass]);

  const cls = classes.find(c => c.id === selectedClass);

  // Handlers for Add/Edit Modal
  function openAdd() {
    const nextOrder = materials.length > 0 ? Math.max(...materials.map(m => m.orderNumber)) + 1 : 1;
    setEditItem(null);
    setForm({
      orderNumber: nextOrder,
      semesterNumber: semesterFilter !== 'all' ? parseInt(semesterFilter, 10) : 1,
      topic: '',
      description: '',
      learningObjective: '',
      status: 'upcoming',
      fileUrl: '',
      fileName: '',
      fileSize: null,
      fileType: '',
      videoUrl: '',
    });
    setShowModal(true);
    setError('');
  }

  function openEdit(mat) {
    setEditItem(mat);
    setForm({
      orderNumber: mat.orderNumber,
      semesterNumber: mat.semesterNumber || 1,
      topic: mat.topic,
      description: mat.description || '',
      learningObjective: mat.learningObjective || '',
      status: mat.status,
      fileUrl: mat.fileUrl || '',
      fileName: mat.fileName || '',
      fileSize: mat.fileSize || null,
      fileType: mat.fileType || '',
      videoUrl: mat.videoUrl || '',
    });
    setShowModal(true);
    setError('');
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadMaterialFile(formData);
      setForm(f => ({
        ...f,
        fileUrl: res.fileUrl,
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileType: res.fileType,
      }));
      notify(`File "${file.name}" uploaded successfully.`);
    } catch (err) {
      setError(`Failed to upload file: ${err.message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave() {
    setError('');
    if (!form.topic.trim()) {
      setError('Topik materi wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      if (editItem) {
        await api.updateMaterial(editItem.id, form);
        notify(`Material "${form.topic}" updated successfully.`);
      } else {
        await api.createMaterial({ classId: selectedClass, ...form });
        notify(`Material "${form.topic}" added to ${cls?.name}.`);
      }
      const mats = await api.materials(selectedClass);
      setMaterials(mats);
      setClassMaterialCounts(prev => ({ ...prev, [selectedClass]: mats.length }));
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(mat) {
    if (!confirm(`Delete material #${mat.orderNumber} "${mat.topic}"?`)) return;
    try {
      await api.deleteMaterial(mat.id);
      const updated = materials.filter(m => m.id !== mat.id);
      setMaterials(updated);
      setClassMaterialCounts(prev => ({ ...prev, [selectedClass]: updated.length }));
      notify(`Material "${mat.topic}" deleted.`);
    } catch (err) {
      setError(err.message);
    }
  }

  // Quick Status Toggle on Card (draft -> active -> upcoming -> completed -> draft)
  async function toggleStatus(mat, e) {
    e.stopPropagation();
    const cycle = {
      draft: 'active',
      active: 'completed',
      completed: 'upcoming',
      upcoming: 'draft',
    };
    const nextStatus = cycle[mat.status] || 'active';
    try {
      await api.updateMaterial(mat.id, { status: nextStatus });
      setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, status: nextStatus } : m));
      notify(`Session #${mat.orderNumber} status changed to "${nextStatus}".`);
    } catch (err) {
      setError(err.message);
    }
  }

  // Direct Toggle: Open access for students (active) vs Lock material (upcoming)
  async function toggleOpenAccess(mat, e) {
    e.stopPropagation();
    const isCurrentlyOpen = mat.status === 'active' || mat.status === 'completed';
    const nextStatus = isCurrentlyOpen ? 'upcoming' : 'active';
    try {
      await api.updateMaterial(mat.id, { status: nextStatus });
      setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, status: nextStatus } : m));
      notify(
        nextStatus === 'active'
          ? `Material #${mat.orderNumber} UNLOCKED. Students can now access this lesson.`
          : `Material #${mat.orderNumber} LOCKED. Students must wait for teacher to unlock.`
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function moveMaterial(mat, direction) {
    const idx = materials.findIndex(m => m.id === mat.id);
    const target = idx + direction;
    if (target < 0 || target >= materials.length) return;
    const updated = [...materials];
    const temp = updated[idx].orderNumber;
    updated[idx] = { ...updated[idx], orderNumber: updated[target].orderNumber };
    updated[target] = { ...updated[target], orderNumber: temp };
    updated.sort((a, b) => a.orderNumber - b.orderNumber);
    setMaterials(updated);
    try {
      await api.updateMaterial(mat.id, { orderNumber: updated[idx].orderNumber });
      await api.updateMaterial(updated[target].id, { orderNumber: updated[target].orderNumber });
    } catch (err) {
      setError(err.message);
      const reload = await api.materials(selectedClass);
      setMaterials(reload);
    }
  }

  // Deploy Single Material to Other Classes
  function openDeploy(mat) {
    setDeployItem(mat);
    setDeployTargetClasses([]);
    setShowDeployModal(true);
  }

  async function handleDeploySubmit() {
    if (!deployItem || deployTargetClasses.length === 0) {
      setError('Pilih minimal satu kelas tujuan untuk deployment');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.deployMaterial({
        materialId: deployItem.id,
        targetClassIds: deployTargetClasses,
      });
      notify(res.message || `Material successfully deployed to ${deployTargetClasses.length} classes!`);
      setShowDeployModal(false);
      loadAllClassCounts(classes);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Clone Full Curriculum
  function openClone() {
    setCloneSourceClass(selectedClass);
    setCloneTargetClasses([]);
    setShowCloneModal(true);
  }

  async function handleCloneSubmit() {
    if (!cloneSourceClass || cloneTargetClasses.length === 0) {
      setError('Select at least one target class');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.cloneCurriculum({
        sourceClassId: cloneSourceClass,
        targetClassIds: cloneTargetClasses,
        overwrite: true,
      });
      notify(res.message || 'Syllabus successfully duplicated to target classes!');
      setShowCloneModal(false);
      loadAllClassCounts(classes);
      if (cloneTargetClasses.includes(selectedClass)) {
        const reload = await api.materials(selectedClass);
        setMaterials(reload);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Apply 2-Semester Standard Template
  function openTemplate() {
    const gradeMatch = cls?.name?.match(/\b(1[0-2]|[789])\b/);
    if (gradeMatch) {
      setTemplateGrade(parseInt(gradeMatch[1], 10));
    } else {
      setTemplateGrade(7);
    }
    setTemplateSemester('both');
    setShowTemplateModal(true);
  }

  async function handleApplyTemplate() {
    if (!selectedClass) return;
    const semLabel = templateSemester === 'both' ? 'Both Semesters (Full Year)' : `Semester ${templateSemester}`;
    if (!confirm(`Apply Grade ${templateGrade} (${semLabel}) curriculum to ${cls?.name}? Existing modules for this period will be replaced.`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.applyTemplateCurriculum({
        classId: selectedClass,
        grade: templateGrade,
        semesterNumber: templateSemester === 'both' ? null : parseInt(templateSemester, 10),
      });
      notify(res.message || `Curriculum successfully applied to ${cls?.name}!`);
      setShowTemplateModal(false);
      const reload = await api.materials(selectedClass);
      setMaterials(reload);
      setClassMaterialCounts(prev => ({ ...prev, [selectedClass]: reload.length }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkSave() {
    setError('');
    const parsed = parseBulkMaterials(
      bulkForm.topicsText,
      bulkForm.defaultSemester || 1,
      bulkForm.startOrder || 1,
      bulkForm.keepPrefix || false
    );
    if (parsed.length === 0) {
      setError('Enter at least one material / topic line.');
      return;
    }
    setSubmitting(true);
    try {
      await api.bulkMaterials({
        classId: selectedClass,
        topics: parsed,
        status: bulkForm.status || 'upcoming',
      });
      const mats = await api.materials(selectedClass);
      setMaterials(mats);
      setClassMaterialCounts(prev => ({ ...prev, [selectedClass]: mats.length }));
      setShowBulkModal(false);
      notify(`${parsed.length} materials added in bulk successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered Materials
  const filteredMaterials = materials.filter(m => {
    if (semesterFilter !== 'all' && (m.semesterNumber || 1) !== parseInt(semesterFilter, 10)) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const topicMatch = m.topic?.toLowerCase().includes(q);
      const descMatch = m.description?.toLowerCase().includes(q);
      const loMatch = m.learningObjective?.toLowerCase().includes(q);
      return topicMatch || descMatch || loMatch;
    }
    return true;
  });

  // Summary counts
  const sem1Count = materials.filter(m => (m.semesterNumber || 1) === 1).length;
  const sem2Count = materials.filter(m => (m.semesterNumber || 1) === 2).length;
  const completedCount = materials.filter(m => m.status === 'completed').length;
  const activeCount = materials.filter(m => m.status === 'active').length;
  const draftCount = materials.filter(m => m.status === 'draft').length;
  const upcomingCount = materials.filter(m => m.status === 'upcoming').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header with Action Bar */}
      <PageHeader
        title="Syllabus & Learning Materials"
        description="Design comprehensive course curriculum, deploy materials across parallel classes, and track learning progress."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Template Preset Button */}
          <button
            onClick={openTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Apply 16-session curriculum framework"
          >
            <Sparkles className="w-4 h-4" />
            <span>16-Session Template</span>
          </button>

          {/* Clone Curriculum Button */}
          <button
            onClick={openClone}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Copy entire syllabus from this class to other classes"
          >
            <FolderSync className="w-4 h-4" />
            <span>Copy to Classes</span>
          </button>

          {/* Bulk Add Button */}
          <button
            onClick={() => {
              const nextOrder = materials.length > 0 ? Math.max(...materials.map(m => m.orderNumber)) + 1 : 1;
              setBulkForm({ topicsText: '', description: '', learningObjective: '', status: 'upcoming', startOrder: nextOrder });
              setShowBulkModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-colors"
          >
            <ListPlus className="w-4 h-4" />
            <span>Bulk Add</span>
          </button>

          {/* Add Material Button */}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Material</span>
          </button>
        </div>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Class Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {classes.map(c => {
          const count = classMaterialCounts[c.id] ?? 0;
          const isSelected = selectedClass === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{c.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {count} Modul
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary Banner & Progress */}
      {materials.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  Silabus Pembelajaran {cls?.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Target: 16 Pertemuan Semester
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Tersedia {materials.length} modul terdaftar. Klik badge status pada materi untuk mengubah status aktif atau draf secara cepat.
              </p>
            </div>

            {/* Quick Stat Chips */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                <span className="font-bold">{materials.length}</span> Total
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="font-bold">{activeCount}</span> Aktif Berjalan
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="font-bold">{completedCount}</span> Selesai
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-medium">
                <span className="font-bold">{draftCount}</span> Draf
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
              <span>Kelengkapan Silabus ({Math.round((materials.length / 16) * 100)}%)</span>
              <span>{materials.length} / 16 Pertemuan</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${(completedCount / 16) * 100}%` }}
                title={`Selesai: ${completedCount}`}
              />
              <div
                className="bg-indigo-500 transition-all duration-500"
                style={{ width: `${(activeCount / 16) * 100}%` }}
                title={`Aktif: ${activeCount}`}
              />
              <div
                className="bg-sky-400 transition-all duration-500"
                style={{ width: `${(upcomingCount / 16) * 100}%` }}
                title={`Akan Datang: ${upcomingCount}`}
              />
              <div
                className="bg-zinc-400 dark:bg-zinc-600 transition-all duration-500"
                style={{ width: `${(draftCount / 16) * 100}%` }}
                title={`Draf: ${draftCount}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Semester Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl overflow-x-auto text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <button
              onClick={() => setSemesterFilter('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                semesterFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Semesters ({materials.length})
            </button>
            <button
              onClick={() => setSemesterFilter('1')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                semesterFilter === '1'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold shadow-blue-500/20'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${semesterFilter === '1' ? 'bg-white' : 'bg-blue-500'}`} />
              Semester 1 ({sem1Count})
            </button>
            <button
              onClick={() => setSemesterFilter('2')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                semesterFilter === '2'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold shadow-purple-500/20'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${semesterFilter === '2' ? 'bg-white' : 'bg-purple-500'}`} />
              Semester 2 ({sem2Count})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics / modules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-xl overflow-x-auto text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            All Status ({materials.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            ★ Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'draft'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Draft ({draftCount})
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'upcoming'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              statusFilter === 'completed'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
          ))
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <BookMarked className="w-14 h-14 text-indigo-400/50 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
              {searchQuery || statusFilter !== 'all' ? 'No materials found' : `No materials yet for ${cls?.name}`}
            </h4>
            <p className="text-zinc-500 text-xs max-w-md mx-auto mt-1 mb-5">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter tabs.'
                : 'Use the 16-session curriculum template, copy from another class, or add a new material.'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={openTemplate}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" /> Apply 16-Session Template
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create First Material
              </button>
            </div>
          </div>
        ) : (
          filteredMaterials.map((mat, i) => {
            const isActive = mat.status === 'active';
            const isDraft = mat.status === 'draft';
            return (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-indigo-500/60 dark:border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/15 shadow-sm ring-1 ring-indigo-500/20'
                    : isDraft
                    ? 'border-dashed border-zinc-300 dark:border-zinc-700 opacity-90'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Reorder Buttons & Session Pill */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                    <button
                      onClick={() => moveMaterial(mat, -1)}
                      disabled={i === 0}
                      className="p-0.5 text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-sm ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      #{String(mat.orderNumber).padStart(2, '0')}
                    </div>
                    <button
                      onClick={() => moveMaterial(mat, 1)}
                      disabled={i === filteredMaterials.length - 1}
                      className="p-0.5 text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Topic & Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border ${
                        (mat.semesterNumber || 1) === 1
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      }`}>
                        Sem {(mat.semesterNumber || 1)}
                      </span>
                      <h4
                        onClick={() => navigate(`/materials/${mat.id}`)}
                        className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                      >
                        {mat.topic}
                      </h4>

                      {/* Interactive Open/Lock Button */}
                      <button
                        onClick={(e) => toggleOpenAccess(mat, e)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          mat.status === 'active' || mat.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                        title={mat.status === 'active' || mat.status === 'completed' ? 'Student access open. Click to lock.' : 'Locked for students. Click to open access.'}
                      >
                        {mat.status === 'active' || mat.status === 'completed' ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Access Open</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked (Unlock Access)</span>
                          </>
                        )}
                      </button>

                      {/* Interactive Status Pill */}
                      <button
                        onClick={(e) => toggleStatus(mat, e)}
                        className="transition-transform active:scale-95"
                        title="Klik untuk ubah status secara instan"
                      >
                        <StatusBadge status={mat.status} />
                      </button>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          ★ Sedang Berlangsung
                        </span>
                      )}
                    </div>

                    {mat.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                        {mat.description}
                      </p>
                    )}

                    {mat.learningObjective && (
                      <p className="text-[11px] text-zinc-400 italic line-clamp-1 mt-1">
                        🎯 {mat.learningObjective}
                      </p>
                    )}

                    {/* Attachments & Links Badges */}
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      {mat.fileUrl && (
                        <button
                          onClick={() => setPreviewFile({ fileName: mat.fileName || 'Modul Silabus', fileUrl: mat.fileUrl })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-colors group/btn"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="truncate max-w-[140px]">{mat.fileName || 'Lampiran Berkas'}</span>
                          <Eye className="w-3 h-3 text-zinc-400 group-hover/btn:text-zinc-600 dark:group-hover/btn:text-zinc-200" />
                        </button>
                      )}

                      {mat.videoUrl && (
                        <a
                          href={mat.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Tutorial</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Toolbar */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 w-full md:w-auto justify-end">
                  {/* Deploy Button */}
                  <button
                    onClick={() => openDeploy(mat)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition-colors"
                    title="Deploy this material to other classes"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Deploy</span>
                  </button>

                  {/* View Detail */}
                  <button
                    onClick={() => navigate(`/materials/${mat.id}`)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Open details & customize session"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(mat)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit material module"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(mat)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Delete material module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: DEPLOY MATERI KE KELAS LAIN                */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showDeployModal && deployItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeployModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                      Deploy to Other Classes
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Apply this module directly to target classes without retyping.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source Material Card */}
              <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                    Session #{deployItem.orderNumber}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                    {deployItem.topic}
                  </span>
                </div>
                {deployItem.description && (
                  <p className="text-xs text-zinc-500 line-clamp-1">{deployItem.description}</p>
                )}
              </div>

              {/* Target Classes Selection */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Select Target Classes
                  </label>
                  <button
                    onClick={() => {
                      const otherClasses = classes.filter(c => c.id !== selectedClass).map(c => c.id);
                      if (deployTargetClasses.length === otherClasses.length) {
                        setDeployTargetClasses([]);
                      } else {
                        setDeployTargetClasses(otherClasses);
                      }
                    }}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    {deployTargetClasses.length === classes.filter(c => c.id !== selectedClass).length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {classes
                    .filter(c => c.id !== selectedClass)
                    .map(c => {
                      const isChecked = deployTargetClasses.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setDeployTargetClasses(prev =>
                              isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                              : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                          <span className="text-xs text-zinc-400">
                            {classMaterialCounts[c.id] ?? 0} modules currently
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploySubmit}
                  disabled={submitting || deployTargetClasses.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Deploying...' : `Deploy to ${deployTargetClasses.length} Classes`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: DUPLIKASI SELURUH SILABUS (CLONE)           */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showCloneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCloneModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                    <FolderSync className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                      Copy Syllabus Between Classes
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Duplicate all syllabus modules simultaneously from one class to another.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {/* Source Class */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Source Class (Origin)
                  </label>
                  <select
                    value={cloneSourceClass}
                    onChange={e => {
                      setCloneSourceClass(e.target.value);
                      setCloneTargetClasses(prev => prev.filter(id => id !== e.target.value));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({classMaterialCounts[c.id] ?? 0} Modules)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Classes Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Select Target Classes
                    </label>
                    <button
                      onClick={() => {
                        const available = classes.filter(c => c.id !== cloneSourceClass).map(c => c.id);
                        if (cloneTargetClasses.length === available.length) {
                          setCloneTargetClasses([]);
                        } else {
                          setCloneTargetClasses(available);
                        }
                      }}
                      className="text-xs text-purple-600 hover:underline font-medium"
                    >
                      {cloneTargetClasses.length === classes.filter(c => c.id !== cloneSourceClass).length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {classes
                      .filter(c => c.id !== cloneSourceClass)
                      .map(c => {
                        const isChecked = cloneTargetClasses.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setCloneTargetClasses(prev =>
                                isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                              );
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200'
                                : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'border-zinc-300 dark:border-zinc-600'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="text-sm font-medium">{c.name}</span>
                            </div>
                            <span className="text-xs text-zinc-400">
                              {classMaterialCounts[c.id] ?? 0} current modules
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p>
                    <strong>Notice:</strong> Syllabus modules in target classes will be synchronized with the source class modules so topic sequences across parallel classes remain consistent.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneSubmit}
                  disabled={submitting || cloneTargetClasses.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-500/25 transition-all"
                >
                  <FolderSync className="w-4 h-4" />
                  {submitting ? 'Copying...' : `Copy to ${cloneTargetClasses.length} Classes`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: TEMPLATE SILABUS 16 PERTEMUAN               */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTemplateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                      Curriculum Syllabus Template
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Apply structured curriculum syllabus to {cls?.name}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grade Tabs */}
              <div className="flex items-center gap-1.5 mt-4 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl shrink-0 overflow-x-auto">
                {[7, 8, 9, 10, 11, 12].map(gr => (
                  <button
                    key={gr}
                    onClick={() => setTemplateGrade(gr)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      templateGrade === gr
                        ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    Grade {gr}
                  </button>
                ))}
              </div>

              {/* Semester Selector */}
              <div className="flex items-center gap-1.5 mt-3 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl shrink-0 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setTemplateSemester('both')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    templateSemester === 'both'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-semibold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Both Semesters (Full Year)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateSemester('1')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    templateSemester === '1'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Semester 1 Only
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateSemester('2')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    templateSemester === '2'
                      ? 'bg-purple-600 text-white font-semibold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Semester 2 Only
                </button>
              </div>

              {/* Preview Units List or Empty State */}
              {(() => {
                const cur = curriculumTemplates[templateGrade];
                const units = [];
                if (cur && cur.semesters) {
                  if (templateSemester === 'both' || templateSemester === '1') {
                    (cur.semesters[1]?.units || []).forEach(u => units.push({ ...u, sem: 1 }));
                  }
                  if (templateSemester === 'both' || templateSemester === '2') {
                    (cur.semesters[2]?.units || []).forEach(u => units.push({ ...u, sem: 2 }));
                  }
                }

                if (units.length === 0) {
                  return (
                    <div className="mt-4 p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                      <BookOpen className="w-10 h-10 mx-auto text-zinc-400 mb-2 opacity-40" />
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Curriculum Template Available</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        Dummy data has been disabled. You can create real learning modules manually using <strong>+ Add Material</strong> or clone syllabus from another class.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/30 shrink-0">
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                        {cur.title || `Grade ${templateGrade} — Curriculum`}
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        {cur.tagline || 'Progressive curriculum syllabus.'}
                      </p>
                    </div>
                    <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-2 px-1">
                        <span>List of {units.length} Modules to Apply:</span>
                        <span className="text-[11px] text-zinc-400">
                          {templateSemester === 'both' ? 'Semesters 1 & 2' : `Semester ${templateSemester}`}
                        </span>
                      </div>
                      {units.map((u, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                            u.sem === 1
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          }`}>
                            Sem {u.sem}
                          </span>
                          <span className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-mono font-bold flex items-center justify-center shrink-0">
                            {u.unitNumber || idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-white truncate">{u.topic}</p>
                            {u.subtopics && u.subtopics.length > 0 && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                {u.subtopics.join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={submitting || !curriculumTemplates[templateGrade]}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {submitting ? 'Applying...' : `Apply to ${cls?.name}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: ADD / EDIT MATERIAL (WITH FILE & VIDEO)     */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                    {editItem ? 'Edit Learning Module' : 'Add Learning Module'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {cls?.name} · Manage topic, presentation files/handouts, and video lesson link.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {/* Semester, Order & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Semester
                    </label>
                    <select
                      value={form.semesterNumber}
                      onChange={e => setForm(f => ({ ...f, semesterNumber: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Session / Lesson Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.orderNumber}
                      onChange={e => setForm(f => ({ ...f, orderNumber: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Publish Status
                    </label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">★ Published (Active)</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Topic / Module Title *
                  </label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Introduction to Python & Turtle Graphics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Brief Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the learning materials for this session..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Learning Objective */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Learning Objectives
                  </label>
                  <textarea
                    value={form.learningObjective}
                    onChange={e => setForm(f => ({ ...f, learningObjective: e.target.value }))}
                    placeholder="Students understand loop concepts and can generate patterns..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Video Lesson Link (YouTube / Video URL)
                  </label>
                  <div className="relative">
                    <Video className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* File Attachment Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Module File Attachment (PPT / PDF / Handout)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.zip"
                  />

                  {form.fileUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {form.fileName || 'Attached File'}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {form.fileSize ? `${Math.round(form.fileSize / 1024)} KB` : 'Ready for students'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewFile({ fileName: form.fileName, fileUrl: form.fileUrl })}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, fileUrl: '', fileName: '', fileSize: null, fileType: '' }))}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-4 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
                    >
                      <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {uploadingFile ? 'Uploading file...' : 'Click to upload slides or PDF document'}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        PDF, PPT, Word, Markdown, Images (Max 25 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting || uploadingFile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Saving...' : editItem ? 'Update Module' : 'Save Module'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: BULK ADD MODAL (SEMESTER 1 & 2 READY)       */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBulkModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[92vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                    Bulk Syllabus Import — {cls?.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Supports automatic <strong>Semester 1</strong> &amp; <strong>Semester 2</strong> separation and format <code className="text-indigo-600 dark:text-indigo-400 font-bold">Lesson X | Topic Title</code>.
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fast Presets Action Bar */}
              <div className="flex items-center justify-between gap-2 mt-3 pt-1 pb-1 shrink-0 flex-wrap">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Quick Presets / Templates:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkForm(f => ({ ...f, topicsText: SAMPLE_BULK_TEXT }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load 36 Lessons (Sem 1 &amp; 2)</span>
                  </button>
                  {bulkForm.topicsText && (
                    <button
                      type="button"
                      onClick={() => setBulkForm(f => ({ ...f, topicsText: '' }))}
                      className="text-xs text-rose-600 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-3 flex-1 overflow-y-auto pr-1">
                {/* Options Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Initial Status
                    </label>
                    <select
                      value={bulkForm.status}
                      onChange={e => setBulkForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Default Semester
                    </label>
                    <select
                      value={bulkForm.defaultSemester || 1}
                      onChange={e => setBulkForm(f => ({ ...f, defaultSemester: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                    >
                      <option value={1}>Semester 1 (Odd)</option>
                      <option value={2}>Semester 2 (Even)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Start From Lesson #
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bulkForm.startOrder || 1}
                      onChange={e => setBulkForm(f => ({ ...f, startOrder: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Module List (One per line)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(bulkForm.keepPrefix)}
                        onChange={e => setBulkForm(f => ({ ...f, keepPrefix: e.target.checked }))}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Include "Lesson X:" prefix in title</span>
                    </label>
                  </div>
                  <textarea
                    value={bulkForm.topicsText}
                    onChange={e => setBulkForm(f => ({ ...f, topicsText: e.target.value }))}
                    placeholder={`semester 1\nLesson 1 | Introduction to Python\nLesson 2 | Python Syntax & print()\n...\nsemester 2\nLesson 19 | Introduction to Loops`}
                    rows={8}
                    className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Live Parser Statistics & Preview */}
                {(() => {
                  const parsed = parseBulkMaterials(
                    bulkForm.topicsText,
                    bulkForm.defaultSemester || 1,
                    bulkForm.startOrder || 1,
                    bulkForm.keepPrefix || false
                  );
                  const pSem1 = parsed.filter(p => p.semesterNumber === 1);
                  const pSem2 = parsed.filter(p => p.semesterNumber === 2);

                  if (parsed.length === 0) {
                    return (
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-500 text-center">
                        No module topics entered yet. Type or paste syllabus lines above.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs">
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                          ✨ Total {parsed.length} Modules Detected
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                            Sem 1: {pSem1.length}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                            Sem 2: {pSem2.length}
                          </span>
                        </div>
                      </div>

                      <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
                        {parsed.slice(0, 36).map((item, idx) => (
                          <div key={idx} className="p-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                item.semesterNumber === 1
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              }`}>
                                Sem {item.semesterNumber}
                              </span>
                              <span className="font-mono text-zinc-500 font-bold shrink-0">
                                #{item.orderNumber}
                              </span>
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {item.topic}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSave}
                  disabled={submitting || !bulkForm.topicsText.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/25 cursor-pointer"
                >
                  <ListPlus className="w-4 h-4" />
                  {submitting ? 'Saving...' : `Save ${parseBulkMaterials(bulkForm.topicsText, bulkForm.defaultSemester, bulkForm.startOrder, bulkForm.keepPrefix).length} Modules`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* FILE PREVIEW MODAL                                   */}
      {/* ---------------------------------------------------- */}
      {previewFile && (
        <FilePreviewModal
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          file={previewFile}
        />
      )}
    </div>
  );
}
