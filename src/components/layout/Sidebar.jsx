import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText,
  ClipboardCheck, BarChart3, PenLine, Settings,
  ChevronLeft, ChevronRight, GraduationCap, Clock, BookMarked, Shield, Activity, Calendar, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/schedule', label: 'Schedule', icon: Clock },
  { path: '/classes', label: 'Classes', icon: GraduationCap },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/worksheets', label: 'Worksheets', icon: FileText },
  { path: '/materials', label: 'Materials', icon: BookMarked },
  { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: '/exam-scores', label: 'Exam Scores', icon: Award },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/journal', label: 'Teacher Journal', icon: PenLine },
];

const adminItems = [
  { path: '/admin/users', label: 'User Management', icon: Shield },
  { path: '/admin/activities', label: 'Teacher Activity Log', icon: Activity },
  { path: '/admin/semesters', label: 'Semester Management', icon: Calendar },
];

function MenuItem({ item, collapsed, setCollapsed }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));

  return (
    <NavLink
      to={item.path}
      onClick={() => window.innerWidth < 1024 && setCollapsed(true)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className="w-5 h-5 shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

export default function Sidebar({ collapsed, setCollapsed, subject }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setCollapsed(true)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors ${collapsed ? 'max-lg:-translate-x-full lg:translate-x-0' : ''} lg:translate-x-0`}
        style={{ width: collapsed ? 72 : 260 }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <div className="font-bold text-lg text-zinc-900 dark:text-white">Teacher Planner</div>
                  {subject && (
                    <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">Subject: {subject}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {isAdmin && (
            <div className="mb-3">
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1"
                  >
                    Administrator
                  </motion.span>
                )}
              </AnimatePresence>
              {adminItems.map(item => (
                <MenuItem key={item.path} item={item} collapsed={collapsed} setCollapsed={setCollapsed} />
              ))}
            </div>
          )}

          <div>
            {isAdmin && !collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1 mt-2">
                Academic & Classes
              </span>
            )}
            {navItems.concat({ path: '/settings', label: 'Settings', icon: Settings }).map(item => (
              <MenuItem key={item.path} item={item} collapsed={collapsed} setCollapsed={setCollapsed} />
            ))}
          </div>
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
