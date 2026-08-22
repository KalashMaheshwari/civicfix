import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CitizenAuthPage } from './pages/CitizenAuthPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { GovAuthPage } from './pages/GovAuthPage';
import { GovDashboardPage } from './pages/GovDashboardPage';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Citizen Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectTo="/">
                <CitizenDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Government / MCD Official Routes */}
          <Route path="/gov/login" element={<GovAuthPage />} />
          <Route
            path="/gov/dashboard"
            element={
              <ProtectedRoute allowedRoles={['official', 'admin']} redirectTo="/gov/login">
                <GovDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
