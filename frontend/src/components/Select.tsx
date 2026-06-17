import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

/**
 * Custom select component replacing the native <select> element to allow
 * full theme-consistent styling. Uses bg-medical-surface so the trigger
 * has clear contrast against page backgrounds in both light and dark themes.
 */
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
        className="w-full px-3 py-2.5 rounded-lg border border-medical-border bg-medical-surface text-medical-text text-sm text-left flex items-center justify-between gap-2 outline-none transition-all hover:border-medical-accent/50 focus-visible:border-medical-accent focus-visible:ring-2 focus-visible:ring-medical-accent/30"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected?.label ?? placeholder ?? 'Select an option'}
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
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className="absolute z-30 mt-1.5 w-full bg-medical-surface border border-medical-border rounded-xl shadow-md overflow-hidden py-1 max-h-60 overflow-y-auto"
          >
            {options.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
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
