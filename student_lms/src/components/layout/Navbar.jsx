import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, Sun, Moon, X, BookOpen, ClipboardList, FileSpreadsheet, HelpCircle, FileText, LogOut, UserCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function Navbar({ onMenuToggle }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, student, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifList, setNotifList] = useState([]);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const dash = await api.get('/api/student-portal/dashboard');
        if (!isMounted) return;

        const generated = [];

        // 1. Check today's schedule
        if (dash.todaySchedule?.length > 0) {
          dash.todaySchedule.forEach((sch) => {
            generated.push({
              id: `sch-${sch.id}`,
              title: `Today's Schedule: ${sch.subject}`,
              message: `At ${sch.time} in ${sch.room}. Teacher: ${sch.teacherName}`,
              time: 'Today',
              read: false,
              type: 'class',
            });
          });
        }

        // 2. Check pending or recent worksheets
        if (dash.recentWorksheets?.length > 0) {
          dash.recentWorksheets.slice(0, 3).forEach((ws) => {
            generated.push({
              id: `ws-${ws.id}`,
              title: `Assignment/Worksheet: ${ws.title}`,
              message: `Due date: ${ws.dueDate ? new Date(ws.dueDate).toLocaleDateString('en-US') : 'Flexible'}`,
              time: ws.status === 'completed' ? 'Completed' : 'Pending Action',
              read: ws.status === 'completed',
              type: 'assignment',
            });
          });
        }

        // 3. Check recent scores
        if (dash.recentScores?.length > 0) {
          dash.recentScores.slice(0, 2).forEach((sc) => {
            generated.push({
              id: `sc-${sc.id}`,
              title: `Assessment Score: ${sc.examType}`,
              message: `Score: ${sc.score}/100. ${sc.topic ? `Topic: ${sc.topic}` : ''}`,
              time: sc.date ? new Date(sc.date).toLocaleDateString('en-US') : 'Recorded',
              read: true,
              type: 'grade',
            });
          });
        }

        setNotifList(generated);
      } catch (err) {
        // Fallback gracefully without breaking navbar
        setNotifList([]);
      }
    }

    loadNotifications();
    return () => { isMounted = false; };
  }, []);

  const unreadCount = notifList.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const studentName = student?.name || user?.name || 'Enrolled Student';
  const studentClass = student?.class?.name || (student?.classId ? `Class ${student.classId}` : 'Class 7A');
  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'ST';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const searchResults = searchQuery.length > 1 ? [
    { type: 'material', icon: BookOpen, title: 'Learning Materials', sub: 'Open Materials', link: '/materials' },
    { type: 'worksheet', icon: FileSpreadsheet, title: 'Worksheets & Coding', sub: 'Open Worksheets', link: '/worksheets' },
    { type: 'assignment', icon: ClipboardList, title: 'Assignments', sub: 'Open Assignments', link: '/assignments' },
    { type: 'quiz', icon: HelpCircle, title: 'Quizzes & Tests', sub: 'Open Quizzes', link: '/quizzes' },
    { type: 'profile', icon: UserCheck, title: 'Student Profile', sub: 'View Profile', link: '/profile' },
  ].filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.sub.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>

        {/* Desktop search */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-80 transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search materials, worksheets, quizzes..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSearch(false); }}>
                <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            )}
          </div>
          <AnimatePresence>
            {showSearch && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                {searchResults.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setShowSearch(false);
                        navigate(r.link);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Icon className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile search button */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 rounded-xl transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-2 rounded-xl transition hover:bg-gray-100 dark:hover:bg-gray-800">
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl transition hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="p-4 font-semibold text-sm flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <span>Class Notifications</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    {unreadCount} new
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No new notifications right now.
                    </div>
                  ) : (
                    notifList.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex gap-3 transition hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{n.message}</p>
                          <p className="text-[10px] mt-1 text-slate-400">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Student Avatar & Menu */}
        <div ref={userMenuRef} className="relative ml-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-xl transition hover:bg-gray-100 dark:hover:bg-gray-800"
            title={studentName}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
              {initials}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-semibold max-w-[120px] truncate" style={{ color: 'var(--text-primary)' }}>
                {studentName}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {studentClass}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl overflow-hidden z-50"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="p-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {studentName}
                  </p>
                  <p className="text-[11px] text-indigo-500 font-medium mt-0.5">
                    NISN: {student?.nisn || '0081234501'} • {studentClass}
                  </p>
                </div>

                <div className="p-1.5 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span>Student Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
