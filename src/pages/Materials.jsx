import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Filter, FileType, Video, Code, Link2, Presentation,
  Download, Bookmark, BookmarkCheck, X, ExternalLink, CheckCircle2, Eye,
  BookOpen, Clock, User, Sparkles, Check, ChevronRight, School, ArrowRight,
  Code2, Play, Terminal, Lock, Unlock, AlertCircle
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import CodePlayground from '../components/code/CodePlayground';
import { getCodeConfigForMaterial } from '../utils/materialCodeHelper';
import api from '../utils/api';

const typeIcons = { slides: Presentation, pdf: FileType, video: Video, code: Code, link: Link2 };
const typeColors = {
  slides: 'text-orange-500 bg-orange-100 dark:bg-orange-500/20',
  pdf: 'text-red-500 bg-red-100 dark:bg-red-500/20',
  video: 'text-purple-500 bg-purple-100 dark:bg-purple-500/20',
  code: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-500/20',
  link: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20'
};

export default function Materials() {
  const [materialsList, setMaterialsList] = useState([]);
  const [enrolledClass, setEnrolledClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all'); // 'all' | '1' | '2'
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('theory'); // 'theory' | 'practice'
  const [readModules, setReadModules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('student_read_modules') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [mats, classes] = await Promise.all([
          api.get('/api/student-portal/materials'),
          api.get('/api/student-portal/classes').catch(() => []),
        ]);
        if (isMounted) {
          setMaterialsList(Array.isArray(mats) ? mats : []);
          if (Array.isArray(classes) && classes.length > 0) {
            setEnrolledClass(classes[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch materials from API:', err.message);
        if (isMounted) setMaterialsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const toggleMarkAsRead = (id) => {
    setReadModules((prev) => {
      const next = prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id];
      try {
        localStorage.setItem('student_read_modules', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const sem1Count = useMemo(() => materialsList.filter((m) => m.semesterNumber === 1).length, [materialsList]);
  const sem2Count = useMemo(() => materialsList.filter((m) => m.semesterNumber === 2).length, [materialsList]);

  const filtered = useMemo(() => {
    return materialsList.filter((m) => {
      const matchSearch =
        (m.title || m.topic || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.learningObjective || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchSemester =
        semesterFilter === 'all' || String(m.semesterNumber) === String(semesterFilter);
      return matchSearch && matchType && matchSemester;
    });
  }, [materialsList, search, typeFilter, semesterFilter]);

  const subjectName = enrolledClass?.subject || 'Mata Pelajaran Komputasi';
  const className = enrolledClass?.name || 'Kelas Anda';
  const teacherName = enrolledClass?.teacher?.name || 'Muhammad Arifin';
  const schoolName = enrolledClass?.teacher?.school || 'SPINS';

  return (
    <div>
      <PageHeader
        title="Materi Pembelajaran (Learning Materials)"
        subtitle={`Silabus modul digital resmi untuk ${subjectName} • ${schoolName}`}
        icon={FileText}
      />

      {/* Class & Subject Info Card */}
      {enrolledClass && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white uppercase">
                  {className}
                </span>
                <span className="text-xs font-semibold text-indigo-400">
                  {enrolledClass.semester || 'Active Semester'}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {subjectName}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Instructor: <span className="font-semibold text-indigo-400">{teacherName}</span> • {schoolName} • {materialsList.length} Total Sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-500/10 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{readModules.length} of {materialsList.length} modules completed</span>
          </div>
        </div>
      )}

      {/* Semester Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => setSemesterFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            semesterFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={semesterFilter !== 'all' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
        >
          <span>All Semesters</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${semesterFilter === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
            {materialsList.length}
          </span>
        </button>

        <button
          onClick={() => setSemesterFilter('1')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            semesterFilter === '1'
              ? 'bg-blue-600 text-white shadow-md'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={semesterFilter !== '1' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
        >
          <span>Semester 1</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${semesterFilter === '1' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
            {sem1Count}
          </span>
        </button>

        <button
          onClick={() => setSemesterFilter('2')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            semesterFilter === '2'
              ? 'bg-purple-600 text-white shadow-md'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={semesterFilter !== '2' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
        >
          <span>Semester 2</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${semesterFilter === '2' ? 'bg-purple-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
            {sem2Count}
          </span>
        </button>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Cari materi, topik modul, atau konsep materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">Semua Format Pembelajaran</option>
          {['pdf', 'slides', 'video', 'code', 'link'].map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Grid of Materials */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Memuat materi pembelajaran...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-400" />
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            No materials found
          </h3>
          <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            {materialsList.length === 0
              ? `Learning materials for ${subjectName} will be shared soon by ${teacherName}.`
              : 'Please adjust your search keywords or semester filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => {
            const isRead = readModules.includes(m.id);
            const semNum = m.semesterNumber || 1;
            const displayTitle = m.topic || m.title;

            return (
              <motion.div
                key={m.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ y: -3 }}
                onClick={() => {
                  setSelectedMaterial(m);
                  setActiveModalTab('theory');
                }}
                className={`rounded-2xl p-4 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  m.isLocked ? 'opacity-90 border-amber-500/20' : ''
                }`}
                style={{ backgroundColor: 'var(--bg-card)', border: m.isLocked ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)' }}
              >
                {/* Top badges */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        semNum === 1
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}
                    >
                      Sem {semNum} • #{m.orderNumber || i + 1}
                    </span>

                    {m.isLocked ? (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : isRead ? (
                      <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        <Unlock className="w-3 h-3" /> Open
                      </span>
                    )}
                  </div>

                  <h4
                    className="text-sm font-bold line-clamp-2 group-hover:text-indigo-500 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {displayTitle}
                  </h4>

                  <p className="text-xs line-clamp-2 mt-1.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {m.description || m.learningObjective || `Module #${m.orderNumber || i + 1} for ${subjectName}.`}
                  </p>

                  {/* Key points preview */}
                  {!m.isLocked && m.keyPoints && m.keyPoints.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {m.keyPoints.slice(0, 2).map((kp, kIdx) => (
                        <span
                          key={kIdx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[150px]"
                        >
                          {typeof kp === 'string' ? kp : kp.point}
                        </span>
                      ))}
                      {m.keyPoints.length > 2 && (
                        <span className="text-[10px] text-indigo-400 font-bold px-1 py-0.5">
                          +{m.keyPoints.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {m.isLocked && (
                    <div className="mt-2 text-[11px] text-amber-600/90 dark:text-amber-400/90 font-medium flex items-center gap-1 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>Waiting for teacher to unlock</span>
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div
                  className="pt-3 mt-3 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <span className="text-[11px] font-semibold text-slate-400">
                    {m.isLocked ? 'Access Locked' : m.content && m.content.length > 0 ? `${m.content.length} Sections` : 'Study Material'}
                  </span>
                  {m.isLocked ? (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </span>
                  ) : (
                    <span className="text-indigo-500 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Module <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
            onClick={() => setSelectedMaterial(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {/* Modal Top Header */}
              <div>
                <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
                        MODULE #{selectedMaterial.orderNumber || 1}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          selectedMaterial.semesterNumber === 1
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}
                      >
                        Semester {selectedMaterial.semesterNumber || 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {subjectName}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                      {selectedMaterial.topic || selectedMaterial.title}
                    </h2>
                    <p className="text-xs mt-1 text-slate-400">
                      Instructor: <span className="font-semibold text-indigo-400">{teacherName}</span> ({schoolName})
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedMaterial(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>

                {/* Modal Content: Locked State vs Open State */}
                {selectedMaterial.isLocked ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto my-auto">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
                      <Lock className="w-10 h-10 animate-bounce" />
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block">
                        Access Locked
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                        Module Locked by Teacher
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Instructor <strong className="text-indigo-400">{teacherName}</strong> has not unlocked module <span className="font-semibold text-slate-200">"{selectedMaterial.topic || selectedMaterial.title}"</span> yet.
                      </p>
                      <p className="text-xs text-slate-500">
                        Module theory, downloadable attachments, and the interactive coding playground will automatically unlock once the teacher activates this session in class.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMaterial(null)}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Close & Back to List
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Tab Switcher: Theory vs Code Practice */}
                    <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('theory')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                          activeModalTab === 'theory'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>1. Theory & Guide</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModalTab('practice')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
                          activeModalTab === 'practice'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50'
                        }`}
                      >
                        <Code2 className="w-4 h-4" />
                        <span>2. Code Practice & Playground</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </button>
                    </div>

                    {/* Modal Body: Active Tab Content */}
                    {activeModalTab === 'theory' ? (
                      <div className="py-5 space-y-5">
                        {/* Learning Objective */}
                        {selectedMaterial.learningObjective && (
                          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Learning Objectives
                            </h4>
                            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                              {selectedMaterial.learningObjective}
                            </p>
                          </div>
                        )}

                        {/* Key Points */}
                        {selectedMaterial.keyPoints && selectedMaterial.keyPoints.length > 0 && (
                          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                              Key Topics & Concepts
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedMaterial.keyPoints.map((kp, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{typeof kp === 'string' ? kp : kp.point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Content Sections */}
                        {selectedMaterial.content && selectedMaterial.content.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Module Content & Explanation
                            </h4>
                            {selectedMaterial.content.map((sec, sIdx) => (
                              <div
                                key={sec.id || sIdx}
                                className="p-4 rounded-2xl border"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                              >
                                <h5 className="font-bold text-sm text-indigo-500 mb-2">
                                  {sec.title}
                                </h5>
                                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                                  {sec.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          selectedMaterial.description && (
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Module Summary
                              </h4>
                              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                                {selectedMaterial.description}
                              </p>
                            </div>
                          )
                        )}

                        {/* Video URL */}
                        {selectedMaterial.videoUrl && (
                          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Video className="w-6 h-6 text-red-500" />
                              <div>
                                <p className="text-sm font-bold text-red-500">Video Walkthrough Available</p>
                                <p className="text-xs text-slate-400">Watch the video explanation for this session</p>
                              </div>
                            </div>
                            <a
                              href={selectedMaterial.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                            >
                              Watch Video <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

                        {/* Attached File */}
                        {selectedMaterial.fileUrl && (
                          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileType className="w-6 h-6 text-indigo-500" />
                              <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                  {selectedMaterial.fileName || 'Attachment Document'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {selectedMaterial.fileSize ? `${Math.round(selectedMaterial.fileSize / 1024)} KB` : 'PDF / Slide Resource'}
                                </p>
                              </div>
                            </div>
                            <a
                              href={selectedMaterial.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" /> Download File
                            </a>
                          </div>
                        )}

                        {/* Banner to switch to Practice Code */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                              <Code2 className="w-4 h-4" /> Ready to Practice?
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Open the interactive code editor to test instructor code, run programs, and save your project.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveModalTab('practice')}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                          >
                            <span>Start Coding Practice</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-4">
                        {(() => {
                          const codeCfg = getCodeConfigForMaterial(selectedMaterial);
                          return (
                            <CodePlayground
                              materialId={selectedMaterial.id}
                              title={`${selectedMaterial.topic || selectedMaterial.title} — Hands-on Practice`}
                              language={codeCfg.language}
                              starterCode={codeCfg.starterCode}
                              teacherNotes={codeCfg.teacherNotes}
                              isTestMode={false}
                            />
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
                {!selectedMaterial.isLocked && (
                  <button
                    type="button"
                    onClick={() => toggleMarkAsRead(selectedMaterial.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      readModules.includes(selectedMaterial.id)
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {readModules.includes(selectedMaterial.id) ? 'Completed (Mark Incomplete)' : 'Mark as Completed'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-auto cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {selectedMaterial.isLocked ? 'Close' : 'Close Module'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
