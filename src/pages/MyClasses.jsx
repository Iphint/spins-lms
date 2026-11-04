import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, User, Clock, MapPin, Calendar, CheckCircle2, Sparkles, School } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../utils/api';

export default function MyClasses() {
  const navigate = useNavigate();
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchClasses() {
      try {
        setLoading(true);
        const data = await api.get('/api/student-portal/classes');
        if (isMounted) {
          setClassesList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Gagal memuat daftar kelas');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchClasses();
    return () => { isMounted = false; };
  }, []);

  const getSubjectIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('ai') || lower.includes('artificial')) return '🤖';
    if (lower.includes('coding') || lower.includes('python')) return '💻';
    if (lower.includes('turtle')) return '🐢';
    if (lower.includes('igcse') || lower.includes('ict')) return '🖥️';
    return '📘';
  };

  return (
    <div>
      <PageHeader
        title="My Classes"
        subtitle="Assigned subjects and classes for your academic semester"
        icon={BookOpen}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading assigned class data...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      ) : classesList.length === 0 ? (
        <div className="text-center p-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-400" />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No Assigned Subjects Found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Please check with your teacher regarding class enrollments and schedules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classesList.map((cls, i) => {
            const subjectIcon = getSubjectIcon(cls.subject);
            const teacherName = cls.teacher?.name || 'Muhammad Arifin';
            const schoolName = cls.teacher?.school || 'SPINS';

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/classes/${cls.id}`)}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl group"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                {/* Header Card Gradient */}
                <div className="p-5 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{subjectIcon}</span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                        {cls.semester}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
                          {cls.name} • Grade {cls.grade}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1 group-hover:text-indigo-200 transition">
                        {cls.subject}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3.5">
                  {/* Teacher info */}
                  <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {teacherName}
                      </p>
                      <p className="text-xs truncate flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        <School className="w-3 h-3" /> {schoolName} • Subject Teacher
                      </p>
                    </div>
                  </div>

                  {/* Schedule & Room */}
                  <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{cls.schedule || 'Schedule to be announced'}</span>
                    </div>
                    {cls.room && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Room {cls.room}</span>
                      </div>
                    )}
                  </div>

                  {/* Topic / Status */}
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1 font-medium text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                    <span>{cls.totalLessons} Lesson Modules</span>
                  </div>

                  <ProgressBar value={cls.semesterProgress || 0} showLabel={false} size="sm" />

                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition group-hover:shadow-md">
                    <Play className="w-4 h-4" /> Enter Course Room
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
