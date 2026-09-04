import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  value: number | null;
  suffix?: string;
  delay?: number;
}

export function ScoreBar({ label, value, suffix = "", delay = 0 }: ScoreBarProps) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const startTimeout = setTimeout(() => {
      let raf: number;
      const start = performance.now();
      const duration = 800;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setDisplay(Math.round(value * progress));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, delay * 1000);
    return () => clearTimeout(startTimeout);
  }, [value, delay]);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <span className="font-mono text-sm font-semibold text-ink">
          {value == null ? "—" : `${display}${suffix}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-moss-light">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-moss to-moss-dark"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
