import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from './store/adminAuthStore';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import PromptStudio from './pages/PromptStudio';
import QueryLogs from './pages/QueryLogs';
import TokenAnalytics from './pages/TokenAnalytics';
import ConversationAnalytics from './pages/ConversationAnalytics';
import UserManagement from './pages/UserManagement';
import SystemHealth from './pages/SystemHealth';

function ProtectedRoute({ children }) {
  const { authenticated, loading, checkAuth } = useAdminAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-admin-muted">Checking auth...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="prompts" element={<PromptStudio />} />
        <Route path="logs" element={<QueryLogs />} />
        <Route path="analytics/tokens" element={<TokenAnalytics />} />
        <Route path="analytics/conversations" element={<ConversationAnalytics />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="health" element={<SystemHealth />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
