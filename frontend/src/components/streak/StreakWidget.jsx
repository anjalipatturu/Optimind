import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Shield, CheckCircle2, Circle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function StreakWidget() {
  const { streak } = useAppStore();

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f97316', '#eab308', '#6366f1', '#ec4899']
    });
  };

  useEffect(() => {
    if (streak.qualified_today) {
      // Fire celebration on day qualification
      triggerConfetti();
    }
  }, [streak.qualified_today]);

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 text-slate-900 dark:text-slate-100 space-y-3">
      {/* Top Banner: Flame + Freezes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
            <Flame className="w-4 h-4 fill-current animate-pulse" />
          </div>
          <div>
            <div className="text-base font-extrabold leading-none flex items-center gap-1.5">
              <span>{streak.current || 0}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Day Streak</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Longest: {streak.longest || 0} days
            </span>
          </div>
        </div>

        {/* Freezes badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-semibold" title="Streak freezes auto-protect missed days">
          <Shield className="w-3.5 h-3.5" />
          <span>{streak.freezes ?? 1}</span>
        </div>
      </div>

      {/* Progress towards 2 prompts today */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
        <span>Today's goal (2 prompts)</span>
        <span className="font-bold font-mono text-orange-500">
          {streak.today_prompts || 0} / 2
        </span>
      </div>

      {/* Weekly strip */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
        {daysOfWeek.map((day, idx) => {
          const isToday = idx === todayIdx;
          const isPast = idx < todayIdx;
          const isFilled = isToday ? streak.qualified_today : isPast;

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-semibold ${isToday ? 'text-orange-500 font-bold' : 'text-slate-400'}`}>
                {day}
              </span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isFilled
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                    : isToday
                    ? 'border-2 border-dashed border-orange-400 text-orange-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isFilled ? '✓' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

