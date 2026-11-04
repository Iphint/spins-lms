import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, CheckCircle2, AlertTriangle, Lightbulb, Smile, Meh, Frown, X, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { api } from "../utils/api";

const moodIcons = {
  good: { icon: Smile, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  neutral: { icon: Meh, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  challenging: { icon: Frown, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
};

function parseAttention(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

export default function Journal() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const clsList = await api.classes();
        setClasses(clsList);
        if (clsList.length > 0) {
          setSelectedClass(clsList[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    async function fetchJournals() {
      setLoadingJournals(true);
      setError("");
      try {
        const data = await api.journals(selectedClass);
        setJournals(data);
      } catch (err) {
        setError(err.message || "Failed to load journal entries");
      } finally {
        setLoadingJournals(false);
      }
    }
    fetchJournals();
  }, [selectedClass]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Teacher Journal" description="Document and reflect on your teaching sessions" />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-72" />
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Teacher Journal" description="Document and reflect on your teaching sessions" />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setSelectedClass(c => c)}
            className="flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Class Selector */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedClass === c.id
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loadingJournals ? (
        <div className="space-y-3">
          <div className="h-24 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
          <div className="h-24 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-3">
          {journals.map((journal, i) => {
            const Mood = moodIcons[journal.mood] || moodIcons.neutral;
            const MoodIcon = Mood.icon;

            return (
              <motion.div
                key={journal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedJournal(journal)}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${Mood.bg} flex items-center justify-center shrink-0`}>
                      <MoodIcon className={`w-5 h-5 ${Mood.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white text-sm">{journal.topic}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{journal.date} · {journal.classId}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{journal.summary}</p>
                    </div>
                  </div>
                  <StatusBadge status={journal.mood} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loadingJournals && journals.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <PenLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No journal entries for this class yet</p>
        </div>
      )}

      {/* Journal Detail Modal */}
      <AnimatePresence>
        {selectedJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedJournal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{selectedJournal.topic}</h2>
                  <p className="text-sm text-zinc-500">{selectedJournal.date} · {selectedJournal.classId}</p>
                </div>
                <button
                  onClick={() => setSelectedJournal(null)}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">📝 Today summary</h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedJournal.summary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> What Went Well
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedJournal.wentWell}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Problems
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedJournal.problems}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">👤 Students Need Attention</h4>
                  <div className="space-y-1.5">
                    {parseAttention(selectedJournal.studentsNeedAttention).map((s, i) => (
                      <div key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                        {s}
                      </div>
                    ))}
                    {parseAttention(selectedJournal.studentsNeedAttention).length === 0 && (
                      <p className="text-sm text-zinc-400">No students require special attention.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Ideas for Next Meeting
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedJournal.ideasForNext}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
