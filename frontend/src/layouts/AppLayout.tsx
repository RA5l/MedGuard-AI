import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases':     'Cases',
  '/scans':     'Scan Upload',
  '/results':   'AI Results',
  '/reports':   'Reports',
  '/admin':     'Admin Panel',
};

// Theme is toggled via CSS class on <html> to match the light-theme / dark-theme
// selectors defined in index.css. State is persisted to localStorage.
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'MedGuard AI';

  // Close the mobile drawer automatically on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
    </div>
  );
}
