import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  Award,
  BookMarked,
  Clock,
  ClipboardCheck,
  FileText,
  Search,
  Filter,
  RefreshCw,
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../utils/api';

const TYPE_CONFIG = {
  score: {
    label: 'Grades & Evaluations',
    icon: Award,
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  student: {
    label: 'Students & Rosters',
    icon: Users,
    badgeBg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
  },
  material: {
    label: 'Learning Materials',
    icon: BookMarked,
    badgeBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  },
  worksheet: {
    label: 'Worksheets',
    icon: FileText,
    badgeBg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  },
  attendance: {
    label: 'Attendance',
    icon: ClipboardCheck,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  },
  schedule: {
    label: 'Teaching Schedule',
    icon: Clock,
    badgeBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  },
  general: {
    label: 'General & Classes',
    icon: GraduationCap,
    badgeBg: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    iconBg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  },
};

export default function TeacherActivities() {
  const [activities, setActivities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setRefreshing(true);
      setError('');
      const [tList, actList, sData] = await Promise.all([
        api.teachers().catch(() => []),
        api.activities().catch(() => []),
        api.activityStats().catch(() => null),
      ]);
      setTeachers(tList || []);
      setActivities(actList || []);
      setStats(sData);
    } catch (err) {
      console.error('Failed to load teacher activities:', err);
      setError('Failed to load teacher activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedTeacher !== 'all' && act.teacherId !== selectedTeacher) {
        return false;
      }
      if (selectedType !== 'all' && act.type !== selectedType) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const msgMatch = (act.message || '').toLowerCase().includes(query);
        const nameMatch = (act.teacherName || '').toLowerCase().includes(query);
        if (!msgMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [activities, selectedTeacher, selectedType, search]);

  const categoryPills = [
    { key: 'all', label: 'All Activities' },
    { key: 'score', label: 'Grades' },
    { key: 'student', label: 'Students' },
    { key: 'material', label: 'Materials' },
    { key: 'worksheet', label: 'Worksheets' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'schedule', label: 'Schedule' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teacher Activities"
          description="Loading activity monitoring logs for teachers..."
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Activities & Logs"
        description="Monitor all classroom activities, grade submissions, student enrollments, and learning materials managed by teachers"
      >
        <button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </PageHeader>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold hover:text-rose-800">Try again</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Activities</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats?.total ?? activities.length}</p>
            <p className="text-[11px] text-zinc-400 mt-1">Recorded in system</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Registered Teachers</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{teachers.length}</p>
            <p className="text-[11px] text-zinc-400 mt-1">Active instructors</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Grades Awarded</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats?.scoreCount ?? 0}</p>
            <p className="text-[11px] text-zinc-400 mt-1">Evaluations & tasks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Materials & Worksheets</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {(stats?.materialCount ?? 0) + (stats?.worksheetCount ?? 0)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">Materials & worksheets</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <BookMarked className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity or teacher name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Teacher Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Filter Teacher:</span>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Teachers ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categoryPills.map((pill) => {
            const active = selectedType === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setSelectedType(pill.key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filteredActivities.map((act, idx) => {
          const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.general;
          const IconComponent = cfg.icon;

          return (
            <motion.div
              key={act.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.3) }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {act.teacherName && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <User className="w-3 h-3" />
                        {act.teacherName}
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${cfg.badgeBg}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">
                    {act.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end gap-2 text-xs text-zinc-400 shrink-0 self-end sm:self-center">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{act.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono">{act.time || '00:00'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No Activities Found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              No activity logs match your selected filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
