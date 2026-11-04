import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, change, changeType = 'positive', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            changeType === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            changeType === 'negative' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
    </motion.div>
  );
}
