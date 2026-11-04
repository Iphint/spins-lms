import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  FileSpreadsheet,
  HelpCircle,
  BarChart3,
  Trophy,
  CalendarDays,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/classes", label: "My Classes", icon: BookOpen },
  { path: "/materials", label: "Learning Materials", icon: FileText },
  { path: "/assignments", label: "Assignments", icon: ClipboardList },
  { path: "/worksheets", label: "Worksheets", icon: FileSpreadsheet },
  { path: "/quizzes", label: "Quizzes", icon: HelpCircle },
  { path: "/grades", label: "Grades", icon: BarChart3 },
  { path: "/achievements", label: "Achievements", icon: Trophy },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, collapsed, setCollapsed }) {
  const location = useLocation();
  const { student } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[72px]" : "lg:w-64"}
          ${
            isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-13 h-13 rounded-xl bg-linear-to-br  flex items-center justify-center">
              <img
                src="/spins.png"
                alt="SPINS Logo"
                className="w-30 h-30 object-contain"
              />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-lg whitespace-nowrap"
                style={{ color: "var(--text-primary)" }}
              >
                Student LMS
              </motion.span>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                    ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                  style={!isActive ? { color: "var(--text-secondary)" } : {}}
                  title={collapsed ? item.label : ""}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-indigo-500" : ""
                    }`}
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User preview & Collapse */}
        <div
          className="p-3"
          style={{ borderTop: "1px solid var(--border-color)" }}
        >
          {!collapsed && student && (
            <div className="mb-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(student.name || "SW")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {student.name}
                </p>
                <p className="text-[10px] text-indigo-500 font-medium truncate">
                  {student.class?.name || "Class 7A"}
                </p>
              </div>
            </div>
          )}

          <div className="hidden lg:block">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ color: "var(--text-tertiary)" }}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
