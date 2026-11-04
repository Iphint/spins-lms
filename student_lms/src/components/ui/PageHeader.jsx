import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-500" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </motion.div>
  );
}
