import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle, Download, BookOpen, Code,
  MessageSquare, Play, FileText, CheckCircle2, Video, FileType, Sparkles,
  Code2, ArrowRight, Lock, Unlock
} from 'lucide-react';
import CodePlayground from '../components/code/CodePlayground';
import { getCodeConfigForMaterial } from '../utils/materialCodeHelper';
import api from '../utils/api';

export default function LessonDetail() {
  const { classId, lessonId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'practice'

  useEffect(() => {
    let isMounted = true;
    async function loadLesson() {
      try {
        setLoading(true);
        const data = await api.get(`/api/student-portal/materials/${lessonId}`);
        if (isMounted) setMaterial(data);
      } catch (err) {
        console.warn('Gagal memuat materi:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLesson();
    return () => { isMounted = false; };
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading module content...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold">Material not found</p>
        <button
          onClick={() => navigate('/materials')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          Back to Materials
        </button>
      </div>
    );
  }

  const teacher = material.class?.teacher || { name: 'Subject Teacher', school: 'School LMS' };

  if (material.isLocked) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
          <Lock className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block">
            Locked Module
          </span>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Waiting for Teacher to Unlock
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Teacher <strong className="text-indigo-400">{teacher.name}</strong> has not unlocked module <span className="text-slate-200 font-semibold">"{material.topic || material.title}"</span> yet.
          </p>
          <p className="text-xs text-slate-500">
            Theory notes, attachments, and the interactive coding playground will unlock as soon as your teacher opens this session.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/materials')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
          >
            Back to Materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm hover:text-indigo-500 transition"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div
          className="rounded-2xl p-5 sm:p-7 relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
              MODULE #{material.orderNumber || 1}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                material.semesterNumber === 1
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'bg-purple-500/10 text-purple-500'
              }`}
            >
              Semester {material.semesterNumber || 1}
            </span>
            {material.class && (
              <span className="text-xs font-semibold text-slate-400">
                {material.class.name} • {material.class.subject}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            {material.topic || material.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>Teacher: <strong className="text-indigo-400">{teacher.name}</strong> ({teacher.school || 'SPINS'})</span>
            {material.videoUrl && <span className="flex items-center gap-1 text-red-500 font-semibold"><Play className="w-3.5 h-3.5" /> Video Tutorial</span>}
            {material.fileUrl && <span className="flex items-center gap-1 text-indigo-500 font-semibold"><FileText className="w-3.5 h-3.5" /> Attached Document</span>}
          </div>
        </div>

        {/* Tab Navigation: Teori vs Praktik Coding */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/40 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'theory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Theory & Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 relative ${
              activeTab === 'practice'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Practice Playground & Project Save</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Tab 1: Theory and Lesson Content */}
        {activeTab === 'theory' ? (
          <div className="space-y-6">
            {/* Objectives */}
            {material.learningObjective && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <h2 className="font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2 text-indigo-500">
                  <Sparkles className="w-4 h-4" /> Learning Objectives
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {material.learningObjective}
                </p>
              </div>
            )}

            {/* Key Points */}
            {material.keyPoints && material.keyPoints.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <h2 className="font-bold text-sm uppercase tracking-wider mb-3 text-slate-400">
                  Key Topics & Concepts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {material.keyPoints.map((kp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{typeof kp === 'string' ? kp : kp.point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Sections */}
            {material.content && material.content.length > 0 ? (
              <div className="space-y-4">
                {material.content.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <h3 className="text-base font-bold text-indigo-500 mb-2">
                      {sec.title}
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              material.description && (
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <h3 className="text-base font-bold text-indigo-500 mb-2">Module Description</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                    {material.description}
                  </p>
                </div>
              )
            )}

            {/* Video Lesson */}
            {material.videoUrl && (
              <div
                className="rounded-2xl p-5 bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-6 h-6 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-500">Official Video Lesson</p>
                    <p className="text-xs text-slate-400">Watch the interactive walkthrough</p>
                  </div>
                </div>
                <a
                  href={material.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5" /> Watch Video
                </a>
              </div>
            )}

            {/* File Attachment */}
            {material.fileUrl && (
              <div
                className="rounded-2xl p-5 bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <FileType className="w-6 h-6 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {material.fileName || 'Attached Lesson File'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {material.fileSize ? `${Math.round(material.fileSize / 1024)} KB` : 'Module Document'}
                    </p>
                  </div>
                </div>
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
              </div>
            )}

            {/* Banner to Switch to Practice Tab */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Code2 className="w-4 h-4" /> Ready to Practice Code?
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Open the interactive code editor to test sample code, inspect outputs, and save your practice project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition shrink-0 cursor-pointer"
              >
                <span>Open Code Playground</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Live Code Playground for Hands-on Learning */
          <div className="space-y-4">
            {(() => {
              const codeCfg = getCodeConfigForMaterial(material);
              return (
                <CodePlayground
                  materialId={material.id}
                  title={`${material.topic || material.title} — Practice Session`}
                  language={codeCfg.language}
                  starterCode={codeCfg.starterCode}
                  teacherNotes={codeCfg.teacherNotes}
                  isTestMode={false}
                />
              );
            })()}
          </div>
        )}

        {/* Mark Completed Button */}
        <div className="pt-2">
          {!completed ? (
            <button
              onClick={() => setCompleted(true)}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <CheckCircle className="w-5 h-5" /> Mark Module as Completed
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Module Successfully Completed! ✨
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
