Ran 10 commands, viewed a file
Ran 10 commands, viewed a file

Read frontend design skill

Copy project to output workspace
bash

cp -r /home/claude/project/frontend2 /home/claude/project/frontend_output && echo "copied"
Output

copied

Write clean index.css
bash

cat > /home/claude/project/frontend_output/src/index.css << 'CSSEOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', sans-serif;
}

/* Light Mode */
.light-theme {
  /* Base surfaces */
  --color-medical-bg:      #F0F4F8;
  --color-medical-surface: #FFFFFF;
  --color-medical-border:  #D1DCE8;
  --color-medical-text:    #0D1B2A;

  /* Brand */
  --color-medical-primary: #0A4F8A;
  --color-medical-accent:  #007A85;

  /* Clinical outcomes — WCAG AA on white (#FFFFFF) */
  --color-medical-normal:    #1E6B3C;
  --color-medical-benign:    #C45500;
  --color-medical-malignant: #B91C1C;

  /* Status colours */
  --color-medical-pending:     #B45309;
  --color-medical-processing:  #1D4ED8;
  --color-medical-ai-complete: #6D28D9;
  --color-medical-reviewed:    #0E7490;
  --color-medical-reported:    #15803D;
  --color-medical-archived:    #475569;

  /* Priority colours */
  --color-medical-priority-routine: #64748B;
  --color-medical-priority-low:     #1D4ED8;
  --color-medical-priority-high:    #B45309;
  --color-medical-priority-urgent:  #B91C1C;

  /* Role colours */
  --color-medical-role-admin:       #6D28D9;
  --color-medical-role-doctor:      #007A85;
  --color-medical-role-radiologist: #1D4ED8;

  /* Soft badge tints (WCAG AA: coloured text on these backgrounds) */
  --color-medical-pending-soft:           #FEF3C7;
  --color-medical-processing-soft:        #DBEAFE;
  --color-medical-ai-complete-soft:       #EDE9FE;
  --color-medical-reviewed-soft:          #CFFAFE;
  --color-medical-reported-soft:          #DCFCE7;
  --color-medical-archived-soft:          #F1F5F9;
  --color-medical-role-admin-soft:        #EDE9FE;
  --color-medical-role-doctor-soft:       #CCFBF1;
  --color-medical-role-radiologist-soft:  #DBEAFE;
  --color-medical-normal-soft:            #DCFCE7;
  --color-medical-malignant-soft:         #FEE2E2;
}

/* Dark Mode */
.dark-theme {
  /* Base surfaces */
  --color-medical-bg:      #0A192F;
  --color-medical-surface: #112240;
  --color-medical-border:  #1E3A5F;
  --color-medical-text:    #E2EAF4;

  /* Brand */
  --color-medical-primary: #1A6BAF;
  --color-medical-accent:  #00A8B5;

  /* Clinical outcomes */
  --color-medical-normal:    #34D399;
  --color-medical-benign:    #FB923C;
  --color-medical-malignant: #F87171;

  /* Status colours */
  --color-medical-pending:     #FCD34D;
  --color-medical-processing:  #60A5FA;
  --color-medical-ai-complete: #A78BFA;
  --color-medical-reviewed:    #22D3EE;
  --color-medical-reported:    #4ADE80;
  --color-medical-archived:    #94A3B8;

  /* Priority colours */
  --color-medical-priority-routine: #64748B;
  --color-medical-priority-low:     #60A5FA;
  --color-medical-priority-high:    #FCD34D;
  --color-medical-priority-urgent:  #F87171;

  /* Role colours */
  --color-medical-role-admin:       #A78BFA;
  --color-medical-role-doctor:      #00C4D4;
  --color-medical-role-radiologist: #60A5FA;

  /* Soft badge tints */
  --color-medical-pending-soft:           #3D2E0A;
  --color-medical-processing-soft:        #1E3060;
  --color-medical-ai-complete-soft:       #2E1F5E;
  --color-medical-reviewed-soft:          #0E3040;
  --color-medical-reported-soft:          #0C3020;
  --color-medical-archived-soft:          #1E2A38;
  --color-medical-role-admin-soft:        #2E1F5E;
  --color-medical-role-doctor-soft:       #0E3040;
  --color-medical-role-radiologist-soft:  #1E3060;
  --color-medical-normal-soft:            #0C3020;
  --color-medical-malignant-soft:         #3D1010;
}

body {
  background-color: var(--color-medical-bg);
  color: var(--color-medical-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.3s ease, color 0.3s ease;
  margin: 0;
  min-height: 100vh;
}

/* Grad-CAM heatmap scale — used in AI scan overlays */
.medical-heatmap-gradient {
  background: linear-gradient(to right, #0022ff, #00a2ff, #00ff22, #ffea00, #ff0000);
}
CSSEOF
echo "index.css written"
Output

index.css written

Write badges.ts
bash

cat > /home/claude/project/frontend_output/src/lib/badges.ts << 'EOF'
import {
  Clock,
  Loader2,
  Sparkles,
  Eye,
  CheckCircle2,
  Archive,
  Minus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  ScanLine,
  type LucideIcon,
} from 'lucide-react';

// STATUS_CONFIG.classes → soft-tint badge used inside tables/lists (WCAG AA).
// STATUS_CONFIG.solid  → solid-fill chip colour used on stat cards / info grids.
export const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; classes: string; solid: string }> = {
  pending:     { label: 'Pending',     icon: Clock,        classes: 'bg-(--color-medical-pending-soft) text-(--color-medical-pending)',        solid: 'bg-(--color-medical-pending)'     },
  processing:  { label: 'Processing',  icon: Loader2,      classes: 'bg-(--color-medical-processing-soft) text-(--color-medical-processing)',   solid: 'bg-(--color-medical-processing)'  },
  ai_complete: { label: 'AI Complete', icon: Sparkles,     classes: 'bg-(--color-medical-ai-complete-soft) text-(--color-medical-ai-complete)', solid: 'bg-(--color-medical-ai-complete)' },
  reviewed:    { label: 'Reviewed',    icon: Eye,          classes: 'bg-(--color-medical-reviewed-soft) text-(--color-medical-reviewed)',        solid: 'bg-(--color-medical-reviewed)'    },
  reported:    { label: 'Reported',    icon: CheckCircle2, classes: 'bg-(--color-medical-reported-soft) text-(--color-medical-reported)',        solid: 'bg-(--color-medical-reported)'    },
  archived:    { label: 'Archived',    icon: Archive,      classes: 'bg-(--color-medical-archived-soft) text-(--color-medical-archived)',        solid: 'bg-(--color-medical-archived)'    },
};

export const PRIORITY_CONFIG: Record<number, { label: string; icon: LucideIcon; color: string }> = {
  0: { label: 'Routine', icon: Minus,         color: 'text-(--color-medical-priority-routine)' },
  1: { label: 'Low',     icon: ArrowDown,     color: 'text-(--color-medical-priority-low)'     },
  2: { label: 'High',    icon: ArrowUp,       color: 'text-(--color-medical-priority-high)'    },
  3: { label: 'Urgent',  icon: AlertTriangle, color: 'text-(--color-medical-priority-urgent)'  },
};

export const PREDICTION_COLORS: Record<string, string> = {
  Normal:    'text-medical-normal',
  Benign:    'text-medical-benign',
  Malignant: 'text-medical-malignant',
};

// ROLE_CONFIG.classes → soft badge; ROLE_CONFIG.solid → solid chip.
export const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon; classes: string; solid: string }> = {
  admin:       { label: 'Admin',       icon: ShieldCheck, classes: 'bg-(--color-medical-role-admin-soft) text-(--color-medical-role-admin)',            solid: 'bg-(--color-medical-role-admin)'       },
  doctor:      { label: 'Doctor',      icon: Stethoscope, classes: 'bg-(--color-medical-role-doctor-soft) text-(--color-medical-role-doctor)',           solid: 'bg-(--color-medical-role-doctor)'      },
  radiologist: { label: 'Radiologist', icon: ScanLine,    classes: 'bg-(--color-medical-role-radiologist-soft) text-(--color-medical-role-radiologist)', solid: 'bg-(--color-medical-role-radiologist)' },
};

export const ACTIVE_STATUS_CLASSES = {
  active:   'bg-(--color-medical-normal-soft) text-medical-normal',
  inactive: 'bg-(--color-medical-malignant-soft) text-medical-malignant',
};
EOF
echo "badges.ts written"
Output

badges.ts written

Write Select.tsx
bash

cat > /home/claude/project/frontend_output/src/components/Select.tsx << 'EOF'
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

// Custom Select replaces <select> to allow full theme-consistent styling and
// animated dropdown. Uses bg-medical-surface (not bg-medical-bg) so the
// trigger button has a clear contrast against page backgrounds in both themes.
export default function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2.5 rounded-lg border border-medical-border bg-medical-surface text-medical-text text-sm text-left flex items-center justify-between gap-2 outline-none focus:ring-2 focus:ring-medical-accent transition-all hover:border-medical-accent/50"
      >
        <span className={`truncate ${selected ? 'text-medical-text' : 'text-medical-text/40'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-medical-text/40 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className="absolute z-30 mt-1.5 w-full bg-medical-surface border-2 border-medical-border rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto"
          >
            {options.map(opt => (
              <li
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  opt.value === value
                    ? 'bg-(--color-medical-processing-soft) text-(--color-medical-processing) font-semibold'
                    : 'text-medical-text/70 hover:bg-medical-border/40 hover:text-medical-text'
                }`}
              >
                {opt.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
EOF
echo "Select.tsx written"
Output

Select.tsx written

Write Dashboard.tsx
bash

cat > /home/claude/project/frontend_output/src/pages/Dashboard.tsx << 'EOF'
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderHeart,
  Clock,
  Zap,
  AlertTriangle,
  Upload,
  Plus,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCases } from '../hooks/useCases';
import { STATUS_CONFIG, PREDICTION_COLORS } from '../lib/badges';
import Spinner from '../components/Spinner';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { cases, loading } = useCases();

  const total      = cases.length;
  const pending    = cases.filter(c => c.status === 'pending' || c.status === 'processing').length;
  const aiComplete = cases.filter(c => c.status === 'ai_complete').length;
  const malignant  = cases.filter(c => c.ai_prediction === 'Malignant').length;

  // Solid chip colours come from design tokens; white icon on coloured square
  // follows the 60/30/10 rule — coloured elements stay ≤10% of the viewport.
  const STATS = [
    { label: 'Total Cases',    value: total,      icon: FolderHeart,   chip: 'bg-medical-accent'                },
    { label: 'Pending Review', value: pending,    icon: Clock,         chip: 'bg-(--color-medical-pending)'     },
    { label: 'AI Complete',    value: aiComplete, icon: Zap,           chip: 'bg-(--color-medical-ai-complete)' },
    { label: 'Malignant',      value: malignant,  icon: AlertTriangle, chip: 'bg-medical-malignant'             },
  ];

  const recentCases = cases.slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto">

      {/* Welcome */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-medical-text">
          Good {getTimeOfDay()}, {profile?.full_name?.split(' ').slice(0, 2).join(' ')}
        </h2>
        <p className="text-medical-text/50 text-sm mt-0.5">Here's your clinical overview for today.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(stat => (
          <motion.div
            key={stat.label}
            variants={item}
            className="bg-medical-surface border border-medical-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${stat.chip}`}>
                <stat.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="text-3xl font-bold tracking-tight text-medical-text">
                {loading ? '—' : stat.value}
              </span>
            </div>
            <p className="text-medical-text/60 text-sm font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/scans"
          className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3 hover:border-medical-primary/50 hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-medical-primary text-white flex items-center justify-center shrink-0 shadow-sm">
            <Upload className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold text-sm text-medical-text">Upload Scan</p>
            <p className="text-xs text-medical-text/40">Add a new mammography image</p>
          </div>
        </Link>

        <Link
          to="/cases"
          className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3 hover:border-medical-accent/50 hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-medical-accent text-white flex items-center justify-center shrink-0 shadow-sm">
            <Plus className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold text-sm text-medical-text">New Case</p>
            <p className="text-xs text-medical-text/40">Register a new patient case</p>
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3 hover:border-(--color-medical-reported)/50 hover:shadow-md transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-(--color-medical-reported) text-white flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardList className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold text-sm text-medical-text">View Reports</p>
            <p className="text-xs text-medical-text/40">Browse finalised reports</p>
          </div>
        </Link>
      </motion.div>

      {/* Recent Cases */}
      <motion.div variants={item} className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-medical-text font-bold text-sm">Recent Cases</h3>
          <Link to="/cases" className="text-medical-accent text-xs font-medium flex items-center gap-1 hover:gap-1.5 transition-all">
            View all <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        ) : recentCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-3">
              <FolderHeart className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">Cases will appear here</p>
            <p className="text-medical-text/25 text-xs mt-1">Upload your first scan to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-medical-border">
                  {['Case Code', 'Patient', 'Status', 'AI Result', 'Date'].map(h => (
                    <th key={h} className="px-2 py-2 text-left text-medical-text/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.case_id} className="border-b border-medical-border/50 last:border-0">
                    <td className="px-2 py-2.5 font-mono font-semibold text-medical-accent text-xs">{c.case_code}</td>
                    <td className="px-2 py-2.5 text-medical-text/70">{c.patient_alias ?? '—'}</td>
                    <td className="px-2 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium inline-flex items-center gap-1 ${STATUS_CONFIG[c.status]?.classes ?? ''}`}>
                        {(() => { const Icon = STATUS_CONFIG[c.status]?.icon; return Icon ? <Icon className="w-3 h-3" strokeWidth={2.5} /> : null; })()}
                        {STATUS_CONFIG[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className={`px-2 py-2.5 text-xs font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                      {c.ai_prediction
                        ? `${c.ai_prediction}${c.ai_confidence ? ` (${(c.ai_confidence * 100).toFixed(0)}%)` : ''}`
                        : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-medical-text/40 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
EOF
echo "Dashboard.tsx written"
Output

Dashboard.tsx written

Write Login.tsx
bash

cat > /home/claude/project/frontend_output/src/pages/Login.tsx << 'EOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }
    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-medical-bg p-4"
    >
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-medical-primary mb-4 shadow-lg">
            <Stethoscope className="w-7 h-7 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-extrabold text-medical-text tracking-tight">MedGuard AI</h1>
          <p className="text-medical-text/50 text-sm mt-1">Breast Cancer Screening Platform</p>
        </div>

        {/* Form card — uses bg-medical-surface so it lifts off bg-medical-bg in both themes */}
        <motion.form
          onSubmit={handleLogin}
          className="bg-medical-surface border border-medical-border rounded-2xl p-8 shadow-xl"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-medical-text mb-6">Clinician Sign In</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-(--color-medical-malignant-soft) border border-medical-malignant/30 text-medical-malignant text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
              {error}
            </motion.div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-medical-text/80 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-text/30" strokeWidth={2} />
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-medical-border bg-medical-bg text-medical-text placeholder:text-medical-text/30 focus:ring-2 focus:ring-medical-accent focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-medical-text/80 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-text/30" strokeWidth={2} />
              <input
                id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-medical-border bg-medical-bg text-medical-text placeholder:text-medical-text/30 focus:ring-2 focus:ring-medical-accent focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text/30 hover:text-medical-text/60 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-medical-primary text-white py-3 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (<><Spinner size="sm" className="border-white" /> Signing in...</>) : 'Sign In'}
          </button>

          <p className="text-center text-medical-text/40 text-xs mt-4">
            Access restricted to authorised clinicians only
          </p>
        </motion.form>

        <p className="text-center text-medical-text/30 text-xs mt-6">
          MedGuard AI © 2026 — HIPAA Compliant
        </p>
      </div>
    </motion.div>
  );
}
EOF
echo "Login.tsx written"
Output

Login.tsx written

Write CasesList.tsx
bash

cat > /home/claude/project/frontend_output/src/pages/CasesList.tsx << 'EOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FolderHeart, X } from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_CONFIG, PRIORITY_CONFIG, PREDICTION_COLORS } from '../lib/badges';
import Spinner from '../components/Spinner';
import Select from '../components/Select';

// Shared badge components — used in both desktop table rows and mobile cards.
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg?.icon;
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium inline-flex items-center gap-1 ${cfg?.classes ?? ''}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {cfg?.label ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg?.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg?.color ?? ''}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {cfg?.label}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses' },
  { value: 'pending',     label: 'Pending'      },
  { value: 'processing',  label: 'Processing'   },
  { value: 'ai_complete', label: 'AI Complete'  },
  { value: 'reviewed',    label: 'Reviewed'     },
  { value: 'reported',    label: 'Reported'     },
  { value: 'archived',    label: 'Archived'     },
];

export default function CasesList() {
  const navigate = useNavigate();
  // `profile` is preserved for future role-gated actions (edit / delete).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile } = useAuth();
  const { cases, loading, error, createCase } = useCases();

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ case_code: '', patient_alias: '', priority: 0, notes: '' });
  const [creating, setCreating]     = useState(false);
  const [formError, setFormError]   = useState('');

  const filtered = cases.filter(c => {
    const matchSearch = c.case_code.toLowerCase().includes(search.toLowerCase())
      || (c.patient_alias ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.case_code.trim()) { setFormError('Case code is required'); return; }
    setCreating(true);
    try {
      await createCase(form);
      setShowModal(false);
      setForm({ case_code: '', patient_alias: '', priority: 0, notes: '' });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-medical-text">Cases</h2>
          <p className="text-medical-text/40 text-sm mt-0.5">
            {cases.length} total case{cases.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-medical-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> New Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-text/30" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search by case code or patient alias…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-medical-border bg-medical-surface text-medical-text text-sm placeholder:text-medical-text/30 focus:ring-2 focus:ring-medical-accent focus:border-transparent outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text/30 hover:text-medical-text/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
        <Select
          value={statusFilter}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          className="sm:w-48"
        />
      </div>

      {/* Table / Cards */}
      <div className="bg-medical-surface border border-medical-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-medical-malignant text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-3">
              <FolderHeart className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">No cases found</p>
            <p className="text-medical-text/25 text-xs mt-1">Create your first case to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop table — md and up */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-medical-border">
                    {['Case Code', 'Patient', 'Status', 'Priority', 'Scans', 'AI Result', 'Doctor', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-medical-text/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.case_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="border-b border-medical-border/50 hover:bg-medical-border/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-medical-accent text-xs">{c.case_code}</td>
                      <td className="px-4 py-3 text-medical-text/70">{c.patient_alias ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3 text-medical-text/60 text-center">{c.total_scans}</td>
                      <td className={`px-4 py-3 text-xs font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                        {c.ai_prediction ? `${c.ai_prediction}${c.ai_confidence ? ` (${(c.ai_confidence * 100).toFixed(0)}%)` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-medical-text/60 text-xs">{c.assigned_doctor_name ?? '—'}</td>
                      <td className="px-4 py-3 text-medical-text/40 text-xs">{formatDate(c.created_at)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — below md */}
            <div className="md:hidden divide-y divide-medical-border/50">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.case_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/cases/${c.case_id}`)}
                  className="p-4 active:bg-medical-border/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-semibold text-medical-accent text-xs">{c.case_code}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-medical-text font-medium text-sm mb-2">{c.patient_alias ?? '—'}</p>
                  <div className="flex items-center justify-between text-xs">
                    <PriorityBadge priority={c.priority} />
                    <span className={`font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                      {c.ai_prediction ? `${c.ai_prediction}${c.ai_confidence ? ` (${(c.ai_confidence * 100).toFixed(0)}%)` : ''}` : 'No AI result'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5 text-medical-text/40">
                    <span>{c.assigned_doctor_name ?? '—'}</span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New Case Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-medical-surface border border-medical-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-medical-accent text-white flex items-center justify-center shrink-0">
                    <FolderHeart className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-medical-text font-bold text-base">New Case</h3>
                    <p className="text-medical-text/40 text-xs mt-0.5">Register a new patient screening case</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-medical-text/40 hover:text-medical-text transition-colors mt-1" aria-label="Close">
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-(--color-medical-malignant-soft) border border-medical-malignant/30 text-medical-malignant text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">
                      Case Code <span className="text-medical-malignant">*</span>
                    </label>
                    <input
                      type="text" required placeholder="P_00001"
                      value={form.case_code}
                      onChange={e => setForm({ ...form, case_code: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm font-mono placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Patient Alias</label>
                    <input
                      type="text" placeholder="Patient A"
                      value={form.patient_alias}
                      onChange={e => setForm({ ...form, patient_alias: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Priority</label>
                  <Select
                    value={String(form.priority)}
                    onChange={v => setForm({ ...form, priority: Number(v) })}
                    options={[
                      { value: '0', label: 'Routine' },
                      { value: '1', label: 'Low'     },
                      { value: '2', label: 'High'    },
                      { value: '3', label: 'Urgent'  },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Notes</label>
                  <textarea
                    rows={3} placeholder="Clinical notes…"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 p-2.5 rounded-lg border border-medical-border text-medical-text/60 text-sm hover:bg-medical-border/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={creating}
                    className="flex-1 p-2.5 rounded-lg bg-medical-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (<><Spinner size="sm" className="border-white" /> Creating…</>) : 'Create Case'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
EOF
echo "CasesList.tsx written"
Output

CasesList.tsx written

Write CaseDetails.tsx
bash

cat > /home/claude/project/frontend_output/src/pages/CaseDetails.tsx << 'EOF'
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Stethoscope,
  ScanLine,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Plus,
  ImageOff,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { STATUS_CONFIG, PRIORITY_CONFIG, PREDICTION_COLORS } from '../lib/badges';
import { useScans } from '../hooks/useScans';
import Spinner from '../components/Spinner';

// v_case_dashboard is a wide Supabase view with many nullable columns — typed
// loosely here; narrow individual fields where safety matters.
type CaseRow = Record<string, unknown>;

export default function CaseDetails() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [caseData, setCaseData] = useState<CaseRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const { scans, loading: scansLoading } = useScans(id ?? '');

  useEffect(() => {
    const fetchCase = async () => {
      const { data } = await supabase
        .schema('dev')
        .from('v_case_dashboard')
        .select('*')
        .eq('case_id', id)
        .single();
      setCaseData(data as CaseRow | null);
      setLoading(false);
    };
    fetchCase();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  if (!caseData)  return <div className="text-center py-16 text-medical-text/40">Case not found</div>;

  const status      = caseData.status as string;
  const priority    = caseData.priority as number;
  const prediction  = caseData.ai_prediction as string | undefined;
  const confidence  = caseData.ai_confidence as number | undefined;
  const finalized   = Boolean(caseData.report_finalized);

  const formatDate = (d: unknown) =>
    typeof d === 'string' ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-5"
    >
      {/* Back */}
      <button
        onClick={() => navigate('/cases')}
        className="text-medical-text/40 hover:text-medical-text text-sm flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back to Cases
      </button>

      {/* Header Card */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-medical-text font-mono">{caseData.case_code as string}</h2>
              <span className={`text-xs px-2 py-1 rounded-md font-medium inline-flex items-center gap-1 ${STATUS_CONFIG[status]?.classes ?? ''}`}>
                {(() => { const Icon = STATUS_CONFIG[status]?.icon; return Icon ? <Icon className="w-3 h-3" strokeWidth={2.5} /> : null; })()}
                {STATUS_CONFIG[status]?.label ?? status}
              </span>
            </div>
            <p className="text-medical-text/50 text-sm">
              Patient: <span className="text-medical-text">{(caseData.patient_alias as string) ?? '—'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold inline-flex items-center gap-1.5 justify-end ${PRIORITY_CONFIG[priority]?.color ?? ''}`}>
              {(() => { const Icon = PRIORITY_CONFIG[priority]?.icon; return Icon ? <Icon className="w-3.5 h-3.5" strokeWidth={2.5} /> : null; })()}
              {PRIORITY_CONFIG[priority]?.label} Priority
            </p>
            <p className="text-medical-text/30 text-xs mt-1">{formatDate(caseData.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Info Grid — solid-fill icon chips per design system */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Assigned Doctor', value: (caseData.assigned_doctor_name as string) ?? '—', icon: Stethoscope, chip: 'bg-medical-primary' },
          { label: 'Total Scans',     value: String(caseData.total_scans ?? 0),                 icon: ScanLine,    chip: 'bg-medical-accent'  },
          {
            label: 'Report',
            value: finalized ? 'Finalised' : 'Pending',
            icon:  finalized ? CheckCircle2 : ClipboardList,
            chip:  finalized ? 'bg-(--color-medical-reported)' : 'bg-(--color-medical-pending)',
          },
        ].map(info => (
          <div key={info.label} className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${info.chip}`}>
              <info.icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-medical-text/40 text-xs mb-0.5">{info.label}</p>
              <p className="font-semibold text-sm text-medical-text">{info.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <h3 className="text-medical-text font-bold text-sm mb-4">AI Analysis</h3>
        {prediction ? (
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div className="text-center">
              <p className={`text-3xl font-extrabold ${PREDICTION_COLORS[prediction] ?? 'text-medical-text'}`}>
                {prediction}
              </p>
              <p className="text-medical-text/40 text-xs mt-1">Prediction</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-medical-accent">
                {confidence ? `${(confidence * 100).toFixed(1)}%` : '—'}
              </p>
              <p className="text-medical-text/40 text-xs mt-1">Confidence</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">No AI results yet</p>
            <p className="text-medical-text/25 text-xs mt-1">Upload a scan to run analysis</p>
          </div>
        )}
      </div>

      {/* Clinical Notes */}
      {caseData.notes && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
          <h3 className="text-medical-text/40 text-xs font-medium mb-2 uppercase tracking-wider">Clinical Notes</h3>
          <p className="text-medical-text/80 text-sm leading-relaxed">{caseData.notes as string}</p>
        </div>
      )}

      {/* Scans */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-medical-text font-bold text-sm">
            Scans {scans.length > 0 && <span className="text-medical-text/40 font-normal">({scans.length})</span>}
          </h3>
          <Link
            to="/scans"
            className="text-xs text-medical-primary font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Upload Scan
          </Link>
        </div>

        {scansLoading ? (
          <div className="flex justify-center py-8"><Spinner size="sm" /></div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-2">
              <ScanLine className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">No scans uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-medical-bg border border-medical-border rounded-lg overflow-hidden group"
              >
                <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
                  {scan.original_scan_url ? (
                    <img
                      src={scan.original_scan_url}
                      alt={`Scan ${scan.scan_view_type}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <ImageOff className="w-6 h-6 text-medical-text/20" strokeWidth={1.5} />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-medical-accent text-xs font-bold">{scan.scan_view_type}</p>
                  <p className="text-medical-text/30 text-xs">
                    {scan.laterality ?? '—'} · {scan.file_size_bytes ? `${(scan.file_size_bytes / 1024).toFixed(0)} KB` : '—'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
EOF
echo "CaseDetails.tsx written"
Output

CaseDetails.tsx written

Write ScanUpload.tsx
bash

cat > /home/claude/project/frontend_output/src/pages/ScanUpload.tsx << 'EOF'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, MousePointerClick, UploadCloud, ImageOff } from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { useScans } from '../hooks/useScans';
import Spinner from '../components/Spinner';
import Select from '../components/Select';

const VIEW_TYPES = [
  { value: 'RCC',  label: 'RCC',  desc: 'Right Cranio-Caudal'       },
  { value: 'LCC',  label: 'LCC',  desc: 'Left Cranio-Caudal'        },
  { value: 'RMLO', label: 'RMLO', desc: 'Right Mediolateral Oblique' },
  { value: 'LMLO', label: 'LMLO', desc: 'Left Mediolateral Oblique'  },
];

function ScanList({ caseId }: { caseId: string }) {
  const { scans, loading, uploading, uploadScan } = useScans(caseId);
  const [selectedView, setSelectedView] = useState('RCC');
  const [dragOver, setDragOver]         = useState(false);
  const [uploadError, setUploadError]   = useState('');

  const handleFile = async (file: File) => {
    setUploadError('');
    try {
      await uploadScan(file, selectedView);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-5">

      {/* View type selector */}
      <div>
        <p className="text-medical-text/60 text-sm font-medium mb-3">Select View Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VIEW_TYPES.map(v => (
            <button
              key={v.value}
              onClick={() => setSelectedView(v.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedView === v.value
                  ? 'border-medical-accent bg-(--color-medical-reviewed-soft) text-medical-accent'
                  : 'border-medical-border text-medical-text/50 hover:border-medical-accent/40'
              }`}
            >
              <p className="font-bold text-sm">{v.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone — bg-medical-bg gives depth contrast against the card surface */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          dragOver
            ? 'border-medical-accent bg-(--color-medical-reviewed-soft)'
            : 'border-medical-border bg-medical-bg hover:border-medical-accent/40'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-medical-text/60 text-sm">Uploading scan…</p>
          </div>
        ) : (
          <>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors ${
              dragOver ? 'bg-medical-accent text-white' : 'bg-medical-surface text-medical-text/30'
            }`}>
              <UploadCloud className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <p className="text-medical-text font-semibold text-sm mb-1">Drop scan here or click to browse</p>
            <p className="text-medical-text/30 text-xs">PNG, JPEG, DICOM — max 20 MB</p>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.dcm"
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-(--color-medical-malignant-soft) border border-medical-malignant/30 text-medical-malignant text-sm">
          {uploadError}
        </div>
      )}

      {/* Uploaded scans grid */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
      ) : scans.length > 0 ? (
        <div>
          <p className="text-medical-text/60 text-sm font-medium mb-3">Uploaded Scans ({scans.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-medical-bg border border-medical-border rounded-lg overflow-hidden group"
              >
                <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
                  {scan.original_scan_url ? (
                    <img
                      src={scan.original_scan_url}
                      alt={`Scan ${scan.scan_view_type}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <ImageOff className="w-6 h-6 text-medical-text/20" strokeWidth={1.5} />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-medical-accent text-xs font-bold">{scan.scan_view_type}</p>
                  <p className="text-medical-text/30 text-xs">
                    {scan.laterality ?? '—'} · {scan.file_size_bytes ? `${(scan.file_size_bytes / 1024).toFixed(0)} KB` : '—'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ScanUpload() {
  const { cases, loading } = useCases();
  const [selectedCase, setSelectedCase] = useState<string>('');

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-medical-accent text-white flex items-center justify-center shrink-0 shadow-sm">
          <ScanLine className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-medical-text">Scan Upload</h2>
          <p className="text-medical-text/40 text-sm mt-0.5">Upload mammogram scans for AI analysis</p>
        </div>
      </div>

      {/* Case selector */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
        <label className="block text-medical-text/70 text-sm font-medium mb-2">Select Case</label>
        {loading ? (
          <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
        ) : (
          <Select
            value={selectedCase}
            onChange={setSelectedCase}
            placeholder="— Choose a case —"
            options={cases.map(c => ({
              value: c.case_id,
              label: `${c.case_code}${c.patient_alias ? ` · ${c.patient_alias}` : ''}`,
            }))}
          />
        )}
      </div>

      {/* Upload area / placeholder */}
      <AnimatePresence mode="wait">
        {selectedCase ? (
          <motion.div
            key={selectedCase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-medical-surface border border-medical-border rounded-xl p-5"
          >
            <ScanList caseId={selectedCase} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center bg-medical-surface border border-medical-border rounded-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-3">
              <MousePointerClick className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">Select a case to upload scans</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
EOF
echo "ScanUpload.tsx written"
Output

ScanUpload.tsx written

Write AdminPanel.tsx
bash

cat > /home/claude/project/frontend_output/src/pages/AdminPanel.tsx << 'EOF'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, UserCheck, Stethoscope, ScanLine, X } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { ROLE_CONFIG, ACTIVE_STATUS_CLASSES } from '../lib/badges';
import Spinner from '../components/Spinner';

// Shared badge components — reused in desktop table and mobile cards.
function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg?.icon;
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium inline-flex items-center gap-1 ${cfg?.classes ?? ''}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {cfg?.label ?? role}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium ${active ? ACTIVE_STATUS_CLASSES.active : ACTIVE_STATUS_CLASSES.inactive}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function AdminPanel() {
  const { users, loading, error, createUser, deactivateUser } = useUsers();

  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ email: '', password: '', full_name: '', role: 'doctor', specialty: '' });
  const [creating, setCreating]       = useState(false);
  const [formError, setFormError]     = useState('');
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const totalDoctors      = users.filter(u => u.role === 'doctor').length;
  const totalRadiologists = users.filter(u => u.role === 'radiologist').length;
  const totalActive       = users.filter(u => u.is_active).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.email || !form.password || !form.full_name) { setFormError('All fields are required'); return; }
    setCreating(true);
    try {
      await createUser(form);
      setShowModal(false);
      setForm({ email: '', password: '', full_name: '', role: 'doctor', specialty: '' });
    } catch (err: unknown) {
      // createUser may throw an Axios-style error with a detail field from the server.
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(detail ?? 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (userId: string, userName: string) => {
    if (!confirm(`Deactivate ${userName}?`)) return;
    setDeactivating(userId);
    try { await deactivateUser(userId); }
    finally { setDeactivating(null); }
  };

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-medical-text">Admin Panel</h2>
          <p className="text-medical-text/40 text-sm mt-0.5">Manage clinician accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-medical-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> New User
        </button>
      </div>

      {/* Stats — solid-fill icon chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',  value: users.length,      icon: Users,       chip: 'bg-medical-accent'                         },
          { label: 'Active',       value: totalActive,       icon: UserCheck,   chip: 'bg-medical-normal'                         },
          { label: 'Doctors',      value: totalDoctors,      icon: Stethoscope, chip: 'bg-(--color-medical-role-doctor)'           },
          { label: 'Radiologists', value: totalRadiologists, icon: ScanLine,    chip: 'bg-(--color-medical-role-radiologist)'      },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-medical-surface border border-medical-border rounded-xl p-4 flex flex-col gap-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${stat.chip}`}>
                <stat.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-3xl font-bold tracking-tight text-medical-text">{stat.value}</p>
            </div>
            <p className="text-medical-text/50 text-xs font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-medical-surface border border-medical-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-medical-border">
          <h3 className="text-medical-text font-bold text-sm">Clinician Accounts</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-medical-malignant text-sm">{error}</div>
        ) : (
          <>
            {/* Desktop table — md and up */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-medical-border">
                    {['Name', 'Email', 'Role', 'Specialty', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-medical-text/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-medical-border/50 hover:bg-medical-border/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-medical-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-medical-primary text-xs font-bold uppercase">{user.full_name?.charAt(0)}</span>
                          </div>
                          <span className="text-medical-text font-medium">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-medical-text/60 text-xs">{user.email}</td>
                      <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3 text-medical-text/50 text-xs">{user.specialty ?? '—'}</td>
                      <td className="px-4 py-3"><ActiveBadge active={user.is_active} /></td>
                      <td className="px-4 py-3 text-medical-text/40 text-xs">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        {user.is_active && user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeactivate(user.id, user.full_name)}
                            disabled={deactivating === user.id}
                            className="text-xs text-medical-malignant/60 hover:text-medical-malignant transition-colors disabled:opacity-40"
                          >
                            {deactivating === user.id ? 'Deactivating…' : 'Deactivate'}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — below md */}
            <div className="md:hidden divide-y divide-medical-border/50">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-medical-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-medical-primary text-xs font-bold uppercase">{user.full_name?.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medical-text font-medium text-sm truncate">{user.full_name}</p>
                      <p className="text-medical-text/40 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <RoleBadge role={user.role} />
                    <ActiveBadge active={user.is_active} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-medical-text/40">
                    <span>{user.specialty ?? '—'}</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                  {user.is_active && user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeactivate(user.id, user.full_name)}
                      disabled={deactivating === user.id}
                      className="text-xs text-medical-malignant/60 hover:text-medical-malignant transition-colors disabled:opacity-40 mt-2"
                    >
                      {deactivating === user.id ? 'Deactivating…' : 'Deactivate'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-medical-surface border border-medical-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-medical-text font-bold text-base">Create New User</h3>
                <button onClick={() => setShowModal(false)} className="text-medical-text/40 hover:text-medical-text transition-colors" aria-label="Close">
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-(--color-medical-malignant-soft) border border-medical-malignant/30 text-medical-malignant text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                {[
                  { label: 'Full Name', field: 'full_name', type: 'text',     ph: 'Dr. Sarah Ahmed',    required: true  },
                  { label: 'Email',     field: 'email',     type: 'email',    ph: 'doctor@hospital.com', required: true  },
                  { label: 'Password',  field: 'password',  type: 'password', ph: 'Min 8 characters',    required: true  },
                  { label: 'Specialty', field: 'specialty', type: 'text',     ph: 'Radiology',           required: false },
                ].map(f => (
                  <div key={f.field}>
                    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">
                      {f.label} {f.required && <span className="text-medical-malignant">*</span>}
                    </label>
                    <input
                      type={f.type}
                      required={f.required}
                      placeholder={f.ph}
                      value={form[f.field as keyof typeof form]}
                      onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent transition-all"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="radiologist">Radiologist</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 p-2.5 rounded-lg border border-medical-border text-medical-text/60 text-sm hover:bg-medical-border/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={creating}
                    className="flex-1 p-2.5 rounded-lg bg-medical-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (<><Spinner size="sm" className="border-white" /> Creating…</>) : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
EOF
echo "AdminPanel.tsx written"
Output

AdminPanel.tsx written
Done
