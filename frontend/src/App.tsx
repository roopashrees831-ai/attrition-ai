import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth
} from './context/AuthContext';

import { Layout } from './components/layout/Layout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EmployeePredictions } from './pages/EmployeePredictions';
import { DatasetManagement } from './pages/DatasetManagement';
import { ModelPerformance } from './pages/ModelPerformance';
import { CompanySettings } from './pages/CompanySettings';
import { SystemArchitecture } from './pages/SystemArchitecture';


// ============================================================
// PROTECTED ROUTE
// ============================================================

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    token,
    loading
  } = useAuth();


  // Wait while checking login session
  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-[#090612]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            animate-spin
            rounded-full
            h-10
            w-10
            border-t-2
            border-purple-500
            border-r-transparent
          "
        />
      </div>
    );
  }


  // Not logged in
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // Logged in
  return (
    <Layout>
      {children}
    </Layout>
  );
};


// ============================================================
// APPLICATION ROUTES
// ============================================================

export const AppRoutes: React.FC = () => {
  const {
    token
  } = useAuth();


  return (
    <Routes>

      {/* ======================================================
          LOGIN
      ====================================================== */}

      <Route
        path="/login"
        element={
          token
            ? (
              <Navigate
                to="/dashboard"
                replace
              />
            )
            : (
              <Login />
            )
        }
      />


      {/* ======================================================
          DASHBOARD
      ====================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          EMPLOYEE PREDICTIONS
      ====================================================== */}

      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <EmployeePredictions />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          DATASETS
      ====================================================== */}

      <Route
        path="/datasets"
        element={
          <ProtectedRoute>
            <DatasetManagement />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          MODEL PERFORMANCE
      ====================================================== */}

      <Route
        path="/models"
        element={
          <ProtectedRoute>
            <ModelPerformance />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          SYSTEM ARCHITECTURE
      ====================================================== */}

      <Route
        path="/architecture"
        element={
          <ProtectedRoute>
            <SystemArchitecture />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          SETTINGS
      ====================================================== */}

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <CompanySettings />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          OLD LIVE PREDICTOR LINK

          Live Predictor is removed.
          If old link is opened, send user to Predictions.
      ====================================================== */}

      <Route
        path="/live-predictor"
        element={
          <Navigate
            to="/predictions"
            replace
          />
        }
      />


      {/* ======================================================
          UNKNOWN ROUTES
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
};


// ============================================================
// APP
// ============================================================

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