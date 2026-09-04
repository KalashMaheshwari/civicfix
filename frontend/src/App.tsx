import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CitizenAuthPage } from './pages/CitizenAuthPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { CitizenProfilePage } from './pages/CitizenProfilePage';
import { GovAuthPage } from './pages/GovAuthPage';
import { GovDashboardPage } from './pages/GovDashboardPage';
import { GovProfilePage } from './pages/GovProfilePage';
import { TicketFilingModal } from './components/TicketFilingModal';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'official' || user.role === 'admin') {
      return <Navigate to="/gov/dashboard" replace />;
    }
    return <Navigate to="/citizen" replace />;
  }

  return <CitizenAuthPage />;
};

const FilingOverlayWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), text, type }]);
  };

  return (
    <>
      <CitizenDashboardPage />
      <TicketFilingModal 
        citizenId={user?.id || 'anonymous'}
        onSuccess={(msg) => addToast(msg, 'success')}
        onError={(err) => addToast(err, 'error')}
        onClose={() => navigate('/citizen')}
      />
      <Toast toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </>
  );
};

import { LanguageProvider } from './context/LanguageContext';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Root — redirect based on auth state */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── Citizen Routes ── */}
          <Route path="/citizen" element={
            <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectTo="/">
              <CitizenDashboardPage />
            </ProtectedRoute>
          } />

          {/* All Reports — same dashboard, the tab state handles the view */}
          <Route path="/citizen/tickets" element={
            <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectTo="/">
              <CitizenDashboardPage />
            </ProtectedRoute>
          } />

          {/* Ward Progress / Analytics — same dashboard */}
          <Route path="/citizen/analytics" element={
            <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectTo="/">
              <CitizenDashboardPage />
            </ProtectedRoute>
          } />

          {/* Report a new issue */}
          <Route path="/citizen/new" element={
            <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectTo="/">
              <FilingOverlayWrapper />
            </ProtectedRoute>
          } />

          {/* Citizen profile / My Account */}
          <Route path="/citizen/profile" element={
            <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectTo="/">
              <CitizenProfilePage />
            </ProtectedRoute>
          } />

          {/* ── Government / MCD Official Routes ── */}
          <Route path="/gov/login" element={<GovAuthPage />} />

          {/* Dashboard / Home */}
          <Route path="/gov/dashboard" element={
            <ProtectedRoute allowedRoles={['official', 'admin']} redirectTo="/gov/login">
              <GovDashboardPage />
            </ProtectedRoute>
          } />

          {/* Issue Queue — same dashboard */}
          <Route path="/gov/tickets" element={
            <ProtectedRoute allowedRoles={['official', 'admin']} redirectTo="/gov/login">
              <GovDashboardPage />
            </ProtectedRoute>
          } />

          {/* City Analytics — same dashboard */}
          <Route path="/gov/analytics" element={
            <ProtectedRoute allowedRoles={['official', 'admin']} redirectTo="/gov/login">
              <GovDashboardPage />
            </ProtectedRoute>
          } />

          {/* Gov My Account */}
          <Route path="/gov/profile" element={
            <ProtectedRoute allowedRoles={['official', 'admin']} redirectTo="/gov/login">
              <GovProfilePage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
};
