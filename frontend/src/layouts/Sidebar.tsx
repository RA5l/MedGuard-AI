import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../features/auth/context/AuthContext';
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
  ListTodo,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'doctor' | 'radiologist')[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/cases',     label: 'Cases',      icon: FolderHeart,     roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/scans',     label: 'Scans',      icon: ScanLine,        roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/results',   label: 'AI Results', icon: Activity,        roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/reports',   label: 'Reports',    icon: ClipboardList,   roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/admin',     label: 'Admin',      icon: SettingsIcon,    roles: ['admin']                          },
  {path: '/worklist',   label: 'Worklist',   icon: ListTodo,   roles: ['radiologist']                    }
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();


  const visibleItems = loading
    ? NAV_ITEMS.filter(i => !i.roles.every(r => r === 'admin'))
    : NAV_ITEMS.filter(item =>
        profile?.role
          ? item.roles.includes(profile.role as 'admin' | 'doctor' | 'radiologist')
          : item.roles.some(r => r !== 'admin')
      );
      

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 72 : 248 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          flex flex-col shrink-0
          bg-medical-surface border-r border-medical-border
          overflow-hidden transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-medical-border shrink-0">
          <div className="w-9 h-9 rounded-xl bg-medical-primary flex items-center justify-center shrink-0 shadow-sm">
            <Stethoscope className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex-1 overflow-hidden whitespace-nowrap"
              >
                <p className="text-medical-text font-bold text-sm leading-tight">MedGuard AI</p>
                <p className="text-medical-text-muted text-xs">Screening Platform</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="md:hidden ml-auto text-medical-text-muted hover:text-medical-text transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">

          {/* Section label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-medical-text-muted"
              >
                Navigation
              </motion.p>
            )}
          </AnimatePresence>

          {visibleItems.map(navItem => (
            <NavLink
              key={navItem.path}
              to={navItem.path}
              onClick={onMobileClose}
              title={collapsed ? navItem.label : undefined}
              className={({ isActive }) => `
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 outline-none
                focus-visible:ring-2 focus-visible:ring-medical-accent/40
                ${isActive
                  ? 'bg-medical-primary/10 text-medical-primary'
                  : 'text-medical-text-secondary hover:bg-medical-border/40 hover:text-medical-text'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  <span className={`
                    absolute left-0 w-0.5 h-6 rounded-r-full bg-medical-primary
                    transition-opacity duration-150
                    ${isActive ? 'opacity-100' : 'opacity-0'}
                  `} />

                  <navItem.icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-medical-primary' : 'text-medical-text-muted group-hover:text-medical-text'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {navItem.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User + Actions ─────────────────────────────── */}
        <div className="px-2 pb-3 pt-2 border-t border-medical-border space-y-0.5 shrink-0">

          {/* User card */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-medical-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-medical-success border-2 border-medical-surface" />
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 flex-1 overflow-hidden"
                >
                  <p className="text-medical-text text-xs font-semibold truncate leading-tight">
                    {profile?.full_name ?? 'Loading…'}
                  </p>
                  <p className="text-medical-text-muted text-[11px] capitalize leading-tight mt-0.5">
                    {loading ? '···' : (profile?.role ?? 'clinician')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              text-medical-text-muted hover:text-red-400 hover:bg-red-400/8
              transition-all w-full outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap text-sm"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              text-medical-text-muted hover:text-medical-text hover:bg-medical-border/30
              transition-all w-full outline-none focus-visible:ring-2 focus-visible:ring-medical-accent/30"
          >
            {collapsed
              ? <ChevronsRight className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              : <ChevronsLeft  className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            }
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
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