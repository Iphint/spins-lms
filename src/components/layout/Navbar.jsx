import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Search, Sun, Moon, Bell, X, LogOut } from 'lucide-react';
import SearchModal from '../SearchModal';

export default function Navbar({ onToggleSidebar, subject }) {
  const { theme, toggleTheme } = useTheme();
  const { user, teacher, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName = teacher?.name || user?.name || 'Teacher';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, text: '3 students have not submitted Worksheet 5', time: '10 mins ago', unread: true },
    { id: 2, text: 'Lesson 12 scheduled tomorrow - Class 7A', time: '1 hr ago', unread: true },
    { id: 3, text: 'Quiz 3 scores submitted', time: '3 hrs ago', unread: false },
    { id: 4, text: 'Homeroom faculty meeting on Saturday', time: '1 day ago', unread: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors min-w-[200px] md:min-w-[300px]"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-auto hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${n.unread ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">{n.text}</p>
                        <p className="text-xs text-zinc-400 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {subject && (
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              {subject}
            </span>
          )}

          <div className="relative ml-1">
            <button
              onClick={() => setShowUserMenu(s => !s)}
              className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold hover:ring-2 hover:ring-indigo-400 transition-all"
              title={displayName}
            >
              {initials}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.email}</p>
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
}
