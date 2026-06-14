import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderHeart,
  ScanLine,
  Activity,
  ClipboardList,
  Settings as SettingsIcon,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Stethoscope,
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'doctor' | 'radiologist')[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/cases', label: 'Cases', icon: FolderHeart, roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/scans', label: 'Scans', icon: ScanLine, roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/results', label: 'AI Results', icon: Activity, roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/reports', label: 'Reports', icon: ClipboardList, roles: ['admin', 'doctor'] },
  { path: '/admin', label: 'Admin Panel', icon: SettingsIcon, roles: ['admin'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Whether the mobile drawer is open (ignored on md+ screens). */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => (profile?.role ? item.roles.includes(profile.role) : false));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop — only rendered while drawer is open */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed md:sticky top-0 left-0 h-screen flex flex-col bg-medical-surface border-r border-medical-border overflow-hidden z-50 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-medical-border">
          <div className="w-9 h-9 rounded-xl bg-medical-primary flex items-center justify-center shrink-0 shadow-lg shadow-medical-primary/20">
            <Stethoscope className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap flex-1"
              >
                <p className="text-medical-text font-bold text-sm leading-tight">MedGuard AI</p>
                <p className="text-medical-text/40 text-xs">Screening Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Close button — mobile drawer only */}
          <button onClick={onMobileClose} className="md:hidden text-medical-text/40 hover:text-medical-text transition-colors shrink-0" aria-label="Close menu">
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map(navItem => (
            <NavLink
              key={navItem.path}
              to={navItem.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-medical-primary/10 text-medical-primary border border-medical-primary/20'
                  : 'text-medical-text/60 hover:bg-medical-border/30 hover:text-medical-text'
                }`
              }
            >
              <navItem.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap overflow-hidden">
                    {navItem.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* User Profile + Sign Out */}
        <div className="px-2 py-3 border-t border-medical-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-medical-accent/20 flex items-center justify-center shrink-0">
              <span className="text-medical-accent text-xs font-bold uppercase">{profile?.full_name?.charAt(0) ?? 'U'}</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                  <p className="text-medical-text text-xs font-semibold truncate max-w-[140px]">{profile?.full_name}</p>
                  <p className="text-medical-text/40 text-xs capitalize">{profile?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-medical-text/50 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse toggle — hidden on mobile, drawer uses the X button instead */}
          <button
            onClick={onToggle}
            className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-medical-text/40 hover:text-medical-text hover:bg-medical-border/30 transition-all w-full"
          >
            {collapsed ? (
              <ChevronsRight className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            ) : (
              <ChevronsLeft className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}