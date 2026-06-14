import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, Menu } from 'lucide-react';
import { ROLE_CONFIG } from '../../lib/badges';

interface NavbarProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  pageTitle: string;
  onMenuClick: () => void;
}

export default function Navbar({ isDarkMode, onThemeToggle, pageTitle, onMenuClick }: NavbarProps) {
  const { profile } = useAuth();
  const badge = ROLE_CONFIG[profile?.role ?? 'doctor'];

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 bg-medical-surface/80 backdrop-blur-md border-b border-medical-border"
    >
      {/* Left: mobile menu button + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 rounded-lg border border-medical-border text-medical-text/60 hover:text-medical-text hover:bg-medical-border/30 transition-all flex items-center justify-center shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="text-medical-text font-bold text-base truncate">{pageTitle}</h1>
          <p className="text-medical-text/40 text-xs hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onThemeToggle}
          className="w-8 h-8 rounded-lg border border-medical-border text-medical-text/50 hover:text-medical-text hover:bg-medical-border/30 transition-all flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
        </button>

        <div className="w-px h-6 bg-medical-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-medical-text text-xs font-semibold">{profile?.full_name}</p>
            <p className="text-medical-text/40 text-xs">{profile?.specialty ?? 'MedGuard AI'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="w-8 h-8 rounded-full bg-medical-primary/20 flex items-center justify-center">
              <span className="text-medical-primary text-xs font-bold uppercase">{profile?.full_name?.charAt(0) ?? 'U'}</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badge?.classes}`}>{badge?.label}</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}