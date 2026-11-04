import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, RefreshCw } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";
import PageHeader from "../components/PageHeader";
import { api } from "../utils/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"];

export default function Analytics() {
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [worksheetTrend, setWorksheetTrend] = useState([]);
  const [averageScoreTrend, setAverageScoreTrend] = useState([]);
  const [classComparison, setClassComparison] = useState([]);
  const [semesterProgressData, setSemesterProgressData] = useState([]);
  const [learningTargetData, setLearningTargetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [att, ws, scr, comp, prog, targets] = await Promise.all([
        api.analytics.attendanceTrend(),
        api.analytics.worksheetTrend(),
        api.analytics.averageScoreTrend(),
        api.analytics.classComparison(),
        api.analytics.semesterProgress(),
        api.analytics.learningTargets(),
      ]);
      setAttendanceTrend(att);
      setWorksheetTrend(ws);
      setAverageScoreTrend(scr);
      setClassComparison(comp);
      setSemesterProgressData(prog);
      setLearningTargetData(targets);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Analytics" description="Comprehensive analytics and insights" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-80 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          <div className="h-80 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          <div className="h-80 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          <div className="h-80 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics" description="Comprehensive analytics and insights" />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Attendance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(24,24,27,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {["Kelas 7A", "Kelas 7B", "Kelas 8A", "Kelas 8B", "Kelas 9A", "Kelas 9B"].map((cls, i) => (
                  <Line key={cls} type="monotone" dataKey={cls} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Worksheet Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Worksheet Completion</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={worksheetTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(24,24,27,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {["Kelas 7A", "Kelas 8A", "Kelas 9A"].map((cls, i) => (
                  <Bar key={cls} dataKey={cls} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Average Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Average Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={averageScoreTrend}>
                <defs>
                  {COLORS.map((color, i) => (
                    <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="exam" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(24,24,27,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {["Kelas 7A", "Kelas 8A", "Kelas 9A"].map((cls, i) => (
                  <Area key={cls} type="monotone" dataKey={cls} stroke={COLORS[i % COLORS.length]} fill={`url(#grad${i})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Class Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Class Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={classComparison}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(24,24,27,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                <Radar name="Attendance" dataKey="attendance" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Radar name="Worksheet" dataKey="worksheet" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Semester Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Semester Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={semesterProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(24,24,27,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="target" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeDasharray="5 5" name="Target" />
                <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Learning Targets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Learning Targets</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={learningTargetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" domain={[0, 14]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" width={70} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(24,24,27,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[0, 4, 4, 0]} />
                <Bar dataKey="total" fill="#3f3f46" name="Total" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
