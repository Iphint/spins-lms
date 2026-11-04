import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ListPlus, CheckCircle2, AlertCircle, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

function guessGender(name) {
  const lower = (name || '').toLowerCase().trim();
  const first = lower.split(/\s+/)[0] || '';
  const femaleNames = [
    'celline', 'celine', 'chanel', 'clarisya', 'gretchen', 'kimberly', 'nadine',
    'haifa', 'naura', 'videllea', 'ailynn', 'evita', 'iswarya', 'jane', 'jesslyn',
    'meyra', 'aurora', 'reinetta', 'cryztalline', 'eugenia', 'gwen', 'siti', 'putri',
    'dewi', 'ayu', 'zahra', 'nur', 'sarah', 'dian'
  ];
  if (femaleNames.includes(first) || first.endsWith('a') || first.endsWith('i') || first.endsWith('yn') || first.endsWith('ine')) {
    return 'F';
  }
  return 'M';
}

const SAMPLE_7S = `Ailynn Kei Sutanto
Celine Laurenn Tio
Evita Kaylynn
Gede Arjuna Laksadeva
Grady Farrell Feng
Iswarya Lakshmi Mukkara Kamalkrishnan
Jane Emily Darman
Jesslyn Ineke Handra
Justin Angelo Lokman
Kimberly Ann White
Lukas Aaron Go
Mahijit Thyagaraj Leelavathi
Meyra Valentina Tan
Ni Putu Aurora Adnyana
Raphael Panagori Pascal Sidabutar
Reiner Winston Tan
Reinetta Malca Riambodo
Cryztalline Mischellena Hugo
Eugenia Jacelyn Purwanto
Gwen Evelyn Alberta
Nagapatih Dhia Anuraga
Keven Abdiel Dzakwan`;

const SAMPLE_7P = `Alden
Celline Prayogo
Chadrich Javiero Jingga
Chanel Suryadinata
Christian Gregory Alvaro
Clarisya Zefanya Syauqina Atreya
Clifford Grivin Gunardi
Giorgio Valentino Sanjaya
Gretchen Gusdorf
Joey Halomoan Santoso
Kimberly Naraya
Marc Landen Chen
Nadine Sofia Angeline Widodo
Nathanael Christopher Wijaya
Aiden Ryu Adideva
Axwell Angelo Luntungan
Haifa Noor
Naura Andriani Anida
Videllea Suroto`;

export default function BulkStudentModal({ isOpen, onClose, classes = [], initialClassId = '', onSuccess }) {
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || classes[0]?.id || '');
  const [rawText, setRawText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Synchronize initial class when opened
  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    else if (classes[0]?.id && !selectedClassId) setSelectedClassId(classes[0].id);
  }, [initialClassId, classes]);

  const targetClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Parse lines dynamically
  const parsedStudents = useMemo(() => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let name = line;
      let lineClassId = selectedClassId;
      let gender = '';

      // Check if line contains comma or pipe for class specification: "Name, Class" or "Name | Class"
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        name = parts[0] || '';
        const clsMatch = classes.find(c => c.id === parts[1] || c.name.toLowerCase() === parts[1]?.toLowerCase());
        if (clsMatch) lineClassId = clsMatch.id;
        else if (parts[1] === 'M' || parts[1] === 'F' || parts[1] === 'L' || parts[1] === 'P') gender = (parts[1] === 'L' ? 'M' : parts[1] === 'P' ? 'F' : parts[1]);
      } else if (line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        name = parts[0] || '';
        const clsMatch = classes.find(c => c.id === parts[1] || c.name.toLowerCase().includes(parts[1]?.toLowerCase()));
        if (clsMatch) lineClassId = clsMatch.id;
      }

      // Strip leading numbering if copied from table e.g. "1. John Doe"
      name = name.replace(/^\d+[\.\-\s\|\)\:]+/, '').trim();

      if (name) {
        const assignedClass = classes.find(c => c.id === lineClassId) || targetClass;
        const resolvedGender = gender || guessGender(name);
        result.push({
          no: i + 1,
          name,
          classId: assignedClass?.id || selectedClassId,
          className: assignedClass?.name || 'Selected Class',
          gender: resolvedGender,
        });
      }
    }

    return result;
  }, [rawText, selectedClassId, classes, targetClass]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (parsedStudents.length === 0) {
      setError('Please enter at least 1 student name.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Send bulk request to backend
      const payload = {
        classId: selectedClassId,
        students: parsedStudents.map(s => ({
          name: s.name,
          classId: s.classId,
          gender: s.gender,
        })),
      };

      const result = await api.bulkStudents(payload);

      if (onSuccess) {
        onSuccess(result, selectedClassId);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to enroll students in bulk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Bulk Student Enrollment (Bulk Add)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Enroll multiple students at once simply by entering their names
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Class Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Select Target Class
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount || 0} students enrolled)
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              All names entered below will be automatically enrolled in this class (unless you specify class names per line).
            </p>
          </div>

          {/* Quick Paste Presets */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Student Names List (1 Line = 1 Student):
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Quick Examples:</span>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_7S)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium transition-colors cursor-pointer"
              >
                + Sample 7S (22 Names)
              </button>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_7P)}
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-medium transition-colors cursor-pointer"
              >
                + Sample 7P (19 Names)
              </button>
              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-zinc-400 hover:text-rose-500 underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div className="relative">
            <textarea
              rows={8}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste student names list here...&#10;Example:&#10;Ailynn Kei Sutanto&#10;Celine Laurenn Tio&#10;Evita Kaylynn&#10;Gede Arjuna Laksadeva"
              className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
            />
            <div className="absolute right-3 bottom-3 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
              {parsedStudents.length} Students Detected
            </div>
          </div>

          {/* Informational Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              <strong>Automatic Clean Initialization:</strong> All new students begin with <strong>Grade = 0</strong>, <strong>Attendance = 0%</strong>, and <strong>Worksheet Progress = 0%</strong>. Student login accounts are automatically activated with official NISN and default password <code className="px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-mono text-[10px]">password123</code>.
            </div>
          </div>

          {/* Live Preview List */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Input Preview ({parsedStudents.length} Students):</span>
                <span className="text-[11px] text-zinc-500">Class: {targetClass?.name}</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {parsedStudents.map(s => (
                  <div key={s.no} className="flex items-center justify-between p-2.5 text-xs bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono font-bold text-zinc-400">{s.no}</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {s.className}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.gender === 'P' || s.gender === 'F' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                        {s.gender === 'P' ? 'F' : s.gender === 'L' ? 'M' : s.gender}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">0 / 0%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || parsedStudents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enrolling {parsedStudents.length} Students...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enroll {parsedStudents.length} Students into {targetClass?.name || 'Class'}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
