import { motion } from 'framer-motion';

export default function PageHeader({ title, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </motion.div>
  );
}
