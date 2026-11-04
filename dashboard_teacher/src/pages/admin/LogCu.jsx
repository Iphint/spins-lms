import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, User, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const logs = [
  { id: 1, userId: 2, userName: 'Budi Guru', action: 'Create', target: 'Student', detail: 'Ahmad Pratama (CLS-7A)', date: '2025-07-27', time: '08:15' },
  { id: 2, userId: 2, userName: 'Budi Guru', action: 'Update', target: 'Material', detail: 'Persamaan Linear - CLS-7A', date: '2025-07-27', time: '09:30' },
  { id: 3, userId: 3, userName: 'Siti Pengajar', action: 'Create', target: 'Attendance', detail: 'Meeting #12 - CLS-8A', date: '2025-07-26', time: '11:00' },
  { id: 4, userId: 3, userName: 'Siti Pengajar', action: 'Update', target: 'Worksheet', detail: 'LK 5 - CLS-9B', date: '2025-07-26', time: '14:20' },
  { id: 5, userId: 2, userName: 'Budi Guru', action: 'Create', target: 'Student', detail: 'Siti Nurhaliza (CLS-7B)', date: '2025-07-25', time: '07:45' },
  { id: 6, userId: 1, userName: 'Admin Utama', action: 'Update', target: 'Schedule', detail: 'Mon 07:30 - CLS-7A', date: '2025-07-25', time: '10:10' },
  { id: 7, userId: 2, userName: 'Budi Guru', action: 'Create', target: 'Material', detail: 'Himpunan - CLS-7B', date: '2025-07-24', time: '13:00' },
  { id: 8, userId: 3, userName: 'Siti Pengajar', action: 'Update', target: 'Student', detail: 'Budi Santoso (CLS-8A)', date: '2025-07-24', time: '15:30' },
  { id: 9, userId: 1, userName: 'Admin Utama', action: 'Create', target: 'Meeting', detail: 'Meeting #15 - CLS-9A', date: '2025-07-23', time: '08:00' },
  { id: 10, userId: 2, userName: 'Budi Guru', action: 'Update', target: 'Attendance', detail: 'CLS-7A Summary (16 students)', date: '2025-07-23', time: '12:45' },
  { id: 11, userId: 3, userName: 'Siti Pengajar', action: 'Create', target: 'Score', detail: 'UTS Coding & AI Integrated - CLS-8B', date: '2025-07-22', time: '09:00' },
  { id: 12, userId: 1, userName: 'Admin Utama', action: 'Update', target: 'Journal', detail: 'Meeting journal #10', date: '2025-07-22', time: '16:00' },
];

const actionStyles = {
  Create: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Update: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export default function LogCu() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const grouped = useMemo(() => {
    const filtered = logs.filter(l =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.detail.toLowerCase().includes(search.toLowerCase())
    );
    const map = {};
    filtered.forEach(l => {
      if (!map[l.userId]) map[l.userId] = { userId: l.userId, userName: l.userName, logs: [] };
      map[l.userId].logs.push(l);
    });
    return Object.values(map).sort((a, b) => a.userId - b.userId);
  }, [search]);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div>
      <PageHeader title="Log CU" description="Create/Update audit trail grouped per user" />

      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text" placeholder="Search by user, target, or detail..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-3">
        {grouped.map((group, gi) => {
          const open = expanded[group.userId];
          const createCount = group.logs.filter(l => l.action === 'Create').length;
          const updateCount = group.logs.filter(l => l.action === 'Update').length;

          return (
            <motion.div
              key={group.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <button
                onClick={() => toggle(group.userId)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{group.userName}</p>
                  <p className="text-xs text-zinc-400">{group.logs.length} changes · {createCount} create · {updateCount} update</p>
                </div>
                {open ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {group.logs.map(log => (
                        <div key={log.id} className="px-4 py-3 flex items-center gap-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${actionStyles[log.action]}`}>
                            {log.action}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                              <span className="font-medium text-zinc-900 dark:text-white">{log.target}</span>
                              <span className="text-zinc-400"> · </span>
                              {log.detail}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">{log.date} {log.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {grouped.length === 0 && (
          <div className="text-center py-12 text-sm text-zinc-400">No logs found</div>
        )}
      </div>
    </div>
  );
}
