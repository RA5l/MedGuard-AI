import { motion } from 'framer-motion';
import { Sun, Moon, Menu, Bell } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { ROLE_CONFIG } from '../lib/badges';

interface NavbarProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  pageTitle: string;
  onMenuClick: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  admin:        'bg-medical-role-admin-soft       text-medical-role-admin       border-medical-role-admin/20',
  doctor:       'bg-medical-role-doctor-soft      text-medical-role-doctor      border-medical-role-doctor/20',
  radiologist:  'bg-medical-role-radiologist-soft text-medical-role-radiologist border-medical-role-radiologist/20',
};

export default function Navbar({ isDarkMode, onThemeToggle, pageTitle, onMenuClick }: NavbarProps) {
  const { profile } = useAuth();

  const roleKey   = profile?.role ?? null;
const roleLabel = roleKey ? (ROLE_CONFIG[roleKey]?.label ?? roleKey) : null;
const roleColor = roleKey ? ROLE_COLORS[roleKey] : null;

  const initials = profile?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6
        bg-medical-surface/90 backdrop-blur-md
        border-b border-medical-border
        shadow-[0_1px_0_0_var(--color-medical-border)]
        shrink-0"
    >
      {/* ── Left: mobile menu + page title ──────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 rounded-lg border border-medical-border
            text-medical-text-secondary hover:text-medical-text hover:bg-medical-border/30
            transition-all flex items-center justify-center shrink-0
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-accent/40"
          aria-label="Open sidebar"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        <div className="min-w-0">
          <h1 className="text-medical-text font-bold text-[15px] leading-tight truncate">
            {pageTitle}
          </h1>
          <p className="text-medical-text-muted text-xs hidden sm:block leading-tight mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year:    'numeric',
              month:   'long',
              day:     'numeric',
            })}
          </p>
        </div>
      </div>

      {/* ── Right: actions + user ────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg border border-medical-border
            text-medical-text-secondary hover:text-medical-text hover:bg-medical-border/30
            transition-all flex items-center justify-center
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-accent/40"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
          {/* Unread dot — show when there are notifications */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-medical-error" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="w-9 h-9 rounded-lg border border-medical-border
            text-medical-text-secondary hover:text-medical-text hover:bg-medical-border/30
            transition-all flex items-center justify-center
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-accent/40"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode
            ? <Sun  size={16} strokeWidth={2} />
            : <Moon size={16} strokeWidth={2} />
          }
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-medical-border mx-1 hidden sm:block" />

        {/* User info — name + role badge + avatar */}
        <div className="flex items-center gap-2.5">
          {/* Name + role — hidden on small screens */}
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <p className="text-medical-text text-xs font-semibold leading-tight whitespace-nowrap">
              {profile?.full_name ?? '···'}
            </p>
            {roleKey && roleColor && (
  <span className={`text-[10px] px-1.5 py-px rounded border font-semibold leading-tight ${roleColor}`}>
    {roleLabel}
  </span>
)}
          </div>

          {/* Avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-medical-primary flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold leading-none">{initials}</span>
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-medical-success border-2 border-medical-surface" />
          </div>
        </div>
      </div>
    </motion.header>
  );
}