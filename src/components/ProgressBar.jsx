import { motion } from 'framer-motion';

export default function ProgressBar({ value, max = 100, color = 'indigo', size = 'md', showLabel = true }) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
  };

  const bgColors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-500/20',
    emerald: 'bg-emerald-100 dark:bg-emerald-500/20',
    amber: 'bg-amber-100 dark:bg-amber-500/20',
    rose: 'bg-rose-100 dark:bg-rose-500/20',
    sky: 'bg-sky-100 dark:bg-sky-500/20',
  };

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${bgColors[color]} rounded-full ${heights[size]} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${colors[color]} rounded-full`}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-10 text-right">{pct}%</span>}
    </div>
  );
}
