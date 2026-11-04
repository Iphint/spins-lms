import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import AITutor from './components/ui/AITutor';
import StudyTimer from './components/ui/StudyTimer';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyClasses from './pages/MyClasses';
import ClassDetail from './pages/ClassDetail';
import LessonDetail from './pages/LessonDetail';
import Materials from './pages/Materials';
import Assignments from './pages/Assignments';
import Worksheets from './pages/Worksheets';
import Quizzes from './pages/Quizzes';
import Grades from './pages/Grades';
import Achievements from './pages/Achievements';
import CalendarPage from './pages/CalendarPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-400">Memuat sesi portal siswa...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/classes" element={<MyClasses />} />
            <Route path="/classes/:id" element={<ClassDetail />} />
            <Route path="/classes/:classId/lesson/:lessonId" element={<LessonDetail />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/materials/:lessonId" element={<LessonDetail />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/worksheets" element={<Worksheets />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <AITutor />
      <StudyTimer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
