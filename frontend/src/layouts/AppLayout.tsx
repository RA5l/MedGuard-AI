import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../features/auth/context/AuthContext';
import { useAssignmentRealtime } from '../features/assignment/hooks/useAssignmentRealtime';
import AssignmentToastContainer from '../features/assignment/components/AssignmentToast';
import type { ToastMessage } from '../features/assignment/components/AssignmentToast';
import type { AssignmentChangePayload } from '../features/assignment/hooks/useAssignmentRealtime';
import { getScopedQuery } from '../lib/supabaseClient';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases':     'Cases',
  '/scans':     'Scan Upload',
  '/results':   'AI Results',
  '/reports':   'Reports',
  '/admin':     'Admin Panel',
  '/worklist':  'My Worklist',
};

function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('medguard-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light-theme');
      root.classList.add('dark');
      localStorage.setItem('medguard-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light-theme');
      localStorage.setItem('medguard-theme', 'light');
    }
  }, [isDarkMode]);

  return { isDarkMode, toggle: () => setIsDarkMode(d => !d) };
}

export default function AppLayout() {
  const { isDarkMode, toggle } = useTheme();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'MedGuard AI';

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // ── Realtime toast state ──────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(async (payload: AssignmentChangePayload) => {
    // Try to resolve case_code for better UX
    let caseCode: string | undefined;
    try {
      const { data } = await getScopedQuery('cases')
        .select('case_code')
        .eq('id', payload.case_id)
        .single();
      caseCode = data?.case_code;
    } catch { /* non-critical */ }

    setToasts(prev => [
      ...prev,
      {
        id:       `${payload.id}-${Date.now()}`,
        status:   payload.status,
        caseId:   payload.case_id,
        caseCode,
      },
    ]);
  }, []);

  // Subscribe to realtime updates for both doctors and radiologists
  useAssignmentRealtime({
    currentUserId: profile?.id,
    onDoctorUpdate:      addToast,
    onRadiologistUpdate: addToast,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-medical-bg">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          isDarkMode={isDarkMode}
          onThemeToggle={toggle}
          pageTitle={pageTitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 overflow-y-auto p-4 sm:p-6"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Global assignment notifications */}
      <AssignmentToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
