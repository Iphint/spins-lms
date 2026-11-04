import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Sun, Moon, Globe, Bell, Eye, Monitor, Smartphone } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifAssignment, setNotifAssignment] = useState(true);
  const [notifQuiz, setNotifQuiz] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [reducedMotion, setReducedMotion] = useState(false);

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
        style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );

  const sections = [
    {
      title: 'Appearance',
      icon: Sun,
      items: [
        {
          label: 'Theme', description: 'Choose between light and dark mode',
          action: (
            <div className="flex gap-2">
              <button onClick={() => isDark && toggleTheme()}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${!isDark ? 'bg-indigo-500 text-white' : ''}`}
                style={isDark ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}>
                <Sun className="w-4 h-4" /> Light
              </button>
              <button onClick={() => !isDark && toggleTheme()}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${isDark ? 'bg-indigo-500 text-white' : ''}`}
                style={!isDark ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}>
                <Moon className="w-4 h-4" /> Dark
              </button>
            </div>
          )
        },
        {
          label: 'Font Size', description: 'Adjust the font size',
          action: (
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map(s => (
                <button key={s} onClick={() => setFontSize(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${fontSize === s ? 'bg-indigo-500 text-white' : ''}`}
                  style={fontSize !== s ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}>
                  {s}
                </button>
              ))}
            </div>
          )
        }
      ]
    },
    {
      title: 'Language',
      icon: Globe,
      items: [
        {
          label: 'Display Language', description: 'Choose your preferred language',
          action: (
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="id">🇮🇩 Bahasa Indonesia</option>
              <option value="en">🇺🇸 English</option>
            </select>
          )
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email Notifications', description: 'Receive notifications via email', action: <Toggle value={notifEmail} onChange={setNotifEmail} /> },
        { label: 'Push Notifications', description: 'Receive push notifications', action: <Toggle value={notifPush} onChange={setNotifPush} /> },
        { label: 'Assignment Reminders', description: 'Get reminded before deadlines', action: <Toggle value={notifAssignment} onChange={setNotifAssignment} /> },
        { label: 'Quiz Notifications', description: 'Get notified about new quizzes', action: <Toggle value={notifQuiz} onChange={setNotifQuiz} /> },
      ]
    },
    {
      title: 'Accessibility',
      icon: Eye,
      items: [
        { label: 'Reduced Motion', description: 'Minimize animations', action: <Toggle value={reducedMotion} onChange={setReducedMotion} /> },
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your preferences" icon={SettingsIcon} />

      <div className="space-y-6">
        {sections.map((section, si) => (
          <motion.div key={si} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
            className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <section.icon className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
            </div>
            <div>
              {section.items.map((item, ii) => (
                <div key={ii} className="px-5 py-4 flex items-center justify-between gap-4"
                  style={{ borderBottom: ii < section.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.description}</p>
                  </div>
                  <div className="flex-shrink-0">{item.action}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
