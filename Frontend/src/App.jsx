import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import AnomalyPage from './pages/AnomalyPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import CasesPage from './pages/CasesPage.jsx';
import CaseDetailPage from './pages/CaseDetailPage.jsx';
import ExaminationPage from './pages/ExaminationPage.jsx';
import DecisionsPage from './pages/DecisionsPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Memverifikasi sesi Anda..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/anomaly" element={<AnomalyPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:id" element={<CaseDetailPage />} />
        <Route path="/examination" element={<ExaminationPage />} />
        <Route path="/decisions" element={<DecisionsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPageWrapper />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginPageWrapper() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Memverifikasi sesi Anda..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}
