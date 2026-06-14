import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases': 'Cases Management',
  '/scans': 'Scan Upload',
  '/results': 'AI Results',
  '/reports': 'Reports',
  '/admin': 'Admin Panel',
};

interface AppLayoutProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export default function AppLayout({ isDarkMode, onThemeToggle }: AppLayoutProps) {
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
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          isDarkMode={isDarkMode}
          onThemeToggle={onThemeToggle}
          pageTitle={pageTitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}