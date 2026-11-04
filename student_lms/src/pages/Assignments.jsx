import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Clock, Paperclip, Upload, Code2, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../utils/api';

export default function Assignments() {
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAssignments() {
      try {
        const data = await api.get('/api/student-portal/worksheets');
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setAssignmentsList(list);
          if (list.length > 0) {
            setSelected(list[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load assignments:', err.message);
        if (isMounted) setAssignmentsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAssignments();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return assignmentsList.filter(a => {
      const titleMatch = (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
                         (a.topic || '').toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === 'all' || a.status === statusFilter;
      return titleMatch && statusMatch;
    });
  }, [assignmentsList, search, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Assignments & Coursework"
        subtitle={loading ? "Loading assignments..." : `${assignmentsList.length} assignments assigned by teachers`}
        icon={ClipboardList}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search assignments or topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'in-progress', label: 'Active' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'completed', label: 'Graded' },
            { id: 'overdue', label: 'Overdue' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${statusFilter === s.id ? 'bg-indigo-500 text-white shadow-sm' : ''}`}
              style={statusFilter !== s.id ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignmentsList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No Active Assignments</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your instructor has not posted any new assignments or worksheets yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${selected ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-3`}>
            {filtered.map((a, i) => {
              const isSelected = selected?.id === a.id;
              const hasScore = a.submission?.score !== undefined && a.submission?.score > 0;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(a)}
                  className={`rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-indigo-500 shadow-sm' : ''}`}
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</h4>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>{a.topic || a.subject}</p>
                  <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'No deadline'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {a.difficulty || 'Normal'}
                    </span>
                    {a.fileUrl && <Paperclip className="w-3.5 h-3.5 text-indigo-500" />}
                    {a.hasCodeEditor && <Code2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  {hasScore && (
                    <p className="text-xs mt-2.5 font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Score: {a.submission.score}/100
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 rounded-2xl p-6 sticky top-20 flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Topic: <span className="font-medium text-indigo-500">{selected.topic || selected.subject}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    ✕ Close
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <StatusBadge status={selected.status} />
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Level: {selected.difficulty || 'Standard'}
                  </span>
                  {selected.hasCodeEditor && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> Code-Based
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {selected.description || 'No additional instructions provided.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Due Date</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {selected.dueDate ? new Date(selected.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Assignment Status</p>
                    <p className="text-sm font-semibold mt-0.5 capitalize" style={{ color: 'var(--text-primary)' }}>
                      {selected.status}
                    </p>
                  </div>
                  {selected.submission?.score !== undefined && selected.submission?.score > 0 ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Teacher Score</p>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selected.submission.score} / 100
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Score</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {selected.status === 'submitted' ? 'Pending Review' : 'Incomplete'}
                      </p>
                    </div>
                  )}
                </div>

                {selected.submission?.feedback && (
                  <div className="mb-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Teacher Feedback:</p>
                    <p className="text-sm text-indigo-900 dark:text-indigo-200">{selected.submission.feedback}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: 'var(--border-color)' }}>
                {selected.hasCodeEditor ? (
                  <Link
                    to="/worksheets"
                    className="flex-1 min-w-[200px] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Code2 className="w-4 h-4" /> Open in Code Editor & Complete
                  </Link>
                ) : (
                  <Link
                    to="/worksheets"
                    className="flex-1 min-w-[200px] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ClipboardList className="w-4 h-4" /> Open Worksheet
                  </Link>
                )}
                {selected.fileUrl && (
                  <a
                    href={selected.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-sm font-semibold transition flex items-center gap-2"
                  >
                    <Paperclip className="w-4 h-4" /> Download Attachment
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
