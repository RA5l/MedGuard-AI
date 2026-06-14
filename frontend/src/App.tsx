import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import CasesList   from './pages/CasesList';
import CaseDetails from './pages/CaseDetails';
import ScanUpload from './pages/ScanUpload';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
  }, [isDarkMode]);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <Login isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode(!isDarkMode)} />
          } />

          <Route element={
            <ProtectedRoute>
              <AppLayout isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode(!isDarkMode)} />
            </ProtectedRoute>
          }>
            <Route path="/dashboard"  element={<Dashboard />}   />
            <Route path="/cases"      element={<CasesList />}   />
            <Route path="/cases/:id"  element={<CaseDetails />} />
            <Route path="/scans" element={<ScanUpload />} />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
              </ProtectedRoute>
                                        } />
          </Route>

          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}