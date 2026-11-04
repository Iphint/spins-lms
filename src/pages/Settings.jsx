import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, School, Palette, Bell, Globe, Sun, Moon, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';

const SUBJECTS = [
  'Coding & AI Integrated', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
  'Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Geografi', 'Sejarah',
  'PPKn', 'Pendidikan Agama', 'Informatika', 'TIK', 'Seni Budaya', 'PJOK',
];

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'school', label: 'School', icon: School },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Globe },
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  nip: '',
  subject: 'Coding & AI Integrated',
  position: '',
  bio: '',
  school: '',
  schoolAddress: '',
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    attendance: true,
    worksheet: true,
    meeting: false,
  });
  const [language, setLanguage] = useState('id');

  useEffect(() => {
    api.teacher()
      .then(t => {
        setForm({
          name: t?.name || '',
          email: t?.email || '',
          phone: t?.phone || '',
          nip: t?.nip || '',
          subject: t?.subject || 'Coding & AI Integrated',
          position: t?.position || '',
          bio: t?.bio || '',
          school: t?.school || '',
          schoolAddress: t?.schoolAddress || '',
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setMessage('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.updateTeacher(form);
      setMessage('Changes saved. ' + (form.subject ? 'All classes now use this single subject.' : ''));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500";

  const TeacherInfo = ({ form, update }) => (
    <div className="flex items-start gap-6 mb-6">
      <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
        {form.name ? form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '—'}
      </div>
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Full Name</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Email</label>
            <input value={form.email} onChange={e => update('email', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Phone</label>
            <input value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">NIP</label>
            <input value={form.nip} onChange={e => update('nip', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Subject (single)</label>
            <input
              list="subject-list"
              value={form.subject}
              onChange={e => update('subject', e.target.value)}
              className={inputClass}
              placeholder="e.g. Coding & AI Integrated"
            />
            <datalist id="subject-list">
              {SUBJECTS.map(s => <option key={s} value={s} />)}
            </datalist>
            <p className="text-[11px] text-zinc-400 mt-1">You teach a single subject across all classes. Changes here will be automatically applied to all classes.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1 block">Position</label>
            <input value={form.position} onChange={e => update('position', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 mb-1 block">Bio</label>
          <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" description="Manage your preferences and account settings" />
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your preferences and account settings" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {(activeTab === 'profile' || activeTab === 'school') && (
            <form onSubmit={handleSave}>
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Teacher Profile</h2>
                  <TeacherInfo form={form} update={update} />
                  <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'school' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">School Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 mb-1 block">School Name</label>
                      <input value={form.school} onChange={e => update('school', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 mb-1 block">Address</label>
                      <input value={form.schoolAddress} onChange={e => update('schoolAddress', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          )}

          {activeTab === 'theme' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Theme Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', icon: Sun, desc: 'Light background with dark text' },
                  { id: 'dark', label: 'Dark', icon: Moon, desc: 'Dark background with light text' },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        theme === t.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${theme === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`} />
                      <p className="font-medium text-zinc-900 dark:text-white text-sm">{t.label}</p>
                      <p className="text-xs text-zinc-500 mt-1">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Notification Settings</h2>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white capitalize">{key.replace(/([A-Z])/g, ' $1')} Notifications</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Receive notifications for {key} updates</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${val ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <motion.div
                        animate={{ x: val ? 20 : 2 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'language' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Language Settings</h2>
              <div className="space-y-3">
                {[
                  { id: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
                  { id: 'en', label: 'English', flag: '🇺🇸' },
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      language === lang.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium text-zinc-900 dark:text-white text-sm">{lang.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
