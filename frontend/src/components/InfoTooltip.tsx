import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface InfoTooltipProps {
  text: string;
  children?: ReactNode;
}

/**
 * Small (i) icon that reveals `text` in a floating tooltip on hover/focus.
 * Used to keep dashboard headers/stat cards compact (title only) while
 * still surfacing the explanatory copy on demand, accessibly (keyboard
 * focus works via the button, not just mouse hover).
 */
export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        aria-label={text}
        className="text-medical-text/30 hover:text-medical-text/60 transition-colors focus:outline-none focus:text-medical-text/60"
      >
        <Info className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-medical-border bg-medical-bg px-3 py-2 text-[11px] leading-relaxed text-medical-text/80 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
