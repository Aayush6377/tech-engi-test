"use client";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type Period = "weekly" | "monthly" | "yearly";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: "up" | "down";
  period?: Period;
  onPeriodChange?: (p: Period) => void;
}

const PERIODS: Period[] = ["weekly", "monthly", "yearly"];

export default function StatCard({ title, value, change, changeType, icon, period, onPeriodChange }: StatCardProps) {
  const isUp = changeType === "up";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-white p-5 border border-[var(--border)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-50 flex items-center justify-center text-gray-400 rounded-lg">
            {icon}
          </div>
          <span className="text-sm font-bold font-inter text-[var(--text-secondary)]">{title}</span>
        </div>

        {onPeriodChange && period ? (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1 text-[11px] font-semibold font-inter text-[var(--text-muted)] border border-[var(--border)] rounded-md px-2 py-1 hover:bg-gray-50 capitalize"
            >
              {period} <ChevronDown size={10} />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-md z-20 min-w-[90px]">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => { onPeriodChange(p); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-inter capitalize hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${p === period ? "text-[var(--primary)] font-bold" : "text-[var(--text-secondary)]"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button className="text-gray-300 hover:text-gray-500 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-end gap-3">
        <h2 className="text-3xl font-bold font-id text-[var(--text-primary)]">{value || "0"}</h2>
        {change && changeType && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 mb-0.5 border border-gray-200 rounded-lg ${isUp ? "text-green-500 bg-green-50/50" : "text-red-500 bg-red-50"}`}>
            {change}
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          </div>
        )}
      </div>
    </div>
  );
}
