import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

export default function LiveCoachChip() {
  const { inputDraft, liveScore, liveTip, liveAutopsy, setLiveCoach } = useAppStore();

  useEffect(() => {
    if (!inputDraft.trim()) {
      setLiveCoach(0, null, '', []);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.promptAutopsy(inputDraft);
        setLiveCoach(
          res.score,
          res.breakdown,
          res.tips[0] || 'Prompt looks solid!',
          res.autopsy_items || []
        );
      } catch {
        // Fallback local heuristic
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [inputDraft, setLiveCoach]);

  if (!inputDraft.trim() || liveScore === 0) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 55) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="flex flex-wrap items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80"
      >
        {/* Score pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold border ${getScoreColor(liveScore)}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{liveScore}/100</span>
        </div>

        {/* Actionable tip */}
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="truncate max-w-xs md:max-w-md">{liveTip}</span>
        </div>

        {/* Prompt Autopsy weakness alerts */}
        {liveAutopsy.length > 0 && (
          <div className="flex items-center gap-1 ml-auto text-amber-500 font-medium cursor-help" title={liveAutopsy.map(a => a.message).join('\n')}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{liveAutopsy.length} refinement hint{liveAutopsy.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

