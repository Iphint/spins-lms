export default function StatusBadge({ status }) {
  const config = {
    completed: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Completed' },
    'in-progress': { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', label: 'In Progress' },
    'not-started': { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400', label: 'Not Started' },
    submitted: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', label: 'Submitted' },
    overdue: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'Overdue' },
    available: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400', label: 'Available' },
    upcoming: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', label: 'Upcoming' },
    locked: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-500 dark:text-gray-500', label: 'Locked' },
    high: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', label: 'High' },
    medium: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', label: 'Medium' },
    low: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', label: 'Low' },
  };

  const c = config[status] || config['not-started'];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
