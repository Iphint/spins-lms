import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Schedule from './pages/Schedule';
import Classes from './pages/Classes';
import StudentsPage from './pages/Students';
import Worksheets from './pages/Worksheets';
import Attendance from './pages/Attendance';
import ExamScores from './pages/ExamScores';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import Analytics from './pages/Analytics';
import Journal from './pages/Journal';
import Settings from './pages/Settings';
import ManagementUser from './pages/admin/ManagementUser';
import TeacherActivities from './pages/admin/TeacherActivities';
import ManagementSemester from './pages/admin/ManagementSemester';
import FloatingButtons from './components/FloatingButtons';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminRedirect() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin/users" replace />;
  }
  return <Dashboard />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/users' : '/'} replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout>
              <Outlet />
            </Layout>
            {user?.role !== 'admin' && <FloatingButtons />}
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<AdminRedirect />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:id" element={<Classes />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentsPage />} />
        <Route path="/worksheets" element={<Worksheets />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/exam-scores" element={<ExamScores />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/materials/:id" element={<MaterialDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><ManagementUser /></ProtectedRoute>} />
        <Route path="/admin/activities" element={<ProtectedRoute adminOnly><TeacherActivities /></ProtectedRoute>} />
        <Route path="/admin/semesters" element={<ProtectedRoute adminOnly><ManagementSemester /></ProtectedRoute>} />
        <Route path="/admin/*" element={<Navigate to="/admin/users" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}