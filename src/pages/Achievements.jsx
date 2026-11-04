import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Lock, Sparkles, CheckCircle, Flame } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../utils/api';

export default function Achievements() {
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAchievementData() {
      try {
        const [prof, dash] = await Promise.all([
          api.get('/api/student-portal/profile').catch(() => null),
          api.get('/api/student-portal/dashboard').catch(() => null),
        ]);
        if (isMounted) {
          setProfile(prof?.student || prof);
          setDashboardData(dash);
        }
      } catch (err) {
        console.warn('Gagal memuat pencapaian siswa:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAchievementData();
    return () => { isMounted = false; };
  }, []);

  const attendance = dashboardData?.student?.attendance ?? profile?.attendance ?? 100;
  const averageScore = dashboardData?.student?.averageScore ?? profile?.averageScore ?? 0;
  const worksheetCompletion = dashboardData?.student?.worksheetCompletion ?? profile?.worksheetCompletion ?? 0;
  const customAchievements = profile?.achievements || [];

  // Construct dynamic real badges based on student metrics & teacher input
  const allBadges = [
    {
      id: 'badge-attendance',
      icon: '🎯',
      title: 'Consistent Attendance',
      description: 'Achieve class attendance rate above 90%',
      earned: attendance >= 90,
      earnedDate: 'Current Semester',
      progress: Math.min(attendance, 100),
      maxProgress: 100,
      currentVal: `${attendance}%`,
    },
    {
      id: 'badge-worksheets',
      icon: '⚡',
      title: 'Worksheet Finisher',
      description: 'Complete at least 70% of teacher-assigned worksheets',
      earned: worksheetCompletion >= 70,
      earnedDate: 'Current Semester',
      progress: Math.min(worksheetCompletion, 100),
      maxProgress: 100,
      currentVal: `${worksheetCompletion}%`,
    },
    {
      id: 'badge-academic',
      icon: '🏆',
      title: 'Academic Star',
      description: 'Maintain an overall evaluation average of 80 or higher',
      earned: averageScore >= 80,
      earnedDate: 'Current Semester',
      progress: Math.min(Math.round(averageScore), 100),
      maxProgress: 100,
      currentVal: `${Math.round(averageScore)}`,
    },
    {
      id: 'badge-coder',
      icon: '💻',
      title: 'Junior Programmer',
      description: 'Successfully complete hands-on coding practice sessions',
      earned: worksheetCompletion > 0,
      earnedDate: 'Teacher Verified',
      progress: worksheetCompletion > 0 ? 100 : 0,
      maxProgress: 100,
      currentVal: worksheetCompletion > 0 ? 'Active' : '0',
    },
  ];

  // Append any custom teacher-assigned achievements from student profile
  if (Array.isArray(customAchievements)) {
    customAchievements.forEach((ach, idx) => {
      allBadges.push({
        id: `custom-ach-${idx}`,
        icon: '⭐',
        title: typeof ach === 'string' ? ach : (ach.title || 'Student Commendation'),
        description: typeof ach === 'string' ? 'Awarded by Subject Instructor' : (ach.description || 'Special achievement'),
        earned: true,
        earnedDate: 'Teacher Commendation',
        progress: 100,
        maxProgress: 100,
        currentVal: 'Complete',
      });
    });
  }

  const earned = allBadges.filter(a => a.earned);
  const inProgress = allBadges.filter(a => !a.earned);

  return (
    <div>
      <PageHeader
        title="Achievements & Honors"
        subtitle={loading ? "Loading achievements..." : `${earned.length} of ${allBadges.length} badges earned`}
        icon={Trophy}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "🏆", label: "Badges Earned", value: earned.length },
          { icon: "📈", label: "Attendance Rate", value: `${attendance}%` },
          { icon: "⭐", label: "Average Score", value: `${Math.round(averageScore)}` },
          { icon: "📝", label: "Task Completion", value: `${worksheetCompletion}%` },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Earned Badges */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Star className="w-5 h-5 text-amber-500" /> Earned Badges
      </h2>
      {earned.length === 0 ? (
        <div className="p-8 rounded-2xl text-center mb-8 border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No badges earned yet. Complete tasks and improve class attendance to unlock badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {earned.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl p-5 transition-all hover:shadow-lg"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-500/20 dark:to-yellow-500/20 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.description}</p>
                  <p className="text-xs mt-1 text-amber-500 font-medium">{a.earnedDate}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Lock className="w-5 h-5 text-gray-400" /> In Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {inProgress.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl shrink-0 opacity-40 grayscale">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</h4>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.description}</p>
                  </div>
                </div>
                <ProgressBar value={a.progress} max={a.maxProgress} size="sm" />
                <p className="text-xs mt-2 text-center font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Current progress: {a.currentVal}
                </p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
