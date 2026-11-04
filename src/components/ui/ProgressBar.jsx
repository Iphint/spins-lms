import { motion } from 'framer-motion';

export default function ProgressBar({ value = 0, max = 100, size = 'md', color = 'indigo', showLabel = true }) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };
  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Progress</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${heights[size]} rounded-full overflow-hidden`} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${colors[color] || colors.indigo}`}
        />
      </div>
    </div>
  );
}
