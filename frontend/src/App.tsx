import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EmployeePredictions } from './pages/EmployeePredictions';
import { DatasetManagement } from './pages/DatasetManagement';
import { ModelPerformance } from './pages/ModelPerformance';
import { WorkforceInsights } from './pages/WorkforceInsights';
import { CompanySettings } from './pages/CompanySettings';
import { SystemArchitecture } from './pages/SystemArchitecture';
import { LivePredictor } from './pages/LivePredictor';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090612] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500 border-r-transparent" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export const AppRoutes: React.FC = () => {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/live-predictor" element={<ProtectedRoute><LivePredictor /></ProtectedRoute>} />
      <Route path="/predictions" element={<ProtectedRoute><EmployeePredictions /></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><WorkforceInsights /></ProtectedRoute>} />
      <Route path="/datasets" element={<ProtectedRoute><DatasetManagement /></ProtectedRoute>} />
      <Route path="/models" element={<ProtectedRoute><ModelPerformance /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
      <Route path="/architecture" element={<ProtectedRoute><SystemArchitecture /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
