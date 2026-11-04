export default function FilterBar({ filters, activeFilters, onFilterChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {filters.map(filter => (
        <div key={filter.key} className="relative">
          <select
            value={activeFilters[filter.key] || ''}
            onChange={e => onFilterChange(filter.key, e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="">{filter.label}</option>
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      ))}
      {Object.values(activeFilters).some(v => v) && (
        <button
          onClick={() => {
            const cleared = {};
            filters.forEach(f => cleared[f.key] = '');
            Object.keys(cleared).forEach(k => onFilterChange(k, ''));
          }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
