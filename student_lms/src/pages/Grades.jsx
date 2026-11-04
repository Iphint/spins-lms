import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, CheckCircle2, Calendar, FileText, Target, School } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

export default function Grades() {
  const { isDark } = useTheme();
  const [scoresData, setScoresData] = useState(null);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [scores, classes] = await Promise.all([
          api.get('/api/student-portal/scores').catch(() => null),
          api.get('/api/student-portal/classes').catch(() => []),
        ]);
        if (isMounted) {
          setScoresData(scores);
          setClassesList(Array.isArray(classes) ? classes : []);
        }
      } catch (err) {
        console.warn('Could not load student scores from API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const scores = scoresData?.scores || [];
  const assignedClass = classesList[0] || null;
  const subjectName = assignedClass?.subject || 'Coding & AI';
  const teacherName = assignedClass?.teacher?.name || 'Muhammad Arifin';

  const overallAverage = scores.length
    ? Math.round(scores.reduce((acc, g) => acc + g.score, 0) / scores.length)
    : assignedClass?.averageScore || 0;

  const highestScore = scores.length ? Math.max(...scores.map((g) => g.score)) : 0;
  const lowestScore = scores.length ? Math.min(...scores.map((g) => g.score)) : 0;

  const scoreColor = (s) => {
    if (s >= 85) return 'text-emerald-500 font-bold';
    if (s >= 75) return 'text-blue-500 font-bold';
    if (s >= 65) return 'text-amber-500 font-bold';
    return 'text-red-500 font-bold';
  };

  const getPredicate = (s) => {
    if (s >= 90) return 'A (Excellent)';
    if (s >= 80) return 'B (Good)';
    if (s >= 70) return 'C (Satisfactory)';
    return 'D (Needs Improvement)';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Book & Academic Records"
        subtitle={`Academic evaluation summary for ${subjectName}`}
        icon={BarChart3}
      />

      {/* Subject Header Banner */}
      {assignedClass && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-600 text-white uppercase">
              Active Course
            </span>
            <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              {assignedClass.subject} ({assignedClass.name})
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Instructor: <span className="font-semibold text-indigo-400">{teacherName}</span> • {assignedClass.teacher?.school || 'SPINS'}
            </p>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Passing Standard</span>
            <p className="text-lg font-bold text-emerald-500">75 / 100</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Average Score', value: `${overallAverage}`, sub: overallAverage >= 75 ? 'Above Benchmark' : 'Needs Practice', color: 'indigo' },
          { icon: Award, label: 'Highest Score', value: `${highestScore || '-'}`, sub: 'Personal Best', color: 'emerald' },
          { icon: FileText, label: 'Assessment Components', value: `${scores.length}`, sub: 'Midterms, Finals & Tasks', color: 'purple' },
          { icon: CheckCircle2, label: 'Academic Standing', value: getPredicate(overallAverage).split(' ')[0], sub: getPredicate(overallAverage), color: 'amber' },
        ].map((c, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl space-y-2"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{c.label}</span>
              <c.icon className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
            <p className="text-xs text-indigo-400 font-medium">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Scores Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="p-4 sm:p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Exam & Assessment Breakdown ({subjectName})
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
            Semester {assignedClass?.semester || '1'}
          </span>
        </div>

        {scores.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Award className="w-10 h-10 mx-auto text-indigo-400 opacity-40" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              No Grades Published Yet
            </p>
            <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Mid Exam, Semester Exam, and coursework marks entered by Teacher {teacherName} will appear here directly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['Assessment / Exam Type', 'Date', 'Weight', 'Max Score', 'Earned Score', 'Grade', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scores.map((sc, i) => {
                  const isPassed = sc.score >= 75;
                  return (
                    <tr
                      key={sc.id || i}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      style={{ borderBottom: i < scores.length - 1 ? '1px solid var(--border-color)' : 'none' }}
                    >
                      <td className="px-4 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                        {sc.examType}
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {sc.date || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {sc.weight ? `${sc.weight}%` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {sc.maxScore || 100}
                      </td>
                      <td className={`px-4 py-3.5 text-base ${scoreColor(sc.score)}`}>
                        {sc.score}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {getPredicate(sc.score)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {isPassed ? 'Passed' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
