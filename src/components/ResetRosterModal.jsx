import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Users,
  Archive,
} from "lucide-react";
import { api } from "../utils/api";

export default function ResetRosterModal({
  isOpen,
  onClose,
  onSuccess,
  cls,
}) {
  const [archiveStatus, setArchiveStatus] = useState("completed");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !cls) return null;

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.resetClassRoster(cls.id, {
        archiveStatus,
        notes: notes || `Class roster reset in preparation for new academic period`,
      });

      setSuccessMsg(res.message || "Class roster successfully reset!");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1400);
    } catch (err) {
      setError(err.message || "Failed to reset class roster");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg my-8 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Reset Class Roster
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Clear active roster in preparation for a new academic year or period.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleReset} className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Target Class Info */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{cls.name}</h3>
                <p className="text-xs text-zinc-500">Grade {cls.grade} · {cls.subject}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-400 block">Active Students</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {cls.studentCount || 0} Students
                </span>
              </div>
            </div>

            {/* Zero Data Loss Guarantee Alert */}
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero Data Loss Guarantee
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                This action <strong>WILL NOT DELETE</strong> exam scores, attendance records, or submitted worksheets. All historical data will be permanently archived into each student&apos;s academic transcript.
              </p>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Roster Archive Status
              </label>
              <select
                value={archiveStatus}
                onChange={(e) => setArchiveStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
              >
                <option value="completed">Completed / Graduated</option>
                <option value="promoted">Promoted</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Reset Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. End of academic year 2025/2026 promotion completed"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 shadow-md shadow-amber-600/20 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? "Resetting Roster..." : `Reset & Clear Roster (${cls.studentCount || 0} Students)`}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
