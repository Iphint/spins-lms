import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { api } from "../../utils/api";

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadActivities() {
    setLoading(true);
    setError("");
    try {
      const data = await api.activities();
      setActivities(data);
    } catch (err) {
      setError(err.message || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Activity Log" description="Monitor all activities and changes in the system" />
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Activity Log" description="Monitor all activities and changes in the system" />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadActivities}
            className="flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      <div className="space-y-2">
        {activities.map((act, i) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              act.type === "attendance" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" :
              act.type === "worksheet" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" :
              act.type === "meeting" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" :
              act.type === "student" ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600" :
              "bg-zinc-50 dark:bg-zinc-800 text-zinc-500"
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{act.message}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{act.time}</p>
            </div>
          </motion.div>
        ))}

        {activities.length === 0 && (
          <div className="py-12 text-center text-zinc-400 text-sm">No activities recorded yet.</div>
        )}
      </div>
    </div>
  );
}
