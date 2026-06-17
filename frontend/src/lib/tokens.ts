/**
 * Design system tokens for MedGuard AI.
 * Colors reference CSS custom properties defined in index.css.
 * Spacing follows an 8pt base grid.
 * Typography scale provides Tailwind class strings for consistent text hierarchy.
 */

export const MEDICAL_TOKENS = {
  colors: {
    clinicalBlue:  '#0A4F8A',
    medicalTeal:   '#00828F',
    slateDark:     '#0F172A',
    slateLight:    '#F8FAFC',
    borderMuted:   '#E2E8F0',
    risk: {
      routine: '#94A3B8',
      low:     '#2563EB',
      high:    '#D97706',
      urgent:  '#DC2626',
    },
  },
  spacing: {
    base: 8,
    xs:   '4px',
    sm:   '8px',
    md:   '16px',
    lg:   '24px',
    xl:   '32px',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    scales: {
      heading:    'text-xl font-bold tracking-tight',
      subheading: 'text-base font-semibold tracking-normal',
      body:       'text-sm font-normal leading-relaxed',
      caption:    'text-xs font-medium uppercase tracking-wider text-medical-text/50',
    },
  },
} as const;
