interface CircularGaugeProps {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  colorClass?: string; // tailwind stroke color class
  label?: string;
}

export default function CircularGauge({
  percent, size = 140, strokeWidth = 10, colorClass = 'stroke-medical-accent', label,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center} cy={center} r={radius}
          fill="none" strokeWidth={strokeWidth}
          className="stroke-medical-border"
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-medical-text">{Math.round(percent)}%</span>
        {label && <span className="text-[10px] text-medical-text/50 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
