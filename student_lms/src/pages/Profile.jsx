import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, School, Calendar, Award, BookOpen, Target, Trophy, Flame, MapPin, CheckCircle2, ShieldCheck, GraduationCap, History } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { student: authStudent, user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [scoresData, setScoresData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const [prof, scores] = await Promise.all([
          api.get('/api/student-portal/profile').catch(() => null),
          api.get('/api/student-portal/scores').catch(() => null),
        ]);
        if (isMounted) {
          if (prof?.student) setProfileData(prof.student);
          else if (prof) setProfileData(prof);
          if (scores) setScoresData(scores);
        }
      } catch (err) {
        console.warn('Could not load student profile from API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const activeStudent = profileData || authStudent || {};
  const name = activeStudent.name || user?.name || 'Enrolled Student';
  const nisn = activeStudent.nisn || '-';
  const className = activeStudent.class?.name || (activeStudent.classId ? `Class ${activeStudent.classId}` : 'Active Class');
  const email = activeStudent.user?.email || user?.email || `${(name.toLowerCase().replace(/\s+/g, '.'))}@student.lms.sch.id`;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'ST';

  const overallAvg = Math.round(activeStudent.averageScore ?? scoresData?.overallAverage ?? 0);
  const attendanceRate = activeStudent.attendance ?? 100;
  const worksheetRate = activeStudent.worksheetCompletion ?? 0;

  const strengths = Array.isArray(activeStudent.strengths) ? activeStudent.strengths : [];
  const achievementsList = Array.isArray(activeStudent.achievements) && activeStudent.achievements.length > 0
    ? activeStudent.achievements
    : ['Active Student for Current Academic Year'];

  const displayJourney = activeStudent.academicJourney?.length
    ? activeStudent.academicJourney
    : [
        {
          grade: activeStudent.currentGrade || activeStudent.class?.grade || 7,
          className: className,
          academicYear: activeStudent.class?.semester?.academicYear?.name || '2025/2026',
          status: 'active',
          finalScore: overallAvg,
          attendanceRate: attendanceRate,
          notes: 'Enrolled and active in course cohort',
        },
      ];

  const recentScores = scoresData?.scores || [];

  return (
    <div>
      <PageHeader
        title="Student Profile"
        subtitle={loading ? "Loading academic profile..." : "Academic information and official student registration records"}
        icon={User}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 rounded-3xl overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="h-28 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 relative">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white dark:ring-gray-800 shadow-xl">
                {initials}
              </div>
            </div>
          </div>
          <div className="pt-14 pb-6 px-5 text-center">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{name}</h2>
            <p className="text-xs text-indigo-500 font-semibold mt-0.5">NISN: {nisn}</p>
            <p className="text-xs mt-1 text-slate-400">{className} • Teacher Connected</p>

            <div className="mt-6 space-y-3 text-left">
              {[
                { icon: Mail, label: 'Email', value: email },
                { icon: School, label: 'Class', value: `${className} (${activeStudent.class?.code || activeStudent.classId || 'Regular'})` },
                { icon: ShieldCheck, label: 'Student Status', value: activeStudent.status === 'active' || !activeStudent.status ? 'Active' : activeStudent.status },
                { icon: Calendar, label: 'Academic Year', value: activeStudent.class?.semester?.academicYear?.name || '2025/2026' },
                { icon: MapPin, label: 'School / Institution', value: activeStudent.class?.teacher?.school || 'SPINS LMS Academy' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <item.icon className="w-4 h-4 shrink-0 text-indigo-500" />
                  <span className="truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Parent contact if present */}
            {activeStudent.parentName && (
              <div className="mt-5 p-3.5 rounded-2xl text-left text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-500 text-[10px] uppercase">Parent / Guardian Contact</p>
                <p className="font-semibold text-slate-200 mt-1">{activeStudent.parentName}</p>
                {activeStudent.parentPhone && <p className="text-slate-400 mt-0.5">{activeStudent.parentPhone}</p>}
              </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Strengths & Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {strengths.map((str, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {str}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Target, label: "Average Score", value: `${overallAvg}`, color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-500/20" },
              { icon: BookOpen, label: "Attendance Rate", value: `${attendanceRate}%`, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20" },
              { icon: Flame, label: "Course Subject", value: activeStudent.class?.subject || "Informatics", color: "text-orange-500 bg-orange-100 dark:bg-orange-500/20" },
              { icon: Trophy, label: "Tasks Completed", value: `${worksheetRate}%`, color: "text-amber-500 bg-amber-100 dark:bg-amber-500/20" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl p-4 text-center"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Award className="w-5 h-5 text-amber-500" /> Student Commendations & Achievements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievementsList.map((ach, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {typeof ach === 'string' ? ach : (ach.title || 'Achievement')}
                    </p>
                    <p className="text-[10px] text-slate-400">Recorded in Teacher Portfolio</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Academic Journey (Perjalanan Belajar Berjenjang) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <GraduationCap className="w-5 h-5 text-indigo-500" /> Academic Journey & Progression
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold">
                Grade {activeStudent.currentGrade || activeStudent.class?.grade || 7} Active
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Historical class records, academic years, and grade transcripts stored permanently in unified database.
            </p>

            <div className="space-y-3">
              {displayJourney.map((j, idx) => {
                const isActive = j.status === 'active' || !j.status;
                const isPromoted = j.status === 'promoted';
                return (
                  <div
                    key={j.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                        : 'border-slate-200 dark:border-slate-800/80'
                    }`}
                    style={!isActive ? { backgroundColor: 'var(--bg-secondary)' } : {}}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          Grade {j.grade} ({j.className})
                        </span>
                        <span className="text-[11px] text-slate-400">· {j.academicYear}</span>
                      </div>
                      <div>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Currently Active
                          </span>
                        )}
                        {isPromoted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            <GraduationCap className="w-3 h-3" /> Promoted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-1">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">Average Score</span>
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {j.finalScore || overallAvg || 0} / 100
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block">Attendance</span>
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {j.attendanceRate || attendanceRate}%
                        </span>
                      </div>
                    </div>

                    {j.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        <span className="font-semibold">Notes:</span> {j.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Real Evaluated Scores from Teacher */}
          {recentScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                Recent Assessments by Teacher
              </h3>
              <div className="space-y-3">
                {recentScores.slice(0, 5).map((s, idx) => (
                  <div key={s.id || idx} className="p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {s.topic || s.examType}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {s.examType} • {s.date ? new Date(s.date).toLocaleDateString('en-US') : '-'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">
                      {s.score} / {s.maxScore || 100}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
