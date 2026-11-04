import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  FileText,
  Lightbulb,
  Link2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Check,
  ListOrdered,
  Video,
  ExternalLink,
  UploadCloud,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import FilePreviewModal from '../components/FilePreviewModal';
import { api } from '../utils/api';

function parseJSON(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [material, setMaterial] = useState(null);
  const [cls, setCls] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
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
  const [sections, setSections] = useState([]);
  const [keyPoints, setKeyPoints] = useState([]);
  const [references, setReferences] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Quick Deploy Modal State
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployTargetClasses, setDeployTargetClasses] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const mat = await api.material(id);
        setMaterial(mat);
        setForm({
          topic: mat.topic,
          description: mat.description || '',
          learningObjective: mat.learningObjective || '',
          status: mat.status || 'upcoming',
          fileUrl: mat.fileUrl || '',
          fileName: mat.fileName || '',
          fileSize: mat.fileSize || null,
          fileType: mat.fileType || '',
          videoUrl: mat.videoUrl || '',
        });
        setSections(parseJSON(mat.content, []));
        setKeyPoints(parseJSON(mat.keyPoints, []));
        setReferences(parseJSON(mat.references, []));
        const classes = await api.classes();
        setAllClasses(classes);
        setCls(classes.find(c => c.id === mat.classId) || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateSection = (sectionId, patch) => {
    setSections(prev => prev.map(s => (s.id === sectionId ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    setSections(prev => [...prev, { id: genId(), title: '', body: '' }]);
  };

  const removeSection = (sectionId) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const moveSection = (index, direction) => {
    setSections(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addKeyPoint = () => {
    setKeyPoints(prev => [...prev, '']);
  };

  const updateKeyPoint = (index, value) => {
    setKeyPoints(prev => prev.map((k, i) => (i === index ? value : k)));
  };

  const removeKeyPoint = (index) => {
    setKeyPoints(prev => prev.filter((_, i) => i !== index));
  };

  const addReference = () => {
    setReferences(prev => [...prev, { id: genId(), title: '', link: '' }]);
  };

  const updateReference = (refId, patch) => {
    setReferences(prev => prev.map(r => (r.id === refId ? { ...r, ...patch } : r)));
  };

  const removeReference = (refId) => {
    setReferences(prev => prev.filter(r => r.id !== refId));
  };

  const handleFileUpload = async (e) => {
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
    } catch (err) {
      setError(`Failed to upload file: ${err.message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.topic.trim()) {
      setError('Topic title is required');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await api.updateMaterial(id, {
        ...form,
        content: sections.filter(s => s.title.trim() || s.body.trim()),
        keyPoints: keyPoints.map(k => k.trim()).filter(Boolean),
        references: references.filter(r => r.title.trim()),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (deployTargetClasses.length === 0) {
      setError('Select at least one target class');
      return;
    }
    setDeploying(true);
    try {
      const res = await api.deployMaterial({
        materialId: id,
        targetClassIds: deployTargetClasses,
      });
      setDeploySuccess(res.message || 'Module successfully deployed to target classes!');
      setShowDeployModal(false);
      setTimeout(() => setDeploySuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Learning Module Detail" description="Loading learning module..." />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-96" />
          <div className="h-40 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-zinc-500">{error || 'Material module not found'}</p>
        <button onClick={() => navigate('/materials')} className="mt-3 text-sm text-indigo-600 hover:underline">
          Back to Syllabus Modules
        </button>
      </div>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';
  const cardClass = 'bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm';

  return (
    <div className="space-y-6">
      {/* Deploy Success Banner */}
      <AnimatePresence>
        {deploySuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{deploySuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => navigate('/materials')}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Materials List
      </button>

      <PageHeader
        title={form.topic || 'Learning Module Detail'}
        description={cls ? `${cls.name} · Session #${material.orderNumber}` : `Session #${material.orderNumber}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              const nextStatus = form.status === 'active' ? 'upcoming' : 'active';
              setForm(f => ({ ...f, status: nextStatus }));
              try {
                await api.updateMaterial(material.id, { status: nextStatus });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              } catch (e) {
                setError(e.message);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              form.status === 'active' || form.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={form.status === 'active' || form.status === 'completed' ? 'Access open to students. Click to lock.' : 'Module locked for students. Click to unlock.'}
          >
            {form.status === 'active' || form.status === 'completed' ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Student Access: Open</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Student Access: Locked (Unlock)</span>
              </>
            )}
          </button>

          <StatusBadge status={form.status} />

          {/* Quick Deploy Button */}
          <button
            onClick={() => {
              setDeployTargetClasses([]);
              setShowDeployModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Deploy to Other Classes</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/25 transition-all"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </PageHeader>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Overview & Core Fields */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" /> Core Session Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Topic / Module Title *
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. Conditional Logic IF-ELSE"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Publish Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className={`${inputClass} appearance-none`}
              >
                <option value="active">★ Published (In Progress)</option>
                <option value="upcoming">Upcoming</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Module Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this learning material..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Learning Objectives
            </label>
            <textarea
              value={form.learningObjective}
              onChange={e => setForm(f => ({ ...f, learningObjective: e.target.value }))}
              placeholder="Students are able to define conditions and test multiple scenarios..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </motion.div>

        {/* Media & Attachments Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-500" /> Media & Attachments
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Link */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Video Tutorial Link (YouTube)
              </label>
              <div className="relative">
                <Video className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {form.videoUrl && (
                <div className="mt-3">
                  <a
                    href={form.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Video in New Tab</span>
                  </a>
                </div>
              )}
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Handout / Presentation Document (PDF / Slide)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.zip"
              />

              {form.fileUrl ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {form.fileName || 'Attached Document'}
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
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    >
                      Preview Document
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, fileUrl: '', fileName: '', fileSize: null, fileType: '' }))}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      title="Delete attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
                >
                  <UploadCloud className="w-7 h-7 text-zinc-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {uploadingFile ? 'Uploading file...' : 'Click to upload document or slides'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Supports PDF, PPT, Word, Markdown, Images (Max 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-500" /> Content Sections & Subtopics
              <span className="text-xs font-normal text-zinc-400">({sections.length} sections)</span>
            </h3>
            <button
              onClick={addSection}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Detailed topics taught in this session: theory, code examples, case studies, and lab instructions.
          </p>

          {sections.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              <ListOrdered className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No sections added yet. Click "Add Section" above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, i) => (
                <div key={section.id} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60">
                    <span className="text-xs font-mono font-bold text-zinc-400 w-5 text-center">{i + 1}</span>
                    <input
                      type="text"
                      value={section.title}
                      onChange={e => updateSection(section.id, { title: e.target.value })}
                      placeholder="Section Title (e.g. 1. Conditional Logic, 2. Student Grading Case Study)"
                      className="flex-1 px-2 py-1 text-sm bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSection(i, -1)}
                        disabled={i === 0}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSection(i, 1)}
                        disabled={i === sections.length - 1}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={section.body}
                    onChange={e => updateSection(section.id, { body: e.target.value })}
                    placeholder="Write module details, technical explanations, code snippets, or lab instructions here..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none resize-none placeholder-zinc-400"
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Key Points */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Key Takeaways
              <span className="text-xs font-normal text-zinc-400">({keyPoints.length})</span>
            </h3>
            <button
              onClick={addKeyPoint}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Point
            </button>
          </div>

          {keyPoints.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              <Lightbulb className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">No key takeaways added.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keyPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <input
                    type="text"
                    value={point}
                    onChange={e => updateKeyPoint(i, e.target.value)}
                    placeholder="e.g. IF condition always evaluates to boolean True or False"
                    className={`${inputClass} py-2`}
                  />
                  <button
                    onClick={() => removeKeyPoint(i)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-600 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* References */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-sky-500" /> References & Recommended Reading
              <span className="text-xs font-normal text-zinc-400">({references.length})</span>
            </h3>
            <button
              onClick={addReference}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Reference
            </button>
          </div>

          {references.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              <Link2 className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">No references or reading links added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {references.map(ref => (
                <div key={ref.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ref.title}
                    onChange={e => updateReference(ref.id, { title: e.target.value })}
                    placeholder="Reference Title (e.g. Computer Science Textbook Chapter 3)"
                    className={`${inputClass} py-2`}
                  />
                  <input
                    type="text"
                    value={ref.link}
                    onChange={e => updateReference(ref.id, { link: e.target.value })}
                    placeholder="Web URL (optional)"
                    className={`${inputClass} py-2 flex-1`}
                  />
                  <button
                    onClick={() => removeReference(ref.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-600 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => navigate('/materials')}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/25 transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Module Changes'}
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DEPLOY MODAL                                         */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeployModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                      Deploy Session #{material.orderNumber} to Other Classes
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Apply this module to target classes without manual copying.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
                {allClasses
                  .filter(c => c.id !== material.classId)
                  .map(c => {
                    const isChecked = deployTargetClasses.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() =>
                          setDeployTargetClasses(prev =>
                            isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          )
                        }
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                            : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-zinc-300 dark:border-zinc-600'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-medium">{c.name}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={deploying || deployTargetClasses.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {deploying ? 'Deploying...' : `Deploy to ${deployTargetClasses.length} Classes`}
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
