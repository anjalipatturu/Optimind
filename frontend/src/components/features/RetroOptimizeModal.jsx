import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, ArrowUpRight, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

export default function RetroOptimizeModal() {
  const { retroModalOpen, setRetroModalOpen, createNewChat, setInputDraft, setOptimizerModalOpen } = useAppStore();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (retroModalOpen) {
      loadRetro();
    }
  }, [retroModalOpen]);

  const loadRetro = async () => {
    setLoading(true);
    try {
      const res = await api.getRetroOptimizations();
      setCandidates(res);
    } catch (err) {
      console.error("Failed to load retro candidates", err);
    } finally {
      setLoading(false);
    }
  };

  if (!retroModalOpen) return null;

  const handleUpgradePrompt = async (item) => {
    try {
      const optRes = await api.optimizePrompt({ prompt: item.original });
      setRetroModalOpen(false);
      await createNewChat("Upgraded Chat");
      setOptimizerModalOpen(true, optRes);
    } catch (err) {
      console.error("Upgrade failed", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Retro-Optimize Past Prompts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We scanned your past prompts for low-scoring drafts that can be supercharged
                </p>
              </div>
            </div>

            <button
              onClick={() => setRetroModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-medium">Scanning conversation history...</span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300">High Quality Prompts Detected!</h3>
                <p className="text-xs">No low-scoring prompts found in your recent history. You're prompting like a pro!</p>
              </div>
            ) : (
              candidates.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        Score: {item.score_before}
                      </span>
                      <span className="text-slate-400 text-xs">→</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Target: ~{item.score_estimated} (+{item.potential_gain} pts)
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpgradePrompt(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Optimize & Re-run
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-sans italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    "{item.original}"
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

