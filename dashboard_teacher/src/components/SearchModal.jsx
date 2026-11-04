import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, Users, GraduationCap, FileText, Clock } from "lucide-react";
import { api } from "../utils/api";

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, c, w, m] = await Promise.all([
          api.students(),
          api.classes(),
          api.worksheets(),
          api.meetings(),
        ]);
        setStudents(s || []);
        setClasses(c || []);
        setWorksheets(w || []);
        setMeetings(m || []);
      } catch (err) {
        console.error("Search data load error:", err);
      }
    }
    loadData();
  }, []);

  const results = [];
  if (query.length > 1) {
    const q = query.toLowerCase();
    students.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5).forEach(s => {
      results.push({ type: "Student", icon: Users, label: s.name, sub: s.classId, path: `/students/${s.id}` });
    });
    classes.filter(c => c.name.toLowerCase().includes(q) || (c.subject && c.subject.toLowerCase().includes(q))).slice(0, 3).forEach(c => {
      results.push({ type: "Class", icon: GraduationCap, label: c.name, sub: c.subject, path: `/classes/${c.id}` });
    });
    worksheets.filter(w => w.title.toLowerCase().includes(q) || (w.topic && w.topic.toLowerCase().includes(q))).slice(0, 3).forEach(w => {
      results.push({ type: "Worksheet", icon: FileText, label: w.title, sub: w.classId, path: "/worksheets" });
    });
    meetings.filter(m => m.topic && m.topic.toLowerCase().includes(q)).slice(0, 3).forEach(m => {
      results.push({ type: "Meeting", icon: Clock, label: m.topic, sub: `${m.classId} - Pertemuan ${m.meetingNumber}`, path: "/attendance" });
    });
  }

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students, classes, worksheets..."
            className="flex-1 py-4 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 outline-none text-sm"
          />
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(r.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{r.label}</p>
                    <p className="text-xs text-zinc-500">{r.type} · {r.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {query.length > 1 && results.length === 0 && (
          <div className="py-8 text-center text-zinc-400 text-sm">No results found</div>
        )}

        {query.length <= 1 && (
          <div className="py-8 text-center text-zinc-400 text-sm">Start typing to search...</div>
        )}
      </motion.div>
    </div>
  );
}
