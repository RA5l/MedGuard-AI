import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'doctor' | 'radiologist')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-medical-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-medical-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-medical-text/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // غير مسجل → Login
  if (!user) return <Navigate to="/login" replace />;

  // حساب غير مفعّل
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-medical-bg">
        <div className="bg-medical-surface border border-medical-border rounded-xl p-8 max-w-md text-center">
          <p className="text-2xl mb-2">🔒</p>
          <h2 className="text-medical-text font-bold text-lg mb-2">Account Deactivated</h2>
          <p className="text-medical-text/60 text-sm">Contact your administrator for access.</p>
        </div>
      </div>
    );
  }

  // تحقق من الدور
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
