import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import BatchTraceability from './pages/BatchTraceability';
import Tests from './pages/Tests';
import ManualTesting from './pages/ManualTesting';
import ExpiringBatches from './pages/ExpiringBatches';
import AuditLogs from './pages/AuditLogs';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(145deg, #070e1a 0%, #0a1628 50%, #0f1d32 100%)',
        color: '#0d9488',
        fontSize: '1.1rem',
        fontWeight: 600,
        gap: '0.75rem'
      }}>
        <div style={{
          width: '24px', height: '24px', border: '3px solid #1e3a5f',
          borderTopColor: '#0d9488', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        Initializing FoodLab LIMS...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/batches"
            element={
              <ProtectedRoute>
                <Batches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/batches/:id/traceability"
            element={
              <ProtectedRoute>
                <BatchTraceability />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tests"
            element={
              <ProtectedRoute>
                <Tests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manual-testing"
            element={
              <ProtectedRoute>
                <ManualTesting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expiring"
            element={
              <ProtectedRoute>
                <ExpiringBatches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
