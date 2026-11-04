import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, sub, color = 'indigo', index = 0 }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-500', icon: 'bg-indigo-100 dark:bg-indigo-500/20' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500', icon: 'bg-emerald-100 dark:bg-emerald-500/20' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-500', icon: 'bg-amber-100 dark:bg-amber-500/20' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-500', icon: 'bg-rose-100 dark:bg-rose-500/20' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-500', icon: 'bg-sky-100 dark:bg-sky-500/20' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-500', icon: 'bg-purple-100 dark:bg-purple-500/20' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-500', icon: 'bg-orange-100 dark:bg-orange-500/20' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className={`w-5 h-5 ${c.text}`} />}
        </div>
      </div>
    </motion.div>
  );
}
